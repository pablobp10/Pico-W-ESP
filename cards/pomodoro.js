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
            clearInterval(pInt); pInt = null;
            if (window.App) window.App.notificar("¡Tiempo finalizado!", "⏰");
        }
    }, 1000);
};

export const PomodoroCard = {
    id: "Pomodoro",
    defaultSize: "1x1",
    html: `
        <style>
            #pomo-wrapper { display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; height: 100%; width: 100%; box-sizing: border-box; padding: 5cqmin; }
            .pomo-label { font-size: clamp(0.7rem, 8cqmin, 1.5rem); font-weight: bold; color: var(--text-sec); text-transform: uppercase; }
            #pomo-time { font-size: clamp(2.5rem, 35cqmin, 8rem); font-weight: 800; color: var(--text-main); font-variant-numeric: tabular-nums; margin: 0; line-height: 1; }
            .pomo-btn-group { display: flex; gap: 10px; width: 100%; }
            .pomo-btn { flex-grow: 1; padding: clamp(10px, 6cqmin, 20px); font-size: clamp(1rem, 10cqmin, 2rem); border-radius: clamp(8px, 4cqmin, 16px); }
            
            @container (aspect-ratio > 1.2) {
                #pomo-wrapper { flex-direction: row; justify-content: space-around; }
                #pomo-time { width: 50%; font-size: clamp(2.5rem, 40cqh, 8rem); }
                .pomo-controls { width: 40%; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
            }
        </style>
        
        <div id="pomo-wrapper">
            <div class="pomo-label">Focus</div>
            <div id="pomo-time">25:00</div>
            <div class="pomo-controls" style="width:100%;">
                <div class="pomo-btn-group">
                    <button class="btn-action pomo-btn" style="background:#22c55e; margin:0;" id="pomo-start">▶</button>
                    <button class="btn-action pomo-btn" style="background:#ef4444; margin:0;" id="pomo-reset">⏹</button>
                </div>
            </div>
        </div>
    `,
    onInit: (core) => {
        pSec = (parseInt(localStorage.getItem('pico_pomo_mins')) || 25) * 60;
        actualizarPantalla();
        document.getElementById('pomo-start').onclick = () => { if(!pInt) iniciarTimer(); };
        document.getElementById('pomo-reset').onclick = () => {
            clearInterval(pInt); pInt = null; 
            pSec = (parseInt(localStorage.getItem('pico_pomo_mins')) || 25) * 60;
            actualizarPantalla();
        };
    },
    onData: (val) => {
        const mins = parseInt(val);
        if (!isNaN(mins) && mins > 0) {
            pSec = mins * 60;
            actualizarPantalla();
            iniciarTimer(); 
        }
    },
    abrirAjustes: (core) => {
        let m = prompt("Minutos de concentración:", localStorage.getItem('pico_pomo_mins') || "25");
        if(m && !isNaN(m)) {
            localStorage.setItem('pico_pomo_mins', m);
            pSec = m * 60;
            actualizarPantalla();
            core.notificar(`Temporizador fijado a ${m} min`, "⏱️");
        }
    }
};
