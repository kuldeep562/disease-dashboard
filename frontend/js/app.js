/* app.js — Disease Dashboard bootstrap */
'use strict';
window.Pages = window.Pages || {};

// ─── LOGIN ───────────────────────────────────────────────
(function initLogin() {
  const loginScreen = document.getElementById('loginScreen');
  const appShell    = document.getElementById('appShell');
  const loginBtn    = document.getElementById('loginBtn');
  const loginErr    = document.getElementById('loginError');
  const pwToggle    = document.getElementById('pwToggle');
  const passInput   = document.getElementById('loginPass');
  const userInput   = document.getElementById('loginUser');

  pwToggle?.addEventListener('click', () => {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  });
  [userInput, passInput].forEach(el => {
    el?.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn?.click(); });
  });

  async function doLogin() {
    const user = userInput?.value.trim();
    const pass = passInput?.value;
    loginErr.classList.remove('show');
    if (!user || !pass) { loginErr.textContent='Please enter username and password.'; loginErr.classList.add('show'); return; }
    loginBtn.classList.add('loading');
    const result = await Auth.login(user, pass);
    loginBtn.classList.remove('loading');
    if (result.success) {
      launchApp();
    } else {
      loginErr.textContent = result.message;
      loginErr.classList.add('show');
      passInput.value = ''; passInput.focus();
    }
  }
  loginBtn?.addEventListener('click', doLogin);

  function launchApp() {
    loginScreen.style.transition = 'opacity .3s,transform .3s';
    loginScreen.style.opacity    = '0';
    loginScreen.style.transform  = 'scale(.97)';
    setTimeout(() => {
      loginScreen.classList.add('hidden');
      appShell.classList.remove('hidden');
      populateUser();
      initApp();
    }, 300);
  }

  if (Auth.isLoggedIn()) {
    loginScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    populateUser();
    initApp();
  }
})();

function populateUser() {
  const u = Auth.getUser();
  if (!u) return;
  const initials = u.avatar || (u.name||'U').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
  const av = document.getElementById('userAvatar');
  const nm = document.getElementById('userName');
  const rl = document.getElementById('userRole');
  if (av) av.textContent  = initials;
  if (nm) nm.textContent  = u.name  || 'User';
  if (rl) rl.textContent  = u.role  || 'Staff';
}

// ─── APP INIT ─────────────────────────────────────────────
function initApp() {
  initSidebar();
  initTopNav();
  initNotifications();
  initLogoutModal();
  initTheme();
  registerPages();
  Router.init();
}

// ─── THEME ────────────────────────────────────────────────
function initTheme() {
  const saved  = localStorage.getItem('dd_theme') || 'dark';
  applyTheme(saved);

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('dd_theme', next);
    Toast.show(next === 'light' ? '☀️ Light theme enabled' : '🌙 Dark theme enabled', 'info', 1800);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const sun  = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');
  if (theme === 'dark') {
    if (sun)  sun.style.display  = 'block';
    if (moon) moon.style.display = 'none';
  } else {
    if (sun)  sun.style.display  = 'none';
    if (moon) moon.style.display = 'block';
  }
}

// ─── SIDEBAR ──────────────────────────────────────────────
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const pin     = document.getElementById('sidebarPin');
  const burger  = document.getElementById('burgerBtn');
  const overlay = document.getElementById('overlay');
  const logo    = document.getElementById('logoLink');

  let pinned = localStorage.getItem('dd_sidebar_pinned') !== 'false';
  applyCollapsed(!pinned);

  function applyCollapsed(c) {
    sidebar.classList.toggle('collapsed', c);
    document.getElementById('mainWrap')?.classList.toggle('expanded', c);
  }

  pin?.addEventListener('click', () => {
    pinned = !pinned;
    localStorage.setItem('dd_sidebar_pinned', String(pinned));
    applyCollapsed(!pinned);
    pin.classList.toggle('pinned', pinned);
  });

  burger?.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('show', sidebar.classList.contains('mobile-open'));
    } else {
      pinned = !pinned;
      applyCollapsed(!pinned);
    }
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('show');
    document.getElementById('notifPanel')?.classList.remove('open');
  });

  // Logo click → dashboard (no hard refresh)
  logo?.addEventListener('click', () => {
    Router.navigate('dashboard');
    if (window.innerWidth <= 900) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('show');
    }
  });

  // Nav search filter
  document.getElementById('navSearch')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.nav-link').forEach(a => {
      a.style.display = q && !a.textContent.trim().toLowerCase().includes(q) ? 'none' : '';
    });
  });

  // User avatar click → expand sidebar when collapsed
  document.getElementById('userAvatar')?.addEventListener('click', function() {
    if (sidebar.classList.contains('collapsed') || !pinned) {
      pinned = true;
      localStorage.setItem('dd_sidebar_pinned', 'true');
      applyCollapsed(false);
    }
  });
}

