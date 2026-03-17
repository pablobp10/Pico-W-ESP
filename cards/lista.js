export const ListaCard = {
    id: "Lista",
    category: "herramientas",
    rol: "guest",
    defaultSize: "2x2",
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                <i class="fa-solid fa-list-check" style="color:var(--primary); font-size:1.2rem;"></i>
                <span style="font-weight:bold; color:var(--text-main); font-size:0.9rem;">TAREAS</span>
            </div>
            
            <ul id="lista-tareas" style="list-style:none; padding:0; margin:0; overflow-y:auto; flex-grow:1; scrollbar-width:none; display:flex; flex-direction:column; gap:5px;"></ul>
            
            <div style="display:flex; margin-top:10px; gap:5px;">
                <input type="text" id="lista-input" placeholder="Nueva tarea..." style="flex-grow:1; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); border-radius:8px; padding:8px; outline:none; font-size:0.8rem;">
                <button id="lista-btn-add" class="btn-action" style="background:#32d74b; color:white; border:none; border-radius:8px; width:40px; cursor:pointer;"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        const input = document.getElementById('lista-input');
        const ul = document.getElementById('lista-tareas');
        
        let tareas = JSON.parse(localStorage.getItem('pico_tareas')) || [];

        const guardar = () => localStorage.setItem('pico_tareas', JSON.stringify(tareas));

        const render = () => {
            ul.innerHTML = "";
            if(tareas.length === 0) {
                ul.innerHTML = '<li style="text-align:center; color:var(--text-sec); font-size:0.8rem; margin-top:20px;">Lista vacía</li>';
                return;
            }

            tareas.forEach((t, i) => {
                const li = document.createElement('li');
                li.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px 10px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); animation: fadeIn 0.2s;";
                
                const span = document.createElement('span');
                span.innerText = t.texto; // 🛡️ ANTIXSS: innerText, NUNCA innerHTML
                span.style.cssText = `font-size:0.85rem; color:${t.hecho ? 'var(--text-sec)' : 'var(--text-main)'}; text-decoration:${t.hecho ? 'line-through' : 'none'}; cursor:pointer; flex-grow:1; word-break:break-all;`;
                
                span.onclick = () => { t.hecho = !t.hecho; guardar(); render(); core.vibra("tick"); };
                
                const btnDel = document.createElement('button');
                btnDel.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                btnDel.style.cssText = "background:none; border:none; color:#ff453a; cursor:pointer; padding:5px;";
                btnDel.onclick = () => { tareas.splice(i, 1); guardar(); render(); core.vibra("error"); };
                
                li.appendChild(span);
                li.appendChild(btnDel);
                ul.appendChild(li);
            });
        };

        const add = () => {
            const val = input.value.trim();
            if(!val) return;
            tareas.push({ texto: val, hecho: false });
            input.value = "";
            guardar(); render(); core.vibra("doble");
        };

        document.getElementById('lista-btn-add').onclick = add;
        input.onkeypress = (e) => { if(e.key === 'Enter') add(); };
        
        render();
    },
    // Compatibilidad con la IA local
    onData: (val, app, core) => {
        if(typeof val === 'string' && val.trim() !== "") {
            let tareas = JSON.parse(localStorage.getItem('pico_tareas')) || [];
            tareas.push({ texto: val, hecho: false });
            localStorage.setItem('pico_tareas', JSON.stringify(tareas));
            ListaCard.onInit(core); // Re-render
        }
    }
};
