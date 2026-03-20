/* ═══════════════════════════════════════════════════════════
   ncd.js  —  All page definitions (ncd, surveillance,
               hotspots, facilities, patients, settings)
   
   KEY RULE: Never put regex, JSON.stringify, or complex
   expressions inside onclick="..." HTML attributes inside
   template literals — use data-* attributes + addEventListener
   instead. This file is syntax-verified clean.
   ═══════════════════════════════════════════════════════════ */
'use strict';
window.Pages = window.Pages || {};

/* ─────────────────────────────────────────────────────────
   NCD PROGRAMME
   ───────────────────────────────────────────────────────── */
Pages.ncd = async function(area) {
  area.innerHTML = `
    <div class="page-header fade-in">
      <div class="ph-inner">
        <h1 class="ph-title">NCD Programme Report</h1>
        <p class="ph-sub">National non-communicable disease indicators, screening coverage &amp; programme summary</p>
      </div>
    </div>

    <div class="page-section reveal">
      <div class="section-hd">
        <div>
          <div class="section-title">Programme Overview</div>
          <div class="section-desc">All NCD indicators this month</div>
        </div>
        <div class="section-actions">
          <select class="tn-select" id="ncdZoneFilter">
            <option value="">All Zones</option>
            <option>North Zone</option><option>South Zone</option>
            <option>East Zone</option><option>West Zone</option><option>Central Zone</option>
          </select>
          <div class="view-toggle">
            <button class="vt-btn active" data-nv="card">Card</button>
            <button class="vt-btn" data-nv="list">List</button>
            <button class="vt-btn" data-nv="chart">Chart</button>
          </div>
          <button class="btn btn-primary btn-sm" id="ncdDownloadBtn">Download</button>
        </div>
      </div>

      <div id="ncdCardView">
        <div class="ncd-grid" id="ncdPageGrid">
          ${[0,1,2,3,4,5].map(i => `<div class="stat-card skeleton" style="height:120px;animation-delay:${i * 0.06}s"></div>`).join('')}
        </div>
      </div>

      <div id="ncdListView" style="display:none">
        <div class="tbl-wrap"><div class="tbl-scroll">
          <table class="dtbl">
            <thead><tr><th>Disease</th><th>Total Cases</th><th>Zone</th><th>Trend</th><th>Alert</th></tr></thead>
            <tbody id="ncdListBody"></tbody>
          </table>
        </div></div>
      </div>

      <div id="ncdChartView" style="display:none">
        <div class="chart-card"><canvas id="ncdOverviewChart" height="90"></canvas></div>
      </div>
    </div>

    <div class="page-section reveal" style="transition-delay:.06s">
      <div class="section-hd"><div><div class="section-title">Programme Highlights</div></div></div>
      <div class="ncd-detail-grid">
        <div class="ncd-highlight">
          <div class="ncd-hl-val">45,292</div>
          <div class="ncd-hl-label">Total NCD screenings this quarter</div>
        </div>
        <div class="ncd-highlight" style="background:linear-gradient(135deg,rgba(45,127,212,.1),rgba(45,127,212,.04));border-color:rgba(45,127,212,.2)">
          <div class="ncd-hl-val" style="color:var(--blue2)">78.4%</div>
          <div class="ncd-hl-label">Hypertension control rate</div>
        </div>
        <div class="ncd-highlight" style="background:linear-gradient(135deg,rgba(224,152,24,.1),rgba(224,152,24,.04));border-color:rgba(224,152,24,.2)">
          <div class="ncd-hl-val" style="color:var(--gold2)">12,340</div>
          <div class="ncd-hl-label">Patients on diabetes medication</div>
        </div>
        <div class="ncd-highlight" style="background:linear-gradient(135deg,rgba(106,77,200,.1),rgba(106,77,200,.04));border-color:rgba(106,77,200,.2)">
          <div class="ncd-hl-val" style="color:var(--purple2)">6,022</div>
          <div class="ncd-hl-label">Cancer early detections this year</div>
        </div>
      </div>
    </div>

    <div class="page-section reveal" style="transition-delay:.1s">
      <div class="section-hd"><div><div class="section-title">Screening Coverage by Zone</div></div></div>
      <div class="chart-card"><canvas id="ncdBarChart" height="80"></canvas></div>
    </div>

    <div class="page-section reveal" style="transition-delay:.14s">
      <div class="section-hd"><div><div class="section-title">Detailed Summary Table</div></div></div>
      <div class="tbl-wrap"><div class="tbl-scroll">
        <table class="dtbl">
          <thead><tr>
            <th>Disease</th><th>Screened</th><th>Diagnosed</th>
            <th>On Treatment</th><th>Controlled</th><th>Coverage</th><th>Trend</th>
          </tr></thead>
          <tbody id="ncdSummaryBody"></tbody>
        </table>
      </div></div>
    </div>
  `;

  // Summary table data (static reference data)
  const SUMMARY = [
    {d:'Diabetes',           s:'18,420', dx:'12,840', tx:'12,340', ctrl:'9,880',  cov:89, t:'+6%', dir:'up'},
    {d:'Hypertension',       s:'22,100', dx:'15,220', tx:'14,800', ctrl:'11,590', cov:78, t:'+4%', dir:'up'},
    {d:'Oral Cancer',        s:'9,800',  dx:'4,210',  tx:'3,990',  ctrl:'—',      cov:95, t:'-2%', dir:'down'},
    {d:'Breast Cancer',      s:'8,400',  dx:'3,118',  tx:'2,980',  ctrl:'—',      cov:96, t:'+1%', dir:'up'},
    {d:'Cervical Cancer',    s:'7,600',  dx:'2,904',  tx:'2,750',  ctrl:'—',      cov:95, t:'-3%', dir:'down'},
    {d:'Cardiovascular',     s:'14,200', dx:'8,760',  tx:'8,100',  ctrl:'5,940',  cov:73, t:'+8%', dir:'up'},
  ];
  document.getElementById('ncdSummaryBody').innerHTML = SUMMARY.map(function(r) {
    return '<tr>' +
      '<td><strong>' + r.d + '</strong></td>' +
      '<td class="mono">' + r.s + '</td>' +
      '<td class="mono">' + r.dx + '</td>' +
      '<td class="mono">' + r.tx + '</td>' +
      '<td class="mono">' + r.ctrl + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:8px">' +
        '<div class="progress-bar" style="width:70px"><div class="progress-fill" style="width:' + r.cov + '%;background:var(--accent)"></div></div>' +
        '<span class="fs-xs">' + r.cov + '%</span></div></td>' +
      '<td>' + Table.trendPill(r.t, r.dir) + '</td>' +
    '</tr>';
  }).join('');

  // Load data
  var raw   = await API.ncdStats('', '');
  var cards = Array.isArray(raw) ? raw : MOCK.ncdCards;

  function renderCards(data) {
    document.getElementById('ncdPageGrid').innerHTML = data.map(function(c, i) {
      return '<div class="stat-card ' + (c.color || 'green') + ' ncd-stat-card"' +
        ' style="animation:fadeUp .4s var(--ease) ' + (i * 0.06) + 's both;cursor:pointer;"' +
        ' data-page="surveillance">' +
        '<div class="stat-label">' + (c.label || c.disease_name || '') + '</div>' +
        '<div class="stat-val">' + (c.value || (c.total_cases || 0).toLocaleString()) + '</div>' +
        '<div class="stat-sub">' + (c.sub || 'Total cases') + '</div>' +
        '<div class="stat-meta">' +
          '<span class="stat-zone">' + (c.zone || c.primary_zone || 'All Zones') + '</span>' +
          '<span class="stat-trend ' + (c.dir || 'up') + '">' + (c.trend || '+0%') + '</span>' +
        '</div></div>';
    }).join('');
    // Attach click events (no inline onclick needed)
    document.querySelectorAll('.ncd-stat-card').forEach(function(el) {
      el.addEventListener('click', function() { Router.navigate('surveillance'); });
    });
  }

  function renderList(data) {
    document.getElementById('ncdListBody').innerHTML = data.map(function(c) {
      return '<tr>' +
        '<td><strong>' + (c.label || c.disease_name || '') + '</strong></td>' +
        '<td class="mono fw-600">' + (c.value || (c.total_cases || 0).toLocaleString()) + '</td>' +
        '<td>' + (c.zone || c.primary_zone || 'All Zones') + '</td>' +
        '<td>' + Table.trendPill(c.trend || '+0%', c.dir || 'up') + '</td>' +
        '<td>' + Table.alertBadge(c.alert || 'Normal') + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderChart(data) {
    var labels = data.map(function(c) {
      return (c.label || c.disease_name || '').split(' ').slice(0, 2).join(' ');
    });
    var values = data.map(function(c) {
      var v = String(c.value || c.total_cases || '0').replace(/,/g, '');
      return parseInt(v, 10) || 0;
    });
    var colors = [
      Charts.PALETTE.accent, Charts.PALETTE.blue, Charts.PALETTE.gold,
      Charts.PALETTE.red, Charts.PALETTE.purple, Charts.PALETTE.orange
    ];
    Charts.bar('ncdOverviewChart', labels, [{
      label: 'Cases',
      data: values,
      backgroundColor: colors.map(function(c) { return c + 'cc'; })
    }]);
  }

  renderCards(cards);
  renderList(cards);

  // View toggle
  document.querySelectorAll('[data-nv]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-nv]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var v = btn.dataset.nv;
      document.getElementById('ncdCardView').style.display  = v === 'card'  ? '' : 'none';
      document.getElementById('ncdListView').style.display  = v === 'list'  ? '' : 'none';
      document.getElementById('ncdChartView').style.display = v === 'chart' ? '' : 'none';
      if (v === 'chart') { setTimeout(function() { renderChart(cards); }, 50); }
    });
  });

  // Zone filter
  document.getElementById('ncdZoneFilter').addEventListener('change', async function() {
    var z = this.value;
    var d = await API.ncdStats(z, '');
    var filtered = Array.isArray(d) ? d : cards.filter(function(c) {
      return !z || c.zone === z || c.primary_zone === z;
    });
    renderCards(filtered);
    renderList(filtered);
  });

  document.getElementById('ncdDownloadBtn').addEventListener('click', function() {
    Toast.show('📥 NCD Report downloaded');
  });

  // Zone bar chart
  Charts.bar('ncdBarChart',
    ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'],
    [
      {label:'Diabetes',    data:[3200,2800,1900,2600,2340], backgroundColor: Charts.PALETTE.accent + 'cc'},
      {label:'Hypertension',data:[4100,3600,2400,3200,2920], backgroundColor: Charts.PALETTE.blue   + 'cc'},
      {label:'Cancer',      data:[1800,1600,1100,1500,1200], backgroundColor: Charts.PALETTE.gold   + 'cc'},
    ]
  );
};

/* ─────────────────────────────────────────────────────────
   SURVEILLANCE
   ───────────────────────────────────────────────────────── */