// ─── TOP NAV ──────────────────────────────────────────────
function initTopNav() {
  document.getElementById('globalExport')?.addEventListener('click', () => {
    Toast.show(`📥 Exporting ${Router.getCurrent()} data...`);
    setTimeout(() => Toast.show('✅ Report downloaded'), 1200);
  });
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    Toast.show('🔄 Refreshing data...', 'info', 1200);
    Router.refresh();
  });

  const btn     = document.getElementById('periodPickerBtn');
  const panel   = document.getElementById('periodPanel');
  const overlay = document.getElementById('overlay');

  // Compute correct calendar date ranges
  function getPresetDates(period) {
    const now   = new Date();
    const pad   = n => String(n).padStart(2,'0');
    const fmt   = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    const today = fmt(now);
    let from = '', to = today;
    switch(period) {
      case 'This Month':
        from = now.getFullYear()+'-'+pad(now.getMonth()+1)+'-01'; break;
      case 'Last Month': {
        const f = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const l = new Date(now.getFullYear(), now.getMonth(), 0);
        from = fmt(f); to = fmt(l); break;
      }
      case 'Last 3 Months': { const d=new Date(now); d.setMonth(d.getMonth()-3); from=fmt(d); break; }
      case 'Last 6 Months': { const d=new Date(now); d.setMonth(d.getMonth()-6); from=fmt(d); break; }
      case 'This Year':   from = now.getFullYear()+'-01-01'; break;
      case 'Last Year': { const y=now.getFullYear()-1; from=y+'-01-01'; to=y+'-12-31'; break; }
      case 'Last 7 Days': { const d=new Date(now); d.setDate(d.getDate()-7); from=fmt(d); break; }
      case 'All Time':  from = ''; to = ''; break;
    }
    return { from, to };
  }

  function selectPreset(period) {
    const dates = getPresetDates(period);
    document.querySelectorAll('.period-preset').forEach(b => b.classList.toggle('active', b.dataset.period===period));
    document.getElementById('periodPickerLabel').textContent = period;
    if (document.getElementById('customDateFrom')) document.getElementById('customDateFrom').value = dates.from;
    if (document.getElementById('customDateTo'))   document.getElementById('customDateTo').value   = dates.to;
    window._globalPeriod   = period;
    window._globalDateFrom = dates.from;
    window._globalDateTo   = dates.to;
  }

  // Toggle panel open/close — NO overlay (overlay blocks clicks on the panel itself)
  btn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'block' : 'none';
  });

  // Close panel when clicking anywhere outside it
  document.addEventListener('click', e => {
    if (panel && panel.style.display !== 'none') {
      const wrap = document.getElementById('periodPickerWrap');
      if (wrap && !wrap.contains(e.target)) {
        panel.style.display = 'none';
      }
    }
  });

  // Preset click
  document.getElementById('periodPresets')?.addEventListener('click', e => {
    const t = e.target.closest('.period-preset');
    if (!t) return;
    selectPreset(t.dataset.period);
    panel.style.display = 'none';
    applyGlobalFilters();
  });

  // Custom date apply
  document.getElementById('applyCustomDate')?.addEventListener('click', () => {
    const from = document.getElementById('customDateFrom').value;
    const to   = document.getElementById('customDateTo').value;
    if (!from && !to) { Toast.show('Select at least a start date','error'); return; }
    if (from && to && from > to) { Toast.show('Start date must be before end date','error'); return; }
    document.querySelectorAll('.period-preset').forEach(b => b.classList.remove('active'));
    const label = from && to ? from+' → '+to : from ? 'From '+from : 'Until '+to;
    document.getElementById('periodPickerLabel').textContent = label;
    window._globalPeriod   = 'custom';
    window._globalDateFrom = from;
    window._globalDateTo   = to;
    panel.style.display    = 'none';
    applyGlobalFilters();
  });

  // Zone filter
  document.getElementById('globalZone')?.addEventListener('change', applyGlobalFilters);

  // Init: show All Time by default so dashboard loads all data on first visit
  // User explicitly picks a period to filter down
  selectPreset('All Time');
  document.getElementById('periodPickerLabel').textContent = 'All Time';
}

