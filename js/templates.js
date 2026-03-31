// ============================================================
// templates.js — Pre-built US school calendar templates
// ============================================================

const Templates = (() => {
  const TEMPLATES = {
    'Standard US K-12': {
      description: 'Common US school year with federal holidays, winter/spring breaks, and 180 instructional days.',
      categories: [
        { name: 'Academics', color: '#4A90D9' },
        { name: 'Holidays / No School', color: '#E74C3C' },
        { name: 'Professional Development', color: '#F39C12' },
        { name: 'Culture', color: '#9B59B6' },
        { name: 'Operations', color: '#2ECC71' }
      ],
      events: [
        // Holidays
        { name: 'Labor Day', category: 'Holidays / No School', start: { month: 8, rule: 'nth-weekday', weekday: 1, n: 1 }, duration: 1, tag: 'holiday' },
        { name: 'Indigenous Peoples\' Day', category: 'Holidays / No School', start: { month: 9, rule: 'nth-weekday', weekday: 1, n: 2 }, duration: 1, tag: 'holiday' },
        { name: 'Veterans Day', category: 'Holidays / No School', start: { month: 10, rule: 'fixed', day: 11 }, duration: 1, tag: 'holiday' },
        { name: 'Thanksgiving Break', category: 'Holidays / No School', start: { month: 10, rule: 'thanksgiving' }, duration: 5, tag: 'holiday' },
        { name: 'Winter Break', category: 'Holidays / No School', start: { month: 11, rule: 'fixed', day: 23 }, end: { month: 0, rule: 'fixed', day: 3 }, tag: 'holiday' },
        { name: 'MLK Day', category: 'Holidays / No School', start: { month: 0, rule: 'nth-weekday', weekday: 1, n: 3 }, duration: 1, tag: 'holiday' },
        { name: 'Presidents\' Day', category: 'Holidays / No School', start: { month: 1, rule: 'nth-weekday', weekday: 1, n: 3 }, duration: 1, tag: 'holiday' },
        { name: 'Midwinter Recess', category: 'Holidays / No School', start: { month: 1, rule: 'week-of-nth-weekday', weekday: 1, n: 3 }, duration: 5, tag: 'holiday' },
        { name: 'Spring Break', category: 'Holidays / No School', start: { month: 3, rule: 'nth-weekday', weekday: 1, n: 3 }, duration: 5, tag: 'holiday' },
        { name: 'Memorial Day', category: 'Holidays / No School', start: { month: 4, rule: 'last-weekday', weekday: 1 }, duration: 1, tag: 'holiday' },
        { name: 'Juneteenth', category: 'Holidays / No School', start: { month: 5, rule: 'fixed', day: 19 }, duration: 1, tag: 'holiday' },

        // Academics
        { name: 'First Day of School', category: 'Academics', start: { month: 8, rule: 'fixed', day: 4 }, duration: 1, tag: 'instructional' },
        { name: 'Back to School Night', category: 'Academics', start: { month: 8, rule: 'nth-weekday', weekday: 4, n: 2 }, duration: 1, tag: 'other' },
        { name: 'Q1 Conferences', category: 'Academics', start: { month: 10, rule: 'nth-weekday', weekday: 4, n: 1 }, duration: 2, tag: 'early-dismissal' },
        { name: 'Q2 Conferences', category: 'Academics', start: { month: 1, rule: 'nth-weekday', weekday: 4, n: 1 }, duration: 2, tag: 'early-dismissal' },
        { name: 'Q3 Conferences', category: 'Academics', start: { month: 3, rule: 'nth-weekday', weekday: 4, n: 4 }, duration: 2, tag: 'early-dismissal' },
        { name: 'Last Day of School', category: 'Academics', start: { month: 5, rule: 'fixed', day: 20 }, duration: 1, tag: 'instructional' },

        // PD Days
        { name: 'Staff Orientation', category: 'Professional Development', start: { month: 7, rule: 'fixed', day: 28 }, duration: 3, tag: 'pd' },
        { name: 'Data Day 1', category: 'Professional Development', start: { month: 9, rule: 'nth-weekday', weekday: 5, n: 3 }, duration: 1, tag: 'pd' },
        { name: 'Data Day 2', category: 'Professional Development', start: { month: 11, rule: 'nth-weekday', weekday: 5, n: 2 }, duration: 1, tag: 'pd' },
        { name: 'Team Day', category: 'Professional Development', start: { month: 0, rule: 'fixed', day: 6 }, duration: 1, tag: 'pd' }
      ]
    },

    'Year-Round (Track A)': {
      description: 'Year-round schedule with 45-day instruction / 15-day break cycles.',
      categories: [
        { name: 'Instruction', color: '#4A90D9' },
        { name: 'Intersession Break', color: '#E74C3C' },
        { name: 'Holidays', color: '#C0392B' },
        { name: 'Professional Development', color: '#F39C12' }
      ],
      events: [
        { name: 'Fall Intersession', category: 'Intersession Break', start: { month: 9, rule: 'fixed', day: 6 }, duration: 15, tag: 'holiday' },
        { name: 'Winter Intersession', category: 'Intersession Break', start: { month: 11, rule: 'fixed', day: 16 }, end: { month: 0, rule: 'fixed', day: 6 }, tag: 'holiday' },
        { name: 'Spring Intersession', category: 'Intersession Break', start: { month: 2, rule: 'fixed', day: 10 }, duration: 15, tag: 'holiday' },
        { name: 'Summer Intersession', category: 'Intersession Break', start: { month: 5, rule: 'fixed', day: 9 }, duration: 15, tag: 'holiday' },
        { name: 'Thanksgiving', category: 'Holidays', start: { month: 10, rule: 'thanksgiving' }, duration: 5, tag: 'holiday' },
        { name: 'Memorial Day', category: 'Holidays', start: { month: 4, rule: 'last-weekday', weekday: 1 }, duration: 1, tag: 'holiday' }
      ]
    },

    'Minimal (Just Holidays)': {
      description: 'Only US federal holidays pre-filled. Add your own categories and events.',
      categories: [
        { name: 'Holidays', color: '#E74C3C' },
        { name: 'Academics', color: '#4A90D9' }
      ],
      events: [
        { name: 'Labor Day', category: 'Holidays', start: { month: 8, rule: 'nth-weekday', weekday: 1, n: 1 }, duration: 1, tag: 'holiday' },
        { name: 'Thanksgiving Break', category: 'Holidays', start: { month: 10, rule: 'thanksgiving' }, duration: 5, tag: 'holiday' },
        { name: 'Winter Break', category: 'Holidays', start: { month: 11, rule: 'fixed', day: 23 }, end: { month: 0, rule: 'fixed', day: 3 }, tag: 'holiday' },
        { name: 'MLK Day', category: 'Holidays', start: { month: 0, rule: 'nth-weekday', weekday: 1, n: 3 }, duration: 1, tag: 'holiday' },
        { name: 'Presidents\' Day', category: 'Holidays', start: { month: 1, rule: 'nth-weekday', weekday: 1, n: 3 }, duration: 1, tag: 'holiday' },
        { name: 'Spring Break', category: 'Holidays', start: { month: 3, rule: 'nth-weekday', weekday: 1, n: 3 }, duration: 5, tag: 'holiday' },
        { name: 'Memorial Day', category: 'Holidays', start: { month: 4, rule: 'last-weekday', weekday: 1 }, duration: 1, tag: 'holiday' },
        { name: 'Juneteenth', category: 'Holidays', start: { month: 5, rule: 'fixed', day: 19 }, duration: 1, tag: 'holiday' }
      ]
    }
  };

  function resolveDate(rule, startYear) {
    const year = rule.month >= 7 ? startYear : startYear + 1;

    switch (rule.rule) {
      case 'fixed': {
        const d = new Date(year, rule.month, rule.day);
        // If weekend, skip to nearest weekday
        if (d.getDay() === 0) d.setDate(d.getDate() + 1);
        if (d.getDay() === 6) d.setDate(d.getDate() + 2);
        return Utils.toISO(d);
      }
      case 'nth-weekday':
        return Utils.getNthWeekdayInMonth(year, rule.month, rule.weekday, rule.n);

      case 'last-weekday': {
        // Last occurrence of a weekday in the month
        let d = new Date(year, rule.month + 1, 0); // Last day of month
        while (d.getDay() !== rule.weekday) d = Utils.addDays(d, -1);
        return Utils.toISO(d);
      }
      case 'thanksgiving': {
        // Monday of Thanksgiving week (4th Thu in Nov)
        const thu = Utils.getThanksgiving(year);
        if (!thu) return null;
        const thuDate = Utils.fromISO(thu);
        const mon = Utils.addDays(thuDate, -3); // Monday of that week
        return Utils.toISO(mon);
      }
      case 'week-of-nth-weekday': {
        const target = Utils.getNthWeekdayInMonth(year, rule.month, rule.weekday, rule.n);
        if (!target) return null;
        const d = Utils.fromISO(target);
        // Go to Monday of that week
        const dayOfWeek = d.getDay();
        const mon = Utils.addDays(d, -(dayOfWeek - 1));
        return Utils.toISO(mon);
      }
    }
    return null;
  }

  function applyTemplate(templateName, startYear) {
    const tmpl = TEMPLATES[templateName];
    if (!tmpl) return;

    // Create categories
    const catMap = {};
    const categories = tmpl.categories.map((c, i) => {
      const id = Utils.uid('cat');
      catMap[c.name] = id;
      return { id, name: c.name, color: c.color, order: i };
    });

    // Resolve events
    const events = [];
    for (const evt of tmpl.events) {
      const startDate = resolveDate(evt.start, startYear);
      if (!startDate) continue;

      let endDate;
      if (evt.end) {
        endDate = resolveDate(evt.end, startYear);
      } else if (evt.duration && evt.duration > 1) {
        // Add duration in weekdays
        let d = Utils.fromISO(startDate);
        let remaining = evt.duration - 1;
        while (remaining > 0) {
          d = Utils.addDays(d, 1);
          if (Utils.isWeekday(d)) remaining--;
        }
        endDate = Utils.toISO(d);
      } else {
        endDate = startDate;
      }

      if (!endDate) continue;

      events.push({
        id: Utils.uid('evt'),
        name: evt.name,
        categoryId: catMap[evt.category],
        startDate,
        endDate,
        tags: [evt.tag || 'other']
      });
    }

    Model.dispatch({
      type: 'LOAD_STATE',
      state: {
        categories,
        events,
        schoolYear: { startYear, endYear: startYear + 1 }
      }
    });
  }

  function showTemplatePicker() {
    const overlay = document.getElementById('template-overlay');
    const list = document.getElementById('template-list');
    const skipBtn = document.getElementById('template-skip');

    list.innerHTML = '';

    for (const [name, tmpl] of Object.entries(TEMPLATES)) {
      const card = Utils.el('div', { className: 'template-card' }, [
        Utils.el('h3', { textContent: name }),
        Utils.el('p', { textContent: tmpl.description }),
        Utils.el('div', { className: 'template-cats' },
          tmpl.categories.map(c =>
            Utils.el('span', {
              className: 'template-cat-chip',
              textContent: c.name,
              style: { backgroundColor: c.color, color: Utils.contrastColor(c.color) }
            })
          )
        ),
        Utils.el('button', {
          className: 'btn btn-primary',
          textContent: 'Use This Template',
          onClick: () => {
            const startYear = Model.getState().schoolYear.startYear;
            applyTemplate(name, startYear);
            Utils.hide(overlay);
          }
        })
      ]);
      list.appendChild(card);
    }

    Utils.show(overlay);

    function onSkip() {
      Utils.hide(overlay);
      skipBtn.removeEventListener('click', onSkip);
    }
    skipBtn.addEventListener('click', onSkip);
  }

  return { showTemplatePicker, applyTemplate, TEMPLATES };
})();
