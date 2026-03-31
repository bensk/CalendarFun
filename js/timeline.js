// ============================================================
// timeline.js — Timeline/Gantt grid rendering engine
// ============================================================

const Timeline = (() => {
  const COL_WIDTH = 34;
  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 26;
  const DATE_HEADER_HEIGHT = 34;
  const MONTH_LABEL_WIDTH = 140;

  let container = null;

  function init() {
    container = document.getElementById('timeline-container');
  }

  function render() {
    if (!container) init();
    if (!container) return;

    const state = Model.getState();
    const colData = Model.getColumnData();

    if (!state.schoolYear.startYear || state.categories.length === 0) {
      container.innerHTML = `
        <div class="timeline-empty">
          <p>${!state.schoolYear.startYear ? 'Choose a school year to get started.' : 'Add a category to start building your calendar.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';

    const months = Utils.getSchoolMonths(state.schoolYear.startYear);
    const totalCols = colData.totalColumns;

    // Build month column ranges
    const monthRanges = [];
    for (const m of months) {
      const weekdays = Utils.getWeekdaysInMonth(m.year, m.month);
      if (weekdays.length === 0) continue;
      const firstCol = colData.map[weekdays[0]];
      const lastCol = colData.map[weekdays[weekdays.length - 1]];
      monthRanges.push({
        ...m,
        firstCol,
        lastCol,
        weekdays,
        colCount: lastCol - firstCol + 1
      });
    }

    // Create the grid wrapper
    const gridWidth = MONTH_LABEL_WIDTH + totalCols * COL_WIDTH;
    const numCatRows = state.categories.length;
    const gridHeight = HEADER_HEIGHT + DATE_HEADER_HEIGHT + numCatRows * ROW_HEIGHT;

    const grid = Utils.el('div', {
      className: 'timeline-grid',
      style: {
        width: gridWidth + 'px',
        minHeight: gridHeight + 'px',
        position: 'relative'
      }
    });

    // === Month header row ===
    const monthHeaderRow = Utils.el('div', {
      className: 'timeline-row timeline-month-header',
      style: { height: HEADER_HEIGHT + 'px' }
    });

    // Empty label cell
    monthHeaderRow.appendChild(Utils.el('div', {
      className: 'timeline-label-cell',
      style: { width: MONTH_LABEL_WIDTH + 'px', height: HEADER_HEIGHT + 'px' }
    }));

    for (const mr of monthRanges) {
      const left = MONTH_LABEL_WIDTH + (mr.firstCol - 1) * COL_WIDTH;
      const width = mr.colCount * COL_WIDTH;
      monthHeaderRow.appendChild(Utils.el('div', {
        className: 'month-header-cell',
        textContent: mr.abbrev,
        style: {
          position: 'absolute',
          left: left + 'px',
          width: width + 'px',
          height: HEADER_HEIGHT + 'px',
          lineHeight: HEADER_HEIGHT + 'px'
        }
      }));
    }
    grid.appendChild(monthHeaderRow);

    // === Date sub-header row ===
    const dateHeaderRow = Utils.el('div', {
      className: 'timeline-row timeline-date-header',
      style: { height: DATE_HEADER_HEIGHT + 'px', top: HEADER_HEIGHT + 'px' }
    });

    dateHeaderRow.appendChild(Utils.el('div', {
      className: 'timeline-label-cell',
      style: { width: MONTH_LABEL_WIDTH + 'px', height: DATE_HEADER_HEIGHT + 'px' }
    }));

    for (let col = 1; col <= totalCols; col++) {
      const iso = colData.reverseMap[col];
      const d = Utils.fromISO(iso);
      const dayLetter = Utils.DAY_ABBREV[d.getDay()];
      const dow = d.getDay(); // 1=Mon...5=Fri
      const isMonday = dow === 1;
      const isFriday = dow === 5;
      const left = MONTH_LABEL_WIDTH + (col - 1) * COL_WIDTH;

      const cellClass = 'date-header-cell'
        + (isMonday ? ' date-monday' : '')
        + (isFriday ? ' date-friday' : '');

      const cell = Utils.el('div', {
        className: cellClass,
        title: `${dayLetter} ${Utils.MONTH_ABBREV[d.getMonth()]} ${d.getDate()}`,
        style: {
          position: 'absolute',
          left: left + 'px',
          width: COL_WIDTH + 'px',
          height: DATE_HEADER_HEIGHT + 'px'
        }
      }, [
        Utils.el('span', { className: 'date-day-abbrev', textContent: dayLetter }),
        Utils.el('span', { className: 'date-day-num', textContent: d.getDate() })
      ]);

      dateHeaderRow.appendChild(cell);
    }
    grid.appendChild(dateHeaderRow);

    // === Category swim-lane rows ===
    const rowsTop = HEADER_HEIGHT + DATE_HEADER_HEIGHT;

    state.categories.forEach((cat, catIndex) => {
      const rowY = rowsTop + catIndex * ROW_HEIGHT;

      // Row background
      const row = Utils.el('div', {
        className: 'timeline-row timeline-category-row',
        'data-category-id': cat.id,
        style: {
          top: rowY + 'px',
          height: ROW_HEIGHT + 'px'
        }
      });

      // Category label
      row.appendChild(Utils.el('div', {
        className: 'timeline-label-cell category-label',
        textContent: cat.name,
        title: cat.name,
        style: {
          width: MONTH_LABEL_WIDTH + 'px',
          height: ROW_HEIGHT + 'px',
          lineHeight: ROW_HEIGHT + 'px',
          borderLeft: `4px solid ${cat.color}`
        }
      }));

      // Day cells (for click/drag targets)
      for (let col = 1; col <= totalCols; col++) {
        const left = MONTH_LABEL_WIDTH + (col - 1) * COL_WIDTH;
        const iso = colData.reverseMap[col];
        const d = Utils.fromISO(iso);
        const dow = d.getDay();
        const isMonday = dow === 1;
        const isFriday = dow === 5;

        row.appendChild(Utils.el('div', {
          className: 'day-cell' + (isMonday ? ' week-start' : '') + (isFriday ? ' week-end' : ''),
          'data-date': iso,
          'data-col': col,
          'data-category-id': cat.id,
          style: {
            position: 'absolute',
            left: left + 'px',
            width: COL_WIDTH + 'px',
            height: ROW_HEIGHT + 'px'
          }
        }));
      }

      grid.appendChild(row);
    });

    // === Month separator lines ===
    for (const mr of monthRanges) {
      const left = MONTH_LABEL_WIDTH + (mr.firstCol - 1) * COL_WIDTH;
      grid.appendChild(Utils.el('div', {
        className: 'month-separator',
        style: {
          position: 'absolute',
          left: left + 'px',
          top: '0',
          width: '1px',
          height: gridHeight + 'px'
        }
      }));
    }

    // === Event bars ===
    renderEventBars(grid, state, colData, rowsTop);

    container.appendChild(grid);
  }

  function renderEventBars(grid, state, colData, rowsTop) {
    // Group events by category for overlap detection
    for (let catIndex = 0; catIndex < state.categories.length; catIndex++) {
      const cat = state.categories[catIndex];
      const events = Model.getEventsForCategory(cat.id);
      const rowY = rowsTop + catIndex * ROW_HEIGHT;

      // Sort events by start date
      events.sort((a, b) => a.startDate.localeCompare(b.startDate));

      // Simple overlap stacking: assign lanes
      const lanes = [];
      for (const evt of events) {
        const startCol = colData.map[evt.startDate];
        const endCol = colData.map[evt.endDate];
        if (!startCol || !endCol) continue;

        // Find a lane that's free
        let lane = 0;
        for (let l = 0; l < lanes.length; l++) {
          if (lanes[l] < startCol) { lane = l; break; }
          lane = l + 1;
        }
        lanes[lane] = endCol;

        const left = MONTH_LABEL_WIDTH + (startCol - 1) * COL_WIDTH;
        const width = (endCol - startCol + 1) * COL_WIDTH;
        const barHeight = lane > 0 ? 14 : ROW_HEIGHT - 6;
        const barTop = rowY + 3 + (lane > 0 ? 16 + (lane - 1) * 16 : 0);

        const bar = Utils.el('div', {
          className: 'event-bar',
          'data-event-id': evt.id,
          'data-category-id': cat.id,
          title: `${evt.name}\n${Utils.formatDateRange(evt.startDate, evt.endDate)}`,
          style: {
            position: 'absolute',
            left: left + 'px',
            top: barTop + 'px',
            width: width + 'px',
            height: barHeight + 'px',
            backgroundColor: cat.color,
            color: Utils.contrastColor(cat.color),
            zIndex: 10
          }
        });

        // Event name text
        bar.appendChild(Utils.el('span', {
          className: 'event-bar-text',
          textContent: evt.name
        }));

        // Resize handles
        bar.appendChild(Utils.el('div', {
          className: 'resize-handle resize-left',
          'data-event-id': evt.id,
          'data-handle': 'left'
        }));
        bar.appendChild(Utils.el('div', {
          className: 'resize-handle resize-right',
          'data-event-id': evt.id,
          'data-handle': 'right'
        }));

        grid.appendChild(bar);
      }
    }
  }

  function getColFromX(x) {
    const col = Math.floor((x - MONTH_LABEL_WIDTH) / COL_WIDTH) + 1;
    const colData = Model.getColumnData();
    return Math.max(1, Math.min(col, colData.totalColumns));
  }

  function getCategoryFromY(y) {
    const state = Model.getState();
    const rowsTop = HEADER_HEIGHT + DATE_HEADER_HEIGHT;
    const catIndex = Math.floor((y - rowsTop) / ROW_HEIGHT);
    if (catIndex >= 0 && catIndex < state.categories.length) {
      return state.categories[catIndex];
    }
    return null;
  }

  function getDateFromCol(col) {
    return Model.getColumnData().reverseMap[col] || null;
  }

  return {
    init, render, getColFromX, getCategoryFromY, getDateFromCol,
    COL_WIDTH, ROW_HEIGHT, HEADER_HEIGHT, DATE_HEADER_HEIGHT, MONTH_LABEL_WIDTH
  };
})();
