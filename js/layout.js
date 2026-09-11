/* ============================================================
   THREE BABY BIRDIES, layout.js
   Injects shared nav and footer HTML on every page.
   Runs synchronously (placed before main.js at end of <body>)
   so main.js DOMContentLoaded can wire events on injected elements.
   ============================================================ */

(function () {

  /* One sprite of line icons, injected on every page so markup can say
     <svg class="ic"><use href="#i-book"></use></svg> and nothing has to
     load. Sizing and colour come from css/main.css .ic. */
  const ICON_SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" class="icon-sprite" aria-hidden="true" focusable="false"><symbol id="i-book" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5.4c3-1.4 6-1.4 9 0v13.2c-3-1.4-6-1.4-9 0z"/><path d="M21 5.4c-3-1.4-6-1.4-9 0v13.2c3-1.4 6-1.4 9 0z"/></symbol><symbol id="i-bird" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15.2 7.2h.01"/><path d="M4 18.5h6.6a7 7 0 0 0 7-7V7.6A3.4 3.4 0 0 0 11.5 5.2L3 19"/><path d="m17.6 7 2.6.6-2.6.7"/></symbol><symbol id="i-birds" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.4 6.6h.01"/><path d="M2.5 14.5h3.8a4.3 4.3 0 0 0 4.3-4.3V8.3A2.1 2.1 0 0 0 7 6.9L2 15"/><path d="M16.6 12.4h.01"/><path d="M10.6 20.3h3.8a4.3 4.3 0 0 0 4.3-4.3v-1.9a2.1 2.1 0 0 0-3.6-1.4l-5 8.1"/></symbol><symbol id="i-gift" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.2" y="9.4" width="17.6" height="10.4" rx="2"/><path d="M12 9.4v10.4M3.2 13.6h17.6"/><path d="M12 9.4S9.6 4.6 7.6 6s.9 3.4 4.4 3.4zM12 9.4s2.4-4.8 4.4-3.4-.9 3.4-4.4 3.4z"/></symbol><symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 19 6v5.4c0 4.2-2.9 7.7-7 9.4-4.1-1.7-7-5.2-7-9.4V6z"/></symbol><symbol id="i-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.2" y="10.2" width="15.6" height="9.6" rx="2"/><path d="M8 10.2V7.4a4 4 0 0 1 8 0v2.8"/></symbol><symbol id="i-bolt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13.2 3 5.4 13.2h5L9 21l8-10.2h-5z"/></symbol><symbol id="i-devices" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="5" width="13.4" height="9.6" rx="1.6"/><path d="M6 18.6h6"/><path d="M9 14.6v4"/><rect x="17.2" y="8.6" width="4.6" height="10" rx="1.6"/></symbol><symbol id="i-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11.4"/><path d="m7.4 11.2 4.6 4.6 4.6-4.6"/><path d="M4.2 20h15.6"/></symbol><symbol id="i-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.4" cy="19.6" r="1.5"/><circle cx="17.6" cy="19.6" r="1.5"/><path d="M2.4 3.4h3l2.7 12.2h10.2L21 7.4H6.2"/></symbol><symbol id="i-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.8"/><path d="m10.2 8.2 6 3.8-6 3.8z" fill="currentColor" stroke="none"/></symbol><symbol id="i-game" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.2" y="7" width="19.6" height="10.8" rx="4.2"/><path d="M7.2 10.8v3.2M5.6 12.4h3.2"/><circle cx="16.4" cy="11.4" r="1.1" fill="currentColor" stroke="none"/><circle cx="18.6" cy="14" r="1.1" fill="currentColor" stroke="none"/></symbol><symbol id="i-note" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 18.2V6l10-2.2v12.4"/><ellipse cx="6.6" cy="18.4" rx="2.7" ry="2.4"/><ellipse cx="16.6" cy="16.2" rx="2.7" ry="2.4"/></symbol><symbol id="i-abc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.6 17.4 6 7l3.4 10.4M3.9 14.2h4.2"/><path d="M13.4 17.4V6.8h3.2a2.6 2.6 0 0 1 0 5.3h-3.2M16.6 12.1h.6a2.65 2.65 0 0 1 0 5.3h-3.8"/></symbol><symbol id="i-math" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.4 7.4h6M6.4 4.4v6"/><path d="M14.6 7.4h6"/><path d="M4 17.6 8.8 13M4 13l4.8 4.6"/><path d="M14.6 15.4h6M14.6 18.4h6"/></symbol><symbol id="i-pencil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 20 1.1-4.1L16 5l3 3L8.1 18.9z"/><path d="m13.8 7.2 3 3"/></symbol><symbol id="i-puzzle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.6 3.6h2.1a1.6 1.6 0 0 1 3.2 0h2.1a1 1 0 0 1 1 1v2.9a1.6 1.6 0 0 1 0 3.2v2.9a1 1 0 0 1-1 1h-2.9a1.6 1.6 0 0 0-3.2 0H7.8a1 1 0 0 1-1-1v-2.1a1.6 1.6 0 0 1 0-3.2V4.6a1 1 0 0 1 1-1z"/></symbol><symbol id="i-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 12h13.6"/><path d="m12.8 6.6 5.4 5.4-5.4 5.4"/></symbol><symbol id="i-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 19.6h16.8"/><path d="M6 17V11.6M11.4 17V7.8M16.8 17V4.6"/></symbol><symbol id="i-screen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.2" width="18" height="11.6" rx="2"/><path d="M9 20h6M12 15.8V20"/></symbol><symbol id="i-bulb" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.6 17.2h4.8"/><path d="M10.4 20.2h3.2"/><path d="M12 3.4a5.9 5.9 0 0 0-3.4 10.8v3h6.8v-3A5.9 5.9 0 0 0 12 3.4z"/></symbol><symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5.2 12.6 4.6 4.6L18.8 6.8"/></symbol><symbol id="i-cross" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/></symbol><symbol id="i-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 14.2a3 3 0 0 1-3 3H9.2l-5.6 4V6.2a3 3 0 0 1 3-3h10.8a3 3 0 0 1 3 3z"/></symbol><symbol id="i-sparkle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 5.4L19.4 10 14 12l-2 5.6L10 12 4.6 10 10 8.4z"/></symbol><symbol id="i-star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3.4 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.4 6.6 20.3l1-6.1-4.4-4.3 6.1-.9z"/></symbol><symbol id="i-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.8" y="5" width="18.4" height="14" rx="2.2"/><path d="m3.4 6.6 8.6 6 8.6-6"/></symbol><symbol id="i-palette" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2a8.8 8.8 0 0 0 0 17.6c1.5 0 2.1-1.1 1.7-2.1-.5-1.4.4-2.6 1.9-2.6h2.2a3.6 3.6 0 0 0 3-3.7c0-4.9-4-9.2-8.8-9.2z"/><circle cx="7.4" cy="11.4" r="1" fill="currentColor" stroke="none"/><circle cx="9.8" cy="7.6" r="1" fill="currentColor" stroke="none"/><circle cx="14.4" cy="7.4" r="1" fill="currentColor" stroke="none"/></symbol><symbol id="i-speaker" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 9.4h3.2L11 6v12L6.8 14.6H3.6z"/><path d="M14.8 9.6a4 4 0 0 1 0 4.8"/><path d="M17.4 7a7.6 7.6 0 0 1 0 10"/></symbol><symbol id="i-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/></symbol><symbol id="i-child" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/></symbol><symbol id="i-target" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></symbol><symbol id="i-pen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.6 4.6 19.4 11.4 9.8 21H3v-6.8z"/><path d="m10.6 6.6 6.8 6.8"/></symbol></svg>`;


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
      <h3><span class="footer-mark"><img src="assets/chirpy.png" alt="" class="mascot"></span>Three Baby Birdies</h3>
      <p>A rhyming picture book for little readers, and an AI learning friend to carry on after the last page.</p>
      <!-- Social row removed: the four icons were placeholder glyphs pointing at href="#".
           Restore it here once Iris supplies the real profile URLs. The .social-row /
           .social-icon styles are still in css/main.css, ready to use. -->
    </div>
    <div class="footer-col">
      <h4>Explore</h4>
      <ul class="footer-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="book.html">The Book</a></li>
        <li><a href="blog.html">Blog</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Learn with Chirpy</h4>
      <ul class="footer-links">
        <li><a href="chatbot.html">Try Chirpy Free</a></li>
        <li><a href="app.html">Explore the Classroom</a></li>
        <li><a href="game.html">Play Chirpy's First Flight</a></li>
        <li><a href="quiz.html">Find your starting point</a></li>
        <li><a href="pricing.html">Pricing &amp; Plans</a></li>
        <li><a href="login.html">Sign In</a></li>
        <li><a href="login.html">Create Account</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <a class="footer-mail" href="mailto:iris@threebabybirdies.com"><svg class="ic" aria-hidden="true"><use href="#i-mail"></use></svg>iris@threebabybirdies.com</a>
      <div class="footer-contact-line"><span>Available online across the U.S.</span></div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>&copy; 2026 Three Baby Birdies &middot; Iris Scarfone. All rights reserved.</span>
    <div class="footer-bottom-links"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a><a href="coppa.html">COPPA &amp; Children&rsquo;s Privacy</a></div>
  </div>
</div>`;

  if (!document.querySelector('.icon-sprite')) {
    document.body.insertAdjacentHTML('afterbegin', ICON_SPRITE);
  }

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
