export const TestCard = {
    id: "Test", 
    category: "sistema",
    rol: "admin", // 🔒 Mejor en Admin, enviar RAW commands es peligroso para un Guest
    defaultSize: "1x1", 
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; height:100%">
            <i class="fa-solid fa-terminal icon" style="color:#bf5af2; font-size:1.8rem; margin-bottom:5px"></i>
            
            <input type="text" id="cmd-input" placeholder="EMAIL, UDP..." 
                style="width:100%; margin:8px 0; padding:6px; font-size:0.8rem; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main); text-align:center; outline:none">
            
            <button class="btn-action" id="btn-cmd" style="background:#bf5af2; padding:8px; font-size:0.8rem">
                EJECUTAR
            </button>

            <span id="cmd-response" style="font-size:0.7rem; color:var(--text-sec); margin-top:5px; height:15px; overflow:hidden">
                Listo
            </span>
        </div>
    `,
    onInit: (core) => {
        const input = document.getElementById('cmd-input');
        const btn = document.getElementById('btn-cmd');

        const enviar = () => {
            const txt = input.value.trim();
            if(txt) {
                // Viaja cifrado con AES automáticamente gracias a core.js
                core.cmd('Test', txt); 
                
                const lbl = document.getElementById('cmd-response');
                lbl.innerText = "Enviando...";
                lbl.style.color = "#bf5af2";
            }
        };

        btn.onclick = enviar;
        input.onkeypress = (e) => { if(e.key === 'Enter') enviar(); };
    },
    onData: (val) => {
        if (val && val.estado) {
            const lbl = document.getElementById('cmd-response');
            lbl.innerText = val.estado; // 🛡️ Sanitizado mediante innerText
            lbl.style.color = "var(--text-main)";
            
            lbl.style.fontWeight = "bold";
            setTimeout(() => lbl.style.fontWeight = "normal", 2000);
        }
    }
};
