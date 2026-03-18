export const ListaCard = {
    id: "Lista",
    defaultSize: "1x2", 
    customAccion: {
        titulo: "Compartir por WhatsApp",
        icono: "fa-brands fa-whatsapp",
        color: "#25D366",
        ejecutar: (core) => {
            let items = window.currentShopList || [];
            if(items.length === 0) return core.notificar("La lista está vacía", "ℹ️");
            let texto = "*Mi Lista de la Compra:*\n\n";
            items.forEach(i => texto += i.done ? `~- ${i.txt}~\n` : `- ${i.txt}\n`);
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
        }
    },
    html: `
        <style>
            #lista-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; overflow: hidden; box-sizing: border-box; padding: 4cqmin; }
            .lista-label { font-size: clamp(0.7rem, 6cqmin, 1.2rem); font-weight: 700; color: var(--text-sec); margin-bottom: 2cqmin; text-align: left; }
            #shop-list { flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2cqmin; padding-right: 5px; }
            .shop-item-fluid { display: flex; align-items: center; gap: 2cqmin; background: var(--bg); padding: clamp(6px, 2cqmin, 12px); border-radius: 8px; text-align: left; transition: 0.2s; }
            .shop-item-fluid span { flex-grow: 1; font-size: clamp(0.8rem, 5cqmin, 1.2rem); font-weight: 500; color: var(--text-main); }
            .shop-item-fluid.done span { text-decoration: line-through; color: var(--text-sec); opacity: 0.6; }
            .shop-item-fluid input[type="checkbox"] { width: clamp(16px, 5cqmin, 24px); height: clamp(16px, 5cqmin, 24px); accent-color: var(--primary); cursor: pointer; margin: 0; }
            .shop-item-fluid .btn-del { color: #ff453a; background: none; border: none; cursor: pointer; padding: 4px; opacity: 0.5; font-size: clamp(0.8rem, 5cqmin, 1.2rem); }
            
            .add-row-fluid { display: flex; align-items: center; width: 100%; gap: 2cqmin; margin-top: auto; padding-top: 3cqmin; border-top: 1px solid var(--border); }
            #shop-input { flex-grow: 1; height: clamp(30px, 10cqmin, 45px); padding: 0 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text-main); box-sizing: border-box; outline: none; font-size: clamp(0.8rem, 5cqmin, 1.2rem); }
            #btn-add { width: clamp(30px, 10cqmin, 45px); height: clamp(30px, 10cqmin, 45px); background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: clamp(0.9rem, 6cqmin, 1.5rem); display: flex; justify-content: center; align-items: center; padding: 0; }
            
            @container (aspect-ratio > 1.5) {
                #shop-list { flex-direction: row; flex-wrap: wrap; align-content: flex-start; }
                .shop-item-fluid { width: calc(50% - 1cqmin); box-sizing: border-box; }
            }
        </style>
        
        <div id="lista-wrapper">
            <div class="lista-label"><i class="fa-solid fa-cart-shopping" style="color:#eab308"></i> LISTA DE COMPRA</div>
            <div id="shop-list">
                <div style="color:var(--text-sec); font-size:0.8rem; margin-top:20px">Cargando...</div>
            </div>
            <div class="add-row-fluid">
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
        window.currentShopList = window.currentShopList || [];
    },
    onData: (val, app, core) => {
        let items = window.currentShopList || [];
        try { 
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) items = parsed;
            else throw new Error("No array");
        } catch (e) { 
            if (typeof val === "string" && val.trim() !== "" && val !== "get") {
                const comando = val.trim().toLowerCase();
                if (comando === "limpiar" || comando === "borrar") {
                    items = []; 
                } else if (val.trim().startsWith("-")) {
                    const aBorrar = val.substring(1).trim().toLowerCase();
                    items = items.filter(item => item.txt.toLowerCase() !== aBorrar);
                } else {
                    const aAnadir = val.trim().startsWith("+") ? val.substring(1).trim() : val.trim();
                    if(aAnadir) items.push({ txt: aAnadir, done: false });
                }
                core.pub('Lista', JSON.stringify(items), true);
            }
        }
        
        window.currentShopList = items;
        const container = document.getElementById('shop-list');
        container.innerHTML = ""; 
        
        if(items.length === 0) {
            container.innerHTML = '<div style="color:var(--text-sec); font-size:clamp(0.8rem, 5cqmin, 1.2rem); margin-top:10cqmin; text-align:center;">Lista vacía</div>';
            return;
        }

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `shop-item-fluid ${item.done ? 'done' : ''}`;
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
    },
    abrirAjustes: (core) => {
        if(confirm("¿Eliminar los productos tachados?")) {
            let items = window.currentShopList || [];
            items = items.filter(i => !i.done);
            core.pub('Lista', JSON.stringify(items), true);
            core.notificar("Lista depurada", "🧹");
        }
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
