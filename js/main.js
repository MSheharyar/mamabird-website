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

  /* ---- Lucide icons ---- */
  if (window.lucide) lucide.createIcons();

  /* ---- Scroll-reveal (simple IntersectionObserver) ---- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => io.observe(el));
  }

});
