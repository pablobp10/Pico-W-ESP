 export const FindCard = {
    id: "Find",
    html: `
        <i class="fa-solid fa-mobile-screen icon" style="color:#0ea5e9"></i>
        <div class="label" id="bat-val">Batería</div>
        <button class="btn-action" style="background:#0ea5e9" id="btn-beep">🔊 PITAR</button>
    `,
    onInit: (core) => {
        document.getElementById('btn-beep').onclick = () => core.pub('Find','beep',false);
        if(navigator.getBattery) navigator.getBattery().then(b=>document.getElementById('bat-val').innerText=Math.round(b.level*100)+"%");
    },
    onData: (val) => {
        if(val==='beep') {
            const c=new AudioContext(); const o=c.createOscillator(); 
            o.connect(c.destination); o.start(); setTimeout(()=>o.stop(),500);
        }
    }
};

