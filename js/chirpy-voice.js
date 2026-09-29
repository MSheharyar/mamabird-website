/* ============================================================
   THREE BABY BIRDIES, chirpy-voice.js
   Chirpy reads his replies out loud.

   Usage:
     ChirpyVoice.speak(text, { onstart: fn, onend: fn });
     ChirpyVoice.cancel();
     ChirpyVoice.setEnabled(true|false);   // remembered per browser
     ChirpyVoice.isEnabled();

   TWO BACKENDS, IN ORDER
   ----------------------
   1. Our own API. POST {API}/tts {text, voice} -> audio/mpeg. The
      ElevenLabs key lives on the server and never reaches the browser.
      If the endpoint is missing or errors, we stop asking for the rest
      of the session and fall through to 2.
   2. window.speechSynthesis. Free, offline, and nothing leaves the
      device. The voices are whatever the operating system ships, so it
      is a worse Chirpy, but it works today with no key and no bill.

   If neither is available, speak() calls its callbacks and returns, so
   callers never have to branch.

   OFF BY DEFAULT, ON PURPOSE
   --------------------------
   Browsers refuse to play audio before the reader has interacted with
   the page, so anything that speaks on load would fail silently. More
   to the point, a page that starts talking at a child unprompted is a
   bad page. The toggle is the user's, and the choice is remembered.

   NOTHING IS RECORDED HERE
   ------------------------
   This file only produces sound. It holds no microphone code, and
   adding any would put a child's voice in scope of COPPA, which is a
   decision for Iris and a lawyer rather than a patch.
   ============================================================ */

