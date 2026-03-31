// ============================================================
// categories.js — Category CRUD UI + color picker
// ============================================================

const Categories = (() => {
  function renderSidebar() {
    const container = document.getElementById('category-list');
    if (!container) return;

    const state = Model.getState();
    container.innerHTML = '';

    for (const cat of state.categories) {
      const item = Utils.el('div', { className: 'category-item' }, [
        Utils.el('div', {
          className: 'category-swatch',
          style: { backgroundColor: cat.color }
        }),
        Utils.el('span', { className: 'category-name', textContent: cat.name }),
        Utils.el('button', {
          className: 'category-edit-btn',
          textContent: '\u270E',
          title: 'Edit category',
          onClick: () => showEditModal(cat.id)
        }),
        Utils.el('button', {
          className: 'category-delete-btn',
          textContent: '\u00D7',
          title: 'Delete category',
          onClick: () => {
            if (confirm(`Delete category "${cat.name}" and all its events?`)) {
              Model.dispatch({ type: 'DELETE_CATEGORY', id: cat.id });
            }
          }
        })
      ]);
      container.appendChild(item);
    }
  }

  function showAddModal() {
    const overlay = document.getElementById('category-modal-overlay');
    const title = document.getElementById('category-modal-title');
    const nameInput = document.getElementById('category-name-input');
    const colorInput = document.getElementById('category-color-input');
    const confirmBtn = document.getElementById('category-confirm');
    const cancelBtn = document.getElementById('category-cancel');

    title.textContent = 'Add Category';
    nameInput.value = '';
    colorInput.value = getNextColor();

    Utils.show(overlay);
    nameInput.focus();

    function onConfirm() {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      Model.dispatch({
        type: 'ADD_CATEGORY',
        name,
        color: colorInput.value
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

  function showEditModal(categoryId) {
    const cat = Model.getCategory(categoryId);
    if (!cat) return;

    const overlay = document.getElementById('category-modal-overlay');
    const title = document.getElementById('category-modal-title');
    const nameInput = document.getElementById('category-name-input');
    const colorInput = document.getElementById('category-color-input');
    const confirmBtn = document.getElementById('category-confirm');
    const cancelBtn = document.getElementById('category-cancel');

    title.textContent = 'Edit Category';
    nameInput.value = cat.name;
    colorInput.value = cat.color;

    Utils.show(overlay);
    nameInput.focus();

    function onConfirm() {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      Model.dispatch({
        type: 'UPDATE_CATEGORY',
        id: categoryId,
        name,
        color: colorInput.value
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

  const DEFAULT_COLORS = [
    '#4A90D9', '#E74C3C', '#F39C12', '#2ECC71', '#9B59B6',
    '#1ABC9C', '#E67E22', '#3498DB', '#E91E63', '#00BCD4'
  ];

  function getNextColor() {
    const state = Model.getState();
    const usedColors = state.categories.map(c => c.color);
    for (const color of DEFAULT_COLORS) {
      if (!usedColors.includes(color)) return color;
    }
    // Random fallback
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  return { renderSidebar, showAddModal };
})();
