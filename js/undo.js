// ============================================================
// undo.js — Snapshot-based undo/redo system
// ============================================================

const Undo = (() => {
  const undoStack = [];
  const redoStack = [];
  const MAX_SIZE = 50;

  let pendingBefore = null;

  function recordBefore(actionType) {
    // Skip non-undoable actions
    if (actionType === 'LOAD_STATE') return;
    const state = Model.getState();
    pendingBefore = {
      categories: Utils.deepClone(state.categories),
      events: Utils.deepClone(state.events)
    };
  }

  function recordAfter(actionType) {
    if (!pendingBefore || actionType === 'LOAD_STATE') {
      pendingBefore = null;
      return;
    }
    const state = Model.getState();
    const after = {
      categories: Utils.deepClone(state.categories),
      events: Utils.deepClone(state.events)
    };
    undoStack.push({ before: pendingBefore, after, type: actionType });
    if (undoStack.length > MAX_SIZE) undoStack.shift();
    redoStack.length = 0;
    pendingBefore = null;
    updateButtons();
  }

  function undo() {
    const entry = undoStack.pop();
    if (!entry) return;
    const state = Model.getState();
    state.categories = Utils.deepClone(entry.before.categories);
    state.events = Utils.deepClone(entry.before.events);
    redoStack.push(entry);
    updateButtons();
    // Notify without going through dispatch (to avoid recording undo of undo)
    Model.subscribe._notify && Model.subscribe._notify('UNDO');
  }

  function redo() {
    const entry = redoStack.pop();
    if (!entry) return;
    const state = Model.getState();
    state.categories = Utils.deepClone(entry.after.categories);
    state.events = Utils.deepClone(entry.after.events);
    undoStack.push(entry);
    updateButtons();
  }

  function updateButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
  }

  function canUndo() { return undoStack.length > 0; }
  function canRedo() { return redoStack.length > 0; }

  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
    updateButtons();
  }

  return { recordBefore, recordAfter, undo, redo, canUndo, canRedo, clear, updateButtons };
})();
