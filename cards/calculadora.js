export const CalculadoraCard = {
    id: "Calc",
    size: "tall", // RESTAURADO: Ocupa 2 huecos verticales
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%;">
            <div id="calc-display">0</div>
            <div class="calc-grid">
                <button class="calc-btn" data-v="7">7</button><button class="calc-btn" data-v="8">8</button><button class="calc-btn" data-v="9">9</button><button class="calc-btn" style="color:#ff9f0a; background:rgba(255,159,10,0.15)" data-v="/">÷</button>
                <button class="calc-btn" data-v="4">4</button><button class="calc-btn" data-v="5">5</button><button class="calc-btn" data-v="6">6</button><button class="calc-btn" style="color:#ff9f0a; background:rgba(255,159,10,0.15)" data-v="*">×</button>
                <button class="calc-btn" data-v="1">1</button><button class="calc-btn" data-v="2">2</button><button class="calc-btn" data-v="3">3</button><button class="calc-btn" style="color:#ff9f0a; background:rgba(255,159,10,0.15)" data-v="-">-</button>
                <button class="calc-btn" data-v="0">0</button><button class="calc-btn" data-v="C" style="color:#ff453a">C</button><button class="calc-btn" data-v="=" style="background:var(--text-main); color:var(--bg)">=</button><button class="calc-btn" style="color:#ff9f0a; background:rgba(255,159,10,0.15)" data-v="+">+</button>
            </div>
        </div>
    `,
    onInit: () => {
        let expr = "";
        const disp = document.getElementById('calc-display');
        document.querySelectorAll('.calc-btn').forEach(b => {
            b.onclick = () => {
                const v = b.getAttribute('data-v');
                if(v==='C') expr="";
                else if(v==='=') { try{expr=eval(expr).toString()}catch{expr="Err"} }
                else expr+=v;
                disp.innerText = expr || "0";
            };
        });
    }
};
