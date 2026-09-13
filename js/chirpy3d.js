/* ============================================================
   THREE BABY BIRDIES, chirpy3d.js
   The 3D Chirpy, as one component with one API.

   Usage:
     var bird = Chirpy3D.mount(el, { size: 220, loop: false });
     bird.speak();        // animate, because Chirpy is talking
     bird.rest();         // settle back to the still frame
     bird.play();         // one pass, then settle (a greeting)
     bird.destroy();

   WHAT THIS IS TODAY
   ------------------
   A 4 second render of the character on black, keyed to transparency
   and shipped two ways:

     chirpy3d.webm   VP9 with an alpha channel. Chrome, Firefox, Edge.
                     Can be paused and scrubbed, so "animate only while
                     speaking" is real.
     chirpy3d.webp   Animated WebP. Safari, which will happily decode a
                     VP9 webm and then ignore its alpha, drawing the bird
                     on a black rectangle. A WebP cannot be paused, so on
                     that path "rest" swaps to the still frame instead.
     chirpy3d-poster.png
                     One frame. The resting state, and the whole story
                     under prefers-reduced-motion.

   The clip is a head turn and a wing flap. THE BEAK NEVER OPENS, so
   nothing here claims to lip-sync. While Chirpy speaks the body moves;
   that is the honest limit of a rendered clip.

   WHEN THE 3D SOURCE ARRIVES
   --------------------------
   Replace SOURCES and makeRenderer below. Nothing else on the site
   knows how this is drawn: every caller only ever says speak, rest,
   play or destroy. A model-viewer or three.js renderer implements the
   same four methods and every call site keeps working, including a
   real beak driven by audio amplitude.
   ============================================================ */

