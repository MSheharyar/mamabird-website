/* ============================================================
   THREE BABY BIRDIES — layout.js
   Injects shared nav and footer HTML on every page.
   Runs synchronously (placed before main.js at end of <body>)
   so main.js DOMContentLoaded can wire events on injected elements.
   ============================================================ */

(function () {

  const NAV_INNER = `<div class="nav-inner">
  <a href="index.html" class="nav-logo"><div class="nav-logo-icon" style="background:var(--red);box-shadow:0 2px 8px rgba(204,41,41,0.4);">🐦</div>Three Baby Birdies</a>
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
<a href="ebook.html"><i data-lucide="download" style="width:14px;height:14px;"></i> eBook — $4.99</a>
<a href="contact.html"><i data-lucide="mail" style="width:14px;height:14px;"></i> Contact</a>
<a href="login.html" class="mob-cta">Sign In / Join Free</a>`;

  const FOOTER_INNER = `<div class="footer-inner">
  <div class="footer-grid">
    <div class="footer-brand">
      <h3><i data-lucide="feather" style="width:16px;height:16px;margin-right:4px;"></i>Three Baby Birdies</h3>
      <p>Stories that bring blue skies, a warm sun, and three little red birds to young readers. Written by Iris Scarfone, illustrated by Ronald Scarfone.</p>
      <div class="social-row"><a class="social-icon" href="#">f</a><a class="social-icon" href="#">in</a><a class="social-icon" href="#">p</a><a class="social-icon" href="#">&#9654;</a></div>
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
    <div class="footer-bottom-links"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">COPPA Compliance</a></div>
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

  const birds = [
    { emoji:'🐦', top:'14%', left:'2%',  size:'1.5rem', anim:'pg-float-a 4.2s ease-in-out infinite', delay:'0s'   },
    { emoji:'🐦', top:'28%', right:'2%', size:'1.1rem', anim:'pg-float-b 5.1s ease-in-out infinite', delay:'.8s'  },
    { emoji:'🪺', top:'62%', left:'1%',  size:'1.3rem', anim:'pg-float-c 6s ease-in-out infinite',   delay:'1.4s' },
    { emoji:'🐦', top:'75%', right:'2%', size:'1.0rem', anim:'pg-float-a 4.8s ease-in-out infinite', delay:'.4s'  },
  ];
  birds.forEach(b => {
    const el = document.createElement('div');
    el.className = 'pg-bird';
    el.textContent = b.emoji;
    el.style.cssText = `
      font-size:${b.size};
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

  // Swap nav CTA based on auth state
  const token = localStorage.getItem('mb_token');
  const user  = JSON.parse(localStorage.getItem('mb_user') || 'null');
  if (token && user) {
    const cta = document.querySelector('.nav-cta');
    if (cta) {
      cta.outerHTML = `<span style="display:flex;align-items:center;gap:10px;">
        <a href="chatbot.html" class="nav-cta" style="background:var(--green);">My Classroom</a>
        <a href="#" onclick="localStorage.clear();window.location.href='index.html';return false;" style="font-family:var(--font-display);font-size:.8rem;font-weight:700;color:var(--light-text);text-decoration:none;">Sign out</a>
      </span>`;
    }
    const mobCta = document.querySelector('.mob-cta');
    if (mobCta) mobCta.outerHTML = `<a href="chatbot.html" class="mob-cta" style="background:var(--green);">My Classroom</a>`;
  }

})();