Pages.surveillance = async function(area) {
  area.innerHTML = `
    <div class="page-header fade-in">
      <div class="ph-inner">
        <h1 class="ph-title">Communicable Disease Surveillance</h1>
        <p class="ph-sub">Real-time outbreak monitoring, zone alerts, and field action tracking</p>
      </div>
    </div>

    <div class="page-section reveal">
      <div class="alert-banner">
        <div class="alert-banner-dot"></div>
        <div class="alert-banner-text">
          <strong>3 Active Hotspots</strong> — North Zone (Dengue +34%), West Zone (ILI +18%), East Zone (Malaria +11%)
        </div>
        <button class="btn btn-danger btn-sm" id="survViewMapBtn">View Map →</button>
      </div>

      <div class="section-hd">
        <div><div class="section-title">Disease Line Listing</div></div>
        <div class="section-actions">
          <select class="tn-select" id="survPageFilter">
            <option value="">All Diseases</option>
            <option>Dengue</option><option>Malaria</option>
            <option>Tuberculosis</option><option>ILI</option><option>ADD</option>
          </select>
          <button class="btn btn-gold btn-sm" id="publishBtnSurv">Publish Summary</button>
          <button class="btn btn-ghost btn-sm" id="survExportBtn">Export</button>
        </div>
      </div>
      <div class="surv-wrap" id="survPageTable"></div>
    </div>

    <div class="page-section reveal" style="transition-delay:.06s">
      <div class="section-hd"><div><div class="section-title">7-Day Case Trend</div></div></div>
      <div class="chart-card"><canvas id="survTrendChart" height="80"></canvas></div>
    </div>

    <div class="page-section reveal" style="transition-delay:.1s">
      <div class="section-hd">
        <div>
          <div class="section-title">Zone Alert Summary</div>
          <div class="section-desc">Tap a zone card to see disease breakdown</div>
        </div>
      </div>
      <div class="grid-zone-summary" id="zoneAlertGrid"></div>
    </div>
  `;

  // Button events (no inline onclick)
  document.getElementById('survViewMapBtn').addEventListener('click', function() {
    Router.navigate('hotspots');
  });
  document.getElementById('publishBtnSurv').addEventListener('click', function() {
    Toast.show('📋 Summary published to programme');
  });
  document.getElementById('survExportBtn').addEventListener('click', function() {
    Toast.show('📥 Surveillance report downloaded');
  });

  var data = await API.surveillance('');
  var surv = Array.isArray(data) ? data : MOCK.surveillance;
  renderSurvTable(surv, 'survPageTable');

  var zones = await API.zones();
  var zdata = Array.isArray(zones) ? zones : MOCK.zones;
  renderZoneCards('zoneAlertGrid', zdata);

  Charts.line('survTrendChart',
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    [
      {label:'Dengue',  borderColor: Charts.PALETTE.gold,   color: Charts.PALETTE.gold,   data:[14,18,21,19,24,22,26]},
      {label:'Malaria', borderColor: Charts.PALETTE.purple, color: Charts.PALETTE.purple, data:[6,8,7,9,8,11,10]},
      {label:'ILI',     borderColor: Charts.PALETTE.blue,   color: Charts.PALETTE.blue,   data:[20,24,28,22,30,26,32]},
    ]
  );

  document.getElementById('survPageFilter').addEventListener('change', async function() {
    var f = this.value;
    var d = await API.surveillance(f);
    var rows = Array.isArray(d) ? d : surv.filter(function(s) {
      return !f || s.disease.toLowerCase().indexOf(f.toLowerCase()) !== -1;
    });
    renderSurvTable(rows, 'survPageTable');
  });
};

function renderSurvTable(rows, containerId) {
  var wrap = document.getElementById(containerId);
  if (!wrap) return;
  var html = '<div class="tbl-scroll"><table class="dtbl">' +
    '<thead><tr>' +
      '<th>Disease</th><th>Active/Open</th><th>Recovered</th>' +
      '<th>Admitted</th><th>Deaths</th><th>Trend</th><th>Alert</th><th>Summary</th>' +
    '</tr></thead><tbody>';
  rows.forEach(function(r) {
    html += '<tr>' +
      '<td><strong>' + r.disease + '</strong></td>' +
      '<td><span class="mono fw-600">' + r.active + '</span></td>' +
      '<td>' + r.recovered + '</td>' +
      '<td>' + r.admitted + '</td>' +
      '<td>' + (r.deaths > 0 ? '<span style="color:var(--red2);font-weight:700">' + r.deaths + '</span>' : '0') + '</td>' +
      '<td>' + Table.trendPill(r.trend, r.dir) + '</td>' +
      '<td>' + Table.alertBadge(r.alert) + '</td>' +
      '<td style="font-size:.75rem;color:var(--text3);max-width:240px">' + r.summary + '</td>' +
    '</tr>';
  });
  html += '</tbody></table></div>';
  wrap.innerHTML = html;
}

// Zone expand cards — 5 zones only, expand/collapse on tap
// Uses data-zone attribute instead of inline onclick to avoid escaping issues
function renderZoneCards(containerId, zones) {
  var el = document.getElementById(containerId);
  if (!el) return;

  // Build zone→dominant disease map
  var zoneMap = {};
  zones.forEach(function(z) {
    var name = z.name || z.zone_name;
    var cases = z.cases || z.active_cases || 0;
    if (!zoneMap[name] || cases > (zoneMap[name].cases || 0)) {
      zoneMap[name] = z;
    }
  });

  var ZONE_NAMES = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];
  var ZONE_DISEASES = {
    'North Zone':   [{d:'Dengue',c:126,a:'Hotspot'},{d:'Malaria',c:42,a:'Rising'},{d:'ILI',c:38,a:'Watch'},{d:'Typhoid',c:14,a:'Normal'}],
    'South Zone':   [{d:'Acute Diarrheal Disease',c:47,a:'Normal'},{d:'Hepatitis A',c:22,a:'Normal'},{d:'Cholera',c:8,a:'Normal'}],
    'East Zone':    [{d:'Malaria',c:63,a:'Rising'},{d:'Tuberculosis',c:28,a:'Watch'},{d:'Dengue',c:19,a:'Watch'}],
    'West Zone':    [{d:'Influenza-like Illness',c:152,a:'Cluster'},{d:'Dengue',c:34,a:'Watch'},{d:'ADD',c:27,a:'Normal'}],
    'Central Zone': [{d:'Tuberculosis',c:84,a:'Watch'},{d:'Typhoid',c:34,a:'Watch'},{d:'Dengue',c:22,a:'Normal'}],
  };

  var ALERT_COLORS = {
    Hotspot: 'var(--red)', Rising: 'var(--orange)', Cluster: 'var(--orange)',
    Watch: 'var(--gold)', Normal: 'var(--accent)'
  };
  var ALERT_BADGE = {
    Hotspot: 'badge-red', Rising: 'badge-orange', Cluster: 'badge-orange',
    Watch: 'badge-gold', Normal: 'badge-green'
  };

  var html = '';
  ZONE_NAMES.forEach(function(name) {
    var z = zoneMap[name] || {cases:0, alert:'Normal', delta:'+0%', dir:'up', disease:'—'};
    var alert = z.alert || z.alert_status || 'Normal';
    var alertBadge = '<span class="badge ' + (ALERT_BADGE[alert] || 'badge-green') + '">' + alert + '</span>';
    var diseases = ZONE_DISEASES[name] || [];
    var zoneId = name.replace(/ /g, '-');

    var diseasesHtml = '';
    diseases.forEach(function(d) {
      diseasesHtml +=
        '<div class="zone-disease-row">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<div style="width:8px;height:8px;border-radius:50%;background:' + (ALERT_COLORS[d.a] || 'var(--accent)') + ';flex-shrink:0"></div>' +
            '<span style="font-size:.82rem;font-weight:500">' + d.d + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span class="mono fw-600" style="font-size:.82rem">' + d.c + '</span>' +
            Table.alertBadge(d.a) +
          '</div>' +
        '</div>';
    });

    html +=
      '<div class="zone-expand-card" id="zcard-' + zoneId + '">' +
        '<div class="zone-expand-header" data-zone="' + zoneId + '">' +
          '<div>' +
            '<div class="zone-name-txt">' + name + '</div>' +
            '<div class="zone-disease-txt">' + (z.disease || z.top_disease || 'Multiple diseases') + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px">' +
            alertBadge +
            '<div style="text-align:right">' +
              '<div class="zone-cases-num">' + (z.cases || z.active_cases || 0).toLocaleString() + '</div>' +
              '<div class="zone-delta ' + (z.dir || 'up') + '" style="font-size:.72rem;font-weight:700">' + (z.delta || '+0%') + '</div>' +
            '</div>' +
            '<svg class="zone-expand-arrow" id="zarrow-' + zoneId + '" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</div>' +
        '</div>' +
        '<div class="zone-expand-body" id="zbody-' + zoneId + '">' +
          '<div class="zone-disease-list">' + diseasesHtml + '</div>' +
          '<button class="btn btn-ghost btn-sm surv-map-btn" style="margin-top:10px;width:100%">View Hotspot Map →</button>' +
        '</div>' +
      '</div>';
  });

  el.innerHTML = html;

  // Attach expand/collapse events via addEventListener (no inline onclick)
  el.querySelectorAll('.zone-expand-header').forEach(function(header) {
    header.addEventListener('click', function() {
      var zoneId = this.dataset.zone;
      var body  = document.getElementById('zbody-' + zoneId);
      var arrow = document.getElementById('zarrow-' + zoneId);
      if (!body) return;
      var isOpen = body.classList.toggle('open');
      if (arrow) arrow.style.transform = isOpen ? 'rotate(180deg)' : '';
    });
  });

  // Hotspot map buttons inside zone cards
  el.querySelectorAll('.surv-map-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      Router.navigate('hotspots');
    });
  });
}

/* ─────────────────────────────────────────────────────────
   HOTSPOTS
   ───────────────────────────────────────────────────────── */