(function (global) {
  'use strict';

  var API       = global.MB_API || 'https://api.threebabybirdies.com';
  var actx      = null;        // shared, for reading the amplitude back
  var raf       = null;
  var KEY       = 'mb_voice_on';
  var ttsBroken = false;       // our endpoint answered badly; stop trying
  var current   = null;        // the Audio element now playing
  var synthOn   = false;

  // Same as the sound module: a private window makes localStorage throw,
  // and without an in-memory copy the Read aloud button would refuse to
  // stay on for the whole session.
  var memOn = null;

  function isEnabled() {
    if (memOn !== null) return memOn;
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function setEnabled(on) {
    memOn = !!on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    if (!on) cancel();
  }

  function available() {
    return !ttsBroken || !!global.speechSynthesis;
  }

  /* Claude's replies are plain text, but a stray tag or entity would be
     read out character by character, so strip anything markup-shaped. */
  function clean(text) {
    return String(text || '')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, ' and ')
      .replace(/&[a-z]+;/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);          // a runaway reply should not become a monologue
  }

  /* ---- Amplitude, which is what drives the beak ----
     The audio coming back from /tts is routed through an analyser on its
     way to the speakers, so the mouth opens on the loud parts of the
     actual sentence. That is real lip-sync, within the limit that the
     clip gives us five mouth positions rather than phonemes.

     speechSynthesis gives no access to its output, so on that path there
     is nothing to measure and the mouth falls back to a plausible rhythm.
     It is the same call either way as far as the caller is concerned. */
  function watchLevel(node, onLevel) {
    if (!actx) return null;
    var an = actx.createAnalyser();
    an.fftSize = 256;
    an.smoothingTimeConstant = 0.55;
    node.connect(an);
    var buf = new Uint8Array(an.frequencyBinCount);
    function tick() {
      an.getByteFrequencyData(buf);
      // The voice sits low; the top of the spectrum is mostly hiss.
      var n = Math.floor(buf.length * 0.55), sum = 0;
      for (var i = 0; i < n; i++) sum += buf[i];
      var avg = sum / n / 255;
      // Speech rarely reaches the ceiling, so lift it or the beak barely
      // parts, and square it a little so quiet gaps actually close it.
      onLevel(Math.min(1, Math.pow(avg * 2.6, 1.35)));
      raf = global.requestAnimationFrame(tick);
    }
    tick();
    return function stop() {
      if (raf) global.cancelAnimationFrame(raf);
      raf = null;
      try { an.disconnect(); } catch (e) {}
      onLevel(0);
    };
  }

  /* No stream to measure, so move the mouth the way a cartoon does: open
     and shut at a speaking rhythm, with enough variation to not look
     mechanical. Honest, and better than a still beak. */
  function fakeLevel(onLevel) {
    var t0 = Date.now();
    function tick() {
      var t = (Date.now() - t0) / 1000;
      var v = 0.5 + 0.5 * Math.sin(t * 11) * Math.sin(t * 3.1 + 0.7);
      onLevel(Math.max(0, v));
      raf = global.requestAnimationFrame(tick);
    }
    tick();
    return function stop() {
      if (raf) global.cancelAnimationFrame(raf);
      raf = null;
      onLevel(0);
    };
  }

  var stopLevel = null;

  function cancel() {
    if (stopLevel) { stopLevel(); stopLevel = null; }
    if (current) {
      try { current.pause(); current.src = ''; } catch (e) {}
      current = null;
    }
    if (synthOn && global.speechSynthesis) {
      try { global.speechSynthesis.cancel(); } catch (e) {}
      synthOn = false;
    }
  }

  function speakViaSynth(text, cb, voice) {
    var synth = global.speechSynthesis;
    if (!synth || !global.SpeechSynthesisUtterance) return cb.fail();
    try {
      var u = new global.SpeechSynthesisUtterance(text);
      // Chirpy is a small bird talking to four-year-olds. Mama Bird is
      // talking to their parents, so she is steadier and lower.
      u.rate  = voice === 'mama' ? 1.0  : 0.95;
      u.pitch = voice === 'mama' ? 1.0  : 1.25;
      u.lang = 'en-US';
      // Prefer a voice that is not the robotic default, where one exists.
      var vs = synth.getVoices() || [];
      var pick = vs.filter(function (v) { return /en(-|_)(US|GB)/i.test(v.lang); });
      var nice = pick.filter(function (v) { return /natural|neural|premium|enhanced|samantha|zira/i.test(v.name); });
      if (nice.length) u.voice = nice[0];
      else if (pick.length) u.voice = pick[0];

      u.onend = function () { synthOn = false; if (stopLevel) { stopLevel(); stopLevel = null; } cb.end(); };
      u.onerror = function () { synthOn = false; if (stopLevel) { stopLevel(); stopLevel = null; } cb.end(); };
      synth.cancel();
      synthOn = true;
      cb.start();
      if (cb.level) stopLevel = fakeLevel(cb.level);
      synth.speak(u);
      return true;
    } catch (e) { return cb.fail(); }
  }

  function speakViaApi(text, cb, voice) {
    return fetch(API + '/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 'chirpy' and 'mama' are names the backend maps to voice ids, so
      // the browser never holds one and cannot ask for somebody else's.
      body: JSON.stringify({ text: text, voice: voice === 'mama' ? 'mama' : 'chirpy' })
    }).then(function (res) {
      if (!res.ok) throw new Error('tts ' + res.status);
      return res.blob();
    }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = new Audio(url);
      a.crossOrigin = 'anonymous';
      current = a;
      a.onended = a.onerror = function () {
        URL.revokeObjectURL(url);
        if (stopLevel) { stopLevel(); stopLevel = null; }
        if (current === a) current = null;
        cb.end();
      };
      cb.start();
      if (cb.audio) cb.audio(a);

      // Route through an analyser so the beak can follow the sentence.
      // A blob: URL is same-origin, so this is not tainted.
      if (cb.level) {
        try {
          var AC = global.AudioContext || global.webkitAudioContext;
          if (AC) {
            if (!actx) actx = new AC();
            if (actx.state === 'suspended') actx.resume();
            var src = actx.createMediaElementSource(a);
            src.connect(actx.destination);
            stopLevel = watchLevel(src, cb.level);
          }
        } catch (e) { stopLevel = fakeLevel(cb.level); }
      }
      return a.play();
    }).catch(function () {
      // One bad answer is enough: the endpoint is not deployed, or the
      // key is missing. Stop asking and let the browser do it.
      ttsBroken = true;
      return null;
    });
  }

  function speak(text, opts) {
    opts = opts || {};
    var onstart = opts.onstart || function () {};
    var onend   = opts.onend   || function () {};
    var onlevel = opts.onlevel || null;
    var voice   = opts.voice === 'mama' ? 'mama' : 'chirpy';
    var said    = clean(text);

    if (!isEnabled() || !said) { onend(); return; }
    cancel();

    var fired = false;
    var cb = {
      start: function () { if (!fired) { fired = true; onstart(); } },
      end:   function () { onend(); },
      fail:  function () { onend(); return false; },
      level: onlevel,
      audio: opts.onaudio || null
    };

    if (!ttsBroken) {
      speakViaApi(said, cb, voice).then(function (played) {
        if (played === null) {            // endpoint unavailable
          if (!speakViaSynth(said, cb, voice)) onend();
        }
      });
    } else if (!speakViaSynth(said, cb, voice)) {
      onend();
    }
  }

  /* Chrome fills getVoices() asynchronously; touching it early makes the
     first utterance use a real voice rather than the fallback. */
  if (global.speechSynthesis && global.speechSynthesis.getVoices) {
    global.speechSynthesis.getVoices();
    global.speechSynthesis.onvoiceschanged = function () {
      global.speechSynthesis.getVoices();
    };
  }

  /* ---- Reveal text in time with the speaking ----
     The words appear as Chirpy says them rather than all at once. Driven
     by the audio's own progress where we have an element to ask (our
     /tts path), and by an estimated speaking rate otherwise, because
     speechSynthesis will not tell you where it has got to.

     Returns a stop function. Always finishes the text, even if the audio
     is cut short, so nobody is left with half a sentence on screen. */
  function reveal(text, onText, opts) {
    opts = opts || {};
    var words = String(text).split(/(\s+)/);   // keep the spacing
    var total = words.length;
    var shown = 0;
    var t0 = Date.now();
    var wps = opts.wordsPerSecond || 2.6;      // roughly a read-aloud pace
    var timer = null;

    function done() {
      if (timer) { global.clearInterval(timer); timer = null; }
      onText(text, 1);
    }

    timer = global.setInterval(function () {
      var frac;
      if (opts.audio && opts.audio.duration && isFinite(opts.audio.duration)) {
        frac = opts.audio.currentTime / opts.audio.duration;
      } else {
        frac = ((Date.now() - t0) / 1000) * wps * 2 / total;
      }
      frac = Math.max(0, Math.min(1, frac));
      var want = Math.round(frac * total);
      if (want > shown) {
        shown = want;
        onText(words.slice(0, shown).join(""), frac);
      }
      if (frac >= 1) done();
    }, 60);

    return done;
  }

  global.ChirpyVoice = {
    reveal: reveal,
    speak: speak,
    cancel: cancel,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    available: available
  };
})(window);
