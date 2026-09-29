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

  var MEASUREMENT_ID = 'G-W4E0J01WMX';

  // Not a legal requirement in the US, but a cheap courtesy and this is a
  // site whose whole pitch is being careful with children.
  var nav = global.navigator || {};
  if (nav.doNotTrack === '1' || nav.doNotTrack === 'yes' ||
      global.doNotTrack === '1' || nav.msDoNotTrack === '1') {
    return;
  }

  var d = global.document;
  var s = d.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  d.head.appendChild(s);

  global.dataLayer = global.dataLayer || [];
  function gtag() { global.dataLayer.push(arguments); }
  global.gtag = gtag;

  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, {
    // The page, without whatever was after the "?".
    page_location: global.location.origin + global.location.pathname,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
})(window);
