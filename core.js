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
                    this.sysLog('SEC', 'Inyecci贸n', 'Terminal Eruda en l铆nea.', 'info'); 
                };
                document.head.appendChild(script);
            }
        } else {
            const ofuscador = () => {};
            console.log = ofuscador;
            console.info = ofuscador;
            console.warn = ofuscador;
            console.error = (...args) => {
                if (this.rol === 'admin') window._consolaOriginal.warn("鈿狅笍 [SISTEMA] Alerta de seguridad interceptada.");
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
                log(`%c馃挕 FIX: %c${solucion}`, `color: #32d74b; font-weight: bold;`, `color: inherit; font-weight: normal;`);
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
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&', '<': '<', '>': '>', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

    async arranqueSeguro() {
        this.sysLog('SYS', 'Boot', 'Secuencia de ignici贸n iniciada.');
        await this.inicializarModulos();
        this.init(); 
    }

    async inicializarModulos() {
        this.sysLog('SYS', 'Modulos', 'Comprobando librer铆as en cach茅...');
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
                    this.sysLog('SYS', 'Inyecci贸n', `M贸dulo cargado: ${nombre}`);
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
            this.notificar("Actualizaci贸n interna lista (Se aplicar谩 al recargar)", "馃攧");
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
            } catch (e) { this.sysLog('SYS', 'Cach茅', 'Cach茅 local corrupta.', 'warn', e); }
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
                    linkRegister.innerText = "Ya tengo cuenta (Iniciar sesi贸n)";
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
                navigator.clipboard.writeText(input.value).then(() => { this.notificar("Copiado al portapapeles", "鉁�"); });
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
                this.sysLog('SEC', 'AutoLogin', 'Sesi贸n segura recuperada. Saltando pantalla de login.');
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
        this.sysLog('SEC', 'Vault', 'B贸veda local sellada con PBKDF2 y Token de Sesi贸n.');
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
            this.sysLog('SEC', 'Vault Err', 'Intento de apertura con sesi贸n caducada o manipulada.', 'warn');
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
        if (!u) return this.notificar("Falta el correo electr贸nico", "鉂�");
        if (!u.includes('@') || !u.includes('.')) return this.notificar("Debes usar un correo real v谩lido", "鈿狅笍");
        if (p1 !== p2) return this.notificar("Las contrase帽as no coinciden", "鉂�");
        if (p1.length < 6) return this.notificar("M铆nimo 6 caracteres", "鈿狅笍");
        
        this.sysLog('SEC', 'Registro', `Intentando crear usuario: ${u}`);
        const btn = document.getElementById('btn-register-submit');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        
        try {
            const { error } = await this.supabase.auth.signUp({ email: u.trim(), password: p1 });
            if (error) throw error;
            
            this.sysLog('SEC', 'Registro', '脡xito. Correo de confirmaci贸n enviado.');
            this.notificar("Revisa tu correo para confirmar la cuenta.", "馃摡");
            
            document.getElementById('link-toggle-register').click();
            document.getElementById('user-input').value = ""; document.getElementById('pass-input').value = ""; document.getElementById('pass2-input').value = "";
        } catch (error) {
            this.sysLog('SEC', 'Registro Fail', error.message, 'err');
            if (error.message.includes("already registered")) this.notificar("Ese correo ya est谩 registrado", "鈿狅笍");
            else this.notificar("Fallo al registrar", "鉂�");
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
            if (!req.ok) throw new Error(`Credenciales inv谩lidas`);
            
            const data = JSON.parse(rawText);
            await this.supabase.auth.setSession(data.session);
            this.usuarioLogueado = data.user;
            
            const tokenJWT = data.session.access_token;

            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (perfilNube?.rol === 'pendiente') throw new Error("Tu cuenta est谩 en revisi贸n.");
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
                this.notificar("Frecuencia base construida", "馃摶");
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
            
            this.logHUD("Login completado y B贸veda sellada.", "鉁�");
            this.notificar("Acceso concedido", "鉁�");

        } catch (error) {  
            document.getElementById('error-msg').innerText = "鉂� " + error.message;
            document.getElementById('error-msg').style.display = 'block'; 
        }
    }

    async cargarDatosDespuesDeLogin(tokenJWT) {
        try {
            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (perfilNube?.rol === 'pendiente') throw new Error("Tu cuenta est谩 en revisi贸n.");
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
                this.sysLog('SEC', 'AutoLogin', 'B贸veda local vac铆a. Reconstruyendo desde Supabase...', 'warn');
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
            
            this.notificar("Acceso concedido", "馃攼");
            
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
        this.sysLog('SEC', 'Logout', 'Limpiando llaves y cerrando sesi贸n.');
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
        
        this.notificar("Sesi贸n cerrada", "馃敀");
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
            this.sysLog('DB', 'Update OK', 'Cach茅 local sincronizada con sello de tiempo.');
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
        if(!exito) this.notificar("Guardado offline. Se subir谩 al recuperar conexi贸n.", "鈿狅笍");
    }

    abrirAjustesUsuario() {
        const modal = document.getElementById('user-settings-modal');
        if(!modal) return;

        const p = this.perfilDB || {};
        
        if(document.getElementById('input-perfil-avatar')) document.getElementById('input-perfil-avatar').value = p.avatar_url || '';
        if(document.getElementById('input-perfil-nombre')) document.getElementById('input-perfil-nombre').value = p.nombre || '';
        if(document.getElementById('input-perfil-alias')) document.getElementById('input-perfil-alias').value = p.alias || '';
        if(document.getElementById('select-perfil-idioma')) document.getElementById('select-perfil-idioma').value = p.idioma || 'es-ES';
        if(document.getElementById('label-idioma')) document.getElementById('label-idioma').innerText = p.idioma === 'en-US' ? 'English' : 'Espa帽ol';
        
        const ia = p.ia || { nube: 'groq', local: 'smollm' };
        if(document.getElementById('select-ia-nube')) document.getElementById('select-ia-nube').value = ia.nube || 'groq';
        if(document.getElementById('label-ianube')) {
            const nombresNube = { 'groq': 'GROQ (ULTRA R脕PIDO)', 'google': 'GOOGLE (EQUILIBRADO)', 'openrouter': 'OPENROUTER (LLAMA 3 LIBRE)' };
            document.getElementById('label-ianube').innerText = nombresNube[ia.nube] || 'GROQ (ULTRA R脕PIDO)';
        }

        if(document.getElementById('select-ia-local')) document.getElementById('select-ia-local').value = ia.local || 'smollm';
        if(document.getElementById('label-ialocal')) {
            const nombresLocal = { 
                'smollm': 'SMOLLM (135M)', 'qwen': 'QWEN 1.5 (0.5B)', 'tinyllama': 'TINYLLAMA (1.1B)',
                'gemma': 'GEMMA 2 (2B)', 'phi3': 'PHI-3 MINI (3.8B)', 'mistral': 'MISTRAL (7B)',
                'llama3': 'LLAMA 3 (8B)', 'hermes': 'NOUS HERMES (LLAMA)', 'vicuna': 'VICUNA (7B)', 'wizardlm': 'WIZARDLM (MATES/C脫DIGO)'
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
            this.notificar("Subiendo imagen al servidor...", "鈴�");
            this.sysLog('NET', 'Storage', `Subiendo archivo: ${file.name}`);

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `avatar_${this.usuarioLogueado.id}_${Date.now()}.${fileExt}`;

                const { data, error } = await this.supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
                if (error) throw error;

                const { data: publicUrlData } = this.supabase.storage.from('avatars').getPublicUrl(fileName);
                urlInput.value = publicUrlData.publicUrl;
                this.notificar("隆Imagen subida!", "鉁�");
                this.sysLog('NET', 'Storage OK', `URL P煤blica: ${publicUrlData.publicUrl}`);
                
                this.autoGuardarPerfil(); 
            } catch (err) {
                this.sysLog('NET', 'Storage Error', err.message, 'err');
                this.notificar("Error al subir la imagen", "鉂�");
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
            this.sysLog('NET', 'Abort', 'ID de Hogar no establecido. Abortando Sintonizaci贸n.', 'warn');
            return;
        }

        if (this.suscripcionRealtime) {
            this.supabase.removeChannel(this.suscripcionRealtime);
        }

        this.sysLog('NET', 'Sintonizando', `Escuchando telemetr铆a de Canal: ${hogarTargetId.substring(0,8)}`);

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
            return this.notificar("Sin conexi贸n. Orden en cola", "鉂�");
        }
        
        try {
            if (typeof CryptoJS === 'undefined') throw new Error("CryptoJS no carg贸.");
            
            // 馃洝锔� PARCHE CONDICI脫N DE CARRERA
            if (!this.conf || !this.conf.tk || this.conf.tk.length < 10) {
                this.sysLog('SEC', 'TX Info', 'Clave pendiente al despertar. Descartando orden fantasma.', 'warn');
                return; // 馃憟 Ya NO lo metemos en la colaOffline para evitar el bucle infinito
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
            this.sysLog('DB', 'TX', `Comando inyectado con 茅xito`);
            
        } catch (error) {
            this.sysLog('SEC', 'TX Err', error.message, 'err');
            this.notificar(`Fallo E2EE: ${error.message}`, "鉂�");
        }
    }

    sincronizarColaOffline() {
        if (this.colaOffline.length > 0 && navigator.onLine) {
            this.notificar(`Sincronizando ${this.colaOffline.length} comandos pendientes...`, "馃攧");
            this.sysLog('NET', 'Sync', `Vaciando cola offline (${this.colaOffline.length} items)`);
            this.colaOffline.forEach((orden, i) => {
                setTimeout(() => this.cmd(orden.app, orden.c), i * 200);
            });
            this.colaOffline = []; 
        }
    }

    setNetworkStatus(isOnline) {
        if(isOnline) {
            if(this._wasOffline) { 
                // Silenciamos la notificación visual de reconexión
                this.sysLog('NET', 'Info', 'Conexión recuperada en silencio tras micro-corte.'); 
                this._wasOffline = false; 
            }
            this.sincronizarColaOffline();
        } else {
            // Silenciamos la desconexión
            this.sysLog('NET', 'Info', 'Micro-corte de red (Navegador en suspensión).');
            this._wasOffline = true;
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
                this.setupBrokerMenu(); this.notificar(`Enrutando servidor a ${b.name}...`, "馃攢");
                this.sysLog('NET', 'Cambio Broker', `Solicitando rotaci贸n hacia ${b.h} en el pr贸ximo comando.`);
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
            let tempTxt = tBruto !== "" ? this.escapeHTML(String(tBruto)) + "掳C" : "";
            
            let rssiBruto = (val && val.rssi) ? val.rssi : -60;
            let rssi = this.escapeHTML(String(rssiBruto));
            let wifiColor = rssi > -50 ? "#32d74b" : (rssi > -70 ? "#ff9f0a" : "#ff453a"); 
            
            container.innerHTML = `
                <div class="pico-info-pill">
                    <span style="color:#32d74b; font-weight:bold; font-size:0.8rem">鈼�</span>
                    <span style="font-weight:600; color:var(--text-main); margin-right:5px">Online</span>
                    ${tempTxt ? `<span style="border-left:1px solid var(--border); padding-left:6px; margin-right:6px; font-size:0.8rem" title="CPU Temp"><i class="fa-solid fa-temperature-half"></i> ${tempTxt}</span>` : ''}
                    <span style="border-left:1px solid var(--border); padding-left:6px; color:${wifiColor}" title="Se帽al: ${rssi} dBm"><i class="fa-solid fa-wifi"></i></span>
                    <span style="border-left:1px solid var(--border); padding-left:6px; margin-left:6px; font-weight:600; font-size:0.8rem; color:${ramColor}" title="RAM Usada">${ramPercent}%</span>
                </div>`;
        } else {
            if (brokerTrigger) brokerTrigger.style.display = 'none';
            container.innerHTML = `<div class="pico-info-pill" style="border-color:var(--text-sec); opacity:0.7"><span class="dot red"></span><span style="font-weight:600; color:var(--text-sec);">Offline</span></div>`;
        }
    }

    // ==========================================================
    // 馃 BLOQUE 4: MOTOR SOCIAL (LA PLAZA)
    // ==========================================================
    
    escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&', '<': '<', '>': '>', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    async cargarPlazaPublica() {
        const cReq = document.getElementById('plaza-section-requests');
        const cFri = document.getElementById('plaza-section-friends');
        const cOth = document.getElementById('plaza-section-others');

        if (!cReq || !cFri || !cOth || !this.usuarioLogueado) return;
        this.sysLog('SOC', 'Plaza', 'Escaneando radar social.');

        cReq.innerHTML = `<h3 style="font-size: 0.8rem; color: #ff9f0a; border-bottom: 1px solid rgba(255, 159, 10, 0.3); padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-bell fa-shake"></i> SOLICITUDES ENTRANTES</h3>`;
        cFri.innerHTML = `<h3 style="font-size: 0.8rem; color: var(--primary); border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-user-group"></i> TUS CONEXIONES</h3>`;
        cOth.innerHTML = `<h3 style="font-size: 0.8rem; color: var(--text-sec); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-globe"></i> COMUNIDAD PICO</h3>`;
        
        try {
            const { data: usuarios, error: errU } = await this.supabase.from('plaza_publica').select('id, alias, avatar_url, estado_online');
            if (errU) throw errU;

            const { data: conexiones, error: errC } = await this.supabase.from('conexiones')
                .select('*').or(`solicitante_id.eq.${this.usuarioLogueado.id},receptor_id.eq.${this.usuarioLogueado.id}`);
            if (errC) throw errC;

            let countReq = 0, countFri = 0, countOth = 0;
            
            usuarios.forEach(u => {
                if (u.id === this.usuarioLogueado.id) return; 

                const alias = this.escapeHTML(u.alias || 'Usuario An贸nimo');
                let avatarUrl = u.avatar_url;
                if (avatarUrl && !avatarUrl.startsWith('http')) { avatarUrl = null; } 

                const estaOnline = (u.estado_online === true || u.estado_online === 'online' || u.estado_online === 'true');
                const colorEstado = estaOnline ? '#32d74b' : '#a1a1aa';
                const txtEstado = estaOnline ? 'Online' : 'Desconectado';

                let avatarHtml = `<i class="fa-solid fa-circle-user" style="font-size: 2.8rem; color: #a1a1aa;"></i>`;
                if (avatarUrl) avatarHtml = `<img src="${this.escapeHTML(avatarUrl)}" style="width: 45px; height: 45px; border-radius: 50%; background: var(--card-bg); border: 2px solid ${colorEstado}; object-fit: cover;">`;

                const conn = conexiones.find(c => c.solicitante_id === u.id || c.receptor_id === u.id);
                
                if (conn && conn.estado === 'pendiente' && conn.receptor_id === this.usuarioLogueado.id) {
                    countReq++;
                    cReq.innerHTML += `
                    <div class="user-card glass-element" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid rgba(255, 159, 10, 0.4); background: rgba(255, 159, 10, 0.05);">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="position: relative;">
                                ${avatarHtml}
                                <span style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: ${colorEstado}; border-radius: 50%; border: 2px solid var(--bg);"></span>
                            </div>
                            <div style="display: flex; flex-direction: column; text-align: left;">
                                <span style="font-weight: 800; color: var(--text-main); font-size: 1rem;">${alias}</span>
                                <span style="font-size: 0.75rem; color: #ff9f0a; font-weight: bold;">Quiere conectar contigo</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-action btn-aceptar" data-id="${this.escapeHTML(u.id)}" style="background: rgba(50, 215, 75, 0.2); color: #32d74b; border: 1px solid rgba(50, 215, 75, 0.5); width: 40px; height: 40px; border-radius: 10px; margin: 0; padding: 0; font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-check"></i></button>
                            <button class="btn-action btn-rechazar" data-id="${this.escapeHTML(u.id)}" style="background: rgba(255, 69, 58, 0.2); color: #ff453a; border: 1px solid rgba(255, 69, 58, 0.5); width: 40px; height: 40px; border-radius: 10px; margin: 0; padding: 0; font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>`;
                }
                else if (conn && conn.estado === 'aceptada') {
                    countFri++;
                    cFri.innerHTML += `
                    <div class="user-card glass-element" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid rgba(139, 92, 246, 0.2); ${!estaOnline ? 'opacity:0.6;' : ''}">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="position: relative;">
                                ${avatarHtml}
                                <span style="position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; background: ${colorEstado}; border-radius: 50%; border: 2px solid var(--bg); ${estaOnline ? 'box-shadow: 0 0 8px '+colorEstado+';' : ''}"></span>
                            </div>
                            <div style="display: flex; flex-direction: column; text-align: left;">
                                <span style="font-weight: 800; color: var(--text-main); font-size: 1rem;">${alias}</span>
                                <span style="font-size: 0.75rem; color: ${colorEstado}; font-weight: bold;">${txtEstado}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn-action" onclick="window.App.compartirAcceso('${this.escapeHTML(u.id)}', '${alias}')" style="background: rgba(10, 132, 255, 0.15); color: #0a84ff; border: 1px solid rgba(10, 132, 255, 0.5); width: auto; padding: 6px 12px; font-size: 0.8rem; margin: 0; border-radius: 8px;" title="Dar llaves de tu casa">
                                <i class="fa-solid fa-key"></i> Llaves
                            </button>
                        </div>
                    </div>`;
                }
                else {
                    countOth++;
                    const enviadaPorMi = (conn && conn.estado === 'pendiente' && conn.solicitante_id === this.usuarioLogueado.id);
                    let botonHtml = enviadaPorMi
                        ? `<button class="btn-action" disabled style="background: transparent; color: var(--text-sec); border: 1px solid rgba(255, 255, 255, 0.2); width: auto; padding: 8px 15px; border-radius: 10px; margin: 0; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; cursor: not-allowed;"><i class="fa-solid fa-clock"></i> Pendiente</button>`
                        : `<button class="btn-action btn-conectar" data-id="${this.escapeHTML(u.id)}" style="background: rgba(139, 92, 246, 0.15); color: var(--primary); border: 1px solid rgba(139, 92, 246, 0.4); width: auto; padding: 8px 15px; border-radius: 10px; margin: 0; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; cursor: pointer;"><i class="fa-solid fa-user-plus"></i> Conectar</button>`;

                    cOth.innerHTML += `
                    <div class="user-card glass-element" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid rgba(255, 255, 255, 0.05); opacity: 0.7;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="position: relative;">
                                ${avatarHtml}
                                <span style="position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px; background: ${colorEstado}; border-radius: 50%; border: 2px solid var(--bg);"></span>
                            </div>
                            <div style="display: flex; flex-direction: column; text-align: left;">
                                <span style="font-weight: bold; color: var(--text-main); font-size: 1rem;">${alias}</span>
                                <span style="font-size: 0.75rem; color: var(--text-sec);">${txtEstado}</span>
                            </div>
                        </div>
                        ${botonHtml}
                    </div>`;
                }
            });

            if(countReq === 0) cReq.style.display = 'none'; else cReq.style.display = 'block';
            if(countFri === 0) cFri.innerHTML += `<p style="color:var(--text-sec);font-size:0.85rem;text-align:center;">No tienes conexiones a煤n.</p>`;
            if(countOth === 0) cOth.innerHTML += `<p style="color:var(--text-sec);font-size:0.85rem;text-align:center;">No hay m谩s usuarios en la fortaleza.</p>`;

            document.querySelectorAll('.btn-conectar').forEach(btn => btn.onclick = () => this.enviarSolicitudAmistad(btn.dataset.id));
            document.querySelectorAll('.btn-aceptar').forEach(btn => btn.onclick = () => this.responderSolicitudAmistad(btn.dataset.id, 'aceptada'));
            document.querySelectorAll('.btn-rechazar').forEach(btn => btn.onclick = () => this.responderSolicitudAmistad(btn.dataset.id, 'rechazada'));

        } catch (err) {
            this.sysLog('SOC', 'Plaza Error', err.message, 'err');
            this.notificar("Error cargando el radar social", "鉂�");
        }
    }

    async enviarSolicitudAmistad(receptorId) {
        if(!this.usuarioLogueado) return;
        this.sysLog('SOC', 'Tx Conn', `Enviando solicitud a ID: ${receptorId}`);
        try {
            const { error } = await this.supabase.from('conexiones').insert({ solicitante_id: this.usuarioLogueado.id, receptor_id: receptorId });
            if (error) throw error;
            this.notificar("Solicitud enviada a la red", "馃摗"); this.vibra("tick"); this.cargarPlazaPublica();
        } catch(e) { this.sysLog('SOC', 'Tx Error', e.message, 'err'); this.notificar("Error al enviar solicitud", "鉂�"); }
    }

    async responderSolicitudAmistad(solicitanteId, accion) {
        if(!this.usuarioLogueado) return;
        this.sysLog('SOC', 'Rx Conn', `Respondiendo ${accion.toUpperCase()} a ID: ${solicitanteId}`);
        try {
            if (accion === 'aceptada') {
                const { error } = await this.supabase.from('conexiones').update({ estado: 'aceptada' }).match({ solicitante_id: solicitanteId, receptor_id: this.usuarioLogueado.id });
                if (error) throw error;
                this.notificar("Nueva conexi贸n establecida", "馃"); this.vibra("doble");
            } else {
                const { error } = await this.supabase.from('conexiones').delete().match({ solicitante_id: solicitanteId, receptor_id: this.usuarioLogueado.id });
                if (error) throw error;
                this.notificar("Solicitud rechazada", "馃棏锔�");
            }
            this.cargarPlazaPublica();
        } catch(e) { this.sysLog('SOC', 'Rx Error', e.message, 'err'); this.notificar("Error al procesar", "鉂�"); }
    }

    async compartirAcceso(invitadoId, alias) {
        if (!confirm(`驴Quieres dar a ${alias} acceso a tu Frecuencia Privada?\n\nPodr谩 ver tus sensores y controlar el hardware.`)) return;
        
        this.notificar("Forjando invitaci贸n cifrada...", "鈿欙笍");
        this.sysLog('SEC', 'Accesos', `Concediendo llaves a: ${alias}`);
        
        try {
            const { error } = await this.supabase.from('accesos_hogares').insert({
                hogar_id: this.miHogarId,
                invitado_id: invitadoId
            });

            if (error) {
                // C贸digo 23505 es Unique Violation en PostgreSQL
                if (error.code === '23505') throw new Error("Ya tiene las llaves");
                throw error;
            }
            
            this.notificar(`Llaves entregadas a ${alias}`, "鉁�");
            this.vibra("doble");
            
        } catch (e) {
            this.sysLog('SEC', 'Accesos Err', e.message, 'err');
            this.notificar(e.message.includes("Ya tiene") ? "Ese usuario ya tiene acceso" : "Fallo al compartir llaves", "鉂�");
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
                <button class="btn-c-tamano" style="background:none; border:none; color:#0a84ff; font-size:1.8rem; cursor:pointer; transition:0.2s;" title="Cambiar Tama帽o"><i class="fa-solid fa-expand"></i></button>
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
                if (card.abrirAjustes) card.abrirAjustes(this); else this.notificar(`Esta tarjeta no tiene ajustes`, "鈩癸笍");
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
                <div style="font-size:1.5rem; color:var(--text-sec); font-weight:bold; margin-top:20px; z-index:100; pointer-events:none;">脳</div>
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
        if (icon.includes('鉁�') || icon.includes('馃攱') || icon.includes('馃尶')) return '#32d74b'; 
        if (icon.includes('鉂�') || icon.includes('馃毃') || icon.includes('馃洃') || icon.includes('馃棏锔�')) return '#ff453a'; 
        if (icon.includes('鈿狅笍') || icon.includes('馃Ч') || icon.includes('鈿�') || icon.includes('鈴�')) return '#ff9f0a'; 
        if (icon.includes('鈩癸笍') || icon.includes('馃寪') || icon.includes('馃攢') || icon.includes('馃棧锔�') || icon.includes('馃摗') || icon.includes('馃攷') || icon.includes('馃摶')) return '#0a84ff'; 
        if (icon.includes('馃') || icon.includes('馃') || icon.includes('馃К') || icon.includes('馃幉') || icon.includes('馃敭')) return '#bf5af2'; 
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

    notificar(msg, icon = "鉁�") {
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
    // 馃 BLOQUE 6: IA NATIVA, JARVIS Y LLM
    // ==========================================================

    initVozJARVIS() {
        const btnVoz = document.querySelector('.fa-robot'); const input = document.getElementById('ai-input');
        if (!btnVoz || (!window.SpeechRecognition && !window.webkitSpeechRecognition)) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition(); recognition.lang = 'es-ES'; recognition.continuous = false; recognition.interimResults = false;

        btnVoz.style.cursor = "pointer";
        btnVoz.onclick = () => { recognition.start(); btnVoz.style.color = "#ff453a"; btnVoz.classList.add("fa-beat-fade"); input.placeholder = "Escuchando 贸rdenes..."; this.vibra("tick"); };
        recognition.onresult = (event) => { input.value = event.results[0][0].transcript; btnVoz.style.color = "var(--primary)"; btnVoz.classList.remove("fa-beat-fade"); input.placeholder = "Ej: Apaga la luz..."; this.vibra("doble"); setTimeout(() => this.procesarComandoIA(), 500); };
        recognition.onerror = () => { btnVoz.style.color = "var(--primary)"; btnVoz.classList.remove("fa-beat-fade"); input.placeholder = "Fallo ac煤stico. Escribe..."; };
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
        this.notificar("Procesando...", "馃");
        this.sysLog('IA', 'Input', `Prompt recibido: "${orden}"`);

        this.ejecutarInferencia(orden, "reactivo");
    }

    iniciarAgenteProactivo() {
        this.notificar("Agente Aut贸nomo en l铆nea", "馃洝锔�");
        setInterval(() => {
            this.sysLog('IA', 'Proactivo', 'Ejecutando escaneo silencioso de telemetr铆a.');
            this.ejecutarInferencia("Analiza el estado actual de la casa. Si detectas alguna anomal铆a de seguridad, un gasto excesivo, o un clima que requiera acci贸n, act煤a. Si todo est谩 bien, no hagas nada y mant茅n 'comandos' vac铆o y 'voz' nulo.", "proactivo");
        }, 600000);
    }

    async ejecutarInferencia(orden, modo = "reactivo") {
        const statusEl = document.querySelector('.pico-info-pill');
        const picoStatus = (statusEl && statusEl.innerText.includes('Online')) ? 'ONLINE (Conectada)' : 'OFFLINE (Desconectada)';
        let contextoFisico = `--- TELEMETR脥A F脥SICA ACTUAL (ESTADO PICO: ${picoStatus}) ---\n`;
        document.querySelectorAll('.card').forEach(card => { contextoFisico += `- M贸dulo [${card.dataset.id}]: ${card.querySelector('.val-text')?.innerText || "Activo"}\n`; });
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
                    // 🔥 Apuntamos directo al Búnker en Render
                    const req = await fetch('https://pablobp10-github-io.onrender.com/api/ia', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            proveedor: proveedorElegido, 
                            prompt_sistema: promptSistema, 
                            prompt_humano: orden, 
                            modo: modo 
                        })
                    });
                    
                    if (!req.ok) throw new Error("Render no responde");
                    const data = await req.json();
                    
                    if (data && data.texto) {
                        this.desplegarPayloadCuantico(data.texto, orden, modo);
                    }
                } catch (err) {
                    this.sysLog('IA', 'Nube Err', 'Edge Function fall贸. Fallback a Local.', 'warn');
                    if(modo === "reactivo") {
                        this.notificar("Nube ca铆da. Intentando IA Local...", "馃攱");
                        await this.procesarConWebLLM(promptSistema, orden, modo);
                    }
                }
            } else {
                this.notificar("Sin conexi贸n a la red", "鉂�");
                if(modo === "reactivo") {
                    this.notificar("Offline. Intentando IA Local...", "馃攱");
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
            container.insertAdjacentHTML('beforeend', `<div class="toast" id="toast-ia-dl" style="border:1px solid var(--primary); animation: slideIn 0.3s forwards;">鈴� <span id="ia-dl-text" style="margin-left:8px; font-weight:bold;">Montando IA en VRAM...</span><div style="width:100%; background:var(--bg); height:6px; margin-top:10px; border-radius:3px; overflow:hidden;"><div id="ia-dl-bar" style="width:0%; background:#32d74b; height:100%; transition:width 0.2s linear;"></div></div></div>`);
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
                this.sysLog('IA', 'Motor Local', `Arrancando WASM M贸vil -> ${modeloElegido}`);
                
                const modelosPesados = ['mistral', 'llama3', 'hermes', 'vicuna', 'wizardlm'];
                if (modelosPesados.includes(modeloElegido)) {
                    throw new Error("Este modelo es demasiado pesado para el m贸vil. Usa uno < 3B.");
                }

                                try {
                    // 🔥 Volvemos a tu motor original y estable
                    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0');
                    env.allowLocalModels = false; 
                    env.useBrowserCache = true; 
                    env.backends.onnx.wasm.numThreads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
                    
                    const textEl = document.getElementById('ia-dl-text'); 
                    if(textEl) textEl.innerText = "Iniciando motor WASM...";
                    
                    const modelosMovil = {
                        // 🛡️ Esquivamos el archivo corrupto de SmolLM. 
                        // Usamos Qwen 0.5B de Xenova: Es el más pequeño, rápido y seguro para Opera.
                        'smollm': 'Xenova/Qwen1.5-0.5B-Chat',
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
            
            this.notificar(`${e.message}`, "鉂�");
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
                const promptMovil = `<|im_start|>system\n${promptSistema}\nATENCI脫N: Tu 煤nica salida debe ser exclusivamente un bloque JSON v谩lido. Nada de texto extra.<|im_end|>\n<|im_start|>user\n${orden}<|im_end|>\n<|im_start|>assistant\n`;
                const respuesta = await this.localEngineWASM(promptMovil, { max_new_tokens: 200, temperature: 0.1, repetition_penalty: 1.1, do_sample: false });
                let outputStr = respuesta[0].generated_text.replace(promptMovil, "").trim();
                const jsonMatch = outputStr.match(/\{[\s\S]*\}/); if (jsonMatch) textoCrudo = jsonMatch[0]; else throw new Error("El motor m贸vil no devolvi贸 JSON");
            } else { throw new Error("Ning煤n motor local inicializado"); }

            this.sysLog('IA', 'Respuesta Local', textoCrudo);
            this.desplegarPayloadCuantico(textoCrudo, orden, modo);
        } catch(e) { this.sysLog('IA', 'Colapso Local', e.message, 'err'); this.notificar("Colapso l贸gico en IA Local", "鉂�"); }
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
            } else if (modo === "reactivo") { this.notificar("An谩lisis completado. Sin acciones.", "馃"); }

            if (payload.ui_acciones && payload.ui_acciones.length > 0) {
                payload.ui_acciones.forEach(acc => {
                    if (acc.tipo === "escribir") { const input = document.getElementById(acc.id); if (input) { input.value = acc.valor; this.logHUD(`Escribiendo en [${acc.id}]: "${acc.valor}"`, "info"); } } 
                    else if (acc.tipo === "click") { const btn = document.getElementById(acc.id); if (btn) { btn.click(); this.logHUD(`Pulsando [${acc.id}]`, "info"); } } 
                    else if (acc.tipo === "css") { const el = acc.id === "body" ? document.body : document.getElementById(acc.id); if (el) { el.style[acc.propiedad] = acc.valor; this.logHUD(`CSS Mod [${acc.id}]`, "info"); } }
                });
            }
            
            if (payload.voz && payload.voz !== "null" && !this.iaSilenciada) {
                let icono = "馃棧锔�"; if(payload.estado_emocional === 'alerta') icono = "馃毃"; if(payload.estado_emocional === 'ironico') icono = "馃槒";
                if(modo === "reactivo" || payload.estado_emocional === 'alerta') { this.notificar(payload.voz, icono); this.hablarJARVIS(payload.voz); }
            }

            if(modo === "reactivo") {
                this.historialIA = this.historialIA || [];
                this.historialIA.push({ u: orden, a: payload.voz || "Silencio t谩ctico." });
                if (this.historialIA.length > 4) this.historialIA.shift();
            }
        } catch (e) { this.sysLog('IA', 'Parse Error', e.message, 'err'); this.notificar("Sinapsis colapsada", "鈿狅笍"); }
    }

    async iniciarCentinelaAudio() {
        if (this.centinelaActivo) { this.notificar("Centinela auditivo ya activo", "馃洝锔�"); return; }
        try {
            this.notificar("Cargando red neuronal auditiva...", "鈴�");
            if (!this.tf) this.tf = await import("https://esm.run/@tensorflow/tfjs@4.17.0");
            const speechCommands = await import("https://esm.run/@tensorflow-models/speech-commands@0.5.4");

            this.recognizer = speechCommands.create("BROWSER_FFT");
            await this.recognizer.ensureModelLoaded();
            const palabras = this.recognizer.wordLabels();
            this.sysLog('AUDIO', 'Mic', 'Motor TFJS cargado. O铆do bi贸nico activo.');

            this.recognizer.listen(result => {
                const maxScore = Math.max(...result.scores); const maxScoreIndex = Array.from(result.scores).indexOf(maxScore);
                const palabraDetectada = palabras[maxScoreIndex];
                if (maxScore > 0.85 && palabraDetectada === "go") { this.vibra("doble"); this.hablarJARVIS("A la escucha."); }
            }, { probabilityThreshold: 0.85, invokeCallbackOnNoiseAndUnknown: false, overlapFactor: 0.5 });
            this.centinelaActivo = true; this.notificar("O铆do bi贸nico online", "馃帣锔�");
        } catch (error) { this.sysLog('AUDIO', 'Mic Err', error.message, 'err'); this.notificar("Fallo de micr贸fono", "鉂�"); document.getElementById('sw-jarvis').checked = false; }
    }
    
    detenerCentinelaAudio() { if (this.recognizer && this.centinelaActivo) { this.recognizer.stopListening(); this.centinelaActivo = false; this.notificar("Centinela auditivo en reposo", "馃洃"); } }

    initInterruptorIA() {
        const aiInput = document.getElementById('ai-input'); if (!aiInput || document.getElementById('btn-ia-mode')) return;
        const btnMode = document.createElement('button'); btnMode.id = 'btn-ia-mode'; this.modoIALocal = false; this.reintentoNubeActivo = null;
        btnMode.innerHTML = '<i class="fa-solid fa-cloud"></i>'; btnMode.style.cssText = "background:transparent; border:none; color:var(--text-sec); font-size:1.2rem; cursor:pointer; padding:0 10px; outline:none; transition: 0.3s;";
        aiInput.parentNode.insertBefore(btnMode, aiInput);
        btnMode.onclick = async () => { this.detenerReintento(); if (!this.modoIALocal) { await this.activarModoLocal(btnMode); } else { this.activarModoNube(btnMode); } };
    }

    async activarModoLocal(btn) {
        if(!btn) btn = document.getElementById('btn-ia-mode'); btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; this.notificar("Arrancando turbinas locales...", "鈿欙笍");
        const exito = await this.precargarMotorLocal();
        if (exito) { this.modoIALocal = true; btn.innerHTML = '<i class="fa-solid fa-microchip"></i>'; btn.style.color = '#32d74b'; this.notificar("IA Local al mando", "馃敀"); return true; } 
        else { this.notificar("Hardware incompatible", "鈿狅笍"); this.activarModoNube(btn); return false; }
    }

    activarModoNube(btn) { if(!btn) btn = document.getElementById('btn-ia-mode'); this.modoIALocal = false; btn.innerHTML = '<i class="fa-solid fa-cloud"></i>'; btn.style.color = 'var(--text-sec)'; this.notificar("Modo IA Nube activado", "鈽侊笍"); }
    
    async gestionarFalloIA(origenFallo) {
        const btn = document.getElementById('btn-ia-mode');
        if (origenFallo === 'nube') {
            this.notificar("Nube ca铆da. Desplegando IA Local...", "鈿狅笍"); const exitoLocal = await this.activarModoLocal(btn);
            if (!exitoLocal) {
                this.notificar("Apag贸n total IA. Reintentando...", "馃毃"); btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#ff453a;"></i>';
                if (!this.reintentoNubeActivo) { this.reintentoNubeActivo = setInterval(() => { this.notificar("Reintentando Nube...", "馃攧"); this.activarModoNube(btn); }, 60000); }
            }
        } else if (origenFallo === 'local') { this.notificar("Local colapsado. Evacuando a Nube...", "鈿狅笍"); this.activarModoNube(btn); }
    }
    
    detenerReintento() { if (this.reintentoNubeActivo) { clearInterval(this.reintentoNubeActivo); this.reintentoNubeActivo = null; } }

    // ==========================================================
    // 鈿欙笍 BLOQUE 7: MISCEL脕NEA, HARDWARE Y DB
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
            case "VozIA": this.iaSilenciada = (accion === "mute"); if (this.iaSilenciada) this.notificar("Voz JARVIS off", "馃攪"); else this.notificar("Voz JARVIS on", "馃攰"); break;
            case "Consciencia": const modos = { 'logico': { nombre: 'L脫GICO'}, 'ironico': { nombre: 'IR脫NICO' }, 'defensa': { nombre: 'DEFENSA'}, 'zen': { nombre: 'MODO ZEN'} }; if(modos[accion]) { localStorage.setItem('pico_ai_modo', accion); this.notificar(`Modo: ${modos[accion].nombre}`, "馃К"); this.pub('Sistema/Consciencia', accion, true); } break;
            case "IA": if (accion === "clear" || accion === "limpiar") { window.iaMensajes = []; const chatBox = document.getElementById('chat-history'); if (chatBox) chatBox.innerHTML = '<div style="text-align:center; color:var(--text-sec); margin-top:10px;">Memoria purgada.</div>'; this.notificar("Memoria IA reiniciada", "馃"); } break;
        }
        return true;
    }

    async comprobarActualizaciones(esArranqueSilencioso = false) {
        if (!esArranqueSilencioso) this.notificar("Buscando transmisiones en GitHub...", "馃摗");
        
        try {
            const res = await fetch(`changelog.json?t=${new Date().getTime()}`);
            if (!res.ok) throw new Error("Servidor de versiones inaccesible");
            
            const nube = await res.json();
            const versionLocal = localStorage.getItem('pico_version') || 'v1.0.0';

            if (nube.version !== versionLocal) {
                this.sysLog('SYS', 'Update', `Nueva versi贸n detectada: ${nube.version}`);
                
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
                    this.notificar(`Sistema actualizado a ${nube.version}`, "鉁�");
                    
                    if (nube.forzar_recarga && 'serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(registrations => {
                            for(let registration of registrations) { registration.update(); }
                        });
                    }
                };
            } else {
                if (!esArranqueSilencioso) this.notificar("El sistema ya est谩 en la 煤ltima versi贸n", "鉁�");
            }
        } catch (error) {
            this.sysLog('SYS', 'Update Err', error.message, 'warn');
            if (!esArranqueSilencioso) this.notificar("Fallo al contactar con la central", "鉂�");
        }
    }
    
    ejecutarConDeshacer(app, comando, tiempoGracia = 3000) {
        const tarjeta = this.cards.find(c => c.id === app);
        if (tarjeta && tarjeta.undo) {
            const toastId = Math.random().toString(36).substr(2,9); const container = document.getElementById('toast-area');
            const toast = document.createElement('div'); toast.className = "toast"; toast.style.position = "relative"; toast.style.overflow = "hidden";
            toast.innerHTML = `鈴� <span style="margin-left:8px">Orden a ${app} en espera...</span><button class="toast-undo-btn" id="undo-${toastId}">DESHACER</button><div class="toast-progress"></div>`; container.appendChild(toast);
            const timerId = setTimeout(() => { this.cmd(app, comando); toast.remove(); }, tiempoGracia);
            document.getElementById(`undo-${toastId}`).onclick = () => { clearTimeout(timerId); toast.remove(); this.notificar(`Acci贸n cancelada`, "馃洃"); };
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
            btnPurgar.innerHTML = "馃挘 PURGAR MEMORIA";
            btnPurgar.style.cssText = "position: absolute; top: 10px; right: 10px; background:#ff9f0a; color:white; border:none; padding:5px 15px; border-radius:5px; font-weight:bold; cursor:pointer; z-index: 1000;";
            
            btnPurgar.onclick = () => {
                if(confirm('驴鈿狅笍 ALERTA GOD: Formatear toda la memoria local, perfiles, cach茅s y service workers?')) {
                    this.sysLog('SEC', 'PURGA', 'Iniciando autodestrucci贸n de cach茅...', 'warn');
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

            this.logHUD("INTERCEPTANDO TR脕FICO MQTT..."); 
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
                textoFinal += `\n   馃摝 DATA: ${dataStr}`;
            }
            if ((tipo === 'error' || tipo === 'err') && solucion) {
                textoFinal += `\n   馃挕 FIX: ${solucion}`;
            }
        } 
        else if (this.rol === 'admin') {
            if (tipo === 'out' || msg.includes('DATA:')) return; 
            textoFinal = `> ${msg}`;
        } 
        else {
            if (tipo !== 'error' && tipo !== 'err') return; 
            const pseudoCodigo = Math.random().toString(36).substring(7).toUpperCase();
            textoFinal = `> 鈿狅笍 Error de sistema interceptado. (C贸digo: ${pseudoCodigo}). Notifique al administrador.`;
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
        if (!('documentPictureInPicture' in window)) return this.notificar("Tu navegador no soporta PiP", "鉂�");
        const tarjeta = this.cards.find(c => c.id === app); if(!tarjeta || !tarjeta.pip) return;
        try {
            const pipWindow = await documentPictureInPicture.requestWindow({ width: 250, height: 250 });
            const style = document.createElement('style'); style.textContent = `body { background: #1c1c1e; color: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif; height: 100vh; margin: 0; } .val-text { font-size: 3rem; font-weight: bold; }`;
            pipWindow.document.head.appendChild(style); pipWindow.document.body.innerHTML = `<div style="text-align:center"><div style="color:#8e8e93">${app.toUpperCase()}</div><div class="val-text" id="pip-val">...</div></div>`;
            this.notificar(`${app} extra铆do a PiP`, "馃獰");
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
            card.classList.add('multiplayer-active'); this.notificar(`Otro usuario usa ${appId}`, "馃懃");
            setTimeout(() => card.classList.remove('multiplayer-active'), 3000);
        };
    }

    async leerNFC() {
        if (!("NDEFReader" in window)) return this.notificar("Dispositivo sin NFC compatible", "鉂�");
        try {
            const ndef = new NDEFReader(); await ndef.scan(); this.notificar("Acerca el NFC...", "馃摗"); this.vibra("doble");
            ndef.addEventListener("reading", ({ message, serialNumber }) => { this.vibra("tick"); this.notificar(`NFC: ${serialNumber}`, "鉁�"); this.logHUD(`NFC: ${serialNumber}`); });
        } catch (error) { this.notificar("Error lector NFC", "鉂�"); this.sysLog('HW', 'NFC Err', error.message, 'err'); }
    }

    async iniciarRadarBluetooth() {
        if (!navigator.bluetooth) return this.notificar("Bluetooth Web no soportado", "鉂�");
        try { this.notificar("Escaneando balizas...", "馃攷"); const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true }); this.vibra("tick"); this.notificar(`Baliza: ${device.name || 'Desconocido'}`, "鉁�"); } 
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
        btnClear.onclick = () => { if(confirm("驴Borrar plano?")) { savedMap = Array(totalCells).fill(''); localStorage.setItem('miPlanoTiles', JSON.stringify(savedMap)); document.querySelectorAll('.grid-cell').forEach(c => c.className = 'grid-cell'); this.vibra("doble"); } };
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
            if(!currentBinding || !promptCrudo) return this.notificar("Falta el atajo o el texto", "鈿狅笍");
            
            const promptSeguro = this.escapeHTML(promptCrudo);
            
            btnCompile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compilando...`; this.vibra("tick");
            setTimeout(() => {
                const codigoJSONGenerado = JSON.stringify({ "Led": "toggle", "Pomodoro": 25 }); if(emptyMsg) emptyMsg.style.display = 'none';
                const li = document.createElement('li'); li.className = "macro-item cascade-in"; 
                li.innerHTML = `<div style="display:flex; flex-direction:column; gap:5px;"><span style="font-family:monospace; font-weight:900; color:var(--primary); font-size:1.1rem;"><i class="fa-regular fa-keyboard"></i> ${currentBinding}</span><span style="font-size:0.85rem; color:var(--text-sec);">"${promptSeguro}"</span><span style="font-family:monospace; font-size:0.75rem; color:#32d74b;">> ${codigoJSONGenerado}</span></div><button class="btn-del" onclick="this.parentElement.remove(); window.App.vibra('doble');"><i class="fa-solid fa-trash"></i></button>`;
                list.appendChild(li); promptInput.value = ""; displayKey.innerText = "Sin asignar"; currentBinding = ""; btnCompile.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Compilar y Guardar`; this.notificar("Atajo compilado con 茅xito", "鉁�");
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
            if (!this.db) return resolve("Sin datos hist贸ricos.");
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
    // 鈿旓笍 BLOQUE 8: CONTROL DE ACCESOS Y FORJA (GOD MODE ONLY)
    // ==========================================================

    async comprobarSolicitudesPendientes() {
        if (this.rol !== 'god') return; 
        try {
            const { data, error } = await this.supabase.from('perfiles').select('id, rol').eq('rol', 'pendiente');
            if (data && data.length > 0) {
                this.sysLog('SEC', 'Radar', `Detectadas ${data.length} solicitudes pendientes.`);
                setTimeout(() => {
                    this.notificar(`${data.length} solicitud(es) de acceso. Abre la consola HUD.`, "馃敂"); this.vibra("doble");
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
        this.sysLog('SEC', 'Aprobaci贸n', `Otorgando acceso a UserID: ${userId}`);
        
        try {
            this.notificar("Aprobando acceso en la base de datos...", "鈴�");
            
            const { error } = await this.supabase.from('perfiles')
                .update({ rol: 'guest', updated_at: new Date() }).eq('id', userId);
            
            if (error) throw error;
            
            this.sysLog('SEC', 'Aprobaci贸n OK', 'Usuario verificado. Esperando su primer login.');
            this.notificar("Usuario autorizado en el sistema", "鉁�");
            this.logHUD(`USUARIO APROBADO: Al iniciar sesi贸n, su propio equipo forjar谩 las llaves E2EE.`, "out");
            
        } catch (error) {
            this.sysLog('SEC', 'Aprobaci贸n Err', error.message, 'err');
            this.notificar("Fallo al autorizar usuario", "鉂�");
        }
    }
    
    // ==========================================================
    // 馃摶 BLOQUE 9: CANALES (Sintonizaci贸n Din谩mica)
    // ==========================================================

    async cargarCanales() {
        this.sysLog('NET', 'Canales', 'Buscando canales disponibles...');
        const lista = document.getElementById('lista-canales-publicos');
        const btnCrear = document.getElementById('btn-crear-canal');
        
        if (!lista) return;
        lista.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary); font-size:2rem;"></i></div>';

        // 馃殌 PARCHE UI: Forzamos el display con !important para vencer al CSS oculto
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

            // 馃殌 PARCHE UX: Filtramos tu propio canal principal para que no salga en la lista
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

        this.notificar("Creando canal cifrado...", "鈿欙笍");
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
            this.notificar("Canal creado", "鉁�");
            this.cargarCanales();
        } catch (e) {
            this.sysLog('NET', 'Crear Canal Err', e.message, 'err');
            this.notificar("Fallo al crear el canal", "鉂�");
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
        
        this.notificar(`Conectado a: ${nombre}`, "馃摶");
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

        this.notificar("Canal Privado restaurado", "馃敀");
        this.vibra("tick");
        this.cargarCanales();
    }
}