// Zone detail data for popup
var ZONE_DETAIL = {
  'North Zone': {
    alert:'Hotspot', totalCases:126, facilities:['Sion Hospital','Shatabdi Hospital','PHC Dharavi'],
    diseases:[{d:'Dengue',c:126,a:'Hotspot'},{d:'Malaria',c:42,a:'Rising'},{d:'ILI',c:38,a:'Watch'},{d:'Typhoid',c:14,a:'Normal'}],
    recentPts:[{id:'P-00412',name:'Anjali Sharma',age:42,disease:'Dengue',status:'Admitted'},{id:'P-00418',name:'Kavita Rao',age:36,disease:'Dengue',status:'Recovered'},{id:'P-00422',name:'Sneha Patil',age:29,disease:'Dengue',status:'Recovered'},{id:'P-00427',name:'Tejas Mehta',age:19,disease:'ILI',status:'Recovered'}],
    lat:19.18, lng:72.85,
  },
  'South Zone': {
    alert:'Normal', totalCases:47, facilities:['Kasturba Hospital','GT Hospital','Tata Memorial Hospital','Breach Candy Hospital'],
    diseases:[{d:'Acute Diarrheal Disease',c:47,a:'Normal'},{d:'Hepatitis A',c:22,a:'Normal'},{d:'Cholera',c:8,a:'Normal'},{d:'Cardiovascular Disease',c:60,a:'Normal'}],
    recentPts:[{id:'P-00417',name:'Suresh Joshi',age:48,disease:'Diabetes',status:'Admitted'},{id:'P-00423',name:'Vikram Desai',age:60,disease:'Cardiovascular Disease',status:'Admitted'},{id:'P-00424',name:'Priya Kulkarni',age:34,disease:'Breast Cancer',status:'Monitoring'}],
    lat:18.96, lng:72.83,
  },
  'East Zone': {
    alert:'Rising', totalCases:63, facilities:['Sion Hospital','Rajawadi Hospital','PHC Govandi','PHC Kurla','CHC Ghatkopar'],
    diseases:[{d:'Malaria',c:63,a:'Rising'},{d:'Tuberculosis',c:28,a:'Watch'},{d:'Dengue',c:19,a:'Watch'},{d:'Leptospirosis',c:8,a:'Normal'}],
    recentPts:[{id:'P-00414',name:'Pooja Iyer',age:31,disease:'Malaria',status:'Recovered'},{id:'P-00420',name:'Fatima Khan',age:38,disease:'Malaria',status:'Admitted'},{id:'P-00425',name:'Mohammad Shaikh',age:45,disease:'Tuberculosis',status:'Admitted'},{id:'P-00430',name:'Sita Yadav',age:66,disease:'Cardiovascular Disease',status:'Monitoring'}],
    lat:19.08, lng:72.92,
  },
  'West Zone': {
    alert:'Cluster', totalCases:152, facilities:['Nair Hospital','Cooper Hospital','Lilavati Hospital','Hinduja Hospital','Kokilaben Hospital'],
    diseases:[{d:'Influenza-like Illness',c:152,a:'Cluster'},{d:'Dengue',c:34,a:'Watch'},{d:'Acute Diarrheal Disease',c:27,a:'Normal'},{d:'Hypertension',c:85,a:'Normal'}],
    recentPts:[{id:'P-00415',name:'Dilip Nair',age:55,disease:'Hypertension',status:'Discharged'},{id:'P-00416',name:'Meena Patel',age:27,disease:'ILI',status:'Monitoring'},{id:'P-00421',name:'Harish Dubey',age:52,disease:'COPD',status:'Monitoring'},{id:'P-00426',name:'Rekha Jain',age:58,disease:'Diabetes',status:'Discharged'}],
    lat:19.10, lng:72.83,
  },
  'Central Zone': {
    alert:'Watch', totalCases:84, facilities:['KEM Hospital','GT Hospital','Kasturba Hospital','Bombay Hospital','Dispensary Dadar'],
    diseases:[{d:'Tuberculosis',c:84,a:'Watch'},{d:'Typhoid',c:34,a:'Watch'},{d:'Dengue',c:22,a:'Normal'},{d:'Diabetes',c:120,a:'Normal'}],
    recentPts:[{id:'P-00413',name:'Ravi Mehta',age:65,disease:'Tuberculosis',status:'Monitoring'},{id:'P-00419',name:'Arjun Singh',age:22,disease:'Typhoid',status:'Admitted'},{id:'P-00428',name:'Ananya Ghosh',age:43,disease:'Hypertension',status:'Discharged'}],
    lat:19.02, lng:72.85,
  },
};

// All hotspot coordinates are verified within Mumbai city limits:
// Lat: 18.89–19.27 (land only), Lng: 72.77–73.00
var HOTSPOTS_ACCURATE = [
  {name:'Dharavi',         zone:'Central Zone', disease:'Tuberculosis',           count:44, lat:19.0412, lng:72.8525, severity:'High',   desc:'High density area; prolonged treatment follow-up.'},
  {name:'Kurla',           zone:'East Zone',    disease:'Dengue',                 count:38, lat:19.0726, lng:72.8843, severity:'High',   desc:'Vector-borne case spike; breeding-site response pending.'},
  {name:'Malad West',      zone:'West Zone',    disease:'Influenza-like Illness', count:52, lat:19.1874, lng:72.8479, severity:'Medium', desc:'Outpatient respiratory cluster increasing.'},
  {name:'Govandi',         zone:'East Zone',    disease:'Acute Diarrheal Disease',count:21, lat:19.0614, lng:72.9100, severity:'Low',    desc:'Water sanitation follow-up underway.'},
  {name:'Andheri',         zone:'West Zone',    disease:'Malaria',                count:17, lat:19.1136, lng:72.8697, severity:'Medium', desc:'Breeding sites identified; spraying scheduled.'},
  {name:'Bandra',          zone:'West Zone',    disease:'Dengue',                 count:29, lat:19.0596, lng:72.8366, severity:'High',   desc:'High-density residential area.'},
  {name:'Worli',           zone:'South Zone',   disease:'Typhoid',                count:12, lat:18.9994, lng:72.8154, severity:'Low',    desc:'Cluster near water supply area.'},
  {name:'Chembur',         zone:'East Zone',    disease:'Influenza-like Illness', count:33, lat:19.0508, lng:72.9014, severity:'Medium', desc:'ILI spike in residential colony.'},
  {name:'Borivali',        zone:'North Zone',   disease:'Dengue',                 count:24, lat:19.2317, lng:72.8567, severity:'Medium', desc:'Breeding sites near Sanjay Gandhi park boundary.'},
  {name:'Ghatkopar',       zone:'East Zone',    disease:'Tuberculosis',           count:18, lat:19.0858, lng:72.9081, severity:'Medium', desc:'TB defaulter tracking in progress.'},
  {name:'Sion',            zone:'Central Zone', disease:'Malaria',                count:22, lat:19.0412, lng:72.8605, severity:'Medium', desc:'Monsoon breeding sites cleared.'},
  {name:'Colaba',          zone:'South Zone',   disease:'Chikungunya',            count:8,  lat:18.9067, lng:72.8147, severity:'Low',    desc:'Seasonal chikungunya cases.'},
];

Pages.hotspots = async function(area) {
  area.innerHTML = `
    <div class="page-header fade-in">
      <div class="ph-inner">
        <h1 class="ph-title">Hotspot Map &amp; Outbreak Tracking</h1>
        <p class="ph-sub">Tap any cluster marker or zone boundary to view complete zone detail with patient &amp; disease breakdown</p>
      </div>
    </div>

    <div class="page-section" style="padding:0">
      <div class="map-filter-bar">
        <select class="tn-select" id="hsZoneFilter">
          <option value="">All Zones</option><option>North Zone</option><option>South Zone</option>
          <option>East Zone</option><option>West Zone</option><option>Central Zone</option>
        </select>
        <select class="tn-select" id="hsDiseaseFilter">
          <option value="">All Diseases</option><option>Dengue</option><option>Malaria</option>
          <option>Tuberculosis</option><option>ILI</option><option>ADD</option>
        </select>
        <select class="tn-select" id="hsSeverityFilter">
          <option value="">All Severity</option><option>Critical</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <div style="margin-left:auto;display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" id="liveMapBtn" style="display:flex;align-items:center;gap:6px">
            <span style="width:7px;height:7px;background:var(--red);border-radius:50%;animation:pulseDot 1.5s infinite;display:inline-block"></span>Live
          </button>
          <button class="btn btn-primary btn-sm" id="hsExportBtn">Export</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 300px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--bg2)">
        <div style="position:relative">
          <div id="mainMap" style="width:100%;height:540px;"></div>
          <div class="map-legend">
            <div style="font-size:.65rem;font-weight:700;color:var(--text3);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em">Disease</div>
            <div class="legend-row"><div class="legend-dot" style="background:#f06060"></div><span>Tuberculosis</span></div>
            <div class="legend-row"><div class="legend-dot" style="background:#e09818"></div><span>Dengue</span></div>
            <div class="legend-row"><div class="legend-dot" style="background:#9070e0"></div><span>Malaria</span></div>
            <div class="legend-row"><div class="legend-dot" style="background:#50a0f0"></div><span>ILI</span></div>
            <div class="legend-row"><div class="legend-dot" style="background:#11b892"></div><span>ADD / Other</span></div>
          </div>
        </div>
        <div style="background:var(--bg2);border-left:1px solid var(--border);display:flex;flex-direction:column;height:540px">
          <div style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:.74rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;flex-shrink:0;background:var(--bg3)">
            Active Clusters <span style="float:right;font-weight:400;text-transform:none;color:var(--accent2)">tap to focus</span>
          </div>
          <div id="clusterSidebar" style="overflow-y:auto;flex:1"></div>
        </div>
      </div>
    </div>

    <div class="page-section reveal" style="transition-delay:.05s">
      <div class="section-hd">
        <div><div class="section-title">Zone Summary</div><div class="section-desc">Tap a zone card to open full detail</div></div>
      </div>
      <div class="grid-zone-summary" id="hsZoneCards"></div>
    </div>
  `;

  document.getElementById('liveMapBtn').addEventListener('click', function() {
    Toast.show('🔴 Live surveillance mode active', 'info');
  });
  document.getElementById('hsExportBtn').addEventListener('click', function() {
    Toast.show('📥 Hotspot report exported');
  });

  // Use accurate Mumbai-bounded hotspots (not random DB coords)
  var hs = HOTSPOTS_ACCURATE;

  // Filter logic
  var activeHs = hs.slice();
  function applyFilters() {
    var zf = document.getElementById('hsZoneFilter').value;
    var df = document.getElementById('hsDiseaseFilter').value;
    var sf = document.getElementById('hsSeverityFilter').value;
    activeHs = hs.filter(function(c) {
      return (!zf || (c.zone||'').indexOf(zf) !== -1) &&
             (!df || c.disease.indexOf(df) !== -1) &&
             (!sf || c.severity === sf);
    });
    rebuildMap();
  }
  ['hsZoneFilter','hsDiseaseFilter','hsSeverityFilter'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  // Render sidebar and zone cards first (they don't need the map)
  renderClusterSidebar(hs);
  renderHsZoneCards();

  // Init map using double-rAF so the container is fully painted before Leaflet measures it
  var map = null;
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var mapEl = document.getElementById('mainMap');
      if (!mapEl) return;

      map = L.map('mainMap', {
        center: [19.076, 72.8777],
        zoom: 12,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18, opacity: 0.9,
      }).addTo(map);

      var DISEASE_COLORS = {
        'Tuberculosis':'#f06060', 'Dengue':'#e09818', 'Malaria':'#9070e0',
        'Influenza-like Illness':'#50a0f0', 'ILI':'#50a0f0',
        'Acute Diarrheal Disease':'#11b892', 'ADD':'#11b892',
        'Typhoid':'#f0a840', 'Chikungunya':'#c060c0', 'Leptospirosis':'#40c0a0',
      };
      var ZONE_POLYGONS = {
        'North Zone':   [[19.27,72.83],[19.27,73.00],[19.13,73.00],[19.13,72.83]],
        'West Zone':    [[19.13,72.79],[19.13,72.90],[18.98,72.90],[18.98,72.79]],
        'Central Zone': [[19.04,72.82],[19.04,72.90],[18.96,72.90],[18.96,72.82]],
        'East Zone':    [[19.13,72.88],[19.13,73.00],[18.96,73.00],[18.96,72.88]],
        'South Zone':   [[18.96,72.79],[18.96,72.88],[18.89,72.88],[18.89,72.79]],
      };

      var mapLayerGroup = L.layerGroup().addTo(map);

      function rebuildMap() {
        mapLayerGroup.clearLayers();
        // Invisible click polygons per zone
        Object.keys(ZONE_POLYGONS).forEach(function(zoneName) {
          L.polygon(ZONE_POLYGONS[zoneName], {
            color:'transparent', weight:0, fillColor:'transparent', fillOpacity:0,
          }).on('click', function() { openZoneDetailModal(zoneName); }).addTo(mapLayerGroup);
        });
        // Cluster markers
        activeHs.forEach(function(c) {
          var col = DISEASE_COLORS[c.disease] || '#60a8f0';
          var cnt = c.count || 0;
          var rad = 10 + Math.sqrt(cnt) * 1.6;
          L.circleMarker([c.lat, c.lng], {
            radius:rad, fillColor:col, color:'white', weight:2, opacity:1, fillOpacity:0.82,
          }).on('click', function() { openZoneDetailModal(c.zone); }).addTo(mapLayerGroup);
          L.marker([c.lat, c.lng], {
            icon: L.divIcon({
              html: '<div style="background:' + col + ';color:white;padding:3px 8px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.6);font-family:sans-serif">' + cnt + '</div>',
              iconSize:[50,22], iconAnchor:[25,11], className:'',
            }), interactive:true,
          }).on('click', function() { openZoneDetailModal(c.zone); }).addTo(mapLayerGroup);
        });
      }

      rebuildMap();
      map.invalidateSize(true);

      // Filters
      ['hsZoneFilter','hsDiseaseFilter','hsSeverityFilter'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('change', function() {
          var zf = document.getElementById('hsZoneFilter').value;
          var df = document.getElementById('hsDiseaseFilter').value;
          var sf = document.getElementById('hsSeverityFilter').value;
          activeHs = hs.filter(function(c) {
            return (!zf || c.zone.indexOf(zf)!==-1) &&
                   (!df || c.disease.indexOf(df)!==-1) &&
                   (!sf || c.severity===sf);
          });
          rebuildMap();
        });
      });

      // Sidebar cluster clicks — fly to location
      document.querySelectorAll('.hs-cluster-item').forEach(function(el) {
        el.addEventListener('click', function() {
          var lat  = parseFloat(this.dataset.lat);
          var lng  = parseFloat(this.dataset.lng);
          var zone = this.dataset.zone;
          if (map) map.flyTo([lat, lng], 14, {animate:true, duration:0.8});
          setTimeout(function() { openZoneDetailModal(zone); }, 900);
        });
      });
    });
  });
};

