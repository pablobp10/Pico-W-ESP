export const QrCard = {
    id: "Qr",
    category: "herramientas",
    rol: "guest",
    defaultSize: "2x2",
    html: `
        <div style="display:flex; flex-direction:column; align-items:center; height:100%; width:100%; padding:5px;">
            <div style="width:100px; height:100px; background:white; padding:5px; border-radius:10px; margin-bottom:10px; display:flex; justify-content:center; align-items:center;">
                <img id="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PicoOS" style="width:100%; height:100%; object-fit:contain; filter: brightness(0.8) contrast(1.2);">
            </div>
            <div style="display:flex; width:100%; gap:5px;">
                <input type="text" id="qr-input" placeholder="Texto o URL..." style="flex-grow:1; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); border-radius:8px; padding:6px; outline:none; font-size:0.8rem; text-align:center;">
                <button id="qr-btn" class="btn-action" style="background:var(--primary); color:white; border:none; border-radius:8px; width:40px; cursor:pointer;"><i class="fa-solid fa-qrcode"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        const generar = () => {
            const txt = document.getElementById('qr-input').value.trim();
            if(!txt) return;
            core.vibra("tick");
            
            // 🛡️ Solo inyectamos como atributo SRC (es seguro) y con la cadena encodeada
            const urlSegura = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(txt)}`;
            document.getElementById('qr-img').src = urlSegura;
        };

        document.getElementById('qr-btn').onclick = generar;
        document.getElementById('qr-input').onkeypress = (e) => { if(e.key === 'Enter') generar(); };
    }
};
