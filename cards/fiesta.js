export const FiestaCard = {
    id: "Fiesta",
    html: `
        <div class="label" style="margin-bottom:8px">FIESTA</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; width: 100%; height: 100%;">
            <button class="btn-fiesta" id="f-r" style="background:#ff453a; border:none; border-radius:8px; color:white; font-weight:bold; cursor:pointer">R</button>
            <button class="btn-fiesta" id="f-a" style="background:#0a84ff; border:none; border-radius:8px; color:white; font-weight:bold; cursor:pointer">A</button>
            <button class="btn-fiesta" id="f-v" style="background:#32d74b; border:none; border-radius:8px; color:white; font-weight:bold; cursor:pointer">V</button>
            <button class="btn-fiesta" id="f-off" style="background:#1c1c1e; border:none; border-radius:8px; color:white; font-weight:bold; cursor:pointer; font-size:0.8rem">OFF</button>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('f-r').onclick = () => core.pub('Fiesta', 'rojo', false);
        document.getElementById('f-a').onclick = () => core.pub('Fiesta', 'azul', false);
        document.getElementById('f-v').onclick = () => core.pub('Fiesta', 'verde', false);
        document.getElementById('f-off').onclick = () => core.pub('Fiesta', 'off', false);
    },
    onData: (val) => {
        // Esto limpia las clases anteriores y pone la nueva
        document.body.className = ""; 
        if(val && val !== "off") {
            document.body.classList.add("fiesta-" + val);
        }
    }
};
