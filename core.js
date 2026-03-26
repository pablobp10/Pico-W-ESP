// =========================================================================
// ARCHIVO: core.js (Motor Principal de Pico OS)
// =========================================================================

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
import { TermostatoCard } from './cards/termostato.js';
import { PlantaCard } from './cards/planta.js';
import { EnergiaCard } from './cards/energia.js';
import { SintetizadorCard } from './cards/sintetizador.js';
import { OCRCard } from './cards/ocr.js';
import { ConscienciaCard } from './cards/mood.js';
import { GeneradorPrompt } from './prompt.js';
import { createClient } from 'https://esm.run/@supabase/supabase-js';

export class Core {
    constructor() {
        this.cards = [
            TiempoCard, ListaCard, MegafonoCard, LedCard, SensoresCard,
            PomodoroCard, DadoCard, CalculadoraCard, FiestaCard, FindCard,
            RelojCard, SeguridadCard, AlmaCard, ColorCard, MedidorCard, QrCard, TestCard, TermostatoCard,
            PlantaCard, EnergiaCard, SintetizadorCard, OCRCard, ConscienciaCard
        ];
        this.conf = null;
        this.confPrivada = null;
        this.canalActivo = null;
        this.perfilDB = null; 
        this.miHogarId = null;
        this.rol = "guest";
        this.editMode = false;
        
        // CONEXIÓN A LA NUBE SUPABASE
        const supabaseUrl = 'https://piruxdxdvynacdtjbjux.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcnV4ZHhkdnluYWNkdGpianV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjc3MDAsImV4cCI6MjA4ODg0MzcwMH0.iLBhbFRInA21_QLNJp57qQ7SJPPivq4c_XzUywBum6w';
        this.supabase = createClient(supabaseUrl, supabaseKey);
        
        this.usuarioLogueado = null;
        this.brokers = [
            { h: "broker.hivemq.com", p: 8884, name: "HiveMQ" },
            { h: "broker.emqx.io", p: 8084, name: "EMQX" }, 
            { h: "public.mqtthq.com", p: 8084, name: "MQTTHQ" },
            { h: "test.mosquitto.org", p: 8081, name: "Mosquitto" }
        ];
        this.brIdx = 0;
        this.colaOffline = [];

        window.App = this;
        this.arranqueSeguro();
    }

    // ==========================================================
    // 🛡️ BLOQUE 0: NÚCLEO Y SEGURIDAD
    // ==========================================================
    
    initSeguridadRoles() {
        if (!window._consolaOriginal) {
            window._consolaOriginal = { log: console.log, warn: console.warn, error: console.error, info: console.info };
        }
        if (this.rol === 'god') {
            console.log = window._consolaOriginal.log;
            console.warn = window._consolaOriginal.warn;
            console.error = window._consolaOriginal.error;
            console.info = window._consolaOriginal.info;
        } else {
            const ofuscador = () => {};
            console.log = ofuscador; console.info = ofuscador; console.warn = ofuscador;
            console.error = (...args) => { if (this.rol === 'admin') window._consolaOriginal.warn("⚠️ Alerta de seguridad interceptada."); };
        }
    }

    sysLog(modulo, accion, mensaje, tipo = "info", dataExtra = null, solucion = null) {
        if (this.rol === 'god') {
            const metodo = tipo === 'err' || tipo === 'error' ? 'error' : tipo === 'warn' ? 'warn' : 'log';
            const log = console[metodo] || console.log; 
            const colores = { net: "#0a84ff", sec: "#ff453a", db: "#bf5af2", ia: "#32d74b", sys: "#ff9f0a", mqtt: "#00c7be" };
            const color = colores[modulo.toLowerCase()] || "#a1a1aa";
            const timestamp = new Date().toISOString().split('T')[1].slice(0,-1);
            log(`%c[${timestamp}] [${modulo.toUpperCase()}] %c${accion.toUpperCase()}:`, `color: ${color}; font-weight: bold;`, `color: inherit; font-weight: normal;`, mensaje);
            if (dataExtra) { try { log(JSON.parse(JSON.stringify(dataExtra))); } catch(e) { log("[Payload]", dataExtra); } }
        }
        this.logHUD(`[${modulo.toUpperCase()}] ${accion}: ${mensaje}`, tipo, dataExtra, solucion);
    }

    tienePermiso(rolRequerido) {
        const jerarquia = { 'guest': 1, 'admin': 2, 'god': 3 };
        const miNivel = jerarquia[this.rol] || 1;
        const reqNivel = jerarquia[rolRequerido || 'guest']; 
        return miNivel >= reqNivel;
    }

    escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

    async arranqueSeguro() {
        this.sysLog('SYS', 'Boot', 'Secuencia de ignición iniciada.');
        await this.inicializarModulos();
        this.init(); 
    }

