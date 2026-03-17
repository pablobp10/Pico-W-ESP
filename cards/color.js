export const ColorCard = {
    id: "Color",
    category: "luces",
    rol: "guest",
    defaultSize: "1x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%; position:relative;">
            <i class="fa-solid fa-palette icon" style="font-size:2rem; color:var(--text-main); margin-bottom:10px; pointer-events:none; z-index:2; text-shadow: 0 0 10px rgba(0,0,0,0.5);"></i>
            
            <input type="color" id="val-Color" value="#ff0000" style="position:absolute; width:100%; height:100%; top:0; left:0; opacity:0; cursor:pointer; z-index:5;">
            
            <div id="color-preview" style="position:absolute; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle, #ff0000 0%, transparent 70%); opacity:0.5; z-index:1; pointer-events:none; transition:background 0.3s;"></div>
            
            <span id="color-hex-text" style="font-family:monospace; font-size:0.8rem; font-weight:bold; color:var(--text-sec); z-index:2; pointer-events:none;">#FF0000</span>
        </div>
    `,
    onInit: (core) => {
        const input = document.getElementById('val-Color');
        const preview = document.getElementById('color-preview');
        const hexText = document.getElementById('color-hex-text');
        const icon = document.querySelector('#card-Color .fa-palette');
        
        let debounceTimer;

        input.oninput = (e) => {
            const hex = e.target.value;
            preview.style.background = `radial-gradient(circle, ${hex} 0%, transparent 70%)`;
            hexText.innerText = hex.toUpperCase();
            icon.style.color = hex;
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                core.vibra("tick");
                core.cmd('Color', hex); // Envía el Hexadecimal encriptado en AES
            }, 300); // Previene saturar el broker MQTT mientras arrastras el dedo
        };
    },
    onData: (val) => {
        if(typeof val === 'string' && val.startsWith('#')) {
            document.getElementById('val-Color').value = val;
            document.getElementById('color-preview').style.background = `radial-gradient(circle, ${val} 0%, transparent 70%)`;
            document.getElementById('color-hex-text').innerText = val.toUpperCase();
            document.querySelector('#card-Color .fa-palette').style.color = val;
        }
    }
};
