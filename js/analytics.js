/* ============================================================
   THREE BABY BIRDIES, analytics.js
   Google Analytics 4, in one place.

   WHY GA4 DIRECTLY AND NOT TAG MANAGER
   ------------------------------------
   The brief asked for both. Running both means every pageview can be
   counted twice the moment somebody also configures GA4 inside the GTM
   container, which is the usual way this goes wrong.

   Of the two, this site wants gtag rather than GTM. GTM is a tag
   injector: anybody with container access can add a third-party script
   without a code review. On a site aimed at under-13s that is a real
   exposure, because one remarketing pixel added by a marketer would put
   children's behaviour into an ad network, which is the thing COPPA
   exists to stop. A container is a convenience for the marketing team
   and a standing risk for this particular product. If GTM is wanted
   later it can be added here, deliberately, with the same care.

   WHAT IS SWITCHED OFF, AND WHY
   -----------------------------
   - Google Signals and ads personalisation are both off. Google's own
     terms require this for child-directed properties, and neither is
     any use to us: nobody here is building ad audiences.
   - The query string never leaves the browser. Two pages carry secrets
     in their URL -- reset-password.html?token= and
     ebook-download.html?session_id= -- and GA4 records the full location
     by default, which would file a live password-reset token in a
     reporting tool. Those two pages do not load this script at all, and
     stripping the query as well means the next page with a token in it
     is safe before anyone remembers this rule.
   - Do Not Track is honoured. It costs one line.

   WHERE IT IS NOT LOADED
   ----------------------
   app.html, because that is the page a child is actually sitting on;
   admin.html and teacher.html, because staff tools are not an audience;
   and the two token-carrying pages above.
   ============================================================ */

(function (global) {
  'use strict';

  // G-VQ1360GWLP, from the October brief. The earlier brief gave
  // G-W4E0J01WMX, which was what sat here until now; if both properties
  // are real then the first one has a few weeks of data in it that this
  // change stops adding to.
  var MEASUREMENT_ID = 'G-VQ1360GWLP';

  // Not a legal requirement in the US, but a cheap courtesy and this is a
  // site whose whole pitch is being careful with children.
  var nav = global.navigator || {};
  if (nav.doNotTrack === '1' || nav.doNotTrack === 'yes' ||
      global.doNotTrack === '1' || nav.msDoNotTrack === '1') {
    return;
  }

  var d = global.document;

  // The queue and the gtag function go up straight away, so anything that
  // calls gtag() -- now or later -- is recorded. Only the 175KB library
  // itself waits: it was being fetched while the browser was still
  // getting the book cover on screen, which is this page's largest
  // contentful paint, and on a phone those were competing for the same
  // few hundred kilobits. Commands pushed before it arrives are replayed
  // by it on load, so nothing is lost by waiting -- only the timestamp
  // moves, by about as long as the page took to finish.
  global.dataLayer = global.dataLayer || [];
  function gtag() { global.dataLayer.push(arguments); }
  global.gtag = gtag;

  function fetchLibrary() {
    var s = d.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    d.head.appendChild(s);
  }
  var whenIdle = global.requestIdleCallback || function (f) { global.setTimeout(f, 1); };
  if (d.readyState === 'complete') whenIdle(fetchLibrary);
  else global.addEventListener('load', function () { whenIdle(fetchLibrary); }, { once: true });

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    // The page, without whatever was after the "?".
    page_location: global.location.origin + global.location.pathname,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
})(window);
