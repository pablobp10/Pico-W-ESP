export const MegafonoCard = {
    id: "Megafono",
    category: "herramientas",
    rol: "guest",
    defaultSize: "2x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%;">
            <div style="display:flex; width:100%; gap:10px;">
                <input type="text" id="mega-input" placeholder="Mensaje para transmitir..." style="flex-grow:1; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); border-radius:10px; padding:10px; outline:none; font-size:0.9rem;">
                <button id="mega-btn" class="btn-action" style="background:#bf5af2; color:white; border:none; border-radius:10px; width:45px; cursor:pointer;"><i class="fa-solid fa-volume-high"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        const enviar = () => {
            const input = document.getElementById('mega-input');
            const txt = input.value.trim();
            if(!txt) return;
            
            core.vibra("tick");
            core.cmd('Megafono', txt); // Va encriptado por AES
            input.value = "";
            core.notificar("Mensaje transmitido", "📢");
        };

        document.getElementById('mega-btn').onclick = enviar;
        document.getElementById('mega-input').onkeypress = (e) => { if(e.key === 'Enter') enviar(); };
    },
    onData: (val, app, core) => {
        if(val && typeof val === 'string') {
            core.hablarJARVIS(val); // Lo lee en voz alta al recibirlo
        }
    }
};
