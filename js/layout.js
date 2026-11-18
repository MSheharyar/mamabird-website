/* ============================================================
   THREE BABY BIRDIES, layout.js
   The nav, mobile menu, footer and icon sprite are rendered by the
   server (includes/*.php), so they are in the HTML crawlers read.
   All that is left here is the one thing the server cannot know:
   whether this browser holds a signed-in session, which swaps the
   "Sign In" button for "My Classroom".
   ============================================================ */

(function () {

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
    const appDest = user.role === 'admin' ? 'admin' : user.role === 'teacher' ? 'teacher' : 'app';
    const cta = document.querySelector('.nav-cta');
    if (cta) {
      // Sign out is removed from public nav, child cannot log out from here.
      // Parent must use the PIN-protected Sign out inside the app.
      cta.outerHTML = `<a href="/${appDest}" class="nav-cta" style="background:var(--green);">My Classroom →</a>`;
    }
    const mobCta = document.querySelector('.mob-cta');
    if (mobCta) mobCta.outerHTML = `<a href="/${appDest}" class="mob-cta" style="background:var(--green);">My Classroom →</a>`;
  }

})();