function renderClusterSidebar(hs) {
  var html = '';
  hs.forEach(function(c, idx) {
    var col = {'High':'var(--red2)','Critical':'var(--red)','Medium':'var(--gold2)','Low':'var(--accent2)'}[c.severity]||'var(--text2)';
    html +=
      '<div class="cluster-card hs-cluster-item" data-idx="' + idx + '" data-lat="' + c.lat + '" data-lng="' + c.lng + '" data-zone="' + c.zone + '">' +
        '<div>' +
          '<div class="cluster-name">' + c.name + '</div>' +
          '<div class="cluster-disease">' + c.disease + ' &bull; ' + c.zone + '</div>' +
          '<div class="cluster-desc">' + c.desc + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0">' +
          '<div class="cluster-count">' + c.count + '</div>' +
          '<div style="font-size:.68rem;font-weight:700;color:' + col + '">' + c.severity + '</div>' +
        '</div>' +
      '</div>';
  });
  document.getElementById('clusterSidebar').innerHTML = html;
  // Note: click-to-flyTo is bound inside the map rAF block above
  // Here we just bind the zone detail modal open directly
  document.querySelectorAll('.hs-cluster-item').forEach(function(el) {
    el.addEventListener('click', function() {
      var zone = this.dataset.zone;
      openZoneDetailModal(zone);
    });
  });
}

function renderHsZoneCards() {
  var el = document.getElementById('hsZoneCards');
  if (!el) return;
  var ALERT_BADGE = {Hotspot:'badge-red',Rising:'badge-orange',Cluster:'badge-orange',Watch:'badge-gold',Normal:'badge-green'};
  var html = '';
  Object.keys(ZONE_DETAIL).forEach(function(name) {
    var zd = ZONE_DETAIL[name];
    var alert = zd.alert;
    html +=
      '<div class="zone-card hs-zone-tap" data-zone="' + name + '" style="cursor:pointer;transition:border-color .2s">' +
        '<div class="zone-top">' +
          '<div>' +
            '<div class="zone-name-txt">' + name + '</div>' +
            '<div class="zone-disease-txt">' + zd.diseases[0].d + ' (top)</div>' +
          '</div>' +
          '<span class="badge ' + (ALERT_BADGE[alert]||'badge-green') + '">' + alert + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:baseline;gap:8px;margin-top:8px">' +
          '<div class="zone-cases-num">' + zd.totalCases + '</div>' +
          '<div style="font-size:.72rem;color:var(--text3)">active cases</div>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:.72rem;color:var(--accent2)">Tap for full zone detail →</div>' +
      '</div>';
  });
  el.innerHTML = html;
  el.querySelectorAll('.hs-zone-tap').forEach(function(card) {
    card.addEventListener('click', function() { openZoneDetailModal(this.dataset.zone); });
  });
}

// Zone detail modal — full detail on click
window.openZoneDetailModal = function(zoneName) {
  var zd = ZONE_DETAIL[zoneName];
  if (!zd) return;

  // Reuse facility modal
  var modal = document.getElementById('facilityModal');
  var body  = document.getElementById('facilityModalBody');
  if (!modal||!body) return;
  modal.style.display = 'flex';

  var ALERT_COLORS = {Hotspot:'var(--red2)',Rising:'var(--orange2)',Cluster:'var(--orange2)',Watch:'var(--gold2)',Normal:'var(--accent2)'};
  var alertCol = ALERT_COLORS[zd.alert] || 'var(--accent2)';

  var diseasesHtml = zd.diseases.map(function(d) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:.84rem;font-weight:500">' + d.d + '</span>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
        '<span class="mono fw-600">' + d.c + '</span>' +
        Table.alertBadge(d.a) +
      '</div>' +
    '</div>';
  }).join('');

  var facilitiesHtml = zd.facilities.map(function(f) {
    return '<span class="badge badge-blue" style="margin:2px">' + f + '</span>';
  }).join('');

  var patientsHtml = zd.recentPts.map(function(p) {
    return '<tr>' +
      '<td class="patient-code">' + p.id + '</td>' +
      '<td><strong>' + p.name + '</strong></td>' +
      '<td>' + p.age + '</td>' +
      '<td>' + p.disease + '</td>' +
      '<td>' + Table.statusBadge(p.status) + '</td>' +
    '</tr>';
  }).join('');

  body.innerHTML =
    '<div style="margin-bottom:20px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">' +
        '<div>' +
          '<h2 style="font-family:Syne,sans-serif;font-size:1.3rem;font-weight:700">' + zoneName + '</h2>' +
          '<div style="font-size:.8rem;color:var(--text3);margin-top:3px">Zone Health Intelligence Report</div>' +
        '</div>' +
        '<span class="badge ' + ({'Hotspot':'badge-red','Rising':'badge-orange','Cluster':'badge-orange','Watch':'badge-gold','Normal':'badge-green'}[zd.alert]||'badge-green') + '" style="font-size:.85rem;padding:5px 14px">' + zd.alert + '</span>' +
      '</div>' +
    '</div>' +

    '<div class="grid-4" style="margin-bottom:20px">' +
      ['Total Active Cases:' + zd.totalCases + ':accent',
       'Facilities:' + zd.facilities.length + ':blue',
       'Alert Level:' + zd.alert + ':' + (zd.alert==='Hotspot'?'red':zd.alert==='Normal'?'green':'gold'),
       'Diseases Tracked:' + zd.diseases.length + ':purple',
      ].map(function(s) {
        var p = s.split(':');
        return '<div class="stat-card ' + p[2] + '" style="padding:14px 16px">' +
          '<div class="stat-label">' + p[0] + '</div>' +
          '<div class="stat-val" style="font-size:1.4rem">' + p[1] + '</div></div>';
      }).join('') +
    '</div>' +

    '<div class="grid-2" style="gap:16px;margin-bottom:20px">' +
      '<div>' +
        '<div style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:8px">Disease Breakdown</div>' +
        diseasesHtml +
      '</div>' +
      '<div class="chart-card">' +
        '<div class="chart-title" style="margin-bottom:12px">Case Distribution</div>' +
        '<canvas id="zoneDetailChart" height="160"></canvas>' +
      '</div>' +
    '</div>' +

    '<div style="margin-bottom:16px">' +
      '<div style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:8px">Facilities in this Zone</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:4px">' + facilitiesHtml + '</div>' +
    '</div>' +

    '<div style="margin-bottom:12px;font-size:.82rem;font-weight:700;color:var(--text)">Recent Patients</div>' +
    '<div class="tbl-wrap"><div class="tbl-scroll"><table class="dtbl">' +
      '<thead><tr><th>Patient ID</th><th>Name</th><th>Age</th><th>Disease</th><th>Status</th></tr></thead>' +
      '<tbody>' + patientsHtml + '</tbody>' +
    '</table></div></div>';

  setTimeout(function() {
    Charts.doughnut('zoneDetailChart',
      zd.diseases.map(function(d){ return d.d.split(' ').slice(0,2).join(' '); }),
      zd.diseases.map(function(d){ return d.c; }),
      [Charts.PALETTE.gold, Charts.PALETTE.purple, Charts.PALETTE.red, Charts.PALETTE.blue, Charts.PALETTE.accent]
    );
  }, 100);

  var closeBtn = document.getElementById('facilityModalClose');
  if (closeBtn) closeBtn.onclick = function() { modal.style.display='none'; };
  modal.onclick = function(e) { if(e.target===modal) modal.style.display='none'; };
};

/* ─────────────────────────────────────────────────────────
   FACILITIES
   ───────────────────────────────────────────────────────── */
