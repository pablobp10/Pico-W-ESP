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
        this.suscripcionRealtime = null; 
        
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

    initSeguridadRoles() {
        if (!window._consolaOriginal) {
            window._consolaOriginal = { log: console.log, warn: console.warn, error: console.error, info: console.info };
        }

        if (this.rol === 'god') {
            console.log = window._consolaOriginal.log;
            console.warn = window._consolaOriginal.warn;
            console.error = window._consolaOriginal.error;
            console.info = window._consolaOriginal.info;

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (!document.getElementById('eruda-script') && isMobile) {
                const script = document.createElement('script');
                script.id = 'eruda-script';
                script.src = "https://cdn.jsdelivr.net/npm/eruda";
                script.onload = () => { 
                    eruda.init(); 
                    this.sysLog('SEC', 'Inyección', 'Terminal Eruda en línea.', 'info'); 
                };
                document.head.appendChild(script);
            }
        } else {
            const ofuscador = () => {};
            console.log = ofuscador;
            console.info = ofuscador;
            console.warn = ofuscador;
            console.error = (...args) => {
                if (this.rol === 'admin') window._consolaOriginal.warn("⚠️ [SISTEMA] Alerta de seguridad interceptada.");
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
            } catch (e) { this.sysLog('SYS', 'Caché', 'Caché local corrupta.', 'warn', e); }
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
        this.initColaNotificaciones();

        const brokerTrigger = document.getElementById('broker-trigger');
        if (brokerTrigger) brokerTrigger.style.display = 'none';

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
                if (isRegisterMode) {
                    pass2Input.style.display = 'block';
                    btnRegisterSubmit.style.display = 'block';
                    btnLogin.style.display = 'none';
                    linkRegister.innerText = "Ya tengo cuenta (Iniciar sesión)";
                } else {
                    pass2Input.style.display = 'none';
                    btnRegisterSubmit.style.display = 'none';
                    btnLogin.style.display = 'block';
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
        
        const btnSalirCanal = document.getElementById('btn-salir-canal');
        if (btnSalirCanal) btnSalirCanal.onclick = () => this.salirCanal();
        
        const btnCrearCanal = document.getElementById('btn-crear-canal');
        if (btnCrearCanal) btnCrearCanal.onclick = () => this.crearCanal();

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
    }

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
                const descifrado = bytes.toString(CryptoJS.enc.Utf8);
                if (!descifrado) return null;
                return JSON.parse(descifrado);
            } else {
                const bytes = CryptoJS.AES.decrypt(payload, huella);
                const descifrado = bytes.toString(CryptoJS.enc.Utf8);
                if (!descifrado) return null;
                return JSON.parse(descifrado);
            }
        } catch (e) {
            this.sysLog('SEC', 'Vault Err', 'Intento de apertura con sesión caducada o manipulada.', 'warn');
            return null;
        }
    }
    
    generarHuellaDispositivo(tokenJWT = null) {
        const n = navigator;
        const s = screen;
        const componentes = [ n.userAgent, s.width + "x" + s.height + "x" + s.colorDepth, tokenJWT ? tokenJWT.substring(tokenJWT.length - 32) : "pre-login-state" ];
        const stringBase = componentes.join("||");
        let hash = 5381;
        for (let i = 0; i < stringBase.length; i++) hash = ((hash << 5) + hash) + stringBase.charCodeAt(i);
        return "fp-" + Math.abs(hash).toString(16);
    }
   
    obtenerNombreDispositivo(huella) {
        const ua = navigator.userAgent; let navegador = "Navegador Desconocido"; let so = "Dispositivo Desconocido";
        if (ua.includes("Firefox")) navegador = "Firefox"; else if (ua.includes("OPR") || ua.includes("Opera")) navegador = "Opera";
        else if (ua.includes("Edg")) navegador = "Edge"; else if (ua.includes("Chrome")) navegador = "Chrome"; else if (ua.includes("Safari")) navegador = "Safari";
        if (ua.includes("Win")) so = "Windows"; else if (ua.includes("Mac")) so = "Mac"; else if (ua.includes("Linux")) so = "Linux";
        else if (ua.includes("Android")) so = "Android"; else if (ua.includes("like Mac")) so = "iOS";
        const identificadorUnico = huella ? huella.substring(huella.length - 4) : "0000";
        return `${navegador} en ${so} (${identificadorUnico})`;
    }
    
    async registrarUsuario(u, p1, p2) {
        if (!u) return this.notificar("Falta el correo electrónico", "❌");
        if (!u.includes('@') || !u.includes('.')) return this.notificar("Debes usar un correo real válido", "⚠️");
        if (p1 !== p2) return this.notificar("Las contraseñas no coinciden", "❌");
        if (p1.length < 6) return this.notificar("Mínimo 6 caracteres", "⚠️");
        
        this.sysLog('SEC', 'Registro', `Intentando crear usuario: ${u}`);
        const btn = document.getElementById('btn-register-submit');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        
        try {
            const { error } = await this.supabase.auth.signUp({ email: u.trim(), password: p1 });
            if (error) throw error;
            
            this.sysLog('SEC', 'Registro', 'Éxito. Correo de confirmación enviado.');
            this.notificar("Revisa tu correo para confirmar la cuenta.", "📩");
            
            document.getElementById('link-toggle-register').click();
            document.getElementById('user-input').value = ""; document.getElementById('pass-input').value = ""; document.getElementById('pass2-input').value = "";
        } catch (error) {
            this.sysLog('SEC', 'Registro Fail', error.message, 'err');
            if (error.message.includes("already registered")) this.notificar("Ese correo ya está registrado", "⚠️");
            else this.notificar("Fallo al registrar", "❌");
        } finally {
            btn.innerHTML = 'ENVIAR SOLICITUD';
        }
    }

    async login() {
        const u = document.getElementById('user-input').value.trim();
        const p = document.getElementById('pass-input').value.trim();
        const emailAuth = u.includes('@') ? u : `${u}@pico.os`;

        this.logHUD("Iniciando secuencia de Login...", "info");

        try {
            const deviceId = this.generarHuellaDispositivo(); 
            const esMovilReal = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            this.esMovil = esMovilReal; 
            const deviceName = this.obtenerNombreDispositivo(deviceId);

            const functionUrl = 'https://piruxdxdvynacdtjbjux.supabase.co/functions/v1/login-seguro';
            const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcnV4ZHhkdnluYWNkdGpianV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjc3MDAsImV4cCI6MjA4ODg0MzcwMH0.iLBhbFRInA21_QLNJp57qQ7SJPPivq4c_XzUywBum6w';

            const req = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
                body: JSON.stringify({ email: emailAuth, password: p, device_id: deviceId, device_name: deviceName })
            });
            
            const rawText = await req.text();
            if (!req.ok) throw new Error(`Credenciales inválidas`);
            
            const data = JSON.parse(rawText);
            await this.supabase.auth.setSession(data.session);
            this.usuarioLogueado = data.user;
            
            const tokenJWT = data.session.access_token;

            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (perfilNube?.rol === 'pendiente') throw new Error("Tu cuenta está en revisión.");
            if (dbError || !perfilNube) throw new Error("Perfil DB no encontrado.");

            this.perfilDB = perfilNube;
            this.rol = this.perfilDB.rol;

            const resHogar = await this.supabase.from('hogares').select('*').eq('owner_id', this.usuarioLogueado.id).limit(1);
            let hogarData = resHogar.data && resHogar.data.length > 0 ? resHogar.data[0] : null;
            
            if (!hogarData) {
                this.sysLog('SEC', 'Init', 'Forjando nuevo Hogar (Canal) y Llaves de Hardware...');
                const nuevoTopic = `pico/ch_${Date.now()}/`;
                const nuevaClave = CryptoJS.lib.WordArray.random(32).toString();
                
                const insercion = await this.supabase.from('hogares').insert({ 
                    owner_id: this.usuarioLogueado.id, nombre: "Frecuencia Privada", topic_base: nuevoTopic, pico_tk: nuevaClave 
                }).select(); 

                if (insercion.error) throw new Error("Bloqueo DB: " + insercion.error.message);
                
                this.conf = { topic: nuevoTopic, tk: nuevaClave };
                this.miHogarId = insercion.data[0].id;
                this.notificar("Frecuencia base construida", "📻");
            } else {
                this.conf = { topic: hogarData.topic_base, tk: hogarData.pico_tk };
                this.miHogarId = hogarData.id;
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
            if(this.rol === 'admin' || this.rol === 'god') document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            
            this.renderGrid();
            this.conectar();
            this.comprobarSolicitudesPendientes();
            
            this.sincronizarColaOffline();
            setTimeout(() => this.comprobarActualizaciones(true), 3000);
            
            this.logHUD("Login completado y Bóveda sellada.", "✅");
            this.notificar("Acceso concedido", "✅");

        } catch (error) {  
            document.getElementById('error-msg').innerText = "❌ " + error.message;
            document.getElementById('error-msg').style.display = 'block'; 
        }
    }

    async cargarDatosDespuesDeLogin(tokenJWT) {
        try {
            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (perfilNube?.rol === 'pendiente') throw new Error("Tu cuenta está en revisión.");
            if (dbError || !perfilNube) throw new Error("Perfil DB no encontrado.");

            this.perfilDB = perfilNube;
            this.rol = this.perfilDB.rol;

            const resHogar = await this.supabase.from('hogares').select('id, topic_base, pico_tk').eq('owner_id', this.usuarioLogueado.id).limit(1);
            let hogarData = resHogar.data && resHogar.data.length > 0 ? resHogar.data[0] : null;
            
            if (!hogarData || !hogarData.pico_tk || hogarData.pico_tk.length < 10) {
                this.sysLog('SEC', 'Auto-Heal', 'Llave maestra no detectada en DB. Reparando...');
                const nuevaClave = CryptoJS.lib.WordArray.random(32).toString();
                const nuevoTopic = hogarData?.topic_base || `pico/ch_${Date.now()}/`;
                
                if (hogarData && hogarData.id) {
                     await this.supabase.from('hogares').update({ pico_tk: nuevaClave, topic_base: nuevoTopic }).eq('id', hogarData.id);
                     hogarData.pico_tk = nuevaClave;
                } else {
                    throw new Error("El hogar maestro no existe. Reloguea para crearlo.");
                }
            }

            this.miHogarId = hogarData.id;
            this.conf = this.abrirBovedaHardware(tokenJWT);
            
            if (!this.conf || !this.conf.tk || this.conf.tk.length < 10) {
                this.sysLog('SEC', 'AutoLogin', 'Bóveda local vacía. Reconstruyendo desde Supabase...', 'warn');
                this.conf = { topic: hogarData.topic_base, tk: hogarData.pico_tk };
                this.guardarBovedaHardware(this.conf, tokenJWT);
            }
            
            this.initSeguridadRoles();
            this.restaurarEstadoCanal();

            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || "USUARIO";
            if (this.perfilDB.avatar_url) {
                const iconoMenu = document.querySelector('#user-profile-menu i');
                if(iconoMenu) iconoMenu.outerHTML = `<img src="${this.escapeHTML(this.perfilDB.avatar_url)}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary); margin-bottom: 10px; object-fit: cover;">`;
            }

            if(this.rol === 'admin' || this.rol === 'god') document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            
            this.renderGrid();
            this.conectar();
            this.comprobarSolicitudesPendientes();
            
            this.sincronizarColaOffline();
            setTimeout(() => this.comprobarActualizaciones(true), 3000);
            
            this.notificar("Acceso concedido", "🔐");
            
        } catch (error) {
            this.sysLog('SEC', 'AutoLogin Error', error.message, 'err');
            this.cerrarSesion();
        }
    }

    restaurarEstadoCanal() {
        const canalGuardado = sessionStorage.getItem('pico_canal_activo');
        if (canalGuardado) {
            try {
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
            } catch(e) { sessionStorage.removeItem('pico_canal_activo'); }
        }
    }

    cerrarSesion() {
        this.sysLog('SEC', 'Logout', 'Limpiando llaves y cerrando sesión.');
        sessionStorage.removeItem('pico_sesion_ok');
        if (this.suscripcionRealtime) { this.supabase.removeChannel(this.suscripcionRealtime); this.suscripcionRealtime = null; }
        if (this.supabase) this.supabase.auth.signOut();

        document.getElementById('pass-input').value = "";
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) { loginScreen.style.display = 'flex'; loginScreen.style.opacity = '1'; loginScreen.style.pointerEvents = 'auto'; }
        
        const sideMenu = document.getElementById('side-menu');
        if (sideMenu) sideMenu.classList.remove('open');
        
        const settingsMenu = document.getElementById('settings-menu');
        if (settingsMenu) settingsMenu.classList.remove('open');
        
        this.notificar("Sesión cerrada", "🔒");
    }

    async guardarPerfilEnNube(datos) {
        if(!this.usuarioLogueado) return false;
        try {
            this.sysLog('DB', 'Update', 'Iniciando escritura en Supabase', 'info', datos);
            const { data, error } = await this.supabase
                .from('perfiles').update(datos).eq('id', this.usuarioLogueado.id).select('updated_at').single();

            if (error) throw error;

            this.perfilDB = { ...this.perfilDB, ...datos };
            localStorage.setItem('pico_perfil_cache', JSON.stringify(this.perfilDB));
            if(data) localStorage.setItem('pico_last_sync', data.updated_at); 
            this.sysLog('DB', 'Update OK', 'Caché local sincronizada con sello de tiempo.');
            return true;
        } catch (err) {
            this.sysLog('DB', 'Update FAIL', err.message, 'err');
            return false;
        }
    }

    async autoGuardarPerfil() {
        if(!this.usuarioLogueado) return;
        this.sysLog('SYS', 'AutoSave', 'Capturando estado de interfaz y ajustando...', 'info');

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

        const exito = await this.guardarPerfilEnNube(datosActualizados);
        if(!exito) this.notificar("Guardado offline. Se subirá al recuperar conexión.", "⚠️");
    }

    abrirAjustesUsuario() {
        const modal = document.getElementById('user-settings-modal');
        if(!modal) return;

        const p = this.perfilDB || {};
        
        if(document.getElementById('input-perfil-avatar')) document.getElementById('input-perfil-avatar').value = p.avatar_url || '';
        if(document.getElementById('input-perfil-nombre')) document.getElementById('input-perfil-nombre').value = p.nombre || '';
        if(document.getElementById('input-perfil-alias')) document.getElementById('input-perfil-alias').value = p.alias || '';
        if(document.getElementById('select-perfil-idioma')) document.getElementById('select-perfil-idioma').value = p.idioma || 'es-ES';
        if(document.getElementById('label-idioma')) document.getElementById('label-idioma').innerText = p.idioma === 'en-US' ? 'English' : 'Español';
        
        const ia = p.ia || { nube: 'groq', local: 'smollm' };
        if(document.getElementById('select-ia-nube')) document.getElementById('select-ia-nube').value = ia.nube || 'groq';
        if(document.getElementById('label-ianube')) {
            const nombresNube = { 'groq': 'GROQ (ULTRA RÁPIDO)', 'google': 'GOOGLE (EQUILIBRADO)', 'openrouter': 'OPENROUTER (LLAMA 3 LIBRE)' };
            document.getElementById('label-ianube').innerText = nombresNube[ia.nube] || 'GROQ (ULTRA RÁPIDO)';
        }

        if(document.getElementById('select-ia-local')) document.getElementById('select-ia-local').value = ia.local || 'smollm';
        if(document.getElementById('label-ialocal')) {
            const nombresLocal = { 
                'smollm': 'SMOLLM (135M)', 'qwen': 'QWEN 1.5 (0.5B)', 'tinyllama': 'TINYLLAMA (1.1B)',
                'gemma': 'GEMMA 2 (2B)', 'phi3': 'PHI-3 MINI (3.8B)', 'mistral': 'MISTRAL (7B)',
                'llama3': 'LLAMA 3 (8B)', 'hermes': 'NOUS HERMES (LLAMA)', 'vicuna': 'VICUNA (7B)', 'wizardlm': 'WIZARDLM (MATES/CÓDIGO)'
            };
            document.getElementById('label-ialocal').innerText = nombresLocal[ia.local] || 'SMOLLM (135M)';
        }

        const ui = p.interfaz || { sonidos: false, vibracion: true, estilo: 'pico', tema: 'dark' };
        if(document.getElementById('check-ui-sonidos')) document.getElementById('check-ui-sonidos').checked = ui.sonidos;
        if(document.getElementById('sw-vibration')) document.getElementById('sw-vibration').checked = ui.vibracion;
        if(document.getElementById('check-estado-online')) document.getElementById('check-estado-online').checked = p.estado_online !== false;
        
        const estiloActual = ui.estilo || (['pico','ios','android','retro'].includes(ui.tema) ? ui.tema : 'pico');
        if(document.getElementById('select-perfil-estilo')) document.getElementById('select-perfil-estilo').value = estiloActual;
        if(document.getElementById('label-estilo')) {
            const nombresTemas = { 'pico': 'PICO OS (CRISTAL)', 'ios': 'APPLE IOS', 'android': 'ANDROID (MATERIAL)', 'retro': 'RETRO (TERMINAL)' };
            document.getElementById('label-estilo').innerText = nombresTemas[estiloActual] || 'PICO OS (CRISTAL)';
        }

        const hwTopic = document.getElementById('hw-topic-input');
        const hwTk = document.getElementById('hw-tk-input');
        if(hwTopic && hwTk) {
            hwTopic.value = this.confPrivada ? this.confPrivada.topic : (this.conf ? this.conf.topic : 'Error - Reconstruyendo');
            hwTk.value = this.confPrivada ? this.confPrivada.tk : (this.conf ? this.conf.tk : 'Error - Reconstruyendo');
        }

        modal.style.display = 'flex';
        document.getElementById('btn-close-user-settings').onclick = () => modal.style.display = 'none';

        const triggerSave = () => this.autoGuardarPerfil();
        ['check-ui-sonidos', 'sw-vibration', 'check-estado-online'].forEach(id => {
            const el = document.getElementById(id); if(el) el.onchange = triggerSave;
        });

        ['input-perfil-avatar', 'input-perfil-nombre', 'input-perfil-alias'].forEach(id => {
            const el = document.getElementById(id); if(el) el.onblur = triggerSave;
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
            this.sysLog('NET', 'Storage', `Subiendo archivo: ${file.name}`);

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `avatar_${this.usuarioLogueado.id}_${Date.now()}.${fileExt}`;

                const { data, error } = await this.supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
                if (error) throw error;

                const { data: publicUrlData } = this.supabase.storage.from('avatars').getPublicUrl(fileName);
                urlInput.value = publicUrlData.publicUrl;
                this.notificar("¡Imagen subida!", "✅");
                this.sysLog('NET', 'Storage OK', `URL Pública: ${publicUrlData.publicUrl}`);
                
                this.autoGuardarPerfil(); 
            } catch (err) {
                this.sysLog('NET', 'Storage Error', err.message, 'err');
                this.notificar("Error al subir la imagen", "❌");
            } finally {
                btnUpload.innerHTML = iconoOriginal; fileInput.value = ''; 
            }
        };
    }

    async conectar() {
        if (!this.conf) return;
        this.setNetworkStatus(true);
        const dot = document.getElementById('mqtt-dot');
        if (dot) dot.className = "dot green";

        const hogarTargetId = this.canalActivo ? this.canalActivo.id : this.miHogarId;
        if (!hogarTargetId) {
            this.sysLog('NET', 'Abort', 'ID de Hogar no establecido. Abortando Sintonización.', 'warn');
            return;
        }

        if (this.suscripcionRealtime) {
            this.supabase.removeChannel(this.suscripcionRealtime);
        }

        this.sysLog('NET', 'Sintonizando', `Escuchando telemetría de Canal: ${hogarTargetId.substring(0,8)}`);

        this.suscripcionRealtime = this.supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'estado_hogares', filter: `hogar_id=eq.${hogarTargetId}` },
                (payload) => {
                    const datos = payload.new;
                    if (!datos || !datos.estado_modulos) return;
                    
                    const telemetria = datos.estado_modulos;
                    this.updatePicoStatus(telemetria);
                    
                    this.cards.forEach(c => {
                        if (telemetria[c.id]) {
                            if(c.onData) c.onData(telemetria[c.id], c.id, this);
                        }
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    this.sysLog('NET', 'Enlace OK', 'Sintonizado a la frecuencia de la DB.');
                }
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
            this.sysLog('NET', 'Cola', `Offline. Encolando comando para ${app}.`, 'warn');
            return this.notificar("Sin conexión. Orden en cola", "❌");
        }
        
        try {
            if (typeof CryptoJS === 'undefined') throw new Error("CryptoJS no cargó.");
            
            // 🛡️ PARCHE CONDICIÓN DE CARRERA: Encolar en lugar de forzar cierre de sesión
            if (!this.conf || !this.conf.tk || this.conf.tk.length < 10) {
                this.sysLog('SEC', 'TX Info', 'Clave pendiente en memoria. Encolando orden.', 'warn');
                this.colaOffline.push({app, c});
                return;
            }

            const paqueteFisico = JSON.stringify({ c: c, n: Date.now() });
            const paqueteCifrado = CryptoJS.AES.encrypt(paqueteFisico, this.conf.tk).toString();
            
            const hogarTargetId = this.canalActivo ? this.canalActivo.id : this.miHogarId;
            const brokerActual = this.brokers[this.brIdx].h;

            this.sysLog('MQTT', 'TX', `Enviando comando AES a la DB -> [${app}]`);
            const { error } = await this.supabase.from('cola_comandos').insert({
                hogar_id: hogarTargetId,
                app: app,
                comando: paqueteCifrado,
                broker_host: brokerActual,
                topic_base: this.conf.topic,
                pico_tk: this.conf.tk
            });

            if (error) throw error;
            this.sysLog('DB', 'TX', `Comando inyectado con éxito`);
            
        } catch (error) {
            this.sysLog('SEC', 'TX Err', error.message, 'err');
            this.notificar(`Fallo E2EE: ${error.message}`, "❌");
        }
    }

    sincronizarColaOffline() {
        if (this.colaOffline.length > 0 && navigator.onLine) {
            this.notificar(`Sincronizando ${this.colaOffline.length} comandos pendientes...`, "🔄");
            this.sysLog('NET', 'Sync', `Vaciando cola offline (${this.colaOffline.length} items)`);
            this.colaOffline.forEach((orden, i) => {
                setTimeout(() => this.cmd(orden.app, orden.c), i * 200);
            });
            this.colaOffline = []; 
        }
    }

    setNetworkStatus(isOnline) {
        if(isOnline) {
            if(this._wasOffline) { this.notificar("Conexión Recuperada", "🌐"); this._wasOffline = false; }
            this.sincronizarColaOffline();
        } else {
            this.notificar("Sin conexión a la red", "⚠️");
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
            item.onclick = () => {
                this.brIdx = idx; current.innerText = b.name; menu.classList.remove('open');
                this.setupBrokerMenu(); this.notificar(`Enrutando servidor a ${b.name}...`, "🔀");
                this.sysLog('NET', 'Cambio Broker', `Solicitando rotación hacia ${b.h} en el próximo comando.`);
            };
            menu.appendChild(item);
        });
    }

    updatePicoStatus(val) {
        const container = document.getElementById('pico-status-container');
        const brokerTrigger = document.getElementById('broker-trigger');
        if (!container) return;
        const isOnline = val === "ONLINE" || val === "KEEPALIVE" || (val && (val.sistema === "ONLINE" || val.t !== undefined));
        clearTimeout(this.picoWatchdog);
        
        container.innerHTML = "";
        if (isOnline) {
            if (brokerTrigger) brokerTrigger.style.display = 'flex';
            this.picoWatchdog = setTimeout(() => {
                this.sysLog('SYS', 'Watchdog', 'Timeout. La Pico ha muerto. Forzando OFFLINE.', 'err');
                this.updatePicoStatus("OFFLINE"); 
            }, 20000);
            
            let ramPercent = 0;
            if (val && val.r_pct !== undefined) ramPercent = parseInt(val.r_pct);
            else if (val && val.ram !== undefined) ramPercent = Math.round((((264 * 1024) - parseInt(val.ram)) / (264 * 1024)) * 100);
            if(ramPercent < 0) ramPercent = 0; if(ramPercent > 100) ramPercent = 100;
            let ramColor = ramPercent > 85 ? "#ff453a" : (ramPercent > 60 ? "#ff9f0a" : "var(--text-sec)");

            let tBruto = (val && val.t !== undefined) ? val.t : ((val && val.temp) ? val.temp : "");
            let tempTxt = tBruto !== "" ? this.escapeHTML(String(tBruto)) + "°C" : "";
            
            let rssiBruto = (val && val.rssi) ? val.rssi : -60;
            let rssi = this.escapeHTML(String(rssiBruto));
            let wifiColor = rssi > -50 ? "#32d74b" : (rssi > -70 ? "#ff9f0a" : "#ff453a"); 
            
            container.innerHTML = `
                <div class="pico-info-pill">
                    <span style="color:#32d74b; font-weight:bold; font-size:0.8rem">●</span>
                    <span style="font-weight:600; color:var(--text-main); margin-right:5px">Online</span>
                    ${tempTxt ? `<span style="border-left:1px solid var(--border); padding-left:6px; margin-right:6px; font-size:0.8rem" title="CPU Temp"><i class="fa-solid fa-temperature-half"></i> ${tempTxt}</span>` : ''}
                    <span style="border-left:1px solid var(--border); padding-left:6px; color:${wifiColor}" title="Señal: ${rssi} dBm"><i class="fa-solid fa-wifi"></i></span>
                    <span style="border-left:1px solid var(--border); padding-left:6px; margin-left:6px; font-weight:600; font-size:0.8rem; color:${ramColor}" title="RAM Usada">${ramPercent}%</span>
                </div>`;
        } else {
            if (brokerTrigger) brokerTrigger.style.display = 'none';
            container.innerHTML = `<div class="pico-info-pill" style="border-color:var(--text-sec); opacity:0.7"><span class="dot red"></span><span style="font-weight:600; color:var(--text-sec);">Offline</span></div>`;
        }
    }

    renderGrid() {
        let order = this.perfilDB?.tarjetas?.orden || JSON.parse(localStorage.getItem('gridOrder')) || [];
        let savedSizes = this.perfilDB?.tarjetas?.tamanos || JSON.parse(localStorage.getItem('pico_card_sizes')) || {};

        if(order.length > 0) {
            this.cards.sort((a, b) => {
                const idxA = order.indexOf(a.id); const idxB = order.indexOf(b.id);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            });
        }

        const tarjetasFiltradas = this.cards.filter(c => {
            const pasaCategoria = this.filtroActual === 'all' || c.category === this.filtroActual;
            const pasaRol = this.tienePermiso(c.rol); 
            const pasaLegacy = c.adminOnly ? (this.rol === 'admin' || this.rol === 'god') : true; 
            return pasaCategoria && pasaRol && pasaLegacy;
        });

        const grid = document.getElementById('dashboard-grid');
        grid.innerHTML = "";

        tarjetasFiltradas.forEach((card, index) => {
            const div = document.createElement('div');
            let currentSize = savedSizes[card.id] || card.defaultSize || '1x1';
            div.className = `card cascade-in size-${currentSize}`;
            div.style.animationDelay = `${index * 50}ms`;
            div.style.setProperty('--order', index);
 
            if(card.adminOnly) div.classList.add('admin-only');
            div.id = `card-${card.id}`;
            div.setAttribute('data-id', card.id);
            div.style.position = "relative";
            div.style.overflow = "hidden";
            div.style.padding = "0"; 

            const cardContent = document.createElement('div');
            cardContent.style.cssText = "position: relative; z-index: 1; width: 100%; height: 100%; background: var(--card-bg); padding: 15px; box-sizing: border-box; border-radius: 20px;";
            cardContent.innerHTML = card.html;

            const cardMenu = document.createElement('div');
            cardMenu.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                display: grid; grid-template-columns: repeat(2, max-content); gap: 15px; justify-content: center; align-content: center;
                background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); 
                z-index: 10; pointer-events: none; clip-path: circle(0px at 50% 50%); transition: clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            `;
            
            const btnCustomHtml = card.customAccion ? `
                <button class="btn-c-custom" style="background:none; border:none; color:${card.customAccion.color || '#32d74b'}; font-size:1.8rem; cursor:pointer; transition:0.2s;" title="${card.customAccion.titulo}">
                    <i class="${card.customAccion.icono}"></i>
                </button>
            ` : '';
            cardMenu.innerHTML = `
                ${btnCustomHtml}
                <button class="btn-c-ajustes" style="background:none; border:none; color:white; font-size:1.8rem; cursor:pointer; transition:0.2s;" title="Ajustes"><i class="fa-solid fa-gear"></i></button>
                <button class="btn-c-tamano" style="background:none; border:none; color:#0a84ff; font-size:1.8rem; cursor:pointer; transition:0.2s;" title="Cambiar Tamaño"><i class="fa-solid fa-expand"></i></button>
                <button class="btn-c-cerrar" style="background:none; border:none; color:#ff453a; font-size:1.8rem; cursor:pointer; transition:0.2s;" title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
            `;

            div.appendChild(cardContent); div.appendChild(cardMenu); grid.appendChild(div);

            let pressTimer; let startX = 0, startY = 0; let localX = 0, localY = 0; let isDragging = false;
            
            const activarMenu = () => { cardMenu.style.pointerEvents = "auto"; cardMenu.style.clipPath = `circle(150% at ${localX}px ${localY}px)`; this.vibra("doble"); };
            const cerrarIris = () => { cardMenu.style.pointerEvents = "none"; cardMenu.style.clipPath = `circle(0px at ${localX}px ${localY}px)`; };

            const iniciarToque = (e) => {
                if(this.editMode || e.target.closest('button') || e.target.tagName === 'INPUT') return;
                isDragging = false; startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                const rect = div.getBoundingClientRect(); localX = startX - rect.left; localY = startY - rect.top;
                cardMenu.style.transition = 'none'; cardMenu.style.clipPath = `circle(0px at ${localX}px ${localY}px)`; void cardMenu.offsetWidth; 
                cardMenu.style.transition = 'clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                clearTimeout(pressTimer); pressTimer = setTimeout(() => { if(!isDragging) activarMenu(); }, 700);
            };

            const cancelarToque = () => clearTimeout(pressTimer);
            const marcarArrastre = (e) => { 
                if (isDragging) return;
                const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) { isDragging = true; clearTimeout(pressTimer); }
            };
            
            cardContent.oncontextmenu = (e) => { if(!this.editMode) e.preventDefault(); };
            cardContent.addEventListener('touchstart', iniciarToque, {passive: true}); cardContent.addEventListener('touchend', cancelarToque);
            cardContent.addEventListener('touchcancel', cancelarToque); cardContent.addEventListener('touchmove', marcarArrastre, {passive: true});
            cardContent.addEventListener('mousedown', iniciarToque); cardContent.addEventListener('mouseup', cancelarToque);
            cardContent.addEventListener('mouseleave', cancelarToque); cardContent.addEventListener('mousemove', marcarArrastre);

            cardMenu.querySelector('.btn-c-cerrar').onclick = (e) => { e.stopPropagation(); cerrarIris(); };
            cardMenu.querySelector('.btn-c-ajustes').onclick = (e) => {
                e.stopPropagation(); cerrarIris();
                if (card.abrirAjustes) card.abrirAjustes(this); else this.notificar(`Esta tarjeta no tiene ajustes`, "ℹ️");
            };
            cardMenu.querySelector('.btn-c-tamano').onclick = (e) => {
                e.stopPropagation();
                const anchoPantalla = window.innerWidth; let maxW, maxH;
                if (anchoPantalla <= 600) { maxW = 2; maxH = 4; } else if (anchoPantalla <= 1024) { maxW = 4; maxH = 6; } else { maxW = 10; maxH = 10; }
                const anchosDisponibles = Array.from({length: maxW}, (_, i) => i + 1); const altosDisponibles = Array.from({length: maxH}, (_, i) => i + 1);
                
                this.abrirSelectorRadialDoble(div, anchosDisponibles, altosDisponibles, currentSize, (nuevoTamano) => {
                    cerrarIris(); div.classList.remove(`size-${currentSize}`); div.classList.add(`size-${nuevoTamano}`); currentSize = nuevoTamano;
                    
                    savedSizes[card.id] = nuevoTamano;
                    localStorage.setItem('pico_card_sizes', JSON.stringify(savedSizes));
                    if (this.perfilDB) {
                        if (!this.perfilDB.tarjetas) this.perfilDB.tarjetas = {};
                        this.perfilDB.tarjetas.tamanos = savedSizes;
                        this.guardarPerfilEnNube({ tarjetas: this.perfilDB.tarjetas });
                    }
                    this.vibra("tick");
                    if (this.sortable) this.toggleEdit(); 
                });
            };

            if (card.customAccion) { cardMenu.querySelector('.btn-c-custom').onclick = (e) => { e.stopPropagation(); cerrarIris(); card.customAccion.ejecutar(this); }; }
            
            try { if(card.onInit) card.onInit(this); } 
            catch(error) { this.sysLog('UI', 'Card Init Err', `Error silencioso en ${card.id}`, 'warn', error); }
        });
    }

    abrirSelectorRadialDoble(tarjetaContenedor, anchosDisponibles, altosDisponibles, tamanoActual, callback) {
        const overlay = document.createElement('div'); overlay.className = 'radial-overlay'; overlay.style.zIndex = '20'; 
        const currentAncho = parseInt(tamanoActual.split('x')[0]); const currentAlto = parseInt(tamanoActual.split('x')[1]);
        
        const construirCilindro = (valores) => {
            let caras = [...valores]; while (caras.length < 12) { caras = caras.concat(valores); }
            const numFaces = caras.length; const theta = 360 / numFaces; const radio = Math.round(20 / Math.tan(Math.PI / numFaces)); 
            let html = ''; caras.forEach((val, i) => { html += `<div class="radial-face" data-val="${val}" id="face-${i}" style="transform: rotateX(${i * -theta}deg) translateZ(${radio}px)">${val}</div>`; });
            return { html, numFaces, theta, caras };
        };

        const colAncho = construirCilindro(anchosDisponibles); const colAlto = construirCilindro(altosDisponibles);
        overlay.innerHTML = `
            <div style="font-weight:bold; margin-bottom:15px; color:white; letter-spacing:1px; z-index:100; pointer-events:none;">DIMENSIONES</div>
            <div style="display:flex; gap: 20px; align-items:center; z-index:100;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="font-size:0.7rem; color:var(--text-sec); margin-bottom:5px; pointer-events:none;"><i class="fa-solid fa-arrows-left-right"></i> ANCHO</div>
                    <div class="radial-viewport" id="viewport-ancho" style="width: 60px;"><div class="radial-cylinder" id="cylinder-ancho">${colAncho.html}</div></div>
                </div>
                <div style="font-size:1.5rem; color:var(--text-sec); font-weight:bold; margin-top:20px; z-index:100; pointer-events:none;">×</div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="font-size:0.7rem; color:var(--text-sec); margin-bottom:5px; pointer-events:none;"><i class="fa-solid fa-arrows-up-down"></i> ALTO</div>
                    <div class="radial-viewport" id="viewport-alto" style="width: 60px;"><div class="radial-cylinder" id="cylinder-alto">${colAlto.html}</div></div>
                </div>
            </div>
            <div style="color:var(--text-sec); font-size:0.75rem; margin-top:30px; pointer-events:none; opacity:0.8;">Toca el fondo para guardar</div>
        `;

        tarjetaContenedor.appendChild(overlay); void overlay.offsetWidth; overlay.style.opacity = '1';

        const setupCilindro = (tipo, colData, valorInicial) => {
            const cylinder = overlay.querySelector(`#cylinder-${tipo}`); const viewport = overlay.querySelector(`#viewport-${tipo}`);
            let idxInicial = colData.caras.indexOf(valorInicial); if (idxInicial === -1) idxInicial = 0;
            let anguloActual = idxInicial * colData.theta; cylinder.style.transform = `rotateX(${anguloActual}deg)`;

            let isDragging = false; let startY = 0; let anguloInicial = 0;
            const iluminarCara = () => {
                let normalizedIndex = Math.round(anguloActual / colData.theta) % colData.numFaces; if (normalizedIndex < 0) normalizedIndex += colData.numFaces;
                viewport.querySelectorAll('.radial-face').forEach(f => f.classList.remove('selected'));
                viewport.querySelectorAll('.radial-face')[normalizedIndex].classList.add('selected');
            };
            iluminarCara();

            const onStart = (e) => { isDragging = true; startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; anguloInicial = anguloActual; cylinder.style.transition = 'none'; };
            const onMove = (e) => { if (!isDragging) return; e.preventDefault(); const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; anguloActual = anguloInicial - ((currentY - startY) * 0.6); cylinder.style.transform = `rotateX(${anguloActual}deg)`; iluminarCara(); };
            const onEnd = () => { if (!isDragging) return; isDragging = false; anguloActual = Math.round(anguloActual / colData.theta) * colData.theta; cylinder.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)'; cylinder.style.transform = `rotateX(${anguloActual}deg)`; iluminarCara(); };

            viewport.addEventListener('mousedown', onStart); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onEnd);
            viewport.addEventListener('touchstart', onStart, {passive: false}); window.addEventListener('touchmove', onMove, {passive: false}); window.addEventListener('touchend', onEnd);

            return () => { let idx = Math.round(anguloActual / colData.theta) % colData.numFaces; if (idx < 0) idx += colData.numFaces; return colData.caras[idx]; };
        };

        const getValorAncho = setupCilindro('ancho', colAncho, currentAncho); const getValorAlto = setupCilindro('alto', colAlto, currentAlto);
        let closeTimer; let isClosing = false; let startX = 0, startY = 0;

        const iniciarCierre = (e) => {
            if (e.target.closest('.radial-viewport')) return; if (e.cancelable) e.preventDefault(); e.stopPropagation();
            isClosing = false; startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            clearTimeout(closeTimer); closeTimer = setTimeout(() => {
                if (!isClosing) {
                    isClosing = true; const tamanoElegido = `${getValorAncho()}x${getValorAlto()}`; this.vibra("tick");
                    overlay.style.opacity = '0'; setTimeout(() => { overlay.remove(); callback(tamanoElegido); }, 200);
                }
            }, 200);
        };
        const cancelarCierre = () => clearTimeout(closeTimer);
        const arrastreCierre = (e) => {
            if (isClosing || startX === 0) return;
            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) clearTimeout(closeTimer);
        };

        overlay.oncontextmenu = (e) => e.preventDefault();
        overlay.addEventListener('mousedown', iniciarCierre); overlay.addEventListener('mouseup', cancelarCierre); overlay.addEventListener('mouseleave', cancelarCierre); overlay.addEventListener('mousemove', arrastreCierre);
        overlay.addEventListener('touchstart', iniciarCierre, {passive: false}); overlay.addEventListener('touchend', cancelarCierre); overlay.addEventListener('touchcancel', cancelarCierre); overlay.addEventListener('touchmove', arrastreCierre, {passive: false});
    }

    toggleEdit() {
        this.editMode = !this.editMode;
        const grid = document.getElementById('dashboard-grid'); const btn = document.getElementById('btn-edit');
        if(this.editMode) {
            grid.classList.add('edit-mode'); btn.innerHTML = `<i class="fa-solid fa-check" style="color:var(--primary); width:20px"></i> Ok`; this.vibra("tick");
            this.sortable = new Sortable(grid, { 
                animation: 250, delay: 200, delayOnTouchOnly: true, ghostClass: 'sortable-ghost',
                onEnd: () => {
                    const order = []; document.querySelectorAll('.card').forEach(c=>order.push(c.dataset.id));
                    localStorage.setItem('gridOrder', JSON.stringify(order));
                    if (this.perfilDB) {
                        if (!this.perfilDB.tarjetas) this.perfilDB.tarjetas = {};
                        this.perfilDB.tarjetas.orden = order;
                        this.guardarPerfilEnNube({ tarjetas: this.perfilDB.tarjetas });
                    }
                    this.vibra("tick");
                }
            });
        } else {
            grid.classList.remove('edit-mode'); btn.innerHTML = `<i class="fa-solid fa-pen" style="width:20px"></i> Editar`; 
            if(this.sortable) this.sortable.destroy(); this.vibra("doble");
        }
    }
    
    initTheme() { 
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = (isDark) => document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        const saved = localStorage.getItem('theme');
        if (saved) apply(saved === 'dark'); else apply(systemDark.matches);
        systemDark.addEventListener('change', (e) => { if (!localStorage.getItem('theme')) apply(e.matches); });
    }
    
    toggleTheme() { 
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next); 
        localStorage.setItem('theme',next);
        
        if(this.perfilDB) {
            if(!this.perfilDB.interfaz) this.perfilDB.interfaz = {};
            this.perfilDB.interfaz.tema = next;
            this.guardarPerfilEnNube({ interfaz: this.perfilDB.interfaz });
        }
    }

    vibra(tipo = "tick") {
        const sw = document.getElementById('sw-vibration');
        if (!sw || !sw.checked || !navigator.vibrate) return;
        
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;

        try {
            if (tipo === "tick") navigator.vibrate(15); 
            if (tipo === "doble") navigator.vibrate([20, 40, 20]); 
            if (tipo === "error") navigator.vibrate([50, 50, 50]);
        } catch(e) {}
    }

    initColaNotificaciones() {
        if (document.getElementById('toast-queue-container')) return;
        this.colaNotificaciones = [];
        this.notificacionActiva = false;
        
        const style = document.createElement('style');
        style.innerHTML = `
            #toast-queue-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: flex-start; z-index: 9999; pointer-events: none; width: 90%; max-width: 500px; justify-content: center; }
            #toast-stack { display: flex; flex-direction: row; align-items: center; padding-top: 2px; }
            .toast-ball { width: 32px; height: 32px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1rem; color: white; border: 2px solid rgba(20, 20, 20, 0.95); margin-right: -22px; box-shadow: -3px 0 8px rgba(0,0,0,0.3); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); animation: pop-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; position: relative; }
            .toast-ball:last-child { margin-right: 12px; }
            @keyframes pop-in { 0% { opacity: 0; transform: scale(0) translateX(-10px); } 100% { opacity: 1; transform: scale(1) translateX(0); } }
            .toast-island { background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; padding: 0; display: flex; align-items: center; max-width: 0; max-height: 0; overflow: hidden; opacity: 0; transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s, padding 0.4s; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5); min-height: 36px; }
            .toast-island.open { max-width: 100vw; max-height: 300px; padding: 10px 18px; opacity: 1; }
            .toast-content { display: flex; align-items: center; gap: 10px; width: 100%; }
            .toast-icon-wrapper { width: 28px; height: 28px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 0.9rem; flex-shrink: 0; box-shadow: inset 0 0 5px rgba(0,0,0,0.2); }
            .toast-text { font-size: 0.9rem; font-weight: 500; line-height: 1.3; overflow-wrap: break-word; word-break: break-word; text-align: left; }
        `;
        document.head.appendChild(style);
        
        const container = document.createElement('div');
        container.id = 'toast-queue-container';
        container.innerHTML = `
            <div id="toast-stack"></div>
            <div id="toast-island" class="toast-island">
                <div class="toast-content"><div id="toast-i" class="toast-icon-wrapper"></div><span id="toast-t" class="toast-text"></span></div>
            </div>`;
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
        const stack = document.getElementById('toast-stack');
        if (!stack) return;
        stack.innerHTML = '';
        
        for (let i = this.colaNotificaciones.length - 1; i >= 0; i--) {
            const notif = this.colaNotificaciones[i];
            const ball = document.createElement('div');
            ball.className = 'toast-ball';
            ball.style.backgroundColor = notif.color;
            ball.style.zIndex = 100 - i; 
            ball.innerHTML = notif.icon;
            stack.appendChild(ball);
        }
    }

    notificar(msg, icon = "✅") {
        if (!this.colaNotificaciones) this.initColaNotificaciones();
        
        const mensajeStr = String(msg || "");
        
        if (this.colaNotificaciones.length > 0 && this.colaNotificaciones[this.colaNotificaciones.length - 1].msg === mensajeStr) return;
        if (this.notificacionActiva && this.mensajeActual === mensajeStr) return;
        
        const color = this.obtenerColorIcono(icon);
        this.colaNotificaciones.push({msg: mensajeStr, icon, color});
        
        this.actualizarBadgeCola(); 
        this.procesarSiguienteNotificacion();
    }

    procesarSiguienteNotificacion() {
        if (this.notificacionActiva || this.colaNotificaciones.length === 0) return;
        
        this.notificacionActiva = true;
        const actual = this.colaNotificaciones.shift(); 
        this.mensajeActual = actual.msg;
        
        this.actualizarBadgeCola(); 
        
        const island = document.getElementById('toast-island');
        const iconWrapper = document.getElementById('toast-i');
        const textEl = document.getElementById('toast-t');
        
        iconWrapper.style.backgroundColor = actual.color;
        iconWrapper.innerHTML = actual.icon;
        textEl.innerHTML = this.escapeHTML(actual.msg); 
        
        island.classList.add('open');
        this.vibra("tick");
        
        const tiempoLectura = Math.max(3000, actual.msg.length * 60);
        
        setTimeout(() => {
            island.classList.remove('open');
            setTimeout(() => {
                this.notificacionActiva = false;
                this.mensajeActual = null;
                this.procesarSiguienteNotificacion(); 
            }, 400); 
        }, tiempoLectura); 
    }

    // ==========================================================
    // 🧠 BLOQUE 6: IA NATIVA, JARVIS Y LLM
    // ==========================================================

    initVozJARVIS() {
        const btnVoz = document.querySelector('.fa-robot'); const input = document.getElementById('ai-input');
        if (!btnVoz || (!window.SpeechRecognition && !window.webkitSpeechRecognition)) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition(); recognition.lang = 'es-ES'; recognition.continuous = false; recognition.interimResults = false;

        btnVoz.style.cursor = "pointer";
        btnVoz.onclick = () => { recognition.start(); btnVoz.style.color = "#ff453a"; btnVoz.classList.add("fa-beat-fade"); input.placeholder = "Escuchando órdenes..."; this.vibra("tick"); };
        recognition.onresult = (event) => { input.value = event.results[0][0].transcript; btnVoz.style.color = "var(--primary)"; btnVoz.classList.remove("fa-beat-fade"); input.placeholder = "Ej: Apaga la luz..."; this.vibra("doble"); setTimeout(() => this.procesarComandoIA(), 500); };
        recognition.onerror = () => { btnVoz.style.color = "var(--primary)"; btnVoz.classList.remove("fa-beat-fade"); input.placeholder = "Fallo acústico. Escribe..."; };
    }

    hablarJARVIS(texto) {
        if (!('speechSynthesis' in window) || !texto || texto === 'null') return;
        if (this.iaSilenciada) return; 
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(texto); utterance.lang = 'es-ES'; window.speechSynthesis.speak(utterance);
    }

    async procesarComandoIA() {
        const input = document.getElementById('ai-input'); 
        const orden = input.value.trim(); 
        if(!orden) return;
        
        input.value = ""; 
        this.notificar("Procesando...", "🧠");
        this.sysLog('IA', 'Input', `Prompt recibido: "${orden}"`);

        this.ejecutarInferencia(orden, "reactivo");
    }

    iniciarAgenteProactivo() {
        this.notificar("Agente Autónomo en línea", "🛡️");
        setInterval(() => {
            this.sysLog('IA', 'Proactivo', 'Ejecutando escaneo silencioso de telemetría.');
            this.ejecutarInferencia("Analiza el estado actual de la casa. Si detectas alguna anomalía de seguridad, un gasto excesivo, o un clima que requiera acción, actúa. Si todo está bien, no hagas nada y mantén 'comandos' vacío y 'voz' nulo.", "proactivo");
        }, 600000);
    }

    async ejecutarInferencia(orden, modo = "reactivo") {
        const statusEl = document.querySelector('.pico-info-pill');
        const picoStatus = (statusEl && statusEl.innerText.includes('Online')) ? 'ONLINE (Conectada)' : 'OFFLINE (Desconectada)';
        let contextoFisico = `--- TELEMETRÍA FÍSICA ACTUAL (ESTADO PICO: ${picoStatus}) ---\n`;
        document.querySelectorAll('.card').forEach(card => { contextoFisico += `- Módulo [${card.dataset.id}]: ${card.querySelector('.val-text')?.innerText || "Activo"}\n`; });
        contextoFisico += `- Reloj: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n`;
        
        let memoriaProfunda = "";
        if (this.db) { const horaActual = new Date().getHours(); memoriaProfunda = `--- PATRONES (${horaActual}:00) ---\n${await this.consultarHabitosDB(horaActual)}\n`; }
        let memoria = "--- CONTEXTO ---\n";
        (this.historialIA || []).forEach(h => memoria += `Humano: ${h.u}\nJARVIS: ${h.a}\n`);

        const promptSistema = GeneradorPrompt(contextoFisico, memoriaProfunda, memoria, modo, orden);
        
        if (this.modoIALocal) {
            await this.procesarConWebLLM(promptSistema, orden, modo);
        } else {
            if (navigator.onLine) {
                const proveedorElegido = (this.perfilDB && this.perfilDB.ia && this.perfilDB.ia.nube) ? this.perfilDB.ia.nube : "groq";
                try {
                    const { data, error } = await this.supabase.functions.invoke('ia-proxy', {
                        body: { proveedor: proveedorElegido, prompt_sistema: promptSistema, prompt_humano: orden, modo: modo }
                    });
                    if (error) throw error;
                    if (data && data.texto) {
                        this.desplegarPayloadCuantico(data.texto, orden, modo);
                    }
                } catch (err) {
                    this.sysLog('IA', 'Nube Err', 'Edge Function falló. Fallback a Local.', 'warn');
                    if(modo === "reactivo") {
                        this.notificar("Nube caída. Intentando IA Local...", "🔋");
                        await this.procesarConWebLLM(promptSistema, orden, modo);
                    }
                }
            } else {
                this.notificar("Sin conexión a la red", "❌");
                if(modo === "reactivo") {
                    this.notificar("Offline. Intentando IA Local...", "🔋");
                    await this.procesarConWebLLM(promptSistema, orden, modo);
                }
            }
        }
    }

    async precargarMotorLocal() {
        if (this.localEngine || this.localEngineWASM) return true;
        
        let toastDl = document.getElementById('toast-ia-dl');
        if (!toastDl) {
            const container = document.getElementById('toast-area') || document.body;
            container.insertAdjacentHTML('beforeend', `<div class="toast" id="toast-ia-dl" style="border:1px solid var(--primary); animation: slideIn 0.3s forwards;">⏳ <span id="ia-dl-text" style="margin-left:8px; font-weight:bold;">Montando IA en VRAM...</span><div style="width:100%; background:var(--bg); height:6px; margin-top:10px; border-radius:3px; overflow:hidden;"><div id="ia-dl-bar" style="width:0%; background:#32d74b; height:100%; transition:width 0.2s linear;"></div></div></div>`);
        }

        this.esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const modeloElegido = (this.perfilDB && this.perfilDB.ia && this.perfilDB.ia.local) ? this.perfilDB.ia.local : 'smollm';
        
        try {
            if (!this.esMovil) {
                this.sysLog('IA', 'Motor Local', `Arrancando WebLLM (PC) -> ${modeloElegido}`);
                const versionIA = this.versiones["@mlc-ai/web-llm"];
                const { CreateMLCEngine } = await import(`https://esm.run/@mlc-ai/web-llm@${versionIA}`);
                
                const modelosPC = {
                    'smollm': "SmolLM-135M-Instruct-q4f16_1-MLC",
                    'qwen': "Qwen2-0.5B-Instruct-q4f16_1-MLC",
                    'tinyllama': "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
                    'gemma': "gemma-2b-it-q4f16_1-MLC",
                    'phi3': "Phi-3-mini-4k-instruct-q4f16_1-MLC",
                    'mistral': "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
                    'llama3': "Llama-3-8B-Instruct-q4f32_1-MLC",
                    'hermes': "Nous-Hermes-2-Mistral-7B-DPO-q4f16_1-MLC",
                    'vicuna': "vicuna-7b-v1.5-q4f16_1-MLC",
                    'wizardlm': "WizardMath-7B-V1.1-q4f16_1-MLC"
                };
                
                const modeloMLC = modelosPC[modeloElegido] || modelosPC['smollm'];

                this.localEngine = await CreateMLCEngine(modeloMLC, {
                    initProgressCallback: (p) => { 
                        const pct = Math.round(p.progress * 100); 
                        const textEl = document.getElementById('ia-dl-text'); 
                        const barEl = document.getElementById('ia-dl-bar'); 
                        if(textEl) textEl.innerText = `Cargando ${modeloElegido.toUpperCase()}: ${pct}%`; 
                        if(barEl) barEl.style.width = `${pct}%`; 
                    },
                    chatOpts: { context_window_size: 2048 } 
                });
            } else {
                this.sysLog('IA', 'Motor Local', `Arrancando WASM Móvil -> ${modeloElegido}`);
                
                const modelosPesados = ['mistral', 'llama3', 'hermes', 'vicuna', 'wizardlm'];
                if (modelosPesados.includes(modeloElegido)) {
                    throw new Error("Este modelo es demasiado pesado para el móvil. Usa uno < 3B.");
                }

                try {
                    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0');
                    env.allowLocalModels = false; 
                    env.useBrowserCache = true; 
                    env.backends.onnx.wasm.numThreads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
                    
                    const textEl = document.getElementById('ia-dl-text'); 
                    if(textEl) textEl.innerText = "Iniciando motor WASM...";
                    
                    const modelosMovil = {
                        'smollm': 'Xenova/SmolLM-135M-Instruct',
                        'qwen': 'Xenova/Qwen1.5-0.5B-Chat',
                        'tinyllama': 'Xenova/TinyLlama-1.1B-Chat-v1.0',
                        'gemma': 'Xenova/gemma-2b-it',
                        'phi3': 'Xenova/Phi-3-mini-4k-instruct'
                    };
                    
                    const modeloWASM = modelosMovil[modeloElegido] || modelosMovil['qwen'];

                    this.localEngineWASM = await pipeline('text-generation', modeloWASM, {
                        device: 'webgpu', 
                        progress_callback: (x) => { 
                            if (x.status === 'downloading' || x.status === 'progress') { 
                                const tEl = document.getElementById('ia-dl-text'); 
                                const bEl = document.getElementById('ia-dl-bar'); 
                                if(tEl) tEl.innerText = `Cargando IA: ${Math.round(x.progress)}%`; 
                                if(bEl) bEl.style.width = `${x.progress}%`; 
                            } 
                        }
                    });
                } catch (err) {
                    this.sysLog('IA', 'WASM Err', err.message, 'err');
                    const textEl = document.getElementById('ia-dl-text'); 
                    if(textEl) { textEl.innerText = "Fallo de compatibilidad"; textEl.style.color = "#ff453a"; }
                    throw err; 
                }
            }
            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
            return true;
        } catch (e) {
            this.sysLog('IA', 'Precarga Fallida', e.message, 'err');
            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
            
            this.notificar(`${e.message}`, "❌");
            return false;
        }
    }


    async procesarConWebLLM(promptSistema, orden, modo) {
        this.sysLog('IA', 'Inferencia Local', 'Disparando LLM in-browser');
        try {
            let textoCrudo = "";
            if (!this.esMovil && this.localEngine) {
                const reply = await this.localEngine.chat.completions.create({
                    messages: [{ role: "system", content: promptSistema }, { role: "user", content: orden }], response_format: { type: "json_object" }
                });
                textoCrudo = reply.choices[0].message.content;
            } 
            else if (this.esMovil && this.localEngineWASM) {
                await new Promise(resolve => setTimeout(resolve, 800));
                const promptMovil = `<|im_start|>system\n${promptSistema}\nATENCIÓN: Tu única salida debe ser exclusivamente un bloque JSON válido. Nada de texto extra.<|im_end|>\n<|im_start|>user\n${orden}<|im_end|>\n<|im_start|>assistant\n`;
                const respuesta = await this.localEngineWASM(promptMovil, { max_new_tokens: 200, temperature: 0.1, repetition_penalty: 1.1, do_sample: false });
                let outputStr = respuesta[0].generated_text.replace(promptMovil, "").trim();
                const jsonMatch = outputStr.match(/\{[\s\S]*\}/); if (jsonMatch) textoCrudo = jsonMatch[0]; else throw new Error("El motor móvil no devolvió JSON");
            } else { throw new Error("Ningún motor local inicializado"); }

            this.sysLog('IA', 'Respuesta Local', textoCrudo);
            this.desplegarPayloadCuantico(textoCrudo, orden, modo);
        } catch(e) { this.sysLog('IA', 'Colapso Local', e.message, 'err'); this.notificar("Colapso lógico en IA Local", "❌"); }
    }

    desplegarPayloadCuantico(textoCrudo, orden, modo) {
        try {
            const payload = JSON.parse(textoCrudo);
            this.sysLog('IA', 'Payload JSON', 'Desgranando respuesta', 'info', payload);
            
            if (payload.comandos && Object.keys(payload.comandos).length > 0) {
                for (const [app, accion] of Object.entries(payload.comandos)) {
                    const esComandoWeb = this.ejecutarComandoLocal(app, accion);
                    if (!esComandoWeb) { this.cmd(app, accion); this.registrarEnDB(app, accion); }
                }
            } else if (modo === "reactivo") { this.notificar("Análisis completado. Sin acciones.", "🤖"); }

            if (payload.ui_acciones && payload.ui_acciones.length > 0) {
                payload.ui_acciones.forEach(acc => {
                    if (acc.tipo === "escribir") { const input = document.getElementById(acc.id); if (input) { input.value = acc.valor; this.logHUD(`Escribiendo en [${acc.id}]: "${acc.valor}"`, "info"); } } 
                    else if (acc.tipo === "click") { const btn = document.getElementById(acc.id); if (btn) { btn.click(); this.logHUD(`Pulsando [${acc.id}]`, "info"); } } 
                    else if (acc.tipo === "css") { const el = acc.id === "body" ? document.body : document.getElementById(acc.id); if (el) { el.style[acc.propiedad] = acc.valor; this.logHUD(`CSS Mod [${acc.id}]`, "info"); } }
                });
            }
            
            if (payload.voz && payload.voz !== "null" && !this.iaSilenciada) {
                let icono = "🗣️"; if(payload.estado_emocional === 'alerta') icono = "🚨"; if(payload.estado_emocional === 'ironico') icono = "😏";
                if(modo === "reactivo" || payload.estado_emocional === 'alerta') { this.notificar(payload.voz, icono); this.hablarJARVIS(payload.voz); }
            }

            if(modo === "reactivo") {
                this.historialIA = this.historialIA || [];
                this.historialIA.push({ u: orden, a: payload.voz || "Silencio táctico." });
                if (this.historialIA.length > 4) this.historialIA.shift();
            }
        } catch (e) { this.sysLog('IA', 'Parse Error', e.message, 'err'); this.notificar("Sinapsis colapsada", "⚠️"); }
    }

    async iniciarCentinelaAudio() {
        if (this.centinelaActivo) { this.notificar("Centinela auditivo ya activo", "🛡️"); return; }
        try {
            this.notificar("Cargando red neuronal auditiva...", "⏳");
            if (!this.tf) this.tf = await import("https://esm.run/@tensorflow/tfjs@4.17.0");
            const speechCommands = await import("https://esm.run/@tensorflow-models/speech-commands@0.5.4");

            this.recognizer = speechCommands.create("BROWSER_FFT");
            await this.recognizer.ensureModelLoaded();
            const palabras = this.recognizer.wordLabels();
            this.sysLog('AUDIO', 'Mic', 'Motor TFJS cargado. Oído biónico activo.');

            this.recognizer.listen(result => {
                const maxScore = Math.max(...result.scores); const maxScoreIndex = Array.from(result.scores).indexOf(maxScore);
                const palabraDetectada = palabras[maxScoreIndex];
                if (maxScore > 0.85 && palabraDetectada === "go") { this.vibra("doble"); this.hablarJARVIS("A la escucha."); }
            }, { probabilityThreshold: 0.85, invokeCallbackOnNoiseAndUnknown: false, overlapFactor: 0.5 });
            this.centinelaActivo = true; this.notificar("Oído biónico online", "🎙️");
        } catch (error) { this.sysLog('AUDIO', 'Mic Err', error.message, 'err'); this.notificar("Fallo de micrófono", "❌"); document.getElementById('sw-jarvis').checked = false; }
    }
    
    detenerCentinelaAudio() { if (this.recognizer && this.centinelaActivo) { this.recognizer.stopListening(); this.centinelaActivo = false; this.notificar("Centinela auditivo en reposo", "🛑"); } }

    initInterruptorIA() {
        const aiInput = document.getElementById('ai-input'); if (!aiInput || document.getElementById('btn-ia-mode')) return;
        const btnMode = document.createElement('button'); btnMode.id = 'btn-ia-mode'; this.modoIALocal = false; this.reintentoNubeActivo = null;
        btnMode.innerHTML = '<i class="fa-solid fa-cloud"></i>'; btnMode.style.cssText = "background:transparent; border:none; color:var(--text-sec); font-size:1.2rem; cursor:pointer; padding:0 10px; outline:none; transition: 0.3s;";
        aiInput.parentNode.insertBefore(btnMode, aiInput);
        btnMode.onclick = async () => { this.detenerReintento(); if (!this.modoIALocal) { await this.activarModoLocal(btnMode); } else { this.activarModoNube(btnMode); } };
    }

    async activarModoLocal(btn) {
        if(!btn) btn = document.getElementById('btn-ia-mode'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; this.notificar("Arrancando turbinas locales...", "⚙️");
        const exito = await this.precargarMotorLocal();
        if (exito) { this.modoIALocal = true; btn.innerHTML = '<i class="fa-solid fa-microchip"></i>'; btn.style.color = '#32d74b'; this.notificar("IA Local al mando", "🔒"); return true; } 
        else { this.notificar("Hardware incompatible", "⚠️"); this.activarModoNube(btn); return false; }
    }

    activarModoNube(btn) { if(!btn) btn = document.getElementById('btn-ia-mode'); this.modoIALocal = false; btn.innerHTML = '<i class="fa-solid fa-cloud"></i>'; btn.style.color = 'var(--text-sec)'; this.notificar("Modo IA Nube activado", "☁️"); }
    
    async gestionarFalloIA(origenFallo) {
        const btn = document.getElementById('btn-ia-mode');
        if (origenFallo === 'nube') {
            this.notificar("Nube caída. Desplegando IA Local...", "⚠️"); const exitoLocal = await this.activarModoLocal(btn);
            if (!exitoLocal) {
                this.notificar("Apagón total IA. Reintentando...", "🚨"); btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#ff453a;"></i>';
                if (!this.reintentoNubeActivo) { this.reintentoNubeActivo = setInterval(() => { this.notificar("Reintentando Nube...", "🔄"); this.activarModoNube(btn); }, 60000); }
            }
        } else if (origenFallo === 'local') { this.notificar("Local colapsado. Evacuando a Nube...", "⚠️"); this.activarModoNube(btn); }
    }
    
    detenerReintento() { if (this.reintentoNubeActivo) { clearInterval(this.reintentoNubeActivo); this.reintentoNubeActivo = null; } }

    // ==========================================================
    // ⚙️ BLOQUE 7: MISCELÁNEA, HARDWARE Y DB
    // ==========================================================

    ejecutarComandoLocal(app, accion) {
        const comandosLocales = ["Tema", "Edicion", "Vibracion", "Actualizaciones", "Vista", "Filtro", "Consola", "Sesion", "VozIA", "Consciencia", "IA"];
        const hardwareVirtual = ["Dado", "Pomodoro", "Calculadora", "Qr", "Reloj", "Tiempo", "Lista", "Macros"];
        
        if (hardwareVirtual.includes(app)) {
            if (this.logHUD) this.logHUD(`Simulando hardware virtual: ${app} -> ${accion}`, "out");
            
            if (app === "Dado" && accion === "roll") { 
                this.pub("Dado", Math.floor(Math.random() * 6) + 1, true); 
            } else if (app !== "Macros") { 
                this.pub(app, accion, true); 
                
                const tarjeta = this.cards.find(c => c.id === app);
                if (tarjeta && tarjeta.onData) tarjeta.onData(accion, app, this);
            }
            return true;
        }

        if (!comandosLocales.includes(app)) return false;
        if (this.logHUD) this.logHUD(`Directriz interna: ${app} -> ${accion}`, "out");
        switch(app) {
            case "Tema": if (accion === "toggle") this.toggleTheme(); else { document.body.setAttribute('data-theme', accion); localStorage.setItem('theme', accion); } break;
            case "Edicion": if (accion === "on" && !this.editMode) this.toggleEdit(); else if (accion === "off" && this.editMode) this.toggleEdit(); else if (accion === "toggle") this.toggleEdit(); break;
            case "Vibracion": const sw = document.getElementById('sw-vibration'); if (sw) sw.checked = (accion === "on"); break;
            case "Actualizaciones": this.comprobarActualizaciones(); break;
            case "Vista": 
                const grid = document.getElementById('dashboard-grid'); const plano = document.getElementById('plano-view'); const macros = document.getElementById('macros-view');
                if (grid) grid.style.display = (accion === 'dashboard') ? 'grid' : 'none'; if (plano) plano.style.display = (accion === 'plano') ? 'flex' : 'none'; if (macros) macros.style.display = (accion === 'macros') ? 'flex' : 'none'; break;
            case "Filtro": this.filtroActual = accion; this.renderGrid(); document.querySelectorAll('.filter-pill').forEach(b => { b.classList.remove('active'); if (b.dataset.filter === accion) b.classList.add('active'); }); break;
            case "Consola": const hud = document.getElementById('hud-console'); if (accion === "on" && (!hud || !hud.classList.contains('active'))) this.toggleHUD(); else if (accion === "off" && hud && hud.classList.contains('active')) this.toggleHUD(); else if (accion === "toggle") this.toggleHUD(); break;
            case "Sesion": if (accion === "logout") this.cerrarSesion(); break;
            case "VozIA": this.iaSilenciada = (accion === "mute"); if (this.iaSilenciada) this.notificar("Voz JARVIS off", "🔇"); else this.notificar("Voz JARVIS on", "🔊"); break;
            case "Consciencia": const modos = { 'logico': { nombre: 'LÓGICO'}, 'ironico': { nombre: 'IRÓNICO' }, 'defensa': { nombre: 'DEFENSA'}, 'zen': { nombre: 'MODO ZEN'} }; if(modos[accion]) { localStorage.setItem('pico_ai_modo', accion); this.notificar(`Modo: ${modos[accion].nombre}`, "🧬"); this.pub('Sistema/Consciencia', accion, true); } break;
            case "IA": if (accion === "clear" || accion === "limpiar") { window.iaMensajes = []; const chatBox = document.getElementById('chat-history'); if (chatBox) chatBox.innerHTML = '<div style="text-align:center; color:var(--text-sec); margin-top:10px;">Memoria purgada.</div>'; this.notificar("Memoria IA reiniciada", "🧠"); } break;
        }
        return true;
    }

    async comprobarActualizaciones(esArranqueSilencioso = false) {
        if (!esArranqueSilencioso) this.notificar("Buscando transmisiones en GitHub...", "📡");
        
        try {
            const res = await fetch(`changelog.json?t=${new Date().getTime()}`);
            if (!res.ok) throw new Error("Servidor de versiones inaccesible");
            
            const nube = await res.json();
            const versionLocal = localStorage.getItem('pico_version') || 'v1.0.0';

            if (nube.version !== versionLocal) {
                this.sysLog('SYS', 'Update', `Nueva versión detectada: ${nube.version}`);
                
                document.getElementById('cl-version-badge').innerText = `${nube.version} (${nube.fecha})`;
                document.getElementById('cl-title').innerText = nube.titulo;
                
                const lista = document.getElementById('cl-list');
                lista.innerHTML = "";
                nube.cambios.forEach(cambio => {
                    const li = document.createElement('li');
                    li.style.marginBottom = "8px";
                    li.innerHTML = this.escapeHTML(cambio);
                    lista.appendChild(li);
                });

                const modal = document.getElementById('changelog-modal');
                modal.style.display = 'flex';
                this.vibra("doble");
                
                document.getElementById('btn-close-changelog').onclick = () => {
                    localStorage.setItem('pico_version', nube.version);
                    modal.style.display = 'none';
                    this.notificar(`Sistema actualizado a ${nube.version}`, "✅");
                    
                    if (nube.forzar_recarga && 'serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(registrations => {
                            for(let registration of registrations) { registration.update(); }
                        });
                    }
                };
            } else {
                if (!esArranqueSilencioso) this.notificar("El sistema ya está en la última versión", "✅");
            }
        } catch (error) {
            this.sysLog('SYS', 'Update Err', error.message, 'warn');
            if (!esArranqueSilencioso) this.notificar("Fallo al contactar con la central", "❌");
        }
    }
    
    ejecutarConDeshacer(app, comando, tiempoGracia = 3000) {
        const tarjeta = this.cards.find(c => c.id === app);
        if (tarjeta && tarjeta.undo) {
            const toastId = Math.random().toString(36).substr(2,9); const container = document.getElementById('toast-area');
            const toast = document.createElement('div'); toast.className = "toast"; toast.style.position = "relative"; toast.style.overflow = "hidden";
            toast.innerHTML = `⏳ <span style="margin-left:8px">Orden a ${app} en espera...</span><button class="toast-undo-btn" id="undo-${toastId}">DESHACER</button><div class="toast-progress"></div>`; container.appendChild(toast);
            const timerId = setTimeout(() => { this.cmd(app, comando); toast.remove(); }, tiempoGracia);
            document.getElementById(`undo-${toastId}`).onclick = () => { clearTimeout(timerId); toast.remove(); this.notificar(`Acción cancelada`, "🛑"); };
        } else { this.cmd(app, comando); }
    }

    initAtajosTeclado() {
        window.addEventListener('keydown', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if(e.key.toLowerCase() === 'l') { this.vibra("tick"); const st = document.getElementById('val-Led')?.innerText; if(st) this.ejecutarConDeshacer('Led', st === "ON" ? "off" : "on"); }
            if(e.key === 'h' && this.rol === 'god') this.toggleHUD();
        });
    }

    toggleHUD() {
        if(this.rol !== 'god') return;
        
        let hud = document.getElementById('hud-console');
        if(!hud) { 
            hud = document.createElement('div'); 
            hud.id = 'hud-console'; 
            document.body.appendChild(hud); 
            
            const btnPurgar = document.createElement('button');
            btnPurgar.innerHTML = "💣 PURGAR MEMORIA";
            btnPurgar.style.cssText = "position: absolute; top: 10px; right: 10px; background:#ff9f0a; color:white; border:none; padding:5px 15px; border-radius:5px; font-weight:bold; cursor:pointer; z-index: 1000;";
            
            btnPurgar.onclick = () => {
                if(confirm('¿⚠️ ALERTA GOD: Formatear toda la memoria local, perfiles, cachés y service workers?')) {
                    this.sysLog('SEC', 'PURGA', 'Iniciando autodestrucción de caché...', 'warn');
                    localStorage.clear(); 
                    sessionStorage.clear();
                    if('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
                    }
                    caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
                    window.location.reload();
                }
            };
            hud.appendChild(btnPurgar);

            this.logHUD("INTERCEPTANDO TRÁFICO MQTT..."); 
        }
        hud.classList.toggle('active');
    }

    logHUD(msg, tipo = "info", dataExtra = null, solucion = null) {
        const hud = document.getElementById('hud-console'); 
        if(!hud) return;

        let textoFinal = "";

        if (this.rol === 'god') {
            textoFinal = `> ${msg}`;
            if (dataExtra) {
                const dataStr = typeof dataExtra === 'object' ? JSON.stringify(dataExtra) : dataExtra;
                textoFinal += `\n   📦 DATA: ${dataStr}`;
            }
            if ((tipo === 'error' || tipo === 'err') && solucion) {
                textoFinal += `\n   💡 FIX: ${solucion}`;
            }
        } 
        else if (this.rol === 'admin') {
            if (tipo === 'out' || msg.includes('DATA:')) return; 
            textoFinal = `> ${msg}`;
        } 
        else {
            if (tipo !== 'error' && tipo !== 'err') return; 
            const pseudoCodigo = Math.random().toString(36).substring(7).toUpperCase();
            textoFinal = `> ⚠️ Error de sistema interceptado. (Código: ${pseudoCodigo}). Notifique al administrador.`;
        }

        if (!textoFinal) return;

        const linea = document.createElement('div'); 
        linea.className = `hud-msg ${tipo === 'error' || tipo === 'err' ? 'hud-err' : tipo === 'out' ? 'hud-out' : ''}`;
        linea.innerText = `[${new Date().toLocaleTimeString()}] ${textoFinal}`; 
        hud.appendChild(linea); 
        
        hud.scrollTop = hud.scrollHeight;

        const mensajes = hud.querySelectorAll('.hud-msg');
        if (mensajes.length > 100) mensajes[0].remove();
    }

    initParallax() {
        document.addEventListener('mousemove', (e) => {
            if(this.editMode) return;
            document.querySelectorAll('.card').forEach(card => {
                const rect = card.getBoundingClientRect(); const x = e.clientX - rect.left - rect.width / 2; const y = e.clientY - rect.top - rect.height / 2;
                card.style.transform = `perspective(1000px) rotateX(${-y / 30}deg) rotateY(${x / 30}deg)`;
            });
        });
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if(this.editMode) return;
                const tiltX = Math.min(Math.max(e.beta - 45, -20), 20); const tiltY = Math.min(Math.max(e.gamma, -20), 20); 
                document.querySelectorAll('.card').forEach(card => { card.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`; });
            });
        }
    }

    initSwipeGestures() {
        let touchStartX = 0; document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX; const targetCard = e.target.closest('.card'); if(!targetCard) return;
            if (touchStartX - touchEndX > 50) targetCard.classList.add('swipe-open'); if (touchEndX - touchStartX > 50) targetCard.classList.remove('swipe-open');
        });
    }

    async abrirPiP(app) {
        if (!('documentPictureInPicture' in window)) return this.notificar("Tu navegador no soporta PiP", "❌");
        const tarjeta = this.cards.find(c => c.id === app); if(!tarjeta || !tarjeta.pip) return;
        try {
            const pipWindow = await documentPictureInPicture.requestWindow({ width: 250, height: 250 });
            const style = document.createElement('style'); style.textContent = `body { background: #1c1c1e; color: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif; height: 100vh; margin: 0; } .val-text { font-size: 3rem; font-weight: bold; }`;
            pipWindow.document.head.appendChild(style); pipWindow.document.body.innerHTML = `<div style="text-align:center"><div style="color:#8e8e93">${app.toUpperCase()}</div><div class="val-text" id="pip-val">...</div></div>`;
            this.notificar(`${app} extraído a PiP`, "🪟");
        } catch(e) { this.sysLog('UI', 'PiP Err', e.message, 'err'); }
    }

    initSidebar() {
        const trigger = document.querySelector('.pico-os-title'); const menu = document.getElementById('side-menu');
        trigger.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); this.vibra("tick"); });
        document.addEventListener('click', (e) => { if(!menu.contains(e.target) && !trigger.contains(e.target)) { menu.classList.remove('open'); } });
        document.getElementById('btn-nav-plano').onclick = () => { document.getElementById('plano-view').style.display = 'flex'; menu.classList.remove('open'); };
        document.getElementById('btn-nav-macros').onclick = () => { document.getElementById('macros-view').style.display = 'flex'; menu.classList.remove('open'); };
        document.getElementById('btn-nav-nfc').onclick = () => this.leerNFC();
        document.getElementById('btn-nav-radar').onclick = () => this.iniciarRadarBluetooth();
        document.getElementById('btn-nav-terminal').onclick = () => { this.toggleHUD(); menu.classList.remove('open')};
        
        const btnCanales = document.getElementById('btn-nav-canales');
        if (btnCanales) btnCanales.onclick = () => { 
            document.getElementById('canales-view').style.display = 'block'; 
            menu.classList.remove('open'); 
            this.cargarCanales(); 
        };
    }

    initMultijugador() {
        window.simularPresencia = (appId) => {
            const card = document.getElementById(`card-${appId}`); if(!card) return;
            card.classList.add('multiplayer-active'); this.notificar(`Otro usuario usa ${appId}`, "👥");
            setTimeout(() => card.classList.remove('multiplayer-active'), 3000);
        };
    }

    async leerNFC() {
        if (!("NDEFReader" in window)) return this.notificar("Dispositivo sin NFC compatible", "❌");
        try {
            const ndef = new NDEFReader(); await ndef.scan(); this.notificar("Acerca el NFC...", "📡"); this.vibra("doble");
            ndef.addEventListener("reading", ({ message, serialNumber }) => { this.vibra("tick"); this.notificar(`NFC: ${serialNumber}`, "✅"); this.logHUD(`NFC: ${serialNumber}`); });
        } catch (error) { this.notificar("Error lector NFC", "❌"); this.sysLog('HW', 'NFC Err', error.message, 'err'); }
    }

    async iniciarRadarBluetooth() {
        if (!navigator.bluetooth) return this.notificar("Bluetooth Web no soportado", "❌");
        try { this.notificar("Escaneando balizas...", "🔎"); const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true }); this.vibra("tick"); this.notificar(`Baliza: ${device.name || 'Desconocido'}`, "✅"); } 
        catch(e) { this.sysLog('HW', 'BT', 'Radar cancelado o fallido', 'warn'); }
    }

    initModosExpertos() { this.initConstructorPlano(); this.initPlanoDraggable(); this.initGestorMacrosIA(); }

    initConstructorPlano() {
        const grid = document.getElementById('plano-grid'); const tools = document.querySelectorAll('.build-tool'); const btnClear = document.getElementById('btn-clear-grid');
        if(!grid) return;
        let currentTool = 'floor'; let isDrawing = false; const totalCells = 30 * 20; 
        tools.forEach(tool => { tool.onclick = () => { tools.forEach(t => t.classList.remove('active')); tool.classList.add('active'); currentTool = tool.dataset.type; this.vibra("tick"); }; });
        let savedMap = JSON.parse(localStorage.getItem('miPlanoTiles')) || Array(totalCells).fill('');
        grid.innerHTML = '';
        for (let i = 0; i < totalCells; i++) { const cell = document.createElement('div'); cell.className = `grid-cell ${savedMap[i]}`; cell.dataset.index = i; grid.appendChild(cell); }
        const paintCell = (cell) => {
            if (!cell || !cell.classList.contains('grid-cell')) return;
            cell.classList.remove('wall', 'floor', 'door', 'window'); if (currentTool !== 'erase') cell.classList.add(currentTool);
            savedMap[cell.dataset.index] = currentTool !== 'erase' ? currentTool : ''; localStorage.setItem('miPlanoTiles', JSON.stringify(savedMap));
        };
        grid.addEventListener('mousedown', (e) => { isDrawing = true; paintCell(e.target); }); grid.addEventListener('mouseover', (e) => { if(isDrawing) paintCell(e.target); });
        document.addEventListener('mouseup', () => { if(isDrawing) { isDrawing = false; this.vibra("tick"); }});
        grid.addEventListener('touchstart', (e) => { isDrawing = true; paintCell(e.target); }, {passive: false});
        grid.addEventListener('touchmove', (e) => { if(!isDrawing) return; e.preventDefault(); const touch = e.touches[0]; const element = document.elementFromPoint(touch.clientX, touch.clientY); paintCell(element); }, {passive: false});
        document.addEventListener('touchend', () => isDrawing = false);
        btnClear.onclick = () => { if(confirm("¿Borrar plano?")) { savedMap = Array(totalCells).fill(''); localStorage.setItem('miPlanoTiles', JSON.stringify(savedMap)); document.querySelectorAll('.grid-cell').forEach(c => c.className = 'grid-cell'); this.vibra("doble"); } };
    }

    initPlanoDraggable() {
        const workspace = document.getElementById('plano-workspace'); if(!workspace) return;
        let draggedElement = null; let offsetX = 0, offsetY = 0;
        const startDrag = (e) => { if (!e.target.classList.contains('plano-pin')) return; draggedElement = e.target; const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; const rect = draggedElement.getBoundingClientRect(); offsetX = clientX - rect.left; offsetY = clientY - rect.top; };
        const onDrag = (e) => { if (!draggedElement) return; e.preventDefault(); const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY; const workspaceRect = workspace.getBoundingClientRect(); let newLeft = clientX - workspaceRect.left - offsetX; let newTop = clientY - workspaceRect.top - offsetY; newLeft = Math.max(0, Math.min(newLeft, workspaceRect.width - draggedElement.offsetWidth)); newTop = Math.max(0, Math.min(newTop, workspaceRect.height - draggedElement.offsetHeight)); draggedElement.style.left = `${(newLeft / workspaceRect.width) * 100}%`; draggedElement.style.top = `${(newTop / workspaceRect.height) * 100}%`; };
        const endDrag = () => { if(draggedElement) { this.vibra("tick"); draggedElement = null; } };
        workspace.addEventListener('mousedown', startDrag); document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', endDrag);
        workspace.addEventListener('touchstart', startDrag, {passive: false}); document.addEventListener('touchmove', onDrag, {passive: false}); document.addEventListener('touchend', endDrag);
    }

    initGestorMacrosIA() {
        const btnRecord = document.getElementById('btn-record-key'); const displayKey = document.getElementById('recorded-key-display'); const btnCompile = document.getElementById('btn-compile-macro'); const promptInput = document.getElementById('macro-ai-prompt'); const list = document.getElementById('macro-list'); const emptyMsg = document.getElementById('macro-empty-msg');
        if (!btnRecord || !btnCompile) return; 
        let currentBinding = "";
        btnRecord.onclick = () => {
            btnRecord.innerText = "Escuchando..."; btnRecord.style.background = "#ff9f0a"; btnRecord.style.color = "white";
            const capturer = (e) => {
                e.preventDefault(); let keys = [];
                if (e.ctrlKey) keys.push("Ctrl"); if (e.altKey) keys.push("Alt"); if (e.shiftKey) keys.push("Shift");
                if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return; keys.push(e.key.toUpperCase());
                currentBinding = keys.join(" + "); displayKey.innerText = currentBinding; btnRecord.innerText = "Re-grabar Atajo"; btnRecord.style.background = "var(--card-bg)"; btnRecord.style.color = "var(--primary)"; this.vibra("tick"); window.removeEventListener('keydown', capturer);
            };
            window.addEventListener('keydown', capturer);
        };
        btnCompile.onclick = async () => {
            const promptCrudo = promptInput.value.trim(); 
            if(!currentBinding || !promptCrudo) return this.notificar("Falta el atajo o el texto", "⚠️");
            
            const promptSeguro = this.escapeHTML(promptCrudo);
            
            btnCompile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compilando...`; this.vibra("tick");
            setTimeout(() => {
                const codigoJSONGenerado = JSON.stringify({ "Led": "toggle", "Pomodoro": 25 }); if(emptyMsg) emptyMsg.style.display = 'none';
                const li = document.createElement('li'); li.className = "macro-item cascade-in"; 
                li.innerHTML = `<div style="display:flex; flex-direction:column; gap:5px;"><span style="font-family:monospace; font-weight:900; color:var(--primary); font-size:1.1rem;"><i class="fa-regular fa-keyboard"></i> ${currentBinding}</span><span style="font-size:0.85rem; color:var(--text-sec);">"${promptSeguro}"</span><span style="font-family:monospace; font-size:0.75rem; color:#32d74b;">> ${codigoJSONGenerado}</span></div><button class="btn-del" onclick="this.parentElement.remove(); window.App.vibra('doble');"><i class="fa-solid fa-trash"></i></button>`;
                list.appendChild(li); promptInput.value = ""; displayKey.innerText = "Sin asignar"; currentBinding = ""; btnCompile.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Compilar y Guardar`; this.notificar("Atajo compilado con éxito", "✅");
            }, 1000);
        };
    }

    initBaseDeDatos() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("PicoOS_Database", 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('habitos')) { const store = db.createObjectStore('habitos', { keyPath: 'id', autoIncrement: true }); store.createIndex('app', 'app', { unique: false }); store.createIndex('hora', 'hora', { unique: false }); }
            };
            request.onsuccess = (event) => { this.db = event.target.result; this.sysLog('DB', 'Init', 'Base de Datos Local Online.'); resolve(); };
            request.onerror = (event) => { this.sysLog('DB', 'Err', 'Error abriendo IDB', 'err'); reject("Error abriendo DB"); };
        });
    }

    registrarEnDB(app, accion, valorExtra = null) {
        if (!this.db) return;
        
        const appLimpio = this.escapeHTML(String(app));
        const accionLimpio = this.escapeHTML(String(accion));
        const valorLimpio = valorExtra ? this.escapeHTML(String(valorExtra)) : null;

        const transaccion = this.db.transaction(['habitos'], 'readwrite'); 
        const store = transaccion.objectStore('habitos');
        store.add({ 
            app: appLimpio, 
            accion: accionLimpio, 
            valor: valorLimpio, 
            hora: new Date().getHours(), 
            minuto: new Date().getMinutes(), 
            diaSemana: new Date().getDay(), 
            timestamp: Date.now() 
        });
    }

    consultarHabitosDB(horaActual) {
        return new Promise((resolve) => {
            if (!this.db) return resolve("Sin datos históricos.");
            const transaccion = this.db.transaction(['habitos'], 'readonly'); const store = transaccion.objectStore('habitos'); const index = store.index('hora');
            const request = index.getAll(IDBKeyRange.only(horaActual));
            request.onsuccess = () => {
                const resultados = request.result; if (resultados.length === 0) return resolve("No hay patrones a esta hora.");
                let resumen = {}; resultados.forEach(r => { const clave = `${r.app}->${r.accion}`; resumen[clave] = (resumen[clave] || 0) + 1; });
                resolve(JSON.stringify(resumen));
            };
        });
    }

    // ==========================================================
    // ⚔️ BLOQUE 8: CONTROL DE ACCESOS Y FORJA (GOD MODE ONLY)
    // ==========================================================

    async comprobarSolicitudesPendientes() {
        if (this.rol !== 'god') return; 
        try {
            const { data, error } = await this.supabase.from('perfiles').select('id, rol').eq('rol', 'pendiente');
            if (data && data.length > 0) {
                this.sysLog('SEC', 'Radar', `Detectadas ${data.length} solicitudes pendientes.`);
                setTimeout(() => {
                    this.notificar(`${data.length} solicitud(es) de acceso. Abre la consola HUD.`, "🔔"); this.vibra("doble");
                    const hud = document.getElementById('hud-console');
                    if (hud) {
                        const btnId = `btn-approve-${data[0].id}`;
                        this.logHUD(`NUEVO USUARIO ESPERANDO. <button id="${btnId}" style="background:#bf5af2; color:white; border:none; padding:2px 5px; cursor:pointer;">Aprobar Primero</button>`, "info");
                        setTimeout(() => { const btn = document.getElementById(btnId); if(btn) btn.onclick = () => this.ejecutarForjaAutomatica(data[0].id); }, 100);
                    }
                }, 3000);
            }
        } catch (error) { this.sysLog('SEC', 'Radar Err', error.message, 'err'); }
    }

    async ejecutarForjaAutomatica(userId) {
        this.sysLog('SEC', 'Aprobación', `Otorgando acceso a UserID: ${userId}`);
        
        try {
            this.notificar("Aprobando acceso en la base de datos...", "⏳");
            
            const { error } = await this.supabase.from('perfiles')
                .update({ rol: 'guest', updated_at: new Date() }).eq('id', userId);
            
            if (error) throw error;
            
            this.sysLog('SEC', 'Aprobación OK', 'Usuario verificado. Esperando su primer login.');
            this.notificar("Usuario autorizado en el sistema", "✅");
            this.logHUD(`USUARIO APROBADO: Al iniciar sesión, su propio equipo forjará las llaves E2EE.`, "out");
            
        } catch (error) {
            this.sysLog('SEC', 'Aprobación Err', error.message, 'err');
            this.notificar("Fallo al autorizar usuario", "❌");
        }
    }
    
    // ==========================================================
    // 📻 BLOQUE 9: CANALES (Sintonización Dinámica)
    // ==========================================================

    async cargarCanales() {
        this.sysLog('NET', 'Canales', 'Buscando canales disponibles...');
        const lista = document.getElementById('lista-canales-publicos');
        const btnCrear = document.getElementById('btn-crear-canal');
        
        if (!lista) return;
        lista.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary); font-size:2rem;"></i></div>';

        // 🚀 PARCHE UI: Forzamos el display con !important para vencer al CSS oculto
        if (this.tienePermiso('admin') && btnCrear) {
            btnCrear.style.setProperty('display', 'block', 'important');
        }

        try {
            const { data: misCasas, error: errC } = await this.supabase.from('hogares').select('*').eq('owner_id', this.usuarioLogueado.id);
            const { data: accesos, error: errA } = await this.supabase.from('accesos_hogares').select('hogar_id').eq('invitado_id', this.usuarioLogueado.id);
            
            let canalesAcceso = [...(misCasas || [])];
            if (accesos && accesos.length > 0) {
                const idsInvitado = accesos.map(a => a.hogar_id);
                const { data: casasInvitado } = await this.supabase.from('hogares').select('*').in('id', idsInvitado);
                if (casasInvitado) canalesAcceso = canalesAcceso.concat(casasInvitado);
            }

            // 🚀 PARCHE UX: Filtramos tu propio canal principal para que no salga en la lista
            canalesAcceso = canalesAcceso.filter(canal => canal.id !== this.miHogarId);

            lista.innerHTML = '';
            if (canalesAcceso.length === 0) {
                lista.innerHTML = '<p style="color:var(--text-sec); text-align:center; font-size:0.9rem;">No hay canales externos disponibles.</p>';
                return;
            }

            canalesAcceso.forEach(canal => {
                const isActivo = this.canalActivo && this.canalActivo.id === canal.id;
                const badge = isActivo ? `<span style="background:#32d74b; color:black; padding:2px 8px; border-radius:10px; font-size:0.7rem; font-weight:bold; margin-left:10px;">CONECTADO</span>` : '';
                
                lista.innerHTML += `
                <div class="user-card glass-element cascade-in" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid ${isActivo ? '#32d74b' : 'var(--border)'};">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="background: rgba(10, 132, 255, 0.1); width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #0a84ff; font-size: 1.2rem; border: 1px solid rgba(10, 132, 255, 0.3);">
                            <i class="fa-solid fa-tower-broadcast"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span style="font-weight: 800; color: var(--text-main); font-size: 1rem;">${this.escapeHTML(canal.nombre)} ${badge}</span>
                            <span style="font-size: 0.75rem; color: var(--text-sec); font-family: monospace;">CH-${canal.id.substring(0,6).toUpperCase()}</span>
                        </div>
                    </div>
                    <button class="btn-action" onclick="window.App.unirseCanal('${canal.id}', '${this.escapeHTML(canal.nombre)}', '${this.escapeHTML(canal.topic_base)}', '${this.escapeHTML(canal.pico_tk)}')" style="width: auto; background: ${isActivo ? 'transparent' : 'var(--primary)'}; border: ${isActivo ? '1px solid #32d74b' : 'none'}; color: ${isActivo ? '#32d74b' : 'white'}; padding: 8px 15px; font-size: 0.85rem; margin: 0;" ${isActivo ? 'disabled' : ''}>
                        ${isActivo ? '<i class="fa-solid fa-check"></i>' : 'Conectar'}
                    </button>
                </div>`;
            });
        } catch (e) {
            this.sysLog('NET', 'Canales Err', e.message, 'err');
            lista.innerHTML = '<p style="color:#ff453a; text-align:center; font-size:0.9rem;">Error al cargar los canales.</p>';
        }
    }

    async crearCanal() {
        if (!this.tienePermiso('admin')) return;
        const nombre = prompt("Nombre del nuevo Canal:");
        if (!nombre) return;

        this.notificar("Creando canal cifrado...", "⚙️");
        try {
            const topicBase = `pico/ch_${Date.now()}/`;
            const tkCompartido = CryptoJS.lib.WordArray.random(32).toString();

            const { error } = await this.supabase.from('hogares').insert({
                nombre: nombre,
                topic_base: topicBase,
                pico_tk: tkCompartido,
                owner_id: this.usuarioLogueado.id
            });

            if (error) throw error;
            this.notificar("Canal creado", "✅");
            this.cargarCanales();
        } catch (e) {
            this.sysLog('NET', 'Crear Canal Err', e.message, 'err');
            this.notificar("Fallo al crear el canal", "❌");
        }
    }

    async unirseCanal(id, nombre, topic, tk) {
        this.sysLog('NET', 'Sintonizar', `Conectando a canal: ${nombre}`);
        
        if (!this.confPrivada) {
            this.confPrivada = { topic: this.conf.topic, tk: this.conf.tk };
        }

        this.conf.topic = topic;
        this.conf.tk = tk;
        this.canalActivo = { id, nombre };

        sessionStorage.setItem('pico_canal_activo', JSON.stringify({
            id, nombre, topic, tk, privada: this.confPrivada
        }));

        document.getElementById('dashboard-grid').innerHTML = "";
        this.renderGrid(); 
        this.conectar();
        
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

        document.getElementById('dashboard-grid').innerHTML = "";
        this.renderGrid(); 
        this.conectar();
        
        document.getElementById('canal-activo-nombre').innerText = 'Canal Privado';
        document.getElementById('canal-activo-nombre').style.color = 'white';
        document.getElementById('canal-activo-banner').style.borderColor = '#32d74b';
        document.getElementById('btn-salir-canal').style.display = 'none';

        this.notificar("Canal Privado restaurado", "🔒");
        this.vibra("tick");
        this.cargarCanales();
    }
}
