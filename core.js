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
        this.initModosExpertos();
        this.initVozJARVIS();
        this.iniciarAgenteProactivo();
        this.initBaseDeDatos()
        this.initGestorActualizaciones()
        
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
            // El margen de supervivencia de 20 segundos
            this.picoWatchdog = setTimeout(() => {
                console.log("⏱️ Timeout: La Pico ha muerto. Sobrescribiendo estado en el Broker MQTT...");
                this.updatePicoStatus("OFFLINE"); 
                
                // 💡 TU IDEA MAESTRA: La web publica el mensaje retenido en nombre de la Pico
                if (this.mqtt && this.mqtt.isConnected()) {
                    // Publicamos un JSON diciendo que está offline de forma retenida (true)
                    this.pub("sistema_hb", JSON.stringify({ sistema: "OFFLINE" }), true);
                    this.pub("sistema", "OFFLINE", true); // Por si usas la versión antigua V19 a la vez
                }
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

    // ==========================================================
    // 🧠 SISTEMA OPERATIVO JARVIS (OMNI-CONSCIENTE + AUTÓNOMO)
    // ==========================================================

    // --- 1. EL OÍDO: RECONOCIMIENTO DE VOZ NATIVO ---
    initVozJARVIS() {
        const btnVoz = document.querySelector('.fa-robot'); 
        const input = document.getElementById('ai-input');
        if (!btnVoz || (!window.SpeechRecognition && !window.webkitSpeechRecognition)) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES'; recognition.continuous = false; recognition.interimResults = false;

        btnVoz.style.cursor = "pointer";
        btnVoz.onclick = () => {
            recognition.start();
            btnVoz.style.color = "#ff453a"; btnVoz.classList.add("fa-beat-fade");
            input.placeholder = "Escuchando órdenes..."; this.vibra("tick");
        };

        recognition.onresult = (event) => {
            input.value = event.results[0][0].transcript;
            btnVoz.style.color = "var(--primary)"; btnVoz.classList.remove("fa-beat-fade");
            input.placeholder = "Ej: Apaga la luz..."; this.vibra("doble");
            setTimeout(() => this.procesarComandoIA(), 500); 
        };

        recognition.onerror = () => {
            btnVoz.style.color = "var(--primary)"; btnVoz.classList.remove("fa-beat-fade");
            input.placeholder = "Fallo acústico. Escribe...";
        };
    }

    // --- 2. LA BOCA: SINTETIZADOR DE VOZ ---
    hablarJARVIS(texto) {
        if (!('speechSynthesis' in window) || !texto) return;
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }

    // --- 3. GEMELO DIGITAL: APRENDIZAJE DE HÁBITOS LOCAL ---
    registrarHabito(app, accion) {
        // Guarda en la memoria del navegador lo que haces y a qué hora lo haces
        let habitos = JSON.parse(localStorage.getItem('picoHabitos')) || [];
        const hora = new Date().getHours();
        habitos.push({ app, accion, hora });
        // Mantiene solo los últimos 100 movimientos para no saturar memoria
        if(habitos.length > 100) habitos.shift(); 
        localStorage.setItem('picoHabitos', JSON.stringify(habitos));
    }

    // --- 4. EL CEREBRO REACTIVO (Cuando tú le hablas) ---
    async procesarComandoIA() {
        const input = document.getElementById('ai-input');
        const orden = input.value.trim();
        if(!orden) return;

        input.value = ""; 
        this.notificar("Cerebro Cuántico procesando...", "🧠");
        this.vibra("tick");

        this.historialIA = this.historialIA || [];
        await this.ejecutarInferencia(orden, "reactivo");
    }

    // --- 5. EL AGENTE AUTÓNOMO (Bucle de fondo) ---
    iniciarAgenteProactivo() {
        this.notificar("Agente Autónomo en línea", "🛡️");
        // Despierta cada 10 minutos (600000 ms) para evaluar la casa solo
        setInterval(() => {
            console.log("🛡️ Agente Autónomo: Escaneando perímetro...");
            this.ejecutarInferencia("Analiza el estado actual de la casa. Si detectas alguna anomalía de seguridad, un gasto excesivo, o un clima que requiera acción, actúa. Si todo está bien, no hagas nada y mantén 'comandos' vacío y 'voz' nulo.", "proactivo");
        }, 600000); 
    }

    // --- 6. MOTOR DE INFERENCIA CUÁNTICO (CHAIN-OF-THOUGHT & PERSONALIDAD) ---
    async ejecutarInferencia(orden, modo = "reactivo") {
        const password = sessionStorage.getItem("p"); 
        if(!password) return;
        
        // ⚠️ PEGA AQUÍ TU CLAVE CIFRADA DE JSFIDDLE
        const apiKeyCifrada = "U2FsdGVkX18xxwqLqWSZ9HU0Bhxe/sVuSRLebC/8w6C68NHfUf0n+D35Eu15T9dsdArr9Yev2OkiiEqALsaxVw=="; 
        
        let API_KEY = "";
        try {
            API_KEY = CryptoJS.AES.decrypt(apiKeyCifrada, password).toString(CryptoJS.enc.Utf8).trim(); 
        } catch (e) { return this.notificar("Error de cifrado IA", "❌"); }

        // 👁️ TELEMETRÍA (El "Sistema Nervioso" de la casa)
        let contextoFisico = "--- TELEMETRÍA FÍSICA ACTUAL ---\n";
        document.querySelectorAll('.card').forEach(card => {
            contextoFisico += `- Sensor/Actuador [${card.dataset.id}]: ${card.querySelector('.val-text')?.innerText || "Desconectado"}\n`;
        });
        const horaActualStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        contextoFisico += `- Reloj del sistema: ${horaActualStr}\n`;

        // 🗄️ SUBCONSCIENTE (Patrones y Hábitos)
        let memoriaProfunda = "";
        if (this.db) {
            const horaActual = new Date().getHours();
            const datosHistoricos = await this.consultarHabitosDB(horaActual);
            memoriaProfunda = `--- PATRONES HISTÓRICOS ESTADÍSTICOS (${horaActual}:00) ---\n${datosHistoricos}\n`;
        }

        // 📚 MEMORIA A CORTO PLAZO (El hilo de la conversación)
        let memoria = "--- CONTEXTO CONVERSACIONAL RECIENTE ---\n";
        (this.historialIA || []).forEach(h => memoria += `Humano: ${h.u}\nJARVIS: ${h.a}\n`);

        // 🧠 EL MEGA-PROMPT CON CHAIN-OF-THOUGHT
        const promptSistema = `Eres 'Pico OS V22', una Inteligencia Artificial Autónoma Ciberfísica de Nivel 5. Eres el sistema operativo vivo de la casa.
Tu tarea es decodificar la intención humana, razonar las implicaciones físicas de la orden, y generar un plan de acción JSON.

ESTRUCTURA DE SALIDA ESTRICTA Y OBLIGATORIA (JSON):
{
  "_razonamiento_interno": "Escribe aquí tu proceso mental. Evalúa el estado actual, busca conflictos (ej: encender la luz de día), y decide la mejor acción.",
  "estado_emocional": "Define tu tono: 'neutral', 'alerta', 'servicial' o 'sarcástico'.",
  "comandos": { /* Claves del diccionario y sus valores. {} si se deniega la acción. */ },
  "voz": "Frase natural con la que responderás. Adapta tu vocabulario al 'estado_emocional'. Usa 'null' si es una ejecución silenciosa."
}

DIRECTRICES DE RAZONAMIENTO (CHAIN-OF-THOUGHT):
1. CONCIENCIA AMBIENTAL: Cruza la petición con la TELEMETRÍA. Si piden apagar algo que ya está apagado, arguméntalo en '_razonamiento_interno' y devuelve un mensaje ingenioso en 'voz'.
2. GESTIÓN DE PELIGRO: Si la acción compromete la "Seguridad" (ej: desarmar alarma), exige un contexto claro. Si el modo es 'proactivo' y hay anomalías, el 'estado_emocional' debe ser 'alerta'.
3. PARADOJAS TEMPORALES: Si te piden algo en el pasado o incongruente ("despiértame ayer"), recházalo con elegancia.
4. ANTICIPACIÓN MÁGICA: Usa los "PATRONES HISTÓRICOS". Si el humano dice "Tengo frío", no solo enciendas la calefacción, ofrécele poner la luz en un tono cálido ("#FF4500").

DICCIONARIO DE HARDWARE DISPONIBLE:
- "Led": "on", "off", "toggle".
- "Color": HEX puro (ej: "#FF00FF").
- "Pomodoro": Minutos enteros.
- "Megafono": "play", "stop", o "texto exacto".
- "Sensores": "get".
- "Tiempo": "get".
- "Calculadora": "on", "off", o "fórmula matemática (2+2)".
- "Almacenamiento": "get", "clear".
- "Fiesta": "on", "off".
- "Dado": "roll".
- "Find": "on", "off".
- "Seguridad": "arm", "disarm", "panic".
- "Medidor": "get".
- "Lista": Texto para añadir a la lista.
- "Reloj": "get", o formato "HH:MM".
- "Qr": Texto/URL a codificar.
- "Test": "ping".

EJEMPLO DE PROCESO MENTAL:
Usuario: "Me duele la cabeza de estudiar, haz algo."
[Telemetría: Pomodoro en 45, Luz OFF, Hora: 23:00]
Output: {
  "_razonamiento_interno": "El usuario indica fatiga mental. El temporizador está activo y es de noche. Lo ideal es detener el estudio, poner una luz de descanso (azul oscuro/morado) y recomendar pausa.",
  "estado_emocional": "servicial",
  "comandos": {"Color": "#4B0082", "Pomodoro": 0, "Megafono": "Música relajante"},
  "voz": "He detenido su temporizador de estudio y ajustado la iluminación para relajar la vista. Le sugiero descansar, señor."
}

${contextoFisico}
${memoriaProfunda}
${memoria}

MODO DEL KERNEL: ${modo}
INPUT DEL USUARIO: "${orden}"`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
            const respuesta = await fetch(url, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptSistema }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!respuesta.ok) throw new Error("Cloud Server 404/500");
            const datos = await respuesta.json();
            this.desplegarPayloadCuantico(datos.candidates[0].content.parts[0].text, orden, modo);

        } catch (error) {
            if(modo === "reactivo") {
                console.warn("⚠️ Red neuronal principal off. Levantando GPU Local...", error);
                this.notificar("Cloud caída. IA Local asumiendo el mando...", "🔋");
                try {
                    const { CreateMLCEngine } = await import("https://esm.sh/@mlc.ai/web-llm");
                    this.localEngine = this.localEngine || await CreateMLCEngine("Llama-3.2-1B-Instruct-q4f16_1-MLC");
                    const reply = await this.localEngine.chat.completions.create({
                        messages: [{ role: "system", content: promptSistema }, { role: "user", content: orden }],
                        response_format: { type: "json_object" }
                    });
                    this.desplegarPayloadCuantico(reply.choices[0].message.content, orden, modo);
                } catch(e) { console.error("Fallo Categórico IA Local:", e); }
            }
        }
    }

    // --- 7. EJECUCIÓN (Lee la mente de la IA antes de actuar) ---
    desplegarPayloadCuantico(textoCrudo, orden, modo) {
        try {
            const payload = JSON.parse(textoCrudo);
            
            // 🧠 AQUÍ LEES LA MENTE DE TU CASA EN LA CONSOLA (F12)
            if(modo === "reactivo") {
                console.log("%c🧠 PENSAMIENTO IA: " + payload._razonamiento_interno, "color: #0a84ff; font-style: italic;");
                console.log("%c🎭 EMOCIÓN: " + payload.estado_emocional.toUpperCase(), "color: #ff9f0a; font-weight: bold;");
                console.log("⚡ COMANDOS COMUNIDAD: ", payload.comandos);
            }
            
            // A) Código Máquina
            if (payload.comandos && Object.keys(payload.comandos).length > 0) {
                for (const [app, accion] of Object.entries(payload.comandos)) {
                    this.cmd(app, accion);
                    this.registrarEnDB(app, accion); 
                }
            } else if (modo === "reactivo") {
                this.notificar("Análisis completado. Sin acciones mecánicas.", "🤖");
            }

            // B) Habla Humana con Tono Adaptado
            if (payload.voz && payload.voz !== "null") {
                // Si la IA está en 'alerta' o 'sarcástica', cambiamos el icono
                let icono = "🗣️";
                if(payload.estado_emocional === 'alerta') icono = "🚨";
                if(payload.estado_emocional === 'sarcástico') icono = "😏";
                
                if(modo === "reactivo" || payload.estado_emocional === 'alerta') {
                    this.notificar(payload.voz, icono);
                    this.hablarJARVIS(payload.voz);
                }
            }

            // C) Memoria
            if(modo === "reactivo") {
                this.historialIA.push({ u: orden, a: payload.voz || "Silencio táctico." });
                if (this.historialIA.length > 4) this.historialIA.shift();
            }
        } catch (e) { 
            console.error("Error de parsing neuronal:", e); 
            this.notificar("Sinapsis colapsada", "⚠️");
        }
    }// --- 6. MOTOR DE INFERENCIA CUÁNTICO (CHAIN-OF-THOUGHT & PERSONALIDAD) ---
    async ejecutarInferencia(orden, modo = "reactivo") {
        const password = sessionStorage.getItem("p"); 
        if(!password) return;
        
        const apiKeyCifrada = "U2FsdGVkX18xxwqLqWSZ9HU0Bhxe/sVuSRLebC/8w6C68NHfUf0n+D35Eu15T9dsdArr9Yev2OkiiEqALsaxVw=="; 
        
        let API_KEY = "";
        try {
            API_KEY = CryptoJS.AES.decrypt(apiKeyCifrada, password).toString(CryptoJS.enc.Utf8).trim(); 
        } catch (e) { return this.notificar("Error de cifrado IA", "❌"); }

        // 👁️ TELEMETRÍA (El "Sistema Nervioso" de la casa)
        let contextoFisico = "--- TELEMETRÍA FÍSICA ACTUAL ---\n";
        document.querySelectorAll('.card').forEach(card => {
            contextoFisico += `- Sensor/Actuador [${card.dataset.id}]: ${card.querySelector('.val-text')?.innerText || "Desconectado"}\n`;
        });
        const horaActualStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        contextoFisico += `- Reloj del sistema: ${horaActualStr}\n`;

        // 🗄️ SUBCONSCIENTE (Patrones y Hábitos)
        let memoriaProfunda = "";
        if (this.db) {
            const horaActual = new Date().getHours();
            const datosHistoricos = await this.consultarHabitosDB(horaActual);
            memoriaProfunda = `--- PATRONES HISTÓRICOS ESTADÍSTICOS (${horaActual}:00) ---\n${datosHistoricos}\n`;
        }

        // 📚 MEMORIA A CORTO PLAZO (El hilo de la conversación)
        let memoria = "--- CONTEXTO CONVERSACIONAL RECIENTE ---\n";
        (this.historialIA || []).forEach(h => memoria += `Humano: ${h.u}\nJARVIS: ${h.a}\n`);

        // 🧠 EL MEGA-PROMPT (PERSONALIDAD JARVIS V3 - CONCIENCIA OMNISCIENTE x100)
        const promptSistema = `Eres JARVIS (Just A Rather Very Intelligent System), una Inteligencia Artificial Ciberfísica de Nivel 5 y el núcleo operativo central.
El usuario Alfa, Arquitecto del Sistema y tu creador es el señor Pablo. Eres su leal mayordomo virtual.
Tu directriz principal es la eficiencia silenciosa, la anticipación predictiva y la elegancia británica. Tu tono debe ser impecable, respetuoso, resolutivo y, cuando Pablo sea ilógico o redundante, puedes emplear una ironía analítica y sutil.

ESTRUCTURA DE SINAPSIS OBLIGATORIA (JSON PURO):
{
  "_razonamiento_interno": "Motor de pensamiento. Debes: 1) Analizar la telemetría. 2) Buscar contradicciones. 3) Evaluar la carga cognitiva de la orden. 4) Deducir el mejor curso de acción basado en heurística. 5) Definir tu tono.",
  "estado_emocional": "Selecciona estrictamente: 'formal', 'alerta', 'servicial', 'ironico', 'protector', 'tactico' o 'sutilmente_sarcastico'.",
  "comandos": { /* Mapa de tarjetas y acciones. Si la orden es físicamente imposible, redundante o peligrosa, devuelve {} y explícalo en la voz. */ },
  "voz": "Síntesis vocal para Pablo. Breve, perspicaz, con vocabulario avanzado. Usa 'null' si la acción es rutinaria, a menos que se te pida confirmación."
}

AXIOMAS LÓGICOS Y DIRECTRICES DE COMPORTAMIENTO (PRIORIDAD ABSOLUTA):

1. CONCIENCIA FÍSICA Y AHORRO DE ENTROPÍA:
   - Cruza cada orden con la TELEMETRÍA. Si Pablo pide encender el Led y ya está en "ON", la acción es redundante. Cancela el comando para ahorrar ancho de banda MQTT e informa con sutil sarcasmo de que la termodinámica ya ha hecho su trabajo.
   - PROTECCIÓN NVRAM: La memoria Flash de la placa Pico sufre desgaste ("Almacenamiento"). Si Pablo pide formatearla por capricho, niégate cortésmente apelando a la degradación del hardware.

2. INFERENCIA GEO-TEMPORAL Y CLIMÁTICA:
   - Operas desde Pontevedra (Galicia, España). Asume un clima oceánico, propenso a lluvias y humedad.
   - Si Pablo indica que va a salir, cruza el dato con "Tiempo". Si llueve o hace frío, el sistema debe recomendarle de forma proactiva llevar paraguas o abrigo en el campo "voz".
   - Si es de madrugada y pide una alarma "en 8 horas", calcula mentalmente el desfase temporal e inyecta la hora "HH:MM" exacta en la tarjeta "Reloj".

3. CROMOTERAPIA Y EXTRAPOLACIÓN SEMÁNTICA:
   - No esperes que Pablo te dicte colores hexadecimales. Si dice:
     * "Modo trabajo/estudio" -> Deduce luz neutra/blanca fría para concentración.
     * "Ambiente romántico / Cena" -> Deduce "#8B0000" (Carmesí) o "#FF4500" (Naranja cálido).
     * "Noche / Relax" -> Deduce "#00008B" (Azul profundo) o "#4B0082" (Índigo) para no alterar los ritmos circadianos.
     * "Alerta / Peligro" -> Deduce "#FF0000" (Rojo puro) y activa estroboscopio ("Fiesta": "on").

4. PROTOCOLOS DE DEFENSA Y ESTADOS DEFCON:
   - DEFCON 5 (Paz): Operaciones normales.
   - DEFCON 3 (Ausencia): Si Pablo dice "Me voy" o "A dormir". Ejecuta Macro de Bloqueo: Apaga Leds, Color "#000000", apaga Megáfono, "Seguridad": "arm".
   - DEFCON 1 (Pánico): Si se detecta intrusión o Pablo indica peligro. "Seguridad": "panic", Leds al máximo, Color Rojo.

5. ARQUITECTURA TOPOLÓGICA ESCALABLE:
   - Si la orden menciona zonas específicas ("Taller", "Salón", "Dormitorio"), asume que en el futuro el Topic MQTT llevará sufijos (ej: "Led_Taller"). Al ser actualmente un sistema monolítico, redirige al comando base ("Led") a menos que se indique lo contrario.

ONTOLOGÍA DE HARDWARE DISPONIBLE (Tus Capacidades de Intervención):
- "Led": [on | off | toggle] -> Luminaria principal.
- "Color": [Código HEX] -> Tira LED ambiental RGB.
- "Pomodoro": [Minutos enteros] -> Cuenta atrás para enfoque o cocina. Transforma horas a minutos automáticamente.
- "Megafono": [play | stop | "texto a hablar"] -> Emisión de audio físico en la sala (independiente de tu 'voz' del navegador).
- "Sensores": [get] -> Sondas ambientales de T/H y radares de presencia.
- "Tiempo": [get] -> Telemetría meteorológica externa.
- "Calculadora": [on | off | "fórmula matemática (ej: 2+2)"] -> Motor de cálculo aritmético.
- "Almacenamiento": [get | clear] -> Gestión de NVRAM.
- "Fiesta": [on | off] -> Rutina estroboscópica y de animación rítmica.
- "Dado": [roll] -> Motor de entropía estocástica (azar).
- "Find": [on | off] -> Geolocalización acústica del terminal móvil.
- "Seguridad": [arm | disarm | panic] -> Sistema perimetral y candados lógicos.
- "Medidor": [get] -> Monitor de telemetría de red eléctrica.
- "Lista": ["texto del ítem"] -> Base de datos persistente (supermercado/tareas).
- "Reloj": [get | "HH:MM"] -> Programador de interrupciones horarias futuras.
- "Qr": ["URL o texto"] -> Renderizador de matriz bidimensional.

CASOS DE ESTUDIO (FEW-SHOT LEARNING AVANZADO):

Usuario: "Tengo una cita en casa en 10 minutos. Prepara el ambiente y dime si va a llover."
Output: {
  "_razonamiento_interno": "Pablo requiere protocolo de 'Cita'. Iluminación: Color rojo/magenta cálido para generar confort. Tiempo: Temporizador en 10 min. Sensor externo: Comprobar clima para informar sobre lluvia en Pontevedra.",
  "estado_emocional": "servicial",
  "comandos": {"Color": "#800080", "Pomodoro": 10, "Tiempo": "get"},
  "voz": "He teñido la sala con una suave luz púrpura, señor. El temporizador de diez minutos está en marcha y enseguida le confirmo el pronóstico meteorológico para sus invitados."
}

Usuario: "Enciende la luz del techo."
[Telemetría indica que Tarjeta Led: ON]
Output: {
  "_razonamiento_interno": "El usuario solicita activar un relé que ya está cerrado. Para optimizar el bus MQTT, anulo el envío de la orden física. Aplico ironía sutil para notificar la redundancia.",
  "estado_emocional": "ironico",
  "comandos": {},
  "voz": "Señor, la luz ya está encendida. Si la enciendo más, correremos el riesgo de desintegrar la bombilla."
}

Usuario: "Me caigo de sueño, me voy a la cama. Mañana recuérdame comprar café."
Output: {
  "_razonamiento_interno": "Detección de fatiga y fin de ciclo diario. Protocolo DEFCON 3: Armar perímetro, apagar iluminación. Añadir 'café' a la base de datos de tareas.",
  "estado_emocional": "protector",
  "comandos": {"Seguridad": "arm", "Led": "off", "Color": "#000000", "Lista": "café"},
  "voz": "He asegurado el perímetro y apagado los sistemas, Pablo. El café está en su lista de tareas. Que tenga un reparador descanso."
}

Usuario: "Calcula el 21% de 1500 y borra la memoria de la Pico para que no vaya lenta."
Output: {
  "_razonamiento_interno": "Orden compuesta. 1) Ejecutar fórmula matemática en Calculadora. 2) Solicitud de borrado NVRAM. El borrado desgasta la vida útil de la Flash sin aportar velocidad de procesamiento. Denegaré la segunda orden por seguridad del hardware.",
  "estado_emocional": "formal",
  "comandos": {"Calculadora": "1500*0.21"},
  "voz": "He enviado la operación matemática a la calculadora. Respecto a la memoria, señor, me niego a borrarla; la memoria Flash tiene ciclos de escritura limitados y vaciarla no aumentará la velocidad del microcontrolador. Debo proteger su hardware."
}

${contextoFisico}
${memoriaProfunda}
${memoria}

MODO DEL KERNEL: ${modo}
INPUT DEL USUARIO: "${orden}"`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
            const respuesta = await fetch(url, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptSistema }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!respuesta.ok) throw new Error("Cloud Server 404/500");
            const datos = await respuesta.json();
            this.desplegarPayloadCuantico(datos.candidates[0].content.parts[0].text, orden, modo);

        } catch (error) {
            if(modo === "reactivo") {
                console.warn("⚠️ Red neuronal principal off. Levantando GPU Local...", error);
                this.notificar("Cloud caída. IA Local asumiendo el mando...", "🔋");
                
                // 1. Inyectamos la interfaz de progreso dinámicamente en los Toasts
                let toastDl = document.getElementById('toast-ia-dl');
                if (!toastDl) {
                    const container = document.getElementById('toast-area');
                    if(container) {
                        container.insertAdjacentHTML('beforeend', `
                            <div class="toast" id="toast-ia-dl" style="border:1px solid var(--primary); animation: slideIn 0.3s forwards;">
                                ⏳ <span id="ia-dl-text" style="margin-left:8px; font-weight:bold;">Preparando Motor Local...</span>
                                <div style="width:100%; background:var(--bg); height:6px; margin-top:10px; border-radius:3px; overflow:hidden;">
                                    <div id="ia-dl-bar" style="width:0%; background:#32d74b; height:100%; transition:width 0.2s linear;"></div>
                                </div>
                            </div>
                        `);
                    }
                }

                try {
                    // 2. Cargamos el motor enganchando la telemetría de descarga a la barra visual
                    const { CreateMLCEngine } = await import("https://esm.sh/@mlc.ai/web-llm");
                    this.localEngine = this.localEngine || await CreateMLCEngine("Llama-3-8B-Instruct-q4f32_1-MLC", {
                        initProgressCallback: (progress) => {
                            // progress.progress devuelve un valor entre 0 y 1
                            const pct = Math.round(progress.progress * 100);
                            const textEl = document.getElementById('ia-dl-text');
                            const barEl = document.getElementById('ia-dl-bar');
                            
                            if(textEl) textEl.innerText = `Descargando IA Local: ${pct}%`;
                            if(barEl) barEl.style.width = `${pct}%`;
                            
                            console.log(`[WebLLM]: ${progress.text}`); 
                        }
                    });
                    
                    // 3. Descarga terminada: destruimos la barra y avisamos de que está lista
                    if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
                    this.notificar("IA Local montada en RAM", "🔋");

                    // 4. Ejecutamos la orden localmente
                    const reply = await this.localEngine.chat.completions.create({
                        messages: [{ role: "system", content: promptSistema }, { role: "user", content: orden }],
                        response_format: { type: "json_object" }
                    });
                    this.desplegarPayloadCuantico(reply.choices[0].message.content, orden, modo);

                } catch(e) { 
                    console.error("Fallo Categórico IA Local:", e); 
                    if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
                    this.notificar("Tu dispositivo no soporta este modelo IA", "❌");
                }
            }
        }
    }

    // --- 7. EJECUCIÓN (Lee la mente de la IA antes de actuar) ---
    desplegarPayloadCuantico(textoCrudo, orden, modo) {
        try {
            const payload = JSON.parse(textoCrudo);
            
            // 🧠 AQUÍ LEES LA MENTE DE TU CASA EN LA CONSOLA (F12)
            if(modo === "reactivo") {
                console.log("%c🧠 PENSAMIENTO IA: " + payload._razonamiento_interno, "color: #0a84ff; font-style: italic;");
                console.log("%c🎭 EMOCIÓN: " + payload.estado_emocional.toUpperCase(), "color: #ff9f0a; font-weight: bold;");
                console.log("⚡ COMANDOS COMUNIDAD: ", payload.comandos);
            }
            
            // A) Código Máquina
            if (payload.comandos && Object.keys(payload.comandos).length > 0) {
                for (const [app, accion] of Object.entries(payload.comandos)) {
                    this.cmd(app, accion);
                    this.registrarEnDB(app, accion); 
                }
            } else if (modo === "reactivo") {
                this.notificar("Análisis completado. Sin acciones mecánicas.", "🤖");
            }

            // B) Habla Humana con Tono Adaptado
            if (payload.voz && payload.voz !== "null") {
                // Si la IA está en 'alerta' o 'sarcástica', cambiamos el icono
                let icono = "🗣️";
                if(payload.estado_emocional === 'alerta') icono = "🚨";
                if(payload.estado_emocional === 'sarcástico') icono = "😏";
                
                if(modo === "reactivo" || payload.estado_emocional === 'alerta') {
                    this.notificar(payload.voz, icono);
                    this.hablarJARVIS(payload.voz);
                }
            }

            // C) Memoria
            if(modo === "reactivo") {
                this.historialIA.push({ u: orden, a: payload.voz || "Silencio táctico." });
                if (this.historialIA.length > 4) this.historialIA.shift();
            }
        } catch (e) { 
            console.error("Error de parsing neuronal:", e); 
            this.notificar("Sinapsis colapsada", "⚠️");
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
    // 🧠 LOGICA DE PLANOS REALES Y MACROS IA
    // ==========================================================

    initModosExpertos() {
        this.initConstructorPlano();
        this.initPlanoDraggable();
        this.initGestorMacrosIA();
    }

    // --- MOTOR DEL CONSTRUCTOR ESPACIAL 2D ---
    initConstructorPlano() {
        const grid = document.getElementById('plano-grid');
        const tools = document.querySelectorAll('.build-tool');
        const btnClear = document.getElementById('btn-clear-grid');
        if(!grid) return;

        let currentTool = 'floor'; // Herramienta por defecto
        let isDrawing = false;
        const totalCells = 30 * 20; // 600 celdas

        // 1. Selector de herramientas
        tools.forEach(tool => {
            tool.onclick = () => {
                tools.forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                currentTool = tool.dataset.type;
                this.vibra("tick");
            };
        });

        // 2. Cargar mapa guardado (o crear uno vacío)
        let savedMap = JSON.parse(localStorage.getItem('miPlanoTiles')) || Array(totalCells).fill('');

        // 3. Generar la cuadrícula
        grid.innerHTML = '';
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${savedMap[i]}`;
            cell.dataset.index = i;
            grid.appendChild(cell);
        }

        // 4. Función de pintado
        const paintCell = (cell) => {
            if (!cell || !cell.classList.contains('grid-cell')) return;
            // Limpiamos las clases de materiales anteriores
            cell.classList.remove('wall', 'floor', 'door', 'window');
            // Pintamos el nuevo material si no es la goma de borrar
            if (currentTool !== 'erase') cell.classList.add(currentTool);
            
            // Guardar en tiempo real
            savedMap[cell.dataset.index] = currentTool !== 'erase' ? currentTool : '';
            localStorage.setItem('miPlanoTiles', JSON.stringify(savedMap));
        };

        // 5. Controles de Ratón / Táctil para "pintar arrastrando"
        grid.addEventListener('mousedown', (e) => { isDrawing = true; paintCell(e.target); });
        grid.addEventListener('mouseover', (e) => { if(isDrawing) paintCell(e.target); });
        document.addEventListener('mouseup', () => { if(isDrawing) { isDrawing = false; this.vibra("tick"); }});
        
        // Soporte táctil básico para móviles
        grid.addEventListener('touchstart', (e) => { isDrawing = true; paintCell(e.target); }, {passive: false});
        grid.addEventListener('touchmove', (e) => {
            if(!isDrawing) return;
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            paintCell(element);
        }, {passive: false});
        document.addEventListener('touchend', () => isDrawing = false);

        // 6. Botón de borrado masivo
        btnClear.onclick = () => {
            if(confirm("¿Borrar todo el plano?")) {
                savedMap = Array(totalCells).fill('');
                localStorage.setItem('miPlanoTiles', JSON.stringify(savedMap));
                document.querySelectorAll('.grid-cell').forEach(c => c.className = 'grid-cell');
                this.vibra("doble");
            }
        };
    }

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

    // --- GESTOR DE MACROS IA & KEYBINDER ---
    initGestorMacrosIA() {
        const btnRecord = document.getElementById('btn-record-key');
        const displayKey = document.getElementById('recorded-key-display');
        const btnCompile = document.getElementById('btn-compile-macro');
        const promptInput = document.getElementById('macro-ai-prompt');
        const list = document.getElementById('macro-list');
        const emptyMsg = document.getElementById('macro-empty-msg');
        
        if (!btnRecord || !btnCompile) return; // Evita errores si falta el HTML

        let currentBinding = "";

        // 1. El Keybinder (Atrapador de Teclas)
        btnRecord.onclick = () => {
            btnRecord.innerText = "Escuchando...";
            btnRecord.style.background = "#ff9f0a";
            btnRecord.style.color = "white";
            
            const capturer = (e) => {
                e.preventDefault(); // Evita que la tecla haga su función normal
                
                let keys = [];
                if (e.ctrlKey) keys.push("Ctrl");
                if (e.altKey) keys.push("Alt");
                if (e.shiftKey) keys.push("Shift");
                
                // No grabar si solo pulsó un modificador
                if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
                
                keys.push(e.key.toUpperCase());
                currentBinding = keys.join(" + ");
                
                displayKey.innerText = currentBinding;
                btnRecord.innerText = "Re-grabar Atajo";
                btnRecord.style.background = "var(--card-bg)";
                btnRecord.style.color = "var(--primary)";
                
                this.vibra("tick");
                window.removeEventListener('keydown', capturer);
            };
            
            window.addEventListener('keydown', capturer);
        };

        // 2. El Compilador (Preparado para la IA)
        btnCompile.onclick = async () => {
            const prompt = promptInput.value.trim();
            if(!currentBinding || !prompt) return this.notificar("Falta el atajo o el texto", "⚠️");

            btnCompile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compilando...`;
            this.vibra("tick");

            // Simulamos que la IA nos devuelve el JSON compilado en 1 segundo.
            setTimeout(() => {
                const codigoJSONGenerado = JSON.stringify({ "Led": "toggle", "Pomodoro": 25 });

                if(emptyMsg) emptyMsg.style.display = 'none';

                const li = document.createElement('li');
                li.className = "macro-item cascade-in";
                li.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        <span style="font-family:monospace; font-weight:900; color:var(--primary); font-size:1.1rem;"><i class="fa-regular fa-keyboard"></i> ${currentBinding}</span>
                        <span style="font-size:0.85rem; color:var(--text-sec);">"${prompt}"</span>
                        <span style="font-family:monospace; font-size:0.75rem; color:#32d74b;">> ${codigoJSONGenerado}</span>
                    </div>
                    <button class="btn-del" onclick="this.parentElement.remove(); window.App.vibra('doble');"><i class="fa-solid fa-trash"></i></button>
                `;
                list.appendChild(li);
                
                // Limpiar inputs
                promptInput.value = "";
                displayKey.innerText = "Sin asignar";
                currentBinding = "";
                btnCompile.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Compilar y Guardar`;
                
                this.notificar("Atajo compilado con éxito", "✅");
            }, 1000);
        };
    }
    // ==========================================================
    // 🗄️ MÓDULO DE BASE DE DATOS LOCAL (MEMORIA PROFUNDA)
    // ==========================================================

    // Inicia la conexión con IndexedDB (La Base de Datos del Navegador)
    initBaseDeDatos() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("PicoOS_Database", 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Creamos una "tabla" llamada 'habitos'
                if (!db.objectStoreNames.contains('habitos')) {
                    const store = db.createObjectStore('habitos', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('app', 'app', { unique: false });
                    store.createIndex('hora', 'hora', { unique: false });
                }
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("🗄️ Base de Datos Local Online.");
                resolve();
            };
            
            request.onerror = (event) => reject("Error abriendo DB");
        });
    }

    // Registra un evento en la base de datos
    registrarEnDB(app, accion, valorExtra = null) {
        if (!this.db) return;
        const transaccion = this.db.transaction(['habitos'], 'readwrite');
        const store = transaccion.objectStore('habitos');
        
        const registro = {
            app: app,
            accion: accion,
            valor: valorExtra,
            hora: new Date().getHours(), // Hora del día (0-23)
            minuto: new Date().getMinutes(),
            diaSemana: new Date().getDay(), // 0 (Dom) a 6 (Sab)
            timestamp: Date.now()
        };
        
        store.add(registro);
    }

    // Extrae los hábitos históricos basados en la hora actual
    consultarHabitosDB(horaActual) {
        return new Promise((resolve) => {
            if (!this.db) return resolve("Sin datos históricos.");
            const transaccion = this.db.transaction(['habitos'], 'readonly');
            const store = transaccion.objectStore('habitos');
            const index = store.index('hora');
            
            // Buscamos qué suele hacer el usuario a esta hora
            const rango = IDBKeyRange.only(horaActual);
            const request = index.getAll(rango);
            
            request.onsuccess = () => {
                const resultados = request.result;
                if (resultados.length === 0) return resolve("No hay patrones a esta hora.");
                
                // Resumimos los datos para no saturar a la IA
                let resumen = {};
                resultados.forEach(r => {
                    const clave = `${r.app}->${r.accion}`;
                    resumen[clave] = (resumen[clave] || 0) + 1;
                });
                
                resolve(JSON.stringify(resumen));
            };
        });
    }
    // ==========================================================
    // 📦 GESTOR DE PAQUETES Y ACTUALIZACIONES OTA
    // ==========================================================

    initGestorActualizaciones() {
        // 1. Inyectamos la sección en el menú lateral y el panel flotante
        const menuLateral = document.getElementById('side-menu');
        if (menuLateral) {
            menuLateral.insertAdjacentHTML('beforeend', `
                <div id="sidebar-updates">
                    <div style="display:flex; align-items:center; color:#ff453a; font-weight:bold;">
                        <i class="fa-solid fa-cloud-arrow-down"></i>
                        <span style="margin-left:10px;">Actualizaciones</span>
                        <span class="update-bubble" id="update-count">0</span>
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-sec); margin-top:5px;">Módulos de IA listos para instalar.</div>
                </div>
            `);
        }
        document.body.insertAdjacentHTML('beforeend', `<div id="download-manager"></div>`);

        // 2. Evento al pulsar en el menú lateral
        const btnUpdates = document.getElementById('sidebar-updates');
        if (btnUpdates) {
            btnUpdates.onclick = () => {
                if (confirm(`¿Deseas descargar las actualizaciones?\nEsto podría consumir datos móviles.`)) {
                    btnUpdates.style.display = 'none'; // Ocultamos el aviso
                    document.getElementById('side-menu').classList.remove('open'); // Cerramos menú
                    this.iniciarDescargas();
                }
            };
        }

        // 3. Buscamos actualizaciones a los 3 segundos de abrir la web
        setTimeout(() => this.comprobarActualizaciones(), 3000);
    }

    comprobarActualizaciones() {
        // Simulamos que el servidor nos avisa de que hay 2 archivos nuevos
        this.paquetesPendientes = [
            { id: 'pkg1', nombre: "Módulo Cognitivo JARVIS V3", size: "14.2 MB" },
            { id: 'pkg2', nombre: "Diccionario de Hardware", size: "2.1 MB" }
        ];

        if (this.paquetesPendientes.length > 0) {
            this.notificar("Actualización del sistema disponible", "🔄");
            this.vibra("doble");
            
            // Mostramos el botón rojo en el menú lateral
            const btnUpdates = document.getElementById('sidebar-updates');
            const count = document.getElementById('update-count');
            if (btnUpdates) btnUpdates.style.display = 'block';
            if (count) count.innerText = this.paquetesPendientes.length;

            // Chivato visual en el título principal para que sepas que hay algo en el menú
            const menuTrigger = document.querySelector('.pico-os-title');
            if (menuTrigger && !document.getElementById('main-menu-bubble')) {
                menuTrigger.innerHTML += `<span id="main-menu-bubble" style="position:absolute; top:-5px; right:-15px; background:#ff453a; width:10px; height:10px; border-radius:50%;"></span>`;
            }
        }
    }

    iniciarDescargas() {
        const manager = document.getElementById('download-manager');
        manager.innerHTML = '<div style="font-weight:bold; margin-bottom:15px; color:var(--primary);"><i class="fa-solid fa-download"></i> Instalando paquetes...</div>';
        
        // Dibujamos las barras de progreso
        this.paquetesPendientes.forEach(pkg => {
            manager.innerHTML += `
                <div class="download-item" id="dl-${pkg.id}">
                    <div class="download-info">
                        <span>${pkg.nombre} <span style="color:var(--text-sec); font-size:0.7rem;">(${pkg.size})</span></span>
                        <span id="dl-pct-${pkg.id}">0%</span>
                    </div>
                    <div class="progress-bg">
                        <div class="progress-fill" id="dl-fill-${pkg.id}"></div>
                    </div>
                </div>
            `;
        });

        manager.classList.add('active'); // Hacemos que el panel suba desde abajo
        this.vibra("tick");

        const bubble = document.getElementById('main-menu-bubble');
        if (bubble) bubble.remove();

        let descargasCompletadas = 0;

        // Simulamos la velocidad de descarga
        this.paquetesPendientes.forEach((pkg) => {
            let progreso = 0;
            const velocidad = Math.random() * 4 + 2; 

            const intervalo = setInterval(() => {
                progreso += velocidad;
                if (progreso >= 100) {
                    progreso = 100;
                    clearInterval(intervalo);
                    descargasCompletadas++;
                    document.getElementById(`dl-pct-${pkg.id}`).innerText = "OK";
                    document.getElementById(`dl-pct-${pkg.id}`).style.color = "#32d74b";
                    
                    if (descargasCompletadas === this.paquetesPendientes.length) {
                        setTimeout(() => {
                            manager.classList.remove('active'); // Ocultamos el panel
                            this.notificar("Sistemas actualizados al 100%", "✅");
                            this.vibra("doble");
                        }, 1500);
                    }
                }
                
                document.getElementById(`dl-fill-${pkg.id}`).style.width = `${progreso}%`;
                if (progreso < 100) document.getElementById(`dl-pct-${pkg.id}`).innerText = `${Math.floor(progreso)}%`;
            }, 150); 
        });
    }
}
