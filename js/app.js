// ============================================================
// app.js — Bootstrap, wiring, keyboard shortcuts
// ============================================================

const App = (() => {
  function init() {
    setupYearPicker();
    setupToolbar();
    setupKeyboard();
    Sheets.initSettingsModal();

    // Subscribe to state changes
    Model.subscribe((actionType) => {
      Timeline.render();
      Categories.renderSidebar();
      DayCounter.renderSidebar();
      DayCounter.renderStatusBar();
      Undo.updateButtons();
    });

    // Initialize Google APIs when available
    if (typeof gapi !== 'undefined') {
      Sheets.initGapi().then(() => Sheets.initGis());
    }
  }

  function setupYearPicker() {
    const overlay = document.getElementById('year-picker-overlay');
    const select = document.getElementById('start-year-select');
    const preview = document.getElementById('year-preview');
    const confirmBtn = document.getElementById('year-picker-confirm');

    // Populate year options (current year -2 to +5)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 5; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear) opt.selected = true;
      select.appendChild(opt);
    }

    function updatePreview() {
      const y = parseInt(select.value);
      preview.textContent = `${y}\u2013${y + 1} School Year (August ${y} \u2013 June ${y + 1})`;
    }
    updatePreview();
    select.addEventListener('change', updatePreview);

    confirmBtn.addEventListener('click', () => {
      const startYear = parseInt(select.value);
      Model.setSchoolYear(startYear);

      Utils.hide(overlay);
      Utils.show(document.getElementById('app'));

      // Update toolbar year label
      document.getElementById('toolbar-year-label').textContent =
        `${startYear}\u2013${startYear + 1}`;

      // Initialize components
      Timeline.init();
      Interactions.init();

      // Offer template picker
      Templates.showTemplatePicker();
    });
  }

  function setupToolbar() {
    // Undo/Redo
    document.getElementById('btn-undo').addEventListener('click', () => {
      Undo.undo();
      // Manually notify since undo bypasses dispatch
      Timeline.render();
      Categories.renderSidebar();
      DayCounter.renderSidebar();
      DayCounter.renderStatusBar();
    });

    document.getElementById('btn-redo').addEventListener('click', () => {
      Undo.redo();
      Timeline.render();
      Categories.renderSidebar();
      DayCounter.renderSidebar();
      DayCounter.renderStatusBar();
    });

    // Templates
    document.getElementById('btn-template').addEventListener('click', () => {
      Templates.showTemplatePicker();
    });

    // Import
    document.getElementById('btn-import').addEventListener('click', () => {
      Import.showImportModal();
    });

    // Google Sign In
    document.getElementById('btn-sign-in').addEventListener('click', () => {
      Sheets.signIn();
    });

    // Google Sheets
    document.getElementById('btn-save-sheet').addEventListener('click', () => {
      Sheets.saveToSheet();
    });

    document.getElementById('btn-load-sheet').addEventListener('click', () => {
      Sheets.loadFromSheet();
    });

    // PDF dropdown
    const pdfBtn = document.getElementById('btn-export-pdf');
    const pdfDropdown = document.getElementById('pdf-dropdown');

    pdfBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pdfDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      pdfDropdown.classList.remove('show');
    });

    document.getElementById('btn-pdf-wall').addEventListener('click', () => {
      PDF.exportWallCalendar();
    });

    document.getElementById('btn-pdf-table').addEventListener('click', () => {
      PDF.exportTableCalendar();
    });

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
      Sheets.showSettings();
    });

    // Add Category
    document.getElementById('btn-add-category').addEventListener('click', () => {
      Categories.showAddModal();
    });
  }

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Ignore when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        Undo.undo();
        Timeline.render();
        Categories.renderSidebar();
        DayCounter.renderSidebar();
        DayCounter.renderStatusBar();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        Undo.redo();
        Timeline.render();
        Categories.renderSidebar();
        DayCounter.renderSidebar();
        DayCounter.renderStatusBar();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        Undo.redo();
        Timeline.render();
        Categories.renderSidebar();
        DayCounter.renderSidebar();
        DayCounter.renderStatusBar();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        Sheets.saveToSheet();
      }
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
