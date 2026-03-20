/* components/toast.js */
const Toast = {
  show(msg, type='success', duration=3500) {
    const stack = document.getElementById('toastStack');
    const icons = { success:'✓', error:'✕', warn:'⚠', info:'ℹ' };
    const item = document.createElement('div');
    item.className = `toast-item ${type}`;
    item.innerHTML = `<span style="font-weight:700;font-size:.9rem;">${icons[type]||'✓'}</span> ${msg}`;
    stack.appendChild(item);
    setTimeout(() => {
      item.classList.add('fade-out');
      setTimeout(() => item.remove(), 250);
    }, duration);
  }
};

/* components/charts.js */
const Charts = (() => {
  const instances = {};
  const PALETTE = {
    accent: '#11b892', blue:'#50a0f0', gold:'#e09818', red:'#f06060',
    purple:'#9070e0', orange:'#f09050', green:'#11b892',
  };
  const CHART_DEFAULTS = {
    color: '#7e9ab8',
    grid: { color: 'rgba(30,48,80,.6)' },
    ticks: { color:'#4a6080', font:{ size:11, family:'DM Sans' } },
    tooltip: { bg:'#1c2e4a', border:'#284060', title:'#dce8f5', body:'#7e9ab8' },
    legend: { color:'#7e9ab8', font:{ size:11, family:'DM Sans' } },
  };

  function destroy(id) { if (instances[id]) { instances[id].destroy(); delete instances[id]; } }

  function line(canvasId, labels, datasets, opts = {}) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: datasets.map(d => ({
        tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 5,
        backgroundColor: d.color + '14', borderWidth: 2, ...d
      }))},
      options: {
        responsive: true,
        interaction: { mode:'index', intersect:false },
        plugins: {
          legend: { position:'top', labels: { color:CHART_DEFAULTS.legend.color, font:CHART_DEFAULTS.legend.font, boxWidth:12, padding:16 } },
          tooltip: { backgroundColor:CHART_DEFAULTS.tooltip.bg, borderColor:CHART_DEFAULTS.tooltip.border, borderWidth:1, titleColor:CHART_DEFAULTS.tooltip.title, bodyColor:CHART_DEFAULTS.tooltip.body, padding:10 },
        },
        scales: {
          x: { ticks:CHART_DEFAULTS.ticks, grid:CHART_DEFAULTS.grid },
          y: { ticks:CHART_DEFAULTS.ticks, grid:CHART_DEFAULTS.grid },
        },
        ...opts,
      }
    });
  }

  function doughnut(canvasId, labels, data, colors, opts={}) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    instances[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels, datasets:[{ data, backgroundColor: colors, borderColor:'#0d1525', borderWidth:3, hoverOffset:6 }] },
      options: {
        responsive: true, cutout:'68%',
        plugins: {
          legend: { position:'bottom', labels:{ color:CHART_DEFAULTS.legend.color, font:CHART_DEFAULTS.legend.font, boxWidth:12, padding:12 } },
          tooltip: { backgroundColor:CHART_DEFAULTS.tooltip.bg, borderColor:CHART_DEFAULTS.tooltip.border, borderWidth:1, titleColor:CHART_DEFAULTS.tooltip.title, bodyColor:CHART_DEFAULTS.tooltip.body },
        },
        ...opts,
      }
    });
  }

  function bar(canvasId, labels, datasets, opts={}) {
    destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    instances[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: datasets.map(d => ({ borderRadius:4, borderSkipped:false, ...d })) },
      options: {
        responsive: true,
        plugins: {
          legend: { position:'top', labels:{ color:CHART_DEFAULTS.legend.color, font:CHART_DEFAULTS.legend.font, boxWidth:12, padding:16 } },
          tooltip: { backgroundColor:CHART_DEFAULTS.tooltip.bg, borderColor:CHART_DEFAULTS.tooltip.border, borderWidth:1, titleColor:CHART_DEFAULTS.tooltip.title, bodyColor:CHART_DEFAULTS.tooltip.body },
        },
        scales: {
          x: { ticks:CHART_DEFAULTS.ticks, grid:{ display:false } },
          y: { ticks:CHART_DEFAULTS.ticks, grid:CHART_DEFAULTS.grid },
        },
        ...opts,
      }
    });
  }

  return { line, doughnut, bar, PALETTE, destroy };
})();

/* components/table.js */
const Table = {
  statusBadge(status) {
    const map = { Admitted:'red', Monitoring:'gold', Recovered:'green', Discharged:'gray', Deceased:'gray', Active:'green', Inactive:'gray' };
    return `<span class="badge badge-${map[status]||'gray'}">${status}</span>`;
  },
  alertBadge(alert) {
    const map = { Hotspot:'red', Rising:'orange', Watch:'gold', Cluster:'orange', Normal:'green' };
    return `<span class="badge badge-${map[alert]||'gray'}">${alert}</span>`;
  },
  trendPill(trend, dir) {
    const cls = dir === 'up' ? 'trend-up' : dir === 'down' ? 'trend-down' : 'trend-stable';
    const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—';
    return `<span class="trend-pill ${cls}">${arrow} ${trend}</span>`;
  },
};