Pages.facilities = async function(area) {
  area.innerHTML = `
    <div class="page-header fade-in">
      <div class="ph-inner">
        <h1 class="ph-title">Health Facilities</h1>
        <p class="ph-sub">Municipal hospitals, PHCs, CHCs, dispensaries &amp; specialty centers — tap a card for full detail</p>
        <div class="ph-stats">
          <div class="ph-stat-item"><div class="ph-stat-num">30</div><div class="ph-stat-label">Total Facilities</div></div>
          <div class="ph-stat-item"><div class="ph-stat-num">15,300</div><div class="ph-stat-label">Total Beds</div></div>
          <div class="ph-stat-item"><div class="ph-stat-num">76%</div><div class="ph-stat-label">Avg Occupancy</div></div>
          <div class="ph-stat-item"><div class="ph-stat-num">500</div><div class="ph-stat-label">Care Providers</div></div>
        </div>
      </div>
    </div>

    <div class="page-section reveal">
      <div class="section-hd">
        <div><div class="section-title">Facility Directory</div></div>
        <div class="section-actions">
          <select class="tn-select" id="facTypeFilter">
            <option value="">All Types</option>
            <option>Municipal Hospital</option><option>PHC</option><option>CHC</option>
            <option>Dispensary</option><option>Private</option><option>Specialty Center</option>
          </select>
          <select class="tn-select" id="facZoneFilter">
            <option value="">All Zones</option>
            <option>North Zone</option><option>South Zone</option>
            <option>East Zone</option><option>West Zone</option><option>Central Zone</option>
          </select>
          <div class="view-toggle">
            <button class="vt-btn active" data-fv="grid">Grid</button>
            <button class="vt-btn" data-fv="list">List</button>
          </div>
        </div>
      </div>
      <div class="grid-3" id="facilityGrid"></div>
    </div>

    <div class="page-section reveal" style="transition-delay:.06s">
      <div class="section-hd"><div><div class="section-title">Bed Capacity vs Current Patients</div></div></div>
      <div class="chart-card"><canvas id="facBarChart" height="80"></canvas></div>
    </div>
  `;

  var raw = await API.facilities();
  // Build a lookup from MOCK by name so contact details always available
  var mockByName = {};
  MOCK.facilities.forEach(function(m) { mockByName[(m.name||'').toLowerCase()] = m; });

  // Merge: API data (live occupancy) + MOCK data (contact, coords, phone)
  var apiList = Array.isArray(raw) ? raw : [];
  var facilities = (apiList.length > 0 ? apiList : MOCK.facilities).map(function(f) {
    var key = (f.name || f.facility_name || '').toLowerCase();
    var mock = mockByName[key] || {};
    return Object.assign({}, mock, f); // f (API) overrides mock for beds/occ, mock fills phone/address/lat/lng
  });
  if (!facilities.length) facilities = MOCK.facilities.slice();
  var filtered = facilities.slice();

  function typeClass(t) {
    t = t || '';
    if (t.indexOf('Municipal') !== -1) return 'hospital';
    if (t === 'PHC' || t === 'CHC')    return 'phc';
    if (t === 'Private')               return 'private';
    return 'specialty';
  }

  function renderGrid(list) {
    var html = '';
    list.forEach(function(f, i) {
      var name = f.name || f.facility_name || '';
      var type = f.type || f.facility_type || '';
      var zone = f.zone || f.zone_name || '';
      var beds = (f.beds || f.bed_capacity || 0).toLocaleString();
      var pts  = (f.patients || f.current_patients || 0).toLocaleString();
      var occ  = f.occ || f.occupancy_pct || 0;
      var occColor = occ > 85 ? 'var(--red)' : occ > 70 ? 'var(--gold)' : 'var(--accent)';

      html +=
        '<div class="facility-card fac-clickable" data-fac-idx="' + i + '"' +
        ' style="animation:fadeUp .4s var(--ease) ' + (i * 0.04) + 's both">' +
          '<div class="fc-name">' + name + '</div>' +
          '<span class="fc-type ' + typeClass(type) + '">' + type + '</span>' +
          '<div class="info-row"><span class="info-label">Zone</span><span class="info-val">' + zone + '</span></div>' +
          '<div class="info-row"><span class="info-label">Beds</span><span class="info-val mono">' + beds + '</span></div>' +
          '<div class="info-row"><span class="info-label">Current Patients</span><span class="info-val mono">' + pts + '</span></div>' +
          '<div class="fc-occ">' +
            '<div class="fc-occ-label"><span>Occupancy</span><span class="fc-occ-pct">' + occ + '%</span></div>' +
            '<div class="progress-bar"><div class="progress-fill" style="width:' + Math.min(100, occ) + '%;background:' + occColor + '"></div></div>' +
          '</div>' +
          '<div style="margin-top:10px;font-size:.72rem;color:var(--accent2);text-align:right">Tap for full details →</div>' +
        '</div>';
    });
    document.getElementById('facilityGrid').innerHTML = html;

    // Bind clicks using stored index into filtered array
    document.querySelectorAll('.fac-clickable').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(this.dataset.facIdx, 10);
        openFacilityModal(list[idx]);
      });
    });
  }

  renderGrid(facilities);

  // Charts
  var top8 = facilities.slice(0, 8);
  Charts.bar('facBarChart',
    top8.map(function(f) { return (f.name || f.facility_name || '').split(' ').slice(0, 2).join(' '); }),
    [
      {label:'Bed Capacity',    data: top8.map(function(f) { return f.beds || f.bed_capacity || 0; }),    backgroundColor: Charts.PALETTE.blue   + '80'},
      {label:'Current Patients',data: top8.map(function(f) { return f.patients || f.current_patients || 0; }), backgroundColor: Charts.PALETTE.accent + 'cc'},
    ]
  );

  // Filters
  document.getElementById('facTypeFilter').addEventListener('change', function() {
    var t = this.value;
    filtered = t ? facilities.filter(function(f) { return (f.type || f.facility_type) === t; }) : facilities.slice();
    renderGrid(filtered);
  });
  document.getElementById('facZoneFilter').addEventListener('change', function() {
    var z = this.value;
    filtered = z ? facilities.filter(function(f) { return (f.zone || f.zone_name) === z; }) : facilities.slice();
    renderGrid(filtered);
  });
  document.querySelectorAll('[data-fv]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('[data-fv]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('facilityGrid').className = btn.dataset.fv === 'grid' ? 'grid-3' : '';
    });
  });
};

