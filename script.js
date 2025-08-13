// Elemen
const tombolStart = document.getElementById("start");
const tombolKlik  = document.getElementById("klik"); // tetap ada, tapi disembunyikan
const statusEl    = document.getElementById("status");
const kecepatanEl = document.getElementById("kecepatan");

// State
let timer = null;
let mulai = 0;
let state = "idle"; // 'idle' | 'waiting' | 'ready'

// Util
const setStatus = (t) => statusEl.textContent = t;
const reset = () => {
  clearTimeout(timer);
  timer = null;
  mulai = 0;
  state = "idle";
  kecepatanEl.textContent = "";
  setStatus("");
};

// Mulai game (bisa dipanggil dari klik START atau Enter saat idle)
function mulaiGame() {
  if (state !== "idle") return;          // cegah dobel start
  clearTimeout(timer);
  kecepatanEl.textContent = "";
  setStatus("Tunggu...");
  state = "waiting";

  // Lepas fokus agar Enter tidak “mengklik” START lagi
  tombolStart.blur();

  const delay = Math.random() * 2000 + 800; // 0.8s–2.8s
  timer = setTimeout(() => {
    setStatus("Klik sekarang!");
    // Start stopwatch setelah frame teks benar-benar tampil
    requestAnimationFrame(() => {
      requestAnimationFrame((t) => {
        mulai = t;       // t se-origin dengan performance.now()
        state = "ready";
      });
    });
  }, delay);
}

// --- START via mouse ---
tombolStart.addEventListener("click", mulaiGame);

// --- Keyboard handler (Enter untuk start & stop) ---
document.addEventListener("keydown", (ev) => {
  if (ev.key !== "Enter") return;
  ev.preventDefault();       // cegah Enter “klik” tombol fokus
  if (ev.repeat) return;     // abaikan auto-repeat saat Enter ditahan

  if (state === "idle") {
    // Enter untuk MULAI
    mulaiGame();
    return;
  }

  if (state === "waiting") {
    // False start (kepagian)
    clearTimeout(timer);
    timer = null;
    state = "idle";
    setStatus("Kepagian! Tekan START/Enter untuk ulang.");
    return;
  }

  if (state === "ready") {
    // Enter untuk STOP & hitung waktu
    const akhir = performance.now();
    const ms = Math.round(akhir - mulai);
    kecepatanEl.textContent = `Kecepatan: ${ms} ms`;
    setStatus("Bagus! Tekan START/Enter untuk coba lagi.");
    state = "idle";
  }
});

// Nonaktifkan tombol klik (opsional; kita pakai Enter)
tombolKlik.disabled = true;
