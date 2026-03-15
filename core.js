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
            PlantaCard,EnergiaCard,SintetizadorCard,OCRCard,ConscienciaCard
        ];
        this.conf = null;
        this.perfilDB = null; // Memoria de Supabase
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
        this.arranqueSeguro();
    }

    async arranqueSeguro() {
        await this.inicializarModulos();
        this.init(); 
    }

    async inicializarModulos() {
        this.versiones = JSON.parse(localStorage.getItem('pico_libs_versions')) || {
            "@mlc-ai/web-llm": "0.2.81", 
            "paho-mqtt": "1.0.1",        
            "crypto-js": "4.2.0",
            "sortable": "1.15.0"
        };
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

        // --- 1. LOGIN Y HUELLA ---
        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('pass-input').onkeypress = (e) => { if(e.key==='Enter') this.login(); };
        
        const btnHuella = document.getElementById('btn-huella');
        if(btnHuella) btnHuella.onclick = (e) => { e.preventDefault(); this.manejarHuella(); };

        // --- 2. MENÚ DE USUARIO ---
        const btnEliminarHuella = document.getElementById('btn-eliminar-huella');
        if(btnEliminarHuella) btnEliminarHuella.onclick = (e) => {
            e.stopPropagation(); 
            localStorage.removeItem('pico_huella_token');
            localStorage.removeItem('pico_bio_id');
            this.actualizarUIHuella();
            this.notificar("Huella desvinculada del dispositivo", "🗑️");
        };

        const userProfileMenu = document.getElementById('user-profile-menu');
        if(userProfileMenu) {
            userProfileMenu.onclick = () => {
                document.getElementById('side-menu').classList.remove('open');
                this.abrirAjustesUsuario();
                this.vibra("tick");
            };
        }
        
                // Configurar botón del menú lateral para abrir La Plaza
        const btnPlaza = document.getElementById('btn-nav-plaza');
        if (btnPlaza) {
            btnPlaza.addEventListener('click', () => {
                // 1. Mostrar el overlay de La Plaza
                document.getElementById('plaza-view').style.display = 'block';
                
                // 2. Ejecutar el escáner para dibujar las tarjetas reales
                this.cargarPlazaPublica();
            });
        }


        // --- 3. AJUSTES Y CERRAR SESIÓN ---
        document.getElementById('btn-edit').onclick = () => this.toggleEdit();
        document.getElementById('btn-theme').onclick = () => this.toggleTheme();
        
        const btnLogoutMenu = document.getElementById('btn-logout');
        const btnCerrarBarra = document.getElementById('btn-cerrar-sesion'); 
        if(btnLogoutMenu) btnLogoutMenu.onclick = () => this.cerrarSesion();
        if(btnCerrarBarra) btnCerrarBarra.onclick = () => this.cerrarSesion();

        setTimeout(() => this.actualizarUIHuella(), 500);

        const swJarvis = document.getElementById('sw-jarvis');
        if (swJarvis) {
            swJarvis.addEventListener('change', (e) => {
                if (e.target.checked) this.iniciarCentinelaAudio();
                else this.detenerCentinelaAudio();
            });
        }
        
        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filtroActual = e.target.dataset.filter;
                this.vibra('tick');
                this.renderGrid(); 
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
            if(!document.getElementById('broker-trigger').contains(e.target)) brokerMenu.classList.remove('open');
            if(!settingsTrigger.contains(e.target)) settingsMenu.classList.remove('open');
        };

        const u = localStorage.getItem("u"), p = localStorage.getItem("p");
        const loginScreen = document.getElementById('login-screen');

        if(u && p) { 
            document.getElementById('user-input').value = u;
            document.getElementById('pass-input').value = p;
            this.login(); 
        } else {
            if (loginScreen) {
                loginScreen.style.display = 'flex';
                loginScreen.style.opacity = '1';
                loginScreen.style.pointerEvents = 'auto';
            }
        }

        document.getElementById('btn-ai-send').onclick = () => this.procesarComandoIA();
        document.getElementById('ai-input').onkeypress = (e) => { if(e.key==='Enter') this.procesarComandoIA(); };
        
        window.addEventListener('online', () => this.setNetworkStatus(true));
        this.sincronizarColaOffline();
        window.addEventListener('offline', () => this.setNetworkStatus(false));
    }

    // ==========================================================
    // 🛡️ SISTEMA DE LOGIN Y SINCRONIZACIÓN DE PERFIL (V2)
    // ==========================================================

        async login() {
        const u = document.getElementById('user-input').value.trim();
        const p = document.getElementById('pass-input').value.trim();
        const emailAuth = u.includes('@') ? u : `${u}@pico.os`;

        this.logHUD("Iniciando secuencia de Login...", "info");
        console.log("🔍 [DEBUG LOGIN] 1. Usuario normalizado:", emailAuth);

        try {
            // 1. Huella del dispositivo
            let deviceId = localStorage.getItem('pico_device_id');
            if (!deviceId) {
                deviceId = window.crypto.randomUUID ? window.crypto.randomUUID() : 'dev-' + Date.now();
                localStorage.setItem('pico_device_id', deviceId);
            }
            const deviceName = this.esMovil ? "Móvil Web" : "PC Web";

            console.log("🔍 [DEBUG LOGIN] 2. Payload preparado:", { email: emailAuth, device_id: deviceId, device_name: deviceName });
            this.logHUD(`Llamando a Edge Function 'login-seguro'...`, "info");

            // 2. Candado del Servidor (Llamada a la API)
            const tiempoInicio = Date.now();
            
                        // 2. Candado del Servidor (Llamada a la API A CORAZÓN ABIERTO)
            this.logHUD("Disparando Rayos X a la función...", "info");
            
            const functionUrl = 'https://piruxdxdvynacdtjbjux.supabase.co/functions/v1/login-seguro';
            const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcnV4ZHhkdnluYWNkdGpianV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjc3MDAsImV4cCI6MjA4ODg0MzcwMH0.iLBhbFRInA21_QLNJp57qQ7SJPPivq4c_XzUywBum6w';

            const req = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${anonKey}`
                },
                body: JSON.stringify({ email: emailAuth, password: p, device_id: deviceId, device_name: deviceName })
            });

            const status = req.status;
            console.log("🔍 [X-RAY] HTTP STATUS:", status);
            this.logHUD(`[X-RAY] HTTP STATUS: ${status}`, "info");

            const rawText = await req.text();
            console.log("🔍 [X-RAY] RESPUESTA RAW:", rawText);
            this.logHUD(`[X-RAY] RESPUESTA RAW: ${rawText}`, "info");

            if (!req.ok) {
                throw new Error(`Servidor rechazó la petición (HTTP ${status}): ${rawText}`);
            }

            // Si llegamos aquí, la petición fue un éxito rotundo
            const data = JSON.parse(rawText);


            // 3. Restaurar sesión oficial
            await this.supabase.auth.setSession(data.session);
            this.usuarioLogueado = data.user;

            // 4. SINCRONIZACIÓN BIDIRECCIONAL
            const { data: perfilNube, error: dbError } = await this.supabase
                .from('perfiles').select('*').eq('id', this.usuarioLogueado.id).single();

            if (perfilNube.rol === 'pendiente') throw new Error("Tu cuenta está en revisión.");
            if (dbError || !perfilNube) throw new Error("Perfil no encontrado.");

            const localSyncDate = localStorage.getItem('pico_last_sync');
            const fechaNube = new Date(perfilNube.updated_at).getTime();
            const fechaLocal = localSyncDate ? new Date(localSyncDate).getTime() : 0;

            if (fechaNube >= fechaLocal) {
                this.perfilDB = perfilNube;
                localStorage.setItem('pico_perfil_cache', JSON.stringify(perfilNube));
                localStorage.setItem('pico_last_sync', perfilNube.updated_at);
            } else {
                this.perfilDB = JSON.parse(localStorage.getItem('pico_perfil_cache'));
                await this.guardarPerfilEnNube(this.perfilDB); 
            }

            if (!this.perfilDB.tarjetas) this.perfilDB.tarjetas = { orden: [], tamanos: {} };

            this.rol = this.perfilDB.rol;
            this.conf = JSON.parse(this.perfilDB.maletin_encriptado); 

            // 5. Aplicar UI
            const displayUser = document.getElementById('display-username');
            if (displayUser) displayUser.innerText = this.perfilDB.alias || this.perfilDB.nombre || u.split('@')[0];
            
            if (this.perfilDB.avatar_url) {
                const iconoMenu = document.querySelector('#user-profile-menu i');
                if(iconoMenu) iconoMenu.outerHTML = `<img src="${this.perfilDB.avatar_url}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--primary); margin-bottom: 10px; object-fit: cover;">`;
            }

            if(this.perfilDB.interfaz) {
                if(this.perfilDB.interfaz.tema) document.body.setAttribute('data-theme', this.perfilDB.interfaz.tema);
                if(document.getElementById('sw-vibration')) document.getElementById('sw-vibration').checked = this.perfilDB.interfaz.vibracion !== false;
                if(document.getElementById('check-ui-sonidos')) document.getElementById('check-ui-sonidos').checked = this.perfilDB.interfaz.sonidos === true;
            }

            sessionStorage.setItem('pico_sesion_ok', 'true');
            localStorage.setItem("u", u); 
            localStorage.setItem("p", p);
            
            document.getElementById('login-screen').style.display = 'none';
            if(this.rol === 'admin' || this.rol === 'god') {
                document.querySelectorAll('.admin-only').forEach(e => e.style.setProperty('display', 'block', 'important'));
            }
            
            this.renderGrid();
            this.conectar();
            this.comprobarSolicitudesPendientes();
            this.logHUD("Login completado con éxito.", "✅");

        } catch (error) {  
            console.error("💥 [DEBUG LOGIN] CATCH FINAL:", error);
            this.logHUD(`[ERROR]: ${error.message}`, "error");
            
            document.getElementById('error-msg').innerText = "❌ " + error.message;
            document.getElementById('error-msg').style.display = 'block'; 
            
            const loginBox = document.querySelector('.login-box');
            if (loginBox) {
                loginBox.classList.remove('error-shake');
                void loginBox.offsetWidth;
                loginBox.classList.add('error-shake');
            }
        }
    }

            // ==========================================
    // 🏛️ ESCÁNER DE LA PLAZA V2 (Motor Social)
    // ==========================================
    async cargarPlazaPublica() {
        const cReq = document.getElementById('plaza-section-requests');
        const cFri = document.getElementById('plaza-section-friends');
        const cOth = document.getElementById('plaza-section-others');

        if (!cReq || !cFri || !cOth || !this.usuarioLogueado) return;

        // 1. Ponemos los títulos base con los iconos
        cReq.innerHTML = `<h3 style="font-size: 0.8rem; color: #ff9f0a; border-bottom: 1px solid rgba(255, 159, 10, 0.3); padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-bell fa-shake"></i> SOLICITUDES ENTRANTES</h3>`;
        cFri.innerHTML = `<h3 style="font-size: 0.8rem; color: var(--primary); border-bottom: 1px solid rgba(139, 92, 246, 0.3); padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-user-group"></i> TUS CONEXIONES</h3>`;
        cOth.innerHTML = `<h3 style="font-size: 0.8rem; color: var(--text-sec); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 5px; margin-bottom: 15px; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-globe"></i> COMUNIDAD PICO</h3>`;

        try {
            // 2. Obtenemos a TODO el mundo de la plaza pública
            const { data: usuarios, error: errU } = await this.supabase.from('plaza_publica').select('id, alias, avatar_url, estado_online');
            if (errU) throw errU;

            // 3. Obtenemos TODAS tus conexiones (las que enviaste y las que recibiste)
            const { data: conexiones, error: errC } = await this.supabase.from('conexiones')
                .select('*')
                .or(`solicitante_id.eq.${this.usuarioLogueado.id},receptor_id.eq.${this.usuarioLogueado.id}`);
            if (errC) throw errC;

            let countReq = 0, countFri = 0, countOth = 0;

            // 4. Repartimos a los usuarios en sus cajas
            usuarios.forEach(u => {
                if (u.id === this.usuarioLogueado.id) return; // No te muestres a ti mismo

                const alias = u.alias || 'Usuario Anónimo';
                const avatarUrl = u.avatar_url;
                const estaOnline = u.estado_online === true || u.estado_online === 'online';
                const colorEstado = estaOnline ? '#32d74b' : '#a1a1aa';
                const txtEstado = estaOnline ? 'Online' : 'Desconectado';

                let avatarHtml = `<i class="fa-solid fa-circle-user" style="font-size: 2.8rem; color: #a1a1aa;"></i>`;
                if (avatarUrl) avatarHtml = `<img src="${avatarUrl}" style="width: 45px; height: 45px; border-radius: 50%; background: var(--card-bg); border: 2px solid ${colorEstado}; object-fit: cover;">`;

                // ¿Qué relación tienes con esta persona?
                const conn = conexiones.find(c => c.solicitante_id === u.id || c.receptor_id === u.id);

                // --- CAJA 1: TE HAN ENVIADO UNA SOLICITUD ---
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
                            <button class="btn-action btn-aceptar" data-id="${u.id}" style="background: rgba(50, 215, 75, 0.2); color: #32d74b; border: 1px solid rgba(50, 215, 75, 0.5); width: 40px; height: 40px; border-radius: 10px; margin: 0; padding: 0; font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-check"></i></button>
                            <button class="btn-action btn-rechazar" data-id="${u.id}" style="background: rgba(255, 69, 58, 0.2); color: #ff453a; border: 1px solid rgba(255, 69, 58, 0.5); width: 40px; height: 40px; border-radius: 10px; margin: 0; padding: 0; font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>`;
                }
                // --- CAJA 2: YA SOIS CONEXIONES (ACEPTADA) ---
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
                        <div style="color: var(--primary); font-size: 1.2rem; opacity: 0.5; padding-right: 10px;">
                            <i class="fa-solid fa-handshake"></i>
                        </div>
                    </div>`;
                }
                // --- CAJA 3: COMUNIDAD (AÚN NO HAY CONEXIÓN) ---
                else {
                    countOth++;
                    // Comprobamos si fuiste TÚ quien le mandó la solicitud a él
                    const enviadaPorMi = (conn && conn.estado === 'pendiente' && conn.solicitante_id === this.usuarioLogueado.id);

                    // Si se la enviaste tú, el botón dice "Pendiente" y no se puede clickear
                    let botonHtml = enviadaPorMi
                        ? `<button class="btn-action" disabled style="background: transparent; color: var(--text-sec); border: 1px solid rgba(255, 255, 255, 0.2); width: auto; padding: 8px 15px; border-radius: 10px; margin: 0; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; cursor: not-allowed;"><i class="fa-solid fa-clock"></i> Pendiente</button>`
                        : `<button class="btn-action btn-conectar" data-id="${u.id}" style="background: rgba(139, 92, 246, 0.15); color: var(--primary); border: 1px solid rgba(139, 92, 246, 0.4); width: auto; padding: 8px 15px; border-radius: 10px; margin: 0; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; cursor: pointer;"><i class="fa-solid fa-user-plus"></i> Conectar</button>`;

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

            // 5. Ocultar o mostrar mensajes de vacío
            if(countReq === 0) cReq.style.display = 'none'; else cReq.style.display = 'block';
            if(countFri === 0) cFri.innerHTML += `<p style="color:var(--text-sec);font-size:0.85rem;text-align:center;">No tienes conexiones aún.</p>`;
            if(countOth === 0) cOth.innerHTML += `<p style="color:var(--text-sec);font-size:0.85rem;text-align:center;">No hay más usuarios en la fortaleza.</p>`;

            // 6. Activar la funcionalidad de todos los botones generados
            document.querySelectorAll('.btn-conectar').forEach(btn => btn.onclick = () => this.enviarSolicitudAmistad(btn.dataset.id));
            document.querySelectorAll('.btn-aceptar').forEach(btn => btn.onclick = () => this.responderSolicitudAmistad(btn.dataset.id, 'aceptada'));
            document.querySelectorAll('.btn-rechazar').forEach(btn => btn.onclick = () => this.responderSolicitudAmistad(btn.dataset.id, 'rechazada'));

        } catch (err) {
            console.error("Error al cargar La Plaza Pública:", err);
            this.notificar("Error cargando el radar social", "❌");
        }
    }

    // ==========================================
    // 🤝 ACCIONES SOCIALES (Nuevas funciones)
    // ==========================================
    async enviarSolicitudAmistad(receptorId) {
        if(!this.usuarioLogueado) return;
        try {
            const { error } = await this.supabase.from('conexiones').insert({
                solicitante_id: this.usuarioLogueado.id,
                receptor_id: receptorId
            });
            if (error) throw error;
            this.notificar("Solicitud enviada a la red", "📡");
            this.vibra("tick");
            this.cargarPlazaPublica(); // Recargamos para que el botón pase a "Pendiente"
        } catch(e) {
            console.error(e);
            this.notificar("Error al enviar solicitud", "❌");
        }
    }

    async responderSolicitudAmistad(solicitanteId, accion) {
        if(!this.usuarioLogueado) return;
        try {
            if (accion === 'aceptada') {
                const { error } = await this.supabase.from('conexiones')
                    .update({ estado: 'aceptada' })
                    .match({ solicitante_id: solicitanteId, receptor_id: this.usuarioLogueado.id });
                if (error) throw error;
                this.notificar("Nueva conexión establecida", "🤝");
                this.vibra("doble");
            } else {
                // Si rechaza, borramos la fila para dejar limpio el historial
                const { error } = await this.supabase.from('conexiones')
                    .delete()
                    .match({ solicitante_id: solicitanteId, receptor_id: this.usuarioLogueado.id });
                if (error) throw error;
                this.notificar("Solicitud rechazada", "🗑️");
            }
            this.cargarPlazaPublica(); // Recargamos la plaza para aplicar cambios
        } catch(e) {
            console.error(e);
            this.notificar("Error al procesar", "❌");
        }
    }

    async guardarPerfilEnNube(datos) {
        if(!this.usuarioLogueado) return false;
        try {
            const { data, error } = await this.supabase
                .from('perfiles')
                .update(datos)
                .eq('id', this.usuarioLogueado.id)
                .select('updated_at') 
                .single();

            if (error) throw error;

            this.perfilDB = { ...this.perfilDB, ...datos };
            localStorage.setItem('pico_perfil_cache', JSON.stringify(this.perfilDB));
            localStorage.setItem('pico_last_sync', data.updated_at); 

            return true;
        } catch (err) {
            console.error("Fallo al sincronizar con Supabase:", err);
            return false;
        }
    }

    abrirAjustesUsuario() {
        const modal = document.getElementById('user-settings-modal');
        if(!modal) return;

        const p = this.perfilDB || {};
        
        // Rellenar Textos
        if(document.getElementById('input-perfil-avatar')) document.getElementById('input-perfil-avatar').value = p.avatar_url || '';
        if(document.getElementById('input-perfil-nombre')) document.getElementById('input-perfil-nombre').value = p.nombre || '';
        if(document.getElementById('input-perfil-alias')) document.getElementById('input-perfil-alias').value = p.alias || '';
        
        // Rellenar Selectores
        if(document.getElementById('select-perfil-idioma')) document.getElementById('select-perfil-idioma').value = p.idioma || 'es-ES';
        if(document.getElementById('label-idioma')) document.getElementById('label-idioma').innerText = p.idioma === 'en-US' ? 'English' : 'Español';
        
        const ia = p.ia || { nube: 'groq', local: 'smollm' };
        if(document.getElementById('select-ia-nube')) document.getElementById('select-ia-nube').value = ia.nube || 'groq';
        if(document.getElementById('label-ianube')) document.getElementById('label-ianube').innerText = (ia.nube === 'google') ? 'GOOGLE (EQUILIBRADO)' : 'GROQ (ULTRA RÁPIDO)';
        if(document.getElementById('select-ia-local')) document.getElementById('select-ia-local').value = ia.local || 'smollm';
        if(document.getElementById('label-ialocal')) document.getElementById('label-ialocal').innerText = (ia.local === 'qwen') ? 'QWEN 1.5 (LIGERO)' : 'SMOLLM (ESTÁNDAR)';

        const ui = p.interfaz || { sonidos: false, vibracion: true, tema: 'pico' };
        if(document.getElementById('check-ui-sonidos')) document.getElementById('check-ui-sonidos').checked = ui.sonidos;
        if(document.getElementById('sw-vibration')) document.getElementById('sw-vibration').checked = ui.vibracion;
        if(document.getElementById('check-estado-online')) document.getElementById('check-estado-online').checked = p.estado_online !== false;
        
        if(document.getElementById('select-perfil-estilo')) document.getElementById('select-perfil-estilo').value = ui.tema || 'pico';
        if(document.getElementById('label-estilo')) {
            const nombresTemas = { 'pico': 'PICO OS (CRISTAL)', 'ios': 'APPLE IOS', 'android': 'ANDROID (MATERIAL)', 'retro': 'RETRO (TERMINAL)' };
            document.getElementById('label-estilo').innerText = nombresTemas[ui.tema || 'pico'];
        }

        modal.style.display = 'flex';
        document.getElementById('btn-close-user-settings').onclick = () => modal.style.display = 'none';

        const btnEliminarHuella = document.getElementById('btn-eliminar-huella-modal');
        const tieneHuella = localStorage.getItem('pico_huella_token');
        if (btnEliminarHuella) {
            btnEliminarHuella.style.display = tieneHuella ? "flex" : "none"; 
            btnEliminarHuella.onclick = () => {
                localStorage.removeItem('pico_huella_token');
                localStorage.removeItem('pico_bio_id');
                this.actualizarUIHuella();
                this.notificar("Huella desvinculada del dispositivo", "🗑️");
                btnEliminarHuella.style.display = "none";
            };
        }

        const btnSave = document.getElementById('btn-save-user-settings');
        btnSave.onclick = async () => {
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
            
            const datosActualizados = {
                avatar_url: document.getElementById('input-perfil-avatar').value.trim() || null,
                nombre: document.getElementById('input-perfil-nombre').value.trim() || null,
                alias: document.getElementById('input-perfil-alias').value.trim() || null,
                idioma: document.getElementById('select-perfil-idioma').value,
                estado_online: document.getElementById('check-estado-online').checked,
                ia: {
                    nube: document.getElementById('select-ia-nube').value,
                    local: document.getElementById('select-ia-local').value
                },
                interfaz: {
                    sonidos: document.getElementById('check-ui-sonidos').checked,
                    vibracion: document.getElementById('sw-vibration').checked,
                    tema: document.getElementById('select-perfil-estilo').value
                }
            };

            const exito = await this.guardarPerfilEnNube(datosActualizados);

            if (exito) {
                this.notificar("Perfil sincronizado en la nube", "✅");
                modal.style.display = 'none';
                document.body.setAttribute('data-theme', datosActualizados.interfaz.tema);
                
                const displayUser = document.getElementById('display-username');
                if (displayUser) displayUser.innerText = datosActualizados.alias || datosActualizados.nombre || "USUARIO";
                
                if (datosActualizados.avatar_url) {
                    const avatarImg = document.querySelector('#user-profile-menu img');
                    if (avatarImg) avatarImg.src = datosActualizados.avatar_url;
                }
            } else {
                this.notificar("Guardado offline. Se subirá al recuperar conexión.", "⚠️");
            }
            btnSave.innerHTML = 'GUARDAR PERFIL';
        };
    }

    // ==========================================================
    // ⚙️ RENDERIZADO DE GRID CON LECTURA DESDE SUPABASE
    // ==========================================================
    
    renderGrid() {
        const tarjetasFiltradas = this.cards.filter(c => this.filtroActual === 'all' || c.category === this.filtroActual);
        const grid = document.getElementById('dashboard-grid');
        grid.innerHTML = "";
        
        // 💾 Recuperar orden y tamaños de SUPABASE (O caché local si no ha entrado)
        let order = this.perfilDB?.tarjetas?.orden || JSON.parse(localStorage.getItem('gridOrder')) || [];
        let savedSizes = this.perfilDB?.tarjetas?.tamanos || JSON.parse(localStorage.getItem('pico_card_sizes')) || {};

        if(order.length > 0) {
            this.cards.sort((a, b) => {
                const idxA = order.indexOf(a.id);
                const idxB = order.indexOf(b.id);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            });
        }

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
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%; 
                display: grid; grid-template-columns: repeat(2, max-content); 
                gap: 15px; justify-content: center; align-content: center;
                background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); 
                z-index: 10; pointer-events: none; 
                clip-path: circle(0px at 50% 50%);
                transition: clip-path 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            `;
            
            const btnCustomHtml = card.customAccion ?
            `
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

            div.appendChild(cardContent);
            div.appendChild(cardMenu);
            grid.appendChild(div);

            let pressTimer;
            let startX = 0, startY = 0;
            let localX = 0, localY = 0;
            let isDragging = false;

            const activarMenu = () => {
                cardMenu.style.pointerEvents = "auto";
                cardMenu.style.clipPath = `circle(150% at ${localX}px ${localY}px)`;
                this.vibra("doble");
            };

            const cerrarIris = () => {
                cardMenu.style.pointerEvents = "none";
                cardMenu.style.clipPath = `circle(0px at ${localX}px ${localY}px)`; 
            };

            const iniciarToque = (e) => {
                if(this.editMode || e.target.closest('button') || e.target.tagName === 'INPUT') return;
                isDragging = false;
                
                startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                const rect = div.getBoundingClientRect();
                localX = startX - rect.left;
                localY = startY - rect.top;

                cardMenu.style.transition = 'none';
                cardMenu.style.clipPath = `circle(0px at ${localX}px ${localY}px)`;
                void cardMenu.offsetWidth; 
                
                cardMenu.style.transition = 'clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                clearTimeout(pressTimer);
                pressTimer = setTimeout(() => {
                    if(!isDragging) activarMenu();
                }, 700);
            };

            const cancelarToque = () => clearTimeout(pressTimer);

            const marcarArrastre = (e) => { 
                if (isDragging) return;
                const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) {
                    isDragging = true;
                    clearTimeout(pressTimer); 
                }
            };

            cardContent.oncontextmenu = (e) => { if(!this.editMode) e.preventDefault(); };

            cardContent.addEventListener('touchstart', iniciarToque, {passive: true});
            cardContent.addEventListener('touchend', cancelarToque);
            cardContent.addEventListener('touchcancel', cancelarToque);
            cardContent.addEventListener('touchmove', marcarArrastre, {passive: true});
            cardContent.addEventListener('mousedown', iniciarToque);
            cardContent.addEventListener('mouseup', cancelarToque);
            cardContent.addEventListener('mouseleave', cancelarToque);
            cardContent.addEventListener('mousemove', marcarArrastre);

            cardMenu.querySelector('.btn-c-cerrar').onclick = (e) => { e.stopPropagation(); cerrarIris(); };

            cardMenu.querySelector('.btn-c-ajustes').onclick = (e) => {
                e.stopPropagation();
                cerrarIris();
                if (card.abrirAjustes) card.abrirAjustes(this); 
                else this.notificar(`Esta tarjeta no tiene ajustes`, "ℹ️");
            };

            cardMenu.querySelector('.btn-c-tamano').onclick = (e) => {
                e.stopPropagation();
                const anchoPantalla = window.innerWidth;
                let maxW, maxH;
                if (anchoPantalla <= 600) { maxW = 2; maxH = 4; } 
                else if (anchoPantalla <= 1024) { maxW = 4; maxH = 6; } 
                else { maxW = 10; maxH = 10; }
                
                const anchosDisponibles = Array.from({length: maxW}, (_, i) => i + 1);
                const altosDisponibles = Array.from({length: maxH}, (_, i) => i + 1);
                
                this.abrirSelectorRadialDoble(div, anchosDisponibles, altosDisponibles, currentSize, (nuevoTamano) => {
                    cerrarIris();
                    div.classList.remove(`size-${currentSize}`);
                    div.classList.add(`size-${nuevoTamano}`);
 
                    currentSize = nuevoTamano;
                    
                    // 💾 GUARDADO DE TAMAÑOS EN SUPABASE Y CACHÉ
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

            if (card.customAccion) {
                cardMenu.querySelector('.btn-c-custom').onclick = (e) => {
                    e.stopPropagation();
                    cerrarIris();
                    card.customAccion.ejecutar(this); 
                };
            }
            
            try {
                if(card.onInit) card.onInit(this);
            } catch(error) {
                console.error(`Error silencioso iniciando tarjeta ${card.id}:`, error);
            }
        });
    }

    abrirSelectorRadialDoble(tarjetaContenedor, anchosDisponibles, altosDisponibles, tamanoActual, callback) {
        const overlay = document.createElement('div');
        overlay.className = 'radial-overlay';
        overlay.style.zIndex = '20'; 
        
        const currentAncho = parseInt(tamanoActual.split('x')[0]);
        const currentAlto = parseInt(tamanoActual.split('x')[1]);

        const construirCilindro = (valores) => {
            let caras = [...valores];
            while (caras.length < 12) { caras = caras.concat(valores); }
            const numFaces = caras.length;
            const theta = 360 / numFaces;
            const radio = Math.round(20 / Math.tan(Math.PI / numFaces)); 
            
            let html = '';
            caras.forEach((val, i) => {
                html += `<div class="radial-face" data-val="${val}" id="face-${i}" style="transform: rotateX(${i * -theta}deg) translateZ(${radio}px)">${val}</div>`;
            });
            return { html, numFaces, theta, caras };
        };

        const colAncho = construirCilindro(anchosDisponibles);
        const colAlto = construirCilindro(altosDisponibles);
        
        overlay.innerHTML = `
            <div style="font-weight:bold; margin-bottom:15px; color:white; letter-spacing:1px; z-index:100; pointer-events:none;">DIMENSIONES</div>
            <div style="display:flex; gap: 20px; align-items:center; z-index:100;">
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="font-size:0.7rem; color:var(--text-sec); margin-bottom:5px; pointer-events:none;"><i class="fa-solid fa-arrows-left-right"></i> ANCHO</div>
                    <div class="radial-viewport" id="viewport-ancho" style="width: 60px;">
                        <div class="radial-cylinder" id="cylinder-ancho">${colAncho.html}</div>
                    </div>
                </div>
                <div style="font-size:1.5rem; color:var(--text-sec); font-weight:bold; margin-top:20px; z-index:100; pointer-events:none;">×</div>
                <div style="display:flex; flex-direction:column; align-items:center;">
                    <div style="font-size:0.7rem; color:var(--text-sec); margin-bottom:5px; pointer-events:none;"><i class="fa-solid fa-arrows-up-down"></i> ALTO</div>
                    <div class="radial-viewport" id="viewport-alto" style="width: 60px;">
                        <div class="radial-cylinder" id="cylinder-alto">${colAlto.html}</div>
                    </div>
                </div>
            </div>
            <div style="color:var(--text-sec); font-size:0.75rem; margin-top:30px; pointer-events:none; opacity:0.8;">Toca el fondo para guardar</div>
        `;

        tarjetaContenedor.appendChild(overlay);
        void overlay.offsetWidth; 
        overlay.style.opacity = '1';

        const setupCilindro = (tipo, colData, valorInicial) => {
            const cylinder = overlay.querySelector(`#cylinder-${tipo}`);
            const viewport = overlay.querySelector(`#viewport-${tipo}`);
            
            let idxInicial = colData.caras.indexOf(valorInicial);
            if (idxInicial === -1) idxInicial = 0;
            
            let anguloActual = idxInicial * colData.theta;
            cylinder.style.transform = `rotateX(${anguloActual}deg)`;

            let isDragging = false;
            let startY = 0;
            let anguloInicial = 0;

            const iluminarCara = () => {
                let normalizedIndex = Math.round(anguloActual / colData.theta) % colData.numFaces;
                if (normalizedIndex < 0) normalizedIndex += colData.numFaces;
                viewport.querySelectorAll('.radial-face').forEach(f => f.classList.remove('selected'));
                viewport.querySelectorAll('.radial-face')[normalizedIndex].classList.add('selected');
            };
            iluminarCara();

            const onStart = (e) => {
                isDragging = true;
                startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                anguloInicial = anguloActual;
                cylinder.style.transition = 'none';
            };
            const onMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                anguloActual = anguloInicial - ((currentY - startY) * 0.6);
                cylinder.style.transform = `rotateX(${anguloActual}deg)`;
                iluminarCara();
            };

            const onEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                anguloActual = Math.round(anguloActual / colData.theta) * colData.theta;
                cylinder.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)';
                cylinder.style.transform = `rotateX(${anguloActual}deg)`;
                iluminarCara();
            };

            viewport.addEventListener('mousedown', onStart);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            viewport.addEventListener('touchstart', onStart, {passive: false});
            window.addEventListener('touchmove', onMove, {passive: false});
            window.addEventListener('touchend', onEnd);

            return () => {
                let idx = Math.round(anguloActual / colData.theta) % colData.numFaces;
                if (idx < 0) idx += colData.numFaces;
                return colData.caras[idx];
            };
        };

        const getValorAncho = setupCilindro('ancho', colAncho, currentAncho);
        const getValorAlto = setupCilindro('alto', colAlto, currentAlto);

        let closeTimer;
        let isClosing = false;
        let startX = 0, startY = 0;

        const iniciarCierre = (e) => {
            if (e.target.closest('.radial-viewport')) return;
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();

            isClosing = false;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => {
                if (!isClosing) {
                    isClosing = true;
                    const tamanoElegido = `${getValorAncho()}x${getValorAlto()}`;
                    this.vibra("tick");
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        callback(tamanoElegido);
                    }, 200);
                }
            }, 200);
        };

        const cancelarCierre = () => clearTimeout(closeTimer);
        const arrastreCierre = (e) => {
            if (isClosing || startX === 0) return;
            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            if (Math.abs(currentX - startX) > 10 || Math.abs(currentY - startY) > 10) clearTimeout(closeTimer);
        };

        overlay.oncontextmenu = (e) => e.preventDefault();
        overlay.addEventListener('mousedown', iniciarCierre);
        overlay.addEventListener('mouseup', cancelarCierre);
        overlay.addEventListener('mouseleave', cancelarCierre);
        overlay.addEventListener('mousemove', arrastreCierre);
        overlay.addEventListener('touchstart', iniciarCierre, {passive: false});
        overlay.addEventListener('touchend', cancelarCierre);
        overlay.addEventListener('touchcancel', cancelarCierre);
        overlay.addEventListener('touchmove', arrastreCierre, {passive: false});
    }

    // 📝 1. FORMULARIO DE REGISTRO
    async registrarUsuario(u, p1, p2) {
        if (!u) return this.notificar("Falta el usuario", "❌");
        if (p1 !== p2) return this.notificar("Las contraseñas no coinciden", "❌");
        if (p1.length < 6) return this.notificar("Mínimo 6 caracteres", "⚠️");
        const emailAuth = u.includes('@') ? u : `${u}@pico.os`;
        const btn = document.getElementById('btn-register-submit');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const { data, error } = await this.supabase.auth.signUp({ email: emailAuth, password: p1 });
            if (error) throw error;
            this.notificar("Solicitud enviada al Administrador.", "⏳");
            document.getElementById('link-toggle-register').click();
            document.getElementById('user-input').value = "";
            document.getElementById('pass-input').value = "";
            document.getElementById('pass2-input').value = "";
        } catch (error) {
            if (error.message.includes("already registered")) this.notificar("Ese usuario ya existe", "⚠️");
            else this.notificar("Fallo al registrar", "❌");
        } finally {
            btn.innerHTML = 'ENVIAR SOLICITUD';
        }
    }

    async comprobarSolicitudesPendientes() {
        if (this.rol !== 'admin' && this.rol !== 'god') return;
        try {
            const { data, error } = await this.supabase.from('perfiles').select('id, rol').eq('rol', 'pendiente');
            if (data && data.length > 0) {
                setTimeout(() => {
                    this.notificar(`Tienes ${data.length} solicitud(es) de acceso. Abre la consola HUD.`, "🔔");
                    this.vibra("doble");
                    
                    const hud = document.getElementById('hud-console');
                    if (hud) {
                        const btnId = `btn-approve-${data[0].id}`;
                        this.logHUD(`NUEVO USUARIO ESPERANDO. <button id="${btnId}" style="background:#bf5af2; color:white; border:none; padding:2px 5px; cursor:pointer;">Aprobar Primero</button>`, "info");
                        setTimeout(() => {
                            const btn = document.getElementById(btnId);
                            if(btn) btn.onclick = () => this.ejecutarForjaAutomatica(data[0].id);
                        }, 100);
                    }
                }, 3000); 
            }
        } catch (error) { console.error("Error radar:", error); }
    }

    async ejecutarForjaAutomatica(userId) {
        const alias = prompt("Escribe el nombre de usuario (ej: hermano):");
        if (!alias) return;
        const pass = prompt(`Escribe la contraseña que el usuario ${alias} escogió al registrarse:`);
        if (!pass) return;
        const pin = prompt(`Inventa un PIN Maestro de 4 números para ${alias}:`);
        if (!pin) return;

        try {
            this.notificar("Forjando Bóveda Criptográfica...", "⚙️");
            const nuevaConf = {
                topic: this.conf.topic,
                tk: this.conf.tk, 
                rol: "guest",
                apis: { google: this.apiKeys?.google, groq: this.apiKeys?.groq, openrouter: this.apiKeys?.openrouter } 
            };

            const ghostKey = CryptoJS.lib.WordArray.random(32).toString();
            const keyData = CryptoJS.SHA256(pass + ghostKey);
            const ivData = CryptoJS.lib.WordArray.random(16);
            const encData = CryptoJS.AES.encrypt(JSON.stringify(nuevaConf), keyData, {iv: ivData, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
            const payloadData = CryptoJS.enc.Base64.stringify(ivData.concat(encData.ciphertext));

            const keyEnv = CryptoJS.SHA256(pass + pin);
            const ivEnv = CryptoJS.lib.WordArray.random(16);
            const encEnv = CryptoJS.AES.encrypt(ghostKey, keyEnv, {iv: ivEnv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
            const payloadEnv = CryptoJS.enc.Base64.stringify(ivEnv.concat(encEnv.ciphertext));

            const finalJSON = JSON.stringify({ e: payloadEnv, d: payloadData });
            const maletinBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(finalJSON));

            const { error } = await this.supabase
                .from('perfiles')
                .update({ maletin_encriptado: maletinBase64, rol: 'guest', updated_at: new Date() })
                .eq('id', userId);

            if (error) throw error;
            this.notificar("Usuario autorizado y encriptado con éxito", "✅");
            this.logHUD(`USUARIO APROBADO: Pásale su PIN temporal: ${pin}`, "out");
        } catch (error) {
            console.error("Fallo de encriptación:", error);
            this.notificar("Fallo al forjar el maletín", "❌");
        }
    }
    
    async conectar() {
        if (!this.conf || !this.conf.escudo_url) return;
        const wsUrl = this.conf.escudo_url;

        this.ws = new WebSocket(wsUrl);
        const dot = document.getElementById('mqtt-dot');
        this.ws.onopen = () => {
            this.setNetworkStatus(true);
            if (dot) dot.className = "dot green";
            const brokerElegido = this.brokers[this.brIdx].h;
            this.ws.send(JSON.stringify({ accion: "cambiar_broker", host: brokerElegido }));
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
            } else if (data.tipo === "ia_voz") {
                this.hablarJARVIS(data.texto);
                this.notificar(data.texto, "🗣️");
            }
        };

        this.ws.onclose = () => {
            this.setNetworkStatus(false);
            if (dot) dot.className = "dot red";
            setTimeout(() => this.conectar(), 3000); 
        };
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
            item.className = `dropdown-item ${idx === this.brIdx ? 'selected' : ''}`;
            item.innerText = b.name;
            item.onclick = () => {
                this.brIdx = idx;
                current.innerText = b.name;
                menu.classList.remove('open');
                this.setupBrokerMenu(); 
                this.notificar(`Enrutando servidor a ${b.name}...`, "🔀");
                
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ accion: "cambiar_broker", host: b.h }));
                }
            };
            menu.appendChild(item);
        });

        trigger.onclick = (e) => {
            e.stopPropagation();
            settingsMenu.classList.remove('open'); 
            menu.classList.toggle('open');
        };
    }

    updatePicoStatus(val) {
        const container = document.getElementById('pico-status-container');
        if (!container) return;

        const isOnline = val === "ONLINE" || val === "KEEPALIVE" || (val && (val.sistema === "ONLINE" || val.t !== undefined));
        clearTimeout(this.picoWatchdog);
        
        container.innerHTML = "";
        if (isOnline) {
            this.picoWatchdog = setTimeout(() => {
                console.log("⏱️ Timeout: La Pico ha muerto. Sobrescribiendo estado...");
                this.updatePicoStatus("OFFLINE"); 
                if (this.mqtt && this.mqtt.isConnected()) {
                    this.pub("sistema_hb", JSON.stringify({ sistema: "OFFLINE" }), true);
                    this.pub("sistema", "OFFLINE", true); 
                }
            }, 20000);

            let ramPercent = 0;
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

    cerrarSesion() {
        localStorage.removeItem('p');
        sessionStorage.removeItem('pico_sesion_ok');

        if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
        if(this.supabase) this.supabase.auth.signOut();

        document.getElementById('pass-input').value = "";
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
            loginScreen.style.pointerEvents = 'auto';
        }
        
        document.getElementById('side-menu').classList.remove('open');
        const settingsMenu = document.getElementById('settings-menu');
        if(settingsMenu) settingsMenu.classList.remove('open');

        this.notificar("Sesión cerrada", "🔒");
    }

    async manejarHuella() {
        const huellaGuardada = localStorage.getItem('pico_huella_token');
        const bioId = localStorage.getItem('pico_bio_id');
        
        if (!huellaGuardada || !bioId) {
            const u = document.getElementById('user-input').value.trim();
            const p = document.getElementById('pass-input').value.trim();
            
            if (!u || !p) return this.notificar("Escribe tu usuario y contraseña primero", "⚠️");

            try {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);
                const cred = await navigator.credentials.create({
                    publicKey: {
                        challenge: challenge,
                        rp: { name: "Pico OS", id: window.location.hostname },
                        user: { id: new Uint8Array(16), name: u, displayName: u },
                        pubKeyCredParams: [{alg: -7, type: "public-key"}, {alg: -257, type: "public-key"}],
                        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                        timeout: 60000
                    }
                });
                const rawId = Array.from(new Uint8Array(cred.rawId));
                localStorage.setItem('pico_bio_id', JSON.stringify(rawId));
                localStorage.setItem('pico_huella_token', btoa(JSON.stringify({ u: u, p: p })));
                
                this.actualizarUIHuella();
                this.notificar("Huella vinculada con éxito", "✅");
                
            } catch (err) {
                console.error("Fallo al crear credencial:", err);
                this.notificar("Registro biométrico cancelado", "❌");
            }
        } else {
            try {
                const savedId = JSON.parse(bioId);
                const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
                
                await navigator.credentials.get({
                    publicKey: {
                        challenge: challenge,
                        rpId: window.location.hostname,
                        allowCredentials: [{ id: new Uint8Array(savedId), type: 'public-key' }],
                        timeout: 60000,
                        userVerification: "required"
                    }
                });
                const creds = JSON.parse(atob(huellaGuardada));
                document.getElementById('user-input').value = creds.u;
                document.getElementById('pass-input').value = creds.p;
                this.login(); 
                
            } catch (err) {
                console.error("Fallo al leer credencial:", err);
                this.notificar("Huella no reconocida o cancelada", "❌");
            }
        }
    }

    actualizarUIHuella() {
        const tieneHuella = localStorage.getItem('pico_huella_token');
        const btnLoginHuella = document.getElementById('btn-huella');
        const btnEliminarHuella = document.getElementById('btn-eliminar-huella');
        
        if (btnLoginHuella) btnLoginHuella.style.color = tieneHuella ? "#10b981" : "#8b5cf6";
        if (btnEliminarHuella) btnEliminarHuella.style.display = tieneHuella ? "block" : "none";
    }

    ejecutarComandoLocal(app, accion) {
        const comandosLocales = ["Tema", "Edicion", "Vibracion", "Actualizaciones", "Vista", "Filtro", "Consola", "Sesion", "VozIA", "Consciencia", "IA"];
        const hardwareVirtual = ["Dado", "Pomodoro", "Calculadora", "Qr", "Reloj", "Tiempo", "Lista", "Macros"];

        if (hardwareVirtual.includes(app)) {
            if (this.logHUD) this.logHUD(`Simulando hardware virtual: ${app} -> ${accion}`, "out");
            if (app === "Dado" && accion === "roll") {
                const resultado = Math.floor(Math.random() * 6) + 1;
                this.pub("Dado", resultado, true); 
            } else if (app !== "Macros") {
                this.pub(app, accion, true);
            }
            return true;
        }

        if (!comandosLocales.includes(app)) return false;

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
                const grid = document.getElementById('dashboard-grid');
                const plano = document.getElementById('plano-view');
                const macros = document.getElementById('macros-view');
                if (grid) grid.style.display = (accion === 'dashboard') ? 'grid' : 'none';
                if (plano) plano.style.display = (accion === 'plano') ? 'flex' : 'none';
                if (macros) macros.style.display = (accion === 'macros') ? 'flex' : 'none';
                break;
            case "Filtro":
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
                if (accion === "logout") this.cerrarSesion();
                break;
            case "VozIA":
                this.iaSilenciada = (accion === "mute");
                if (this.iaSilenciada) this.notificar("Voz de JARVIS desactivada", "🔇");
                else this.notificar("Voz de JARVIS restaurada", "🔊");
                break;
            case "Consciencia":
                const modos = {
                    'logico': { nombre: 'LÓGICO', color: '#0a84ff', icon: 'fa-brain' },
                    'ironico': { nombre: 'IRÓNICO', color: '#f59e0b', icon: 'fa-face-rolling-eyes' },
                    'defensa': { nombre: 'DEFENSA', color: '#ff453a', icon: 'fa-skull' },
                    'zen': { nombre: 'MODO ZEN', color: '#32d74b', icon: 'fa-leaf' }
                };
                if(modos[accion]) {
                    localStorage.setItem('pico_ai_modo', accion);
                    const cardConsc = this.cards.find(c => c.id === 'Consciencia');
                    if(cardConsc && cardConsc.onData) cardConsc.onData(modos[accion]);
                    
                    this.notificar(`Personalidad alterada a: ${modos[accion].nombre}`, "🧬");
                    this.pub('Sistema/Consciencia', accion, true);
                }
                break;
            case "IA":
                if (accion === "clear" || accion === "limpiar") {
                    window.iaMensajes = [];
                    const chatBox = document.getElementById('chat-history');
                    if (chatBox) chatBox.innerHTML = '<div style="text-align:center; color:var(--text-sec); margin-top:10px;">Memoria neuronal purgada.</div>';
                    this.notificar("Memoria de IA reiniciada", "🧠");
                }
                break;
        }
        return true;
    }
    
    cmd(app, c) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.colaOffline.push({app, c});
            return this.notificar("Sin conexión al Escudo. Orden en cola", "❌");
        }
        this.ws.send(JSON.stringify({ accion: "comando", app: app, comando: c }));
    }

    // ==========================================================
    // 🧠 SISTEMA OPERATIVO JARVIS
    // ==========================================================
    
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
            btnVoz.style.color = "#ff453a";
            btnVoz.classList.add("fa-beat-fade");
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

    hablarJARVIS(texto) {
        if (!('speechSynthesis' in window) || !texto || texto === 'null') return;
        if (this.iaSilenciada) return; 
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    }

    registrarHabito(app, accion) {
        let habitos = JSON.parse(localStorage.getItem('picoHabitos')) || [];
        const hora = new Date().getHours();
        habitos.push({ app, accion, hora });
        if(habitos.length > 100) habitos.shift();
        localStorage.setItem('picoHabitos', JSON.stringify(habitos));
    }

    async procesarComandoIA() {
        const input = document.getElementById('ai-input');
        const orden = input.value.trim();
        if(!orden) return;
        
        input.value = ""; 
        this.notificar("Consultando al Escudo de IA...", "🧠");
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ 
                accion: "ia", 
                proveedor: this.conf.ia_favorita || "google", 
                texto: orden 
            }));
        }
    }

    iniciarAgenteProactivo() {
        this.notificar("Agente Autónomo en línea", "🛡️");
        setInterval(() => {
            console.log("🛡️ Agente Autónomo: Escaneando perímetro...");
            this.ejecutarInferencia("Analiza el estado actual de la casa. Si detectas alguna anomalía de seguridad, un gasto excesivo, o un clima que requiera acción, actúa. Si todo está bien, no hagas nada y mantén 'comandos' vacío y 'voz' nulo.", "proactivo");
        }, 600000);
    }

    async precargarMotorLocal() {
        if (this.localEngine || this.localEngineWASM) return true;
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

        this.esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        try {
            if (!this.esMovil) {
                console.log("🖥️ Arquitectura PC detectada. Cargando WebLLM...");
                const versionIA = this.versiones["@mlc-ai/web-llm"];
                const { CreateMLCEngine } = await import(`https://esm.run/@mlc-ai/web-llm@${versionIA}`);
                this.localEngine = await CreateMLCEngine("SmolLM-135M-Instruct-q4f16_1-MLC", {
                    initProgressCallback: (progress) => {
                        const pct = Math.round(progress.progress * 100);
                        const textEl = document.getElementById('ia-dl-text');
                        const barEl = document.getElementById('ia-dl-bar');
                        if(textEl) textEl.innerText = `WebGPU (PC): ${pct}%`;
                        if(barEl) barEl.style.width = `${pct}%`;
                    },
                    chatOpts: { context_window_size: 1024 } 
                });
            } else {
                console.log("📱 Arquitectura Móvil detectada.");
                try {
                    const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0');
                    env.allowLocalModels = false;
                    env.useBrowserCache = true;
                    env.backends.onnx.wasm.numThreads = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);
                    
                    const textEl = document.getElementById('ia-dl-text');
                    if(textEl) textEl.innerText = "Iniciando motor WASM...";

                    const modelo = 'Xenova/Qwen1.5-0.5B-Chat';
                    this.localEngineWASM = await pipeline('text-generation', modelo, {
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
                    console.error("Error fatal en IA Móvil:", err);
                    const textEl = document.getElementById('ia-dl-text');
                    if(textEl) {
                        textEl.innerText = "Fallo de compatibilidad";
                        textEl.style.color = "#ff453a";
                    }
                    alert("Error IA Móvil: " + err.message);
                }
            }

            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
            return true;

        } catch (e) {
            console.error("Fallo crítico al montar Motor Local:", e.message || e);
            if(document.getElementById('toast-ia-dl')) document.getElementById('toast-ia-dl').remove();
            return false;
        }
    }

    async procesarConWebLLM(promptSistema, orden, modo) {
        try {
            let textoCrudo = "";
            if (!this.esMovil && this.localEngine) {
                const reply = await this.localEngine.chat.completions.create({
                    messages: [{ role: "system", content: promptSistema }, { role: "user", content: orden }],
                    response_format: { type: "json_object" }
                });
                textoCrudo = reply.choices[0].message.content;
            } 
            else if (this.esMovil && this.localEngineWASM) {
                await new Promise(resolve => setTimeout(resolve, 800));
                const promptMovil = `<|im_start|>system\n${promptSistema}\nATENCIÓN: Tu única salida debe ser exclusivamente un bloque JSON válido. Nada de texto extra.<|im_end|>\n<|im_start|>user\n${orden}<|im_end|>\n<|im_start|>assistant\n`;
                const respuesta = await this.localEngineWASM(promptMovil, {
                    max_new_tokens: 200, temperature: 0.1, repetition_penalty: 1.1, do_sample: false
                });
                
                let outputStr = respuesta[0].generated_text.replace(promptMovil, "").trim();
                const jsonMatch = outputStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) textoCrudo = jsonMatch[0];
                else throw new Error("El motor móvil no devolvió un JSON válido");
            } else {
                throw new Error("Ningún motor local inicializado");
            }

            this.desplegarPayloadCuantico(textoCrudo, orden, modo);
        } catch(e) { 
            console.error("Fallo de Inferencia Local:", e);
            this.notificar("Colapso lógico en IA Local", "❌");
        }
    }

    async ejecutarInferencia(orden, modo = "reactivo") {
        if(!localStorage.getItem("p") || !this.apiKeys) {
            return this.notificar("Sesión corrupta o sin permisos de IA.", "❌");
        }

        const statusEl = document.querySelector('.pico-info-pill');
        const picoStatus = (statusEl && statusEl.innerText.includes('Online')) ? 'ONLINE (Conectada)' : 'OFFLINE (Desconectada)';
        
        let contextoFisico = `--- TELEMETRÍA FÍSICA ACTUAL (ESTADO PICO: ${picoStatus}) ---\n`;
        document.querySelectorAll('.card').forEach(card => {
            contextoFisico += `- Módulo [${card.dataset.id}]: ${card.querySelector('.val-text')?.innerText || "Activo"}\n`;
        });
        contextoFisico += `- Reloj: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n`;
        
        let memoriaProfunda = "";
        if (this.db) { 
            const horaActual = new Date().getHours();
            memoriaProfunda = `--- PATRONES (${horaActual}:00) ---\n${await this.consultarHabitosDB(horaActual)}\n`; 
        }
        let memoria = "--- CONTEXTO ---\n";
        (this.historialIA || []).forEach(h => memoria += `Humano: ${h.u}\nJARVIS: ${h.a}\n`);

        const promptSistema = GeneradorPrompt(contextoFisico, memoriaProfunda, memoria, modo, orden);
        
        if (this.modoIALocal) {
            await this.procesarConWebLLM(promptSistema, orden, modo);
        } else {
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

            for (const proveedor of proveedores) {
                if (!proveedor.key) continue;
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
                    const origen = this.modoIALocal ? 'local' : 'nube';
                    this.gestionarFalloIA(origen);
                    console.error(`💥 Error de red crítico con ${proveedor.id}:`, e);
                }
            }

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

    desplegarPayloadCuantico(textoCrudo, orden, modo) {
        try {
            const payload = JSON.parse(textoCrudo);
            if(modo === "reactivo") {
                console.log("%c🧠 PENSAMIENTO IA: " + payload._razonamiento_interno, "color: #0a84ff; font-style: italic;");
                console.log("%c🎭 EMOCIÓN: " + payload.estado_emocional.toUpperCase(), "color: #ff9f0a; font-weight: bold;");
                console.log("⚡ COMANDOS COMUNIDAD: ", payload.comandos);
            }
            
            if (payload.comandos && Object.keys(payload.comandos).length > 0) {
                for (const [app, accion] of Object.entries(payload.comandos)) {
                    const esComandoWeb = this.ejecutarComandoLocal(app, accion);
                    if (!esComandoWeb) {
                        this.cmd(app, accion);
                        this.registrarEnDB(app, accion); 
                    }
                }
            } else if (modo === "reactivo") {
                this.notificar("Análisis completado. Sin acciones mecánicas.", "🤖");
            }

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
            
            if (payload.voz && payload.voz !== "null" && !this.iaSilenciada) {
                let icono = "🗣️";
                if(payload.estado_emocional === 'alerta') icono = "🚨";
                if(payload.estado_emocional === 'ironico' || payload.estado_emocional === 'sutilmente_sarcastico') icono = "😏";
                if(modo === "reactivo" || payload.estado_emocional === 'alerta') {
                    this.notificar(payload.voz, icono);
                    this.hablarJARVIS(payload.voz);
                }
            }

            if(modo === "reactivo") {
                this.historialIA.push({ u: orden, a: payload.voz || "Silencio táctico." });
                if (this.historialIA.length > 4) this.historialIA.shift();
            }
        } catch (e) { 
            console.error("Error de parsing neuronal:", e);
            this.notificar("Sinapsis colapsada", "⚠️");
        }
    }

    async iniciarCentinelaAudio() {
        if (this.centinelaActivo) {
            this.notificar("Centinela auditivo ya activo", "🛡️");
            return;
        }

        try {
            this.notificar("Cargando red neuronal auditiva...", "⏳");
            if (!this.tf) this.tf = await import("https://esm.run/@tensorflow/tfjs");
            const speechCommands = await import("https://esm.run/@tensorflow-models/speech-commands");

            this.recognizer = speechCommands.create("BROWSER_FFT");

            await this.recognizer.ensureModelLoaded();
            const palabras = this.recognizer.wordLabels();
            console.log("🎙️ Motor auditivo cargado. Palabras reconocidas:", palabras);

            this.recognizer.listen(result => {
                const scores = Array.from(result.scores);
                const maxScore = Math.max(...scores);
                const maxScoreIndex = scores.indexOf(maxScore);
                const palabraDetectada = palabras[maxScoreIndex];

                if (maxScore > 0.85) {
                    console.log(`[Audio Neural] Detectado: ${palabraDetectada} (${Math.round(maxScore*100)}%)`);
                    
                    if (palabraDetectada === "go") {
                        this.vibra("doble");
                        this.hablarJARVIS("Sistema activado. A la escucha.");
                    }
                }
            }, {
                probabilityThreshold: 0.85,
                invokeCallbackOnNoiseAndUnknown: false,
                overlapFactor: 0.5 
            });

            this.centinelaActivo = true;
            this.notificar("Oído biónico online", "🎙️");
        } catch (error) {
            console.error("Fallo al iniciar TensorFlow Audio:", error);
            this.notificar("Fallo al acceder al micrófono", "❌");
            document.getElementById('sw-jarvis').checked = false;
        }
    }

    detenerCentinelaAudio() {
        if (this.recognizer && this.centinelaActivo) {
            this.recognizer.stopListening();
            this.centinelaActivo = false;
            this.notificar("Centinela auditivo en reposo", "🛑");
        }
    }
    
    initInterruptorIA() {
        const aiInput = document.getElementById('ai-input');
        if (!aiInput || document.getElementById('btn-ia-mode')) return;

        const btnMode = document.createElement('button');
        btnMode.id = 'btn-ia-mode';
        
        this.modoIALocal = false;
        this.reintentoNubeActivo = null; 
        
        btnMode.innerHTML = '<i class="fa-solid fa-cloud"></i>';
        btnMode.style.cssText = "background:transparent; border:none; color:var(--text-sec); font-size:1.2rem; cursor:pointer; padding:0 10px; outline:none; transition: 0.3s;";
        
        aiInput.parentNode.insertBefore(btnMode, aiInput);

        btnMode.onclick = async () => {
            this.detenerReintento();
            if (!this.modoIALocal) {
                await this.activarModoLocal(btnMode);
            } else {
                this.activarModoNube(btnMode);
            }
        };
    }

    async activarModoLocal(btn) {
        if(!btn) btn = document.getElementById('btn-ia-mode');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
        this.notificar("Arrancando turbinas locales...", "⚙️");
        
        const exito = await this.precargarMotorLocal();
        if (exito) {
            this.modoIALocal = true;
            btn.innerHTML = '<i class="fa-solid fa-microchip"></i>';
            btn.style.color = '#32d74b'; 
            this.notificar("IA Local al mando", "🔒");
            return true;
        } else {
            this.notificar("Hardware incompatible. Retornando a la Nube", "⚠️");
            this.activarModoNube(btn);
            return false;
        }
    }

    activarModoNube(btn) {
        if(!btn) btn = document.getElementById('btn-ia-mode');
        this.modoIALocal = false;
        btn.innerHTML = '<i class="fa-solid fa-cloud"></i>';
        btn.style.color = 'var(--text-sec)';
        this.notificar("Modo IA Nube activado", "☁️");
    }

    async gestionarFalloIA(origenFallo) {
        const btn = document.getElementById('btn-ia-mode');
        if (origenFallo === 'nube') {
            this.notificar("Conexión Nube caída. Desplegando IA Local...", "⚠️");
            const exitoLocal = await this.activarModoLocal(btn);
            
            if (!exitoLocal) {
                this.notificar("Apagón total de sistemas IA. Reintentando en 1 min...", "🚨");
                btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#ff453a;"></i>';
                
                if (!this.reintentoNubeActivo) {
                    this.reintentoNubeActivo = setInterval(() => {
                        this.notificar("Reintentando conexión con Nube...", "🔄");
                        this.activarModoNube(btn);
                    }, 60000);
                }
            }
        } else if (origenFallo === 'local') {
            this.notificar("Motor Local colapsado. Evacuando a la Nube...", "⚠️");
            this.activarModoNube(btn);
        }
    }

    detenerReintento() {
        if (this.reintentoNubeActivo) {
            clearInterval(this.reintentoNubeActivo);
            this.reintentoNubeActivo = null;
        }
    }

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
                delay: 200,
                delayOnTouchOnly: true,
                ghostClass: 'sortable-ghost',
                onEnd: ()=>{
                    const order = [];
                    document.querySelectorAll('.card').forEach(c=>order.push(c.dataset.id));
                    
                    // 💾 GUARDADO DE ORDEN EN SUPABASE Y CACHÉ
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
        document.body.setAttribute('data-theme', next); 
        localStorage.setItem('theme',next);
        
        // Sincronizar tema a la nube si hay sesión
        if(this.perfilDB) {
            if(!this.perfilDB.interfaz) this.perfilDB.interfaz = {};
            this.perfilDB.interfaz.tema = next;
            this.guardarPerfilEnNube({ interfaz: this.perfilDB.interfaz });
        }
    }

    vibra(tipo = "tick") {
        const sw = document.getElementById('sw-vibration');
        if (!sw || !sw.checked || !navigator.vibrate) return;
        if (tipo === "tick") navigator.vibrate(15);
        if (tipo === "doble") navigator.vibrate([20, 40, 20]);
        if (tipo === "error") navigator.vibrate([50, 50, 50]);
    }

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
            this.notificar("Sin conexión al Broker", "⚠️");
            this.vibra("error");
            this._wasOffline = true;
        }
    }

    initAtajosTeclado() {
        window.addEventListener('keydown', (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if(e.key.toLowerCase() === 'l') {
                this.vibra("tick");
                const st = document.getElementById('val-Led')?.innerText;
                if(st) this.ejecutarConDeshacer('Led', st === "ON" ? "off" : "on");
            }
            if(e.key === 'h') this.toggleHUD();
        });
    }

    toggleHUD() {
        let hud = document.getElementById('hud-console');
        if(!hud) {
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
        hud.scrollTop = hud.scrollHeight;
    }

    initParallax() {
        document.addEventListener('mousemove', (e) => {
            if(this.editMode) return;
            document.querySelectorAll('.card').forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                card.style.transform = `perspective(1000px) rotateX(${-y / 30}deg) rotateY(${x / 30}deg)`;
            });
        });
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if(this.editMode) return;
                const tiltX = Math.min(Math.max(e.beta - 45, -20), 20);
                const tiltY = Math.min(Math.max(e.gamma, -20), 20); 
                document.querySelectorAll('.card').forEach(card => {
                    card.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`;
                });
            });
        }
    }

    ejecutarConDeshacer(app, comando, tiempoGracia = 3000) {
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

            const timerId = setTimeout(() => {
                this.cmd(app, comando); 
                toast.remove();
            }, tiempoGracia);
            document.getElementById(`undo-${toastId}`).onclick = () => {
                clearTimeout(timerId);
                toast.remove();
                this.notificar(`Acción en ${app} cancelada`, "🛑");
            };
        } else {
            this.cmd(app, comando);
        }
    }

    initSwipeGestures() {
        let touchStartX = 0;
        document.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
        document.addEventListener('touchend', e => {
            const touchEndX = e.changedTouches[0].screenX;
            const targetCard = e.target.closest('.card');
            if(!targetCard) return;

            if (touchStartX - touchEndX > 50) targetCard.classList.add('swipe-open');
            if (touchEndX - touchStartX > 50) targetCard.classList.remove('swipe-open');
        });
    }

    async abrirPiP(app) {
        if (!('documentPictureInPicture' in window)) {
            return this.notificar("Tu navegador no soporta PiP", "❌");
        }
        const tarjeta = this.cards.find(c => c.id === app);
        if(!tarjeta || !tarjeta.pip) return;
        try {
            const pipWindow = await documentPictureInPicture.requestWindow({ width: 250, height: 250 });
            const style = document.createElement('style');
            style.textContent = `
                body { background: #1c1c1e; color: white; display: flex; align-items: center; justify-content: center; font-family: sans-serif; height: 100vh; margin: 0; }
                .val-text { font-size: 3rem; font-weight: bold; }
            `;
            pipWindow.document.head.appendChild(style);
            pipWindow.document.body.innerHTML = `
                <div style="text-align:center">
                    <div style="color:#8e8e93">${app.toUpperCase()}</div>
                    <div class="val-text" id="pip-val">...</div>
                </div>
            `;
            this.notificar(`${app} extraído a PiP`, "🪟");
        } catch(e) {
            console.error(e);
        }
    }

    initSidebar() {
        const trigger = document.querySelector('.pico-os-title');
        const menu = document.getElementById('side-menu');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
            this.vibra("tick");
        });
        document.addEventListener('click', (e) => {
            if(!menu.contains(e.target) && !trigger.contains(e.target)) {
                menu.classList.remove('open');
            }
        });
        document.getElementById('btn-nav-plano').onclick = () => { document.getElementById('plano-view').style.display = 'flex'; menu.classList.remove('open'); };
        document.getElementById('btn-nav-macros').onclick = () => { document.getElementById('macros-view').style.display = 'flex'; menu.classList.remove('open'); };
        document.getElementById('btn-nav-nfc').onclick = () => this.leerNFC();
        document.getElementById('btn-nav-radar').onclick = () => this.iniciarRadarBluetooth();
        document.getElementById('btn-nav-terminal').onclick = () => { this.toggleHUD(); menu.classList.remove('open')};
    }

    initMultijugador() {
        window.simularPresencia = (appId) => {
            const card = document.getElementById(`card-${appId}`);
            if(!card) return;
            card.classList.add('multiplayer-active');
            this.notificar(`Otro usuario está usando ${appId}`, "👥");
            setTimeout(() => card.classList.remove('multiplayer-active'), 3000);
        };
    }

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
                this.logHUD(`Lectura NFC: ${serialNumber}`);
            });
        } catch (error) {
            this.notificar("Error al encender el lector NFC", "❌");
            console.error(error);
        }
    }

    async iniciarRadarBluetooth() {
        if (!navigator.bluetooth) {
            return this.notificar("Bluetooth Web no soportado en este navegador", "❌");
        }
        try {
            this.notificar("Escaneando balizas cercanas...", "🔎");
            const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
            this.vibra("tick");
            this.notificar(`Dispositivo detectado: ${device.name || 'Desconocido'}`, "✅");
        } catch(e) {
            console.log("Radar Bluetooth cancelado");
        }
    }

    initModosExpertos() {
        this.initConstructorPlano();
        this.initPlanoDraggable();
        this.initGestorMacrosIA();
    }

    initConstructorPlano() {
        const grid = document.getElementById('plano-grid');
        const tools = document.querySelectorAll('.build-tool');
        const btnClear = document.getElementById('btn-clear-grid');
        if(!grid) return;

        let currentTool = 'floor';
        let isDrawing = false;
        const totalCells = 30 * 20; 

        tools.forEach(tool => {
            tool.onclick = () => {
                tools.forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                currentTool = tool.dataset.type;
                this.vibra("tick");
            };
        });
        let savedMap = JSON.parse(localStorage.getItem('miPlanoTiles')) || Array(totalCells).fill('');

        grid.innerHTML = '';
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = `grid-cell ${savedMap[i]}`;
            cell.dataset.index = i;
            grid.appendChild(cell);
        }

        const paintCell = (cell) => {
            if (!cell || !cell.classList.contains('grid-cell')) return;
            cell.classList.remove('wall', 'floor', 'door', 'window');
            if (currentTool !== 'erase') cell.classList.add(currentTool);
            savedMap[cell.dataset.index] = currentTool !== 'erase' ? currentTool : '';
            localStorage.setItem('miPlanoTiles', JSON.stringify(savedMap));
        };

        grid.addEventListener('mousedown', (e) => { isDrawing = true; paintCell(e.target); });
        grid.addEventListener('mouseover', (e) => { if(isDrawing) paintCell(e.target); });
        document.addEventListener('mouseup', () => { if(isDrawing) { isDrawing = false; this.vibra("tick"); }});
        grid.addEventListener('touchstart', (e) => { isDrawing = true; paintCell(e.target); }, {passive: false});
        grid.addEventListener('touchmove', (e) => {
            if(!isDrawing) return;
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            paintCell(element);
        }, {passive: false});
        document.addEventListener('touchend', () => isDrawing = false);

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
            
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const rect = draggedElement.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
        };

        const onDrag = (e) => {
            if (!draggedElement) return;
            e.preventDefault(); 
            
            const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const workspaceRect = workspace.getBoundingClientRect();
            let newLeft = clientX - workspaceRect.left - offsetX;
            let newTop = clientY - workspaceRect.top - offsetY;

            newLeft = Math.max(0, Math.min(newLeft, workspaceRect.width - draggedElement.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, workspaceRect.height - draggedElement.offsetHeight));

            draggedElement.style.left = `${(newLeft / workspaceRect.width) * 100}%`;
            draggedElement.style.top = `${(newTop / workspaceRect.height) * 100}%`;
        };

        const endDrag = () => {
            if(draggedElement) {
                this.vibra("tick");
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

    initGestorMacrosIA() {
        const btnRecord = document.getElementById('btn-record-key');
        const displayKey = document.getElementById('recorded-key-display');
        const btnCompile = document.getElementById('btn-compile-macro');
        const promptInput = document.getElementById('macro-ai-prompt');
        const list = document.getElementById('macro-list');
        const emptyMsg = document.getElementById('macro-empty-msg');
        if (!btnRecord || !btnCompile) return; 

        let currentBinding = "";
        btnRecord.onclick = () => {
            btnRecord.innerText = "Escuchando...";
            btnRecord.style.background = "#ff9f0a";
            btnRecord.style.color = "white";
            
            const capturer = (e) => {
                e.preventDefault();
                
                let keys = [];
                if (e.ctrlKey) keys.push("Ctrl");
                if (e.altKey) keys.push("Alt");
                if (e.shiftKey) keys.push("Shift");
                
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

        btnCompile.onclick = async () => {
            const prompt = promptInput.value.trim();
            if(!currentBinding || !prompt) return this.notificar("Falta el atajo o el texto", "⚠️");

            btnCompile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Compilando...`;
            this.vibra("tick");
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
                
                promptInput.value = "";
                displayKey.innerText = "Sin asignar";
                currentBinding = "";
                btnCompile.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Compilar y Guardar`;
                
                this.notificar("Atajo compilado con éxito", "✅");
            }, 1000);
        };
    }

    initBaseDeDatos() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("PicoOS_Database", 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
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

    registrarEnDB(app, accion, valorExtra = null) {
        if (!this.db) return;
        const transaccion = this.db.transaction(['habitos'], 'readwrite');
        const store = transaccion.objectStore('habitos');
        
        const registro = {
            app: app,
            accion: accion,
            valor: valorExtra,
            hora: new Date().getHours(),
            minuto: new Date().getMinutes(),
            diaSemana: new Date().getDay(), 
            timestamp: Date.now()
        };
        store.add(registro);
    }

    consultarHabitosDB(horaActual) {
        return new Promise((resolve) => {
            if (!this.db) return resolve("Sin datos históricos.");
            const transaccion = this.db.transaction(['habitos'], 'readonly');
            const store = transaccion.objectStore('habitos');
            const index = store.index('hora');
            
            const rango = IDBKeyRange.only(horaActual);
            const request = index.getAll(rango);
            
            request.onsuccess = () => {
                const resultados = request.result;
                if (resultados.length === 0) return resolve("No hay patrones a esta hora.");
                
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
