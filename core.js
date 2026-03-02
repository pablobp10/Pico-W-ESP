import { TiempoCard } from './cards/tiempo.js';
import { ListaCard } from './cards/lista.js'; 
import { MegafonoCard } from './cards/megafono.js';
import { LedCard } from './cards/led.js';
import { SensoresCard } from './cards/sensores.js';
import { PomodoroCard } from './cards/pomodoro.js';
import { DadoCard } from './cards/dado.js';
import { CalculadoraCard } from './cards/calculadora.js';
import { FiestaCard } from './cards/fiesta.js';
import { FindCard } from './cards/buscar.js';
import { RelojCard } from './cards/reloj.js';
import { SeguridadCard } from './cards/seguridad.js';
import { AlmaCard } from './cards/almacenamiento.js';
import { ColorCard } from './cards/color.js';
import { MedidorCard } from './cards/medidor.js';
import { QrCard } from './cards/qr.js';
import { TestCard } from './cards/test.js';

export class Core {
    constructor() {
        this.cards = [
            TiempoCard, ListaCard, MegafonoCard, LedCard, SensoresCard,
            PomodoroCard, DadoCard, CalculadoraCard, FiestaCard, FindCard,
            RelojCard, SeguridadCard, AlmaCard, ColorCard, MedidorCard, QrCard, TestCard
        ];

        this.conf = null;
        this.mqtt = null;
        this.rol = "guest";
        this.editMode = false;
        
        this.llave = {
            "pablo": "kN+hf/XSn0EIKBF6MvlmOM3Fey9EGmlKAX0yGBYq+tVoSFizGZts766xX1R7AFRKVrLITUUCTMRQd9vt44qTHdE50WbjETI3pqwauRzshvr0vil85D9isbqjUr8SWkl4OWPVSOFHacvxIwtltnliNg==",
            "invitado": "NyXu8S58v+Q3xnDroYH7+MyffhCT0aZuvdFYA+rNrqxLibKi+sLU1dygX52kts1FqA0/GsTp9v/pEQR1dcdUFFebgQiJ+pog5zAhJkuSu3f6eOx3yzDPDTI/sUN29tJ0ysycox2LMOv2nIXaDdn00Q==",
            "admin": "TVvNksSUIigBVr6//QhXqSZG3QJKkesvCO/JSQ5c0KmLEwAF8dVuHxeyGQlynj6roqm0r/MSpzRL1o7naSh1d5w+x5FIx0nhSAgb0yPx8+SSeur1E7Lz1A6u8BzpdA81w48BawH87HWo/pjkWP3ENw=="
        };
        
        this.brokers = [
            { h: "broker.hivemq.com", p: 8884, name: "HiveMQ" },
            { h: "broker.emqx.io", p: 8084, name: "EMQX" }, 
            { h: "public.mqtthq.com", p: 8084, name: "MQTTHQ" },
            { h: "test.mosquitto.org", p: 8081, name: "Mosquitto" }
        ];
        this.brIdx = 0;

        this.init();
    }

