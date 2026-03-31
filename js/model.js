// ============================================================
// model.js — Core data model and dispatch/action system
// ============================================================

const Model = (() => {
  const state = {
    schoolYear: { startYear: null, endYear: null },
    categories: [],
    events: [],
    settings: {
      sheetId: null,
      sheetName: 'Calendar',
      targetInstructionalDays: 180
    }
  };

  // Column map (rebuilt when school year changes)
  let columnData = { map: {}, reverseMap: {}, totalColumns: 0 };

  // Listeners for state changes
  const listeners = [];

  function subscribe(fn) {
    listeners.push(fn);
  }

  function notify(actionType) {
    for (const fn of listeners) fn(actionType);
  }

  function getState() {
    return state;
  }

  function getColumnData() {
    return columnData;
  }

  function setSchoolYear(startYear) {
    state.schoolYear.startYear = startYear;
    state.schoolYear.endYear = startYear + 1;
    columnData = Utils.buildColumnMap(startYear);
    notify('SET_SCHOOL_YEAR');
  }

  // Actions
  function dispatch(action) {
    // Record undo snapshot before mutation
    if (typeof Undo !== 'undefined') {
      Undo.recordBefore(action.type);
    }

    switch (action.type) {
      case 'ADD_EVENT': {
        state.events.push({
          id: action.id || Utils.uid('evt'),
          name: action.name,
          categoryId: action.categoryId,
          startDate: action.startDate,
          endDate: action.endDate,
          tags: action.tags || ['other']
        });
        break;
      }
      case 'UPDATE_EVENT': {
        const evt = state.events.find(e => e.id === action.id);
        if (evt) {
          if (action.name !== undefined) evt.name = action.name;
          if (action.categoryId !== undefined) evt.categoryId = action.categoryId;
          if (action.startDate !== undefined) evt.startDate = action.startDate;
          if (action.endDate !== undefined) evt.endDate = action.endDate;
          if (action.tags !== undefined) evt.tags = action.tags;
        }
        break;
      }
      case 'MOVE_EVENT': {
        const evt = state.events.find(e => e.id === action.id);
        if (evt) {
          evt.startDate = action.startDate;
          evt.endDate = action.endDate;
        }
        break;
      }
      case 'RESIZE_EVENT': {
        const evt = state.events.find(e => e.id === action.id);
        if (evt) {
          if (action.startDate !== undefined) evt.startDate = action.startDate;
          if (action.endDate !== undefined) evt.endDate = action.endDate;
        }
        break;
      }
      case 'DELETE_EVENT': {
        const idx = state.events.findIndex(e => e.id === action.id);
        if (idx !== -1) state.events.splice(idx, 1);
        break;
      }
      case 'ADD_CATEGORY': {
        state.categories.push({
          id: action.id || Utils.uid('cat'),
          name: action.name,
          color: action.color,
          order: state.categories.length
        });
        break;
      }
      case 'UPDATE_CATEGORY': {
        const cat = state.categories.find(c => c.id === action.id);
        if (cat) {
          if (action.name !== undefined) cat.name = action.name;
          if (action.color !== undefined) cat.color = action.color;
        }
        break;
      }
      case 'DELETE_CATEGORY': {
        const idx = state.categories.findIndex(c => c.id === action.id);
        if (idx !== -1) state.categories.splice(idx, 1);
        // Remove events in this category
        state.events = state.events.filter(e => e.categoryId !== action.id);
        break;
      }
      case 'REORDER_CATEGORIES': {
        state.categories = action.order.map((id, i) => {
          const cat = state.categories.find(c => c.id === id);
          cat.order = i;
          return cat;
        });
        break;
      }
      case 'LOAD_STATE': {
        state.categories = action.state.categories || [];
        state.events = action.state.events || [];
        if (action.state.settings) {
          Object.assign(state.settings, action.state.settings);
        }
        if (action.state.schoolYear && action.state.schoolYear.startYear) {
          state.schoolYear = action.state.schoolYear;
          columnData = Utils.buildColumnMap(state.schoolYear.startYear);
        }
        break;
      }
      case 'CLEAR_ALL': {
        state.categories = [];
        state.events = [];
        break;
      }
    }

    // Record undo snapshot after mutation
    if (typeof Undo !== 'undefined') {
      Undo.recordAfter(action.type);
    }

    notify(action.type);
  }

  // Helpers
  function getCategory(id) {
    return state.categories.find(c => c.id === id);
  }

  function getEvent(id) {
    return state.events.find(e => e.id === id);
  }

  function getEventsForCategory(categoryId) {
    return state.events.filter(e => e.categoryId === categoryId);
  }

  function getEventsInRange(startISO, endISO) {
    return state.events.filter(e => e.startDate <= endISO && e.endDate >= startISO);
  }

  return {
    getState, getColumnData, setSchoolYear,
    dispatch, subscribe, getCategory, getEvent,
    getEventsForCategory, getEventsInRange
  };
})();
