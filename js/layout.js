/* ============================================================
   THREE BABY BIRDIES, layout.js
   Injects shared nav and footer HTML on every page.
   Runs synchronously (placed before main.js at end of <body>)
   so main.js DOMContentLoaded can wire events on injected elements.
   ============================================================ */

(function () {

  const NAV_INNER = `<div class="nav-inner">
  <a href="index.html" class="nav-logo"><div class="nav-logo-icon" style="background:var(--red);box-shadow:0 2px 8px rgba(204,41,41,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg></div>Three Baby Birdies</a>
  <ul class="nav-links">
    <li><a href="about.html">About</a></li>
    <li><a href="book.html">The Book</a></li>
    <li><a href="chatbot.html">Chirpy's Classroom</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="login.html" class="nav-cta">Sign In / Join Free</a></li>
  </ul>
  <button class="nav-ham" id="ham" aria-label="Open menu">☰</button>
</div>`;

  const MOB_LINKS = `<a href="index.html">Home</a>
<a href="about.html">About</a>
<a href="book.html">The Book</a>
<a href="blog.html">Blog</a>
<a href="chatbot.html">Chirpy's Classroom</a>
<a href="quiz.html">Find Your Starting Point</a>
<a href="game.html">Play the Game</a>
<a href="contact.html">Contact</a>
<a href="login.html" class="mob-cta">Sign In / Join Free</a>`;

  const FOOTER_INNER = `<div class="footer-inner">
  <div class="footer-grid">
    <div class="footer-brand">
      <h3>Three Baby Birdies</h3>
      <p>Stories that bring blue skies, a warm sun, and three little red birds to young readers. Written by Iris Scarfone, illustrated by Ronald Scarfone.</p>
      <!-- Social row removed: the four icons were placeholder glyphs pointing at href="#".
           Restore it here once Iris supplies the real profile URLs. The .social-row /
           .social-icon styles are still in css/main.css, ready to use. -->
    </div>
    <div class="footer-col">
      <h4>Quick Links</h4>
      <ul class="footer-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="book.html">The Book</a></li>
        <li><a href="blog.html">Blog</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Chirpy's Classroom</h4>
      <ul class="footer-links">
        <li><a href="quiz.html">Find your starting point</a></li>
        <li><a href="game.html">Play Chirpy's First Flight</a></li>
        <li><a href="chatbot.html">Try the Chatbot</a></li>
        <li><a href="pricing.html">Pricing &amp; Plans</a></li>
        <li><a href="login.html">Sign In</a></li>
        <li><a href="login.html">Create Account</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <div class="footer-contact-line"><span>iris@threebabybirdies.com</span></div>
      <div class="footer-contact-line"><span>Available Nationwide</span></div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; 2026 Three Baby Birdies &middot; Iris Scarfone. All rights reserved.</span>
    <div class="footer-bottom-links"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a><a href="coppa.html">COPPA Compliance</a></div>
  </div>
</div>`;

  const nav = document.getElementById('nav');
  if (nav) nav.innerHTML = NAV_INNER;

  const mob = document.getElementById('mob-menu');
  if (mob) mob.innerHTML = MOB_LINKS;

  const footer = document.getElementById('footer');
  if (footer) footer.innerHTML = FOOTER_INNER;

  // Swap nav CTA based on auth state, only when a valid, UNEXPIRED JWT is present.
  function mbTokenValid(t) {
    try {
      const p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = p.length % 4 ? '='.repeat(4 - (p.length % 4)) : '';
      return JSON.parse(atob(p + pad)).exp * 1000 > Date.now();
    } catch (e) { return false; }
  }
  let token = localStorage.getItem('mb_token');
  let user  = JSON.parse(localStorage.getItem('mb_user') || 'null');
  if (token && !mbTokenValid(token)) {
    // Stale/expired session left in localStorage, clear it so the nav shows
    // "Sign In / Join Free" instead of a misleading "My Classroom".
    ['mb_token', 'mb_user', 'mb_child_id'].forEach(k => localStorage.removeItem(k));
    token = null; user = null;
  }
  if (token && user) {
    // Determine correct app destination by role
    const appDest = user.role === 'admin' ? 'admin.html' : user.role === 'teacher' ? 'teacher.html' : 'app.html';
    const cta = document.querySelector('.nav-cta');
    if (cta) {
      // Sign out is removed from public nav, child cannot log out from here.
      // Parent must use the PIN-protected Sign out inside the app.
      cta.outerHTML = `<a href="${appDest}" class="nav-cta" style="background:var(--green);">My Classroom →</a>`;
    }
    const mobCta = document.querySelector('.mob-cta');
    if (mobCta) mobCta.outerHTML = `<a href="${appDest}" class="mob-cta" style="background:var(--green);">My Classroom →</a>`;
  }

})();
