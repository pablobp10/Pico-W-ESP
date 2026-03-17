export const ConscienciaCard = {
    id: "Consciencia",
    category: "sistema",
    rol: "god",
    defaultSize: "2x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                <i class="fa-solid fa-brain" style="color:#bf5af2; font-size:1.2rem;"></i>
                <span style="font-size:0.8rem; font-weight:bold; color:var(--text-main);">ESTADO MENTAL IA</span>
            </div>
            
            <div style="display:flex; gap:5px; width:100%;">
                <button class="btn-mood" data-mood="logico" style="background:rgba(10, 132, 255, 0.2); color:#0a84ff; border:1px solid #0a84ff;"><i class="fa-solid fa-calculator"></i> Lógico</button>
                <button class="btn-mood" data-mood="ironico" style="background:rgba(255, 159, 10, 0.2); color:#ff9f0a; border:1px solid #ff9f0a;"><i class="fa-solid fa-masks-theater"></i> Sarcasmo</button>
            </div>
            <div style="display:flex; gap:5px; width:100%; margin-top:5px;">
                <button class="btn-mood" data-mood="defensa" style="background:rgba(255, 69, 58, 0.2); color:#ff453a; border:1px solid #ff453a;"><i class="fa-solid fa-shield"></i> Paranoico</button>
                <button class="btn-mood" data-mood="zen" style="background:rgba(50, 215, 75, 0.2); color:#32d74b; border:1px solid #32d74b;"><i class="fa-solid fa-om"></i> Zen</button>
            </div>
        </div>
        <style>
            .btn-mood { flex:1; border-radius:6px; padding:6px 0; font-size:0.7rem; font-weight:bold; cursor:pointer; transition:0.2s; outline:none; }
            .btn-mood:active { transform:scale(0.95); }
        </style>
    `,
    onInit: (core) => {
        document.querySelectorAll('#card-Consciencia .btn-mood').forEach(btn => {
            btn.onclick = (e) => {
                core.vibra("tick");
                const mood = e.currentTarget.dataset.mood;
                // Esto dispara el switch interno en el core.js (ejecutarComandoLocal)
                core.ejecutarComandoLocal("Consciencia", mood); 
            };
        });
    }
};
