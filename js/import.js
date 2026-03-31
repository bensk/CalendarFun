// ============================================================
// import.js — CSV import
// ============================================================

const Import = (() => {
  function showImportModal() {
    const overlay = document.getElementById('import-overlay');
    const fileInput = document.getElementById('import-file');
    const confirmBtn = document.getElementById('import-confirm');
    const cancelBtn = document.getElementById('import-cancel');

    fileInput.value = '';
    Utils.show(overlay);

    function onConfirm() {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        parseCSV(e.target.result);
        cleanup();
      };
      reader.readAsText(file);
    }

    function onCancel() { cleanup(); }

    function cleanup() {
      Utils.hide(overlay);
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
  }

  function parseCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return;

    // Expect header: Event Name, Category, Start Date, End Date, Tag
    const header = parseCSVLine(lines[0]);
    const state = Model.getState();

    // Build category map from existing categories
    const catMap = {};
    for (const cat of state.categories) {
      catMap[cat.name.toLowerCase()] = cat.id;
    }

    const events = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 3) continue;

      const name = cols[0];
      const categoryName = cols[1] || 'Imported';
      const startDate = cols[2];
      const endDate = cols[3] || startDate;
      const tag = cols[4] || 'other';

      // Auto-create category if needed
      let categoryId = catMap[categoryName.toLowerCase()];
      if (!categoryId) {
        categoryId = Utils.uid('cat');
        catMap[categoryName.toLowerCase()] = categoryId;
        Model.dispatch({
          type: 'ADD_CATEGORY',
          id: categoryId,
          name: categoryName,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        });
      }

      events.push({ name, categoryId, startDate, endDate, tag });
    }

    // Add all events
    for (const evt of events) {
      Model.dispatch({
        type: 'ADD_EVENT',
        name: evt.name,
        categoryId: evt.categoryId,
        startDate: evt.startDate,
        endDate: evt.endDate,
        tags: [evt.tag]
      });
    }
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  return { showImportModal };
})();
