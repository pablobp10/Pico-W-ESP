// Variables a nivel de módulo para mantener el estado
let pInt = null;
let pSec = 1500;

const actualizarPantalla = () => {
    const el = document.getElementById('pomo-time');
    if(el) el.innerText = `${Math.floor(pSec/60)}:${(pSec%60).toString().padStart(2,'0')}`;
};

const iniciarTimer = () => {
    if(pInt) clearInterval(pInt);
    pInt = setInterval(() => {
        pSec--;
        actualizarPantalla();
        if(pSec <= 0) {
            clearInterval(pInt);
            pInt = null;
            // Usamos el sistema de notificaciones de tu core en lugar del alert feo
            if (window.App) window.App.notificar("¡Tiempo de Focus finalizado!", "⏰");
            else alert("¡Fin!");
        }
    }, 1000);
};

export const PomodoroCard = {
    id: "Pomodoro",
    html: `
        <div class="label">Focus</div>
        <div class="val-text" id="pomo-time">25:00</div>
        <div style="display:flex; gap:10px; width:100%">
            <button class="btn-action" style="background:#22c55e" id="pomo-start">▶</button>
            <button class="btn-action" style="background:#ef4444" id="pomo-reset">⏹</button>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('pomo-start').onclick = () => {
            if(!pInt) iniciarTimer();
        };
        document.getElementById('pomo-reset').onclick = () => {
            clearInterval(pInt); pInt = null; pSec = 1500; 
            actualizarPantalla();
        };
    },
    // 🧠 LA MAGIA: El oído de la tarjeta para escuchar a JARVIS
    onData: (val) => {
        const mins = parseInt(val);
        // Si la IA manda un número válido mayor que 0
        if (!isNaN(mins) && mins > 0) {
            pSec = mins * 60; // Convertimos minutos a segundos
            actualizarPantalla();
            iniciarTimer(); // ¡Arrancamos el temporizador solo!
        }
    }
};
