export const MegafonoCard = {
    id: "Megafono",
    html: `
        <i class="fa-solid fa-bullhorn icon" style="color:#ff9f0a; font-size:1.8rem"></i>
        <input type="text" id="tts-input" placeholder="Mensaje..." style="width:100%; margin:8px 0; padding:6px; font-size:0.8rem; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main); text-align:center">
        <button class="btn-action" style="background:#ff9f0a; padding:8px" id="btn-tts">HABLAR</button>
    `,
    onInit: (core) => {
        document.getElementById('btn-tts').onclick = () => {
            const txt = document.getElementById('tts-input').value;
            core.pub('Megafono', txt, false);
            document.getElementById('tts-input').value = "";
        };
    },
    onData: (val) => { window.speechSynthesis.speak(new SpeechSynthesisUtterance(val)); }
};
