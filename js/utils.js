// ============================================================
// utils.js — Date math helpers and DOM utilities
// ============================================================

const Utils = (() => {
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_ABBREV = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const MONTH_ABBREV = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // School year months in order (Aug=7 through Jun=5)
  const SCHOOL_MONTHS = [7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

  function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function fromISO(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function isWeekday(date) {
    const dow = date.getDay();
    return dow >= 1 && dow <= 5;
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function diffDays(a, b) {
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  }

  function getWeekdaysBetween(startISO, endISO) {
    const days = [];
    let d = fromISO(startISO);
    const end = fromISO(endISO);
    while (d <= end) {
      if (isWeekday(d)) days.push(toISO(d));
      d = addDays(d, 1);
    }
    return days;
  }

  // Build a map of ISO date -> column index for all weekdays in the school year
  function buildColumnMap(startYear) {
    const map = {};
    const reverseMap = {};
    let col = 1;
    // Aug 1 of startYear through Jun 30 of startYear+1
    let d = new Date(startYear, 7, 1);
    const end = new Date(startYear + 1, 5, 30);
    while (d <= end) {
      if (isWeekday(d)) {
        const iso = toISO(d);
        map[iso] = col;
        reverseMap[col] = iso;
        col++;
      }
      d = addDays(d, 1);
    }
    return { map, reverseMap, totalColumns: col - 1 };
  }

  // Get the month index and year for each school month
  function getSchoolMonths(startYear) {
    return SCHOOL_MONTHS.map(m => ({
      month: m,
      year: m >= 7 ? startYear : startYear + 1,
      name: MONTH_NAMES[m],
      abbrev: MONTH_ABBREV[m]
    }));
  }

  // Get all weekdays in a given month/year, returns array of ISO strings
  function getWeekdaysInMonth(year, month) {
    const days = [];
    let d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      if (isWeekday(d)) days.push(toISO(d));
      d = addDays(d, 1);
    }
    return days;
  }

  // Get the Nth occurrence of a weekday in a month (e.g., 3rd Monday)
  // weekday: 0=Sun...6=Sat, n: 1-based
  function getNthWeekdayInMonth(year, month, weekday, n) {
    let count = 0;
    let d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      if (d.getDay() === weekday) {
        count++;
        if (count === n) return toISO(d);
      }
      d = addDays(d, 1);
    }
    return null;
  }

  // Get Thanksgiving (4th Thursday in November)
  function getThanksgiving(year) {
    return getNthWeekdayInMonth(year, 10, 4, 4); // month 10 = Nov, day 4 = Thu
  }

  // Get the last weekday on or before a date
  function lastWeekdayOnOrBefore(date) {
    let d = new Date(date);
    while (!isWeekday(d)) d = addDays(d, -1);
    return d;
  }

  // Format a date range for display
  function formatDateRange(startISO, endISO) {
    const s = fromISO(startISO);
    const e = fromISO(endISO);
    if (startISO === endISO) {
      return `${MONTH_ABBREV[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`;
    }
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${MONTH_ABBREV[s.getMonth()]} ${s.getDate()}\u2013${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${MONTH_ABBREV[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()} \u2013 ${MONTH_ABBREV[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  }

  // Generate a unique ID
  let _idCounter = 0;
  function uid(prefix = 'id') {
    return `${prefix}-${Date.now()}-${++_idCounter}`;
  }

  // DOM helpers
  function el(tag, attrs = {}, children = []) {
    const elem = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className') elem.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(elem.style, v);
      else if (k.startsWith('on')) elem.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'textContent') elem.textContent = v;
      else if (k === 'innerHTML') elem.innerHTML = v;
      else elem.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === 'string') elem.appendChild(document.createTextNode(child));
      else if (child) elem.appendChild(child);
    }
    return elem;
  }

  function qs(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  }

  function show(elem) { elem.classList.remove('hidden'); }
  function hide(elem) { elem.classList.add('hidden'); }

  // Deep clone (for undo snapshots)
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Lighten/darken a hex color
  function adjustColor(hex, amount) {
    hex = hex.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  // Get contrasting text color (black or white) for a background
  function contrastColor(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Hex to rgba
  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  return {
    DAY_NAMES, DAY_ABBREV, MONTH_NAMES, MONTH_ABBREV, SCHOOL_MONTHS,
    toISO, fromISO, isWeekday, addDays, diffDays,
    getWeekdaysBetween, buildColumnMap, getSchoolMonths, getWeekdaysInMonth,
    getNthWeekdayInMonth, getThanksgiving, lastWeekdayOnOrBefore,
    formatDateRange, uid, el, qs, qsa, show, hide, deepClone,
    adjustColor, contrastColor, hexToRgba
  };
})();
