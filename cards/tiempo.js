export const TiempoCard = {
    id: "Tiempo",
    category: "info",
    defaultSize: "1x1", // ⬅️ Vuelve a nacer en 1x1 por defecto
    customAccion: {
        titulo: "Pronóstico Semanal",
        icono: "fa-solid fa-calendar-week",
        color: "#f59e0b",
        ejecutar: (core) => {
            const card = document.getElementById('card-Tiempo');
            const weeklyDiv = document.getElementById('weekly-forecast');
            
            if (card.classList.contains('modo-semana')) {
                // CIERRA LA SEMANA
                card.classList.remove('modo-semana');
                card.style.gridRowEnd = ""; 
                weeklyDiv.classList.remove('active');
            } else {
                // ABRE LA SEMANA (Fuerza 2 filas de alto)
                card.classList.add('modo-semana');
                card.style.gridRowEnd = "span 2"; 
                weeklyDiv.classList.add('active');
                
                const lat = window.lastCoords ? window.lastCoords.lat : 42.431;
                const lon = window.lastCoords ? window.lastCoords.lon : -8.644;
                
                weeklyDiv.innerHTML = '<div style="text-align:center; margin-top:20px"><i class="fa-solid fa-spinner fa-spin"></i></div>';
                
                fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`)
                    .then(r => r.json())
                    .then(d => {
                        let html = '';
                        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                        for(let i=1; i<6; i++) { 
                            const date = new Date(d.daily.time[i]);
                            const tMax = Math.round(d.daily.temperature_2m_max[i]);
                            const tMin = Math.round(d.daily.temperature_2m_min[i]);
                            const icon = getWeatherIcon(d.daily.weathercode[i]);
                            html += `
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 0; border-bottom:1px solid var(--border);">
                                    <span style="width:35px; font-weight:bold; color:var(--text-sec); font-size:0.8rem">${dias[date.getDay()]}</span>
                                    <i class="${icon.icon}" style="color:${icon.color}; font-size:1rem;"></i>
                                    <span style="font-weight:bold; color:var(--text-main); font-size:0.9rem">${tMax}° <span style="color:var(--text-sec); font-weight:normal">${tMin}°</span></span>
                                </div>
                            `;
                        }
                        weeklyDiv.innerHTML = html;
                    }).catch(e => {
                        weeklyDiv.innerHTML = '<div style="text-align:center; color:#ff453a; font-size:0.8rem;">Error de red</div>';
                    });
            }
        }
    },
    html: `
        <style>
            #tiempo-wrapper {
                display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; 
                height: 100%; width: 100%; box-sizing: border-box; padding: 5px; /* Padding reducido al mínimo */
            }
            #tiempo-top {
                display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; 
                width: 100%; height: 100%; gap: 2px;
            }
            #weather-city { 
                font-size: clamp(0.6rem, 15cqmin, 1rem); 
                font-weight: 800; color: var(--text-sec); 
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
                text-align: center; margin: 0; line-height: 1.2;
            }
            #weather-icon { 
                font-size: clamp(1.8rem, 35cqmin, 4rem); 
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); 
                display: flex; align-items: center; justify-content: center; margin: 0;
            }
            #weather-temp { 
                font-size: clamp(1.2rem, 30cqmin, 3.5rem); 
                font-weight: 800; line-height: 1; margin: 0;
            }
            
            #weekly-forecast { display: none !important; width: 100%; padding: 5px 10px; flex-grow: 1; flex-direction: column; justify-content: space-evenly; box-sizing:border-box;}
            #weekly-forecast.active { display: flex !important; }
            #card-Tiempo.modo-semana #tiempo-top { height: auto; padding-bottom: 5px; border-bottom: 1px solid var(--border); }
            
            @container (aspect-ratio > 1.2) {
                #tiempo-top { flex-direction: row; justify-content: space-around; padding: 10px; }
                #weather-city { position: absolute; top: 10px; left: 10px; text-align: left; width: auto; }
            }
        </style>
        
        <div id="tiempo-wrapper">
            <div id="tiempo-top">
                <div id="weather-city"><i class="fa-solid fa-location-dot"></i> DETECTANDO...</div>
                <div id="weather-icon"><i class="fa-solid fa-spinner fa-spin" style="color:#f59e0b;"></i></div>
                <div id="weather-temp" class="val-text">--°</div>
            </div>
            <div id="weekly-forecast"></div>
        </div>
    `,
    
    onInit: (core) => {
        window.fetchWeather = async (lat, lon, name) => {
            window.lastCoords = { lat, lon }; 
            const urlDirecta = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
            
            document.getElementById('weather-city').innerText = name;

            const pintarClima = (d) => {
                if(!d.current_weather) return;
                document.getElementById('weather-temp').innerText = `${Math.round(d.current_weather.temperature)}°`;
                const { icon, color } = getWeatherIcon(d.current_weather.weathercode);
                const iconDiv = document.getElementById('weather-icon');
                iconDiv.innerHTML = `<i class="${icon}"></i>`; 
                iconDiv.style.color = color;
            };

            try {
                let res = await fetch(urlDirecta);
                if (!res.ok) throw new Error("Bloqueado");
                pintarClima(await res.json());
            } catch (e1) {
                document.getElementById('weather-city').innerText = "ERR. RED";
            }
        };

        let ciudadGuardada = localStorage.getItem('pico_tiempo_ciudad');
        if (ciudadGuardada) {
            TiempoCard.onData(ciudadGuardada);
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => window.fetchWeather(pos.coords.latitude, pos.coords.longitude, "UBICACIÓN"),
                (err) => window.fetchWeather(42.431, -8.644, "PONTEVEDRA")
            );
        } else {
            window.fetchWeather(42.431, -8.644, "PONTEVEDRA");
        }
    },
    
    onData: (val) => {
        if (typeof val === 'string' && val.trim() !== "" && val !== "get") {
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${val}&count=1`)
                .then(r => r.json())
                .then(d => {
                    if(d.results && d.results.length > 0) {
                        const res = d.results[0];
                        window.fetchWeather(res.latitude, res.longitude, res.name);
                    }
                });
        }
    },

    abrirAjustes: (core) => {
        let ciudadActual = document.getElementById('weather-city').innerText;
        if (ciudadActual === "DETECTANDO..." || ciudadActual === "UBICACIÓN" || ciudadActual === "ERR. RED") ciudadActual = "";
        
        let nuevaCiudad = prompt("Escribe una ciudad (déjalo en blanco para GPS):", ciudadActual);
        if (nuevaCiudad !== null) { 
            if (nuevaCiudad.trim() === "") {
                localStorage.removeItem('pico_tiempo_ciudad');
                core.notificar("Restaurando GPS...", "🛰️");
                TiempoCard.onInit(core); 
            } else {
                localStorage.setItem('pico_tiempo_ciudad', nuevaCiudad);
                TiempoCard.onData(nuevaCiudad); 
                core.notificar(`Buscando clima...`, "🔎");
            }
        }
    }
};

function getWeatherIcon(code) {
    if (code === 0) return { icon: "fa-solid fa-sun", color: "#f59e0b" };
    if (code >= 1 && code <= 3) return { icon: "fa-solid fa-cloud-sun", color: "#a8a29e" };
    if (code >= 45 && code <= 48) return { icon: "fa-solid fa-smog", color: "#78716c" };
    if (code >= 51 && code <= 67) return { icon: "fa-solid fa-cloud-rain", color: "#3b82f6" };
    if (code >= 71 && code <= 77) return { icon: "fa-regular fa-snowflake", color: "#0ea5e9" };
    if (code >= 80 && code <= 82) return { icon: "fa-solid fa-cloud-showers-heavy", color: "#2563eb" };
    if (code >= 95 && code <= 99) return { icon: "fa-solid fa-bolt", color: "#8b5cf6" };
    return { icon: "fa-solid fa-circle-question", color: "#9ca3af" };
}
