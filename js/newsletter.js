/* ============================================================
   Newsletter signup, shared by the homepage and the blog.
   Both pages had their own copy of this; the blog's did nothing at
   all (no <form>, no handler, no endpoint), so it now uses the one
   that works. Any page with #nl-form picks it up; every other page
   this loads on exits on the first line.
   ============================================================ */
// Newsletter signup -> POST /leads/subscribe
(function () {
  const API    = 'https://api.threebabybirdies.com';
  const form   = document.getElementById('nl-form');
  const email  = document.getElementById('nl-email');
  const name   = document.getElementById('nl-name');   // removed from the form; kept optional
  const button = document.getElementById('nl-submit');
  const status = document.getElementById('nl-status');
  if (!form) return;

  function say(message, kind) {
    status.textContent = message;
    status.className = 'nl-status ' + kind;
    status.hidden = false;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    var hp = document.getElementById('nl-website');
    if (hp && hp.value) { say('Thanks!', 'ok'); return; }   // bot
    if (!email.value.trim() || !email.checkValidity()) {
      email.setAttribute('aria-invalid', 'true');
      email.focus();
      say('Please enter an email address we can reach you at.', 'err');
      return;
    }
    email.removeAttribute('aria-invalid');

    button.disabled = true;
    say('Signing you up\u2026', 'ok');

    try {
      const res = await fetch(API + '/leads/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          first_name: name ? (name.value.trim() || null) : null,
          source: 'homepage_newsletter'
        })
      });

      if (res.ok) {
        form.reset();
        say('You\u2019re on the list \u2014 welcome to the flock!', 'ok');
      } else if (res.status === 429) {
        say('That\u2019s a few tries in a row. Give it a minute and try again.', 'err');
      } else {
        say('We couldn\u2019t save that just now. Please try again in a moment.', 'err');
      }
    } catch (err) {
      say('We couldn\u2019t reach the server. Check your connection and try again.', 'err');
    } finally {
      button.disabled = false;
    }
  });
})();