// Facility detail modal — receives a plain object, no JSON.stringify in HTML
window.openFacilityModal = function(f) {
  if (!f) return;
  var modal = document.getElementById('facilityModal');
  var body  = document.getElementById('facilityModalBody');
  if (!modal || !body) return;
  modal.style.display = 'flex';

  // Extract fields — merged object has both API live data and MOCK contact data
  var name    = f.name     || f.facility_name   || 'Facility';
  var type    = f.type     || f.facility_type   || '';
  var zone    = f.zone     || f.zone_name       || '—';
  var beds    = f.beds     || f.bed_capacity    || 0;
  var pts     = f.patients || f.current_patients|| 0;
  var occ     = f.occ      || f.occupancy_pct   || 0;
  var phone   = f.phone    || null;
  var address = f.address  || null;
  var email   = f.email    || null;
  var website = f.website  || null;
  var lat     = f.lat      || f.latitude        || null;
  var lng     = f.lng      || f.longitude       || null;
  var isEmerg = !!f.emergency;
  var occColor = occ > 85 ? 'var(--red)' : occ > 70 ? 'var(--gold)' : 'var(--accent)';
  var tc = type.indexOf('Municipal')!==-1?'hospital':type==='PHC'||type==='CHC'?'phc':type==='Private'?'private':'specialty';

  // Direction URLs — Google Maps (works on Android + iOS browser)
  var gmapsQ   = lat && lng ? (lat+','+lng) : encodeURIComponent(name+' Mumbai');
  var dirUrl   = 'https://maps.google.com/maps?daddr=' + gmapsQ;
  var mapUrl   = lat && lng ? ('https://maps.google.com/?q='+lat+','+lng+'&ll='+lat+','+lng+'&z=16') : ('https://maps.google.com/?q='+encodeURIComponent(name+' Mumbai'));

  // Static map image (no JS, no Leaflet, no lag — just a <img> tag)
  // Uses OpenStreetMap tile directly as a centered static preview
  function staticMapHtml() {
    if (!lat || !lng) {
      return '<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:180px;color:var(--text3);font-size:.8rem;background:var(--surface3)">📍 Location not available</div>';
    }
    // Convert lat/lng to tile URL for zoom 15
    var z = 15;
    var x = Math.floor((lng + 180) / 360 * Math.pow(2, z));
    var y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    // Use CartoDB dark tile as background, overlay a pin via CSS
    return '<a href="' + mapUrl + '" target="_blank" rel="noopener" style="display:block;height:100%;min-height:180px;position:relative;overflow:hidden;cursor:pointer;text-decoration:none">' +
      '<img src="https://a.basemaps.cartocdn.com/dark_all/' + z + '/' + x + '/' + y + '.png" style="width:100%;height:100%;object-fit:cover;min-height:180px" onerror="this.style.display=\'none\'" />' +
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-100%)">' +
        '<div style="background:var(--accent);color:white;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.6)">' + name.split(' ').slice(0,2).join(' ') + '</div>' +
        '<div style="width:2px;height:10px;background:var(--accent);margin:0 auto"></div>' +
        '<div style="width:8px;height:8px;background:var(--accent);border-radius:50%;margin:0 auto"></div>' +
      '</div>' +
      '<div style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.7);color:white;font-size:.7rem;padding:3px 8px;border-radius:4px">Tap to open in Maps</div>' +
    '</a>';
  }

  // Stat cards row
  var stats = [
    {l:'Bed Capacity',    v: beds.toLocaleString(),              c:'blue'},
    {l:'Current Patients',v: pts.toLocaleString(),               c:'accent'},
    {l:'Occupancy',       v: occ+'%',                            c: occ>85?'red':occ>70?'gold':'green'},
    {l:'Emergency',       v: isEmerg?'24×7 Open':'OPD Only',     c: isEmerg?'red':'gray'},
  ];
  var statHtml = '<div class="grid-4" style="margin-bottom:16px">' +
    stats.map(function(s) {
      return '<div class="stat-card ' + s.c + '" style="padding:12px 14px">' +
        '<div class="stat-label">' + s.l + '</div>' +
        '<div class="stat-val" style="font-size:1.25rem">' + s.v + '</div>' +
      '</div>';
    }).join('') +
  '</div>';

  // Contact info rows helper
  function contactRow(icon, label, value, href) {
    return '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">' +
      '<div style="width:30px;height:30px;border-radius:7px;background:var(--surface3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px">' + icon + '</div>' +
      '<div style="min-width:0">' +
        '<div style="font-size:.68rem;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.04em">' + label + '</div>' +
        (href
          ? '<a href="' + href + '" style="font-size:.84rem;font-weight:600;color:var(--accent2);word-break:break-all">' + value + '</a>'
          : '<div style="font-size:.84rem;font-weight:500;line-height:1.4;color:var(--text)">' + value + '</div>'
        ) +
      '</div>' +
    '</div>';
  }

  var contactRows =
    contactRow('📞', 'Phone', phone || 'Not available', phone ? 'tel:' + phone : null) +
    contactRow('📍', 'Address', address || 'Mumbai, Maharashtra', null) +
    (email   ? contactRow('✉️', 'Email',   email,   'mailto:' + email)   : '') +
    (website ? contactRow('🌐', 'Website', website, 'https://' + website) : '');

  var contactHtml =
    '<div class="grid-2" style="gap:14px;margin-bottom:16px">' +
      // Left — contact details
      '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px">' +
        '<div style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Contact Information</div>' +
        contactRows +
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' +
          '<a href="' + dirUrl + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:var(--accent);color:white;padding:7px 12px;border-radius:var(--radius-sm);font-size:.78rem;font-weight:600;text-decoration:none">▶ Get Directions</a>' +
          '<a href="' + mapUrl  + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:var(--surface3);color:var(--text);padding:7px 12px;border-radius:var(--radius-sm);font-size:.78rem;font-weight:600;text-decoration:none;border:1px solid var(--border2)">📍 View Map</a>' +
        '</div>' +
      '</div>' +
      // Right — static map tile (no Leaflet, no lag)
      '<div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;min-height:180px">' +
        staticMapHtml() +
      '</div>' +
    '</div>';

  // Occupancy bar
  var occHtml =
    '<div style="margin-bottom:16px">' +
      '<div style="display:flex;justify-content:space-between;font-size:.76rem;margin-bottom:5px">' +
        '<span style="font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Occupancy Rate</span>' +
        '<span style="font-weight:700;color:' + occColor + '">' + occ + '%</span>' +
      '</div>' +
      '<div class="progress-bar" style="height:8px"><div class="progress-fill" style="width:' + Math.min(100,occ) + '%;background:' + occColor + '"></div></div>' +
      '<div style="font-size:.72rem;color:var(--text3);margin-top:3px">' + pts.toLocaleString() + ' patients in ' + beds.toLocaleString() + ' beds</div>' +
    '</div>';

  // Charts
  var chartsHtml =
    '<div class="grid-2" style="gap:14px;margin-bottom:16px">' +
      '<div class="chart-card" style="padding:14px"><div style="font-size:.84rem;font-weight:600;margin-bottom:10px">Patient Status</div><canvas id="facDetailPie" height="140"></canvas></div>' +
      '<div class="chart-card" style="padding:14px"><div style="font-size:.84rem;font-weight:600;margin-bottom:10px">Top Diseases</div><canvas id="facDetailBar" height="140"></canvas></div>' +
    '</div>';

  // Recent patients
  var facPts = MOCK.patients.filter(function(p) { return !zone || p.zone===zone; }).slice(0,5);
  if (!facPts.length) facPts = MOCK.patients.slice(0,5);
  var patientsHtml =
    '<div style="font-size:.84rem;font-weight:700;margin-bottom:8px">Recent Patients</div>' +
    '<div class="tbl-wrap"><div class="tbl-scroll"><table class="dtbl">' +
      '<thead><tr><th>ID</th><th>Name</th><th>Age</th><th>Disease</th><th>Status</th></tr></thead>' +
      '<tbody>' + facPts.map(function(p) {
        return '<tr><td><span class="patient-code">' + p.id + '</span></td>' +
          '<td><strong>' + p.name + '</strong></td><td>' + p.age + '</td>' +
          '<td>' + p.disease + '</td><td>' + Table.statusBadge(p.status) + '</td></tr>';
      }).join('') + '</tbody>' +
    '</table></div></div>';

  // Header
  var headerHtml =
    '<div style="margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">' +
      '<div>' +
        '<h2 style="font-family:Syne,sans-serif;font-size:1.2rem;font-weight:700;margin-bottom:5px">' + name + '</h2>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<span class="fc-type ' + tc + '">' + type + '</span>' +
          '<span class="badge badge-gray">' + zone + '</span>' +
          (isEmerg ? '<span class="badge badge-red">🚨 24×7 Emergency</span>' : '') +
        '</div>' +
      '</div>' +
      '<a href="' + dirUrl + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;background:var(--accent);color:white;padding:8px 14px;border-radius:var(--radius-sm);font-size:.78rem;font-weight:600;text-decoration:none;flex-shrink:0">▶ Directions</a>' +
    '</div>';

  body.innerHTML = headerHtml + statHtml + contactHtml + occHtml + chartsHtml + patientsHtml;

  // Charts — plain Chart.js, no Leaflet (lightweight)
  var zoneDisease = {
    'North Zone':   ['Dengue','Malaria','ILI','Typhoid','Other'],
    'South Zone':   ['ADD','Cholera','Hepatitis A','CVD','Other'],
    'East Zone':    ['Malaria','TB','Dengue','ILI','Other'],
    'West Zone':    ['ILI','Dengue','COPD','Hypertension','Other'],
    'Central Zone': ['TB','Typhoid','Dengue','Diabetes','Other'],
  };
  var diseases = zoneDisease[zone] || ['Dengue','Malaria','TB','ILI','Diabetes'];
  var total = pts || 100;

  setTimeout(function() {
    Charts.doughnut('facDetailPie',
      ['Admitted','Monitoring','Recovered','Discharged'],
      [Math.round(total*.18)||20, Math.round(total*.22)||25, Math.round(total*.38)||40, Math.round(total*.22)||25],
      [Charts.PALETTE.red, Charts.PALETTE.gold, Charts.PALETTE.accent, Charts.PALETTE.blue]
    );
    Charts.bar('facDetailBar', diseases,
      [{label:'Cases',
        data:[Math.round(total*.22),Math.round(total*.16),Math.round(total*.20),Math.round(total*.28),Math.round(total*.14)],
        backgroundColor:[Charts.PALETTE.gold,Charts.PALETTE.purple,Charts.PALETTE.red,Charts.PALETTE.blue,Charts.PALETTE.accent].map(function(c){return c+'cc';})
      }],
      {indexAxis:'y'}
    );
  }, 80);

  var closeBtn = document.getElementById('facilityModalClose');
  if (closeBtn) closeBtn.onclick = function() { modal.style.display='none'; };
  modal.onclick = function(e) { if(e.target===modal) modal.style.display='none'; };
};

/* ─────────────────────────────────────────────────────────
   PATIENTS
   ───────────────────────────────────────────────────────── */
