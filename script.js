// Elemen
const startBtn   = document.getElementById('start');
const tapBtn     = document.getElementById('tap');
const statusEl   = document.getElementById('status');
const readoutEl  = document.getElementById('readout');
const bestEl     = document.getElementById('best');
const tapArea    = document.getElementById('tapArea');
const tapHint    = document.getElementById('tapHint');

// State
let timer = null;
let mulai = 0;
let state = 'idle';
let best = Number(localStorage.getItem('reaction_best_ms')) || null;
if (best) bestEl.textContent = best + ' ms';

// Utils
const setStatus = (text, cls) => {
  statusEl.textContent = text;
  statusEl.className = 'status ' + (cls || '');
};
const updateBest = (ms) => {
  if (best === null || ms < best) {
    best = ms;
    localStorage.setItem('reaction_best_ms', best);
    bestEl.textContent = best + ' ms';
  }
};
const readyVisual = (on) => {
  if (on){ tapArea.classList.add('show'); tapHint.classList.add('show'); }
  else   { tapArea.classList.remove('show'); tapHint.classList.remove('show'); }
};
const setStartInteractive = (on) => {
  startBtn.disabled = !on;
  startBtn.classList.toggle('is-disabled', !on);
};

// ====== Audio & Haptic ======
let audioCtx = null;
function ensureAudio(){
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function beep(freq=1000, duration=120, type='sine', volume=0.03){
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = volume;
  o.connect(g); g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(volume, now + 0.01);
  g.gain.linearRampToValueAtTime(0.0001, now + duration/1000);
  o.start(now); o.stop(now + duration/1000 + 0.02);
}
function vibrate(pattern){ if (navigator.vibrate) navigator.vibrate(pattern); }
const cueReady      = () => { beep(1200,120,'sine',0.04); vibrate(30); };
const cueFalseStart = () => { beep(240,160,'square',0.04); vibrate([40,60,80]); };
const cueSuccess    = () => { beep(900,70,'sine',0.035); setTimeout(()=>beep(1300,80,'sine',0.035),90); vibrate(25); };

// Fungsi kirim event ke GA4
function sendGAEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

// --- Game Flow ---
function mulaiGame(){
  sendGAEvent('start_game', {
    player_name: localStorage.getItem('neon_reflex_name') || 'anonymous'
  });

  ensureAudio();
  if (state !== 'idle') return;
  clearTimeout(timer);
  readoutEl.textContent = '';
  setStatus('Tunggu…', 'wait');
  state = 'waiting';
  startBtn.blur();
  startBtn.classList.remove('pulse');
  setStartInteractive(false);
  readyVisual(false);

  const delay = Math.random() * 2000 + 800;
  timer = setTimeout(() => {
    setStatus('Klik sekarang!', 'ready');
    requestAnimationFrame(() => {
      requestAnimationFrame((t) => {
        mulai = t; state = 'ready';
        readyVisual(true); cueReady();
      });
    });
  }, delay);
}

function stopAndMeasure(){
  if (state !== 'ready') return;
  const akhir = performance.now();
  const ms = Math.round(akhir - mulai);
  readoutEl.textContent = ms + ' ms';
  setStatus('Bagus! Tekan START/Enter untuk coba lagi.', 'idle');
  updateBest(ms);
  sendGAEvent('finish_game', {
    player_name: localStorage.getItem('neon_reflex_name') || 'anonymous',
    reaction_time: ms
  });
  state = 'idle';
  startBtn.classList.add('pulse');
  setStartInteractive(true);
  readyVisual(false); cueSuccess();
}

// START via klik
startBtn.addEventListener('click', mulaiGame, {passive:true});

// Keyboard: Enter untuk start & stop
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  ev.preventDefault();
  if (ev.repeat) return;
  if (state === 'idle')    { mulaiGame(); return; }
  if (state === 'waiting'){
    clearTimeout(timer); timer = null; state = 'idle';
    setStatus('Kepagian! Tekan START/Enter untuk ulang.', 'bad');
    startBtn.classList.add('pulse');
    setStartInteractive(true);
    readyVisual(false); cueFalseStart();
    sendGAEvent('false_start', {
      player_name: localStorage.getItem('neon_reflex_name') || 'anonymous'
    });
    return;
  }
  if (state === 'ready')   { stopAndMeasure(); }
});

// TAP button (start/stop)
const tapAction = (e) => {
  e.preventDefault(); e.stopPropagation();
  if (state === 'idle')     { mulaiGame(); return; }
  if (state === 'waiting')  {
    clearTimeout(timer); timer = null; state = 'idle';
    setStatus('Kepagian! Tekan START untuk ulang.', 'bad');
    startBtn.classList.add('pulse');
    setStartInteractive(true);
    readyVisual(false); cueFalseStart();
    sendGAEvent('false_start', {
      player_name: localStorage.getItem('neon_reflex_name') || 'anonymous'
    });
    return;
  }
  if (state === 'ready')    { stopAndMeasure(); }
};
tapBtn.addEventListener('pointerdown', tapAction, {passive:false});
tapBtn.addEventListener('click', tapAction, {passive:false});

// Overlay saat READY
tapArea.addEventListener('pointerdown', (e) => {
  e.preventDefault(); e.stopPropagation();
  if (state === 'ready') stopAndMeasure();
}, {passive:false});

// Awal
setStatus('Siap', 'idle');
startBtn.classList.add('pulse');
setStartInteractive(true);
