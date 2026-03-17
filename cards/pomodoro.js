export const PomodoroCard = {
    id: "Pomodoro",
    category: "herramientas",
    rol: "guest",
    defaultSize: "1x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%; cursor:pointer;" id="pomo-area">
            <span id="val-Pomodoro" class="val-text" style="font-size:2.5rem; font-weight:900; color:var(--primary); font-variant-numeric: tabular-nums;">25:00</span>
            <span id="pomo-lbl" style="font-size:0.8rem; font-weight:bold; color:var(--text-sec); margin-top:5px; letter-spacing:1px;">TOCAR PARA INICIAR</span>
        </div>
    `,
    onInit: (core) => {
        window._pomoTimer = null;
        window._pomoTime = 25 * 60;
        window._pomoActive = false;
        
        const formatTime = (secs) => {
            const m = Math.floor(secs / 60).toString().padStart(2, '0');
            const s = (secs % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        };

        const updateUI = () => {
            document.getElementById('val-Pomodoro').innerText = formatTime(window._pomoTime);
        };

        document.getElementById('pomo-area').onclick = () => {
            core.vibra("tick");
            if(window._pomoActive) {
                clearInterval(window._pomoTimer);
                window._pomoActive = false;
                window._pomoTime = 25 * 60;
                document.getElementById('pomo-lbl').innerText = "TOCAR PARA INICIAR";
                document.getElementById('val-Pomodoro').style.color = "var(--primary)";
                updateUI();
            } else {
                window._pomoActive = true;
                document.getElementById('pomo-lbl').innerText = "CONCENTRACIÓN";
                document.getElementById('val-Pomodoro').style.color = "#ff453a";
                
                window._pomoTimer = setInterval(() => {
                    window._pomoTime--;
                    updateUI();
                    if(window._pomoTime <= 0) {
                        clearInterval(window._pomoTimer);
                        window._pomoActive = false;
                        core.notificar("¡Pomodoro Terminado!", "🍅");
                        core.vibra("error");
                        core.hablarJARVIS("Tiempo de descanso completado.");
                        document.getElementById('pomo-lbl').innerText = "COMPLETADO";
                    }
                }, 1000);
            }
        };
    },
    // Si recibe una orden de la IA (Ej: {"Pomodoro": 10})
    onData: (val, app, core) => {
        if(typeof val === 'number') {
            window._pomoTime = val * 60;
            document.getElementById('pomo-area').click(); // Auto-inicia
        }
    }
};
