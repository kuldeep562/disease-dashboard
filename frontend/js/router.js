/* router.js — SPA client-side router
   Key fix: Router.refresh() forces re-run of current page handler
   even when already on that page (bypasses page===current guard).
   Used by filter changes so dashboard reloads without leaving the page.
*/
const Router = (() => {
  const routes = {};
  let current = null;

  function register(name, handler) { routes[name] = handler; }

  function _runPage(page, area) {
    area.scrollTop = 0;
    area.innerHTML = '';
    if (routes[page]) {
      routes[page](area);
    } else {
      area.innerHTML = '<div class="page-section"><p class="text3">Page not found: ' + page + '</p></div>';
    }
    // Scroll-reveal observer
    requestAnimationFrame(function() {
      const els = area.querySelectorAll('.reveal');
      if (!els.length) return;
      const obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      els.forEach(function(el) { obs.observe(el); });
    });
  }

  function navigate(page, pushState) {
    if (pushState === undefined) pushState = true;
    // Same-page guard only when pushState=true (user clicked nav)
    // When pushState=false (filter/refresh), always re-render
    if (page === current && pushState) return;
    current = page;

    if (pushState) history.pushState({ page: page }, '', '#' + page);

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(function(a) {
      a.classList.toggle('active', a.dataset.page === page);
    });

    // Update breadcrumb
    var labels = {
      dashboard:'Dashboard', ncd:'NCD Programme', surveillance:'Surveillance',
      hotspots:'Hotspot Map', facilities:'Facilities', patients:'Patients', settings:'Settings'
    };
    var bc = document.getElementById('bcPage');
    if (bc) bc.textContent = labels[page] || page;

    // Show/hide topnav filters
    var filters = document.getElementById('topnavFilters');
    if (filters) {
      filters.style.display = ['dashboard','ncd','surveillance'].includes(page) ? '' : 'none';
    }

    var area = document.getElementById('pageArea');
    if (!area) return;
    _runPage(page, area);
  }

  // refresh() — unconditionally re-runs the current page (used by filters & refresh button)
  function refresh() {
    var page = current || 'dashboard';
    var area = document.getElementById('pageArea');
    if (!area) return;
    _runPage(page, area);
  }

  function init() {
    window.addEventListener('popstate', function(e) {
      var page = (e.state && e.state.page) ? e.state.page : 'dashboard';
      navigate(page, false);
    });

    document.addEventListener('click', function(e) {
      var link = e.target.closest('.nav-link[data-page]');
      if (link) {
        e.preventDefault();
        navigate(link.dataset.page);
        if (window.innerWidth <= 900) {
          document.getElementById('sidebar')?.classList.remove('mobile-open');
          document.getElementById('overlay')?.classList.remove('show');
        }
      }
    });

    var startPage = (location.hash.slice(1)) || 'dashboard';
    navigate(startPage, false);
  }

  return { register: register, navigate: navigate, refresh: refresh, init: init, getCurrent: function(){ return current; } };
})();