export const FindCard = {
    id: "Find",
    category: "herramientas",
    rol: "guest",
    defaultSize: "2x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%;">
            <div style="display:flex; width:100%; gap:10px; align-items:center;">
                <i class="fa-brands fa-searchengin" style="color:var(--primary); font-size:1.5rem;"></i>
                <input type="text" id="find-input" placeholder="Buscar en la red..." style="flex-grow:1; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); border-radius:10px; padding:10px; outline:none; font-size:0.9rem;">
                <button id="find-btn" class="btn-action" style="background:var(--primary); color:white; border:none; border-radius:10px; width:45px; cursor:pointer; transition:0.3s;"><i class="fa-solid fa-magnifying-glass"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        const buscar = () => {
            const txt = document.getElementById('find-input').value.trim();
            if(!txt) return;
            core.vibra("tick");
            
            // 🛡️ Sanitizamos la URL para evitar ataques de inyección en la barra de direcciones
            const urlSegura = `https://duckduckgo.com/?q=${encodeURIComponent(txt)}`;
            window.open(urlSegura, '_blank');
            document.getElementById('find-input').value = "";
        };

        document.getElementById('find-btn').onclick = buscar;
        document.getElementById('find-input').onkeypress = (e) => { if(e.key === 'Enter') buscar(); };
    }
};