function applyGlobalFilters() {
  const zone   = document.getElementById('globalZone')?.value || '';
  const period = window._globalPeriod   || 'All Time';
  const from   = window._globalDateFrom || '';
  const to     = window._globalDateTo   || '';
  window._globalZone = zone;

  const parts = [];
  if (zone) parts.push(zone);
  if (period !== 'All Time') parts.push(period === 'custom' ? (from+(to?' → '+to:'')) : period);
  Toast.show(parts.length ? `🔍 Filter: ${parts.join(' · ')}` : '🔍 This month\'s data', 'info', 1800);
  Router.refresh();
}

// ─── LOGOUT MODAL ─────────────────────────────────────────
function initLogoutModal() {
  const logoutBtn    = document.getElementById('logoutBtn');
  const logoutModal  = document.getElementById('logoutModal');
  const logoutCancel = document.getElementById('logoutCancel');
  const logoutConfirm= document.getElementById('logoutConfirm');

  logoutBtn?.addEventListener('click', e => {
    e.stopPropagation();
    logoutModal.style.display = 'flex';
  });
  logoutCancel?.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });
  logoutConfirm?.addEventListener('click', () => {
    logoutModal.style.display = 'none';
    Toast.show('👋 Signing out...', 'info', 1000);
    setTimeout(() => Auth.logout(), 800);
  });
  logoutModal?.addEventListener('click', e => {
    if (e.target === logoutModal) logoutModal.style.display = 'none';
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────
// ─── NOTIFICATIONS ────────────────────────────────────────
function initNotifications() {
  const btn    = document.getElementById('notifBtn');
  const panel  = document.getElementById('notifPanel');
  const overlay= document.getElementById('overlay');

  // Notification definitions with route targets
  // In production these would come from API.notifications() with live data
  // The route field enables automatic navigation when tapped
  const NOTIFS = [
    {
      id:'n1', level:'red',
      title:'Hotspot Alert',
      text:'Dengue cases surged +34% in North Zone this week. Immediate field inspection required.',
      time:'5 min ago', route:'hotspots', icon:'🔥',
    },
    {
      id:'n2', level:'red',
      title:'Critical Occupancy',
      text:'Tata Memorial Hospital at 90% bed capacity. Diversion protocols may apply.',
      time:'18 min ago', route:'facilities', icon:'🏥',
    },
    {
      id:'n3', level:'gold',
      title:'Watch Advisory',
      text:'Tuberculosis treatment defaulter rate increased in Central Zone.',
      time:'1 hr ago', route:'surveillance', icon:'⚠️',
    },
    {
      id:'n4', level:'gold',
      title:'Rising Trend',
      text:'ILI cases climbing in West Zone — cluster alert threshold approaching.',
      time:'2 hrs ago', route:'surveillance', icon:'📈',
    },
    {
      id:'n5', level:'blue',
      title:'Report Published',
      text:'March surveillance summary successfully published to NCD programme.',
      time:'3 hrs ago', route:'ncd', icon:'📋',
    },
    {
      id:'n6', level:'blue',
      title:'Data Sync',
      text:'Facility occupancy data refreshed from all 30 facilities.',
      time:'6 hrs ago', route:'facilities', icon:'🔄',
    },
  ];

  // Dismissed IDs stored in sessionStorage (resets on login)
  function getDismissed() {
    try { return JSON.parse(sessionStorage.getItem('dd_notif_dismissed') || '[]'); } catch { return []; }
  }
  function saveDismissed(ids) {
    try { sessionStorage.setItem('dd_notif_dismissed', JSON.stringify(ids)); } catch {}
  }

  function getActive() {
    const d = getDismissed();
    return NOTIFS.filter(n => !d.includes(n.id));
  }

  function updateBadge(count) {
    const b = btn;
    if (!b) return;
    b.classList.toggle('has-notif', count > 0);
    // Update badge number
    let badge = b.querySelector('.notif-count-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notif-count-badge';
        b.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  }

  function renderNotifs() {
    const active = getActive();
    updateBadge(active.filter(n => n.level === 'red' || n.level === 'gold').length);

    const list = document.getElementById('notifList');
    if (!list) return;

    if (active.length === 0) {
      list.innerHTML = '<div class="notif-empty">✅ All caught up — no new alerts</div>';
      return;
    }

    list.innerHTML = active.map(n => `
      <div class="notif-item notif-tappable" data-id="${n.id}" data-route="${n.route}">
        <div class="notif-dot ${n.level}"></div>
        <div class="notif-body">
          <div class="notif-text"><strong>${n.title}:</strong> ${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
        <button class="notif-dismiss" data-dismiss="${n.id}" title="Dismiss">×</button>
      </div>`).join('');

    // Tap notification → navigate to page + close panel
    list.querySelectorAll('.notif-tappable').forEach(el => {
      el.addEventListener('click', function(e) {
        if (e.target.classList.contains('notif-dismiss')) return;
        const route = this.dataset.route;
        if (route) {
          panel.classList.remove('open');
          overlay.classList.remove('show');
          Router.navigate(route);
        }
      });
    });

    // Dismiss individual
    list.querySelectorAll('.notif-dismiss').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const id = this.dataset.dismiss;
        const item = this.closest('.notif-item');
        item.style.transition = 'opacity .2s, transform .2s';
        item.style.opacity    = '0';
        item.style.transform  = 'translateX(20px)';
        setTimeout(() => {
          const d = getDismissed();
          d.push(id);
          saveDismissed(d);
          renderNotifs();
        }, 200);
      });
    });
  }

  // Build panel header with clear-all
  const header = document.getElementById('notifPanel')?.querySelector('.notif-header');
  if (header) {
    header.innerHTML = `
      <span>Alerts &amp; Notifications</span>
      <div style="display:flex;align-items:center;gap:8px">
        <button id="notifClearAll" style="font-size:.72rem;color:var(--text3);background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:4px;transition:color .15s" title="Clear all">Clear All</button>
        <button class="notif-close" id="notifClose">×</button>
      </div>`;

    document.getElementById('notifClearAll')?.addEventListener('click', () => {
      const items = document.querySelectorAll('.notif-item');
      items.forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = 'opacity .15s, transform .15s';
          el.style.opacity    = '0';
          el.style.transform  = 'translateX(20px)';
        }, i * 40);
      });
      setTimeout(() => {
        saveDismissed(NOTIFS.map(n => n.id));
        renderNotifs();
      }, items.length * 40 + 200);
    });
  }

  // Close button
  document.getElementById('notifClose')?.addEventListener('click', () => {
    panel.classList.remove('open');
    overlay.classList.remove('show');
  });

  // Bell button toggle
  btn?.addEventListener('click', e => {
    e.stopPropagation();
    const open = panel.classList.toggle('open');
    overlay.classList.toggle('show', open);
    if (open) renderNotifs();
  });

  // Initial badge
  renderNotifs();
}

// ─── REGISTER PAGES ───────────────────────────────────────
function registerPages() {
  Router.register('dashboard',    area => Pages.dashboard(area));
  Router.register('ncd',          area => Pages.ncd(area));
  Router.register('surveillance', area => Pages.surveillance(area));
  Router.register('hotspots',     area => Pages.hotspots(area));
  Router.register('facilities',   area => Pages.facilities(area));
  Router.register('patients',     area => Pages.patients(area));
  Router.register('settings',     area => Pages.settings(area));
}