(function (global) {
  'use strict';

  var SOURCES = {
    video:  'assets/chirpy3d.webm',
    anim:   'assets/chirpy3d.webp',
    still:  'assets/chirpy3d-poster.png',
    ratio:  480 / 504          // the render's own aspect
  };

  var reduced = global.matchMedia &&
                global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Can this browser show a webm with a real alpha channel? ----
     Not a question canPlayType can answer: Safari reports it can play
     VP9 and then composites the alpha away, which would put a black box
     on the page. The only reliable test is to decode a frame and look
     at a corner pixel. Runs once, cached for the tab. */
  var alphaProbe = null;
  function supportsAlphaVideo() {
    if (alphaProbe) return alphaProbe;
    alphaProbe = new Promise(function (resolve) {
      var cached = null;
      try { cached = sessionStorage.getItem('c3d_alpha'); } catch (e) {}
      if (cached !== null) return resolve(cached === '1');

      var v = document.createElement('video');
      if (!v.canPlayType || !v.canPlayType('video/webm')) return finish(false);

      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.src = SOURCES.video;
      var done = false;
      var bail = setTimeout(function () { finish(false); }, 2500);

      v.addEventListener('loadeddata', function () {
        try {
          var c = document.createElement('canvas');
          c.width = c.height = 8;
          var ctx = c.getContext('2d');
          ctx.clearRect(0, 0, 8, 8);
          ctx.drawImage(v, 0, 0, 8, 8);
          // top-left is background in every frame of this clip
          finish(ctx.getImageData(0, 0, 1, 1).data[3] === 0);
        } catch (e) { finish(false); }
      });
      v.addEventListener('error', function () { finish(false); });

      function finish(ok) {
        if (done) return;
        done = true; clearTimeout(bail);
        try { sessionStorage.setItem('c3d_alpha', ok ? '1' : '0'); } catch (e) {}
        // Releasing the probe's buffer is a courtesy, not a requirement.
        try { v.removeAttribute('src'); v.load(); } catch (e) {}
        resolve(ok);
      }
    });
    return alphaProbe;
  }

  /* ---- The two renderers ---- */

  function videoRenderer(root) {
    var v = document.createElement('video');
    v.className = 'c3d-media';
    v.muted = true; v.playsInline = true; v.loop = false;
    v.preload = 'auto';
    v.setAttribute('aria-hidden', 'true');
    v.setAttribute('poster', SOURCES.still);
    v.src = SOURCES.video;
    root.appendChild(v);

    var looping = false;
    v.addEventListener('ended', function () {
      if (looping) { v.currentTime = 0; v.play().catch(noop); }
      else { rest(); }
    });

    function start(loop) {
      looping = !!loop;
      v.currentTime = 0;
      v.play().catch(noop);          // a rejected muted play is not an error
    }
    function rest() {
      looping = false;
      try { v.pause(); v.currentTime = 0; } catch (e) {}
    }
    return { start: start, rest: rest,
             destroy: function () {
               rest();
               try { v.removeAttribute('src'); v.load(); } catch (e) {}
             } };
  }

  function imageRenderer(root) {
    // Safari path. An animated WebP cannot be paused, so resting means
    // swapping back to the single frame.
    var img = document.createElement('img');
    img.className = 'c3d-media';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.src = SOURCES.still;
    root.appendChild(img);

    var timer = null;
    function start(loop) {
      clearTimeout(timer);
      // re-assigning the same src does not restart a WebP, so bust it
      img.src = SOURCES.anim + (loop ? '' : '#t=' + Date.now());
      if (!loop) timer = setTimeout(rest, 4100);   // one pass of the clip
    }
    function rest() {
      clearTimeout(timer);
      img.src = SOURCES.still;
    }
    return { start: start, rest: rest,
             destroy: function () { clearTimeout(timer); } };
  }

  function stillRenderer(root) {
    var img = document.createElement('img');
    img.className = 'c3d-media';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.src = SOURCES.still;
    root.appendChild(img);
    return { start: noop, rest: noop, destroy: noop };
  }

  function makeRenderer(root, cb) {
    if (reduced) return cb(stillRenderer(root));
    supportsAlphaVideo().then(function (ok) {
      cb(ok ? videoRenderer(root) : imageRenderer(root));
    });
  }

  function noop() {}

  /* ---- Public API ---- */

  function mount(el, opts) {
    if (!el) return null;
    opts = opts || {};

    var root = document.createElement('div');
    root.className = 'c3d' + (opts.className ? ' ' + opts.className : '');
    if (opts.size) {
      root.style.width = opts.size + 'px';
      root.style.height = Math.round(opts.size / SOURCES.ratio) + 'px';
    }
    // Something visible from the first paint, whichever renderer wins.
    root.style.setProperty('--c3d-still', 'url(' + SOURCES.still + ')');
    el.appendChild(root);

    var r = null;
    var queued = null;                    // a call that arrived before the probe
    makeRenderer(root, function (made) {
      r = made;
      if (queued) { r[queued[0]].apply(null, queued[1]); queued = null; }
      else if (opts.autoplay) r.start(!!opts.loop);
    });

    function call(name, args) {
      if (r) r[name].apply(null, args || []);
      else queued = [name, args || []];
    }

    return {
      el: root,
      /* Chirpy is talking: keep moving until told otherwise. */
      speak: function () { root.dataset.state = 'speaking'; call('start', [true]); },
      /* Settle to the still frame. */
      rest:  function () { root.dataset.state = 'rest'; call('rest'); },
      /* One pass, then settle. A greeting, a celebration. */
      play:  function () { root.dataset.state = 'playing'; call('start', [false]); },
      destroy: function () { call('destroy'); if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  /* Mount every [data-chirpy3d] on the page. The attribute's value, if
     any, is the pixel width. data-chirpy3d-play makes it greet once. */
  function auto() {
    var nodes = document.querySelectorAll('[data-chirpy3d]');
    Array.prototype.forEach.call(nodes, function (n) {
      if (n.__c3d) return;
      var size = parseInt(n.getAttribute('data-chirpy3d'), 10);
      n.__c3d = mount(n, {
        size: size || null,
        autoplay: n.hasAttribute('data-chirpy3d-play'),
        loop: n.hasAttribute('data-chirpy3d-loop')
      });
    });
  }

  global.Chirpy3D = { mount: mount, auto: auto, sources: SOURCES,
                      supportsAlphaVideo: supportsAlphaVideo };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', auto);
  } else {
    auto();
  }

  /* Half the places Chirpy appears are rendered after load: the quiz
     result card, a chat bubble, a badge. A one-shot pass at
     DOMContentLoaded would miss all of them, so watch for new nodes and
     mount whatever turns up. mount() marks the element, so a node that
     has already been handled is never mounted twice. */
  if (global.MutationObserver) {
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      // Coalesce a burst of insertions into one pass.
      (global.requestAnimationFrame || setTimeout)(function () {
        pending = false;
        auto();
      }, 0);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})(window);
