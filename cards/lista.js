export const ListaCard = {
    id: "Lista",
    size: "tall", // CAMBIO: Ahora es 'tall' (Vertical, 2 huecos de alto)
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%; overflow:hidden;">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-cart-shopping" style="color:#eab308"></i> LISTA DE COMPRA
            </div>
            
            <div id="shop-list" class="shopping-list">
                <div style="color:var(--text-sec); font-size:0.8rem; margin-top:20px">Cargando...</div>
            </div>

            <div class="add-row">
                <input type="text" id="shop-input" placeholder="Añadir producto...">
                <button id="btn-add"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('btn-add').onclick = () => addItem(core);
        document.getElementById('shop-input').onkeypress = (e) => {
            if(e.key === 'Enter') addItem(core);
        };
    },
    
    onData: (val, app, core) => {
        let items = window.currentShopList || [];
        
        // 🧠 TRADUCTOR HÍBRIDO AVANZADO
        try { 
            // 1. Sincronización JSON (entre móviles)
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) items = parsed;
            else throw new Error("No es array");
        }catch (e){ 
            // 2. Comandos de texto plano desde JARVIS
            if (typeof val === "string" && val.trim() !== "" && val !== "get") {
                const comando = val.trim().toLowerCase();
                
                if (comando === "limpiar" || comando === "borrar") {
                    items = []; // Vacía la lista por completo
                } 
                else if (val.trim().startsWith("-")) {
                    // Borra un elemento específico (ej: "- queso")
                    const aBorrar = val.substring(1).trim().toLowerCase();
                    items = items.filter(item => item.txt.toLowerCase() !== aBorrar);
                } 
                else {
                    // Añade un elemento (con "+" o directamente el nombre)
                    const aAnadir = val.trim().startsWith("+") ? val.substring(1).trim() : val.trim();
                    if(aAnadir) items.push({ txt: aAnadir, done: false });
                }
                
                // Republicamos el nuevo estado para todos
                core.pub('Lista', JSON.stringify(items), true);
            }
        }
        
        window.currentShopList = items;
        const container = document.getElementById('shop-list');
        container.innerHTML = ""; 
        
        if(items.length === 0) {
            container.innerHTML = '<div style="color:var(--text-sec); font-size:0.8rem; margin-top:20px">Lista vacía</div>';
            return;
        }

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `shop-item ${item.done ? 'done' : ''}`;
            div.innerHTML = `
                <input type="checkbox" ${item.done ? 'checked' : ''}>
                <span>${item.txt}</span>
                <button class="btn-del"><i class="fa-solid fa-trash"></i></button>
            `;
            
            div.querySelector('input').onchange = () => {
                items[index].done = !items[index].done;
                core.pub('Lista', JSON.stringify(items), true);
            };

            div.querySelector('.btn-del').onclick = () => {
                items.splice(index, 1);
                core.pub('Lista', JSON.stringify(items), true);
            };

            container.appendChild(div);
        });
    }
};

function addItem(core) {
    const input = document.getElementById('shop-input');
    const txt = input.value.trim();
    if(!txt) return;
    
    let currentList = window.currentShopList || [];
    currentList.push({ txt: txt, done: false });
    
    core.pub('Lista', JSON.stringify(currentList), true);
    input.value = "";
    input.focus();
}

const originalOnData = ListaCard.onData;
ListaCard.onData = (val, app, core) => {
    try { window.currentShopList = Array.isArray(val) ? val : JSON.parse(val); } catch { window.currentShopList = []; }
    originalOnData(val, app, core);
};
