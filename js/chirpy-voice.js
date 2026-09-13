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
  var KEY       = 'mb_voice_on';
  var ttsBroken = false;       // our endpoint answered badly; stop trying
  var current   = null;        // the Audio element now playing
  var synthOn   = false;

  function isEnabled() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function setEnabled(on) {
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

  function cancel() {
    if (current) {
      try { current.pause(); current.src = ''; } catch (e) {}
      current = null;
    }
    if (synthOn && global.speechSynthesis) {
      try { global.speechSynthesis.cancel(); } catch (e) {}
      synthOn = false;
    }
  }

  function speakViaSynth(text, cb) {
    var synth = global.speechSynthesis;
    if (!synth || !global.SpeechSynthesisUtterance) return cb.fail();
    try {
      var u = new global.SpeechSynthesisUtterance(text);
      u.rate = 0.95;           // a shade slow; these are four-year-olds
      u.pitch = 1.25;          // and Chirpy is a small bird
      u.lang = 'en-US';
      // Prefer a voice that is not the robotic default, where one exists.
      var vs = synth.getVoices() || [];
      var pick = vs.filter(function (v) { return /en(-|_)(US|GB)/i.test(v.lang); });
      var nice = pick.filter(function (v) { return /natural|neural|premium|enhanced|samantha|zira/i.test(v.name); });
      if (nice.length) u.voice = nice[0];
      else if (pick.length) u.voice = pick[0];

      u.onend = function () { synthOn = false; cb.end(); };
      u.onerror = function () { synthOn = false; cb.end(); };
      synth.cancel();
      synthOn = true;
      cb.start();
      synth.speak(u);
      return true;
    } catch (e) { return cb.fail(); }
  }

  function speakViaApi(text, cb) {
    return fetch(API + '/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, voice: 'chirpy' })
    }).then(function (res) {
      if (!res.ok) throw new Error('tts ' + res.status);
      return res.blob();
    }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = new Audio(url);
      current = a;
      a.onended = a.onerror = function () {
        URL.revokeObjectURL(url);
        if (current === a) current = null;
        cb.end();
      };
      cb.start();
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
    var said    = clean(text);

    if (!isEnabled() || !said) { onend(); return; }
    cancel();

    var fired = false;
    var cb = {
      start: function () { if (!fired) { fired = true; onstart(); } },
      end:   function () { onend(); },
      fail:  function () { onend(); return false; }
    };

    if (!ttsBroken) {
      speakViaApi(said, cb).then(function (played) {
        if (played === null) {            // endpoint unavailable
          if (!speakViaSynth(said, cb)) onend();
        }
      });
    } else if (!speakViaSynth(said, cb)) {
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

  global.ChirpyVoice = {
    speak: speak,
    cancel: cancel,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    available: available
  };
})(window);
