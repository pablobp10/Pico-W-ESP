export const SeguridadCard = {
    id: "Seguridad",
    category: "sistema",
    rol: "admin", // Solo administradores y GOD
    defaultSize: "2x1",
    html: `
        <div style="display:flex; justify-content:space-around; align-items:center; height:100%; width:100%;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                <button id="btn-lock" class="btn-action" style="width:60px; height:60px; border-radius:50%; background:var(--card-bg); border:2px solid #32d74b; color:#32d74b; font-size:1.5rem; transition:0.3s;">
                    <i class="fa-solid fa-lock-open"></i>
                </button>
                <span style="font-size:0.7rem; font-weight:bold; color:var(--text-sec);">CERRADURA</span>
            </div>
            
            <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                <button id="btn-alarm" class="btn-action" style="width:60px; height:60px; border-radius:50%; background:var(--card-bg); border:2px solid #ff453a; color:#ff453a; font-size:1.5rem; transition:0.3s;">
                    <i class="fa-solid fa-shield"></i>
                </button>
                <span style="font-size:0.7rem; font-weight:bold; color:var(--text-sec);">ALARMA</span>
            </div>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('btn-lock').onclick = () => {
            core.vibra("doble");
            core.cmd('Seguridad', 'toggle_puerta');
        };
        document.getElementById('btn-alarm').onclick = () => {
            core.vibra("error");
            core.cmd('Seguridad', 'toggle_alarma');
        };
    },
    onData: (val) => {
        if(!val) return;
        const btnLock = document.getElementById('btn-lock');
        const btnAlarm = document.getElementById('btn-alarm');
        
        if(val.puerta === 'cerrada') {
            btnLock.innerHTML = '<i class="fa-solid fa-lock"></i>';
            btnLock.style.background = '#32d74b'; btnLock.style.color = '#fff';
        } else if(val.puerta === 'abierta') {
            btnLock.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
            btnLock.style.background = 'var(--card-bg)'; btnLock.style.color = '#32d74b';
        }

        if(val.alarma === 'armada') {
            btnAlarm.innerHTML = '<i class="fa-solid fa-shield-halved"></i>';
            btnAlarm.style.background = '#ff453a'; btnAlarm.style.color = '#fff';
            btnAlarm.classList.add('fa-beat-fade');
        } else if(val.alarma === 'desarmada') {
            btnAlarm.innerHTML = '<i class="fa-solid fa-shield"></i>';
            btnAlarm.style.background = 'var(--card-bg)'; btnAlarm.style.color = '#ff453a';
            btnAlarm.classList.remove('fa-beat-fade');
        }
    }
};
