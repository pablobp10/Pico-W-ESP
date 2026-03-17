export const CalculadoraCard = {
    id: "Calculadora",
    category: "herramientas",
    rol: "guest",
    defaultSize: "2x2",
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%; background:var(--bg); border-radius:15px; overflow:hidden;">
            <div id="calc-display" style="flex:1; background:rgba(0,0,0,0.3); color:var(--text-main); font-size:1.8rem; font-weight:bold; text-align:right; padding:15px; display:flex; align-items:flex-end; justify-content:flex-end; letter-spacing:1px; overflow:hidden; text-overflow:ellipsis;">0</div>
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1px; background:var(--border);">
                <button class="calc-btn" data-val="C" style="background:#ff453a; color:white;">C</button>
                <button class="calc-btn" data-val="<" style="background:var(--card-bg); color:var(--primary);"><i class="fa-solid fa-delete-left"></i></button>
                <button class="calc-btn" data-val="/" style="background:var(--card-bg); color:var(--primary);">÷</button>
                <button class="calc-btn" data-val="*" style="background:var(--card-bg); color:var(--primary);">×</button>
                
                <button class="calc-btn" data-val="7" style="background:var(--card-bg); color:var(--text-main);">7</button>
                <button class="calc-btn" data-val="8" style="background:var(--card-bg); color:var(--text-main);">8</button>
                <button class="calc-btn" data-val="9" style="background:var(--card-bg); color:var(--text-main);">9</button>
                <button class="calc-btn" data-val="-" style="background:var(--card-bg); color:var(--primary);">-</button>
                
                <button class="calc-btn" data-val="4" style="background:var(--card-bg); color:var(--text-main);">4</button>
                <button class="calc-btn" data-val="5" style="background:var(--card-bg); color:var(--text-main);">5</button>
                <button class="calc-btn" data-val="6" style="background:var(--card-bg); color:var(--text-main);">6</button>
                <button class="calc-btn" data-val="+" style="background:var(--card-bg); color:var(--primary);">+</button>
                
                <button class="calc-btn" data-val="1" style="background:var(--card-bg); color:var(--text-main);">1</button>
                <button class="calc-btn" data-val="2" style="background:var(--card-bg); color:var(--text-main);">2</button>
                <button class="calc-btn" data-val="3" style="background:var(--card-bg); color:var(--text-main);">3</button>
                <button class="calc-btn" data-val="=" style="grid-row:span 2; background:#32d74b; color:white; font-weight:bold;">=</button>
                
                <button class="calc-btn" data-val="0" style="grid-column:span 2; background:var(--card-bg); color:var(--text-main);">0</button>
                <button class="calc-btn" data-val="." style="background:var(--card-bg); color:var(--text-main);">.</button>
            </div>
        </div>
        <style>
            .calc-btn { border:none; padding:15px 0; font-size:1.2rem; cursor:pointer; transition:0.2s; outline:none; }
            .calc-btn:active { opacity:0.5; }
        </style>
    `,
    onInit: (core) => {
        let op1 = "", op2 = "", operacion = null, resetScreen = false;
        const display = document.getElementById('calc-display');

        const calcular = () => {
            let res = 0, n1 = parseFloat(op1), n2 = parseFloat(op2);
            if(isNaN(n1) || isNaN(n2)) return op1;
            if(operacion === '+') res = n1 + n2;
            if(operacion === '-') res = n1 - n2;
            if(operacion === '*') res = n1 * n2;
            if(operacion === '/') res = n2 === 0 ? "Err" : n1 / n2;
            return String(Math.round(res * 100000000) / 100000000); // Evitar decimales infinitos locos
        };

        document.querySelectorAll('#card-Calculadora .calc-btn').forEach(btn => {
            btn.onclick = (e) => {
                const val = e.currentTarget.dataset.val;
                core.vibra("tick");

                if (val === 'C') { op1 = ""; op2 = ""; operacion = null; display.innerText = "0"; }
                else if (val === '<') { 
                    if(display.innerText !== "Err" && display.innerText.length > 0) {
                        display.innerText = display.innerText.slice(0, -1) || "0";
                        if(operacion) op2 = display.innerText; else op1 = display.innerText;
                    }
                }
                else if (['+','-','*','/'].includes(val)) {
                    if (op1 && op2 && operacion) { op1 = calcular(); display.innerText = op1; op2 = ""; }
                    operacion = val; resetScreen = true;
                }
                else if (val === '=') {
                    if (op1 && op2 && operacion) { op1 = calcular(); display.innerText = op1; op2 = ""; operacion = null; }
                }
                else { // Números y punto
                    if (display.innerText === "0" || resetScreen || display.innerText === "Err") { display.innerText = ""; resetScreen = false; }
                    if (val === '.' && display.innerText.includes('.')) return;
                    display.innerText += val;
                    if (operacion) op2 = display.innerText; else op1 = display.innerText;
                }
            };
        });
    }
};
