// ============================================================
// daycounter.js — Instructional day counting logic
// ============================================================

const DayCounter = (() => {
  function compute() {
    const state = Model.getState();
    if (!state.schoolYear.startYear) return null;

    const startYear = state.schoolYear.startYear;
    const months = Utils.getSchoolMonths(startYear);
    const counts = {
      instructional: 0,
      holiday: 0,
      pd: 0,
      testing: 0,
      earlyDismissal: 0,
      other: 0,
      totalWeekdays: 0
    };
    const monthCounts = {};

    for (const m of months) {
      const weekdays = Utils.getWeekdaysInMonth(m.year, m.month);
      const mc = { instructional: 0, holiday: 0, pd: 0, testing: 0, earlyDismissal: 0, other: 0, total: weekdays.length };
      monthCounts[m.name] = mc;
      counts.totalWeekdays += weekdays.length;

      for (const dateStr of weekdays) {
        const coveringEvents = state.events.filter(
          e => dateStr >= e.startDate && dateStr <= e.endDate
        );

        // Priority: holiday/break > pd > testing > early-dismissal > other > instructional
        if (coveringEvents.some(e => e.tags.includes('holiday') || e.tags.includes('break'))) {
          counts.holiday++;
          mc.holiday++;
        } else if (coveringEvents.some(e => e.tags.includes('pd'))) {
          counts.pd++;
          mc.pd++;
        } else if (coveringEvents.some(e => e.tags.includes('testing'))) {
          counts.testing++;
          mc.testing++;
          // Testing days still count as instructional
          counts.instructional++;
          mc.instructional++;
        } else if (coveringEvents.some(e => e.tags.includes('early-dismissal'))) {
          counts.earlyDismissal++;
          mc.earlyDismissal++;
          // Early dismissal still counts as instructional
          counts.instructional++;
          mc.instructional++;
        } else {
          // Default weekday = instructional
          counts.instructional++;
          mc.instructional++;
        }
      }
    }

    return { counts, monthCounts, target: state.settings.targetInstructionalDays };
  }

  function renderSidebar() {
    const container = document.getElementById('day-counts');
    if (!container) return;
    const data = compute();
    if (!data) {
      container.innerHTML = '<p class="hint">Choose a school year to see day counts.</p>';
      return;
    }

    const { counts, target } = data;
    const diff = counts.instructional - target;
    const diffClass = diff >= 0 ? 'count-ok' : 'count-warn';
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;

    container.innerHTML = `
      <div class="count-row count-primary">
        <span>Instructional Days</span>
        <span class="${diffClass}">${counts.instructional} / ${target} (${diffStr})</span>
      </div>
      <div class="count-row">
        <span>Holidays / No School</span>
        <span>${counts.holiday}</span>
      </div>
      <div class="count-row">
        <span>PD Days</span>
        <span>${counts.pd}</span>
      </div>
      <div class="count-row">
        <span>Testing Days</span>
        <span>${counts.testing}</span>
      </div>
      <div class="count-row">
        <span>Early Dismissals</span>
        <span>${counts.earlyDismissal}</span>
      </div>
      <div class="count-row count-muted">
        <span>Total Weekdays</span>
        <span>${counts.totalWeekdays}</span>
      </div>
    `;
  }

  function renderStatusBar() {
    const container = document.getElementById('status-counts');
    if (!container) return;
    const data = compute();
    if (!data) {
      container.textContent = '';
      return;
    }
    const { counts, target } = data;
    const diff = counts.instructional - target;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
    container.innerHTML = `
      <span class="status-item"><strong>Instructional:</strong> ${counts.instructional}/${target} (${diffStr})</span>
      <span class="status-item"><strong>Holidays:</strong> ${counts.holiday}</span>
      <span class="status-item"><strong>PD:</strong> ${counts.pd}</span>
    `;
  }

  return { compute, renderSidebar, renderStatusBar };
})();
