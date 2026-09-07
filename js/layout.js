/* ============================================================
   THREE BABY BIRDIES — layout.js
   Injects shared nav and footer HTML on every page.
   Runs synchronously (placed before main.js at end of <body>)
   so main.js DOMContentLoaded can wire events on injected elements.
   ============================================================ */

(function () {

  const NAV_INNER = `<div class="nav-inner">
  <a href="index.html" class="nav-logo"><div class="nav-logo-icon" style="background:var(--red);box-shadow:0 2px 8px rgba(204,41,41,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg></div>Three Baby Birdies</a>
  <ul class="nav-links">
    <li><a href="index.html"><i data-lucide="home" style="width:14px;height:14px;"></i> Home</a></li>
    <li><a href="about.html"><i data-lucide="user" style="width:14px;height:14px;"></i> About</a></li>
    <li><a href="book.html"><i data-lucide="book-open" style="width:14px;height:14px;"></i> The Book</a></li>
    <li><a href="blog.html"><i data-lucide="newspaper" style="width:14px;height:14px;"></i> Blog</a></li>
    <li><a href="chatbot.html"><i data-lucide="graduation-cap" style="width:14px;height:14px;"></i> Chirpy's Classroom</a></li>
    <li><a href="ebook.html"><i data-lucide="download" style="width:14px;height:14px;"></i> eBook</a></li>
    <li><a href="contact.html"><i data-lucide="mail" style="width:14px;height:14px;"></i> Contact</a></li>
    <li><a href="login.html" class="nav-cta">Sign In / Join Free</a></li>
  </ul>
  <button class="nav-ham" id="ham" aria-label="Open menu">☰</button>
</div>`;

  const MOB_LINKS = `<a href="index.html"><i data-lucide="home" style="width:14px;height:14px;"></i> Home</a>
<a href="about.html"><i data-lucide="user" style="width:14px;height:14px;"></i> About</a>
<a href="book.html"><i data-lucide="book-open" style="width:14px;height:14px;"></i> The Book</a>
<a href="blog.html"><i data-lucide="newspaper" style="width:14px;height:14px;"></i> Blog</a>
<a href="chatbot.html"><i data-lucide="graduation-cap" style="width:14px;height:14px;"></i> Chirpy's Classroom</a>
<a href="ebook.html"><i data-lucide="download" style="width:14px;height:14px;"></i> eBook</a>
<a href="contact.html"><i data-lucide="mail" style="width:14px;height:14px;"></i> Contact</a>
<a href="login.html" class="mob-cta">Sign In / Join Free</a>`;

  const FOOTER_INNER = `<div class="footer-inner">
  <div class="footer-grid">
    <div class="footer-brand">
      <h3><i data-lucide="feather" style="width:16px;height:16px;margin-right:4px;"></i>Three Baby Birdies</h3>
      <p>Stories that bring blue skies, a warm sun, and three little red birds to young readers. Written by Iris Scarfone, illustrated by Ronald Scarfone.</p>
      <!-- Social row removed: the four icons were placeholder glyphs pointing at href="#".
           Restore it here once Iris supplies the real profile URLs. The .social-row /
           .social-icon styles are still in css/main.css, ready to use. -->
    </div>
    <div class="footer-col">
      <h4>Quick Links</h4>
      <ul class="footer-links">
        <li><a href="index.html"><i data-lucide="home" style="width:14px;height:14px;"></i> Home</a></li>
        <li><a href="about.html"><i data-lucide="user" style="width:14px;height:14px;"></i> About</a></li>
        <li><a href="book.html"><i data-lucide="book-open" style="width:14px;height:14px;"></i> The Book</a></li>
        <li><a href="blog.html"><i data-lucide="newspaper" style="width:14px;height:14px;"></i> Blog</a></li>
        <li><a href="contact.html"><i data-lucide="mail" style="width:14px;height:14px;"></i> Contact</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Chirpy's Classroom</h4>
      <ul class="footer-links">
        <li><a href="chatbot.html">Try the Chatbot</a></li>
        <li><a href="pricing.html">Pricing &amp; Plans</a></li>
        <li><a href="ebook.html">📖 Download eBook</a></li>
        <li><a href="login.html">Sign In</a></li>
        <li><a href="login.html">Create Account</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <div class="footer-contact-line"><span class="footer-contact-icon"><i data-lucide="mail" style="width:15px;height:15px;"></i></span><span>iris@threebabybirdies.com</span></div>
      <div class="footer-contact-line"><span class="footer-contact-icon"><i data-lucide="map-pin" style="width:15px;height:15px;"></i></span><span>Available Nationwide</span></div>
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

  // Inject floating birds on every page (fixed, low z-index, no interaction)
  const floatStyle = document.createElement('style');
  floatStyle.textContent = `
    .pg-bird { position:fixed; pointer-events:none; z-index:0; user-select:none; opacity:0; transition:opacity 1s; }
    .pg-bird.loaded { opacity:1; }
    @keyframes pg-float-a { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-14px) rotate(4deg);} }
    @keyframes pg-float-b { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-10px) rotate(-5deg);} }
    @keyframes pg-float-c { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-18px) rotate(6deg);} }
  `;
  document.head.appendChild(floatStyle);

  // Consistent vector bird (Lucide) — renders identically on every OS, unlike the
  // 🐦 emoji which each platform draws in its own colour/style.
  const BIRD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/><path d="m20 7 2 .5-2 .5"/><path d="M10 18v3"/><path d="M14 17.75V21"/><path d="M7 18a6 6 0 0 0 3.84-10.61"/></svg>`;

  const birds = [
    { top:'14%', left:'2%',  size:'1.5rem', anim:'pg-float-a 4.2s ease-in-out infinite', delay:'0s'   },
    { top:'28%', right:'2%', size:'1.1rem', anim:'pg-float-b 5.1s ease-in-out infinite', delay:'.8s'  },
    { top:'62%', left:'1%',  size:'1.3rem', anim:'pg-float-c 6s ease-in-out infinite',   delay:'1.4s' },
    { top:'75%', right:'2%', size:'1.0rem', anim:'pg-float-a 4.8s ease-in-out infinite', delay:'.4s'  },
  ];
  birds.forEach(b => {
    const el = document.createElement('div');
    el.className = 'pg-bird';
    el.innerHTML = BIRD_SVG;
    el.style.cssText = `
      font-size:${b.size};
      color:rgba(204,41,41,.5);
      top:${b.top || 'auto'};
      bottom:${b.bottom || 'auto'};
      left:${b.left || 'auto'};
      right:${b.right || 'auto'};
      animation:${b.anim};
      animation-delay:${b.delay};
    `;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('loaded'), 300);
  });

  // Swap nav CTA based on auth state — only when a valid, UNEXPIRED JWT is present.
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
    // Stale/expired session left in localStorage — clear it so the nav shows
    // "Sign In / Join Free" instead of a misleading "My Classroom".
    ['mb_token', 'mb_user', 'mb_child_id'].forEach(k => localStorage.removeItem(k));
    token = null; user = null;
  }
  if (token && user) {
    // Determine correct app destination by role
    const appDest = user.role === 'admin' ? 'admin.html' : user.role === 'teacher' ? 'teacher.html' : 'app.html';
    const cta = document.querySelector('.nav-cta');
    if (cta) {
      // Sign out is removed from public nav — child cannot log out from here.
      // Parent must use the PIN-protected Sign out inside the app.
      cta.outerHTML = `<a href="${appDest}" class="nav-cta" style="background:var(--green);">My Classroom →</a>`;
    }
    const mobCta = document.querySelector('.mob-cta');
    if (mobCta) mobCta.outerHTML = `<a href="${appDest}" class="mob-cta" style="background:var(--green);">My Classroom →</a>`;
  }

})();
