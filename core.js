import { LedCard } from './cards/led.js';
import { TiempoCard } from './cards/tiempo.js';
import { MegafonoCard } from './cards/megafono.js';
import { FiestaCard } from './cards/fiesta.js';
import { ListaCard } from './cards/lista.js';
import { CalcCard } from './cards/calculadora.js';
import { SensoresCard } from './cards/sensores.js';
import { NotasCard } from './cards/notas.js';
import { RelojCard } from './cards/reloj.js';

const cards = [
    TiempoCard, RelojCard, LedCard, FiestaCard, 
    ListaCard, CalcCard, SensoresCard, NotasCard, MegafonoCard
];

// SEGURIDAD: Define aquí tus usuarios
// Ejemplo: "admin" es el usuario, "1234" la contraseña (o el hash)
const HASH_REAL = "U2FsdGVkX1/qM8..."; 

class PicoCore {
    constructor() {
        this.mqtt = null;
        this.broker = localStorage.getItem('mqtt_broker') || "wss://broker.hivemq.com:8884/mqtt";
        this.layout = JSON.parse(localStorage.getItem('pico_layout')) || cards.map(c => c.id);
        
        // Base de datos de usuarios
        this.llave = {
            "admin": HASH_REAL // Aquí validamos
        };

        this.init();
    }

    init() {
        if(localStorage.getItem('pico_pass') === "OK") {
            this.showInterface();
        } else {
            document.getElementById('btn-login').onclick = () => this.checkLogin();
        }

        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeText(theme);
    }

    checkLogin() {
        const user = document.getElementById('user-input').value.trim();
        const pass = document.getElementById('pass-input').value.trim();

        // Validar Usuario y Contraseña (Simple para el ejemplo)
        // Si el usuario existe en la lista y la contraseña es "admin"
        if(this.llave[user] && pass === "admin") { 
            localStorage.setItem('pico_pass', "OK");
            localStorage.setItem('pico_user', user);
            this.showInterface();
        } else {
            alert("Credenciales incorrectas");
            document.getElementById('pass-input').value = "";
        }
    }

    showInterface() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-interface').style.display = 'flex';
        this.renderGrid();
        this.setupMQTT();
        this.setupUI();
    }

    renderGrid() {
        const grid = document.getElementById('grid');
        grid.innerHTML = "";
        this.layout.forEach(id => {
            const cardObj = cards.find(c => c.id === id);
            if(cardObj) {
                const div = document.createElement('div');
                div.className = `card ${cardObj.size || ''}`;
                div.setAttribute('data-id', id);
                div.innerHTML = cardObj.html;
                grid.appendChild(div);
                if(cardObj.onInit) cardObj.onInit(this);
            }
        });
        this.enableDrag();
    }

    setupMQTT() {
        console.log("Conectando a", this.broker);
        this.mqtt = mqtt.connect(this.broker);
        this.mqtt.on('connect', () => {
            document.getElementById('broker-dot').className = "dot green";
            document.getElementById('broker-name').innerText = "Conectado";
            this.mqtt.subscribe('PicoOS_92834/#');
        });
        this.mqtt.on('message', (topic, msg) => {
            const val = msg.toString();
            if(topic.includes('/estado')) this.updatePicoStatus(val);
            cards.forEach(c => {
                if(topic.includes(c.id) && c.onData) c.onData(val, this, this);
            });
        });
    }

    pub(subtopic, msg, retain=false) {
        if(this.mqtt) this.mqtt.publish(`PicoOS_92834/${subtopic}`, msg.toString(), {retain: retain});
    }

    updatePicoStatus(val) {
        try {
            const data = JSON.parse(val);
            document.getElementById('pico-temp').innerText = data.temp + "°C";
            document.getElementById('pico-ram').innerText = data.ram + "%";
        } catch(e) {}
    }

    setupUI() {
        const closeAll = () => document.querySelectorAll('.custom-dropdown').forEach(e => e.classList.remove('open'));
        
        // Menú Broker
        document.getElementById('broker-trigger').onclick = (e) => {
            e.stopPropagation();
            const open = document.getElementById('broker-menu').classList.contains('open');
            closeAll();
            if(!open) document.getElementById('broker-menu').classList.add('open');
        };

        // Menú Ajustes
        document.getElementById('settings-trigger').onclick = (e) => {
            e.stopPropagation();
            const open = document.getElementById('settings-menu').classList.contains('open');
            closeAll();
            if(!open) document.getElementById('settings-menu').classList.add('open');
        };

        window.onclick = () => closeAll();

        // Acciones Ajustes
        document.getElementById('btn-edit').onclick = () => {
            document.body.classList.toggle('edit-mode');
            const editing = document.body.classList.contains('edit-mode');
            const icon = editing ? '<i class="fa-solid fa-check" style="color:#32d74b; width:20px"></i>' : '<i class="fa-solid fa-pen-ruler" style="width:20px"></i>';
            document.getElementById('btn-edit').innerHTML = `${icon} ${editing ? "Terminar" : "Editar"}`;
            if(!editing) this.saveLayout();
        };

        document.getElementById('btn-theme').onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            this.updateThemeText(next);
        };

        document.getElementById('btn-logout').onclick = () => {
            if(confirm("¿Cerrar sesión?")) {
                localStorage.removeItem('pico_pass');
                location.reload();
            }
        };

        document.querySelectorAll('#broker-menu .dropdown-item').forEach(item => {
            item.onclick = () => {
                localStorage.setItem('mqtt_broker', item.getAttribute('data-broker'));
                location.reload();
            };
        });
    }

    updateThemeText(theme) {
        const btn = document.getElementById('btn-theme');
        btn.innerHTML = theme === 'dark' 
            ? '<i class="fa-solid fa-sun" style="width:20px"></i> Tema Claro' 
            : '<i class="fa-solid fa-moon" style="width:20px"></i> Tema Oscuro';
    }

    enableDrag() { /* Drag logic placeholder */ }

    saveLayout() {
        const newLayout = Array.from(document.querySelectorAll('.card')).map(div => div.getAttribute('data-id'));
        localStorage.setItem('pico_layout', JSON.stringify(newLayout));
    }
}
new PicoCore();
