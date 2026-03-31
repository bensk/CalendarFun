// ============================================================
// sheets.js — Google Sheets API: OAuth, read, write, format
// ============================================================

const Sheets = (() => {
  let tokenClient = null;
  let gapiInited = false;
  let gisInited = false;
  let accessToken = null;

  function getSheetId() {
    return localStorage.getItem('gcal_sheet_id') || '';
  }

  function saveSheetId(sheetId) {
    if (sheetId) localStorage.setItem('gcal_sheet_id', sheetId);
  }

  async function initGapi() {
    return new Promise((resolve) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: Config.API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          gapiInited = true;
          resolve(true);
        } catch (e) {
          console.error('GAPI init failed:', e);
          resolve(false);
        }
      });
    });
  }

  function initGis() {
    try {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: Config.CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (resp) => {
          if (resp.error) {
            console.error('Token error:', resp);
            return;
          }
          accessToken = resp.access_token;
          updateUI(true);
        },
      });
      gisInited = true;
      return true;
    } catch (e) {
      console.error('GIS init failed:', e);
      return false;
    }
  }

  function signIn() {
    if (!gapiInited || !gisInited) {
      initGapi().then(() => {
        initGis();
        if (tokenClient) tokenClient.requestAccessToken();
      });
    } else if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  }

  function isSignedIn() {
    return !!accessToken;
  }

  function updateUI(signedIn) {
    const signInBtn = document.getElementById('btn-sign-in');
    const saveBtn = document.getElementById('btn-save-sheet');
    const loadBtn = document.getElementById('btn-load-sheet');
    if (signInBtn) {
      signInBtn.textContent = signedIn ? 'Signed In' : 'Sign in with Google';
      signInBtn.disabled = signedIn;
    }
    if (saveBtn) saveBtn.disabled = !signedIn;
    if (loadBtn) loadBtn.disabled = !signedIn;
  }

  // === WRITE TO SHEET ===
  async function saveToSheet() {
    const sheetId = getSheetId();
    if (!sheetId) {
      showSettings();
      return;
    }
    if (!accessToken) {
      signIn();
      return;
    }

    const state = Model.getState();
    const colData = Model.getColumnData();
    const dayData = DayCounter.compute();

    try {
      updateStatus('Saving to Google Sheets...');

      // Build the sheet data
      const { values, mergeRequests, formatRequests } = buildSheetData(state, colData, dayData);

      const sheetName = state.settings.sheetName || 'Calendar';

      // Clear existing content and formatting
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          requests: [{
            updateCells: {
              range: { sheetId: 0 },
              fields: 'userEnteredValue,userEnteredFormat'
            }
          }]
        }
      });

      // Unmerge all existing cells
      try {
        const sheetData = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const sheet = sheetData.result.sheets[0];
        if (sheet.merges && sheet.merges.length > 0) {
          await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: sheetId,
            resource: {
              requests: sheet.merges.map(m => ({ unmergeCells: { range: m } }))
            }
          });
        }
      } catch (e) { /* ignore if no merges */ }

      // Write values
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values }
      });

      // Apply formatting (merges, colors, widths)
      if (mergeRequests.length > 0 || formatRequests.length > 0) {
        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          resource: { requests: [...mergeRequests, ...formatRequests] }
        });
      }

      // Store state as developer metadata for round-trip fidelity
      try {
        const metaPayload = JSON.stringify({
          schoolYear: state.schoolYear,
          categories: state.categories,
          events: state.events,
          settings: state.settings
        });

        // Delete existing metadata first
        const existing = await gapi.client.sheets.spreadsheets.get({
          spreadsheetId: sheetId,
          fields: 'developerMetadata'
        });

        const deleteReqs = (existing.result.developerMetadata || [])
          .filter(m => m.metadataKey === 'calendarState')
          .map(m => ({ deleteDeveloperMetadata: { dataFilter: { developerMetadataLookup: { metadataId: m.metadataId } } } }));

        const createReq = {
          createDeveloperMetadata: {
            developerMetadata: {
              metadataKey: 'calendarState',
              metadataValue: metaPayload,
              location: { spreadsheet: true },
              visibility: 'PROJECT'
            }
          }
        };

        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          resource: { requests: [...deleteReqs, createReq] }
        });
      } catch (e) {
        console.warn('Could not save metadata:', e);
      }

      updateStatus('Saved to Google Sheets!');
      setTimeout(() => updateStatus(''), 3000);

    } catch (e) {
      console.error('Save failed:', e);
      updateStatus('Save failed: ' + (e.result?.error?.message || e.message));
    }
  }

  // === READ FROM SHEET ===
  async function loadFromSheet() {
    const sheetId = getSheetId();
    if (!sheetId) {
      showSettings();
      return;
    }
    if (!accessToken) {
      signIn();
      return;
    }

    try {
      updateStatus('Loading from Google Sheets...');

      // Try loading from developer metadata first
      const metaResp = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: 'developerMetadata'
      });

      const meta = (metaResp.result.developerMetadata || [])
        .find(m => m.metadataKey === 'calendarState');

      if (meta && meta.metadataValue) {
        const parsed = JSON.parse(meta.metadataValue);
        Model.dispatch({ type: 'LOAD_STATE', state: parsed });
        Undo.clear();
        updateStatus('Loaded from Google Sheets!');
        setTimeout(() => updateStatus(''), 3000);
        return;
      }

      // Fallback: parse the visual sheet
      updateStatus('No metadata found, parsing sheet visually...');
      // TODO: implement visual sheet parsing as fallback
      updateStatus('Could not find calendar data in sheet. Save from this app first.');
      setTimeout(() => updateStatus(''), 5000);

    } catch (e) {
      console.error('Load failed:', e);
      updateStatus('Load failed: ' + (e.result?.error?.message || e.message));
    }
  }

  // === BUILD SHEET DATA ===
  function buildSheetData(state, colData, dayData) {
    const months = Utils.getSchoolMonths(state.schoolYear.startYear);
    const values = [];
    const mergeRequests = [];
    const formatRequests = [];

    // Determine max columns needed per month (max weekdays in any month)
    // We'll use a flat layout: each month gets its own row group
    // Columns: A = label, then one column per weekday in the month, last col = day count

    // First, find the max weekdays across all months
    const monthData = months.map(m => {
      const weekdays = Utils.getWeekdaysInMonth(m.year, m.month);
      return { ...m, weekdays };
    });

    const maxWeekdays = Math.max(...monthData.map(md => md.weekdays.length));
    const daysColIndex = maxWeekdays + 1; // After all day columns
    const totalCols = daysColIndex + 1;

    // Title row
    const titleRow = new Array(totalCols).fill('');
    titleRow[0] = `School Calendar ${state.schoolYear.startYear}\u2013${state.schoolYear.endYear}`;
    titleRow[daysColIndex] = 'Days';
    values.push(titleRow);

    // Format title row
    formatRequests.push({
      repeatCell: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: totalCols },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 14 },
            backgroundColor: { red: 0.2, green: 0.2, blue: 0.3 },
            textFormat: { bold: true, fontSize: 14, foregroundColor: { red: 1, green: 1, blue: 1 } }
          }
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor)'
      }
    });

    let currentRow = 1;

    for (const md of monthData) {
      if (md.weekdays.length === 0) continue;

      const monthStartRow = currentRow;

      // Month header row: month name + day numbers
      const headerRow = new Array(totalCols).fill('');
      headerRow[0] = md.name;

      for (let i = 0; i < md.weekdays.length; i++) {
        const d = Utils.fromISO(md.weekdays[i]);
        headerRow[i + 1] = d.getDate();
      }

      // Day count for this month
      if (dayData && dayData.monthCounts[md.name]) {
        headerRow[daysColIndex] = dayData.monthCounts[md.name].instructional;
      }

      values.push(headerRow);

      // Format month header row
      formatRequests.push({
        repeatCell: {
          range: { sheetId: 0, startRowIndex: currentRow, endRowIndex: currentRow + 1, startColumnIndex: 0, endColumnIndex: totalCols },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, fontSize: 10 },
              backgroundColor: { red: 0.85, green: 0.85, blue: 0.9 }
            }
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor)'
        }
      });

      currentRow++;

      // Category sub-rows
      for (const cat of state.categories) {
        const catRow = new Array(totalCols).fill('');
        catRow[0] = cat.name;

        // Place events in this category for this month
        const catEvents = state.events.filter(e => e.categoryId === cat.id);

        for (const evt of catEvents) {
          // Find which weekday columns this event covers in this month
          for (let i = 0; i < md.weekdays.length; i++) {
            const dayISO = md.weekdays[i];
            if (dayISO >= evt.startDate && dayISO <= evt.endDate) {
              // Place event name in the first matching cell
              if (catRow[i + 1] === '') {
                catRow[i + 1] = evt.name;
              }
            }
          }

          // Find the span for merge requests
          const startIdx = md.weekdays.findIndex(d => d >= evt.startDate && d <= evt.endDate);
          const endIdx = md.weekdays.length - 1 - [...md.weekdays].reverse().findIndex(d => d >= evt.startDate && d <= evt.endDate);

          if (startIdx !== -1 && endIdx >= startIdx && endIdx - startIdx > 0) {
            // Clear cells after the first (they'll be merged)
            for (let i = startIdx + 1; i <= endIdx; i++) {
              catRow[i + 1] = '';
            }

            mergeRequests.push({
              mergeCells: {
                range: {
                  sheetId: 0,
                  startRowIndex: currentRow,
                  endRowIndex: currentRow + 1,
                  startColumnIndex: startIdx + 1,
                  endColumnIndex: endIdx + 2
                },
                mergeType: 'MERGE_ALL'
              }
            });
          }
        }

        values.push(catRow);

        // Color the category row
        const rgb = hexToSheetColor(cat.color);
        formatRequests.push({
          repeatCell: {
            range: { sheetId: 0, startRowIndex: currentRow, endRowIndex: currentRow + 1, startColumnIndex: 0, endColumnIndex: 1 },
            cell: {
              userEnteredFormat: {
                backgroundColor: rgb,
                textFormat: {
                  bold: true,
                  foregroundColor: isLightColor(rgb) ? { red: 0, green: 0, blue: 0 } : { red: 1, green: 1, blue: 1 }
                }
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)'
          }
        });

        // Light tint for the row
        const tint = { red: rgb.red * 0.3 + 0.7, green: rgb.green * 0.3 + 0.7, blue: rgb.blue * 0.3 + 0.7 };
        formatRequests.push({
          repeatCell: {
            range: { sheetId: 0, startRowIndex: currentRow, endRowIndex: currentRow + 1, startColumnIndex: 1, endColumnIndex: totalCols },
            cell: {
              userEnteredFormat: { backgroundColor: tint }
            },
            fields: 'userEnteredFormat(backgroundColor)'
          }
        });

        currentRow++;
      }

      // Empty separator row
      values.push(new Array(totalCols).fill(''));
      currentRow++;
    }

    // Total row
    const totalRow = new Array(totalCols).fill('');
    totalRow[0] = 'TOTAL';
    if (dayData) {
      totalRow[daysColIndex] = dayData.counts.instructional;
    }
    values.push(totalRow);

    formatRequests.push({
      repeatCell: {
        range: { sheetId: 0, startRowIndex: currentRow, endRowIndex: currentRow + 1, startColumnIndex: 0, endColumnIndex: totalCols },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 12 },
            backgroundColor: { red: 0.2, green: 0.2, blue: 0.3 },
            textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 1, green: 1, blue: 1 } }
          }
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor)'
      }
    });

    // Set column widths
    formatRequests.push({
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 120 },
        fields: 'pixelSize'
      }
    });

    for (let i = 1; i <= maxWeekdays; i++) {
      formatRequests.push({
        updateDimensionProperties: {
          range: { sheetId: 0, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 },
          properties: { pixelSize: 30 },
          fields: 'pixelSize'
        }
      });
    }

    formatRequests.push({
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: daysColIndex, endIndex: daysColIndex + 1 },
        properties: { pixelSize: 50 },
        fields: 'pixelSize'
      }
    });

    return { values, mergeRequests, formatRequests };
  }

  function hexToSheetColor(hex) {
    hex = hex.replace('#', '');
    return {
      red: parseInt(hex.slice(0, 2), 16) / 255,
      green: parseInt(hex.slice(2, 4), 16) / 255,
      blue: parseInt(hex.slice(4, 6), 16) / 255
    };
  }

  function isLightColor(rgb) {
    return (0.299 * rgb.red + 0.587 * rgb.green + 0.114 * rgb.blue) > 0.5;
  }

  function updateStatus(msg) {
    const info = document.getElementById('status-info');
    if (info) info.textContent = msg;
  }

  function showSettings() {
    const overlay = document.getElementById('settings-overlay');
    document.getElementById('settings-sheet-id').value = getSheetId();
    Utils.show(overlay);
  }

  function initSettingsModal() {
    const overlay = document.getElementById('settings-overlay');
    document.getElementById('settings-save').addEventListener('click', () => {
      const sheetId = document.getElementById('settings-sheet-id').value.trim();
      saveSheetId(sheetId);
      Model.getState().settings.sheetId = sheetId;
      Utils.hide(overlay);
    });
    document.getElementById('settings-cancel').addEventListener('click', () => Utils.hide(overlay));
  }

  return {
    initGapi, initGis, signIn, isSignedIn,
    saveToSheet, loadFromSheet,
    showSettings, initSettingsModal, getSheetId
  };
})();
