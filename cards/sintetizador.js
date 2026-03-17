export const SintetizadorCard = {
    id: "Sintetizador",
    category: "herramientas",
    rol: "guest",
    defaultSize: "2x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%;">
            <span style="font-size:0.7rem; font-weight:bold; color:var(--text-sec); margin-bottom:8px;">ZUMBADOR HARDWARE</span>
            <div style="display:flex; gap:10px;">
                <button class="btn-sint" data-tone="1" style="background:#ff453a;"><i class="fa-solid fa-triangle-exclamation"></i></button>
                <button class="btn-sint" data-tone="2" style="background:#32d74b;"><i class="fa-solid fa-check"></i></button>
                <button class="btn-sint" data-tone="3" style="background:#0a84ff;"><i class="fa-solid fa-bell"></i></button>
                <button class="btn-sint" data-tone="4" style="background:#bf5af2;"><i class="fa-solid fa-music"></i></button>
            </div>
        </div>
        <style>
            .btn-sint { border:none; width:45px; height:45px; border-radius:10px; color:white; font-size:1.2rem; cursor:pointer; transition:transform 0.1s; }
            .btn-sint:active { transform:scale(0.9); }
        </style>
    `,
    onInit: (core) => {
        document.querySelectorAll('#card-Sintetizador .btn-sint').forEach(btn => {
            btn.onclick = (e) => {
                core.vibra("tick");
                const tono = e.currentTarget.dataset.tone;
                core.cmd('Sintetizador', tono);
            };
        });
    }
};
