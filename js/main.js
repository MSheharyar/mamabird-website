/* ============================================================
   THREE BABY BIRDIES — main.js
   Shared across all pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Nav scroll shadow ---- */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });
  }

  /* ---- Mobile hamburger ---- */
  const ham  = document.getElementById('ham');
  const mob  = document.getElementById('mob-menu');
  if (ham && mob) {
    ham.addEventListener('click', () => {
      const open = mob.classList.toggle('open');
      ham.textContent = open ? '✕' : '☰';
      ham.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mob.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mob.classList.remove('open');
        ham.textContent = '☰';
      });
    });
  }

  /* ---- Active nav link (based on current page) ---- */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, #mob-menu a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ---- Reveal on scroll ----
     The client notes ask for this in four sections. The hiding class goes
     on <html> from script, so if script never runs, or IntersectionObserver
     is missing, every .reveal stays plainly visible. Each element is
     unobserved once it has shown: this is an entrance, not a toggle. */
  const targets = document.querySelectorAll('.reveal');
  if (targets.length && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(t => io.observe(t));
  }

});
