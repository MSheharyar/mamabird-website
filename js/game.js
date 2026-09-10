/* ============================================================
   THREE BABY BIRDIES, Chirpy's First Flight
   js/game.js

   One implementation, two hosts: the standalone game.html page and the
   modal on the homepage. Both call ChirpyFlight.create(container) and get
   back a handle; the module builds its own markup inside the container so
   neither page has to keep a copy of it in sync.

   Logical resolution is 420x640 and every number below is in those units.

   Tuned for the book's audience (2-8), which is why it does not play like
   Flappy Bird: gravity is low, the gaps are wide, the hitbox is smaller
   than Chirpy looks, and touching the sky ceiling nudges him back down
   instead of ending the run.
   ============================================================ */
(function (global) {
  'use strict';

  var W = 420, H = 640, GROUND = 78;
  var SKY_H = H - GROUND;

  // A flap has to roughly cancel one tap-interval of falling, or the bird
  // just climbs to the ceiling on any steady rhythm and dies on the first
  // branch. Balance point is T = -2*flap/gravity, the tap rate that holds
  // altitude: ~0.46s here, a relaxed rate for small hands.
  var SPEEDS = {
    gentle: { scroll: 108, gap: 218, spacing: 300, gravity: 1250, flap: -290, ramp: 0.7 },
    brisk:  { scroll: 142, gap: 190, spacing: 268, gravity: 1500, flap: -330, ramp: 1.4 }
  };

  var BIRD_X = 116;
  var BIRD_R = 15;        // collision radius, deliberately under the art
  var BIRD_DRAW = 46;
  var MAX_FALL = 520;
  var STORE_KEY = 'tbb_flight_best';

  var MARKUP =
    '<div class="cf-stage">' +
      '<canvas class="cf-canvas" width="420" height="640" tabindex="0" role="img"' +
      ' aria-label="Chirpy\'s First Flight, a flying game. Press space or tap to flap."></canvas>' +
      '<div class="cf-hud" hidden>0</div>' +
      '<p class="cf-hint" hidden>Tap or press space to flap</p>' +

      '<div class="cf-panel cf-ready">' +
        '<div class="cf-card">' +
          '<img src="assets/chirpy.png" alt="" class="cf-bird">' +
          '<p class="cf-rhyme">&ldquo;Chirp chirp chirp. Flap your wings and try to fly.<br>' +
          'It is just as easy as easy as pie.&rdquo;</p>' +
          '<button class="btn btn-red cf-start" type="button">Start flying</button>' +
          '<div class="cf-speed" role="group" aria-label="Game speed">' +
            '<button type="button" class="cf-speed-btn" data-speed="gentle" aria-pressed="true">Gentle</button>' +
            '<button type="button" class="cf-speed-btn" data-speed="brisk" aria-pressed="false">Brisk</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="cf-panel cf-over" hidden>' +
        '<div class="cf-card">' +
          '<h3 class="cf-title">Nice flying!</h3>' +
          '<p class="cf-msg"></p>' +
          '<div class="cf-scores">' +
            '<div class="cf-score"><span class="cf-n cf-final">0</span><span class="cf-k">Branches</span></div>' +
            '<div class="cf-score"><span class="cf-n cf-best">0</span><span class="cf-k">Best</span></div>' +
          '</div>' +
          '<button class="btn btn-red cf-again" type="button">Fly again</button>' +
        '</div>' +
      '</div>' +

      '<div class="cf-panel cf-paused" hidden>' +
        '<div class="cf-card">' +
          '<h3 class="cf-title">Paused</h3>' +
          '<p class="cf-msg" style="margin-bottom:0;">Tap to carry on.</p>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<p class="cf-sr" role="status" aria-live="polite"></p>';

  function create(container) {
    if (!container) return null;
    container.innerHTML = MARKUP;

    var canvas = container.querySelector('.cf-canvas');
    if (!canvas || !canvas.getContext) return null;
    var ctx = canvas.getContext('2d');

    var q = function (sel) { return container.querySelector(sel); };
    var el = {
      hud: q('.cf-hud'), hint: q('.cf-hint'),
      ready: q('.cf-ready'), over: q('.cf-over'), paused: q('.cf-paused'),
      start: q('.cf-start'), again: q('.cf-again'),
      title: q('.cf-title'), msg: q('.cf-over .cf-msg'),
      final: q('.cf-final'), best: q('.cf-best'), live: q('.cf-sr')
    };

    var STATE = { READY: 0, PLAYING: 1, OVER: 2, PAUSED: 3 };
    var state = STATE.READY;
    var mode = 'gentle', tune = SPEEDS[mode];
    var bird, branches, clouds, score, best, scrollX, elapsed, flapAnim, shake;
    var raf = null, running = true, last = 0, acc = 0;

    function readBest() {
      try { return parseInt(global.localStorage.getItem(STORE_KEY), 10) || 0; }
      catch (e) { return 0; }               // private mode, blocked storage
    }
    function writeBest(v) {
      try { global.localStorage.setItem(STORE_KEY, String(v)); } catch (e) {}
    }
    best = readBest();
    el.best.textContent = best;

    var sprite = new global.Image();
    var spriteReady = false;
    sprite.onload = function () { spriteReady = true; };
    sprite.src = 'assets/chirpy.png';

    function addBranch(x) {
      // Keep the gap clear of the very top and the ground so there is
      // always a comfortable way through.
      var margin = 92, gap = tune.gap;
      var centre = margin + Math.random() * (SKY_H - gap - margin * 2) + gap / 2;
      branches.push({ x: x, centre: centre, gap: gap, passed: false });
    }

    function resetWorld() {
      bird = { y: SKY_H * 0.42, v: 0, rot: 0 };
      branches = [];
      score = 0; scrollX = 0; elapsed = 0; flapAnim = 0; shake = 0;
      for (var i = 0; i < 3; i++) addBranch(W + 160 + i * tune.spacing);
      clouds = [];
      for (var c = 0; c < 5; c++) {
        clouds.push({
          x: Math.random() * W, y: 40 + Math.random() * (SKY_H * 0.5),
          s: 0.5 + Math.random() * 0.6, sp: 8 + Math.random() * 12
        });
      }
    }

    function start() {
      resetWorld();
      state = STATE.PLAYING;
      el.ready.hidden = true; el.over.hidden = true; el.paused.hidden = true;
      el.hud.hidden = false; el.hud.textContent = '0';
      el.hint.hidden = false;
      last = global.performance.now(); acc = 0;
      canvas.focus();
    }

    function toReady() {
      state = STATE.READY;
      resetWorld();
      el.over.hidden = true; el.paused.hidden = true;
      el.hud.hidden = true; el.hint.hidden = true;
      el.ready.hidden = false;
    }

    function pause() {
      if (state !== STATE.PLAYING) return;
      state = STATE.PAUSED;
      el.paused.hidden = false;
    }

    function resume() {
      if (state !== STATE.PAUSED) return;
      state = STATE.PLAYING;
      el.paused.hidden = true;
      last = global.performance.now(); acc = 0;
    }

    function gameOver() {
      state = STATE.OVER;
      shake = 1;
      if (score > best) { best = score; writeBest(best); }
      el.hud.hidden = true; el.hint.hidden = true;
      el.final.textContent = score;
      el.best.textContent = best;

      // Never scold a five-year-old for losing.
      var title, msg;
      if (score === 0)     { title = 'Good try!';       msg = 'Tap a little sooner to lift Chirpy up.'; }
      else if (score < 4)  { title = 'Nice flying!';    msg = 'You got past ' + score + (score === 1 ? ' branch.' : ' branches.'); }
      else if (score < 10) { title = 'Great flapping!'; msg = score + ' branches. Chirpy is getting the hang of it.'; }
      else                 { title = 'Wonderful!';      msg = score + ' branches. Chirpy can really fly now.'; }
      el.title.textContent = title;
      el.msg.textContent = msg;
      el.live.textContent = title + ' ' + msg + ' Best ' + best + '.';
      el.over.hidden = false;
      el.again.focus();
    }

    function flap() {
      if (state === STATE.READY)  { start();  return; }
      if (state === STATE.PAUSED) { resume(); return; }
      if (state !== STATE.PLAYING) return;
      bird.v = tune.flap;
      flapAnim = 1;
    }

    // ---- input ----
    function onPointer(e) { e.preventDefault(); flap(); }
    function onKey(e) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault(); flap();
      }
    }
    function onVisibility() { if (global.document.hidden) pause(); }

    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('keydown', onKey);
    el.paused.addEventListener('pointerdown', onPointer);
    el.start.addEventListener('click', start);
    el.again.addEventListener('click', start);
    global.document.addEventListener('visibilitychange', onVisibility);

    var speedBtns = container.querySelectorAll('.cf-speed-btn');
    Array.prototype.forEach.call(speedBtns, function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-speed');
        tune = SPEEDS[mode];
        Array.prototype.forEach.call(speedBtns, function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
        toReady();                       // apply from a fair starting point
        el.live.textContent = 'Speed set to ' + mode + '.';
      });
    });

    // ---- update ----
    function update(dt) {
      if (state !== STATE.PLAYING) {
        for (var c = 0; c < clouds.length; c++) {   // keep the scene alive
          clouds[c].x -= clouds[c].sp * dt * 0.4;
          if (clouds[c].x < -90) { clouds[c].x = W + 60; clouds[c].y = 40 + Math.random() * (SKY_H * 0.5); }
        }
        if (shake > 0) shake = Math.max(0, shake - dt * 3);
        return;
      }

      elapsed += dt;
      var speed = tune.scroll + Math.min(elapsed * tune.ramp, 34);

      bird.v = Math.min(bird.v + tune.gravity * dt, MAX_FALL);
      bird.y += bird.v * dt;

      // Ceiling nudges rather than kills.
      if (bird.y < BIRD_R + 4) { bird.y = BIRD_R + 4; bird.v = Math.max(bird.v, 40); }

      bird.rot = Math.max(-0.42, Math.min(1.05, bird.v / 620));
      if (flapAnim > 0) flapAnim = Math.max(0, flapAnim - dt * 5);
      scrollX += speed * dt;

      for (var i = 0; i < branches.length; i++) {
        var b = branches[i];
        b.x -= speed * dt;
        if (!b.passed && b.x + 26 < BIRD_X - BIRD_R) {
          b.passed = true; score++;
          el.hud.textContent = String(score);
          if (score === 1) el.hint.hidden = true;
        }
      }
      while (branches.length && branches[0].x < -90) branches.shift();
      var lastB = branches[branches.length - 1];
      if (lastB && lastB.x < W - tune.spacing) addBranch(lastB.x + tune.spacing);

      for (var k = 0; k < clouds.length; k++) {
        clouds[k].x -= clouds[k].sp * dt;
        if (clouds[k].x < -90) { clouds[k].x = W + 60; clouds[k].y = 40 + Math.random() * (SKY_H * 0.5); }
      }

      if (bird.y + BIRD_R >= SKY_H) { bird.y = SKY_H - BIRD_R; gameOver(); return; }

      for (var j = 0; j < branches.length; j++) {
        var br = branches[j];
        if (br.x + 26 < BIRD_X - BIRD_R || br.x - 26 > BIRD_X + BIRD_R) continue;
        var top = br.centre - br.gap / 2, bot = br.centre + br.gap / 2;
        if (bird.y - BIRD_R < top || bird.y + BIRD_R > bot) { gameOver(); return; }
      }
    }

    // ---- drawing ----
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawCloud(x, y, s) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
      ctx.arc(x + 22 * s, y + 5 * s, 15 * s, 0, Math.PI * 2);
      ctx.arc(x - 21 * s, y + 6 * s, 13 * s, 0, Math.PI * 2);
      ctx.arc(x + 6 * s, y - 13 * s, 15 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200,230,245,.85)';
      roundRect(x - 33 * s, y + 8 * s, 66 * s, 11 * s, 6 * s);
      ctx.fill();
    }

    // The tree from the book cover, not a green pipe.
    function drawBranch(x, yTop, yBot) {
      var w = 52, lx = x - w / 2;
      function limb(y0, y1, fromTop) {
        ctx.fillStyle = '#9B6B35';
        roundRect(lx, y0, w, y1 - y0, 12); ctx.fill();
        ctx.fillStyle = 'rgba(107,69,32,.55)';
        roundRect(lx + w - 15, y0, 15, y1 - y0, 10); ctx.fill();
        var ky = fromTop ? y1 : y0;
        ctx.fillStyle = '#8A5C2C';
        roundRect(lx - 7, ky - (fromTop ? 20 : 0), w + 14, 20, 9); ctx.fill();
        var dir = fromTop ? -1 : 1;
        for (var i = -1; i <= 1; i++) {
          ctx.fillStyle = i === 0 ? '#4A8B3F' : '#5FAD54';
          ctx.beginPath();
          ctx.ellipse(x + i * 22, ky + dir * 6 + (i === 0 ? dir * 8 : 0), 15, 10, i * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      limb(-14, yTop, true);
      limb(yBot, SKY_H + 10, false);
    }

    function drawBird() {
      ctx.save();
      ctx.translate(BIRD_X, bird.y);
      ctx.rotate(bird.rot * 0.5);
      ctx.scale(1, 1 + flapAnim * 0.12);
      if (spriteReady) {
        var w = BIRD_DRAW, h = w * (sprite.height / sprite.width);
        ctx.drawImage(sprite, -w / 2, -h / 2 - 2, w, h);
      } else {
        ctx.fillStyle = '#DC3B2A';
        ctx.beginPath(); ctx.arc(0, 0, BIRD_R + 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function render() {
      ctx.save();
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 7 * shake, (Math.random() - 0.5) * 7 * shake);

      var sky = ctx.createLinearGradient(0, 0, 0, SKY_H);
      sky.addColorStop(0, '#6EB4D4');
      sky.addColorStop(1, '#C4E4F4');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, SKY_H);

      for (var i = 0; i < clouds.length; i++) drawCloud(clouds[i].x, clouds[i].y, clouds[i].s);
      for (var j = 0; j < branches.length; j++) {
        var b = branches[j];
        drawBranch(b.x, b.centre - b.gap / 2, b.centre + b.gap / 2);
      }
      drawBird();

      ctx.fillStyle = '#7CB86E'; ctx.fillRect(0, SKY_H, W, 16);
      ctx.fillStyle = '#BA9435'; ctx.fillRect(0, SKY_H + 16, W, GROUND - 16);
      ctx.fillStyle = 'rgba(107,69,32,.20)';
      for (var g = -1; g < 10; g++) {
        roundRect((g * 54) - (scrollX % 54), SKY_H + 26, 34, 9, 4);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(44,24,16,.10)';
      ctx.fillRect(0, SKY_H, W, 3);
      ctx.restore();
    }

    // ---- loop: fixed step, so a 120Hz screen doesn't run double speed ----
    var STEP = 1 / 60;
    function frame(now) {
      if (!running) return;
      var dt = (now - last) / 1000;
      last = now;
      if (dt > 0.25) dt = 0.25;            // came back from a hidden tab
      acc += dt;
      var guard = 0;
      while (acc >= STEP && guard++ < 5) { update(STEP); acc -= STEP; }
      render();
      raf = global.requestAnimationFrame(frame);
    }

    function fitBackingStore() {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'high';
    }
    global.addEventListener('resize', fitBackingStore);

    fitBackingStore();
    resetWorld();
    last = global.performance.now();
    raf = global.requestAnimationFrame(frame);

    return {
      pause: pause,
      resume: resume,
      reset: toReady,
      focus: function () { canvas.focus(); },
      destroy: function () {
        running = false;
        if (raf) global.cancelAnimationFrame(raf);
        global.document.removeEventListener('visibilitychange', onVisibility);
        global.removeEventListener('resize', fitBackingStore);
        container.innerHTML = '';
      }
    };
  }

  global.ChirpyFlight = { create: create };
})(window);
