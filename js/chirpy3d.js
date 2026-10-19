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
    ratio:  480 / 504,         // the render's own aspect
    // Five mouth positions, closed through wide, cut from frames 175 to
    // 185 of the same clip. That window is the only one where the beak
    // travels almost its whole range while body_dx and body_dz stay at
    // zero, so the head does not shift between levels.
    mouth:  'assets/chirpy-talk.png',
    mouthFrames: 5,
    mouthRatio: 240 / 404
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
      // A cached yes carries no element: the renderer makes its own, and
      // that request is a cache hit because it is the same URL.
      if (cached !== null) return resolve({ ok: cached === '1', video: null });

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
        // The probe used to throw this element away, which meant the clip
        // was downloaded twice -- 437KB to read one pixel, then 437KB
        // again for the renderer, 841KB of a 1.2MB page. When the answer
        // is yes the element is handed on and becomes the renderer; only
        // when the answer is no is the buffer released, because then
        // nothing is going to play it.
        if (ok) return resolve({ ok: true, video: v });
        try { v.removeAttribute('src'); v.load(); } catch (e) {}
        resolve({ ok: false, video: null });
      }
    });
    return alphaProbe;
  }

  /* ---- The two renderers ---- */

  function videoRenderer(root, existing) {
    // `existing` is the element the alpha probe already loaded, adopted so
    // the clip is fetched once rather than twice.
    var v = existing || document.createElement('video');
    v.className = 'c3d-media';
    v.muted = true; v.playsInline = true; v.loop = false;
    v.preload = 'auto';
    v.setAttribute('aria-hidden', 'true');
    v.setAttribute('poster', SOURCES.still);
    if (!existing) v.src = SOURCES.video;
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

  /* ---- The mouth ----
     Swaps between five real frames of the character rather than animating
     anything, so the beak matches the art exactly. setMouth takes 0 to 1;
     chirpy-voice.js feeds it the live amplitude of whatever Chirpy is
     saying, which is what makes this lip-sync rather than a loop. */
  function mouthRenderer(root) {
    var img = document.createElement('img');
    img.className = 'c3d-media c3d-mouth';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.src = SOURCES.mouth;
    img.style.width = (SOURCES.mouthFrames * 100) + '%';
    root.appendChild(img);

    var level = -1;
    function setMouth(v) {
      var n = SOURCES.mouthFrames;
      var i = Math.round(Math.max(0, Math.min(1, v)) * (n - 1));
      if (i === level) return;
      level = i;
      img.style.transform = 'translateX(' + (-i * (100 / n)) + '%)';
    }
    setMouth(0);
    return {
      start: function () {},
      rest: function () { setMouth(0); },
      setMouth: setMouth,
      destroy: function () {}
    };
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

  function makeRenderer(root, cb, opts) {
    // A mouth that moves with the words beats a body that moves without
    // them, so when a caller asks to talk it gets the sprite either way.
    if (opts && opts.mouth) return cb(mouthRenderer(root));
    if (reduced) return cb(stillRenderer(root));
    // Nothing is ever going to call start() on this one, so the 437KB clip
    // would be downloaded to show its poster frame and nothing else.
    if (opts && opts.staticOnly) return cb(stillRenderer(root));
    supportsAlphaVideo().then(function (res) {
      cb(res.ok ? videoRenderer(root, res.video) : imageRenderer(root));
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
    //
    // Root-relative on purpose. This value is consumed by a background
    // shorthand in css/main.css, and a relative url() inside a custom
    // property resolves against the stylesheet that uses it, not the
    // document -- so "assets/..." was being fetched as /css/assets/... and
    // 404ing on every page. The other SOURCES paths are fine as they are,
    // because they go on elements in the document.
    root.style.setProperty('--c3d-still', 'url(/' + SOURCES.still + ')');
    el.appendChild(root);

    var r = null;
    var queued = null;                    // a call that arrived before the probe
    if (opts.mouth) {
      root.classList.add('c3d-talking');
      root.style.setProperty('--c3d-still', 'none');
    }
    makeRenderer(root, function (made) {
      r = made;
      if (queued) { r[queued[0]].apply(null, queued[1]); queued = null; }
      else if (opts.autoplay) r.start(!!opts.loop);
    }, opts);

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
      /* 0 is shut, 1 is wide. A no-op on the video and image renderers,
         so callers never have to ask which one they got. */
      setMouth: function (v) { if (r && r.setMouth) r.setMouth(v); },
      canMouth: function () { return !!(r && r.setMouth); },
      destroy: function () { call('destroy'); if (root.parentNode) root.parentNode.removeChild(root); }
    };
  }

  /* Mount every [data-chirpy3d] on the page. The attribute's value, if
     any, is the pixel width. data-chirpy3d-play makes it greet once. */
  /* Mounting fetches a 437KB clip, and on the homepage the character sits
     well below the fold, where it was competing for bandwidth with the
     book cover that is the page's largest contentful paint. So a
     [data-chirpy3d] is mounted when it comes near the viewport rather
     than at DOMContentLoaded. Anything already on screen mounts
     immediately, so nothing above the fold waits for a scroll.

     mount() is untouched: the pages that call it directly for the talking
     mouth never load the video at all. */
  var io = null;
  function lazyMount(n) {
    if (n.__c3d || n.__c3dPending) return;
    var size = parseInt(n.getAttribute('data-chirpy3d'), 10);
    var plays = n.hasAttribute('data-chirpy3d-play');
    n.__c3d = mount(n, {
      size: size || null,
      autoplay: plays,
      loop: n.hasAttribute('data-chirpy3d-loop'),
      // loop only ever took effect once autoplay had fired, so a node with
      // data-chirpy3d-loop and no data-chirpy3d-play -- which is what the
      // homepage has -- has always shown a still poster while downloading
      // the whole clip to do it. It gets the still image instead. Adding
      // data-chirpy3d-play is what makes one animate.
      staticOnly: !plays
    });
  }

  function auto() {
    var nodes = document.querySelectorAll('[data-chirpy3d]');
    if (!global.IntersectionObserver) {
      Array.prototype.forEach.call(nodes, lazyMount);
      return;
    }
    if (!io) {
      io = new global.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          e.target.__c3dPending = false;
          lazyMount(e.target);
        });
      }, { rootMargin: '300px 0px' });   // start a little before it shows
    }
    Array.prototype.forEach.call(nodes, function (n) {
      if (n.__c3d || n.__c3dPending) return;
      n.__c3dPending = true;
      io.observe(n);
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
