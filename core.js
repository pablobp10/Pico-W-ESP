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

        // Hacemos que el núcleo sea accesible globalmente para eventos HTML sueltos
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
            if (!document.getElementById('eruda-script')) {
                const script = document.createElement('script');
                script.id = 'eruda-script';
                script.src = "https://cdn.jsdelivr.net/npm/eruda";
                script.onload = () => { eruda.init(); this.sysLog('SEC', 'Inyección', 'Herramientas de depuración Eruda montadas.', 'info'); };
                document.head.appendChild(script);
            }
            console.log = window._consolaOriginal.log;
            console.warn = window._consolaOriginal.warn;
            console.error = window._consolaOriginal.error;
            console.info = window._consolaOriginal.info;
            
        } else {
            const ofuscador = () => {};
            console.log = ofuscador;
            console.info = ofuscador;
            console.warn = ofuscador;
            
            console.error = (...args) => {
                if (this.rol === 'admin') {
                    window._consolaOriginal.warn("⚠️ [SISTEMA] Error técnico detectado. Contacta con el GOD de la red.");
                }
            };
        }
    }

    sysLog(modulo, accion, mensaje, tipo = "info", dataExtra = null, solucion = null) {
        // 1. Consola F12 (Navegador) -> Solo Nivel GOD
        if (this.rol === 'god' && window._consolaOriginal) {
            const log = window._consolaOriginal[tipo === 'err' || tipo === 'error' ? 'error' : tipo === 'warn' ? 'warn' : 'log'];
            const colores = { net: "#0a84ff", sec: "#ff453a", db: "#bf5af2", ia: "#32d74b", sys: "#ff9f0a", mqtt: "#00c7be" };
            const color = colores[modulo.toLowerCase()] || "#a1a1aa";
            const timestamp = new Date().toISOString().split('T')[1].slice(0,-1);
            
            log(`%c[${timestamp}] [${modulo.toUpperCase()}] %c${accion.toUpperCase()}:`, `color: ${color}; font-weight: bold;`, `color: #fff; font-weight: normal;`, mensaje);
            if (dataExtra) { try { log(JSON.parse(JSON.stringify(dataExtra))); } catch(e) { log("[Objeto complejo]", dataExtra); } }
            
            // Si hay una solución propuesta, la imprimimos en verde chillón
            if ((tipo === 'error' || tipo === 'err') && solucion) {
                log(`%c💡 SUGERENCIA DE FIX: %c${solucion}`, `color: #32d74b; font-weight: bold;`, `color: #fff; font-weight: normal;`);
            }
        }

        // 2. Puente al HUD flotante de la pantalla (el HUD decide qué muestra según el rol)
        this.logHUD(`[${modulo.toUpperCase()}] ${accion}: ${mensaje}`, tipo, dataExtra, solucion);
    }

    tienePermiso(rolRequerido) {
        const jerarquia = { 'guest': 1, 'admin': 2, 'god': 3 };
        const miNivel = jerarquia[this.rol] || 1;
        const reqNivel = jerarquia[rolRequerido || 'guest']; 
        return miNivel >= reqNivel;
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

        // --- BOTONES DE LOGIN Y SISTEMA ---
        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };
        const btnHuella = document.getElementById('btn-huella');
        if(btnHuella) btnHuella.onclick = (e) => { e.preventDefault(); this.manejarHuella(); };
        
        // 🆕 Lógica de Registro Conectada
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
        // ------------------------------------

        

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

        // 🛡️ PARCHE: Autologin hiperseguro usando el Token de Sesión de Supabase
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                this.sysLog('SEC', 'AutoLogin', 'Sesión segura recuperada. Saltando pantalla de login.');
                this.usuarioLogueado = session.user;
                
                // Ocultamos la pantalla de login directamente
                if (loginScreen) loginScreen.style.display = 'none';
                
                // Ejecutamos la carga de datos sin pasar por la Edge Function (ya estamos validados)
                this.cargarDatosDespuesDeLogin(session.access_token);
            } else {
                // Si no hay sesión segura, mostramos la pantalla de login normal
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
    }


    // ==========================================================
    // 🔐 BLOQUE 1: IDENTIDAD, AUTENTICACIÓN Y SEGURIDAD DB
    // ==========================================================

    guardarBovedaHardware(confData) {
        // Encriptamos la llave maestra usando la huella física del PC/Móvil
        const huella = this.generarHuellaDispositivo();
        const cifrado = CryptoJS.AES.encrypt(JSON.stringify(confData), huella).toString();
        localStorage.setItem('pico_hardware_vault', cifrado);
        this.sysLog('SEC', 'Vault', 'Bóveda de hardware sellada con éxito.');
    }

    abrirBovedaHardware() {
        const cifrado = localStorage.getItem('pico_hardware_vault');
        if (!cifrado) return null;
        try {
            // Intentamos abrir el candado con el hardware actual
            const huella = this.generarHuellaDispositivo();
            const bytes = CryptoJS.AES.decrypt(cifrado, huella);
            const descifrado = bytes.toString(CryptoJS.enc.Utf8);
            if (!descifrado) return null;
            return JSON.parse(descifrado);
        } catch (e) {
            this.sysLog('SEC', 'Vault Err', 'Fallo al abrir bóveda local (¿Cambio de hardware?).', 'err');
            return null;
        }
    }
    
    generarHuellaDispositivo() {
        const n = navigator;
        const s = screen;
        
        // Recopilamos datos físicos que no cambian al borrar la caché
        const componentes = [
            n.userAgent,                                      
            n.language,                                       
            s.width + "x" + s.height + "x" + s.colorDepth,    
            Intl.DateTimeFormat().resolvedOptions().timeZone, 
            n.hardwareConcurrency || 'unknown',               
            n.deviceMemory || 'unknown'                       
        ];
        
        const stringBase = componentes.join("||");
        
        // Algoritmo rápido de Hash (DJB2)
        let hash = 5381;
        for (let i = 0; i < stringBase.length; i++) {
            hash = ((hash << 5) + hash) + stringBase.charCodeAt(i);
        }
        
        return "fp-" + Math.abs(hash).toString(16);
    }
   
    obtenerNombreDispositivo(huella) {
        const ua = navigator.userAgent;
        let navegador = "Navegador Desconocido";
        let so = "Dispositivo Desconocido";

        // 1. Detectar Navegador
        if (ua.includes("Firefox")) navegador = "Firefox";
        else if (ua.includes("OPR") || ua.includes("Opera")) navegador = "Opera";
        else if (ua.includes("Edg")) navegador = "Edge";
        else if (ua.includes("Chrome")) navegador = "Chrome";
        else if (ua.includes("Safari")) navegador = "Safari";

        // 2. Detectar Sistema Operativo
        if (ua.includes("Win")) so = "Windows";
        else if (ua.includes("Mac")) so = "Mac";
        else if (ua.includes("Linux")) so = "Linux";
        else if (ua.includes("Android")) so = "Android";
        else if (ua.includes("like Mac")) so = "iOS";

        // 3. Extraer 4 letras únicas
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
        this.sysLog('SEC', 'Login', `Llamada a Edge Function iniciada`, 'info', { email: emailAuth });

        try {
            // 🧬 1. Generamos la huella digital pasiva del dispositivo
            const deviceId = this.generarHuellaDispositivo();
            
            // 📱 2. Detección en tiempo real del tipo de hardware para el frontend
            const esMovilReal = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            this.esMovil = esMovilReal; 
            
            // 🏷️ 3. Generamos el nombre dinámico para la Base de Datos y correos
            const deviceName = this.obtenerNombreDispositivo(deviceId);

            const functionUrl = 'https://piruxdxdvynacdtjbjux.supabase.co/functions/v1/login-seguro';
            const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcnV4ZHhkdnluYWNkdGpianV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjc3MDAsImV4cCI6MjA4ODg0MzcwMH0.iLBhbFRInA21_QLNJp57qQ7SJPPivq4c_XzUywBum6w';

            const req = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
                body: JSON.stringify({ email: emailAuth, password: p, device_id: deviceId, device_name: deviceName })
            });
            
            const rawText = await req.text();
            if (!req.ok) throw new Error(`Servidor rechazó la petición (HTTP ${req.status}): ${rawText}`);
            
            const data = JSON.parse(rawText);
            await this.supabase.auth.setSession(data.session);
            this.usuarioLogueado = data.user;
            this.sysLog('SEC', 'Login OK', 'Token JWT adquirido correctamente.', 'info', data.user.id);

            // SINCRONIZACIÓN
            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (perfilNube?.rol === 'pendiente') throw new Error("Tu cuenta está en revisión.");
            if (dbError || !perfilNube) throw new Error("Perfil DB no encontrado.");

            const localSyncDate = localStorage.getItem('pico_last_sync');
            const fechaNube = new Date(perfilNube.updated_at).getTime();
            const fechaLocal = localSyncDate ? new Date(localSyncDate).getTime() : 0;

            if (fechaNube >= fechaLocal) {
                this.perfilDB = perfilNube;
                localStorage.setItem('pico_perfil_cache', JSON.stringify(perfilNube));
                localStorage.setItem('pico_last_sync', perfilNube.updated_at);
                this.sysLog('DB', 'Sync', 'Descargada versión más reciente de la nube.');
            } else {
                this.perfilDB = JSON.parse(localStorage.getItem('pico_perfil_cache'));
                await this.guardarPerfilEnNube(this.perfilDB); 
                this.sysLog('DB', 'Sync', 'Subida versión local (más reciente) a la nube.');
            }

            if (!this.perfilDB.tarjetas) this.perfilDB.tarjetas = { orden: [], tamanos: {} };
            this.rol = this.perfilDB.rol;
            
            // 🛡️ PARCHE E2EE: Lógica de auto-sanación y cifrado
            let confData = null;
            try {
                // Intento 1: ¿Está en texto plano en Supabase? (La vulnerabilidad que vamos a matar)
                confData = JSON.parse(this.perfilDB.maletin_encriptado);
                
                // Si llegamos aquí sin error, la BD está expuesta. ¡Lo encriptamos al vuelo!
                const maletinSeguro = CryptoJS.AES.encrypt(JSON.stringify(confData), p).toString();
                await this.supabase.from('perfiles').update({ maletin_encriptado: maletinSeguro }).eq('id', this.usuarioLogueado.id);
                this.sysLog('SEC', 'Upgrade', 'Maletín convertido a AES en la base de datos Supabase.');
            } catch (e) {
                // Intento 2: Ya está cifrado con la contraseña (El estado seguro)
                try {
                    const bytes = CryptoJS.AES.decrypt(this.perfilDB.maletin_encriptado, p);
                    confData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                } catch (err) {
                    throw new Error("No se pudo desencriptar el maletín. Contraseña inválida.");
                }
            }

            this.conf = confData;
            this.guardarBovedaHardware(this.conf); // Metemos la llave en el enclave físico

            
            this.initSeguridadRoles();

            // Aplicar UI
            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || u.split('@')[0];
            
            if (this.perfilDB.avatar_url) {
                const iconoMenu = document.querySelector('#user-profile-menu i');
                if(iconoMenu) iconoMenu.outerHTML = `<img src="${this.perfilDB.avatar_url}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary); margin-bottom: 10px; object-fit: cover;">`;
            }

            if(this.perfilDB.interfaz) {
                if(this.perfilDB.interfaz.tema) document.body.setAttribute('data-theme', this.perfilDB.interfaz.tema);
                document.body.setAttribute('data-estilo', this.perfilDB.interfaz.estilo || 'pico');
                if(document.getElementById('sw-vibration')) document.getElementById('sw-vibration').checked = this.perfilDB.interfaz.vibracion !== false;
                if(document.getElementById('check-ui-sonidos')) document.getElementById('check-ui-sonidos').checked = this.perfilDB.interfaz.sonidos === true;
            }

            sessionStorage.setItem('pico_sesion_ok', 'true');
            // 🔒 PARCHE DE SEGURIDAD: Solo guardamos el email (u) por comodidad. La contraseña NO se guarda en texto plano.
            localStorage.setItem("u", u); 
            
            document.getElementById('login-screen').style.display = 'none';
            if(this.rol === 'admin' || this.rol === 'god') {
                document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            }
            
            if (fechaNube > fechaLocal || document.getElementById('dashboard-grid').children.length === 0) {
                this.renderGrid();
            }

            this.conectar();
            this.comprobarSolicitudesPendientes();
            this.logHUD("Login completado con éxito.", "✅");

        } catch (error) {  
            this.sysLog('SEC', 'Login Error', error.message, 'err');
            this.logHUD(`[ERROR]: ${error.message}`, "error");
            document.getElementById('error-msg').innerText = "❌ " + error.message;
            document.getElementById('error-msg').style.display = 'block'; 
            
            const loginBox = document.querySelector('.login-box');
            if (loginBox) { loginBox.classList.remove('error-shake'); void loginBox.offsetWidth; loginBox.classList.add('error-shake'); }
        }
    }

        async cargarDatosDespuesDeLogin(tokenJWT) {
        try {
            // Descargamos tu perfil de la base de datos
            const { data: perfilNube, error: dbError } = await this.supabase.from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();
            if (perfilNube?.rol === 'pendiente') throw new Error("Tu cuenta está en revisión.");
            if (dbError || !perfilNube) throw new Error("Perfil DB no encontrado.");

            this.perfilDB = perfilNube;
            this.rol = this.perfilDB.rol;
            
            // 🛡️ PARCHE E2EE: Leemos la memoria RAM del hardware, no la Base de Datos
            this.conf = this.abrirBovedaHardware();
            if (!this.conf) {
                this.sysLog('SEC', 'Vault', 'Bóveda física destruida o alterada. Abortando auto-login.', 'warn');
                throw new Error("Cambio de hardware o caché purgada. Inicia sesión manualmente.");
            }
            
            this.initSeguridadRoles();

            // Aplicamos UI
            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || "USUARIO";
            if (this.perfilDB.avatar_url) {
                const iconoMenu = document.querySelector('#user-profile-menu i');
                if(iconoMenu) iconoMenu.outerHTML = `<img src="${this.escapeHTML(this.perfilDB.avatar_url)}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary); margin-bottom: 10px; object-fit: cover;">`;
            }

            if(this.rol === 'admin' || this.rol === 'god') {
                document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            }
            
            this.renderGrid();
            this.conectar();
            this.comprobarSolicitudesPendientes();
            this.notificar("Acceso concedido", "🔐");
            
        } catch (error) {
            this.sysLog('SEC', 'AutoLogin Error', error.message, 'err');
            this.cerrarSesion();
        }
    }

    cerrarSesion() {
        this.sysLog('SEC', 'Logout', 'Limpiando llaves y cerrando sesión.');
        sessionStorage.removeItem('pico_sesion_ok');
        if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
        if(this.supabase) this.supabase.auth.signOut();

        document.getElementById('pass-input').value = "";
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) { loginScreen.style.display = 'flex'; loginScreen.style.opacity = '1'; loginScreen.style.pointerEvents = 'auto'; }
        
        document.getElementById('side-menu').classList.remove('open');
        document.getElementById('settings-menu')?.classList.remove('open');
        this.notificar("Sesión cerrada", "🔒");
    }


    // ==========================================================
    // 🌐 BLOQUE 2: RED, MQTT Y ESTADO DE DISPOSITIVOS
    // ==========================================================

    async conectar() {
        if (!this.conf || !this.conf.escudo_url) {
            this.sysLog('NET', 'Abort', 'Falta escudo_url en el maletín encriptado.', 'warn');
            return;
        }
        const wsUrl = this.conf.escudo_url;
        this.sysLog('NET', 'WS Connect', `Conectando a Zero-Trust Shield: ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl);
        const dot = document.getElementById('mqtt-dot');

        this.ws.onopen = async () => {
            this.setNetworkStatus(true);
            if (dot) dot.className = "dot green";
            
            const { data: { session } } = await this.supabase.auth.getSession();
            const tokenJWT = session ? session.access_token : null;

            const brokerElegido = this.brokers[this.brIdx].h;
            
            this.ws.send(JSON.stringify({ 
                accion: "cambiar_broker", 
                host: brokerElegido,
                auth_token: tokenJWT
            }));
            
            this.sysLog('NET', 'WS Open', 'Túnel establecido. Token enviado para validación.');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.tipo === "mqtt") {
                this.sysLog('MQTT', 'RX', `${data.topic}`, 'info', data.payload);
                const app = data.topic.split("/").pop();
                let val = data.payload;
                try { val = JSON.parse(val); } catch(e){}
                
                if (app === "sistema_hb" || app === "sistema" || (val && val.sistema)) this.updatePicoStatus(val);
                this.cards.forEach(c => {
                    if(c.id === app || (c.subs && c.subs.includes(app))) {
                        if(c.onData) c.onData(val, app, this);
                    }
                });
            } else if (data.tipo === "ia_voz") {
                this.hablarJARVIS(data.texto);
                this.notificar(data.texto, "🗣️");
            } 
            // 🚀 ESCUDO PROXY: Recibimos la respuesta de la IA desde Python
            else if (data.tipo === "ia_respuesta") {
                this.desplegarPayloadCuantico(data.texto, data.orden, data.modo);
            }
        };


        this.ws.onclose = () => {
            this.sysLog('NET', 'WS Close', 'Túnel caído. Reintentando en 3s...', 'warn');
            this.setNetworkStatus(false);
            if (dot) dot.className = "dot red";
            setTimeout(() => this.conectar(), 3000); 
        };
    }

    pub(app, v, r) { 
        if(this.ws?.readyState === WebSocket.OPEN) {
            this.sysLog('MQTT', 'TX Virtual', `Hacia topic de estado: ${app}`, 'info', v);
            this.cmd(app, v);
        }
    }

    cmd(app, c) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.colaOffline.push({app, c});
            this.sysLog('NET', 'Cola', `Offline. Encolando comando para ${app}.`, 'warn');
            return this.notificar("Sin conexión. Orden en cola", "❌");
        }
        
        try {
            // 🔍 DIAGNÓSTICO: Comprobamos qué pieza de la máquina de cifrado falla
            if (typeof CryptoJS === 'undefined') throw new Error("CryptoJS no cargó.");
            if (!this.conf) throw new Error("No hay maletín encriptado.");
            if (!this.conf.tk) throw new Error("Falta la clave secreta PICO_TK.");

            // 1. Creamos el paquete físico
            const paqueteFisico = JSON.stringify({ c: c, n: Date.now() });
            
            // 2. Encriptamos
            const paqueteCifrado = CryptoJS.AES.encrypt(paqueteFisico, this.conf.tk).toString();
            
            this.sysLog('MQTT', 'TX', `Enviando comando cifrado AES -> [${app}]`);
            this.ws.send(JSON.stringify({ accion: "comando", app: app, comando: paqueteCifrado }));
            
        } catch (error) {
            this.sysLog('SEC', 'Crypto Err', error.message, 'err');
            // 🚨 Ahora la notificación nos dirá el error técnico real
            this.notificar(`Fallo E2EE: ${error.message}`, "❌");
        }
    }


    sincronizarColaOffline() {
        if (this.colaOffline.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
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
            item.onclick = () => {
                this.brIdx = idx; current.innerText = b.name; menu.classList.remove('open');
                this.setupBrokerMenu(); this.notificar(`Enrutando servidor a ${b.name}...`, "🔀");
                this.sysLog('NET', 'Cambio Broker', `Solicitando rotación hacia ${b.h}`);
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ accion: "cambiar_broker", host: b.h }));
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
            this.picoWatchdog = setTimeout(() => {
                this.sysLog('SYS', 'Watchdog', 'Timeout. La Pico ha muerto. Forzando OFFLINE.', 'err');
                this.updatePicoStatus("OFFLINE"); 
            }, 20000);
            
            let ramPercent = 0;
            if (val && val.r_pct !== undefined) ramPercent = val.r_pct;
            else if (val && val.ram !== undefined) ramPercent = Math.round((((264 * 1024) - val.ram) / (264 * 1024)) * 100);
            
            if(ramPercent < 0) ramPercent = 0; if(ramPercent > 100) ramPercent = 100;
            let ramColor = ramPercent > 85 ? "#ff453a" : (ramPercent > 60 ? "#ff9f0a" : "var(--text-sec)");

            let tempTxt = (val && val.t !== undefined) ? val.t + "°C" : ((val && val.temp) ? val.temp + "°C" : "");
            let rssi = (val && val.rssi) ? val.rssi : -60;
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
            container.innerHTML = `<div class="pico-info-pill" style="border-color:var(--text-sec); opacity:0.7"><span class="dot red"></span><span style="font-weight:600; color:var(--text-sec);">Offline</span></div>`;
        }
    }


    // ==========================================================
    // 💾 BLOQUE 3: AUTO-GUARDADO Y AJUSTES DE PERFIL
    // ==========================================================

    async guardarPerfilEnNube(datos) {
        if(!this.usuarioLogueado) return false;
        try {
            this.sysLog('DB', 'Update', 'Iniciando escritura en Supabase', 'info', datos);
            const { data, error } = await this.supabase
                .from('perfiles').update(datos).eq('id', this.usuarioLogueado.id).select('updated_at').single();

            if (error) throw error;

            this.perfilDB = { ...this.perfilDB, ...datos };
            localStorage.setItem('pico_perfil_cache', JSON.stringify(this.perfilDB));
            localStorage.setItem('pico_last_sync', data.updated_at); 
            this.sysLog('DB', 'Update OK', 'Caché local sincronizada con sello de tiempo.', 'info', data.updated_at);
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
        // 🔒 Parche XSS: Evitar innerHTML si el nombre viene de un input de usuario. Usamos innerText que es seguro.
        if (displayUser) displayUser.innerText = datosActualizados.alias || datosActualizados.nombre || "USUARIO";
        if (datosActualizados.avatar_url) {
            const avatarImg = document.querySelector('#user-profile-menu img');
            if (avatarImg) avatarImg.src = datosActualizados.avatar_url; // Modificar .src es seguro, no ejecuta scripts.
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
        if(document.getElementById('label-ianube')) document.getElementById('label-ianube').innerText = (ia.nube === 'google') ? 'GOOGLE (EQUILIBRADO)' : 'GROQ (ULTRA RÁPIDO)';
        if(document.getElementById('select-ia-local')) document.getElementById('select-ia-local').value = ia.local || 'smollm';
        if(document.getElementById('label-ialocal')) document.getElementById('label-ialocal').innerText = (ia.local === 'qwen') ? 'QWEN 1.5 (LIGERO)' : 'SMOLLM (ESTÁNDAR)';

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

        modal.style.display = 'flex';
        document.getElementById('btn-close-user-settings').onclick = () => modal.style.display = 'none';

        const btnEliminarHuella = document.getElementById('btn-eliminar-huella-modal');
        const tieneHuella = localStorage.getItem('pico_huella_token');
        if (btnEliminarHuella) {
            btnEliminarHuella.style.display = tieneHuella ? "flex" : "none"; 
            btnEliminarHuella.onclick = () => {
                localStorage.removeItem('pico_huella_token'); localStorage.removeItem('pico_bio_id');
                this.actualizarUIHuella(); this.notificar("Huella desvinculada del dispositivo", "🗑️");
                btnEliminarHuella.style.display = "none";
            };
        }

        const triggerSave = () => this.autoGuardarPerfil();
        
        ['check-ui-sonidos', 'sw-vibration', 'check-estado-online'].forEach(id => {
            const el = document.getElementById(id); if(el) el.onchange = triggerSave;
        });

        ['input-perfil-avatar', 'input-perfil-nombre', 'input-perfil-alias'].forEach(id => {
            const el = document.getElementById(id); if(el) el.onblur = triggerSave;
        });

        const btnSave = document.getElementById('btn-save-user-settings');
        if(btnSave) btnSave.style.display = 'none';
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

    // ==========================================================
    // 🤝 BLOQUE 4: MOTOR SOCIAL (LA PLAZA)
    // ==========================================================
    
    // 🔒 PARCHE DE SEGURIDAD XSS: Función para limpiar textos de usuarios maliciosos.
    escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
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

                // 🔒 PARCHE XSS: Limpiamos los datos que vienen de otros usuarios.
                const alias = this.escapeHTML(u.alias || 'Usuario Anónimo');
                
                // Extraemos la URL y comprobamos que empiece por http para evitar inyección javascript: o data:
                let avatarUrl = u.avatar_url;
                if (avatarUrl && !avatarUrl.startsWith('http')) { avatarUrl = null; } 

                const estaOnline = (u.estado_online === true || u.estado_online === 'online' || u.estado_online === 'true');
                const colorEstado = estaOnline ? '#32d74b' : '#a1a1aa';
                const txtEstado = estaOnline ? 'Online' : 'Desconectado';

                let avatarHtml = `<i class="fa-solid fa-circle-user" style="font-size: 2.8rem; color: #a1a1aa;"></i>`;
                // Como filtramos la url antes, ya es seguro inyectarla.
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
                        <div style="color: var(--primary); font-size: 1.2rem; opacity: 0.5; padding-right: 10px;"><i class="fa-solid fa-handshake"></i></div>
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
            if(countFri === 0) cFri.innerHTML += `<p style="color:var(--text-sec);font-size:0.85rem;text-align:center;">No tienes conexiones aún.</p>`;
            if(countOth === 0) cOth.innerHTML += `<p style="color:var(--text-sec);font-size:0.85rem;text-align:center;">No hay más usuarios en la fortaleza.</p>`;

            document.querySelectorAll('.btn-conectar').forEach(btn => btn.onclick = () => this.enviarSolicitudAmistad(btn.dataset.id));
            document.querySelectorAll('.btn-aceptar').forEach(btn => btn.onclick = () => this.responderSolicitudAmistad(btn.dataset.id, 'aceptada'));
            document.querySelectorAll('.btn-rechazar').forEach(btn => btn.onclick = () => this.responderSolicitudAmistad(btn.dataset.id, 'rechazada'));

        } catch (err) {
            this.sysLog('SOC', 'Plaza Error', err.message, 'err');
            this.notificar("Error cargando el radar social", "❌");
        }
    }

    async enviarSolicitudAmistad(receptorId) {
        if(!this.usuarioLogueado) return;
        this.sysLog('SOC', 'Tx Conn', `Enviando solicitud a ID: ${receptorId}`);
        try {
            const { error } = await this.supabase.from('conexiones').insert({ solicitante_id: this.usuarioLogueado.id, receptor_id: receptorId });
            if (error) throw error;
            this.notificar("Solicitud enviada a la red", "📡"); this.vibra("tick"); this.cargarPlazaPublica();
        } catch(e) { this.sysLog('SOC', 'Tx Error', e.message, 'err'); this.notificar("Error al enviar solicitud", "❌"); }
    }

    async responderSolicitudAmistad(solicitanteId, accion) {
        if(!this.usuarioLogueado) return;
        this.sysLog('SOC', 'Rx Conn', `Respondiendo ${accion.toUpperCase()} a ID: ${solicitanteId}`);
        try {
            if (accion === 'aceptada') {
                const { error } = await this.supabase.from('conexiones').update({ estado: 'aceptada' }).match({ solicitante_id: solicitanteId, receptor_id: this.usuarioLogueado.id });
                if (error) throw error;
                this.notificar("Nueva conexión establecida", "🤝"); this.vibra("doble");
            } else {
                const { error } = await this.supabase.from('conexiones').delete().match({ solicitante_id: solicitanteId, receptor_id: this.usuarioLogueado.id });
                if (error) throw error;
                this.notificar("Solicitud rechazada", "🗑️");
            }
            this.cargarPlazaPublica();
        } catch(e) { this.sysLog('SOC', 'Rx Error', e.message, 'err'); this.notificar("Error al procesar", "❌"); }
    }

    // ==========================================================
    // 🎨 BLOQUE 5: MOTOR DE RENDERIZADO Y UI
    // ==========================================================
    
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

        // 1. INYECTAMOS EL CSS DE LA ISLA DINÁMICA Y PREPARAMOS LA COLA
    initColaNotificaciones() {
        if (document.getElementById('toast-queue-container')) return;
        this.colaNotificaciones = [];
        this.notificacionActiva = false;
        
        const style = document.createElement('style');
        style.innerHTML = `
            #toast-queue-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; z-index: 9999; pointer-events: none; }
            .toast-badge { background: var(--primary); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; font-size: 0.75rem; font-weight: bold; margin-right: 10px; opacity: 0; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: scale(0); box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); }
            .toast-badge.active { opacity: 1; transform: scale(1); }
            .toast-island { background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 30px; padding: 0; display: flex; align-items: center; max-width: 0; overflow: hidden; opacity: 0; transition: max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s, padding 0.4s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .toast-island.open { max-width: 350px; padding: 8px 16px; opacity: 1; }
        `;
        document.head.appendChild(style);
        
        const container = document.createElement('div');
        container.id = 'toast-queue-container';
        container.innerHTML = `<div id="toast-badge" class="toast-badge"></div><div id="toast-island" class="toast-island"></div>`;
        document.body.appendChild(container);
    }

    // 2. LA FUNCIÓN QUE RECIBE LOS MENSAJES
    notificar(msg, icon = "✅") {
        if (!this.colaNotificaciones) this.initColaNotificaciones();
        
        // Anti-spam básico: Si el mensaje es idéntico al último de la cola, lo ignoramos
        if (this.colaNotificaciones.length > 0 && this.colaNotificaciones[this.colaNotificaciones.length - 1].msg === msg) return;
        
        this.colaNotificaciones.push({msg, icon});
        this.procesarSiguienteNotificacion();
    }

    // 3. EL MOTOR QUE DESPLIEGA LA ISLA HACIA LA DERECHA
    procesarSiguienteNotificacion() {
        if (this.notificacionActiva || this.colaNotificaciones.length === 0) return;
        
        this.notificacionActiva = true;
        const actual = this.colaNotificaciones.shift(); // Sacamos la primera de la cola
        
        const badge = document.getElementById('toast-badge');
        const island = document.getElementById('toast-island');
        
        // Si quedan notificaciones en espera, mostramos el círculo con el número a la izquierda
        if (this.colaNotificaciones.length > 0) {
            badge.innerText = `+${this.colaNotificaciones.length}`;
            badge.classList.add('active');
        } else {
            badge.classList.remove('active');
        }
        
        // 🛡️ PARCHE XSS: Desinfectamos el texto del mensaje antes de inyectarlo en el HTML
        const textoSeguro = this.escapeHTML(actual.msg);
        island.innerHTML = `<span style="font-size:1.2rem; margin-right:8px;">${actual.icon}</span> <span style="font-size:0.85rem; font-weight:600;">${textoSeguro}</span>`;

        
        // La mantenemos abierta 3 segundos, la cerramos, y tras 0.4s procesamos la siguiente
        setTimeout(() => {
            island.classList.remove('open');
            setTimeout(() => {
                this.notificacionActiva = false;
                this.procesarSiguienteNotificacion();
            }, 400); 
        }, 3000); 
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

        // Llamamos al motor central (que lee toda la casa antes de enviar)
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
            // 🛡️ IA EN LA NUBE (PROXY CUÁNTICO INEXPUGNABLE)
            // Ya NO exponemos las API Keys en el navegador. Enviamos todo a tu servidor de Render.
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const proveedorElegido = (this.perfilDB && this.perfilDB.ia && this.perfilDB.ia.nube) ? this.perfilDB.ia.nube : "groq";
                this.ws.send(JSON.stringify({ 
                    accion: "ia_proxy", 
                    proveedor: proveedorElegido, 
                    prompt_sistema: promptSistema,
                    prompt_humano: orden,
                    modo: modo
                }));
            } else {
                this.notificar("Sin conexión al Escudo", "❌");
                if(modo === "reactivo") {
                    this.notificar("Nube caída. Intentando IA Local...", "🔋");
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
        try {
            if (!this.esMovil) {
                this.sysLog('IA', 'Motor Local', 'Arrancando WebLLM (WebGPU)');
                const versionIA = this.versiones["@mlc-ai/web-llm"];
                const { CreateMLCEngine } = await import(`https://esm.run/@mlc-ai/web-llm@${versionIA}`);
                this.localEngine = await CreateMLCEngine("SmolLM-135M-Instruct-q4f16_1-MLC", {
                    initProgressCallback: (p) => { const pct = Math.round(p.progress * 100); const textEl = document.getElementById('ia-dl-text'); const barEl = document.getElementById('ia-dl-bar'); if(textEl) textEl.innerText = `WebGPU (PC): ${pct}%`; if(barEl) barEl.style.width = `${pct}%`; },
                    chatOpts: { context_window_size: 1024 } 
                });
            } else {
                this.sysLog('IA', 'Motor Local', 'Arrancando WASM Móvil (CPU/WebGPU)');
                try {
                    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0');
                    env.allowLocalModels = false; env.useBrowserCache = true; env.backends.onnx.wasm.numThreads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
                    const textEl = document.getElementById('ia-dl-text'); if(textEl) textEl.innerText = "Iniciando motor WASM...";
                    const modelo = 'Xenova/Qwen1.5-0.5B-Chat';
                    this.localEngineWASM = await pipeline('text-generation', modelo, {
                        device: 'webgpu',
                        progress_callback: (x) => { if (x.status === 'downloading' || x.status === 'progress') { const tEl = document.getElementById('ia-dl-text'); const bEl = document.getElementById('ia-dl-bar'); if(tEl) tEl.innerText = `Cargando IA: ${Math.round(x.progress)}%`; if(bEl) bEl.style.width = `${x.progress}%`; } }
                    });
                } catch (err) {
                    this.sysLog('IA', 'WASM Err', err.message, 'err');
                    const textEl = document.getElementById('ia-dl-text'); if(textEl) { textEl.innerText = "Fallo de compatibilidad"; textEl.style.color = "#ff453a"; }
                }
            }
            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
            return true;
        } catch (e) {
            this.sysLog('IA', 'Precarga Fallida', e.message, 'err');
            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
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
            if (!this.tf) this.tf = await import("https://esm.run/@tensorflow/tfjs");
            const speechCommands = await import("https://esm.run/@tensorflow-models/speech-commands");

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
                
                // 🚀 PARCHE DE REDIBUJADO INSTANTÁNEO
                // Como no hay hardware físico que nos devuelva el "Eco", forzamos a la tarjeta a actualizarse sola
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

        // 👑 NIVEL GOD: Acceso Total (Traza, Payloads y Soluciones)
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
        // 👮‍♂️ NIVEL ADMIN: Diagnóstico sin datos sensibles
        else if (this.rol === 'admin') {
            if (tipo === 'out' || msg.includes('DATA:')) return; 
            textoFinal = `> ${msg}`;
        } 
        // 👤 NIVEL GUEST: Ceguera técnica (solo errores ofuscados)
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

        // Auto-limpieza en DOM: No borramos logs de la variable real, pero sí del HTML para que no laguee el móvil (Max 100 líneas)
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
            const prompt = promptInput.value.trim(); if(!currentBinding || !prompt) return this.notificar("Falta el atajo o el texto", "⚠️");
            btnCompile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compilando...`; this.vibra("tick");
            setTimeout(() => {
                const codigoJSONGenerado = JSON.stringify({ "Led": "toggle", "Pomodoro": 25 }); if(emptyMsg) emptyMsg.style.display = 'none';
                const li = document.createElement('li'); li.className = "macro-item cascade-in"; li.innerHTML = `<div style="display:flex; flex-direction:column; gap:5px;"><span style="font-family:monospace; font-weight:900; color:var(--primary); font-size:1.1rem;"><i class="fa-regular fa-keyboard"></i> ${currentBinding}</span><span style="font-size:0.85rem; color:var(--text-sec);">"${prompt}"</span><span style="font-family:monospace; font-size:0.75rem; color:#32d74b;">> ${codigoJSONGenerado}</span></div><button class="btn-del" onclick="this.parentElement.remove(); window.App.vibra('doble');"><i class="fa-solid fa-trash"></i></button>`;
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
        const transaccion = this.db.transaction(['habitos'], 'readwrite'); const store = transaccion.objectStore('habitos');
        store.add({ app: app, accion: accion, valor: valorExtra, hora: new Date().getHours(), minuto: new Date().getMinutes(), diaSemana: new Date().getDay(), timestamp: Date.now() });
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
        this.sysLog('SEC', 'Forja', `Iniciando Forja para UserID: ${userId}`);
        const alias = prompt("Escribe el nombre de usuario (ej: hermano):"); if (!alias) return;
        const pass = prompt(`Escribe la contraseña que el usuario ${alias} escogió al registrarse:`); if (!pass) return;
        const pin = prompt(`Inventa un PIN Maestro de 4 números para ${alias}:`); if (!pin) return;
        
        try {
            this.notificar("Forjando Bóveda Criptográfica...", "⚙️");
            
            const nuevaConf = {
                topic: this.conf.topic, 
                tk: this.conf.tk, 
                rol: "guest",
                apis: { google: "", groq: "", openrouter: "" } 
            };
            
            const ghostKey = CryptoJS.lib.WordArray.random(32).toString();
            const keyData = CryptoJS.SHA256(pass + ghostKey); const ivData = CryptoJS.lib.WordArray.random(16);
            const encData = CryptoJS.AES.encrypt(JSON.stringify(nuevaConf), keyData, {iv: ivData, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
            const payloadData = CryptoJS.enc.Base64.stringify(ivData.concat(encData.ciphertext));
            
            const keyEnv = CryptoJS.SHA256(pass + pin); const ivEnv = CryptoJS.lib.WordArray.random(16);
            const encEnv = CryptoJS.AES.encrypt(ghostKey, keyEnv, {iv: ivEnv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
            const payloadEnv = CryptoJS.enc.Base64.stringify(ivEnv.concat(encEnv.ciphertext));
            
            const finalJSON = JSON.stringify({ e: payloadEnv, d: payloadData });
            const maletinBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(finalJSON));
            
            const { error } = await this.supabase.from('perfiles').update({ maletin_encriptado: maletinBase64, rol: 'guest', updated_at: new Date() }).eq('id', userId);
            if (error) throw error;
            
            this.sysLog('SEC', 'Forja OK', `Bóveda sellada. PIN temporal: ${pin}`);
            this.notificar("Usuario autorizado y encriptado con éxito", "✅");
            this.logHUD(`USUARIO APROBADO: Pásale su PIN temporal: ${pin}`, "out");
        } catch (error) {
            this.sysLog('SEC', 'Forja Err', error.message, 'err');
            this.notificar("Fallo al forjar el maletín", "❌");
        }
    }
}
