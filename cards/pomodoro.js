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
    onInit: () => {
        let pInt=null, pSec=1500;
        document.getElementById('pomo-start').onclick = () => {
            if(pInt)return; 
            pInt=setInterval(()=>{ 
                pSec--; 
                if(pSec<=0){clearInterval(pInt);alert("Fin!");} 
                document.getElementById('pomo-time').innerText=`${Math.floor(pSec/60)}:${(pSec%60).toString().padStart(2,'0')}`; 
            }, 1000);
        };
        document.getElementById('pomo-reset').onclick = () => {
            clearInterval(pInt); pInt=null; pSec=1500; 
            document.getElementById('pomo-time').innerText="25:00";
        };
    }
};

