export const TerminalCard = {
    id: "terminal",
    size: "wide",
    icon: "fa-solid fa-terminal",
    title: "Terminal USB",
    html: `
        <div style="display:flex; flex-direction:column; gap:10px; height: 100%;">
            <button id="btn-serial-connect" class="pico-btn" style="background:var(--primary); color:#fff;">Conectar Placa</button>
            <textarea id="serial-output" readonly style="flex-grow:1; background:#000; color:#32d74b; font-family:monospace; font-size:12px; border:1px solid #333; padding:10px; border-radius:10px; resize:none;"></textarea>
            <div style="display:flex; gap:5px;">
                <input type="text" id="serial-input" placeholder="Comando Python..." style="flex-grow:1; background:#1c1c1e; border:1px solid #333; color:white; padding:8px; border-radius:8px;">
                <button id="btn-serial-send" class="pico-btn" style="width:50px;"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        let port;
        let reader;
        let writer;

        const output = document.getElementById('serial-output');
        const appendLog = (msg) => { output.value += msg; output.scrollTop = output.scrollHeight; };

        document.getElementById('btn-serial-connect').onclick = async () => {
            if (!navigator.serial) return core.notificar("Web Serial no soportado en este navegador", "❌");
            try {
                port = await navigator.serial.requestPort();
                await port.open({ baudRate: 115200 });
                core.notificar("Conexión física establecida", "🔌");
                appendLog(">>> Conectado a Raspberry Pi Pico (115200 baud)\\n");
                
                const textDecoder = new TextDecoderStream();
                const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
                reader = textDecoder.readable.getReader();
                
                // Bucle de lectura
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value) appendLog(value);
                }
            } catch (e) {
                appendLog(`\\n[Error]: ${e.message}\\n`);
            }
        };

        document.getElementById('btn-serial-send').onclick = async () => {
            if (!port) return;
            const input = document.getElementById('serial-input');
            const data = input.value + '\\r\\n';
            input.value = '';
            
            if (!writer) {
                const textEncoder = new TextEncoderStream();
                const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
                writer = textEncoder.writable.getWriter();
            }
            await writer.write(data);
            appendLog(`> ${data}`);
        };
    }
};
