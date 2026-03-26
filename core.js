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
        this.confPrivada = null; // 🚀 Almacena la llave E2EE personal cuando visitas un Canal
        this.canalActivo = null; // 🚀 Almacena los datos del canal actual
        this.perfilDB = null; 
        this.mqtt = null;
        this.rol = "guest";
        this.editMode = false;
        
        // 🚀 CONEXIÓN A LA NUBE SUPABASE
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
    // 🛡️ BLOQUE 0: NÚCLEO, SEGURIDAD Y DEPURACIÓN EXTREMA
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

            if (!document.getElementById('eruda-script')) {
                const script = document.createElement('script');
                script.id = 'eruda-script';
                script.src = "https://cdn.jsdelivr.net/npm/eruda";
                script.onload = () => { 
                    eruda.init(); 
                    this.sysLog('SEC', 'Inyección', 'Terminal Eruda (GOD MODE) en línea.', 'info'); 
                };
                document.head.appendChild(script);
            }
        } else {
            const ofuscador = () => {};
            console.log = ofuscador;
            console.info = ofuscador;
            console.warn = ofuscador;
            console.error = (...args) => {
                if (this.rol === 'admin') {
                    window._consolaOriginal.warn("⚠️ [SISTEMA] Alerta de seguridad interceptada. Reporte al GOD.");
                }
            };
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
            
            if (dataExtra) { 
                try { log(JSON.parse(JSON.stringify(dataExtra))); } 
                catch(e) { log("[Payload Complejo/Binario]", dataExtra); } 
            }
            if ((tipo === 'error' || tipo === 'err') && solucion) {
                log(`%c💡 FIX: %c${solucion}`, `color: #32d74b; font-weight: bold;`, `color: inherit; font-weight: normal;`);
            }
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
        this.sysLog('SYS', 'Modulos', 'Comprobando librerías en caché...');
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
                        script.onload = resolve; script.onerror = reject;
                        document.head.appendChild(script);
                    });
                    this.sysLog('SYS', 'Inyección', `Módulo cargado: ${nombre}`);
                } catch(e) {
                    this.sysLog('SYS', 'Error Fatal', `Fallo al montar ${nombre}`, 'err');
                }
            }
        }
        setTimeout(() => this.buscarActualizacionesSilenciosas(), 10000);
    }

    async buscarActualizacionesSilenciosas() {
        this.sysLog('NET', 'Update', 'Buscando actualizaciones en npmjs...');
        let hayNovedades = false;
        const nuevasVersiones = { ...this.versiones };
        for (const pkg of ["crypto-js", "@mlc-ai/web-llm"]) {
            try {
                const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
                const data = await res.json();
                if (data.version && data.version !== this.versiones[pkg]) {
                    nuevasVersiones[pkg] = data.version; hayNovedades = true;
                    this.sysLog('SYS', 'Update', `Parche disponible para ${pkg}: v${data.version}`);
                }
            } catch (e) {}
        }
        if (hayNovedades) {
            localStorage.setItem('pico_libs_versions', JSON.stringify(nuevasVersiones));
            this.notificar("Actualización interna lista (Se aplicará al recargar)", "🔄");
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
                    if (this.perfilDB.interfaz.tema && ['dark', 'light'].includes(this.perfilDB.interfaz.tema)) {
                        document.body.setAttribute('data-theme', this.perfilDB.interfaz.tema);
                        localStorage.setItem('theme', this.perfilDB.interfaz.tema);
                    }
                    if (this.perfilDB.interfaz.estilo) {
                        document.body.setAttribute('data-estilo', this.perfilDB.interfaz.estilo);
                    } else {
                        document.body.setAttribute('data-estilo', 'pico');
                    }
                }
            } catch (e) { this.sysLog('SYS', 'Caché', 'Caché local corrupta, esperando a DB.', 'warn', e); }
        } else {
            this.initSeguridadRoles();
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
        this.iniciarAgenteProactivo();
        this.initBaseDeDatos();
        this.initInterruptorIA();
        this.initSubidaAvatares();

        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };
        const btnHuella = document.getElementById('btn-huella');
        if(btnHuella) btnHuella.onclick = (e) => { e.preventDefault(); this.manejarHuella(); };
        
        const linkRegister = document.getElementById('link-toggle-register');
        const btnRegisterSubmit = document.getElementById('btn-register-submit');
        const btnLogin = document.getElementById('btn-login');
        const pass2Input = document.getElementById('pass2-input');
        
        if (linkRegister) {
            let isRegisterMode = false;
            linkRegister.onclick = (e) => {
                e.preventDefault();
                isRegisterMode = !isRegisterMode;
                if (isRegisterMode) {
                    pass2Input.style.display = 'block';
                    btnRegisterSubmit.style.display = 'block';
                    btnLogin.style.display = 'none';
                    if (btnHuella) btnHuella.style.display = 'none';
                    linkRegister.innerText = "Ya tengo cuenta (Iniciar sesión)";
                } else {
                    pass2Input.style.display = 'none';
                    btnRegisterSubmit.style.display = 'none';
                    btnLogin.style.display = 'block';
                    if (btnHuella) btnHuella.style.display = 'block';
                    linkRegister.innerText = "Crear usuario nuevo";
                }
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
        if(userProfileMenu) {
            userProfileMenu.onclick = () => { document.getElementById('side-menu').classList.remove('open'); this.abrirAjustesUsuario(); this.vibra("tick"); };
        }
        
        const btnPlaza = document.getElementById('btn-nav-plaza');
        if (btnPlaza) {
            btnPlaza.addEventListener('click', () => {
                document.getElementById('plaza-view').style.display = 'block';
                document.getElementById('side-menu').classList.remove('open');
                this.cargarPlazaPublica();
            });
        }
        
        // 🚀 ENGANCHE BOTONES CANAL (UI)
        const btnSalirCanal = document.getElementById('btn-salir-canal');
        if (btnSalirCanal) btnSalirCanal.onclick = () => this.salirCanal();
        
        const btnCrearCanal = document.getElementById('btn-crear-canal');
        if (btnCrearCanal) btnCrearCanal.onclick = () => this.crearCanal();

        // 🚀 ENGANCHE BOTONES MOSTRAR/COPIAR CREDENCIALES
        document.querySelectorAll('.btn-reveal-cred').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = btn.querySelector('i');
                if(input.type === 'password') { input.type = 'text'; icon.className = 'fa-solid fa-eye-slash'; } 
                else { input.type = 'password'; icon.className = 'fa-solid fa-eye'; }
            };
        });

        document.querySelectorAll('.btn-copy-cred').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                navigator.clipboard.writeText(input.value).then(() => { this.notificar("Copiado al portapapeles", "✅"); });
            };
        });

        document.getElementById('btn-edit').onclick = () => this.toggleEdit();
        document.getElementById('btn-theme').onclick = () => this.toggleTheme();
        if(document.getElementById('btn-logout')) document.getElementById('btn-logout').onclick = () => this.cerrarSesion();

        const swJarvis = document.getElementById('sw-jarvis');
        if (swJarvis) {
            swJarvis.addEventListener('change', (e) => { if (e.target.checked) this.iniciarCentinelaAudio(); else this.detenerCentinelaAudio(); });
        }
        
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
        settingsTrigger.onclick = (e) => {
            e.stopPropagation();
            brokerMenu.classList.remove('open'); settingsMenu.classList.toggle('open');
        };
        window.onclick = (e) => {
            if(!document.getElementById('broker-trigger')?.contains(e.target)) brokerMenu?.classList.remove('open');
            if(!settingsTrigger?.contains(e.target)) settingsMenu?.classList.remove('open');
        };

        const loginScreen = document.getElementById('login-screen');
        const u = localStorage.getItem("u");
        if(u) document.getElementById('user-input').value = u;

        this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                this.sysLog('SEC', 'AutoLogin', 'Sesión segura recuperada. Saltando pantalla de login.');
                this.usuarioLogueado = session.user;
                if (loginScreen) loginScreen.style.display = 'none';
                this.cargarDatosDespuesDeLogin(session.access_token);
            } else {
                if (loginScreen) { 
                    loginScreen.style.display = 'flex'; 
                    loginScreen.style.opacity = '1'; 
                    loginScreen.style.pointerEvents = 'auto'; 
                }
            }
        });

        document.getElementById('btn-ai-send').onclick = () => this.procesarComandoIA();
        document.getElementById('ai-input').onkeypress = (e) => { if(e.key==='Enter') this.procesarComandoIA(); };
        
        window.addEventListener('online', () => this.setNetworkStatus(true));
        window.addEventListener('offline', () => this.setNetworkStatus(false));
        this.sincronizarColaOffline();
        setTimeout(() => this.comprobarActualizaciones(true), 3000);
    }

    // ==========================================================
    // 🔐 BLOQUE 1: IDENTIDAD, AUTENTICACIÓN Y SEGURIDAD DB
    // ==========================================================

    guardarBovedaHardware(confData, tokenJWT) {
        if (!tokenJWT) return;
        const huella = this.generarHuellaDispositivo(tokenJWT);
        const salt = CryptoJS.lib.WordArray.random(128/8);
        const iv = CryptoJS.lib.WordArray.random(128/8);
        const llaveFuerte = CryptoJS.PBKDF2(huella, salt, { keySize: 256/32, iterations: 5000 });
        const cifrado = CryptoJS.AES.encrypt(JSON.stringify(confData), llaveFuerte, { iv: iv }).toString();
        const payloadFinal = `${salt.toString()}::${iv.toString()}::${cifrado}`;
        localStorage.setItem('pico_hardware_vault', payloadFinal);
        this.sysLog('SEC', 'Vault', 'Bóveda local sellada con PBKDF2 y Token de Sesión.');
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
            } else {
                const bytes = CryptoJS.AES.decrypt(payload, huella);
                return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            }
        } catch (e) {
            this.sysLog('SEC', 'Vault Err', 'Intento de apertura fallido.', 'err');
            return null;
        }
    }
    
    generarHuellaDispositivo(tokenJWT = null) {
        const n = navigator; const s = screen;
        const componentes = [n.userAgent, s.width + "x" + s.height + "x" + s.colorDepth, tokenJWT ? tokenJWT.substring(tokenJWT.length - 32) : "pre-login-state"];
        const stringBase = componentes.join("||");
        let hash = 5381;
        for (let i = 0; i < stringBase.length; i++) hash = ((hash << 5) + hash) + stringBase.charCodeAt(i);
        return "fp-" + Math.abs(hash).toString(16);
    }
   
    obtenerNombreDispositivo(huella) {
        const ua = navigator.userAgent; let navegador = "Navegador", so = "Dispositivo";
        if (ua.includes("Firefox")) navegador = "Firefox"; else if (ua.includes("Chrome")) navegador = "Chrome";
        if (ua.includes("Win")) so = "Windows"; else if (ua.includes("Android")) so = "Android"; else if (ua.includes("Mac")) so = "Mac";
        const identificadorUnico = huella ? huella.substring(huella.length - 4) : "0000";
        return `${navegador} en ${so} (${identificadorUnico})`;
    }
    
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
            const functionUrl = 'https://piruxdxdvynacdtjbjux.supabase.co/functions/v1/login-seguro';
            
            const req = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.supabase.supabaseKey}` },
                body: JSON.stringify({ email: emailAuth, password: p, device_id: deviceId, device_name: deviceName })
            });
            
            if (!req.ok) throw new Error(`Credenciales inválidas`);
            const data = await req.json();
            await this.supabase.auth.setSession(data.session);
            this.usuarioLogueado = data.user;
            const tokenJWT = data.session.access_token;

            // Perfil
            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (dbError || !perfilNube) throw new Error("Perfil no encontrado.");
            this.perfilDB = perfilNube;
            this.rol = this.perfilDB.rol;

            // 🚀 MIGRACIÓN A TABLA HOGARES: Ahora las llaves residen en la tabla "hogares"
            const { data: miHogar } = await this.supabase.from('hogares').select('*').eq('owner_id', this.usuarioLogueado.id).single();
            if (!miHogar) {
                this.sysLog('SEC', 'Init', 'Forjando nuevo Hogar (Canal) y Llaves de Hardware...');
                const nuevoTopic = `pico/ch_${Date.now()}/`;
                const nuevaClave = CryptoJS.lib.WordArray.random(32).toString();
                
                await this.supabase.from('hogares').insert({
                    owner_id: this.usuarioLogueado.id, nombre: "Frecuencia Privada", topic_base: nuevoTopic, pico_tk: nuevaClave
                });
                
                this.conf = { topic: nuevoTopic, tk: nuevaClave, escudo_url: "wss://tu_servidor_python.onrender.com/ws" };
                this.notificar("Frecuencia base construida", "📻");
            } else {
                this.conf = { topic: miHogar.topic_base, tk: miHogar.pico_tk, escudo_url: "wss://tu_servidor_python.onrender.com/ws" };
            }

            this.guardarBovedaHardware(this.conf, tokenJWT);
            this.initSeguridadRoles();
            
            this.restaurarEstadoCanal();

            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || u.split('@')[0];
            if (this.perfilDB.avatar_url) {
                const iconoMenu = document.querySelector('#user-profile-menu i');
                if(iconoMenu) iconoMenu.outerHTML = `<img src="${this.perfilDB.avatar_url}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary); margin-bottom: 10px; object-fit: cover;">`;
            }

            sessionStorage.setItem('pico_sesion_ok', 'true');
            localStorage.setItem("u", u); 
            
            document.getElementById('login-screen').style.display = 'none';
            if(this.rol === 'admin' || this.rol === 'god') { document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important')); }
            
            this.renderGrid();
            this.conectar();
            this.comprobarSolicitudesPendientes();
            this.logHUD("Login completado y Bóveda sellada.", "✅");

        } catch (error) {  
            document.getElementById('error-msg').innerText = "❌ " + error.message;
            document.getElementById('error-msg').style.display = 'block'; 
            document.querySelector('.login-box').classList.add('error-shake');
            setTimeout(()=>document.querySelector('.login-box').classList.remove('error-shake'), 500);
        }
    }

    async cargarDatosDespuesDeLogin(tokenJWT) {
        try {
            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (dbError || !perfilNube) throw new Error("Perfil DB no encontrado.");
            this.perfilDB = perfilNube;
            this.rol = this.perfilDB.rol;
            
            this.conf = this.abrirBovedaHardware(tokenJWT);
            if (!this.conf) throw new Error("Caché local borrada. Inicia sesión manualmente.");
            
            this.initSeguridadRoles();
            this.restaurarEstadoCanal();

            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || "USUARIO";
            if (this.perfilDB.avatar_url) {
                const iconoMenu = document.querySelector('#user-profile-menu i');
                if(iconoMenu) iconoMenu.outerHTML = `<img src="${this.escapeHTML(this.perfilDB.avatar_url)}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary); margin-bottom: 10px; object-fit: cover;">`;
            }
            
            if(this.rol === 'admin' || this.rol === 'god') { document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important')); }
            
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
                const ban = document.getElementById('canal-activo-banner');
                const btn = document.getElementById('btn-salir-canal');
                if(nom) { nom.innerText = cData.nombre; nom.style.color = '#0a84ff'; }
                if(ban) ban.style.borderColor = '#0a84ff';
                if(btn) btn.style.display = 'block';
            }, 500);
        }
    }

    cerrarSesion() {
        sessionStorage.removeItem('pico_sesion_ok');
        if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
        if(this.supabase) this.supabase.auth.signOut();
        document.getElementById('pass-input').value = "";
        document.getElementById('login-screen').style.display = 'flex'; 
        document.getElementById('side-menu').classList.remove('open');
    }

    // ==========================================================
    // 💾 BLOQUE 3: AUTO-GUARDADO Y AJUSTES DE PERFIL
    // ==========================================================

    async autoGuardarPerfil() {
        if(!this.usuarioLogueado) return;
        const datosActualizados = {
            avatar_url: document.getElementById('input-perfil-avatar')?.value.trim() || null,
            nombre: document.getElementById('input-perfil-nombre')?.value.trim() || null,
            alias: document.getElementById('input-perfil-alias')?.value.trim() || null,
            idioma: document.getElementById('select-perfil-idioma')?.value || 'es-ES',
            estado_online: document.getElementById('check-estado-online')?.checked !== false,
            ia: {
                nube: document.getElementById('select-ia-nube')?.value || 'groq',
                local: document.getElementById('select-ia-local')?.value || 'smollm'
            },
            interfaz: {
                sonidos: document.getElementById('check-ui-sonidos')?.checked === true,
                vibracion: document.getElementById('sw-vibration')?.checked !== false,
                estilo: document.getElementById('select-perfil-estilo')?.value || 'pico',
                tema: document.body.getAttribute('data-theme') || 'dark'
            }
        };

        document.body.setAttribute('data-estilo', datosActualizados.interfaz.estilo);
        
        const displayUser = document.getElementById('display-username');
        if (displayUser) displayUser.innerText = datosActualizados.alias || datosActualizados.nombre || "USUARIO";
        if (datosActualizados.avatar_url) {
            const avatarImg = document.querySelector('#user-profile-menu img');
            if (avatarImg) avatarImg.src = datosActualizados.avatar_url; 
        }

        await this.supabase.from('perfiles').update(datosActualizados).eq('id', this.usuarioLogueado.id);
        this.perfilDB = { ...this.perfilDB, ...datosActualizados };
    }

    abrirAjustesUsuario() {
        const modal = document.getElementById('user-settings-modal');
        if(!modal) return;
        const p = this.perfilDB || {};
        
        if(document.getElementById('input-perfil-nombre')) document.getElementById('input-perfil-nombre').value = p.nombre || '';
        if(document.getElementById('input-perfil-alias')) document.getElementById('input-perfil-alias').value = p.alias || '';
        
        // 🚀 Inyectamos las credenciales de Hardware reales en los inputs protegidos
        const hwTopic = document.getElementById('hw-topic-input');
        const hwTk = document.getElementById('hw-tk-input');
        
        if(hwTopic && hwTk) {
            // Mostramos la llave Privada original, independientemente de si estamos visitando otro canal
            const topicReal = this.confPrivada ? this.confPrivada.topic : (this.conf ? this.conf.topic : 'Error');
            const tkReal = this.confPrivada ? this.confPrivada.tk : (this.conf ? this.conf.tk : 'Error');
            hwTopic.value = topicReal;
            hwTk.value = tkReal;
        }

        modal.style.display = 'flex';
        document.getElementById('btn-close-user-settings').onclick = () => modal.style.display = 'none';

        const triggerSave = () => this.autoGuardarPerfil();
        ['input-perfil-nombre', 'input-perfil-alias', 'check-ui-sonidos', 'sw-vibration', 'check-estado-online'].forEach(id => {
            const el = document.getElementById(id); if(el) el.onchange = triggerSave; if(el) el.onblur = triggerSave;
        });
    }

    initSubidaAvatares() {
        const btnUpload = document.getElementById('btn-upload-avatar');
        const fileInput = document.getElementById('file-avatar-upload');
        const urlInput = document.getElementById('input-perfil-avatar');

        if (!btnUpload || !fileInput || !urlInput) return;
        btnUpload.onclick = (e) => { e.preventDefault(); fileInput.click(); };

        fileInput.onchange = async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const iconoOriginal = btnUpload.innerHTML;
            btnUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            this.notificar("Subiendo imagen al servidor...", "⏳");
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `avatar_${this.usuarioLogueado.id}_${Date.now()}.${fileExt}`;
                const { error } = await this.supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
                if (error) throw error;
                const { data: publicUrlData } = this.supabase.storage.from('avatars').getPublicUrl(fileName);
                urlInput.value = publicUrlData.publicUrl;
                this.notificar("¡Imagen subida!", "✅");
                this.autoGuardarPerfil(); 
            } catch (err) { this.notificar("Error al subir la imagen", "❌"); } 
            finally { btnUpload.innerHTML = iconoOriginal; fileInput.value = ''; }
        };
    }

    // ==========================================================
    // 🌐 BLOQUE 4: RED, MQTT Y ESTADO DE DISPOSITIVOS
    // ==========================================================

    async conectar() {
        if (!this.conf || !this.conf.escudo_url) return;
        const wsUrl = this.conf.escudo_url;
        this.ws = new WebSocket(wsUrl);
        const dot = document.getElementById('mqtt-dot');

        this.ws.onopen = async () => {
            this.setNetworkStatus(true);
            if (dot) dot.className = "dot green";
            const { data: { session } } = await this.supabase.auth.getSession();
            
            this.ws.send(JSON.stringify({ 
                accion: "cambiar_broker", 
                host: this.brokers[this.brIdx].h,
                auth_token: session ? session.access_token : null,
                topic_base: this.conf.topic 
            }));
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.tipo === "mqtt") {
                const app = data.topic.split("/").pop();
                let val = data.payload;
                try { val = JSON.parse(val); } catch(e){}
                
                if (app === "sistema_hb" || app === "sistema" || (val && val.sistema)) this.updatePicoStatus(val);
                this.cards.forEach(c => {
                    if(c.id === app || (c.subs && c.subs.includes(app))) {
                        if(c.onData) c.onData(val, app, this);
                    }
                });
            } else if (data.tipo === "ia_respuesta") {
                this.desplegarPayloadCuantico(data.texto, data.orden, data.modo);
            }
        };

        this.ws.onclose = () => {
            this.setNetworkStatus(false);
            if (dot) dot.className = "dot red";
            setTimeout(() => this.conectar(), 3000); 
        };
    }

    pub(app, v, r) { 
        if(this.ws?.readyState === WebSocket.OPEN) {
            this.cmd(app, v);
        }
    }

    cmd(app, c) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.colaOffline.push({app, c});
            return this.notificar("Sin conexión. Orden en cola", "❌");
        }
        try {
            if (typeof CryptoJS === 'undefined') throw new Error("CryptoJS no cargó.");
            if (!this.conf) throw new Error("No hay maletín encriptado.");
            if (!this.conf.tk) throw new Error("Falta la clave secreta PICO_TK.");

            const paqueteFisico = JSON.stringify({ c: c, n: Date.now() });
            const paqueteCifrado = CryptoJS.AES.encrypt(paqueteFisico, this.conf.tk).toString();
            this.ws.send(JSON.stringify({ accion: "comando", app: app, comando: paqueteCifrado }));
            
        } catch (error) { this.notificar(`Fallo E2EE: ${error.message}`, "❌"); }
    }

    sincronizarColaOffline() {
        if (this.colaOffline.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.colaOffline.forEach((orden, i) => { setTimeout(() => this.cmd(orden.app, orden.c), i * 200); });
            this.colaOffline = []; 
        }
    }

    setNetworkStatus(isOnline) {
        if(isOnline) {
            if(this._wasOffline) { this.notificar("Conexión Recuperada", "🌐"); this._wasOffline = false; }
            this.sincronizarColaOffline();
        } else {
            this.notificar("Sin conexión al Escudo", "⚠️");
            this.vibra("error"); this._wasOffline = true;
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
            item.onclick = async () => {
                this.brIdx = idx; current.innerText = b.name; menu.classList.remove('open');
                this.setupBrokerMenu(); this.notificar(`Enrutando a ${b.name}...`, "🔀");
                
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    const { data: { session } } = await this.supabase.auth.getSession();
                    this.ws.send(JSON.stringify({ 
                        accion: "cambiar_broker", host: b.h, auth_token: session ? session.access_token : null, topic_base: this.conf.topic 
                    }));
                }
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
    // 🎨 BLOQUE 5: MOTOR UI Y TARJETAS
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

    // ==========================================================
    // 📻 BLOQUE 9: FRECUENCIAS Y CANALES (Supabase Mapped)
    // ==========================================================

    async cargarCanales() {
        this.sysLog('NET', 'Canales', 'Buscando canales a los que tienes acceso...');
        const lista = document.getElementById('lista-canales-publicos');
        const btnCrear = document.getElementById('btn-crear-canal');
        
        if (!lista) return;
        lista.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary); font-size:2rem;"></i></div>';

        if (this.tienePermiso('admin') && btnCrear) {
            btnCrear.style.setProperty('display', 'block', 'important');
        }

        try {
            // Buscamos las filas en la tabla 'hogares' donde eres dueño o invitado
            const { data: misCasas, error: errC } = await this.supabase.from('hogares').select('*').eq('owner_id', this.usuarioLogueado.id);
            const { data: accesos, error: errA } = await this.supabase.from('accesos_hogares').select('hogar_id').eq('invitado_id', this.usuarioLogueado.id);
            
            let canalesAcceso = [...misCasas];
            if (accesos && accesos.length > 0) {
                const idsInvitado = accesos.map(a => a.hogar_id);
                const { data: casasInvitado } = await this.supabase.from('hogares').select('*').in('id', idsInvitado);
                if (casasInvitado) canalesAcceso = canalesAcceso.concat(casasInvitado);
            }

            lista.innerHTML = '';
            if (canalesAcceso.length === 0) {
                lista.innerHTML = '<p style="color:var(--text-sec); text-align:center; font-size:0.9rem;">El éter está vacío. No hay canales.</p>';
                return;
            }

            canalesAcceso.forEach(canal => {
                const isOwner = canal.owner_id === this.usuarioLogueado.id;
                const isActivo = this.canalActivo && this.canalActivo.id === canal.id;
                const badge = isActivo ? `<span style="background:#32d74b; color:black; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; margin-left:10px;">SINTONIZADO</span>` : (isOwner ? '<span style="background:var(--primary); color:white; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; margin-left:10px;">PROPIO</span>' : '');
                
                lista.innerHTML += `
                <div class="user-card glass-element cascade-in" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid ${isActivo ? '#32d74b' : 'var(--border)'};">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="background: rgba(10, 132, 255, 0.1); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #0a84ff; font-size: 1.2rem; border: 1px solid rgba(10, 132, 255, 0.3);">
                            <i class="fa-solid fa-tower-broadcast"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span style="font-weight: 800; color: var(--text-main); font-size: 1rem;">${this.escapeHTML(canal.nombre)} ${badge}</span>
                            <span style="font-size: 0.75rem; color: var(--text-sec); font-family: monospace;">CH-${canal.id.substring(0,8).toUpperCase()}</span>
                        </div>
                    </div>
                    <button class="btn-action" onclick="window.App.unirseCanal('${canal.id}', '${this.escapeHTML(canal.nombre)}', '${this.escapeHTML(canal.topic_base)}', '${this.escapeHTML(canal.pico_tk)}')" style="width: auto; background: ${isActivo ? 'transparent' : 'var(--primary)'}; border: ${isActivo ? '1px solid #32d74b' : 'none'}; color: ${isActivo ? '#32d74b' : 'white'}; padding: 8px 15px; font-size: 0.85rem; margin: 0;" ${isActivo ? 'disabled' : ''}>
                        ${isActivo ? '<i class="fa-solid fa-check"></i>' : 'Sintonizar'}
                    </button>
                </div>`;
            });
        } catch (e) {
            this.sysLog('NET', 'Canales Err', e.message, 'err');
            lista.innerHTML = '<p style="color:#ff453a; text-align:center; font-size:0.9rem;">Error al interceptar frecuencias.</p>';
        }
    }

    async crearCanal() {
        if (!this.tienePermiso('admin')) return;
        const nombre = prompt("Nombre del nuevo Canal:");
        if (!nombre) return;

        this.notificar("Forjando canal cifrado...", "⚙️");
        try {
            const topicBase = `pico/ch_${Date.now()}/`;
            const pTk = CryptoJS.lib.WordArray.random(32).toString();

            const { error } = await this.supabase.from('hogares').insert({
                nombre: nombre,
                topic_base: topicBase,
                pico_tk: pTk,
                owner_id: this.usuarioLogueado.id
            });

            if (error) throw error;
            this.notificar("Canal operativo", "✅");
            this.cargarCanales();
        } catch (e) {
            this.notificar("Fallo al crear el canal", "❌");
        }
    }

    async unirseCanal(id, nombre, topic, tk) {
        this.sysLog('NET', 'Sintonizar', `Sintonizando: ${nombre}`);
        
        if (!this.confPrivada) {
            this.confPrivada = { topic: this.conf.topic, tk: this.conf.tk };
        }

        this.conf.topic = topic;
        this.conf.tk = tk;
        this.canalActivo = { id, nombre };

        sessionStorage.setItem('pico_canal_activo', JSON.stringify({
            id, nombre, topic, tk, privada: this.confPrivada
        }));

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ accion: "set_topic", topic_base: topic }));
        }

        document.getElementById('dashboard-grid').innerHTML = "";
        this.renderGrid(); 
        
        document.getElementById('canal-activo-nombre').innerText = nombre;
        document.getElementById('canal-activo-nombre').style.color = '#0a84ff';
        document.getElementById('canal-activo-banner').style.borderColor = '#0a84ff';
        document.getElementById('btn-salir-canal').style.display = 'block';
        
        this.notificar(`Conectado a: ${nombre}`, "📻");
        this.vibra("doble");
        this.cargarCanales(); 
    }

    async salirCanal() {
        if (!this.confPrivada) return;

        this.sysLog('NET', 'Sintonizar', 'Volviendo al Canal Privado');
        
        this.conf.topic = this.confPrivada.topic;
        this.conf.tk = this.confPrivada.tk;
        this.canalActivo = null;

        sessionStorage.removeItem('pico_canal_activo');

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ accion: "set_topic", topic_base: this.conf.topic }));
        }

        document.getElementById('dashboard-grid').innerHTML = "";
        this.renderGrid(); 
        
        document.getElementById('canal-activo-nombre').innerText = 'Canal Privado';
        document.getElementById('canal-activo-nombre').style.color = 'white';
        document.getElementById('canal-activo-banner').style.borderColor = '#32d74b';
        document.getElementById('btn-salir-canal').style.display = 'none';

        this.notificar("Canal Privado restaurado", "🔒");
        this.vibra("tick");
        this.cargarCanales();
    }
}
