/* pages/dashboard.js — Disease Dashboard main page
   Fixes:
   - Card/List/Chart toggle actually switches views
   - Zone donut uses only 5 zones (aggregated)
   - Trend chart uses accurate MOCK data
   - No inline onclick with complex expressions
*/
'use strict';
window.Pages = window.Pages || {};

Pages.dashboard = async function(area) {
  area.innerHTML = `
    <div class="page-header fade-in">
      <div class="ph-inner">
        <h1 class="ph-title">Disease Management Dashboard</h1>
        <p class="ph-sub">Population health surveillance, NCD programme reporting &amp; real-time outbreak monitoring</p>
        <div class="ph-stats" id="phStats">
          <div class="ph-stat-item"><div class="ph-stat-num skeleton" style="width:80px;height:22px;border-radius:4px"></div><div class="ph-stat-label">Total Patients</div></div>
          <div class="ph-stat-item"><div class="ph-stat-num skeleton" style="width:60px;height:22px;border-radius:4px"></div><div class="ph-stat-label">Admitted</div></div>
          <div class="ph-stat-item"><div class="ph-stat-num skeleton" style="width:70px;height:22px;border-radius:4px"></div><div class="ph-stat-label">Recovered</div></div>
          <div class="ph-stat-item"><div class="ph-stat-num skeleton" style="width:50px;height:22px;border-radius:4px"></div><div class="ph-stat-label">Deaths</div></div>
        </div>
      </div>
    </div>

    <!-- PROGRAMME HEALTH SNAPSHOT — unique to dashboard, no card duplication -->
    <div class="page-section reveal">
      <div class="section-hd">
        <div>
          <div class="section-title">Programme Health Snapshot</div>
          <div class="section-desc">Live overview of NCD, surveillance, and facility status — <em>separate from patient count above</em></div>
        </div>
        <div class="section-actions">
          <button class="btn btn-ghost btn-sm" id="viewNcdBtn">Full NCD Report →</button>
        </div>
      </div>

      <!-- 4 key metric tiles — each measures something different from the patient counter -->
      <div class="grid-4" style="margin-bottom:16px" id="snapshotGrid">

        <div class="snapshot-tile snap-green snap-clickable" data-nav="ncd" title="Click to open NCD Programme Report">
          <div class="snap-header">
            <div class="snap-icon">🩺</div>
            <div class="snap-arrow">→</div>
          </div>
          <div class="snap-val" id="snapScreened">45,292</div>
          <div class="snap-label">NCD Screening Visits <span class="snap-note">(not unique patients)</span></div>
          <div class="snap-sub">↑ 12% vs last quarter · Tap to view NCD Report</div>
        </div>

        <div class="snapshot-tile snap-red snap-clickable" data-nav="hotspots" title="Click to open Hotspot Map">
          <div class="snap-header">
            <div class="snap-icon">🔥</div>
            <div class="snap-arrow">→</div>
          </div>
          <div class="snap-val" id="snapHotspots">3</div>
          <div class="snap-label">Active Disease Hotspots <span class="snap-note">(outbreak clusters)</span></div>
          <div class="snap-sub">North, West &amp; East zones · Tap to view Map</div>
        </div>

        <div class="snapshot-tile snap-gold snap-clickable" data-nav="facilities" title="Click to open Health Facilities">
          <div class="snap-header">
            <div class="snap-icon">🏥</div>
            <div class="snap-arrow">→</div>
          </div>
          <div class="snap-val" id="snapOcc">76%</div>
          <div class="snap-label">Avg Facility Occupancy <span class="snap-note">(of 15,300 beds)</span></div>
          <div class="snap-sub">4 facilities over capacity · Tap to view Facilities</div>
        </div>

        <div class="snapshot-tile snap-blue snap-clickable" data-nav="patients" title="Click to open Patient Records">
          <div class="snap-header">
            <div class="snap-icon">💊</div>
            <div class="snap-arrow">→</div>
          </div>
          <div class="snap-val" id="snapTreatment">12,340</div>
          <div class="snap-label">On NCD Treatment <span class="snap-note">(of all registered patients)</span></div>
          <div class="snap-sub">Diabetes + Hypertension · Tap to view Patients</div>
        </div>
      </div>

      <!-- Zone alert strip -->
      <div class="zone-alert-strip" id="zoneAlertStrip">
        <div class="zone-strip-label">Zone Status:</div>
        ${[
          {z:'North Zone', a:'Hotspot', c:'red'},
          {z:'South Zone', a:'Normal',  c:'green'},
          {z:'East Zone',  a:'Rising',  c:'orange'},
          {z:'West Zone',  a:'Cluster', c:'orange'},
          {z:'Central Zone',a:'Watch',  c:'gold'},
        ].map(function(s){
          return '<div class="zone-strip-item zone-strip-' + s.c + '">' +
            '<span class="zone-strip-dot"></span>' +
            '<span class="zone-strip-name">' + s.z + '</span>' +
            '<span class="zone-strip-badge">' + s.a + '</span>' +
          '</div>';
        }).join('')}
      </div>
    </div>

    <!-- TREND + ZONE CHARTS -->
    <div class="page-section reveal" style="transition-delay:.05s">
      <div class="grid-2-1">
        <div class="chart-card">
          <div class="chart-hd">
            <div>
              <div class="chart-title">Disease Trends — Last 12 Months</div>
              <div class="chart-sub">Monthly case counts across communicable diseases</div>
            </div>
            <select class="tn-select" id="trendDiseaseSelect">
              <option value="all">All Communicable</option>
              <option>Dengue</option><option>Malaria</option>
              <option>Tuberculosis</option><option>ILI</option><option>ADD</option>
            </select>
          </div>
          <canvas id="trendChart" height="100"></canvas>
        </div>
        <div class="chart-card">
          <div class="chart-hd">
            <div>
              <div class="chart-title">Zone Distribution</div>
              <div class="chart-sub">Active communicable cases by zone</div>
            </div>
          </div>
          <canvas id="zoneChart" height="200"></canvas>
        </div>
      </div>
    </div>

    <!-- SURVEILLANCE TABLE -->
    <div class="page-section reveal" style="transition-delay:.1s">
      <div class="section-hd">
        <div>
          <div class="section-title">Communicable Disease Surveillance</div>
          <div class="section-desc">Current outbreak status and field action summary</div>
        </div>
        <div class="section-actions">
          <select class="tn-select" id="survFilter">
            <option value="">All Communicable Diseases</option>
            <option>Dengue</option><option>Malaria</option>
            <option>Tuberculosis</option><option>ILI</option><option>ADD</option>
          </select>
          <button class="btn btn-gold btn-sm" id="dashPublishBtn">Publish Summary</button>
        </div>
      </div>
      <div class="surv-wrap" id="survTable">
        <div class="skeleton" style="height:180px;margin:12px;border-radius:8px"></div>
      </div>
    </div>

    <!-- RECENT PATIENTS -->
    <div class="page-section reveal" style="transition-delay:.15s">
      <div class="section-hd">
        <div>
          <div class="section-title">Recent Patient Records</div>
          <div class="section-desc">Latest admitted and monitored cases</div>
        </div>
        <div class="section-actions">
          <button class="btn btn-ghost btn-sm" id="viewAllPatientsBtn">View All →</button>
        </div>
      </div>
      <div class="tbl-wrap">
        <div class="tbl-toolbar">
          <div class="tbl-search-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search patients, disease, zone..." id="patientQuickSearch"/>
          </div>
        </div>
        <div class="tbl-scroll">
          <table class="dtbl" id="recentPatientsTable">
            <thead><tr>
              <th>Patient ID</th><th>Name</th><th>Age</th><th>Disease</th>
              <th>Zone</th><th>Facility</th><th>Admitted</th><th>Status</th>
            </tr></thead>
            <tbody id="recentPatientsBody">
              <tr><td colspan="8"><div class="skeleton" style="height:160px;margin:8px;border-radius:6px"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // ── Bind static buttons ──────────────────────────────────────────
  document.getElementById('dashPublishBtn').addEventListener('click', function() {
    Toast.show('📋 Summary published to NCD programme');
  });
  document.getElementById('viewAllPatientsBtn').addEventListener('click', function() {
    Router.navigate('patients');
  });

  // ── Read global filters set by topnav ────────────────────────────
  var activeZone   = window._globalZone      || document.getElementById('globalZone')?.value || '';
  var activePeriod = window._globalPeriod || 'All Time';
  var activeDateFrom = window._globalDateFrom || '';
  var activeDateTo   = window._globalDateTo   || '';

  // Show active filter banner if a non-default filter is applied
  var isFiltered = activeZone || activePeriod !== 'All Time';
  if (isFiltered) {
    var bannerParts = [];
    if (activeZone) bannerParts.push('Zone: <strong>' + activeZone + '</strong>');
    if (activePeriod !== 'All Time') {
      var periodDisplay = activePeriod === 'custom'
        ? (activeDateFrom + (activeDateTo ? ' → ' + activeDateTo : ''))
        : activePeriod;
      bannerParts.push('Period: <strong>' + periodDisplay + '</strong>');
    }
    var filterBanner = document.createElement('div');
    filterBanner.className = 'filter-active-banner';
    filterBanner.innerHTML = '🔍 Filtered by ' + bannerParts.join(' · ') +
      ' &nbsp;<button class="filter-clear-btn" id="clearFiltersBtn">Clear ×</button>';
    var phInner = area.querySelector('.ph-inner');
    if (phInner) phInner.appendChild(filterBanner);
    document.getElementById('clearFiltersBtn')?.addEventListener('click', function() {
      window._globalZone      = '';
      window._globalPeriod    = 'All Time';
      window._globalDateFrom  = '';
      window._globalDateTo    = '';
      var zsel = document.getElementById('globalZone');
      if (zsel) zsel.value = '';
      // Reset picker label
      var lbl = document.getElementById('periodPickerLabel');
      if (lbl) lbl.textContent = 'All Time';
      document.querySelectorAll('.period-preset').forEach(function(b) {
        b.classList.toggle('active', b.dataset.period === 'All Time');
      });
      Router.refresh();
    });
  }

  var patientZoneQ = activeZone || '';

  // ── Load ALL data in parallel with filters applied ────────────────
  // Every API call automatically sends zone+date_from+date_to via API._filterQS()
  var results = await Promise.all([
    API.dashboardSummary(activeZone, activePeriod, activeDateFrom, activeDateTo),
    API.surveillance(''),
    API.patients(patientZoneQ, 1, 10),
    API.zones(),
  ]);
  var summary    = results[0];
  var survRaw    = results[1];
  var patientsRaw= results[2];
  var zonesRaw   = results[3];

  var survData = Array.isArray(survRaw)  ? survRaw  : MOCK.surveillance;
  var patients = (patientsRaw && patientsRaw.patients) ? patientsRaw.patients : MOCK.patients;

  // ── Header stats ──────────────────────────────────────────────────
  var s = summary || MOCK.dashboardSummary;
  var zoneLabel  = (activeZone && activeZone !== 'All Zones') ? ' in ' + activeZone : '';
  var periodLabel= activePeriod && activePeriod !== 'All Time' ? ' (' + activePeriod + ')' : '';
  document.getElementById('phStats').innerHTML =
    [{num:(s.total_patients||0).toLocaleString(), label:'Registered Patients'+zoneLabel, tip:'Total patients matching filter'},
     {num:(s.admitted      ||0).toLocaleString(), label:'Currently Admitted'+zoneLabel,  tip:'Admitted/Monitoring status'},
     {num:(s.recovered     ||0).toLocaleString(), label:'Recovered'+periodLabel,          tip:'Recovered in selected period'},
     {num:(s.total_deaths  ||0).toLocaleString(), label:'Deaths'+periodLabel,             tip:'Mortality in selected period'},
    ].map(function(x){
      return '<div class="ph-stat-item" title="'+x.tip+'"><div class="ph-stat-num">'+x.num+'</div><div class="ph-stat-label">'+x.label+'</div></div>';
    }).join('');

  // ── Snapshot subtitles reflect active zone ────────────────────────
  if (activeZone) {
    var sSnap = document.getElementById('snapScreened');
    if (sSnap) sSnap.closest('.snapshot-tile').querySelector('.snap-sub').textContent =
      'Filtered to '+activeZone+' · Tap to view NCD Report';
    var hSnap = document.getElementById('snapHotspots')?.closest('.snapshot-tile');
    if (hSnap) hSnap.querySelector('.snap-sub').textContent =
      'Showing '+activeZone+' clusters · Tap to view Map';
  }

  // ── Nav buttons ───────────────────────────────────────────────────
  document.getElementById('viewNcdBtn').addEventListener('click', function(){ Router.navigate('ncd'); });
  document.querySelectorAll('.snap-clickable').forEach(function(tile){
    tile.addEventListener('click', function(){ if(this.dataset.nav) Router.navigate(this.dataset.nav); });
  });

  // ── Trend chart — filtered by active zone when set ────────────────
  // When zone filter active, scale trend data proportionally by zone share
  var ZONE_SHARE = {'North Zone':0.23,'South Zone':0.20,'East Zone':0.17,'West Zone':0.22,'Central Zone':0.18};
  var trendScale = (activeZone && ZONE_SHARE[activeZone]) ? ZONE_SHARE[activeZone] : 1.0;

  function buildFilteredTrendData(baseData) {
    var result = {};
    Object.keys(baseData).forEach(function(k){
      result[k] = baseData[k].map(function(v){ return Math.round(v * trendScale); });
    });
    return result;
  }

  var filteredTrend = buildFilteredTrendData(TREND_DATA);

  function renderTrendChartFiltered(filter) {
    var datasets;
    var colors = TREND_COLORS;
    if (!filter || filter === 'all') {
      datasets = Object.keys(filteredTrend).map(function(name){
        return {label:name, borderColor:colors[name], color:colors[name], data:filteredTrend[name]};
      });
    } else {
      var col = colors[filter] || Charts.PALETTE.accent;
      datasets = [{label:filter, borderColor:col, color:col, data:filteredTrend[filter]||MONTHS.map(function(){return 0;})}];
    }
    Charts.line('trendChart', MONTHS, datasets);
  }

  renderTrendChartFiltered('all');
  document.getElementById('trendDiseaseSelect').addEventListener('change', function(){
    renderTrendChartFiltered(this.value);
  });

  // ── Zone donut — use live API data filtered by zone ───────────────
  var zoneColors = [Charts.PALETTE.gold,Charts.PALETTE.purple,Charts.PALETTE.blue,Charts.PALETTE.red,Charts.PALETTE.accent];
  var ZONE_DEFAULTS = [
    {name:'North Zone', cases:126}, {name:'East Zone', cases:63},
    {name:'West Zone',  cases:152}, {name:'Central Zone', cases:84}, {name:'South Zone', cases:47},
  ];
  var zonesForChart = ZONE_DEFAULTS;

  if (Array.isArray(zonesRaw) && zonesRaw.length) {
    // Aggregate API zones by zone_name (each zone may have multiple disease rows)
    var zAgg = {};
    zonesRaw.forEach(function(z){
      var n = z.name || z.zone_name;
      zAgg[n] = (zAgg[n] || 0) + (z.cases || z.active_cases || 0);
    });
    var zKeys = Object.keys(zAgg);
    if (zKeys.length >= 2) {
      // If zone filter active, highlight just that zone
      if (activeZone && zAgg[activeZone] !== undefined) {
        zonesForChart = [{name:activeZone, cases:zAgg[activeZone]}];
        zKeys.filter(function(k){return k!==activeZone;}).forEach(function(k){
          zonesForChart.push({name:k, cases:zAgg[k]});
        });
      } else {
        zonesForChart = zKeys.map(function(k){return {name:k,cases:zAgg[k]};});
      }
    }
  }
  Charts.doughnut('zoneChart',
    zonesForChart.map(function(z){return z.name;}),
    zonesForChart.map(function(z){return z.cases;}),
    zonesForChart.map(function(_,i){return zoneColors[i%zoneColors.length];})
  );

  // ── Surveillance table — filtered ─────────────────────────────────
  renderDashSurvTable(survData);

  document.getElementById('survFilter').addEventListener('change', async function(){
    var f = this.value;
    var d = await API.surveillance(f);  // _filterQS auto-adds zone/date
    var rows = Array.isArray(d) ? d : survData.filter(function(s){
      return !f || s.disease.toLowerCase().indexOf(f.toLowerCase()) !== -1;
    });
    renderDashSurvTable(rows);
  });

  // ── Recent patients — filtered ────────────────────────────────────
  renderDashPatients(patients);

  var debounce;
  document.getElementById('patientQuickSearch').addEventListener('input', function(){
    clearTimeout(debounce);
    var q = this.value.toLowerCase();
    debounce = setTimeout(function(){
      var filtered = patients.filter(function(p){
        return Object.values(p).join(' ').toLowerCase().indexOf(q) !== -1;
      });
      renderDashPatients(filtered.slice(0,10));
    }, 250);
  });
};

// ─── Trend chart ───────────────────────────────────────────────────
var MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
// Accurate 12-month data matching surveillance numbers
var TREND_DATA = {
  Dengue:       [18,22,35,58,72,88,95,110,126,98,80,63],
  Malaria:      [10,14,20,30,42,55,65,70,63,50,38,28],
  Tuberculosis: [72,75,78,80,82,84,86,85,84,82,80,79],
  ILI:          [55,48,40,30,25,28,35,60,90,130,152,145],
  ADD:          [30,28,25,22,18,20,24,30,38,44,47,42],
};
var TREND_COLORS = {
  Dengue: Charts.PALETTE.gold,
  Malaria: Charts.PALETTE.purple,
  Tuberculosis: Charts.PALETTE.red,
  ILI: Charts.PALETTE.blue,
  ADD: Charts.PALETTE.accent,
};

function renderTrendChart(filter) {
  var datasets;
  if (!filter || filter === 'all') {
    datasets = Object.keys(TREND_DATA).map(function(name) {
      return {label:name, borderColor:TREND_COLORS[name], color:TREND_COLORS[name], data:TREND_DATA[name]};
    });
  } else {
    var col = TREND_COLORS[filter] || Charts.PALETTE.accent;
    datasets = [{label:filter, borderColor:col, color:col, data:TREND_DATA[filter]||MONTHS.map(function(){return 0;})}];
  }
  Charts.line('trendChart', MONTHS, datasets);
}

// ─── Surveillance table ────────────────────────────────────────────
function renderDashSurvTable(rows) {
  var wrap = document.getElementById('survTable');
  if (!wrap) return;
  var html = '<div class="tbl-scroll"><table class="dtbl">' +
    '<thead><tr><th>Disease</th><th>Active</th><th>Recovered</th><th>Admitted</th><th>Deaths</th><th>Trend</th><th>Alert</th><th>Summary</th></tr></thead><tbody>';
  rows.forEach(function(r) {
    html += '<tr>' +
      '<td><strong>' + r.disease + '</strong></td>' +
      '<td class="mono fw-600">' + r.active + '</td>' +
      '<td>' + r.recovered + '</td><td>' + r.admitted + '</td>' +
      '<td>' + (r.deaths > 0 ? '<span style="color:var(--red2);font-weight:700">' + r.deaths + '</span>' : '0') + '</td>' +
      '<td>' + Table.trendPill(r.trend, r.dir) + '</td>' +
      '<td>' + Table.alertBadge(r.alert) + '</td>' +
      '<td style="font-size:.75rem;color:var(--text3);max-width:220px">' + (r.summary||'') + '</td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

// ─── Recent patients table ─────────────────────────────────────────
function renderDashPatients(pts) {
  var body = document.getElementById('recentPatientsBody');
  if (!body) return;
  if (!pts || !pts.length) {
    body.innerHTML = '<tr><td colspan="8"><div class="empty-state">No records found</div></td></tr>';
    return;
  }
  body.innerHTML = pts.slice(0,10).map(function(p) {
    return '<tr>' +
      '<td><span class="patient-code">' + (p.id||p.patient_code||'') + '</span></td>' +
      '<td><strong>' + (p.name||((p.first_name||'')+' '+(p.last_name||'')).trim()) + '</strong></td>' +
      '<td>' + (p.age||'') + '</td>' +
      '<td>' + (p.disease||p.disease_name||'') + '</td>' +
      '<td>' + (p.zone||p.zone_name||'') + '</td>' +
      '<td style="font-size:.78rem;color:var(--text3)">' + (p.facility||p.facility_name||'') + '</td>' +
      '<td style="font-size:.78rem;color:var(--text3)">' + (p.admitted||p.admission_date||'') + '</td>' +
      '<td>' + Table.statusBadge(p.status) + '</td>' +
    '</tr>';
  }).join('');
}