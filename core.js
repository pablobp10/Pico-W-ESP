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
            "pablo": "M5sj7j4ZjQAEBeQvWtEpNRozuzy+oOreKtPix91wLTSJZSyid33rkuNyxp3CDsLCB3HLIBCwgcEcPvbfWILk64tSYTthqGDQqurEXLQFEuwY/dyp+KGLGC0RMN++iBFzbmg5iK1Rb3Wi7a9Fv0iHKw==",
            "invitado": "z85KQIpBaO63cZoGlvsHrMLkYv5mOKW5I/OSCLoyh+JRyDGxAdW70t7z3DexSmA901lCpHYhlWXh/da6Gq2FsHDQ9rpXXB6k5ayIF6cWodJgwML7wrRUaY6ENHjwkNo7OlXmbZdqoMjn52yKJaECxA==",
            "admin": "oVEi7bQOo96vD32scuKiNOCMjgf61wammtA9THrhxo7iDl9yvQvB25iuNq3MMAzcNjmji0H2ZvBWkN2ihYcQOI0no+3lEMr/Of4LQgCTU2B3EA6peUyJJBNFUEjdQZ/aa1sPtEmhEeTJKZ0sfhU+5w=="
        };
        
        this.brokers = [
            { h: "broker.hivemq.com", p: 8884, name: "HiveMQ" },
            { h: "broker.emqx.io", p: 8084, name: "EMQX" }, 
            { h: "public.mqtthq.com", p: 8084, name: "MQTTHQ" }
        ];
        this.brIdx = 0;

        this.init();
    }

    init() {
        this.initTheme();
        this.renderGrid();
        this.setupBrokerMenu();
        
        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('btn-edit').onclick = () => this.toggleEdit();
        document.getElementById('btn-theme').onclick = () => this.toggleTheme();
        document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); location.reload(); };
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };
        
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
        this.cards.forEach(card => {
            const div = document.createElement('div');
            div.className = `card ${card.size || ''}`;
            if(card.adminOnly) div.classList.add('admin-only');
            div.id = `card-${card.id}`;
            div.setAttribute('data-id', card.id);
            div.innerHTML = card.html;
            grid.appendChild(div);
            if(card.onInit) card.onInit(this);
        });
    }

    conectar() {
        const b = this.brokers[this.brIdx];
        const dot = document.getElementById('mqtt-dot');
        dot.className = "dot orange";
        
        const id = "Web_" + parseInt(Math.random() * 100000);
        this.mqtt = new Paho.MQTT.Client(b.h, Number(b.p), "/mqtt", id);
        
        this.mqtt.onConnectionLost = (e) => {
            dot.className = "dot red";
            setTimeout(() => { this.brIdx = (this.brIdx+1)%this.brokers.length; this.conectar(); }, 3000);
        };

        this.mqtt.onMessageArrived = (msg) => {
            const topic = msg.destinationName;
            const app = topic.split("/").pop();
            let val = msg.payloadString;

            // Intenta convertir a JSON. Si falla, se queda como texto normal.
            try { val = JSON.parse(val); } catch(e){}

            // 1. Filtrar el latido (Heartbeat V19 y V21)
            if (app === "sistema_hb" || app === "sistema" || (val && val.sistema)) {
                this.updatePicoStatus(val);
            }

            // 2. Enviar los datos a las tarjetas
            this.cards.forEach(c => {
                if(c.id === app || (c.subs && c.subs.includes(app))) {
                    if(c.onData) c.onData(val, app, this);
                }
            });
        };
        this.mqtt.connect({
            useSSL: true, timeout: 3,
            onSuccess: () => {
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
        
        const st = val ? (val.sistema || val) : "OFFLINE";
        const isOnline = st === "ONLINE" || st === "KEEPALIVE" || val.t !== undefined; 

        container.innerHTML = "";

        if (isOnline) {
            let ramPercent = 0;
            // Detección automática de versión (V21 usa r_pct, V19 usa ram)
            if (val.r_pct !== undefined) {
                ramPercent = val.r_pct;
            } else if (val.ram !== undefined) {
                const totalRam = 264 * 1024;
                ramPercent = Math.round(((totalRam - val.ram) / totalRam) * 100);
            }
            
            if(ramPercent < 0) ramPercent = 0;
            if(ramPercent > 100) ramPercent = 100;

            let ramColor = "var(--text-sec)";
            if(ramPercent > 60) ramColor = "#ff9f0a";
            if(ramPercent > 85) ramColor = "#ff453a";

            let tempValor = val.t !== undefined ? val.t : val.temp;
            let tempTxt = tempValor ? tempValor + "°C" : "";
            
            let rssi = val.rssi || -60; 
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
        if(this.mqtt && this.mqtt.isConnected() && this.conf.tk) { 
            const comando = String(c).toLowerCase();
            // 🛡️ NONCE: Sello de tiempo único para evitar Ataques de Replay
            const nonce = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
            
            // 🛡️ FIRMA: (Comando + Nonce + TokenSecreto) -> SHA256
            const dataToSign = comando + nonce + this.conf.tk;
            const firma = CryptoJS.SHA256(dataToSign).toString(CryptoJS.enc.Hex).substring(0, 16);
            
            const payload = JSON.stringify({ c: comando, n: nonce, f: firma });
            const m = new Paho.MQTT.Message(payload); 
            m.destinationName = this.conf.topic + "comando/" + app; 
            this.mqtt.send(m); 
            console.log("Comando Blindado Enviado:", app, comando);
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
            this.sortable = new Sortable(grid, { animation:150, onEnd: ()=>{
                const order = [];
                document.querySelectorAll('.card').forEach(c=>order.push(c.dataset.id));
                localStorage.setItem('gridOrder', JSON.stringify(order));
            }});
        } else {
            grid.classList.remove('edit-mode'); 
            btn.innerHTML = `<i class="fa-solid fa-pen" style="width:20px"></i> Editar`; 
            if(this.sortable) this.sortable.destroy();
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
}
