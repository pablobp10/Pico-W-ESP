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
            "pablo": "lgcPqs1dy5O5FR2HwkHF3Vs1bp7eg1Z5brqBSq98Al6jtZibsDMq98kyC+I9IJeWNZt8uit3rV7aGvvMHnQkHX8uOoHDWszoNvE6dlCL4rOXy3mv/l+niMM+GNrHVW8Ru9ntB7chqHnxpqttVmiFcNM1P9iIBVAJIbcoLVTX97w=",
            "invitado": "luUscBLrEs3NH6e/+8WSHx32DM3fVo7LZJaENbrQ2HQvaWN6kVSqev76OzEr2vJ1P1GKC65f23gIMWd8rWpmasJAm/eV0LOp1dLWvLyyZH316ARkelDgtqg+ffzdZ0klDdpIyBQ8urq4X0zWpJTB8rV//98r2HNQzjCJ7X8b3Sk=",
            "admin": "of2L6B5q+OJDNczjGL50QOYH9VwbGA9EeaV86rBF6GMX1spTDB8UGayJuE80Q/9vgJ+Q268u9DIroWImyfpjCBMDRI4vy21CL/yVRkxzQgDe3ZJT3BjNlKSAB07eQQnx5LtVPeAJBrfmhS2jAzbT0GBpmS1u3HcrUsKdmhB4l2w="
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
        
        // Listeners de los botones (ahora dentro del menú)
        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('btn-edit').onclick = () => this.toggleEdit();
        document.getElementById('btn-theme').onclick = () => this.toggleTheme();
        document.getElementById('btn-logout').onclick = () => { sessionStorage.clear(); location.reload(); };
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };
        
        // --- LOGICA DEL MENÚ AJUSTES ---
        const settingsTrigger = document.getElementById('settings-trigger');
        const settingsMenu = document.getElementById('settings-menu');
        const brokerMenu = document.getElementById('broker-menu');

        settingsTrigger.onclick = (e) => {
            e.stopPropagation();
            const isOpen = settingsMenu.classList.contains('open');
            // Cerrar otros
            brokerMenu.classList.remove('open');
            // Toggle este
            if(isOpen) settingsMenu.classList.remove('open');
            else settingsMenu.classList.add('open');
        };

        // Click fuera cierra TODO
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

    // --- MENU BROKER ---
    setupBrokerMenu() {
        const menu = document.getElementById('broker-menu');
        const current = document.getElementById('current-broker-name');
        const trigger = document.getElementById('broker-trigger');
        const settingsMenu = document.getElementById('settings-menu'); // Referencia para cerrarlo
        
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
            e.stopPropagation(); // Evitar cierre inmediato
            settingsMenu.classList.remove('open'); // Cerrar el de ajustes si está abierto
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

    // --- MQTT ---
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
            try { val = JSON.parse(val); } catch(e){}

            // AÑADIR app === "sistema_hb" AQUÍ
            if (app === "sistema_hb" || app === "sistema" || (val && val.sistema)) {
                this.updatePicoStatus(val);
            }

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
                
                // 1. Enviamos el apretón de manos con el TOTP para validar el pasaporte
                if (this.totp_guardado) {
                    const authPayload = JSON.stringify({ totp: this.totp_guardado, tk: this.session_token });
                    const authMsg = new Paho.MQTT.Message(authPayload);
                    authMsg.destinationName = this.conf.topic + "comando/Auth";
                    this.mqtt.send(authMsg);
                    this.totp_guardado = null; // Lo borramos de la web inmediatamente
                }

                // 2. Pedimos el estado inicial
                setTimeout(() => this.cmd('Led', 'get'), 500); 
            },

            onFailure: () => { dot.className = "dot red"; setTimeout(() => this.conectar(), 3000); }
        });
    }

    updatePicoStatus(val) {
        const container = document.getElementById('pico-status-container');
        const st = val ? (val.sistema || val) : "OFFLINE";
        
        // El Heartbeat V21 se considera online si trae datos
        const isOnline = st === "ONLINE" || st === "KEEPALIVE" || val.t !== undefined; 

        container.innerHTML = "";

        if (isOnline) {
            const totalRam = 264 * 1024; 
            
            // CAMBIO AQUÍ: Buscar val.r (V21) o val.ram (V19)
            let freeRam = val.r !== undefined ? val.r : (val.ram || 0);
            
            let usedRam = totalRam - freeRam;
            let ramPercent = Math.round((usedRam / totalRam) * 100);
            
            if(ramPercent < 0) ramPercent = 0;
            if(ramPercent > 100) ramPercent = 100;

            let ramColor = "var(--text-sec)";
            if(ramPercent > 60) ramColor = "#ff9f0a";
            if(ramPercent > 85) ramColor = "#ff453a";

            // CAMBIO AQUÍ: Buscar val.t (V21) o val.temp (V19)
            let tempValor = val.t !== undefined ? val.t : val.temp;
            let tempTxt = tempValor ? tempValor + "°C" : "";
            
            let rssi = val.rssi || -60; 

            // Color del WiFi
            let wifiColor = "#ff453a"; // Rojo
            if(rssi > -70) wifiColor = "#ff9f0a"; // Naranja
            if(rssi > -50) wifiColor = "#32d74b"; // Verde

            container.innerHTML = `
                <div class="pico-info-pill">
                    <span style="color:#32d74b; font-weight:bold; font-size:0.8rem">●</span>
                    <span style="font-weight:600; color:var(--text-main); margin-right:5px">Online</span>
                    
                    ${tempTxt ? `<span style="border-left:1px solid var(--border); padding-left:6px; margin-right:6px; font-size:0.8rem" title="CPU Temp"><i class="fa-solid fa-temperature-half"></i> ${tempTxt}</span>` : ''}
                    
                    <span style="border-left:1px solid var(--border); padding-left:6px; color:${wifiColor}" title="Señal: ${rssi} dBm">
                        <i class="fa-solid fa-wifi"></i>
                    </span>
                    
                    <span style="border-left:1px solid var(--border); padding-left:6px; margin-left:6px; font-weight:600; font-size:0.8rem; color:${ramColor}" title="RAM Usada">
                        ${ramPercent}%
                    </span>
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

    cmd(app, c) { if(this.mqtt?.isConnected()) { const m=new Paho.MQTT.Message(c); m.destinationName=this.conf.topic+"comando/"+app; this.mqtt.send(m); }}
    pub(app, v, r) { if(this.mqtt?.isConnected()) { const m=new Paho.MQTT.Message(String(v)); m.destinationName=this.conf.topic+"estado/"+app; m.retained=r; this.mqtt.send(m); }}

    login() {
        const u = document.getElementById('user-input').value.trim();
        const p = document.getElementById('pass-input').value.trim();
        const totp = document.getElementById('totp-input').value.trim();
        
        if(!this.llave[u] || totp.length !== 6) {
            return document.getElementById('error-msg').innerText = "Credenciales o código inválido";
        }
        
        try {
            const k = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(p));
            const b = CryptoJS.AES.decrypt({ciphertext: CryptoJS.enc.Base64.parse(this.llave[u])}, k, {mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
            const txt = b.toString(CryptoJS.enc.Utf8);
            
            if(txt.includes("topic")) {
                this.conf = JSON.parse(txt);
                this.rol = this.conf.rol;
                
                // Generamos un Pasaporte Temporal aleatorio (32 caracteres)
                this.session_token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
                this.totp_guardado = totp; // Lo guardamos un segundo para enviarlo
                
                document.getElementById('login-screen').style.display = 'none';
                if(this.rol === 'admin') document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
                
                this.conectar();
            } else throw 0;
        } catch { 
            document.getElementById('error-msg').innerText = "Contraseña incorrecta"; 
            document.getElementById('error-msg').style.display = 'block'; 
        }
    }

    // El emisor ahora empaqueta el pasaporte de forma invisible
    cmd(app, c) { 
        if(this.mqtt && this.mqtt.isConnected()) { 
            const payload = JSON.stringify({ 
                c: String(c), 
                tk: this.session_token 
            });
            const m = new Paho.MQTT.Message(payload); 
            m.destinationName = this.conf.topic + "comando/" + app; 
            this.mqtt.send(m); 
        }
    }


    toggleEdit() {
        this.editMode = !this.editMode;
        const grid = document.getElementById('dashboard-grid');
        const btn = document.getElementById('btn-edit');
        if(this.editMode) {
            grid.classList.add('edit-mode'); 
            btn.innerHTML = `<i class="fa-solid fa-check" style="color:var(--primary); width:20px"></i> Ok`; // Feedback visual en el menú
            this.sortable = new Sortable(grid, { animation:150, onEnd: ()=>{
                const order = [];
                document.querySelectorAll('.card').forEach(c=>order.push(c.dataset.id));
                localStorage.setItem('gridOrder', JSON.stringify(order));
            }});
        } else {
            grid.classList.remove('edit-mode'); 
            btn.innerHTML = `<i class="fa-solid fa-pen" style="width:20px"></i> Editar`; // Restaurar texto
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
