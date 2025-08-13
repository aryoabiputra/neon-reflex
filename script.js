
// Elemen
const startBtn = document.getElementById('start');
const klikBtn = document.getElementById('klik'); // tidak dipakai, tetap disertakan
const statusEl = document.getElementById('status');
const readoutEl = document.getElementById('readout');
const bestEl = document.getElementById('best');

// State
let timer = null;
let mulai = 0;
let state = 'idle'; // 'idle' | 'waiting' | 'ready'
let best = Number(localStorage.getItem('reaction_best_ms')) || null;
if (best) bestEl.textContent = best + ' ms';

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

const softReset = () => {
    clearTimeout(timer); timer = null; mulai = 0; state = 'idle';
    setStatus('Siap', 'idle');
    startBtn.classList.add('pulse');
};

function mulaiGame() {
    if (state !== 'idle') return; // cegah dobel start
    clearTimeout(timer);
    readoutEl.textContent = '';
    setStatus('Tunggu…', 'wait');
    state = 'waiting';
    startBtn.blur();
    startBtn.classList.remove('pulse');

    const delay = Math.random() * 2000 + 800; // 0.8s–2.8s
    timer = setTimeout(() => {
        setStatus('Klik sekarang!', 'ready');
        // Mulai tepat setelah frame teks benar-benar tampil
        requestAnimationFrame(() => {
            requestAnimationFrame((t) => {
                mulai = t; // sama origin dengan performance.now()
                state = 'ready';
            });
        });
    }, delay);
}

// Start via mouse
startBtn.addEventListener('click', mulaiGame);

// Keyboard handler — Enter untuk start & stop
document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    if (ev.repeat) return; // abaikan auto-repeat

    if (state === 'idle') { // MULAI
        mulaiGame();
        return;
    }

    if (state === 'waiting') { // False start
        clearTimeout(timer); timer = null; state = 'idle';
        setStatus('Kepagian! Tekan START/Enter untuk ulang.', 'bad');
        startBtn.classList.add('pulse');
        return;
    }

    if (state === 'ready') { // STOP
        const akhir = performance.now();
        const ms = Math.round(akhir - mulai);
        readoutEl.textContent = ms + ' ms';
        setStatus('Bagus! Tekan START/Enter untuk coba lagi.', 'idle');
        updateBest(ms);
        state = 'idle';
        startBtn.classList.add('pulse');
    }
});

// Aksesibilitas: klikBtn dinonaktifkan (kita pakai Enter)
klikBtn.disabled = true;

// Awal tampilan
setStatus('Siap', 'idle');
startBtn.classList.add('pulse');