    init() {
        this.initTheme();
        this.renderGrid();
        this.setupBrokerMenu();
        this.filtroActual = 'all';
        this.initAtajosTeclado();
        this.initParallax();
        this.initSwipeGestures();
        this.initSidebar();
        this.initMultijugador();
        
        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('btn-edit').onclick = () => this.toggleEdit();
        document.getElementById('btn-theme').onclick = () => this.toggleTheme();
        document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); location.reload(); };
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };
        document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Cambiar estilos de los botones
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Aplicar filtro y repintar
            this.filtroActual = e.target.dataset.filter;
            this.vibra('tick');
            this.renderGrid(); // Volvemos a pintar la cuadrícula filtrada.
        });
    });
        const settingsTrigger = document.getElementById('settings-trigger');
        const settingsMenu = document.getElementById('settings-menu');
        const brokerMenu = document.getElementById('broker-menu');

        settingsTrigger.onclick = (e) => {
            e.stopPropagation();
            const isOpen = settingsMenu.classList.contains('open');
            brokerMenu.classList.remove('open');
            if(isOpen) settingsMenu.classList.remove('open');
            else settingsMenu.classList.add('open');
        };

        window.onclick = (e) => {
            if(!document.getElementById('broker-trigger').contains(e.target)) {
                brokerMenu.classList.remove('open');
            }
            if(!settingsTrigger.contains(e.target)) {
                settingsMenu.classList.remove('open');
            }
        };

        const u = sessionStorage.getItem("u"), p = sessionStorage.getItem("p");
        if(u && p) { 
            document.getElementById('user-input').value = u; 
            document.getElementById('pass-input').value = p; 
            this.login(); 
        }

        // Activar el Cerebro IA
        document.getElementById('btn-ai-send').onclick = () => this.procesarComandoIA();
        document.getElementById('ai-input').onkeypress = (e) => { if(e.key==='Enter') this.procesarComandoIA(); };
        
        // Activar control offline del navegador
        window.addEventListener('online', () => this.setNetworkStatus(true));
        window.addEventListener('offline', () => this.setNetworkStatus(false));
    }

    setupBrokerMenu() {
        const menu = document.getElementById('broker-menu');
        const current = document.getElementById('current-broker-name');
        const trigger = document.getElementById('broker-trigger');
        const settingsMenu = document.getElementById('settings-menu');
        
        current.innerText = this.brokers[this.brIdx].name;
        menu.innerHTML = "";

        this.brokers.forEach((b, idx) => {
            const item = document.createElement('div');
            item.className = `dropdown-item ${idx===this.brIdx?'selected':''}`;
            item.innerText = b.name;
            item.onclick = () => {
                this.brIdx = idx;
                current.innerText = b.name;
                menu.classList.remove('open');
                this.setupBrokerMenu();
                if(this.mqtt) this.mqtt.disconnect();
                setTimeout(()=>this.conectar(), 500);
            };
            menu.appendChild(item);
        });

        trigger.onclick = (e) => {
            e.stopPropagation(); 
            settingsMenu.classList.remove('open'); 
            menu.classList.toggle('open');
        };
    }

    renderGrid() {
        const tarjetasFiltradas = this.cards.filter(c => this.filtroActual === 'all' || c.category === this.filtroActual);
        const grid = document.getElementById('dashboard-grid');
        grid.innerHTML = "";
        
        let order = JSON.parse(localStorage.getItem('gridOrder'));
        if(order) {
            this.cards.sort((a, b) => {
                const idxA = order.indexOf(a.id);
                const idxB = order.indexOf(b.id);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            });
        }

        // 🧠 DICCIONARIO DE TAMAÑOS: Aquí le recordamos al sistema quién es ancho o alto
        // (Añade o quita nombres según el "id" exacto de tus tarjetas)
        const memorySizes = {
            "Sensores": "wide",
            "Tiempo": "wide",
            "Alma": "wide",
            "Calculadora": "wide",
            "Reloj": "tall",
            "Lista": "tall"
        };
        
        tarjetasFiltradas.forEach((card, index) => {
            const div = document.createElement('div');
            
            // Rescatamos el tamaño del diccionario para que no lo olvide al filtrar
            const cardSize = card.size || memorySizes[card.id] || "";
            div.className = `card cascade-in ${cardSize}`;
            
            div.style.animationDelay = `${index * 50}ms`; 
            div.style.setProperty('--order', index);
            
            if(card.adminOnly) div.classList.add('admin-only');
            div.id = `card-${card.id}`;
            div.setAttribute('data-id', card.id);
            
            div.innerHTML = card.html;
            grid.appendChild(div);
            
            // 🛡️ EL ESCUDO: Evita que el error de una tarjeta rompa a las demás
            try {
                if(card.onInit) card.onInit(this);
            } catch(error) {
                console.error(`Error silencioso iniciando tarjeta ${card.id}:`, error);
            }
        });
    }

    conectar() {
        const b = this.brokers[this.brIdx];
        const dot = document.getElementById('mqtt-dot');
        dot.className = "dot orange";
        
        const id = "Web_" + parseInt(Math.random() * 100000);
        this.mqtt = new Paho.MQTT.Client(b.h, Number(b.p), "/mqtt", id);
        
        this.mqtt.onConnectionLost = (e) => {
            this.setNetworkStatus(false);
            dot.className = "dot red";
            setTimeout(() => { this.brIdx = (this.brIdx+1)%this.brokers.length; this.conectar(); }, 3000);
        };

        this.mqtt.onMessageArrived = (msg) => {
            const topic = msg.destinationName;
            const app = topic.split("/").pop();
            let val = msg.payloadString;
            
            // 🛡️ TRADUCTOR V22: Convertimos el texto bruto a diccionario JSON
            try { val = JSON.parse(val); } catch(e){}

            // 💓 BÚSQUEDA DE LATIDO: Ahora escucha tanto a "sistema" (V19) como a "sistema_hb" (V22)
            if (app === "sistema_hb" || app === "sistema" || (val && val.sistema)) {
                this.updatePicoStatus(val);
            }

            // 🚀 ENVÍO A TARJETAS (como el LED)
            this.cards.forEach(c => {
                if(c.id === app || (c.subs && c.subs.includes(app))) {
                    if(c.onData) c.onData(val, app, this);
                }
            });
        };

        this.mqtt.connect({
            useSSL: true, timeout: 3,
            onSuccess: () => {
                this.setNetworkStatus(true);
                if (dot) dot.className = "dot green";
                this.mqtt.subscribe(this.conf.topic + "estado/#");
                
                // Pedimos el estado inicial sin burocracia Auth
                setTimeout(() => this.cmd('Led', 'get'), 500); 
            },
            onFailure: () => { dot.className = "dot red"; setTimeout(() => this.conectar(), 3000); }
        });
    }

    updatePicoStatus(val) {
        const container = document.getElementById('pico-status-container');
        if (!container) return;
        
        // Comprueba si está vivo leyendo datos de V19 o V22
        const isOnline = val === "ONLINE" || val === "KEEPALIVE" || (val && (val.sistema === "ONLINE" || val.t !== undefined)); 

        // Si hay latido, limpiamos el temporizador
        clearTimeout(this.picoWatchdog);
        
        container.innerHTML = "";

        if (isOnline) {
            // Configuramos una bomba de relojería a 45 segundos.
            // Como la Pico late cada 15s, si pasan 45s es que ha muerto o perdido el WiFi.
            this.picoWatchdog = setTimeout(() => {
                console.log("⏱️ Timeout: La Pico ha dejado de latir.");
                this.updatePicoStatus("OFFLINE"); // Forzamos el estado a desconectado
            }, 20000);
            
            let ramPercent = 0;
            // 🧠 Traductor de RAM (r_pct es V22, ram es V19)
            if (val && val.r_pct !== undefined) {
                ramPercent = val.r_pct; 
            } else if (val && val.ram !== undefined) {
                const totalRam = 264 * 1024;
                ramPercent = Math.round(((totalRam - val.ram) / totalRam) * 100);
            }
            
            if(ramPercent < 0) ramPercent = 0;
            if(ramPercent > 100) ramPercent = 100;

            let ramColor = "var(--text-sec)";
            if(ramPercent > 60) ramColor = "#ff9f0a";
            if(ramPercent > 85) ramColor = "#ff453a";

            // 🧠 Traductor de Temperatura (t es V22, temp es V19)
            let tempValor = (val && val.t !== undefined) ? val.t : (val && val.temp);
            let tempTxt = tempValor ? tempValor + "°C" : "";
            
            let rssi = (val && val.rssi) ? val.rssi : -60; 
            let wifiColor = "#ff453a"; 
            if(rssi > -70) wifiColor = "#ff9f0a"; 
            if(rssi > -50) wifiColor = "#32d74b"; 

            container.innerHTML = `
                <div class="pico-info-pill">
                    <span style="color:#32d74b; font-weight:bold; font-size:0.8rem">●</span>
                    <span style="font-weight:600; color:var(--text-main); margin-right:5px">Online</span>
                    ${tempTxt ? `<span style="border-left:1px solid var(--border); padding-left:6px; margin-right:6px; font-size:0.8rem" title="CPU Temp"><i class="fa-solid fa-temperature-half"></i> ${tempTxt}</span>` : ''}
                    <span style="border-left:1px solid var(--border); padding-left:6px; color:${wifiColor}" title="Señal: ${rssi} dBm"><i class="fa-solid fa-wifi"></i></span>
                    <span style="border-left:1px solid var(--border); padding-left:6px; margin-left:6px; font-weight:600; font-size:0.8rem; color:${ramColor}" title="RAM Usada">${ramPercent}%</span>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="pico-info-pill" style="border-color:var(--text-sec); opacity:0.7">
                    <span class="dot red"></span>
                    <span style="font-weight:600; color:var(--text-sec);">Offline</span>
                </div>
            `;
        }
    }

    login() {
        const u = document.getElementById('user-input').value.trim();
        const p = document.getElementById('pass-input').value.trim();
        
        if(!this.llave[u]) return document.getElementById('error-msg').innerText = "Usuario no encontrado";
        
        try {
            const k = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(p));
            const rawData = CryptoJS.enc.Base64.parse(this.llave[u]);
            
            // 🛡️ Extracción de AES-CBC (Primeros 16 bytes = IV, el resto = Cifrado)
            const iv = CryptoJS.lib.WordArray.create(rawData.words.slice(0, 4), 16);
            const ciphertext = CryptoJS.lib.WordArray.create(rawData.words.slice(4), rawData.sigBytes - 16);
            
            const b = CryptoJS.AES.decrypt({ciphertext: ciphertext}, k, {
                iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
            });
            const txt = b.toString(CryptoJS.enc.Utf8);
            
            if(txt.includes("topic")) {
                this.conf = JSON.parse(txt); // Aquí ahora viene el 'tk' (WEB_TOKEN)
                this.rol = this.conf.rol;
                sessionStorage.setItem("u", u); 
                sessionStorage.setItem("p", p);
                document.getElementById('login-screen').style.display = 'none';
                if(this.rol === 'admin') document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
                
                this.conectar();
            } else throw 0;
        } catch { 
            const errorMsg = document.getElementById('error-msg');
            const loginBox = document.querySelector('.login-box');
            errorMsg.innerText = "Contraseña incorrecta"; 
            errorMsg.style.display = 'block'; 
            loginBox.classList.remove('error-shake');
            void loginBox.offsetWidth;
            loginBox.classList.add('error-shake');
        }
    }

    // ÚNICA función de comando. Fuerza minúsculas y elimina el pasaporte de seguridad.
    cmd(app, c) { 
        if(!this.mqtt || !this.mqtt.isConnected()) {
            console.log("❌ MQTT no conectado aún."); 
            return;
        }
        
        // 🧠 EL ARREGLO: Buscamos 'tk' (nueva V22) o 'wk' (vieja V19)
        const token = this.conf.tk || this.conf.wk;
        
        if(!token) { 
            console.error("⚠️ Error crítico: No hay llave de seguridad en this.conf");
            return; 
        }
        
        const comando = String(c).toLowerCase();
        
        // 🛡️ NONCE: Sello de tiempo único para evitar Ataques de Replay
        const nonce = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
        
        // 🛡️ FIRMA: (Comando + Nonce + TokenSecreto) -> SHA256
        const dataToSign = comando + nonce + token;
        const firma = CryptoJS.SHA256(dataToSign).toString(CryptoJS.enc.Hex).substring(0, 16);
        
        const payload = JSON.stringify({ c: comando, n: nonce, f: firma });
        const m = new Paho.MQTT.Message(payload); 
        m.destinationName = this.conf.topic + "comando/" + app; 
        this.mqtt.send(m); 
        
        console.log("🚀 COMANDO ENVIADO A LA PICO ->", m.destinationName, payload);
    }

    async procesarComandoIA() {
        const input = document.getElementById('ai-input');
        const orden = input.value.trim();
        if(!orden) return;

        input.value = ""; // Limpiamos la barra
        this.notificar("Procesando tu orden...", "🧠");
        this.vibra("tick");

        // 🤖 CONEXIÓN AL CEREBRO EXTERNO (Ollama Local API)
        // Está configurado para conectar con tu PC de forma local y gratuita
        try {
            /* // TODO: Descomentar esto cuando instales Ollama en tu PC
            const respuesta = await fetch('http://127.0.0.1:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "llama3", 
                    prompt: `Eres un asistente domótico. Traduce esto a JSON: "${orden}". 
                             Ejemplo: {"Led": "on", "Pomodoro": 25}`,
                    stream: false
                })
            });
            const datos = await respuesta.json();
            const comandos = JSON.parse(datos.response);
            
            // Ejecutar los comandos mágicamente
            for (const [app, accion] of Object.entries(comandos)) {
                this.cmd(app, accion);
            }
            */
            console.log("Comando guardado para la IA:", orden);
            setTimeout(() => this.notificar("IA en espera de conexión local", "⚙️"), 1000);
            
        } catch (error) {
            this.notificar("Error conectando con el Cerebro", "❌");
            console.error(error);
        }
    }
    
    // Función para que las tarjetas publiquen estados fijos
    pub(app, v, r) { 
        if(this.mqtt?.isConnected()) { 
            const m = new Paho.MQTT.Message(String(v)); 
            m.destinationName = this.conf.topic + "estado/" + app; 
            m.retained = r; 
            this.mqtt.send(m); 
        }
    }
    
    toggleEdit() {
        this.editMode = !this.editMode;
        const grid = document.getElementById('dashboard-grid');
        const btn = document.getElementById('btn-edit');
        if(this.editMode) {
            grid.classList.add('edit-mode'); 
            btn.innerHTML = `<i class="fa-solid fa-check" style="color:var(--primary); width:20px"></i> Ok`; 
            this.vibra("tick");
            
            this.sortable = new Sortable(grid, { 
                animation: 250, 
                // 🧠 LA MAGIA: Arrastre instantáneo en PC, pero exige mantener calcado 200ms en móvil
                delay: 200,
                delayOnTouchOnly: true,
                ghostClass: 'sortable-ghost',
                onEnd: ()=>{
                    const order = [];
                    document.querySelectorAll('.card').forEach(c=>order.push(c.dataset.id));
                    localStorage.setItem('gridOrder', JSON.stringify(order));
                    this.vibra("tick");
                }
            });
        } else {
            grid.classList.remove('edit-mode'); 
            btn.innerHTML = `<i class="fa-solid fa-pen" style="width:20px"></i> Editar`; 
            if(this.sortable) this.sortable.destroy();
            this.vibra("doble");
        }
    }
    
    initTheme() { 
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = (isDark) => document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        const saved = localStorage.getItem('theme');
        if (saved) apply(saved === 'dark');
        else apply(systemDark.matches);
        systemDark.addEventListener('change', (e) => { if (!localStorage.getItem('theme')) apply(e.matches); });
    }
    
    toggleTheme() { 
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next); localStorage.setItem('theme',next); 
    }

    // 📳 Motor Háptico
    vibra(tipo = "tick") {
        const sw = document.getElementById('sw-vibration');
        if (!sw || !sw.checked || !navigator.vibrate) return;
        if (tipo === "tick") navigator.vibrate(15);
        if (tipo === "doble") navigator.vibrate([20, 40, 20]);
        if (tipo === "error") navigator.vibrate([50, 50, 50]);
    }

    // 🔔 Notificaciones Toast
    notificar(msg, icon = "✅") {
        const container = document.getElementById('toast-area');
        if(!container) return;
        const t = document.createElement('div');
        t.className = "toast";
        t.innerHTML = `${icon} <span style="margin-left:8px">${msg}</span>`;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3500);
        this.vibra("doble");
    }

    setNetworkStatus(isOnline) {
        if(isOnline) {
            if(this._wasOffline) { 
                this.notificar("Conexión Recuperada", "🌐"); 
                this._wasOffline = false; 
            }
        } else {
            // Solo lanzamos un toast de aviso suave y vibramos, pero la web sigue 100% usable
            this.notificar("Sin conexión al Broker", "⚠️");
            this.vibra("error");
            this._wasOffline = true;
        }
    }

    // ==========================================================
    // 🧪 LABORATORIO DE TECNOLOGÍAS EXPERIMENTALES (Inactivas)
    // ==========================================================

    initProyectosSecretos() {
        // 1. Sonar Ultrasónico (Web Audio API)
        this.config.sonarActivado = false;
        // TODO: Inyectar oscilador a 20kHz y analizar efecto Doppler con el micrófono.

        // 2. Visión Artificial (Webcam AI)
        this.config.webcamAiActivada = false;
        // TODO: Cargar modelo de TensorFlow.js (coco-ssd) en background para detectar "Person".

        // 3. Handoff (Sincronización Multi-pantalla)
        this.config.handoffActivado = false;
        // TODO: Suscribir a un topic oculto "sync/#". Al recibir un cambio de scroll, replicarlo aquí.
    }

    // 4. El "Time-Travel" (Botón Deshacer)
    // Esta función interceptará las órdenes de this.cmd() en el futuro
    ejecutarConDeshacer(app, comando, tiempoGracia = 3000) {
        // Leemos la configuración de la tarjeta. Ejemplo: LedCard.undo = true
        const tarjeta = this.cards.find(c => c.id === app);
        
        if (tarjeta && tarjeta.undo) {
            this.notificar(`Cancelando orden a ${app}...`, "⏳");
            // TODO: Crear toast con botón flotante que destruya el MQTT si se pulsa antes de tiempoGracia
        } else {
            // Si la tarjeta no tiene el Deshacer activado, dispara directo
            this.cmd(app, comando);
        }
    }

    // ==========================================================
    // 🪄 MOTOR DE TECNOLOGÍAS AVANZADAS (V22)
    // ==========================================================

    // 1. ATAJOS DE TECLADO GLOBALES (Mapeo)
    initAtajosTeclado() {
        window.addEventListener('keydown', (e) => {
            // No activar si el usuario está escribiendo en el chat de IA o en un input
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Mapeo por defecto (Esto se podrá personalizar luego en ajustes)
            if(e.key.toLowerCase() === 'l') {
                this.vibra("tick");
                const st = document.getElementById('val-Led')?.innerText;
                if(st) this.ejecutarConDeshacer('Led', st === "ON" ? "off" : "on");
            }
            if(e.key === 'h') this.toggleHUD(); // Activar/Desactivar Consola Hacker
        });
    }

    // 2. CONSOLA HUD (Matrix Mode)
    toggleHUD() {
        let hud = document.getElementById('hud-console');
        if(!hud) {
            // Crear el HUD si no existe
            hud = document.createElement('div');
            hud.id = 'hud-console';
            document.body.appendChild(hud);
            this.logHUD("SISTEMA CIBERFÍSICO V22 INICIADO. INTERCEPTANDO TRÁFICO MQTT...");
        }
        hud.classList.toggle('active');
    }

    logHUD(msg, tipo = "info") {
        const hud = document.getElementById('hud-console');
        if(!hud) return;
        const linea = document.createElement('div');
        linea.className = `hud-msg ${tipo === 'error' ? 'hud-err' : tipo === 'out' ? 'hud-out' : ''}`;
        const timestamp = new Date().toLocaleTimeString();
        linea.innerText = `[${timestamp}] > ${msg}`;
        hud.appendChild(linea);
        hud.scrollTop = hud.scrollHeight; // Auto-scroll
    }

    // 3. PARALLAX 3D (Sensor espacial para tarjetas)
    initParallax() {
        // Para PC (Ratón)
        document.addEventListener('mousemove', (e) => {
            if(this.editMode) return;
            document.querySelectorAll('.card').forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                // Inclinación sutil según la posición del ratón
                card.style.transform = `perspective(1000px) rotateX(${-y / 30}deg) rotateY(${x / 30}deg)`;
            });
        });
        // Para Móvil (Giroscopio)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if(this.editMode) return;
                const tiltX = Math.min(Math.max(e.beta - 45, -20), 20); // Inclinación frontal
                const tiltY = Math.min(Math.max(e.gamma, -20), 20);    // Inclinación lateral
                document.querySelectorAll('.card').forEach(card => {
                    card.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`;
                });
            });
        }
    }

    // 4. TIME-TRAVEL: BOTÓN DESHACER (Red de seguridad)
    ejecutarConDeshacer(app, comando, tiempoGracia = 3000) {
        // Buscar la tarjeta y ver si tiene el 'undo' activado
        const tarjeta = this.cards.find(c => c.id === app);
        
        if (tarjeta && tarjeta.undo) {
            const toastId = Math.random().toString(36).substr(2,9);
            const container = document.getElementById('toast-area');
            const toast = document.createElement('div');
            toast.className = "toast";
            toast.style.position = "relative";
            toast.style.overflow = "hidden";
            
            toast.innerHTML = `
                ⏳ <span style="margin-left:8px">Orden a ${app} en espera...</span>
                <button class="toast-undo-btn" id="undo-${toastId}">DESHACER</button>
                <div class="toast-progress"></div>
            `;
            container.appendChild(toast);

            // Temporizador de la bomba
            const timerId = setTimeout(() => {
                this.cmd(app, comando); // Si pasa el tiempo, enviamos
                toast.remove();
            }, tiempoGracia);

            // Si pulsamos Deshacer
            document.getElementById(`undo-${toastId}`).onclick = () => {
                clearTimeout(timerId); // Desactivamos la bomba
                toast.remove();
                this.notificar(`Acción en ${app} cancelada`, "🛑");
            };
        } else {
            // Si la tarjeta no tiene Deshacer, envía la orden directamente
            this.cmd(app, comando);
        }
    }

    // 5. GESTOS SWIPE (Deslizar para revelar Ajustes/PiP)
    initSwipeGestures() {
        let touchStartX = 0;
        document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            const targetCard = e.target.closest('.card');
            if(!targetCard) return;

            // Deslizar a la izquierda (Revelar overlay)
            if (touchStartX - touchEndX > 50) targetCard.classList.add('swipe-open');
            // Deslizar a la derecha (Ocultar overlay)
            if (touchEndX - touchStartX > 50) targetCard.classList.remove('swipe-open');
        });
    }

    // 6. PICTURE-IN-PICTURE (Ventanas flotantes desacopladas)
    async abrirPiP(app) {
        if (!('documentPictureInPicture' in window)) {
            return this.notificar("Tu navegador no soporta PiP", "❌");
        }
        const tarjeta = this.cards.find(c => c.id === app);
        if(!tarjeta || !tarjeta.pip) return;

        try {
            // Abrimos ventana flotante del sistema operativo
            const pipWindow = await documentPictureInPicture.requestWindow({ width: 250, height: 250 });
            
            // Inyectamos el CSS principal
            const style = document.createElement('style');
            style.textContent = `
                body { background: #1c1c1e; color: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif; height: 100vh; margin: 0; }
                .val-text { font-size: 3rem; font-weight: bold; }
            `;
            pipWindow.document.head.appendChild(style);
            
            // Inyectamos una versión mini de la tarjeta
            pipWindow.document.body.innerHTML = `
                <div style="text-align:center">
                    <div style="color:#8e8e93">${app.toUpperCase()}</div>
                    <div class="val-text" id="pip-val">...</div>
                </div>
            `;
            
            // Escuchamos el MQTT para actualizar la ventana flotante en tiempo real
            this.notificar(`${app} extraído a PiP`, "🪟");
        } catch(e) {
            console.error(e);
        }
    }

    // ==========================================================
    // 🚀 MÓDULOS DE GRADO INDUSTRIAL (Menú Lateral)
    // ==========================================================

    initSidebar() {
        const trigger = document.querySelector('.pico-os-title');
        const menu = document.getElementById('side-menu');

        // UNIFICADO: PC y Móvil abren al hacer clic
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
            this.vibra("tick");
        });

        // Cerrar al hacer clic en cualquier parte fuera del menú
        document.addEventListener('click', (e) => {
            if(!menu.contains(e.target) && !trigger.contains(e.target)) {
                menu.classList.remove('open');
            }
        });

        // Eventos de los botones del menú lateral
        document.getElementById('btn-nav-plano').onclick = () => { document.getElementById('plano-view').style.display = 'flex'; menu.classList.remove('open'); };
        document.getElementById('btn-nav-macros').onclick = () => { document.getElementById('macros-view').style.display = 'flex'; menu.classList.remove('open'); };
        document.getElementById('btn-nav-nfc').onclick = () => this.leerNFC();
        document.getElementById('btn-nav-radar').onclick = () => this.iniciarRadarBluetooth();
    }

    // --- FUNCIÓN 1: PRESENCIA MULTIJUGADOR ---
    initMultijugador() {
        // En un entorno real, suscribiríamos a "PicoWESP.../presencia/#"
        // Simulamos que otro usuario (ej. tu móvil) toca la tarjeta "Calculadora"
        // TODO: Conectar esto al onMessageArrived real
        window.simularPresencia = (appId) => {
            const card = document.getElementById(`card-${appId}`);
            if(!card) return;
            card.classList.add('multiplayer-active');
            this.notificar(`Otro usuario está usando ${appId}`, "👥");
            setTimeout(() => card.classList.remove('multiplayer-active'), 3000);
        };
    }

    // --- FUNCIÓN 2: LECTOR DE ETIQUETAS NFC ---
    async leerNFC() {
        if (!("NDEFReader" in window)) {
            return this.notificar("Tu dispositivo no tiene chip NFC o no es compatible (usa Chrome en Android)", "❌");
        }
        try {
            const ndef = new NDEFReader();
            await ndef.scan();
            this.notificar("Acerca el móvil a una etiqueta NFC...", "📡");
            this.vibra("doble");
            
            ndef.addEventListener("reading", ({ message, serialNumber }) => {
                this.vibra("tick");
                this.notificar(`Etiqueta NFC detectada: ${serialNumber}`, "✅");
                // Aquí podrías disparar una Macro. Ej: si serial == '12:34:56', apaga la luz.
                this.logHUD(`Lectura NFC: ${serialNumber}`);
            });
        } catch (error) {
            this.notificar("Error al encender el lector NFC", "❌");
            console.error(error);
        }
    }

    // --- FUNCIÓN 3: RADAR DE PROXIMIDAD BLUETOOTH ---
    async iniciarRadarBluetooth() {
        if (!navigator.bluetooth) {
            return this.notificar("Bluetooth Web no soportado en este navegador", "❌");
        }
        try {
            this.notificar("Escaneando balizas cercanas...", "🔎");
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true
            });
            this.vibra("tick");
            this.notificar(`Dispositivo detectado: ${device.name || 'Desconocido'}`, "✅");
            // TODO: Leer el RSSI (Fuerza de señal) continuamente para calcular la distancia.
        } catch(e) {
            // El usuario canceló o hubo un error
            console.log("Radar Bluetooth cancelado");
        }
    }

    // ==========================================================
    // 🧠 LOGICA DE PLANOS Y MACROS
    // ==========================================================

    initModosExpertos() {
        this.initPlanoDraggable();
        this.initGestorMacros();
    }

    // Lógica para arrastrar los pines libremente por el plano
    initPlanoDraggable() {
        const workspace = document.getElementById('plano-workspace');
        if(!workspace) return;
        
        let draggedElement = null;
        let offsetX = 0, offsetY = 0;

        const startDrag = (e) => {
            if (!e.target.classList.contains('plano-pin')) return;
            draggedElement = e.target;
            
            // Soporte para ratón y táctil
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const rect = draggedElement.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
        };

        const onDrag = (e) => {
            if (!draggedElement) return;
            e.preventDefault(); // Evita scroll en móviles al arrastrar
            
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const workspaceRect = workspace.getBoundingClientRect();
            
            // Calculamos nueva posición relativa al área de trabajo
            let newLeft = clientX - workspaceRect.left - offsetX;
            let newTop = clientY - workspaceRect.top - offsetY;

            // Límites para que no se salgan de la pantalla
            newLeft = Math.max(0, Math.min(newLeft, workspaceRect.width - draggedElement.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, workspaceRect.height - draggedElement.offsetHeight));

            // Aplicamos posición en porcentajes para que sea responsive al girar el móvil
            draggedElement.style.left = `${(newLeft / workspaceRect.width) * 100}%`;
            draggedElement.style.top = `${(newTop / workspaceRect.height) * 100}%`;
        };

        const endDrag = () => {
            if(draggedElement) {
                this.vibra("tick");
                // TODO: Aquí guardaríamos draggedElement.style.left/top en el localStorage
                draggedElement = null;
            }
        };

        workspace.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', endDrag);

        workspace.addEventListener('touchstart', startDrag, {passive: false});
        document.addEventListener('touchmove', onDrag, {passive: false});
        document.addEventListener('touchend', endDrag);
    }

    // Lógica visual para añadir Macros a la lista
    initGestorMacros() {
        const btnSave = document.getElementById('btn-save-macro');
        const list = document.getElementById('macro-list');
        if(!btnSave || !list) return;

        btnSave.onclick = () => {
            const cond = document.getElementById('macro-if');
            const acc = document.getElementById('macro-then');
            
            // Limpiar mensaje de "vacío" si es la primera
            if(list.innerHTML.includes("No hay reglas")) list.innerHTML = "";

            const li = document.createElement('li');
            li.className = "macro-item cascade-in";
            li.innerHTML = `
                <div>
                    <span style="font-weight:bold; color:var(--text-main)">SI</span> ${cond.options[cond.selectedIndex].text} <br>
                    <span style="font-weight:bold; color:var(--primary)">ENTONCES</span> ${acc.options[acc.selectedIndex].text}
                </div>
                <button class="btn-del" onclick="this.parentElement.remove(); window.App.vibra('doble');"><i class="fa-solid fa-trash"></i></button>
            `;
            list.appendChild(li);
            this.vibra("tick");
            this.notificar("Regla guardada en local", "⚙️");
        };
    }
}
