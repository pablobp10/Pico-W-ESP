export const CalculadoraCard = {
    id: "Calc",
    defaultSize: "1x2",
    customAccion: {
        titulo: "Copiar Resultado",
        icono: "fa-regular fa-copy",
        color: "#a1a1aa",
        ejecutar: (core) => {
            const disp = document.getElementById('calc-display');
            if (disp && disp.innerText !== "Err") {
                navigator.clipboard.writeText(disp.innerText);
                core.notificar("Resultado copiado al portapapeles", "📋");
            }
        }
    },
    html: `
        <style>
            #calc-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; padding: 3cqmin; }
            #calc-display { width: 100%; background: transparent; padding: 2cqmin 4cqmin; text-align: right; font-size: clamp(1.8rem, 15cqmin, 5rem); color: var(--text-main); font-weight: 300; box-sizing: border-box; margin-bottom: 2cqmin; letter-spacing: -1px; }
            .calc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2cqmin; flex-grow: 1; width: 100%; }
            .calc-btn-fluid { background: var(--bg); border: 1px solid var(--border); border-radius: clamp(6px, 3cqmin, 16px); font-size: clamp(1.1rem, 10cqmin, 3rem); cursor: pointer; color: var(--text-main); font-weight: 500; display: flex; align-items: center; justify-content: center; transition: 0.1s; }
            .calc-btn-fluid:active { transform: scale(0.9); background: var(--border); }
            .calc-op { color: #ff9f0a; background: rgba(255,159,10,0.15); }
            
            @container (aspect-ratio > 1.2) {
                #calc-wrapper { flex-direction: row; align-items: center; padding: 15px; gap: 15px; }
                #calc-display { width: 35%; height: 100%; display: flex; align-items: flex-end; justify-content: flex-end; font-size: clamp(2rem, 12cqw, 6rem); padding-bottom: 10px; margin: 0; }
                .calc-grid { width: 65%; height: 100%; }
            }
        </style>
        
        <div id="calc-wrapper">
            <div id="calc-display">0</div>
            <div class="calc-grid">
                <button class="calc-btn-fluid" data-v="7">7</button><button class="calc-btn-fluid" data-v="8">8</button><button class="calc-btn-fluid" data-v="9">9</button><button class="calc-btn-fluid calc-op" data-v="/">÷</button>
                <button class="calc-btn-fluid" data-v="4">4</button><button class="calc-btn-fluid" data-v="5">5</button><button class="calc-btn-fluid" data-v="6">6</button><button class="calc-btn-fluid calc-op" data-v="*">×</button>
                <button class="calc-btn-fluid" data-v="1">1</button><button class="calc-btn-fluid" data-v="2">2</button><button class="calc-btn-fluid" data-v="3">3</button><button class="calc-btn-fluid calc-op" data-v="-">-</button>
                <button class="calc-btn-fluid" data-v="0">0</button><button class="calc-btn-fluid" data-v="C" style="color:#ff453a">C</button><button class="calc-btn-fluid" data-v="=" style="background:var(--text-main); color:var(--bg)">=</button><button class="calc-btn-fluid calc-op" data-v="+">+</button>
            </div>
        </div>
    `,
    onInit: () => {
        window.calcExpr = "";
        const disp = document.getElementById('calc-display');
        document.querySelectorAll('.calc-btn-fluid').forEach(b => {
            b.onclick = () => {
                const v = b.getAttribute('data-v');
                if(v === 'C') window.calcExpr = "";
                else if(v === '=') { try { window.calcExpr = eval(window.calcExpr).toString(); } catch { window.calcExpr = "Err"; } }
                else window.calcExpr += v;
                disp.innerText = window.calcExpr || "0";
            };
        });
    },
    onData: (val) => {
        try { 
            const disp = document.getElementById('calc-display');
            window.calcExpr = eval(val).toString(); 
            disp.innerText = window.calcExpr;
        } catch(e) {}
    },
    abrirAjustes: (core) => {
        core.notificar("Calculadora Cuántica V22", "🧮");
    }
};
