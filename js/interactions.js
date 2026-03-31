// ============================================================
// interactions.js — Drag-to-create, drag-to-move, resize
// ============================================================

const Interactions = (() => {
  let mode = 'IDLE'; // IDLE | CREATING | MOVING | RESIZING
  let dragState = null;
  let previewBar = null;
  let wrapper = null;

  function init() {
    wrapper = document.getElementById('timeline-wrapper');
    if (!wrapper) return;

    wrapper.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    wrapper.addEventListener('dblclick', onDblClick);
  }

  function onMouseDown(e) {
    if (mode !== 'IDLE') return;
    const container = document.getElementById('timeline-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.parentElement.scrollLeft;
    const y = e.clientY - rect.top + container.parentElement.scrollTop;

    // Check if clicking a resize handle
    const handle = e.target.closest('.resize-handle');
    if (handle) {
      e.preventDefault();
      startResize(handle, x, y);
      return;
    }

    // Check if clicking an event bar
    const bar = e.target.closest('.event-bar');
    if (bar) {
      e.preventDefault();
      startMove(bar, x, y);
      return;
    }

    // Check if clicking a day cell (start creating)
    const cell = e.target.closest('.day-cell');
    if (cell) {
      e.preventDefault();
      startCreate(cell, x, y);
      return;
    }
  }

  function onMouseMove(e) {
    if (mode === 'IDLE') return;
    e.preventDefault();

    const container = document.getElementById('timeline-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.parentElement.scrollLeft;
    const y = e.clientY - rect.top + container.parentElement.scrollTop;

    switch (mode) {
      case 'CREATING': updateCreate(x, y); break;
      case 'MOVING': updateMove(x, y); break;
      case 'RESIZING': updateResize(x, y); break;
    }
  }

  function onMouseUp(e) {
    if (mode === 'IDLE') return;

    const container = document.getElementById('timeline-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.parentElement.scrollLeft;
    const y = e.clientY - rect.top + container.parentElement.scrollTop;

    switch (mode) {
      case 'CREATING': finishCreate(x, y); break;
      case 'MOVING': finishMove(x, y); break;
      case 'RESIZING': finishResize(x, y); break;
    }

    removePreview();
    mode = 'IDLE';
    dragState = null;
  }

  // === CREATE ===
  function startCreate(cell, x, y) {
    const col = parseInt(cell.dataset.col);
    const categoryId = cell.dataset.categoryId;
    if (!categoryId) return;

    mode = 'CREATING';
    dragState = {
      startCol: col,
      currentCol: col,
      categoryId,
      startX: x
    };
    showPreview(col, col, categoryId);
  }

  function updateCreate(x, y) {
    const col = Timeline.getColFromX(x);
    dragState.currentCol = col;
    const minCol = Math.min(dragState.startCol, col);
    const maxCol = Math.max(dragState.startCol, col);
    showPreview(minCol, maxCol, dragState.categoryId);
  }

  function finishCreate(x, y) {
    // Use currentCol from drag tracking (more reliable than re-computing from mouseup x)
    const col = dragState.currentCol || dragState.startCol;
    const minCol = Math.min(dragState.startCol, col);
    const maxCol = Math.max(dragState.startCol, col);
    const startDate = Timeline.getDateFromCol(minCol);
    const endDate = Timeline.getDateFromCol(maxCol);

    if (!startDate || !endDate) return;

    showEventModal(startDate, endDate, dragState.categoryId);
  }

  // === MOVE ===
  function startMove(bar, x, y) {
    const eventId = bar.dataset.eventId;
    const evt = Model.getEvent(eventId);
    if (!evt) return;

    const colData = Model.getColumnData();
    const startCol = colData.map[evt.startDate];
    const endCol = colData.map[evt.endDate];
    const span = endCol - startCol;
    const clickCol = Timeline.getColFromX(x);

    mode = 'MOVING';
    dragState = {
      eventId,
      startCol,
      endCol,
      span,
      offsetCol: clickCol - startCol,
      categoryId: evt.categoryId,
      originalBar: bar
    };
    bar.classList.add('dragging');
  }

  function updateMove(x, y) {
    const newStartCol = Timeline.getColFromX(x) - dragState.offsetCol;
    const colData = Model.getColumnData();
    const clampedStart = Math.max(1, Math.min(newStartCol, colData.totalColumns - dragState.span));
    const clampedEnd = clampedStart + dragState.span;

    // Check if hovering over a different category
    const cat = Timeline.getCategoryFromY(y);
    const categoryId = cat ? cat.id : dragState.categoryId;

    showPreview(clampedStart, clampedEnd, categoryId);
    dragState.currentStartCol = clampedStart;
    dragState.currentEndCol = clampedEnd;
    dragState.currentCategoryId = categoryId;
  }

  function finishMove(x, y) {
    if (dragState.originalBar) {
      dragState.originalBar.classList.remove('dragging');
    }

    const startCol = dragState.currentStartCol || dragState.startCol;
    const endCol = dragState.currentEndCol || dragState.endCol;
    const startDate = Timeline.getDateFromCol(startCol);
    const endDate = Timeline.getDateFromCol(endCol);
    const categoryId = dragState.currentCategoryId || dragState.categoryId;

    if (!startDate || !endDate) return;

    // Only dispatch if something actually changed
    const evt = Model.getEvent(dragState.eventId);
    if (evt && (evt.startDate !== startDate || evt.endDate !== endDate || evt.categoryId !== categoryId)) {
      Model.dispatch({
        type: 'UPDATE_EVENT',
        id: dragState.eventId,
        startDate,
        endDate,
        categoryId
      });
    }
  }

  // === RESIZE ===
  function startResize(handle, x, y) {
    const eventId = handle.dataset.eventId;
    const side = handle.dataset.handle; // 'left' or 'right'
    const evt = Model.getEvent(eventId);
    if (!evt) return;

    const colData = Model.getColumnData();
    mode = 'RESIZING';
    dragState = {
      eventId,
      side,
      startCol: colData.map[evt.startDate],
      endCol: colData.map[evt.endDate],
      categoryId: evt.categoryId
    };
  }

  function updateResize(x, y) {
    const col = Timeline.getColFromX(x);
    let startCol = dragState.startCol;
    let endCol = dragState.endCol;

    if (dragState.side === 'left') {
      startCol = Math.min(col, endCol);
    } else {
      endCol = Math.max(col, startCol);
    }

    showPreview(startCol, endCol, dragState.categoryId);
    dragState.currentStartCol = startCol;
    dragState.currentEndCol = endCol;
  }

  function finishResize(x, y) {
    const startCol = dragState.currentStartCol || dragState.startCol;
    const endCol = dragState.currentEndCol || dragState.endCol;
    const startDate = Timeline.getDateFromCol(startCol);
    const endDate = Timeline.getDateFromCol(endCol);

    if (!startDate || !endDate) return;

    Model.dispatch({
      type: 'RESIZE_EVENT',
      id: dragState.eventId,
      startDate,
      endDate
    });
  }

  // === Double-click to edit ===
  function onDblClick(e) {
    const bar = e.target.closest('.event-bar');
    if (bar) {
      e.preventDefault();
      const eventId = bar.dataset.eventId;
      showEditEventModal(eventId);
    }
  }

  // === Preview bar ===
  function showPreview(startCol, endCol, categoryId) {
    removePreview();
    const container = document.getElementById('timeline-container');
    const grid = container && container.firstElementChild;
    if (!grid) return;

    const cat = Model.getCategory(categoryId);
    const state = Model.getState();
    const catIndex = state.categories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) return;

    const rowsTop = Timeline.HEADER_HEIGHT + Timeline.DATE_HEADER_HEIGHT;
    const left = Timeline.MONTH_LABEL_WIDTH + (startCol - 1) * Timeline.COL_WIDTH;
    const width = (endCol - startCol + 1) * Timeline.COL_WIDTH;
    const top = rowsTop + catIndex * Timeline.ROW_HEIGHT + 3;

    previewBar = Utils.el('div', {
      className: 'event-bar event-preview',
      style: {
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: (Timeline.ROW_HEIGHT - 6) + 'px',
        backgroundColor: cat ? Utils.hexToRgba(cat.color, 0.4) : 'rgba(100,100,255,0.3)',
        border: `2px dashed ${cat ? cat.color : '#666'}`,
        zIndex: 20,
        pointerEvents: 'none'
      }
    });

    grid.appendChild(previewBar);
  }

  function removePreview() {
    if (previewBar && previewBar.parentNode) {
      previewBar.parentNode.removeChild(previewBar);
    }
    previewBar = null;
  }

  // === Event Modal ===
  function showEventModal(startDate, endDate, categoryId) {
    const overlay = document.getElementById('event-modal-overlay');
    const nameInput = document.getElementById('event-name-input');
    const catSelect = document.getElementById('event-category-select');
    const tagSelect = document.getElementById('event-tag-select');
    const dateDisplay = document.getElementById('event-date-display');
    const confirmBtn = document.getElementById('event-confirm');
    const cancelBtn = document.getElementById('event-cancel');

    // Populate category dropdown
    populateCategorySelect(catSelect, categoryId);

    // Show date range
    dateDisplay.textContent = Utils.formatDateRange(startDate, endDate);

    // Reset
    nameInput.value = '';
    tagSelect.value = 'holiday';

    Utils.show(overlay);
    nameInput.focus();

    function onConfirm() {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }

      Model.dispatch({
        type: 'ADD_EVENT',
        name,
        categoryId: catSelect.value,
        startDate,
        endDate,
        tags: [tagSelect.value]
      });

      cleanup();
    }

    function onCancel() { cleanup(); }

    function onKeyDown(e) {
      if (e.key === 'Enter') onConfirm();
      if (e.key === 'Escape') onCancel();
    }

    function cleanup() {
      Utils.hide(overlay);
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('keydown', onKeyDown);
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    overlay.addEventListener('keydown', onKeyDown);
  }

  function showEditEventModal(eventId) {
    const evt = Model.getEvent(eventId);
    if (!evt) return;

    const overlay = document.getElementById('edit-event-overlay');
    const nameInput = document.getElementById('edit-event-name');
    const catSelect = document.getElementById('edit-event-category');
    const tagSelect = document.getElementById('edit-event-tag');
    const dateDisplay = document.getElementById('edit-event-date-display');
    const saveBtn = document.getElementById('edit-event-save');
    const cancelBtn = document.getElementById('edit-event-cancel');
    const deleteBtn = document.getElementById('edit-event-delete');

    populateCategorySelect(catSelect, evt.categoryId);
    nameInput.value = evt.name;
    tagSelect.value = evt.tags[0] || 'other';
    dateDisplay.textContent = Utils.formatDateRange(evt.startDate, evt.endDate);

    Utils.show(overlay);
    nameInput.focus();

    function onSave() {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      Model.dispatch({
        type: 'UPDATE_EVENT',
        id: eventId,
        name,
        categoryId: catSelect.value,
        tags: [tagSelect.value]
      });
      cleanup();
    }

    function onDelete() {
      Model.dispatch({ type: 'DELETE_EVENT', id: eventId });
      cleanup();
    }

    function onCancel() { cleanup(); }

    function onKeyDown(e) {
      if (e.key === 'Enter') onSave();
      if (e.key === 'Escape') onCancel();
    }

    function cleanup() {
      Utils.hide(overlay);
      saveBtn.removeEventListener('click', onSave);
      cancelBtn.removeEventListener('click', onCancel);
      deleteBtn.removeEventListener('click', onDelete);
      overlay.removeEventListener('keydown', onKeyDown);
    }

    saveBtn.addEventListener('click', onSave);
    cancelBtn.addEventListener('click', onCancel);
    deleteBtn.addEventListener('click', onDelete);
    overlay.addEventListener('keydown', onKeyDown);
  }

  function populateCategorySelect(select, selectedId) {
    select.innerHTML = '';
    const state = Model.getState();
    for (const cat of state.categories) {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (cat.id === selectedId) opt.selected = true;
      select.appendChild(opt);
    }
  }

  return { init };
})();
