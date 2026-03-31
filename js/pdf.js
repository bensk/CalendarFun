// ============================================================
// pdf.js — PDF generation (wall calendar + table formats)
// ============================================================

const PDF = (() => {
  function exportWallCalendar() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

    const state = Model.getState();
    const months = Utils.getSchoolMonths(state.schoolYear.startYear);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 30;

    months.forEach((m, mIdx) => {
      if (mIdx > 0) doc.addPage();

      const weekdays = Utils.getWeekdaysInMonth(m.year, m.month);
      if (weekdays.length === 0) return;

      // Group weekdays by week (Mon-Fri)
      const weeks = [];
      let currentWeek = [];
      for (const iso of weekdays) {
        const d = Utils.fromISO(iso);
        if (d.getDay() === 1 && currentWeek.length > 0) {
          weeks.push(currentWeek);
          currentWeek = [];
        }
        currentWeek.push(iso);
      }
      if (currentWeek.length > 0) weeks.push(currentWeek);

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(`${m.name} ${m.year}`, pageW / 2, margin + 10, { align: 'center' });

      // Grid dimensions
      const gridTop = margin + 30;
      const gridLeft = margin;
      const gridWidth = pageW - margin * 2;
      const gridHeight = pageH - gridTop - margin - 40; // Leave room for legend
      const cols = 5;
      const rows = weeks.length;
      const cellW = gridWidth / cols;
      const cellH = gridHeight / rows;

      // Day headers
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (let c = 0; c < cols; c++) {
        doc.text(dayLabels[c], gridLeft + c * cellW + cellW / 2, gridTop - 4, { align: 'center' });
      }

      // Draw grid
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);

      for (let r = 0; r <= rows; r++) {
        doc.line(gridLeft, gridTop + r * cellH, gridLeft + gridWidth, gridTop + r * cellH);
      }
      for (let c = 0; c <= cols; c++) {
        doc.line(gridLeft + c * cellW, gridTop, gridLeft + c * cellW, gridTop + rows * cellH);
      }

      // Place date numbers and events
      doc.setFont(undefined, 'normal');
      for (let r = 0; r < weeks.length; r++) {
        for (const iso of weeks[r]) {
          const d = Utils.fromISO(iso);
          const col = d.getDay() - 1; // Mon=0...Fri=4
          if (col < 0 || col >= 5) continue;

          const x = gridLeft + col * cellW;
          const y = gridTop + r * cellH;

          // Date number
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(String(d.getDate()), x + cellW - 4, y + 10, { align: 'right' });

          // Events on this day
          const eventsOnDay = state.events.filter(e => iso >= e.startDate && iso <= e.endDate);
          let evtY = y + 18;

          for (const evt of eventsOnDay) {
            if (evtY + 10 > y + cellH) break;
            const cat = Model.getCategory(evt.categoryId);
            const color = cat ? cat.color : '#999999';
            const rgb = hexToRGB(color);

            // Only show event name on first day of event (or first day of this month for spanning events)
            const isFirstDay = iso === evt.startDate || iso === weekdays[0];

            // Draw colored dot
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.circle(x + 6, evtY - 2, 2, 'F');

            if (isFirstDay) {
              doc.setFontSize(6);
              doc.setTextColor(40, 40, 40);
              const text = doc.splitTextToSize(evt.name, cellW - 14);
              doc.text(text[0], x + 10, evtY);
              evtY += 9 * text.length;
            } else {
              evtY += 7;
            }
          }
        }
      }

      // Legend at bottom
      const legendY = gridTop + rows * cellH + 15;
      doc.setFontSize(7);
      let legendX = margin;
      for (const cat of state.categories) {
        const rgb = hexToRGB(cat.color);
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(legendX, legendY - 5, 8, 8, 'F');
        doc.setTextColor(40, 40, 40);
        doc.text(cat.name, legendX + 11, legendY + 1);
        legendX += doc.getTextWidth(cat.name) + 20;
      }
    });

    doc.save(`school-calendar-wall-${state.schoolYear.startYear}-${state.schoolYear.endYear}.pdf`);
  }

  function exportTableCalendar() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

    const state = Model.getState();
    const months = Utils.getSchoolMonths(state.schoolYear.startYear);
    const dayData = DayCounter.compute();

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`School Calendar ${state.schoolYear.startYear}\u2013${state.schoolYear.endYear}`, pageW / 2, margin + 10, { align: 'center' });

    let startY = margin + 25;

    for (const m of months) {
      const weekdays = Utils.getWeekdaysInMonth(m.year, m.month);
      if (weekdays.length === 0) continue;

      // Build table columns: Category label + one per weekday + Days count
      const columns = [{ header: m.name, dataKey: 'label' }];
      for (let i = 0; i < weekdays.length; i++) {
        const d = Utils.fromISO(weekdays[i]);
        columns.push({ header: String(d.getDate()), dataKey: `d${i}` });
      }
      columns.push({ header: 'Days', dataKey: 'days' });

      // Build rows: one per category
      const body = state.categories.map(cat => {
        const row = { label: cat.name };
        const catEvents = state.events.filter(e => e.categoryId === cat.id);

        for (let i = 0; i < weekdays.length; i++) {
          const dayISO = weekdays[i];
          const evtsOnDay = catEvents.filter(e => dayISO >= e.startDate && dayISO <= e.endDate);

          // Show event name on first day only
          const display = evtsOnDay.map(e => {
            if (dayISO === e.startDate || dayISO === weekdays[0]) return e.name;
            return '\u2022';
          }).join(', ');

          row[`d${i}`] = display || '';
        }

        return row;
      });

      // Add days count to first row
      if (body.length > 0 && dayData && dayData.monthCounts[m.name]) {
        body[0].days = dayData.monthCounts[m.name].instructional;
      }

      const catColors = {};
      for (const cat of state.categories) {
        catColors[cat.name] = hexToRGB(cat.color);
      }

      doc.autoTable({
        columns,
        body,
        startY,
        theme: 'grid',
        styles: {
          fontSize: 5,
          cellPadding: 1,
          overflow: 'hidden',
          halign: 'center',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [220, 220, 230],
          textColor: [30, 30, 30],
          fontSize: 5,
          fontStyle: 'bold'
        },
        columnStyles: {
          label: { halign: 'left', fontStyle: 'bold', cellWidth: 60 },
          days: { halign: 'center', fontStyle: 'bold', cellWidth: 25 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const catName = data.cell.raw;
            const rgb = catColors[catName];
            if (rgb) {
              data.cell.styles.fillColor = [rgb.r, rgb.g, rgb.b];
              const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
              data.cell.styles.textColor = lum > 0.5 ? [0, 0, 0] : [255, 255, 255];
            }
          }
        },
        margin: { left: margin, right: margin }
      });

      startY = doc.lastAutoTable.finalY + 4;

      // Check if we need a new page
      if (startY > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        startY = margin;
      }
    }

    // Total row
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    if (dayData) {
      doc.text(`Total Instructional Days: ${dayData.counts.instructional} / ${dayData.target}`, margin, startY + 15);
    }

    doc.save(`school-calendar-table-${state.schoolYear.startYear}-${state.schoolYear.endYear}.pdf`);
  }

  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  return { exportWallCalendar, exportTableCalendar };
})();
