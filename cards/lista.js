export const ListaCard = {
    id: "Lista",
    size: "wide", // Ocupa 2 huecos (Ancha)
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%; overflow:hidden;">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-cart-shopping" style="color:#eab308"></i> LISTA DE COMPRA
            </div>
            
            <div id="shop-list" class="shopping-list">
                <div style="color:var(--text-sec); font-size:0.8rem; margin-top:20px">Lista vacía</div>
            </div>

            <div class="add-row">
                <input type="text" id="shop-input" placeholder="Añadir producto...">
                <button id="btn-add"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        // Al pulsar el botón +
        document.getElementById('btn-add').onclick = () => addItem(core);
        
        // Al pulsar Enter en el teclado
        document.getElementById('shop-input').onkeypress = (e) => {
            if(e.key === 'Enter') addItem(core);
        };
    },
    onData: (val, app, core) => {
        // Val esperamos que sea un Array: [{txt: "Leche", done: false}, ...]
        let items = [];
        try { items = Array.isArray(val) ? val : JSON.parse(val); } catch { items = []; }
        
        const container = document.getElementById('shop-list');
        container.innerHTML = ""; // Limpiar
        
        if(items.length === 0) {
            container.innerHTML = '<div style="color:var(--text-sec); font-size:0.8rem; margin-top:20px">Lista vacía</div>';
            return;
        }

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `shop-item ${item.done ? 'done' : ''}`;
            div.innerHTML = `
                <input type="checkbox" ${item.done ? 'checked' : ''}>
                <span class="item-text"></span> <button class="btn-del"><i class="fa-solid fa-trash"></i></button>
            `;
            // Y luego rellenamos el texto de forma segura:
            div.querySelector('.item-text').innerText = item.txt;
            
            // Evento Checkbox (Tachar)
            div.querySelector('input').onchange = () => {
                items[index].done = !items[index].done;
                core.pub('Lista', JSON.stringify(items), true); // Guardar cambio
            };

            // Evento Borrar
            div.querySelector('.btn-del').onclick = () => {
                items.splice(index, 1);
                core.pub('Lista', JSON.stringify(items), true); // Guardar cambio
            };

            container.appendChild(div);
        });
        
        // Mantener el scroll abajo si se añade algo nuevo (opcional)
        // container.scrollTop = container.scrollHeight;
    }
};

// Función auxiliar fuera del objeto para limpiar el onInit
function addItem(core) {
    const input = document.getElementById('shop-input');
    const txt = input.value.trim();
    if(!txt) return;

    // Recuperar lista actual o crear nueva
    // Truco: Leemos del DOM si no tenemos estado local, o asumimos array vacío
    // Lo ideal es que 'onData' haya guardado el estado en una variable, 
    // pero para simplificar, pediremos el estado actual o enviaremos uno nuevo.
    // Como MQTT es asíncrono, lo mejor es asumir que lo que hay en pantalla es la verdad.
    
    // Vamos a leer los items actuales del DOM para añadir el nuevo (Hack rápido y efectivo)
    // O mejor, confiamos en que 'val' viene de onData.
    // Para no complicar la arquitectura:
    // 1. Enviamos el dato nuevo. El broker nos lo devolverá y se pintará.
    // PERO necesitamos el array anterior. 
    // SOLUCIÓN: Guardamos el array en window.currentList para manipularlo.
    
    let currentList = window.currentShopList || [];
    currentList.push({ txt: txt, done: false });
    
    core.pub('Lista', JSON.stringify(currentList), true);
    input.value = "";
    input.focus();
}

// Interceptamos onData para guardar copia local
const originalOnData = ListaCard.onData;
ListaCard.onData = (val, app, core) => {
    try { window.currentShopList = Array.isArray(val) ? val : JSON.parse(val); } catch { window.currentShopList = []; }
    originalOnData(val, app, core);
};
