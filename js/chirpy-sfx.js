/* ============================================================
   THREE BABY BIRDIES, chirpy-sfx.js
   Sound for the game, synthesised rather than loaded.

   Usage:
     ChirpySfx.play('flap' | 'point' | 'bump' | 'chirp' | 'start');
     ChirpySfx.setEnabled(true|false);   // remembered per browser
     ChirpySfx.isEnabled();

   WHY SYNTHESISED
   ---------------
   Every sound here is a few oscillator envelopes through the Web Audio
   API. No files, so nothing to download, nothing to cache-bust, and no
   licence to chase. A chirp is a short pitch sweep on a triangle wave,
   which is close enough to a bird that a five-year-old reads it as one.

   Music is NOT here. A looping melody wants a real composition and a
   real recording; faked out of oscillators it sounds like a ringtone
   from 2004. Ask for a 30 to 60 second loop as an audio file and drop it
   in: startMusic() below is where it goes.

   OFF BY DEFAULT
   --------------
   Browsers will not let an AudioContext start before a gesture, and a
   page that makes noise unasked is a bad page, so the context is created
   on the first play() after the reader has turned sound on.
   ============================================================ */

(function (global) {
  'use strict';

  var KEY = 'mb_sfx_on';
  var ctx = null;
  var master = null;

  // Private windows and blocked site data make localStorage throw. Keeping
  // the choice in memory as well means the toggle still works for the
  // session instead of silently refusing to turn on.
  var memOn = null;

  function isEnabled() {
    if (memOn !== null) return memOn;
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function setEnabled(on) {
    memOn = !!on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    if (!on && ctx) { try { ctx.suspend(); } catch (e) {} }
    else if (on && ctx) { try { ctx.resume(); } catch (e) {} }
  }

  function audio() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;        // small ears, small volume
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  /* One note: an oscillator with a pitch sweep and a short envelope.
     Everything in this file is one or two of these. */
  function tone(opts) {
    var c = audio();
    if (!c) return;
    var t = c.currentTime + (opts.delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || 'triangle';
    osc.frequency.setValueAtTime(opts.from, t);
    if (opts.to && opts.to !== opts.from) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(opts.to, 1), t + opts.dur);
    }
    // A short attack stops the click you get from starting at full gain.
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(opts.vol || 0.3, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    osc.connect(gain); gain.connect(master);
    osc.start(t);
    osc.stop(t + opts.dur + 0.02);
  }

  var SOUNDS = {
    // wings: a quick low whoosh
    flap:  function () { tone({ from: 520, to: 260, dur: 0.13, vol: 0.22, type: 'sine' }); },
    // past a branch: two rising notes, the shape of "well done"
    point: function () {
      tone({ from: 660, to: 660, dur: 0.09, vol: 0.20, type: 'square' });
      tone({ from: 990, to: 990, dur: 0.12, vol: 0.18, type: 'square', delay: 0.08 });
    },
    // hit something: soft and low, never harsh. Losing is not a punishment.
    bump:  function () { tone({ from: 220, to: 90, dur: 0.30, vol: 0.26, type: 'sawtooth' }); },
    // Chirpy himself: two quick sweeps up, like a real bird
    chirp: function () {
      tone({ from: 1400, to: 2300, dur: 0.07, vol: 0.16 });
      tone({ from: 1700, to: 2600, dur: 0.06, vol: 0.13, delay: 0.09 });
    },
    // the game beginning: a little three note climb
    start: function () {
      tone({ from: 523, to: 523, dur: 0.10, vol: 0.18, type: 'triangle' });
      tone({ from: 659, to: 659, dur: 0.10, vol: 0.18, type: 'triangle', delay: 0.10 });
      tone({ from: 784, to: 880, dur: 0.20, vol: 0.20, type: 'triangle', delay: 0.20 });
    }
  };

  function play(name) {
    if (!isEnabled()) return;
    var f = SOUNDS[name];
    if (!f) return;
    var c = audio();
    // Chrome starts the context suspended until a gesture has happened.
    if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    try { f(); } catch (e) {}
  }

  /* Where a real music loop goes when one exists. Deliberately not
     synthesised: a melody built out of oscillators sounds cheap, and this
     is the one sound a child would hear for minutes at a time. */
  function startMusic() { /* awaiting an audio file */ }
  function stopMusic()  { /* awaiting an audio file */ }

  global.ChirpySfx = {
    play: play,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    available: function () { return !!(global.AudioContext || global.webkitAudioContext); },
    startMusic: startMusic,
    stopMusic: stopMusic
  };
})(window);
