// IMPORTAR TARJETAS
import { LedCard } from './cards/led.js';
import { TiempoCard } from './cards/tiempo.js';
import { MegafonoCard } from './cards/megafono.js';
import { FiestaCard } from './cards/fiesta.js';
import { ListaCard } from './cards/lista.js';
import { CalcCard } from './cards/calculadora.js';
import { SensoresCard } from './cards/sensores.js';
import { NotasCard } from './cards/notas.js';
import { RelojCard } from './cards/reloj.js';

// CONFIGURACIÓN GLOBAL
const cards = [
    TiempoCard, 
    RelojCard, 
    LedCard, 
    FiestaCard, 
    ListaCard, 
    CalcCard, 
    SensoresCard, 
    NotasCard, 
    MegafonoCard
];

// SEGURIDAD (Hash real, cámbialo en producción)
// Llave "admin" encriptada (Ejemplo por defecto)
const HASH_REAL = "U2FsdGVkX1/qM8... (PON TU HASH AQUÍ) ..."; 

class PicoCore {
    constructor() {
        this.mqtt = null;
        this.broker = localStorage.getItem('mqtt_broker') || "wss://broker.hivemq.com:8884/mqtt";
        this.layout = JSON.parse(localStorage.getItem('pico_layout')) || cards.map(c => c.id);
        
        this.llave = {
            "admin": HASH_REAL 
        };

        this.init();
    }

    init() {
        // Verificar Login
        if(localStorage.getItem('pico_pass') === "OK") {
            this.showInterface();
        } else {
            document.getElementById('btn-login').onclick = () => this.checkLogin();
        }

        // Recuperar Tema
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeText(theme);
    }

    checkLogin() {
        const input = document.getElementById('pass-input').value;
        // Aquí deberías desencriptar tu hash real
        // Para este ejemplo simple, asumimos que si el input no está vacío, entra.
        // EN PRODUCCIÓN: Usa CryptoJS para comparar.
        if(input === "admin") { // CAMBIA ESTO POR TU LÓGICA SEGURA
            localStorage.setItem('pico_pass', "OK");
            this.showInterface();
        } else {
            alert("Contraseña incorrecta");
        }
    }

    showInterface() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-interface').style.display = 'flex'; // Flex para centrar
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
            this.mqtt.subscribe('PicoOS_92834/#'); // TU TOPIC SECRETO
        });

        this.mqtt.on('message', (topic, msg) => {
            const val = msg.toString();
            // 1. Estado Pico (Sistema)
            if(topic.includes('/estado')) this.updatePicoStatus(val);

            // 2. Tarjetas
            cards.forEach(c => {
                if(topic.includes(c.id) && c.onData) c.onData(val, this, this);
            });
        });
    }

    pub(subtopic, msg, retain=false) {
        if(this.mqtt) {
            this.mqtt.publish(`PicoOS_92834/${subtopic}`, msg.toString(), {retain: retain});
        }
    }

    updatePicoStatus(val) {
        try {
            const data = JSON.parse(val); // Espera {temp: 35, ram: 20}
            document.getElementById('pico-temp').innerText = data.temp + "°C";
            document.getElementById('pico-ram').innerText = data.ram + "%";
        } catch(e) {}
    }

    setupUI() {
        // --- GESTIÓN DE MENÚS (NUEVO) ---
        const closeAll = () => document.querySelectorAll('.custom-dropdown').forEach(e => e.classList.remove('open'));
        
        // Broker
        document.getElementById('broker-trigger').onclick = (e) => {
            e.stopPropagation();
            const open = document.getElementById('broker-menu').classList.contains('open');
            closeAll();
            if(!open) document.getElementById('broker-menu').classList.add('open');
        };

        // Ajustes
        document.getElementById('settings-trigger').onclick = (e) => {
            e.stopPropagation();
            const open = document.getElementById('settings-menu').classList.contains('open');
            closeAll();
            if(!open) document.getElementById('settings-menu').classList.add('open');
        };

        window.onclick = () => closeAll();

        // --- ACCIONES MENÚ AJUSTES ---
        
        // 1. EDITAR
        document.getElementById('btn-edit').onclick = () => {
            document.body.classList.toggle('edit-mode');
            const editing = document.body.classList.contains('edit-mode');
            
            const icon = editing ? '<i class="fa-solid fa-check" style="color:#32d74b; width:20px"></i>' : '<i class="fa-solid fa-pen-ruler" style="width:20px"></i>';
            const text = editing ? "Terminar Edición" : "Editar Diseño";
            document.getElementById('btn-edit').innerHTML = `${icon} ${text}`;

            if(!editing) this.saveLayout();
        };

        // 2. TEMA
        document.getElementById('btn-theme').onclick = () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            this.updateThemeText(next);
        };

        // 3. SALIR
        document.getElementById('btn-logout').onclick = () => {
            if(confirm("¿Cerrar sesión?")) {
                localStorage.removeItem('pico_pass');
                location.reload();
            }
        };

        // Selección de Broker
        document.querySelectorAll('#broker-menu .dropdown-item').forEach(item => {
            item.onclick = () => {
                const url = item.getAttribute('data-broker');
                localStorage.setItem('mqtt_broker', url);
                location.reload();
            };
        });
    }

    updateThemeText(theme) {
        const btn = document.getElementById('btn-theme');
        if(theme === 'dark') btn.innerHTML = '<i class="fa-solid fa-sun" style="width:20px"></i> Tema Claro';
        else btn.innerHTML = '<i class="fa-solid fa-moon" style="width:20px"></i> Tema Oscuro';
    }

    enableDrag() {
        // (Código Drag & Drop simplificado para no alargar más)
        // Usa SortableJS si quieres algo pro, o tu implementación previa
    }

    saveLayout() {
        const newLayout = Array.from(document.querySelectorAll('.card')).map(div => div.getAttribute('data-id'));
        this.layout = newLayout;
        localStorage.setItem('pico_layout', JSON.stringify(newLayout));
    }
}

new PicoCore();
