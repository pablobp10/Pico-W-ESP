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
import { GeneradorPrompt } from './prompt.js';

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
            "pablo": "eyJlIjoib04zNWc3M29tdTBLRjVucWhsaklGalJ0L0tpeEpOc0Jra0hFSFhBcUE3NW15Ukp2YWRtWGMzTUtJZ0hsWC83VVozNWd0bDNoV3liZVVEYlV0QTBQV2hVRkE4RkgwdFBRRU9OS3oyMWFZU0ZaSVJ6N0tsbDlZZjc2VkQrVm53SjUiLCJkIjoiMnFqODlNUE5HdG5Na0x3MWdsRC94TnY1Z2F0STkrQldrWjhOOHBBK3hPellCdjdINnNFaHY4QklZUmczTld6cFpKVzdBYmxjZVJsNHhNcmhpM1FqSmxsWlBRbUhoaEwzVlV4OXpDd1JFZzJJaDQrSmxYRDVLQmNxQjVaVkxmbThwSVYwSTN1MUFsMFZMd2pFZ0VxcUlNSlZLa0FYN3liSm1ZcDVadUsrL2hyZGg1T0h3aDFYcmlVWFVSVnpmbVY2MldORUtTR3JscVVKdmdlWjA0WGF4WmtMbTk4MlF5Z2ZXQWZTYXFJQloyWjVQdTdIQ3dJb3VvQ2xGSm9qS0NMUUIwaXMzUXdSQXRPbVltUzhKdmt0ZDRyTWhZc3E1V2tGOUFFanpkUFc1TysybHRhN2N4NUREZjJZWUwyNXhBMU1ZcFFIazh4SE13L05vazMyYlg0VHkreHIrY0s1MTBVRFNCbUI2cDlsb1UwV2lVajhqdjNEOFZneHZMYko2R2NQa2ExVXRiK2tkbFlPRkFWNTVNMlhvWnYvSDAyZlpHNnhKLy8zZ3VCTUJMdz0ifQ==",
            "invitado": "eyJlIjoiMnhDUHNMUUtZNnF5Zlp6MDhkMWNGcW84NmltRXgwZVgzbnNKQjJuU3MyQWJwcGsvQzFFakhSMzdpbUpKZmlmRlQ4cVVrOFdJdHpGSUNReHRuMEhMK1BZak9kUjMrUytCRVM4VS80YklCbU9jeU1OeU5aenJwdkxsWnAvZDJqVkgiLCJkIjoiR1R5a2hxMFR4dzZVa0tuLzN1NUkyaWM4d3BiZk05eENaQUE1cHZ4NDRsSEZCRW1maG94dC9jZGIrY3FnenN0dmNkdmV0OW1paUY3OHhHMFFhb1VMN3hsZEhNMkp3M2FLTW9jWVBrWHRsWXZ5UlRkVXRmWVBEN29KVzh2R2dlWlNSVHBiaUduVFRHQUhOc2ZKY1BQUTBkUThHWElFVFBRdjM4QnV6M25UMlNyODN1bldEMS9QeEkvcVJRR2NETXQrNVNvQTFHcnMra3N3MC9RRDJUM3pHZTFJTFd5aVlTT3VLS3M4WjdsRWZmTGs3aXJOa1BnRkk2anpKUnoxL3VNQVZORFZVSEtadGJvdTk2bjNJcjdkb2MrQ1UvNG9aeURPRnBGQnR4aThzd1lpQ2ZxTU1oNTEvV2c0dHVXblVUMWljVUVXQytUcDZwOExTSjlrWTRNa2FtSjVaamUwV1cwTnl6d09vNHRIV3NrYkxwWUNsSkdYcjBYYmgxOEdTRkcvYzVmMU5xT3paYmJkVEdHVEZHbXNMMFA4QmwzK0dYUC93eXA3MFd4ZDZxQT0ifQ==",
            "admin": "eyJlIjoicXkxZnpFTWIvRkdZbkRkMEVVM1RGcDVNT3VLQXNvbStMakErYzRqOEJranZtb0VWYUE2MlVlZTJKczhrMkdyU1U4NXFSZmc1ZjduY21ueHNmNnVzWXZHVzNtb3YxV1p2NnBlM3ZkekVGWXFOTzM4Z0FpU1MwQUhRclU2Q2ZRRmEiLCJkIjoiSFN6MVZpOUJsaEpuMFB2aFhTNDBPQWVGY0JXYWdsdWx6SFIrTFFMMFVXbzJwTGxUMGdPVUJBTVIwQlE3SDlBRE1RY0g4ZSs0Zkh5NWZWcU1yU2lSeXp5UlhUNlErMzBPd3NqK3RhcTFibDRKS2VLSkRtVW5JMGVWZWJpMkNiY0tDdG9ZSjJFd0RwKzdUNnlvWkIrZmZXbXpwbHV4Z2QyM0FUb2pWSjRtOEZMNnlIak9QMWcxcXJkNHdDRjlHRkJKNlZxVkkrS1pYVDZ5bWtmdUozNWxSYlQ2R1d0MTRQK1BtVTJQeUJtOTJsL2V4dGg1bFVLK3dBK1oycFliZGpXZm5nQ05yUE51bDk4aThjT3M2VTRYWWc9PSJ9"
        };
        
        this.brokers = [
            { h: "broker.hivemq.com", p: 8884, name: "HiveMQ" },
            { h: "broker.emqx.io", p: 8084, name: "EMQX" }, 
            { h: "public.mqtthq.com", p: 8084, name: "MQTTHQ" },
            { h: "test.mosquitto.org", p: 8081, name: "Mosquitto" }
        ];
        this.brIdx = 0;
        this.colaOffline = [];
        this.arranqueSeguro();
    }

    async arranqueSeguro() {
        await this.inicializarModulos();
        this.init(); // Ahora sí, arrancamos la UI cuando las librerías existen
    }

    async inicializarModulos() {
        // 1. Diccionario Maestro de Versiones (El radar vigilará todas)
        this.versiones = JSON.parse(localStorage.getItem('pico_libs_versions')) || {
            "@mlc-ai/web-llm": "0.2.81", 
            "paho-mqtt": "1.0.1",        
            "crypto-js": "4.2.0",
            "sortable": "1.15.0"
        };

        // 2. Inyección de scripts clásicos (Sin la IA)
        this.librerias = {
            crypto: `https://cdnjs.cloudflare.com/ajax/libs/crypto-js/${this.versiones["crypto-js"]}/crypto-js.min.js`,
            mqtt: `https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/${this.versiones["paho-mqtt"]}/mqttws31.min.js`,
            sortable: `https://cdnjs.cloudflare.com/ajax/libs/Sortable/${this.versiones["sortable"]}/Sortable.min.js`
        };

        console.log("🚀 Inyectando módulos dinámicos en RAM...");
        
        for (const [nombre, url] of Object.entries(this.librerias)) {
            if (!document.querySelector(`script[src="${url}"]`)) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;
                    script.onload = () => resolve();
                    script.onerror = () => reject(`Fallo en ${nombre}`);
                    document.head.appendChild(script);
                });
            }
        }
        console.log("✅ Módulos listos.");
        
        setTimeout(() => this.buscarActualizacionesSilenciosas(), 10000);
    }

    async buscarActualizacionesSilenciosas() {
        console.log("📡 Buscando parches en red mundial...");
        let hayNovedades = false;
        const nuevasVersiones = { ...this.versiones };

        // 🛡️ ACTUALIZADO: El radar vigila todo, incluida la IA (ES6)
        for (const pkg of ["crypto-js", "@mlc-ai/web-llm"]) {
            try {
                const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
                const data = await res.json();
                if (data.version && data.version !== this.versiones[pkg]) {
                    nuevasVersiones[pkg] = data.version;
                    hayNovedades = true;
                    console.log(`📦 Nuevo parche disponible: ${pkg} v${data.version}`);
                }
            } catch (e) {}
        }

        if (hayNovedades) {
            localStorage.setItem('pico_libs_versions', JSON.stringify(nuevasVersiones));
            this.notificar("Actualización de librerías lista (Se aplicará al recargar)", "🔄");
        }
    }

    sincronizarColaOffline() {
        if (this.colaOffline.length > 0 && this.mqtt && this.mqtt.isConnected()) {
            this.notificar(`Sincronizando ${this.colaOffline.length} comandos pendientes...`, "🔄");
            this.colaOffline.forEach((orden, i) => {
                setTimeout(() => this.cmd(orden.app, orden.c), i * 200);
            });
            this.colaOffline = []; 
        }
    }
    
    init() {
        this.filtroActual = 'all';
        this.initTheme();
        this.renderGrid();
        this.setupBrokerMenu();
        this.initAtajosTeclado();
        this.initParallax();
        this.initSwipeGestures();
        this.initSidebar();
        this.initMultijugador();
        this.initModosExpertos();
        this.initVozJARVIS();
        this.iniciarAgenteProactivo();
        this.initBaseDeDatos()
        this.initInterruptorIA();
        
        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('btn-edit').onclick = () => this.toggleEdit();
        document.getElementById('btn-theme').onclick = () => this.toggleTheme();
        document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); location.reload(); };
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };

        const btnBio = document.getElementById('btn-bio');
        if (btnBio) {
            btnBio.onclick = () => {
                const u = localStorage.getItem("u");
                if (u) this.registrarBiometria(u);
                else this.notificar("Inicia sesión primero", "⚠️");
            };
        }
        
        // 👁️ VIGILANTE DE TECLADO PARA EL PIN MÁGICO
        document.getElementById('user-input').addEventListener('input', (e) => {
            const u = e.target.value.trim();
            const pinInput = document.getElementById('pin-input');
            
            // Si el usuario existe en tu diccionario de llaves y NO tiene la Llave Fantasma guardada
            if (this.llave[u] && !localStorage.getItem('pico_gk_' + u)) {
                pinInput.style.display = 'block'; // Mostrar PIN
            } else {
                pinInput.style.display = 'none';  // Ocultar PIN
            }
        });
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

        const u = localStorage.getItem("u"), p = localStorage.getItem("p");
        if(u && p) { 
            document.getElementById('user-input').value = u; 
            document.getElementById('pass-input').value = p;
            setTimeout(() => { this.login(); }, 500);
        }

        // Activar el Cerebro IA
        document.getElementById('btn-ai-send').onclick = () => this.procesarComandoIA();
        document.getElementById('ai-input').onkeypress = (e) => { if(e.key==='Enter') this.procesarComandoIA(); };
        
        // Activar control offline del navegador
        window.addEventListener('online', () => this.setNetworkStatus(true));
        this.sincronizarColaOffline();
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

    async conectar() {
        if (this.conf.v1_compat) { this.initLegacyProtocol(); return; }

        const b = this.brokers[this.brIdx];
        const dot = document.getElementById('mqtt-dot');
        if (dot) dot.className = "dot orange";
        const id = "Web_" + parseInt(Math.random() * 100000);
        
        try {
            // Asumimos que inicializarModulos ya puso la v1.0.1 en window.Paho
            this.mqtt = new window.Paho.MQTT.Client(b.h, Number(b.p), "/mqtt", id);
        } catch (e) {
            console.error("❌ Fallo crítico al instanciar MQTT. ¿Versión incorrecta en RAM?", e);
            if (window.saveLog) window.saveLog("Motor MQTT no instanciable", "#ff453a");
            return;
        }
        
        this.mqtt.onConnectionLost = (e) => {
            this.setNetworkStatus(false);
            if (dot) dot.className = "dot red";
            setTimeout(() => { this.brIdx = (this.brIdx+1)%this.brokers.length; this.conectar(); }, 3000);
        };

        this.mqtt.onMessageArrived = (msg) => {
            const topic = msg.destinationName;
            const app = topic.split("/").pop();
            let val = msg.payloadString;
            try { val = JSON.parse(val); } catch(e){}
            if (app === "sistema_hb" || app === "sistema" || (val && val.sistema)) this.updatePicoStatus(val);
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
                this.updatePicoStatus("BUSCANDO");
                this.mqtt.subscribe(this.conf.topic + "estado/#");
                setTimeout(() => this.cmd('Led', 'get'), 500); 
            },
            onFailure: () => { 
                if (dot) dot.className = "dot red"; 
                setTimeout(() => this.conectar(), 3000); 
            }
        });
    }

    initLegacyProtocol() {
        const dot = document.getElementById('mqtt-dot');
        setTimeout(() => {
            this.setNetworkStatus(true);
            if (dot) dot.className = "dot green";
            this.mqtt = {
                isConnected: () => true,
                send: (m) => {
                    const topic = m.destinationName;
                    const app = topic.split("/").pop();
                    let payload;
                    try { payload = JSON.parse(m.payloadString); } catch(e) { payload = {c: m.payloadString}; }
                    const cmdVal = payload.c; 
                    setTimeout(() => {
                        let nextState = cmdVal.toUpperCase();
                        if (cmdVal === "toggle") {
                            const valEl = document.querySelector(`#card-${app} .val-text`);
                            nextState = (valEl && valEl.innerText === "ON") ? "OFF" : "ON";
                        } else if (cmdVal === "get") { nextState = "OFF"; }
                        if (this.mqtt.onMessageArrived) {
                            this.mqtt.onMessageArrived({ destinationName: this.conf.topic + "estado/" + app, payloadString: nextState, retained: false });
                        }
                    }, 300 + Math.random() * 100); 
                }
            };
            setInterval(() => {
                if (this.mqtt.onMessageArrived) this.mqtt.onMessageArrived({ destinationName: this.conf.topic + "estado/sistema_hb", payloadString: JSON.stringify({ sistema: "ONLINE", r_pct: 42, t: 36.5, rssi: -45 }) });
            }, 15000);
            this.updatePicoStatus(JSON.stringify({ sistema: "ONLINE", r_pct: 42, t: 36.5, rssi: -45 }));
            setTimeout(() => this.cmd('Led', 'get'), 500);
        }, 1500);
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

    async login() {
        const u = document.getElementById('user-input').value.trim();
        const p = document.getElementById('pass-input').value.trim();
        const pinInputEl = document.getElementById('pin-input');
        const pin = pinInputEl.value.trim(); 
        
        if(!this.llave[u]) {
            document.getElementById('error-msg').innerText = "Usuario no encontrado";
            document.getElementById('error-msg').style.display = 'block';
            return;
        }

        let txtDesencriptado = ""; // Lo guardamos aquí para usarlo después

        // 🛡️ BLOQUE 1: EXCLUSIVO PARA CRIPTOGRAFÍA Y WEBAUTHN
        try {
            const rawJsonStr = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(this.llave[u]));
            const boveda = JSON.parse(rawJsonStr); 

            let ghostKey = localStorage.getItem('pico_gk_' + u);
            const tieneBio = localStorage.getItem(`pico_bio_${u}`);

            // 1. SI TIENE BIOMETRÍA GUARDADA, PEDIMOS HUELLA / FACE ID
            if (ghostKey && tieneBio) {
                this.notificar("Esperando credencial biométrica...", "🛡️");
                const bioOk = await this.verificarBiometria(u);
                if (!bioOk) throw new Error("BIO_FAIL"); // Si cancela la huella, simulamos fallo
            }

            // 2. SI NO HAY LLAVE FANTASMA, PEDIMOS EL PIN MAESTRO CLÁSICO
            if (!ghostKey) {
                if (pinInputEl.style.display === 'none' || pinInputEl.style.display === '') {
                    pinInputEl.style.display = 'block';
                    pinInputEl.focus(); 
                }

                if (!pin) {
                    const err = document.getElementById('error-msg');
                    err.innerText = "⚠️ Introduce tu PIN Maestro";
                    err.style.display = 'block';
                    return; 
                }

                const keyEnv = CryptoJS.SHA256(p + pin);
                const rawEnv = CryptoJS.enc.Base64.parse(boveda.e);
                const ivEnv = CryptoJS.lib.WordArray.create(rawEnv.words.slice(0, 4), 16);
                const cipherEnv = CryptoJS.lib.WordArray.create(rawEnv.words.slice(4), rawEnv.sigBytes - 16);
                
                const decEnv = CryptoJS.AES.decrypt({ciphertext: cipherEnv}, keyEnv, { iv: ivEnv });
                ghostKey = decEnv.toString(CryptoJS.enc.Utf8);
                
                if (!ghostKey) throw new Error("PIN_FAIL"); 
                
                localStorage.setItem('pico_gk_' + u, ghostKey);
            }

            // 4. DESENCRIPTAMOS LA BÓVEDA REAL
            const keyData = CryptoJS.SHA256(p + ghostKey);
            const rawData = CryptoJS.enc.Base64.parse(boveda.d);
            const ivData = CryptoJS.lib.WordArray.create(rawData.words.slice(0, 4), 16);
            const cipherData = CryptoJS.lib.WordArray.create(rawData.words.slice(4), rawData.sigBytes - 16);

            const decData = CryptoJS.AES.decrypt({ciphertext: cipherData}, keyData, { iv: ivData });
            txtDesencriptado = decData.toString(CryptoJS.enc.Utf8);
            
            if (!txtDesencriptado) throw new Error("DATA_FAIL");

        } catch (error) {  
            // 🚨 SÓLO ENTRA AQUÍ SI LA CLAVE O EL PIN SON REALMENTE FALSOS
            console.error("🔒 Error criptográfico real:", error);
            
            let fails = parseInt(localStorage.getItem('pico_fails_' + u) || "0");
            fails++;
            localStorage.setItem('pico_fails_' + u, fails);

            const errorMsg = document.getElementById('error-msg');
            if (fails >= 5) {
                localStorage.removeItem('pico_gk_' + u);
                localStorage.removeItem('pico_fails_' + u);
                errorMsg.innerText = "❌ Demasiados fallos. Dispositivo desvinculado.";
            } else {
                errorMsg.innerText = `Contraseña o PIN incorrectos. (Quedan ${5 - fails} intentos)`; 
            }
            
            const loginBox = document.querySelector('.login-box');
            errorMsg.style.display = 'block'; 
            loginBox.classList.remove('error-shake');
            void loginBox.offsetWidth; loginBox.classList.add('error-shake');
            return; // Detenemos la función aquí
        }

        // 🚀 BLOQUE 2: ARRANQUE DEL SISTEMA (Sólo se ejecuta si pasaste el Bloque 1)
        try {
            this.conf = JSON.parse(txtDesencriptado); 
            
            // Clave correcta: limpiamos el historial de fallos
            localStorage.removeItem('pico_fails_' + u);

            this.rol = this.conf.rol;
            this.apiKeys = this.conf.apis || {}; 

            localStorage.setItem("u", u); 
            localStorage.setItem("p", p); // Opcional, ya casi ni lo necesitamos
            
            document.getElementById('login-screen').style.display = 'none';
            if(this.rol === 'admin') document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            
            if (this.conf.v1_compat) {
                if (typeof this.initLegacyProtocol === 'function') this.initLegacyProtocol();
                return;
            }

            // Arrancar servidor MQTT normal
            this.conectar();
            
                } catch (error) {
            // 🐛 SI LLEGAS AQUÍ, LA CONTRASEÑA ERA CORRECTA PERO FALLÓ OTRA COSA
            console.error("💥 ERROR INTERNO AL ARRANCAR EL SISTEMA:", error);
            if (window.saveLog) {
                // 🛡️ CORREGIDO: Comillas invertidas añadidas
                window.saveLog(`💥 Fallo de arranque: ${error.message || error}`, "#ff453a");
            } // 🛡️ CORREGIDO: Llave de cierre del 'if' añadida
        } // Esta cierra el catch
    } // Esta cierra la función login

    async registrarBiometria(u) {
        if (!window.PublicKeyCredential) return;
        try {
            const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
            const cred = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: { name: "Pico OS", id: window.location.hostname },
                    user: { id: new Uint8Array(16), name: u, displayName: u },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                    timeout: 60000
                }
            });
            
            // 🛠️ LA MAGIA: Guardamos el ID exacto de la huella que acabamos de crear
            const rawId = Array.from(new Uint8Array(cred.rawId));
            localStorage.setItem(`pico_bio_id_${u}`, JSON.stringify(rawId));
            localStorage.setItem(`pico_bio_${u}`, 'true');
            
            this.notificar("Biometría enlazada con éxito", "🔒");
            this.vibra("doble");
        } catch (e) { 
            console.warn("Registro biométrico cancelado."); 
        }
    }

    // 🛠️ Añade el parámetro 'u' (usuario) a la función para saber qué ID buscar
    async verificarBiometria(u) {
        try {
            const savedId = JSON.parse(localStorage.getItem(`pico_bio_id_${u}`));
            if (!savedId) return false;

            const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
            const assertion = await navigator.credentials.get({
                publicKey: { 
                    challenge: challenge, 
                    // 🛠️ Le decimos a Android exactamente qué huella queremos usar
                    allowCredentials: [{ id: new Uint8Array(savedId), type: 'public-key' }],
                    userVerification: "required" 
                }
            });
            return !!assertion;
        } catch (e) { 
            return false; 
        }
    }
    
    ejecutarComandoLocal(app, accion) {
        // Lista de módulos que son puro software de interfaz (no existen en la Pico)
        const comandosLocales = ["Tema", "Edicion", "Vibracion", "Actualizaciones", "Vista", "Filtro", "Consola", "Sesion", "VozIA"];
        
        // 🎲 EMULADOR DE HARDWARE VIRTUAL (Tarjetas matemáticas o de red externa)
        const hardwareVirtual = ["Dado", "Pomodoro", "Calculadora", "Qr", "Reloj", "Tiempo", "Lista"];

        // 1. Interceptamos el Hardware Virtual PRIMERO
        if (hardwareVirtual.includes(app)) {
            if (this.logHUD) this.logHUD(`Simulando hardware virtual: ${app} -> ${accion}`, "out");
            
            if (app === "Dado" && accion === "roll") {
                // Generamos un número aleatorio del 1 al 6 en el propio navegador
                const resultado = Math.floor(Math.random() * 6) + 1;
                // Lo publicamos en MQTT retenido para que todas las pantallas conectadas lo vean
                this.pub("Dado", resultado, true); 
            } else {
                // Para el resto (Pomodoro, Qr, Reloj, Tiempo, Calculadora) publicamos el valor directo en el bus
                this.pub(app, accion, true); 
            }
            return true; // Devolvemos true para que la orden NO viaje a la placa Pico
        }

        // 2. Interceptamos los comandos de Interfaz Web (DOM)
        if (!comandosLocales.includes(app)) return false; // Si tampoco es local, devuelve false para que vaya a la Pico

        if (this.logHUD) this.logHUD(`Ejecutando directriz interna: ${app} -> ${accion}`, "out");

        switch(app) {
            case "Tema":
                if (accion === "toggle") this.toggleTheme();
                else { document.body.setAttribute('data-theme', accion); localStorage.setItem('theme', accion); }
                break;
            case "Edicion":
                if (accion === "on" && !this.editMode) this.toggleEdit();
                else if (accion === "off" && this.editMode) this.toggleEdit();
                else if (accion === "toggle") this.toggleEdit();
                break;
            case "Vibracion":
                const sw = document.getElementById('sw-vibration');
                if (sw) sw.checked = (accion === "on");
                break;
            case "Actualizaciones":
                this.comprobarActualizaciones();
                break;
            case "Vista":
                // Cambia entre las pantallas principales
                const grid = document.getElementById('dashboard-grid');
                const plano = document.getElementById('plano-view');
                const macros = document.getElementById('macros-view');
                if (grid) grid.style.display = (accion === 'dashboard') ? 'grid' : 'none';
                if (plano) plano.style.display = (accion === 'plano') ? 'flex' : 'none';
                if (macros) macros.style.display = (accion === 'macros') ? 'flex' : 'none';
                break;
            case "Filtro":
                // Simula hacer clic en las pastillas de filtro superiores
                this.filtroActual = accion;
                this.renderGrid();
                document.querySelectorAll('.filter-pill').forEach(b => {
                    b.classList.remove('active');
                    if (b.dataset.filter === accion) b.classList.add('active');
                });
                break;
            case "Consola":
                const hud = document.getElementById('hud-console');
                if (accion === "on" && (!hud || !hud.classList.contains('active'))) this.toggleHUD();
                else if (accion === "off" && hud && hud.classList.contains('active')) this.toggleHUD();
                else if (accion === "toggle") this.toggleHUD();
                break;
            case "Sesion":
                if (accion === "logout") { sessionStorage.clear(); location.reload(); }
                break;
            case "VozIA":
                // Nuevo flag de silencio absoluto
                this.iaSilenciada = (accion === "mute");
                if (this.iaSilenciada) this.notificar("Voz de JARVIS desactivada", "🔇");
                else this.notificar("Voz de JARVIS restaurada", "🔊");
                break;
        }
        return true; // Devuelve true confirmando que la web ya se encargó de este comando
    }

    // 💻 ENRUTADOR VIRTUAL (Intercepta comandos de la IA destinados a la Web)
    
    
    // ÚNICA función de comando. Fuerza minúsculas y elimina el pasaporte de seguridad.
    cmd(app, c) { 
        if(!this.mqtt || !this.mqtt.isConnected()) {
            console.log("❌ MQTT no conectado aún.");
            this.colaOffline.push({app, c});
            this.notificar("Comando en cola");
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
        
        console.log("🚀 COMANDO ENVIADO A LA PICO ->", comando);
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
        if (!('speechSynthesis' in window) || !texto || texto === 'null') return;
        if (this.iaSilenciada) return; // Si Pablo ha mandado callar a JARVIS, no hables
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
        const btnSend = document.getElementById('btn-ai-send');
        const orden = input.value.trim();
        if(!orden) return;

        // 1. Bloqueamos la UI y mostramos el Spinner de carga
        const iconoOriginal = btnSend.innerHTML;
        btnSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btnSend.style.pointerEvents = 'none'; // Evita doble clic
        input.value = ""; 
        input.disabled = true;
        input.placeholder = "JARVIS analizando...";
        
        this.notificar("Cerebro Cuántico procesando...", "🧠");
        this.vibra("tick");

        this.historialIA = this.historialIA || [];
        
        try {
            // 2. Esperamos a la IA con un tiempo límite imaginario
            await this.ejecutarInferencia(orden, "reactivo");
        } catch (e) {
            console.error("Fallo general de inferencia:", e);
        } finally {
            // 3. PASE LO QUE PASE (incluso si explota WebGPU), restauramos el botón
            btnSend.innerHTML = iconoOriginal;
            btnSend.style.pointerEvents = 'auto';
            input.disabled = false;
            input.placeholder = "Ej: Apaga la luz...";
            input.focus();
        }
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

    // ⚙️ 1. PRECARGA DEL MOTOR LOCAL (Se ejecuta al pulsar el botón)
    async precargarMotorLocal() {
        if (this.localEngine) return true; // Si ya está cargado, no hace nada

        let toastDl = document.getElementById('toast-ia-dl');
        if (!toastDl) {
            const container = document.getElementById('toast-area') || document.body;
            container.insertAdjacentHTML('beforeend', `
                <div class="toast" id="toast-ia-dl" style="border:1px solid var(--primary); animation: slideIn 0.3s forwards;">
                    ⏳ <span id="ia-dl-text" style="margin-left:8px; font-weight:bold;">Montando IA en VRAM...</span>
                    <div style="width:100%; background:var(--bg); height:6px; margin-top:10px; border-radius:3px; overflow:hidden;">
                        <div id="ia-dl-bar" style="width:0%; background:#32d74b; height:100%; transition:width 0.2s linear;"></div>
                    </div>
                </div>
            `);
        }

        try {
            const versionIA = this.versiones["@mlc-ai/web-llm"];
            const { CreateMLCEngine } = await import(`https://esm.run/@mlc-ai/web-llm@${versionIA}`);
            
            // 🛡️ ESCUDO ANTI-CRASH: Limitamos el context_window a 1024 para no pasar de 128MB
            this.localEngine = await CreateMLCEngine("Qwen2.5-0.5B-Instruct-q4f16_1-MLC", {
                initProgressCallback: (progress) => {
                    const pct = Math.round(progress.progress * 100);
                    const textEl = document.getElementById('ia-dl-text');
                    const barEl = document.getElementById('ia-dl-bar');
                    // WebLLM guarda todo en caché (IndexedDB) automáticamente.
                    // Si ya está descargado, esto pasará del 0 al 100% en 2 segundos.
                    if(textEl) textEl.innerText = `Caché Local: ${pct}%`;
                    if(barEl) barEl.style.width = `${pct}%`;
                },
                chatOpts: { context_window_size: 1024 } // <-- El truco mágico
            });
            
            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
            return true;

        } catch (e) {
            // Añadimos e.message para que la consola nos dé el texto real y no un {}
            console.error("Fallo al montar GPU Local:", e.message || e);
            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
            return false;
        }
    }

    // 🧠 2. EJECUCIÓN PURA (Ya no descarga nada, solo piensa)
    async procesarConWebLLM(promptSistema, orden, modo) {
        try {
            // Verificamos por seguridad que el motor exista
            if (!this.localEngine) throw new Error("Motor no inicializado");

            const reply = await this.localEngine.chat.completions.create({
                messages: [{ role: "system", content: promptSistema }, { role: "user", content: orden }],
                response_format: { type: "json_object" }
            });
            this.desplegarPayloadCuantico(reply.choices[0].message.content, orden, modo);

        } catch(e) { 
            console.error("Fallo de Inferencia Local:", e); 
            this.notificar("Colapso lógico en IA Local", "❌");
        }
    }
    
    // --- 6. MOTOR DE INFERENCIA CUÁNTICO (CHAIN-OF-THOUGHT & PERSONALIDAD) ---
    async ejecutarInferencia(orden, modo = "reactivo") {
        // Verificamos sesión y claves en memoria RAM
        if(!localStorage.getItem("p") || !this.apiKeys) {
            return this.notificar("Sesión corrupta o sin permisos de IA.", "❌");
        }

        // Telemetría
        const statusEl = document.querySelector('.pico-info-pill');
        const picoStatus = (statusEl && statusEl.innerText.includes('Online')) ? 'ONLINE (Conectada)' : 'OFFLINE (Desconectada)';
        let contextoFisico = `--- TELEMETRÍA FÍSICA ACTUAL (ESTADO PICO: ${picoStatus}) ---\n`;
        document.querySelectorAll('.card').forEach(card => {
            contextoFisico += `- Módulo [${card.dataset.id}]: ${card.querySelector('.val-text')?.innerText || "Activo"}\n`;
        });
        contextoFisico += `- Reloj: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n`;

        // Memoria
        let memoriaProfunda = "";
        if (this.db) { 
            const horaActual = new Date().getHours(); 
            memoriaProfunda = `--- PATRONES (${horaActual}:00) ---\n${await this.consultarHabitosDB(horaActual)}\n`; 
        }
        let memoria = "--- CONTEXTO ---\n";
        (this.historialIA || []).forEach(h => memoria += `Humano: ${h.u}\nJARVIS: ${h.a}\n`);

        const promptSistema = GeneradorPrompt(contextoFisico, memoriaProfunda, memoria, modo, orden);

        // 🔀 AQUÍ ACTÚA EL INTERRUPTOR
        if (this.modoIALocal) {
            await this.procesarConWebLLM(promptSistema, orden, modo);
        } else {
            // 🛡️ MOTOR HYDRA MULTI-NUBE
            
            // Leemos las claves dinámicas (vacías si el usuario es "guest")
            const keys = {
                google: this.apiKeys.google || "", 
                openrouter: this.apiKeys.openrouter || "",
                groq: this.apiKeys.groq || ""
            };

            const proveedores = [
                {
                    id: "Google (Gemini 1.5 Flash 8B)",
                    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${keys.google}`,
                    key: keys.google,
                    headers: () => ({ "Content-Type": "application/json" }),
                    body: () => JSON.stringify({
                        contents: [{ parts: [{ text: promptSistema }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    }),
                    parser: (data) => data.candidates[0].content.parts[0].text
                },
                {
                    id: "OpenRouter (Llama 3 8B Gratis)",
                    url: "https://openrouter.ai/api/v1/chat/completions",
                    key: keys.openrouter,
                    headers: () => ({ "Authorization": `Bearer ${keys.openrouter}`, "Content-Type": "application/json" }),
                    body: () => JSON.stringify({
                        model: "meta-llama/llama-3-8b-instruct:free",
                        messages: [{ role: "system", content: promptSistema }, { role: "user", content: orden }],
                        response_format: { type: "json_object" }
                    }),
                    parser: (data) => data.choices[0].message.content
                },
                {
                    id: "Groq (Llama 3 70B)",
                    url: "https://api.groq.com/openai/v1/chat/completions",
                    key: keys.groq,
                    headers: () => ({ "Authorization": `Bearer ${keys.groq}`, "Content-Type": "application/json" }),
                    body: () => JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "system", content: promptSistema }, { role: "user", content: orden }],
                        response_format: { type: "json_object" }
                    }),
                    parser: (data) => data.choices[0].message.content
                }
            ];

            let payloadGenerado = null;

            // BUCLE DE SUPERVIVENCIA
            for (const proveedor of proveedores) {
                if (!proveedor.key) continue; // Salta si no tiene clave para este servicio

                try {
                    console.log(`🚀 Intentando inferencia con: ${proveedor.id}...`);
                    const res = await fetch(proveedor.url, {
                        method: 'POST',
                        headers: proveedor.headers(),
                        body: proveedor.body()
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        console.warn(`⚠️ Falló ${proveedor.id}:`, errorData.error?.message || res.statusText);
                        continue;
                    }

                    const data = await res.json();
                    payloadGenerado = proveedor.parser(data);
                    console.log(`✅ Éxito de conexión con: ${proveedor.id}`);
                    break;

                } catch (e) {
                    console.error(`💥 Error de red crítico con ${proveedor.id}:`, e);
                }
            }

            // EVALUACIÓN FINAL
            if (payloadGenerado) {
                this.desplegarPayloadCuantico(payloadGenerado, orden, modo);
            } else {
                if(modo === "reactivo") {
                    console.error("☠️ COLAPSO NUBE: Todas las APIs han fallado o agotado su cuota.");
                    this.notificar("Nubes caídas. IA Local asumiendo el mando...", "🔋");
                    await this.procesarConWebLLM(promptSistema, orden, modo);
                }
            }
        }
    }

    // --- 7. EJECUCIÓN (Lee la mente de la IA antes de actuar) ---
    desplegarPayloadCuantico(textoCrudo, orden, modo) {
        try {
            const payload = JSON.parse(textoCrudo);
            
            if(modo === "reactivo") {
                console.log("%c🧠 PENSAMIENTO IA: " + payload._razonamiento_interno, "color: #0a84ff; font-style: italic;");
                console.log("%c🎭 EMOCIÓN: " + payload.estado_emocional.toUpperCase(), "color: #ff9f0a; font-weight: bold;");
                console.log("⚡ COMANDOS COMUNIDAD: ", payload.comandos);
            }
            
            // A) Código Máquina y Software
            if (payload.comandos && Object.keys(payload.comandos).length > 0) {
                for (const [app, accion] of Object.entries(payload.comandos)) {
                    
                    // 🔀 LA MAGIA DEL ENRUTADOR: Comprobamos si es para la web
                    const esComandoWeb = this.ejecutarComandoLocal(app, accion);
                    
                    // Si NO es un comando de la web, se lo mandamos a la Pico por MQTT
                    if (!esComandoWeb) {
                        this.cmd(app, accion);
                        this.registrarEnDB(app, accion); 
                    }
                }
            } else if (modo === "reactivo") {
                this.notificar("Análisis completado. Sin acciones mecánicas.", "🤖");
            }

            // 👻 MOTOR DEL FANTASMA EN EL DOM (Control físico de la interfaz)
            if (payload.ui_acciones && payload.ui_acciones.length > 0) {
                payload.ui_acciones.forEach(acc => {
                    if (acc.tipo === "escribir") {
                        const input = document.getElementById(acc.id);
                        if (input) {
                            input.value = acc.valor;
                            this.logHUD(`Escribiendo en [${acc.id}]: "${acc.valor}"`, "info");
                        }
                    } else if (acc.tipo === "click") {
                        const btn = document.getElementById(acc.id);
                        if (btn) {
                            btn.click();
                            this.logHUD(`Pulsando botón [${acc.id}]`, "info");
                        }
                    } else if (acc.tipo === "css") {
                        const el = acc.id === "body" ? document.body : document.getElementById(acc.id);
                        if (el) {
                            el.style[acc.propiedad] = acc.valor;
                            this.logHUD(`Modificando CSS de [${acc.id}]`, "info");
                        }
                    }
                });
            }
            
            
            // B) Habla Humana con Tono Adaptado
            if (payload.voz && payload.voz !== "null" && !this.iaSilenciada) {
                let icono = "🗣️";
                if(payload.estado_emocional === 'alerta') icono = "🚨";
                if(payload.estado_emocional === 'ironico' || payload.estado_emocional === 'sutilmente_sarcastico') icono = "😏";
                
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
    
    // 🔀 INTERRUPTOR NUBE / LOCAL (Inteligente según el entorno)
    initInterruptorIA() {
        // 1. EL DETECTOR: ¿Estamos en un navegador o en la APK nativa?
        // (Capacitor inyecta 'window.Capacitor', o podemos buscar 'wv' de WebView)
        this.esAppNativa = !!window.Capacitor || navigator.userAgent.includes('wv'); 
        
        // 2. REGLA DE NEGOCIO: Si es App -> Local por defecto. Si es Web -> Nube.
        this.modoIALocal = this.esAppNativa; 
        
        const aiInput = document.getElementById('ai-input');
        if (!aiInput || document.getElementById('btn-ia-mode')) return;

        // 3. LA BIFURCACIÓN: Si es Web, cortamos aquí. Solo Nube, sin botón.
        if (!this.esAppNativa) {
            console.log("🌍 Entorno Web detectado: Forzando IA Nube (Gemini).");
            return; 
        }

        // 4. MODO APP NATIVA: Creamos el botón para poder alternar
        console.log("📱 Entorno App detectado: IA Local lista por defecto.");
        const btnMode = document.createElement('button');
        btnMode.id = 'btn-ia-mode';
        
        // Como es App, arrancamos con el chip verde
        btnMode.innerHTML = '<i class="fa-solid fa-microchip"></i>';
        btnMode.style.cssText = "background:transparent; border:none; color:#32d74b; font-size:1.2rem; cursor:pointer; padding:0 10px; outline:none; transition: 0.3s;";
        
        aiInput.parentNode.insertBefore(btnMode, aiInput);
        
        btnMode.onclick = async () => {
            if (!this.modoIALocal) {
                // Pasar a Local
                btnMode.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
                this.notificar("Arrancando turbinas locales...", "⚙️");
                const exito = await this.precargarMotorLocal();
                if (exito) {
                    this.modoIALocal = true;
                    btnMode.innerHTML = '<i class="fa-solid fa-microchip"></i>';
                    btnMode.style.color = '#32d74b';
                    this.notificar("IA Local al mando", "🔒");
                } else {
                    this.modoIALocal = false;
                    btnMode.innerHTML = '<i class="fa-solid fa-cloud"></i>';
                    btnMode.style.color = '#0a84ff';
                    this.notificar("Hardware incompatible", "⚠️");
                }
            } else {
                // Volver a la Nube (Gemini)
                this.modoIALocal = false;
                btnMode.innerHTML = '<i class="fa-solid fa-cloud"></i>';
                btnMode.style.color = '#0a84ff';
                this.notificar("Modo IA Nube", "☁️");
            }
        };
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
}