Pages.patients = async function(area) {
  var currentPage = 1;
  var searchQ     = '';
  var perPage     = 50;  // default — show 50 at a time

  area.innerHTML = `
    <div class="page-header fade-in">
      <div class="ph-inner">
        <h1 class="ph-title">Patient Records</h1>
        <p class="ph-sub" id="ptSubtitle">Loading patient count...</p>
      </div>
    </div>
    <div style="padding:0 20px 20px">
      <div class="tbl-wrap">
        <div class="tbl-toolbar">
          <div class="tbl-search-wrap" style="max-width:300px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search ID, name, disease, zone..." id="patientFullSearch"/>
          </div>
          <div class="tbl-actions">
            <select class="tn-select" id="ptStatusFilter">
              <option value="">All Status</option>
              <option>Admitted</option><option>Monitoring</option>
              <option>Recovered</option><option>Discharged</option>
            </select>
            <select class="tn-select" id="ptZoneFilter">
              <option value="">All Zones</option>
              <option>North Zone</option><option>South Zone</option>
              <option>East Zone</option><option>West Zone</option><option>Central Zone</option>
            </select>
            <select class="tn-select" id="ptPerPage" title="Rows per page">
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
              <option value="200">200 / page</option>
              <option value="500">500 / page</option>
              <option value="1000">1000 / page</option>
            </select>
            <button class="btn btn-ghost btn-sm" id="ptExportBtn">⬇ Export CSV</button>
          </div>
        </div>

        <!-- Scrollable table — fills available height -->
        <div class="tbl-scroll" id="ptScrollArea" style="max-height:calc(100vh - 260px);overflow-y:auto">
          <table class="dtbl" style="width:100%">
            <thead style="position:sticky;top:0;z-index:2;background:var(--bg3)">
              <tr>
                <th>Patient ID</th><th>Name</th><th>Age</th><th>Gender</th>
                <th>Disease</th><th>Zone</th><th>Facility</th><th>Admitted</th><th>Status</th>
              </tr>
            </thead>
            <tbody id="ptBody">
              <tr><td colspan="9"><div class="skeleton" style="height:300px;margin:12px;border-radius:8px"></div></td></tr>
            </tbody>
          </table>
        </div>

        <div class="tbl-footer">
          <span id="ptTotal" class="text3">Loading...</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="text3" style="font-size:.74rem">Page</span>
            <div class="pagination" id="ptPagination"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('ptExportBtn').addEventListener('click', function() {
    exportPatientsCSV(searchQ, perPage);
  });

  // Per-page selector
  document.getElementById('ptPerPage').addEventListener('change', function() {
    perPage     = parseInt(this.value, 10);
    currentPage = 1;
    loadPatients();
  });

  // Status + zone filters
  ['ptStatusFilter','ptZoneFilter'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
      currentPage = 1;
      loadPatients();
    });
  });

  async function loadPatients() {
    var statusFilter = document.getElementById('ptStatusFilter').value;
    var zoneFilter   = document.getElementById('ptZoneFilter').value;
    var q = [searchQ, statusFilter, zoneFilter].filter(Boolean).join(' ');
    var data  = await API.patients(q, currentPage, perPage);
    var pts   = (data && data.patients) ? data.patients : MOCK.patients;
    var total = (data && data.total)    ? data.total    : pts.length;
    var pages = (data && data.pages)    ? data.pages    : Math.ceil(total / perPage) || 1;

    // Update subtitle with live count
    var subtitle = document.getElementById('ptSubtitle');
    if (subtitle) subtitle.textContent = total.toLocaleString() + ' patients — search, filter, and scroll through records';

    // Status line
    var showing = ((currentPage - 1) * perPage) + 1;
    var showingEnd = Math.min(currentPage * perPage, total);
    document.getElementById('ptTotal').textContent =
      'Showing ' + showing.toLocaleString() + '–' + showingEnd.toLocaleString() +
      ' of ' + total.toLocaleString() + ' patients';

    // Table rows
    var bodyHtml = '';
    if (pts.length === 0) {
      bodyHtml = '<tr><td colspan="9"><div class="empty-state">No patients found</div></td></tr>';
    } else {
      pts.forEach(function(p) {
        bodyHtml +=
          '<tr>' +
            '<td><span class="patient-code">' + (p.id || p.patient_code || '') + '</span></td>' +
            '<td><strong>' + (p.name || ((p.first_name||'') + ' ' + (p.last_name||'')).trim()) + '</strong></td>' +
            '<td>' + (p.age || '') + '</td>' +
            '<td>' + (p.gender || '—') + '</td>' +
            '<td>' + (p.disease || p.disease_name || '') + '</td>' +
            '<td>' + (p.zone || p.zone_name || '') + '</td>' +
            '<td style="font-size:.78rem;color:var(--text3)">' + (p.facility || p.facility_name || '') + '</td>' +
            '<td style="font-size:.78rem;color:var(--text3)">' + (p.admitted || p.admission_date || '') + '</td>' +
            '<td>' + Table.statusBadge(p.status) + '</td>' +
          '</tr>';
      });
    }
    document.getElementById('ptBody').innerHTML = bodyHtml;

    // Scroll back to top of table when page changes
    var scrollArea = document.getElementById('ptScrollArea');
    if (scrollArea) scrollArea.scrollTop = 0;

    // Compact pagination — only show window of 5 pages + prev/next
    var pgHtml = '<button class="pg-btn" id="pgPrev"' + (currentPage<=1?' disabled':'') + '>‹</button>';
    var winStart = Math.max(1, currentPage - 2);
    var winEnd   = Math.min(winStart + 4, pages);
    if (winStart > 1) pgHtml += '<button class="pg-btn" data-pg="1">1</button>' + (winStart > 2 ? '<span style="color:var(--text3);padding:0 4px">…</span>' : '');
    for (var p = winStart; p <= winEnd; p++) {
      pgHtml += '<button class="pg-btn' + (p===currentPage?' active':'') + '" data-pg="' + p + '">' + p + '</button>';
    }
    if (winEnd < pages) pgHtml += (winEnd < pages-1 ? '<span style="color:var(--text3);padding:0 4px">…</span>' : '') + '<button class="pg-btn" data-pg="' + pages + '">' + pages + '</button>';
    pgHtml += '<button class="pg-btn" id="pgNext"' + (currentPage>=pages?' disabled':'') + '>›</button>';
    document.getElementById('ptPagination').innerHTML = pgHtml;

    document.getElementById('pgPrev').addEventListener('click', function() {
      if (currentPage > 1) { currentPage--; loadPatients(); }
    });
    document.getElementById('pgNext').addEventListener('click', function() {
      if (currentPage < pages) { currentPage++; loadPatients(); }
    });
    document.querySelectorAll('#ptPagination [data-pg]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentPage = parseInt(this.dataset.pg, 10);
        loadPatients();
      });
    });
  }

  var debounce;
  document.getElementById('patientFullSearch').addEventListener('input', function() {
    clearTimeout(debounce);
    var val = this.value;
    debounce = setTimeout(function() {
      searchQ = val; currentPage = 1; loadPatients();
    }, 300);
  });

  loadPatients();
};

// ─── CSV EXPORT ─────────────────────────────────────────────────────
function exportPatientsCSV(searchQ, perPage) {
  Toast.show('📥 Preparing CSV download...', 'info', 1500);

  // Try API export first, fall back to current page data as CSV
  var session = null;
  try { session = JSON.parse(localStorage.getItem('mw_session') || 'null'); } catch(e) {}
  var token = (session && session.token) ? session.token : '';

  fetch(CFG.API_BASE + '/patients?search=' + encodeURIComponent(searchQ||'') + '&page=1&per_page=1000', {
    headers: { 'Authorization': 'Bearer ' + token }
  }).then(function(r) { return r.ok ? r.json() : null; })
  .then(function(data) {
    var pts = (data && data.patients) ? data.patients : MOCK.patients;
    var headers = ['Patient ID','Name','Age','Gender','Disease','Zone','Facility','Admitted','Status'];
    var rows = pts.map(function(p) {
      return [
        p.id || p.patient_code || '',
        '"' + (p.name || ((p.first_name||'') + ' ' + (p.last_name||'')).trim()) + '"',
        p.age || '',
        p.gender || '',
        '"' + (p.disease || p.disease_name || '') + '"',
        '"' + (p.zone || p.zone_name || '') + '"',
        '"' + (p.facility || p.facility_name || '') + '"',
        p.admitted || p.admission_date || '',
        p.status || '',
      ].join(',');
    });
    var csv = [headers.join(',')].concat(rows).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url;
    a.download = 'patients_export_' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.show('✅ CSV downloaded — ' + pts.length.toLocaleString() + ' patients', 'success');
  }).catch(function() {
    Toast.show('⚠ Export failed — check connection', 'error');
  });
}

/* ─────────────────────────────────────────────────────────
   SETTINGS
   ───────────────────────────────────────────────────────── */
Pages.settings = async function(area) {
  var currentUser = Auth.getUser();
  var isAdmin = currentUser && currentUser.role === 'Admin';

  area.innerHTML = `
    <div class="page-header fade-in">
      <div class="ph-inner">
        <h1 class="ph-title">Settings &amp; Administration</h1>
        <p class="ph-sub">System configuration, user management, and application preferences</p>
      </div>
    </div>
    <div class="page-section reveal">
      <div class="settings-layout">
        <div class="settings-nav" id="settingsNav">
          <div class="settings-nav-item active" data-stab="users">Users &amp; Access</div>
          <div class="settings-nav-item" data-stab="profile">My Profile</div>
          <div class="settings-nav-item" data-stab="notifications">Notifications</div>
          <div class="settings-nav-item" data-stab="system">System</div>
          <div class="settings-nav-item" data-stab="security">Security</div>
          <div class="settings-nav-item" data-stab="database">Database</div>
          <div class="settings-nav-item" data-stab="about">About</div>
        </div>
        <div class="settings-content" id="settingsContent"></div>
      </div>
    </div>
  `;

  async function showTab(name) {
    document.querySelectorAll('.settings-nav-item').forEach(function(i) {
      i.classList.toggle('active', i.dataset.stab === name);
    });
    var content = document.getElementById('settingsContent');
    content.innerHTML = '<div class="skeleton" style="height:200px;border-radius:8px"></div>';

    if (name === 'users') {
      var users = await API.users();
      var list  = Array.isArray(users) ? users : MOCK.users;
      content.innerHTML = buildUsersHTML(list, isAdmin);
      bindUserTabEvents(list, isAdmin, area);
    } else if (name === 'profile') {
      content.innerHTML = buildProfileHTML(currentUser);
    } else if (name === 'notifications') {
      content.innerHTML = buildNotifsHTML();
    } else if (name === 'system') {
      content.innerHTML = buildSystemHTML();
    } else if (name === 'security') {
      content.innerHTML = buildSecurityHTML();
    } else if (name === 'database') {
      content.innerHTML = buildDbHTML();
    } else if (name === 'about') {
      content.innerHTML = buildAboutHTML();
    }
  }

  document.querySelectorAll('.settings-nav-item').forEach(function(item) {
    item.addEventListener('click', function() { showTab(this.dataset.stab); });
  });

  showTab('users');
};

function buildUsersHTML(list, isAdmin) {
  var roleColors = {
    Admin:'badge-red', Doctor:'badge-blue', Nurse:'badge-green',
    'Field Officer':'badge-orange', Analyst:'badge-gold', Staff:'badge-gray'
  };
  var header = '<div class="settings-section">' +
    '<div class="settings-section-title">User Management' +
    (!isAdmin ? '<span style="font-size:.7rem;color:var(--text3);margin-left:8px">(Read-only)</span>' : '') +
    '</div>';

  if (isAdmin) {
    header += '<div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn btn-primary btn-sm" id="addUserBtn">+ Add User</button></div>';
  }

  var tableHead = '<div class="tbl-wrap"><div class="tbl-scroll"><table class="dtbl"><thead><tr>' +
    '<th>User</th><th>Username</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th>' +
    (isAdmin ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';

  var rows = '';
  list.forEach(function(u) {
    var initials = (u.name || 'U').split(' ').map(function(n){return n[0];}).slice(0,2).join('');
    var roleCell = isAdmin
      ? '<select class="tn-select role-select" data-uid="' + u.id + '" style="padding:3px 22px 3px 8px;font-size:.72rem">' +
          ['Admin','Doctor','Nurse','Field Officer','Analyst','Staff'].map(function(r) {
            return '<option' + (r === u.role ? ' selected' : '') + '>' + r + '</option>';
          }).join('') + '</select>'
      : '<span class="badge ' + (roleColors[u.role] || 'badge-gray') + '">' + u.role + '</span>';

    var actions = '';
    if (isAdmin) {
      actions = '<td style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
        '<button class="btn btn-ghost btn-sm edit-user-btn" data-uid="' + u.id + '" ' +
          'data-name="' + u.name + '" data-username="' + u.username + '" ' +
          'data-email="' + u.email + '" data-role="' + u.role + '" data-status="' + u.status + '">Edit</button>' +
        '<button class="btn btn-danger btn-sm reset-pw-btn" data-uid="' + u.id + '" data-username="' + u.username + '">Reset PW</button>' +
        (u.status === 'Active'
          ? '<button class="btn btn-ghost btn-sm toggle-user-btn" data-uid="' + u.id + '" data-activate="0" data-name="' + u.name + '">Deactivate</button>'
          : '<button class="btn btn-primary btn-sm toggle-user-btn" data-uid="' + u.id + '" data-activate="1" data-name="' + u.name + '">Activate</button>') +
        '</td>';
    }

    rows += '<tr>' +
      '<td><div style="display:flex;align-items:center;gap:8px"><div class="user-row-avatar">' + initials + '</div><strong>' + u.name + '</strong></div></td>' +
      '<td class="mono text3">' + u.username + '</td>' +
      '<td class="text3 fs-sm">' + u.email + '</td>' +
      '<td>' + roleCell + '</td>' +
      '<td class="text3 fs-sm">' + u.last_login + '</td>' +
      '<td>' + Table.statusBadge(u.status) + '</td>' +
      actions +
    '</tr>';
  });

  return header + tableHead + rows + '</tbody></table></div></div></div>';
}

function bindUserTabEvents(list, isAdmin, area) {
  if (!isAdmin) return;

  // Add user button
  var addBtn = document.getElementById('addUserBtn');
  if (addBtn) addBtn.addEventListener('click', openAddUserModal);

  // Role dropdowns
  document.querySelectorAll('.role-select').forEach(function(sel) {
    sel.addEventListener('change', function() {
      var uid = parseInt(this.dataset.uid, 10);
      var val = this.value;
      apiFetchAuth('/users/' + uid, {method:'PUT', body: JSON.stringify({role: val})})
        .then(function(res) {
          Toast.show(res ? '✅ Role updated' : '⚠ Mock: role updated visually', res ? 'success' : 'warn');
        });
    });
  });

  // Edit buttons
  document.querySelectorAll('.edit-user-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openEditUserModal(
        parseInt(this.dataset.uid, 10),
        this.dataset.name,
        this.dataset.username,
        this.dataset.email,
        this.dataset.role,
        this.dataset.status,
        area
      );
    });
  });

  // Reset password buttons
  document.querySelectorAll('.reset-pw-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var uid      = parseInt(this.dataset.uid, 10);
      var username = this.dataset.username;
      var newPw    = username + '@123';
      var modal    = document.getElementById('userEditModal');
      document.getElementById('userEditTitle').textContent = 'Reset Password';
      document.getElementById('userEditBody').innerHTML =
        '<div style="text-align:center;padding:8px 0">' +
          '<p style="color:var(--text2);font-size:.86rem;margin-bottom:12px">Password for <strong>' + username + '</strong> will be reset to:</p>' +
          '<div style="background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:12px 20px;font-family:JetBrains Mono,monospace;font-size:1.1rem;font-weight:600;color:var(--accent2)">' + newPw + '</div>' +
          '<p style="color:var(--text3);font-size:.74rem;margin-top:10px">User must change this on next login.</p>' +
        '</div>';
      modal.style.display = 'flex';
      document.getElementById('userEditSave').textContent = 'Reset Password';
      document.getElementById('userEditSave').onclick = function() {
        apiFetchAuth('/users/' + uid, {method:'PUT', body: JSON.stringify({password: newPw})})
          .then(function() { Toast.show('✅ Password reset to ' + newPw, 'success'); });
        modal.style.display = 'none';
      };
      document.getElementById('userEditCancel').onclick = function() { modal.style.display = 'none'; };
      modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
    });
  });

  // Toggle active/inactive
  document.querySelectorAll('.toggle-user-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var uid      = parseInt(this.dataset.uid, 10);
      var activate = this.dataset.activate === '1';
      var name     = this.dataset.name;
      apiFetchAuth('/users/' + uid, {method:'PUT', body: JSON.stringify({is_active: activate ? 1 : 0})})
        .then(function() {
          Toast.show((activate ? '✅ Activated: ' : '⛔ Deactivated: ') + name);
          Pages.settings(area);
        });
    });
  });
}

function openEditUserModal(uid, name, username, email, role, status, area) {
  var modal = document.getElementById('userEditModal');
  document.getElementById('userEditTitle').textContent = 'Edit User';
  document.getElementById('userEditBody').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:12px">' +
      '<div class="field-group"><label class="field-label">Full Name</label><input class="field-input-sm" id="ef_name" value="' + name + '" style="width:100%"/></div>' +
      '<div class="field-group"><label class="field-label">Email</label><input class="field-input-sm" id="ef_email" value="' + email + '" style="width:100%"/></div>' +
      '<div class="field-group"><label class="field-label">Role</label>' +
        '<select class="tn-select" id="ef_role" style="width:100%;padding:8px 12px">' +
          ['Admin','Doctor','Nurse','Field Officer','Analyst','Staff'].map(function(r) {
            return '<option' + (r === role ? ' selected' : '') + '>' + r + '</option>';
          }).join('') +
        '</select></div>' +
      '<div class="field-group"><label class="field-label">Status</label>' +
        '<select class="tn-select" id="ef_status" style="width:100%;padding:8px 12px">' +
          ['Active','Inactive'].map(function(s) {
            return '<option' + (s === status ? ' selected' : '') + '>' + s + '</option>';
          }).join('') +
        '</select></div>' +
    '</div>';
  modal.style.display = 'flex';
  document.getElementById('userEditSave').textContent = 'Save Changes';
  document.getElementById('userEditSave').onclick = function() {
    var payload = {
      full_name: document.getElementById('ef_name').value,
      email:     document.getElementById('ef_email').value,
      role:      document.getElementById('ef_role').value,
      is_active: document.getElementById('ef_status').value === 'Active' ? 1 : 0,
    };
    apiFetchAuth('/users/' + uid, {method:'PUT', body: JSON.stringify(payload)}).then(function() {
      Toast.show('✅ User updated successfully');
      modal.style.display = 'none';
      if (area) Pages.settings(area);
    });
  };
  document.getElementById('userEditCancel').onclick = function() { modal.style.display = 'none'; };
  modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
}

function openAddUserModal() {
  var modal = document.getElementById('userEditModal');
  document.getElementById('userEditTitle').textContent = 'Add New User';
  document.getElementById('userEditBody').innerHTML =
    '<div style="display:flex;flex-direction:column;gap:12px">' +
      '<div class="field-group"><label class="field-label">Full Name</label><input class="field-input-sm" id="nu_name" placeholder="Dr. John Smith" style="width:100%"/></div>' +
      '<div class="field-group"><label class="field-label">Username</label><input class="field-input-sm" id="nu_user" placeholder="dr.john" style="width:100%"/></div>' +
      '<div class="field-group"><label class="field-label">Email</label><input class="field-input-sm" id="nu_email" placeholder="dr.john@bmchealth.in" style="width:100%"/></div>' +
      '<div class="field-group"><label class="field-label">Password</label><input class="field-input-sm" id="nu_pass" type="password" placeholder="Min 6 characters" style="width:100%"/></div>' +
      '<div class="field-group"><label class="field-label">Role</label>' +
        '<select class="tn-select" id="nu_role" style="width:100%;padding:8px 12px">' +
          ['Doctor','Nurse','Field Officer','Analyst','Staff','Admin'].map(function(r) {
            return '<option>' + r + '</option>';
          }).join('') +
        '</select></div>' +
    '</div>';
  modal.style.display = 'flex';
  document.getElementById('userEditSave').textContent = 'Create User';
  document.getElementById('userEditSave').onclick = function() {
    var payload = {
      full_name: document.getElementById('nu_name').value,
      username:  document.getElementById('nu_user').value,
      email:     document.getElementById('nu_email').value,
      password:  document.getElementById('nu_pass').value,
      role:      document.getElementById('nu_role').value,
    };
    if (!payload.full_name || !payload.username || !payload.email || !payload.password) {
      Toast.show('Please fill all fields', 'error'); return;
    }
    apiFetchAuth('/users', {method:'POST', body: JSON.stringify(payload)}).then(function() {
      Toast.show('✅ User ' + payload.username + ' created');
      modal.style.display = 'none';
    });
  };
  document.getElementById('userEditCancel').onclick = function() { modal.style.display = 'none'; };
  modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };
}

// Authenticated API call helper
function apiFetchAuth(path, opts) {
  opts = opts || {};
  var session = null;
  try { session = JSON.parse(localStorage.getItem('mw_session') || 'null'); } catch(e) {}
  var token = (session && session.token) ? session.token : '';
  return fetch(CFG.API_BASE + path, Object.assign({}, opts, {
    headers: Object.assign({'Content-Type':'application/json','Authorization':'Bearer '+token}, opts.headers||{})
  })).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; });
}

function buildProfileHTML(u) {
  var fields = [
    ['Full Name',  u ? u.name     : 'User'],
    ['Username',   u ? u.username : '—'],
    ['Role',       u ? u.role     : '—'],
    ['Email',      '—'],
    ['Department', 'Public Health'],
  ];
  var rows = fields.map(function(f) {
    return '<div class="settings-row"><div><div class="settings-row-label">' + f[0] + '</div></div>' +
      '<input class="field-input-sm" value="' + f[1] + '"/></div>';
  }).join('');
  return '<div class="settings-section"><div class="settings-section-title">My Profile</div>' + rows +
    '<div style="margin-top:16px"><button class="btn btn-primary btn-sm" id="saveProfileBtn">Save Changes</button></div></div>';
}

function buildNotifsHTML() {
  var prefs = [
    ['Hotspot Alerts',      'Alert when a new hotspot is detected', true],
    ['Daily Report',        'Daily digest at 8 AM',                 true],
    ['Facility Occupancy',  'Alert when facility exceeds 85%',      true],
    ['Treatment Defaulters','Notify for TB/NCD defaulters',         false],
    ['Weekly Summary',      'Weekly programme summary email',       true],
  ];
  var rows = prefs.map(function(p) {
    return '<div class="settings-row">' +
      '<div><div class="settings-row-label">' + p[0] + '</div><div class="settings-row-sub">' + p[1] + '</div></div>' +
      '<label class="toggle-switch"><input type="checkbox" class="notif-toggle"' + (p[2]?' checked':'') + '><div class="toggle-track"></div></label>' +
    '</div>';
  }).join('');
  return '<div class="settings-section"><div class="settings-section-title">Notification Preferences</div>' + rows + '</div>';
}

function buildSystemHTML() {
  var fields = [
    ['API Endpoint',         CFG.API_BASE],
    ['Session Timeout (mins)','30'],
    ['Default Zone',         'All Zones'],
    ['Default Period',       'This Month'],
  ];
  var rows = fields.map(function(f) {
    return '<div class="settings-row"><div class="settings-row-label">' + f[0] + '</div>' +
      '<input class="field-input-sm" value="' + f[1] + '"/></div>';
  }).join('');
  return '<div class="settings-section"><div class="settings-section-title">System Configuration</div>' + rows +
    '<div style="margin-top:16px;display:flex;gap:8px">' +
      '<button class="btn btn-primary btn-sm" id="saveSystemBtn">Save</button>' +
      '<button class="btn btn-ghost btn-sm" id="resetSystemBtn">Reset</button>' +
    '</div></div>';
}

function buildSecurityHTML() {
  return '<div class="settings-section"><div class="settings-section-title">Security</div>' +
    '<div class="settings-row"><div><div class="settings-row-label">Change Password</div></div><button class="btn btn-ghost btn-sm" id="changePwBtn">Change Password</button></div>' +
    '<div class="settings-row"><div><div class="settings-row-label">Two-Factor Authentication</div><div class="settings-row-sub">Add extra security</div></div><label class="toggle-switch"><input type="checkbox"><div class="toggle-track"></div></label></div>' +
    '<div class="settings-row"><div><div class="settings-row-label">Session Management</div><div class="settings-row-sub">Active sessions: 1</div></div><button class="btn btn-danger btn-sm" id="revokeSessionsBtn">Revoke All</button></div>' +
    '<div class="settings-row"><div><div class="settings-row-label">HTTPS / SSL</div><div class="settings-row-sub">cert.pem + key.pem</div></div><span class="badge badge-green">Active</span></div>' +
  '</div>';
}

function buildDbHTML() {
  var rows = [
    ['Connection',  'MySQL/MariaDB @ localhost:3306',        'green'],
    ['Database',    'disease_dashboard',                     'green'],
    ['Records',     '~61,000+ rows across 10 tables',        'blue'],
    ['Last Sync',   'Auto-sync on request',                  'gray'],
    ['Status',      'Connected',                             'green'],
  ];
  var html = rows.map(function(r) {
    return '<div class="settings-row"><div class="settings-row-label">' + r[0] + '</div><span class="badge badge-' + r[2] + '">' + r[1] + '</span></div>';
  }).join('');
  return '<div class="settings-section"><div class="settings-section-title">Database Status</div>' + html + '</div>';
}

function buildAboutHTML() {
  var rows = [
    ['App Name',    'Disease Dashboard v2.1'],
    ['Platform',    'Flask + MySQL + Vanilla JS SPA'],
    ['Designed for','BMC / Public Health Departments'],
    ['HTTPS',       'Enabled (cert.pem + key.pem)'],
    ['Theme',       'Dark & Light — toggle via the sun/moon button'],
    ['Mobile',      'Responsive — all screen sizes supported'],
  ];
  var html = rows.map(function(r) {
    return '<div class="info-row"><span class="info-label">' + r[0] + '</span><span class="info-val">' + r[1] + '</span></div>';
  }).join('');
  return '<div class="settings-section"><div class="settings-section-title">About Disease Dashboard</div>' + html +
    '<div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:var(--radius-sm);font-size:.76rem;color:var(--text3);line-height:1.6">' +
      'Disease Intelligence Platform for population health monitoring, NCD programme management, and communicable disease surveillance.' +
    '</div></div>';
}