    async inicializarModulos() {
        this.versiones = JSON.parse(localStorage.getItem('pico_libs_versions')) || {
            "@mlc-ai/web-llm": "0.2.81", "paho-mqtt": "1.0.1", "crypto-js": "4.2.0", "sortable": "1.15.0"
        };
        this.librerias = {
            crypto: `https://cdnjs.cloudflare.com/ajax/libs/crypto-js/${this.versiones["crypto-js"]}/crypto-js.min.js`,
            mqtt: `https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/${this.versiones["paho-mqtt"]}/mqttws31.min.js`,
            sortable: `https://cdnjs.cloudflare.com/ajax/libs/Sortable/${this.versiones["sortable"]}/Sortable.min.js`
        };
        for (const [nombre, url] of Object.entries(this.librerias)) {
            if (!document.querySelector(`script[src="${url}"]`)) {
                try {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script'); script.src = url;
                        script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
                    });
                } catch(e) {}
            }
        }
    }

    init() {
        const cacheLocal = localStorage.getItem('pico_perfil_cache');
        if (cacheLocal) {
            try {
                this.perfilDB = JSON.parse(cacheLocal);
                this.rol = this.perfilDB.rol || "guest";
                this.initSeguridadRoles();
                if (this.perfilDB.interfaz) {
                    if (this.perfilDB.interfaz.tema) document.body.setAttribute('data-theme', this.perfilDB.interfaz.tema);
                    if (this.perfilDB.interfaz.estilo) document.body.setAttribute('data-estilo', this.perfilDB.interfaz.estilo);
                }
            } catch (e) {}
        }

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
        this.initBaseDeDatos();
        this.initInterruptorIA();
        this.initSubidaAvatares();
        this.initColaNotificaciones();

        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };
        
        const linkRegister = document.getElementById('link-toggle-register');
        const btnRegisterSubmit = document.getElementById('btn-register-submit');
        const btnLogin = document.getElementById('btn-login');
        const pass2Input = document.getElementById('pass2-input');
        
        if (linkRegister) {
            let isRegisterMode = false;
            linkRegister.onclick = (e) => {
                e.preventDefault();
                isRegisterMode = !isRegisterMode;
                pass2Input.style.display = isRegisterMode ? 'block' : 'none';
                btnRegisterSubmit.style.display = isRegisterMode ? 'block' : 'none';
                btnLogin.style.display = isRegisterMode ? 'none' : 'block';
                linkRegister.innerText = isRegisterMode ? "Ya tengo cuenta (Iniciar sesión)" : "Crear usuario nuevo";
            };
        }

        if (btnRegisterSubmit) {
            btnRegisterSubmit.onclick = () => {
                const u = document.getElementById('user-input').value;
                const p1 = document.getElementById('pass-input').value;
                const p2 = pass2Input.value;
                this.registrarUsuario(u, p1, p2);
            };
        }

        const userProfileMenu = document.getElementById('user-profile-menu');
        if(userProfileMenu) userProfileMenu.onclick = () => { document.getElementById('side-menu').classList.remove('open'); this.abrirAjustesUsuario(); this.vibra("tick"); };
        
        const btnSalirCanal = document.getElementById('btn-salir-canal');
        if (btnSalirCanal) btnSalirCanal.onclick = () => this.salirCanal();
        
        const btnCrearCanal = document.getElementById('btn-crear-canal');
        if (btnCrearCanal) btnCrearCanal.onclick = () => this.crearCanal();

        document.querySelectorAll('.btn-reveal-cred').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const input = document.getElementById(btn.getAttribute('data-target'));
                const icon = btn.querySelector('i');
                if(input.type === 'password') { input.type = 'text'; icon.className = 'fa-solid fa-eye-slash'; } 
                else { input.type = 'password'; icon.className = 'fa-solid fa-eye'; }
            };
        });

        document.querySelectorAll('.btn-copy-cred').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(document.getElementById(btn.getAttribute('data-target')).value).then(() => { this.notificar("Copiado", "✅"); });
            };
        });

        document.getElementById('btn-edit').onclick = () => this.toggleEdit();
        document.getElementById('btn-theme').onclick = () => this.toggleTheme();
        if(document.getElementById('btn-logout')) document.getElementById('btn-logout').onclick = () => this.cerrarSesion();

        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active'); this.filtroActual = e.target.dataset.filter;
                this.vibra('tick'); this.renderGrid(); 
            });
        });

        const settingsTrigger = document.getElementById('settings-trigger');
        const settingsMenu = document.getElementById('settings-menu');
        const brokerMenu = document.getElementById('broker-menu');
        settingsTrigger.onclick = (e) => { e.stopPropagation(); brokerMenu.classList.remove('open'); settingsMenu.classList.toggle('open'); };
        window.onclick = (e) => {
            if(!document.getElementById('broker-trigger')?.contains(e.target)) brokerMenu?.classList.remove('open');
            if(!settingsTrigger?.contains(e.target)) settingsMenu?.classList.remove('open');
        };

        this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                this.usuarioLogueado = session.user;
                document.getElementById('login-screen').style.display = 'none';
                this.cargarDatosDespuesDeLogin(session.access_token);
            } else {
                document.getElementById('login-screen').style.display = 'flex'; 
            }
        });

        document.getElementById('btn-ai-send').onclick = () => this.procesarComandoIA();
        document.getElementById('ai-input').onkeypress = (e) => { if(e.key==='Enter') this.procesarComandoIA(); };
        
        window.addEventListener('online', () => this.setNetworkStatus(true));
        window.addEventListener('offline', () => this.setNetworkStatus(false));
    }

    // ==========================================================
    // 🔐 BLOQUE 1: IDENTIDAD Y AUTENTICACIÓN
    // ==========================================================

    guardarBovedaHardware(confData, tokenJWT) {
        if (!tokenJWT) return;
        const huella = this.generarHuellaDispositivo(tokenJWT);
        const salt = CryptoJS.lib.WordArray.random(128/8);
        const iv = CryptoJS.lib.WordArray.random(128/8);
        const llaveFuerte = CryptoJS.PBKDF2(huella, salt, { keySize: 256/32, iterations: 5000 });
        const cifrado = CryptoJS.AES.encrypt(JSON.stringify(confData), llaveFuerte, { iv: iv }).toString();
        localStorage.setItem('pico_hardware_vault', `${salt.toString()}::${iv.toString()}::${cifrado}`);
    }

    abrirBovedaHardware(tokenJWT) {
        if (!tokenJWT) return null;
        const payload = localStorage.getItem('pico_hardware_vault');
        if (!payload) return null;
        try {
            const huella = this.generarHuellaDispositivo(tokenJWT);
            const partes = payload.split('::');
            if (partes.length === 3) {
                const salt = CryptoJS.enc.Hex.parse(partes[0]);
                const iv = CryptoJS.enc.Hex.parse(partes[1]);
                const llaveFuerte = CryptoJS.PBKDF2(huella, salt, { keySize: 256/32, iterations: 5000 });
                const bytes = CryptoJS.AES.decrypt(partes[2], llaveFuerte, { iv: iv });
                return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            }
        } catch (e) { return null; }
    }
    
    generarHuellaDispositivo(tokenJWT = null) {
        const n = navigator; const s = screen;
        const comp = [n.userAgent, s.width + "x" + s.height + "x" + s.colorDepth, tokenJWT ? tokenJWT.substring(tokenJWT.length - 32) : "pre-login"];
        const stringBase = comp.join("||");
        let hash = 5381; for (let i = 0; i < stringBase.length; i++) hash = ((hash << 5) + hash) + stringBase.charCodeAt(i);
        return "fp-" + Math.abs(hash).toString(16);
    }
   
    obtenerNombreDispositivo(huella) { return navigator.userAgent.includes("Win") ? "Windows" : "Dispositivo"; }
    
    async registrarUsuario(u, p1, p2) {
        if (!u || !u.includes('@') || p1 !== p2 || p1.length < 6) return this.notificar("Datos inválidos", "⚠️");
        document.getElementById('btn-register-submit').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        try {
            const { error } = await this.supabase.auth.signUp({ email: u.trim(), password: p1 });
            if (error) throw error;
            this.notificar("Revisa tu correo para confirmar.", "📩");
            document.getElementById('link-toggle-register').click();
        } catch (error) { this.notificar("Fallo al registrar", "❌"); } 
        finally { document.getElementById('btn-register-submit').innerHTML = 'ENVIAR SOLICITUD'; }
    }

    async login() {
        const u = document.getElementById('user-input').value.trim();
        const p = document.getElementById('pass-input').value.trim();
        const emailAuth = u.includes('@') ? u : `${u}@pico.os`;
        this.notificar("Iniciando acceso seguro...", "⏳");

        try {
            const deviceId = this.generarHuellaDispositivo(); 
            const deviceName = this.obtenerNombreDispositivo(deviceId);
            const req = await fetch('https://piruxdxdvynacdtjbjux.supabase.co/functions/v1/login-seguro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.supabase.supabaseKey}` },
                body: JSON.stringify({ email: emailAuth, password: p, device_id: deviceId, device_name: deviceName })
            });
            
            if (!req.ok) throw new Error(`Credenciales inválidas`);
            const data = await req.json();
            await this.supabase.auth.setSession(data.session);
            this.usuarioLogueado = data.user;
            const tokenJWT = data.session.access_token;

            const { data: perfilNube } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            this.perfilDB = perfilNube;
            this.rol = this.perfilDB.rol;

            const { data: miHogar } = await this.supabase.from('hogares').select('*').eq('owner_id', this.usuarioLogueado.id).single();
            if (!miHogar) {
                const nuevoTopic = `pico/ch_${Date.now()}/`;
                const nuevaClave = CryptoJS.lib.WordArray.random(32).toString();
                await this.supabase.from('hogares').insert({ owner_id: this.usuarioLogueado.id, nombre: "Frecuencia Privada", topic_base: nuevoTopic, pico_tk: nuevaClave });
                this.conf = { topic: nuevoTopic, tk: nuevaClave };
            } else {
                this.conf = { topic: miHogar.topic_base, tk: miHogar.pico_tk };
                this.miHogarId = miHogar.id;
            }

            this.guardarBovedaHardware(this.conf, tokenJWT);
            this.initSeguridadRoles();
            this.restaurarEstadoCanal();

            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || u.split('@')[0];
            if (this.perfilDB.avatar_url) {
                const iconoMenu = document.querySelector('#user-profile-menu i');
                if(iconoMenu) iconoMenu.outerHTML = `<img src="${this.perfilDB.avatar_url}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary); object-fit: cover;">`;
            }

            localStorage.setItem("u", u); 
            document.getElementById('login-screen').style.display = 'none';
            if(this.rol === 'admin' || this.rol === 'god') document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            
            this.renderGrid();
            this.conectar();
            this.comprobarSolicitudesPendientes();
            this.notificar("Acceso concedido", "✅");
        } catch (error) {  
            document.getElementById('error-msg').innerText = "❌ " + error.message;
            document.getElementById('error-msg').style.display = 'block'; 
        }
    }

    async cargarDatosDespuesDeLogin(tokenJWT) {
        try {
            const { data: perfilNube } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            this.perfilDB = perfilNube;
            this.rol = this.perfilDB.rol;

            const { data: miHogar } = await this.supabase.from('hogares').select('id').eq('owner_id', this.usuarioLogueado.id).single();
            if (miHogar) this.miHogarId = miHogar.id;
            
            this.conf = this.abrirBovedaHardware(tokenJWT);
            if (!this.conf) throw new Error("Caché local borrada.");
            
            this.initSeguridadRoles();
            this.restaurarEstadoCanal();

            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || "USUARIO";
            
            if(this.rol === 'admin' || this.rol === 'god') document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            
            this.renderGrid();
            this.conectar();
            this.comprobarSolicitudesPendientes();
            this.notificar("Sesión restaurada", "🔐");
        } catch (error) { this.cerrarSesion(); }
    }

    restaurarEstadoCanal() {
        const canalGuardado = sessionStorage.getItem('pico_canal_activo');
        if (canalGuardado) {
            const cData = JSON.parse(canalGuardado);
            this.confPrivada = cData.privada;
            this.conf.topic = cData.topic;
            this.conf.tk = cData.tk;
            this.canalActivo = { id: cData.id, nombre: cData.nombre };
            setTimeout(() => {
                const nom = document.getElementById('canal-activo-nombre');
                if(nom) nom.innerText = cData.nombre;
                const btn = document.getElementById('btn-salir-canal');
                if(btn) btn.style.display = 'block';
            }, 500);
        }
    }

    cerrarSesion() {
        sessionStorage.removeItem('pico_sesion_ok');
        if(this.suscripcionRealtime) this.supabase.removeChannel(this.suscripcionRealtime);
        if(this.supabase) this.supabase.auth.signOut();
        document.getElementById('login-screen').style.display = 'flex'; 
    }

    // ==========================================================
    // 💾 BLOQUE 2: AUTO-GUARDADO Y AJUSTES DE PERFIL
    // ==========================================================

    async autoGuardarPerfil() {
        if(!this.usuarioLogueado) return;
        const datosActualizados = {
            avatar_url: document.getElementById('input-perfil-avatar')?.value.trim() || null,
            nombre: document.getElementById('input-perfil-nombre')?.value.trim() || null,
            alias: document.getElementById('input-perfil-alias')?.value.trim() || null,
            idioma: document.getElementById('select-perfil-idioma')?.value || 'es-ES',
            interfaz: {
                sonidos: document.getElementById('check-ui-sonidos')?.checked === true,
                vibracion: document.getElementById('sw-vibration')?.checked !== false,
                estilo: document.getElementById('select-perfil-estilo')?.value || 'pico',
                tema: document.body.getAttribute('data-theme') || 'dark'
            }
        };
        document.body.setAttribute('data-estilo', datosActualizados.interfaz.estilo);
        await this.supabase.from('perfiles').update(datosActualizados).eq('id', this.usuarioLogueado.id);
        this.perfilDB = { ...this.perfilDB, ...datosActualizados };
    }

    abrirAjustesUsuario() {
        const modal = document.getElementById('user-settings-modal');
        if(!modal) return;
        const p = this.perfilDB || {};
        
        if(document.getElementById('input-perfil-nombre')) document.getElementById('input-perfil-nombre').value = p.nombre || '';
        if(document.getElementById('input-perfil-alias')) document.getElementById('input-perfil-alias').value = p.alias || '';
        
        const hwTopic = document.getElementById('hw-topic-input');
        const hwTk = document.getElementById('hw-tk-input');
        if(hwTopic && hwTk) {
            hwTopic.value = this.confPrivada ? this.confPrivada.topic : (this.conf ? this.conf.topic : '');
            hwTk.value = this.confPrivada ? this.confPrivada.tk : (this.conf ? this.conf.tk : '');
        }

        modal.style.display = 'flex';
        document.getElementById('btn-close-user-settings').onclick = () => modal.style.display = 'none';

        const triggerSave = () => this.autoGuardarPerfil();
        ['input-perfil-nombre', 'input-perfil-alias', 'check-ui-sonidos', 'sw-vibration', 'check-estado-online'].forEach(id => {
            const el = document.getElementById(id); if(el) { el.onchange = triggerSave; el.onblur = triggerSave; }
        });
    }

    initSubidaAvatares() {
        const btnUpload = document.getElementById('btn-upload-avatar');
        const fileInput = document.getElementById('file-avatar-upload');
        if (!btnUpload || !fileInput) return;
        btnUpload.onclick = (e) => { e.preventDefault(); fileInput.click(); };
        fileInput.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            btnUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            try {
                const fileName = `avatar_${this.usuarioLogueado.id}_${Date.now()}.${file.name.split('.').pop()}`;
                await this.supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
                const { data } = this.supabase.storage.from('avatars').getPublicUrl(fileName);
                document.getElementById('input-perfil-avatar').value = data.publicUrl;
                this.autoGuardarPerfil(); this.notificar("¡Imagen subida!", "✅");
            } catch (err) {} 
            finally { btnUpload.innerHTML = '<i class="fa-solid fa-folder-open"></i>'; }
        };
    }

    // ==========================================================
    // 🌐 BLOQUE 3: RED (SUPABASE REALTIME Y WEBHOOKS)
    // ==========================================================

    async conectar() {
        if (!this.conf) return;
        this.setNetworkStatus(true);
        const dot = document.getElementById('mqtt-dot');
        if (dot) dot.className = "dot green";

        const hogarTargetId = this.canalActivo ? this.canalActivo.id : this.miHogarId;
        if (!hogarTargetId) return;

        if (this.suscripcionRealtime) this.supabase.removeChannel(this.suscripcionRealtime);

        this.sysLog('NET', 'Sintonizando', `Escuchando telemetría del canal: ${hogarTargetId.substring(0,8)}`);

        this.suscripcionRealtime = this.supabase.channel('custom-all-channel')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'estado_hogares', filter: `hogar_id=eq.${hogarTargetId}` }, (payload) => {
                const datos = payload.new;
                if (!datos || !datos.estado_modulos) return;
                const telemetria = datos.estado_modulos;
                
                this.updatePicoStatus(telemetria);
                this.cards.forEach(c => {
                    if (telemetria[c.id] && c.onData) c.onData(telemetria[c.id], c.id, this);
                });
            })
            .subscribe((status) => {
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    this.setNetworkStatus(false);
                    if (dot) dot.className = "dot red";
                    setTimeout(() => this.conectar(), 3000); 
                }
            });
    }

    pub(app, v, r) { 
        this.cmd(app, v);
    }

    async cmd(app, c) {
        if (!navigator.onLine) {
            this.colaOffline.push({app, c});
            return this.notificar("Sin conexión. Orden en cola", "❌");
        }
        try {
            const paqueteFisico = JSON.stringify({ c: c, n: Date.now() });
            const paqueteCifrado = CryptoJS.AES.encrypt(paqueteFisico, this.conf.tk).toString();
            
            const hogarTargetId = this.canalActivo ? this.canalActivo.id : this.miHogarId;
            const brokerActual = this.brokers[this.brIdx].h;

            const { error } = await this.supabase.from('cola_comandos').insert({
                hogar_id: hogarTargetId, app: app, comando: paqueteCifrado,
                broker_host: brokerActual, topic_base: this.conf.topic, pico_tk: this.conf.tk
            });
            if (error) throw error;
            this.sysLog('DB', 'TX', `Comando inyectado en cola para [${app}]`);
        } catch (error) { 
            this.notificar(`Fallo de transmisión: ${error.message}`, "❌"); 
        }
    }

    sincronizarColaOffline() {
        if (this.colaOffline.length > 0 && navigator.onLine) {
            this.colaOffline.forEach((orden, i) => { setTimeout(() => this.cmd(orden.app, orden.c), i * 200); });
            this.colaOffline = []; 
        }
    }

    setNetworkStatus(isOnline) {
        if(isOnline) {
            if(this._wasOffline) { this.notificar("Conexión Recuperada", "🌐"); this._wasOffline = false; }
            this.sincronizarColaOffline();
        } else {
            this.notificar("Sin conexión al Escudo", "⚠️"); this.vibra("error"); this._wasOffline = true;
        }
    }

    setupBrokerMenu() {
        const menu = document.getElementById('broker-menu');
        const current = document.getElementById('current-broker-name');
        current.innerText = this.brokers[this.brIdx].name;
        menu.innerHTML = "";
        this.brokers.forEach((b, idx) => {
            const item = document.createElement('div');
            item.className = `dropdown-item ${idx === this.brIdx ? 'selected' : ''}`;
            item.innerText = b.name;
            item.onclick = () => {
                this.brIdx = idx; current.innerText = b.name; menu.classList.remove('open');
                this.setupBrokerMenu(); this.notificar(`Enrutando a ${b.name}...`, "🔀");
            };
            menu.appendChild(item);
        });
    }

    updatePicoStatus(val) {
        const container = document.getElementById('pico-status-container');
        if (!container) return;
        const isOnline = val === "ONLINE" || val === "KEEPALIVE" || (val && (val.sistema === "ONLINE" || val.t !== undefined));
        clearTimeout(this.picoWatchdog);
        container.innerHTML = "";
        if (isOnline) {
            this.picoWatchdog = setTimeout(() => { this.updatePicoStatus("OFFLINE"); }, 20000);
            let tempTxt = (val && val.t !== undefined) ? val.t : ((val && val.temp) ? val.temp : "");
            tempTxt = tempTxt !== "" ? this.escapeHTML(String(tempTxt)) + "°C" : "";
            container.innerHTML = `<div class="pico-info-pill"><span style="color:#32d74b; font-weight:bold; font-size:0.8rem">●</span><span style="font-weight:600; color:var(--text-main); margin-right:5px">Online</span>${tempTxt ? `<span style="border-left:1px solid var(--border); padding-left:6px; margin-right:6px; font-size:0.8rem"><i class="fa-solid fa-temperature-half"></i> ${tempTxt}</span>` : ''}</div>`;
        } else {
            container.innerHTML = `<div class="pico-info-pill" style="border-color:var(--text-sec); opacity:0.7"><span class="dot red"></span><span style="font-weight:600; color:var(--text-sec);">Offline</span></div>`;
        }
    }

    // ==========================================================
    // 🎨 BLOQUE 4: RENDERIZADO Y NOTIFICACIONES
    // ==========================================================

    renderGrid() {
        let savedSizes = this.perfilDB?.tarjetas?.tamanos || JSON.parse(localStorage.getItem('pico_card_sizes')) || {};
        const tarjetasFiltradas = this.cards.filter(c => {
            const pasaCategoria = this.filtroActual === 'all' || c.category === this.filtroActual;
            return pasaCategoria && (!c.adminOnly || (this.rol === 'admin' || this.rol === 'god'));
        });
        const grid = document.getElementById('dashboard-grid'); grid.innerHTML = "";
        tarjetasFiltradas.forEach((card, index) => {
            const div = document.createElement('div');
            let currentSize = savedSizes[card.id] || card.defaultSize || '1x1';
            div.className = `card cascade-in size-${currentSize}`;
            div.id = `card-${card.id}`; div.setAttribute('data-id', card.id);
            div.innerHTML = `<div style="position: relative; z-index: 1; width: 100%; height: 100%; background: var(--card-bg); padding: 15px; box-sizing: border-box; border-radius: 20px;">${card.html}</div>`;
            grid.appendChild(div);
            try { if(card.onInit) card.onInit(this); } catch(error) {}
        });
    }

    toggleTheme() { 
        const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next); localStorage.setItem('theme',next);
    }
    initTheme() { const saved = localStorage.getItem('theme'); document.body.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light'); }
    vibra(tipo = "tick") { if (navigator.vibrate) navigator.vibrate(15); }
    toggleEdit() { this.notificar("Modo edición desactivado temporalmente en esta vista", "ℹ️"); }

    initColaNotificaciones() {
        if (document.getElementById('toast-queue-container')) return;
        this.colaNotificaciones = []; this.notificacionActiva = false;
        const style = document.createElement('style');
        style.innerHTML = `#toast-queue-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: flex-start; z-index: 9999; pointer-events: none; width: 90%; max-width: 500px; justify-content: center; } #toast-stack { display: flex; flex-direction: row; align-items: center; padding-top: 2px; } .toast-ball { width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1rem; color: white; border: 2px solid rgba(20, 20, 20, 0.95); margin-right: -22px; box-shadow: -3px 0 8px rgba(0,0,0,0.3); transition: 0.3s; animation: pop-in 0.3s forwards; position: relative; } .toast-ball:last-child { margin-right: 12px; } @keyframes pop-in { 0% { opacity: 0; transform: scale(0) translateX(-10px); } 100% { opacity: 1; transform: scale(1) translateX(0); } } .toast-island { background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; padding: 0; display: flex; align-items: center; max-width: 0; max-height: 0; overflow: hidden; opacity: 0; transition: max-width 0.4s, max-height 0.4s, opacity 0.3s, padding 0.4s; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5); min-height: 36px; } .toast-island.open { max-width: 100vw; max-height: 300px; padding: 10px 18px; opacity: 1; } .toast-content { display: flex; align-items: center; gap: 10px; width: 100%; } .toast-icon-wrapper { width: 28px; height: 28px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 0.9rem; flex-shrink: 0; box-shadow: inset 0 0 5px rgba(0,0,0,0.2); } .toast-text { font-size: 0.9rem; font-weight: 500; line-height: 1.3; overflow-wrap: break-word; word-break: break-word; text-align: left; }`;
        document.head.appendChild(style);
        const container = document.createElement('div'); container.id = 'toast-queue-container';
        container.innerHTML = `<div id="toast-stack"></div><div id="toast-island" class="toast-island"><div class="toast-content"><div id="toast-i" class="toast-icon-wrapper"></div><span id="toast-t" class="toast-text"></span></div></div>`;
        document.body.appendChild(container);
    }

    obtenerColorIcono(icon) {
        if (!icon) return '#48484a';
        if (icon.includes('✅') || icon.includes('🔋') || icon.includes('🌿')) return '#32d74b'; 
        if (icon.includes('❌') || icon.includes('🚨') || icon.includes('🛑') || icon.includes('🗑️')) return '#ff453a'; 
        if (icon.includes('⚠️') || icon.includes('🧹') || icon.includes('⚡') || icon.includes('⏳')) return '#ff9f0a'; 
        if (icon.includes('ℹ️') || icon.includes('🌐') || icon.includes('🔀') || icon.includes('🗣️') || icon.includes('📡') || icon.includes('🔎') || icon.includes('📻')) return '#0a84ff'; 
        if (icon.includes('🧠') || icon.includes('🤖') || icon.includes('🧬') || icon.includes('🎲') || icon.includes('🔮')) return '#bf5af2'; 
        return '#8e8e93'; 
    }

    actualizarBadgeCola() {
        const stack = document.getElementById('toast-stack'); if (!stack) return; stack.innerHTML = '';
        for (let i = this.colaNotificaciones.length - 1; i >= 0; i--) {
            const notif = this.colaNotificaciones[i]; const ball = document.createElement('div');
            ball.className = 'toast-ball'; ball.style.backgroundColor = notif.color; ball.style.zIndex = 100 - i; ball.innerHTML = notif.icon; stack.appendChild(ball);
        }
    }

    notificar(msg, icon = "✅") {
        if (!this.colaNotificaciones) this.initColaNotificaciones();
        const mensajeStr = String(msg || "");
        if (this.colaNotificaciones.length > 0 && this.colaNotificaciones[this.colaNotificaciones.length - 1].msg === mensajeStr) return;
        if (this.notificacionActiva && this.mensajeActual === mensajeStr) return;
        this.colaNotificaciones.push({msg: mensajeStr, icon, color: this.obtenerColorIcono(icon)});
        this.actualizarBadgeCola(); this.procesarSiguienteNotificacion();
    }

    procesarSiguienteNotificacion() {
        if (this.notificacionActiva || this.colaNotificaciones.length === 0) return;
        this.notificacionActiva = true; const actual = this.colaNotificaciones.shift(); this.mensajeActual = actual.msg;
        this.actualizarBadgeCola(); 
        const island = document.getElementById('toast-island'); const iconWrapper = document.getElementById('toast-i'); const textEl = document.getElementById('toast-t');
        iconWrapper.style.backgroundColor = actual.color; iconWrapper.innerHTML = actual.icon; textEl.innerHTML = this.escapeHTML(actual.msg); 
        island.classList.add('open'); this.vibra("tick");
        const tiempoLectura = Math.max(3000, actual.msg.length * 60);
        setTimeout(() => {
            island.classList.remove('open');
            setTimeout(() => { this.notificacionActiva = false; this.mensajeActual = null; this.procesarSiguienteNotificacion(); }, 400); 
        }, tiempoLectura); 
    }

    // ==========================================================
    // 🧠 BLOQUE 5: IA NATIVA Y JARVIS
    // ==========================================================

    initVozJARVIS() {}
    iniciarAgenteProactivo() {}
    initInterruptorIA() {}
    procesarComandoIA() { this.notificar("Procesamiento IA temporalmente inactivo.", "🤖"); }

    // ==========================================================
    // ⚙️ BLOQUE 6: MISCELÁNEA Y HARDWARE VIRTUAL
    // ==========================================================

    ejecutarComandoLocal(app, accion) {
        const comandosLocales = ["Tema", "Edicion", "Vibracion", "Actualizaciones", "Vista", "Filtro", "Consola", "Sesion", "VozIA", "Consciencia", "IA"];
        const hardwareVirtual = ["Dado", "Pomodoro", "Calculadora", "Qr", "Reloj", "Tiempo", "Lista", "Macros"];
        
        if (hardwareVirtual.includes(app)) {
            if (this.logHUD) this.logHUD(`Simulando hardware virtual: ${app} -> ${accion}`, "out");
            if (app === "Dado" && accion === "roll") { this.pub("Dado", Math.floor(Math.random() * 6) + 1, true); } 
            else if (app !== "Macros") { 
                this.pub(app, accion, true); 
                const tarjeta = this.cards.find(c => c.id === app);
                if (tarjeta && tarjeta.onData) tarjeta.onData(accion, app, this);
            }
            return true;
        }

        if (!comandosLocales.includes(app)) return false;
        switch(app) {
            case "Tema": if (accion === "toggle") this.toggleTheme(); break;
            case "Filtro": this.filtroActual = accion; this.renderGrid(); document.querySelectorAll('.filter-pill').forEach(b => { b.classList.remove('active'); if (b.dataset.filter === accion) b.classList.add('active'); }); break;
            case "Consola": const hud = document.getElementById('hud-console'); if (accion === "toggle") this.toggleHUD(); break;
            case "Sesion": if (accion === "logout") this.cerrarSesion(); break;
        }
        return true;
    }

    initAtajosTeclado() {
        window.addEventListener('keydown', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if(e.key.toLowerCase() === 'l') { this.vibra("tick"); const st = document.getElementById('val-Led')?.innerText; if(st) this.pub('Led', st === "ON" ? "off" : "on"); }
            if(e.key === 'h' && this.rol === 'god') this.toggleHUD();
        });
    }

    toggleHUD() {
        if(this.rol !== 'god') return;
        let hud = document.getElementById('hud-console');
        if(!hud) { 
            hud = document.createElement('div'); hud.id = 'hud-console'; document.body.appendChild(hud); 
            this.logHUD("INTERCEPTANDO TRÁFICO MQTT..."); 
        }
        hud.classList.toggle('active');
    }

    logHUD(msg, tipo = "info", dataExtra = null, solucion = null) {
        const hud = document.getElementById('hud-console'); if(!hud) return;
        let textoFinal = `> ${msg}`;
        const linea = document.createElement('div'); linea.className = `hud-msg ${tipo === 'error' || tipo === 'err' ? 'hud-err' : ''}`;
        linea.innerText = `[${new Date().toLocaleTimeString()}] ${textoFinal}`; 
        hud.appendChild(linea); hud.scrollTop = hud.scrollHeight;
    }

    initParallax() {}
    initSwipeGestures() {}
    initSidebar() {
        const trigger = document.querySelector('.pico-os-title'); const menu = document.getElementById('side-menu');
        trigger.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); this.vibra("tick"); });
        document.addEventListener('click', (e) => { if(!menu.contains(e.target) && !trigger.contains(e.target)) menu.classList.remove('open'); });
        
        const btnCanales = document.getElementById('btn-nav-canales');
        if (btnCanales) btnCanales.onclick = () => { 
            document.getElementById('canales-view').style.display = 'block'; 
            menu.classList.remove('open'); 
            this.cargarCanales(); 
        };
    }
    initMultijugador() {}
    initModosExpertos() {}
    initBaseDeDatos() {}
    comprobarSolicitudesPendientes() {}

    // ==========================================================
    // 📻 BLOQUE 8: CANALES Y FRECUENCIAS
    // ==========================================================

    async cargarCanales() {
        this.sysLog('NET', 'Canales', 'Buscando canales...');
        const lista = document.getElementById('lista-canales-publicos');
        const btnCrear = document.getElementById('btn-crear-canal');
        if (!lista) return;
        lista.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary); font-size:2rem;"></i></div>';

        if (this.tienePermiso('admin') && btnCrear) btnCrear.style.setProperty('display', 'block', 'important');

        try {
            const { data: misCasas } = await this.supabase.from('hogares').select('*').eq('owner_id', this.usuarioLogueado.id);
            const { data: accesos } = await this.supabase.from('accesos_hogares').select('hogar_id').eq('invitado_id', this.usuarioLogueado.id);
            
            let canalesAcceso = [...misCasas];
            if (accesos && accesos.length > 0) {
                const { data: casasInvitado } = await this.supabase.from('hogares').select('*').in('id', accesos.map(a => a.hogar_id));
                if (casasInvitado) canalesAcceso = canalesAcceso.concat(casasInvitado);
            }

            lista.innerHTML = '';
            if (canalesAcceso.length === 0) return lista.innerHTML = '<p style="color:var(--text-sec); text-align:center;">El éter está vacío.</p>';

            canalesAcceso.forEach(canal => {
                const isActivo = this.canalActivo && this.canalActivo.id === canal.id;
                lista.innerHTML += `
                <div class="user-card glass-element cascade-in" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid ${isActivo ? '#32d74b' : 'var(--border)'};">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="background: rgba(10, 132, 255, 0.1); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #0a84ff;"><i class="fa-solid fa-tower-broadcast"></i></div>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span style="font-weight: 800; color: var(--text-main); font-size: 1rem;">${this.escapeHTML(canal.nombre)}</span>
                            <span style="font-size: 0.75rem; color: var(--text-sec); font-family: monospace;">CH-${canal.id.substring(0,8).toUpperCase()}</span>
                        </div>
                    </div>
                    <button class="btn-action" onclick="window.App.unirseCanal('${canal.id}', '${this.escapeHTML(canal.nombre)}', '${this.escapeHTML(canal.topic_base)}', '${this.escapeHTML(canal.pico_tk)}')" style="width: auto; background: ${isActivo ? 'transparent' : 'var(--primary)'}; border: ${isActivo ? '1px solid #32d74b' : 'none'}; color: ${isActivo ? '#32d74b' : 'white'}; padding: 8px 15px;">
                        ${isActivo ? '<i class="fa-solid fa-check"></i>' : 'Sintonizar'}
                    </button>
                </div>`;
            });
        } catch (e) { lista.innerHTML = '<p style="color:#ff453a; text-align:center;">Error al interceptar frecuencias.</p>'; }
    }

    async crearCanal() {
        if (!this.tienePermiso('admin')) return;
        const nombre = prompt("Nombre del nuevo Canal:");
        if (!nombre) return;
        this.notificar("Forjando canal cifrado...", "⚙️");
        try {
            await this.supabase.from('hogares').insert({ nombre: nombre, topic_base: `pico/ch_${Date.now()}/`, pico_tk: CryptoJS.lib.WordArray.random(32).toString(), owner_id: this.usuarioLogueado.id });
            this.notificar("Canal operativo", "✅"); this.cargarCanales();
        } catch (e) { this.notificar("Fallo al crear el canal", "❌"); }
    }

    async unirseCanal(id, nombre, topic, tk) {
        if (!this.confPrivada) this.confPrivada = { topic: this.conf.topic, tk: this.conf.tk };
        this.conf.topic = topic; this.conf.tk = tk; this.canalActivo = { id, nombre };
        sessionStorage.setItem('pico_canal_activo', JSON.stringify({ id, nombre, topic, tk, privada: this.confPrivada }));
        
        document.getElementById('dashboard-grid').innerHTML = "";
        this.renderGrid(); this.conectar();
        
        document.getElementById('canal-activo-nombre').innerText = nombre;
        document.getElementById('canal-activo-nombre').style.color = '#0a84ff';
        document.getElementById('canal-activo-banner').style.borderColor = '#0a84ff';
        document.getElementById('btn-salir-canal').style.display = 'block';
        this.notificar(`Conectado a: ${nombre}`, "📻"); this.cargarCanales(); 
    }

    async salirCanal() {
        if (!this.confPrivada) return;
        this.conf.topic = this.confPrivada.topic; this.conf.tk = this.confPrivada.tk; this.canalActivo = null;
        sessionStorage.removeItem('pico_canal_activo');
        
        document.getElementById('dashboard-grid').innerHTML = "";
        this.renderGrid(); this.conectar();
        
        document.getElementById('canal-activo-nombre').innerText = 'Canal Privado';
        document.getElementById('canal-activo-nombre').style.color = 'white';
        document.getElementById('canal-activo-banner').style.borderColor = '#32d74b';
        document.getElementById('btn-salir-canal').style.display = 'none';
        this.notificar("Canal Privado restaurado", "🔒"); this.cargarCanales();
    }
}
