export const TiempoCard = {
    id: "Tiempo",
    category: "info",
    defaultSize: "1x1",
    customAccion: {
        titulo: "Pronóstico Semanal",
        icono: "fa-solid fa-calendar-week",
        color: "#f59e0b",
        ejecutar: (core) => {
            const card = document.getElementById('card-Tiempo');
            const weeklyDiv = document.getElementById('weekly-forecast');
            
            if (card.classList.contains('modo-semana')) {
                card.classList.remove('modo-semana');
                card.style.gridRowEnd = ""; // Vuelve a su alto original
                weeklyDiv.classList.remove('active');
            } else {
                card.classList.add('modo-semana');
                card.style.gridRowEnd = "span 2"; // Crece hacia abajo
                weeklyDiv.classList.add('active');
                
                if (window.lastCoords) {
                    const url = `https://api.open-meteo.com/v1/forecast?latitude=${window.lastCoords.lat}&longitude=${window.lastCoords.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
                    fetch(url).then(r => r.json()).then(d => {
                        let html = '';
                        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                        for(let i=1; i<6; i++) { // Próximos 5 días
                            const date = new Date(d.daily.time[i]);
                            const tMax = Math.round(d.daily.temperature_2m_max[i]);
                            const tMin = Math.round(d.daily.temperature_2m_min[i]);
                            const icon = getWeatherIcon(d.daily.weathercode[i]);
                            html += `
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid var(--border);">
                                    <span style="width:30px; font-weight:bold; color:var(--text-sec)">${dias[date.getDay()]}</span>
                                    <i class="${icon.icon}" style="color:${icon.color}; font-size:1.2rem;"></i>
                                    <span style="font-weight:bold; color:var(--text-main)">${tMax}° <span style="color:var(--text-sec); font-weight:normal">${tMin}°</span></span>
                                </div>
                            `;
                        }
                        weeklyDiv.innerHTML = html;
                    });
                }
            }
        }
    },
    html: `
        <style>
            #tiempo-wrapper {
                display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; 
                height: 100%; width: 100%; box-sizing: border-box; padding: 10px;
            }
            #tiempo-top {
                display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; width: 100%; height: 100%;
            }
            #weather-city { 
                font-size: clamp(0.7rem, 15cqmin, 1.2rem); /* Aumentado para 1x1 */
                font-weight: 700; color: var(--text-sec); 
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
                text-align: center; margin-bottom: 2px;
            }
            #weather-icon { 
                font-size: clamp(2rem, 35cqmin, 5rem); 
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); 
                display: flex; align-items: center; justify-content: center;
            }
            #weather-temp { 
                font-size: clamp(1.5rem, 30cqmin, 4.5rem); 
                font-weight: 800; line-height: 1; margin: 0;
            }
            
            #weekly-forecast { display: none; width: 100%; padding: 0 10px; flex-grow: 1; flex-direction: column; justify-content: space-evenly; font-size: 0.9rem;}
            #weekly-forecast.active { display: flex; }
            #card-Tiempo.modo-semana #tiempo-top { height: auto; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
            
            @container (aspect-ratio > 1.2) {
                #tiempo-top { flex-direction: row; justify-content: space-around; padding: 15px; }
                #weather-city { position: absolute; top: 10px; left: 15px; text-align: left; width: auto; }
                #weather-icon { margin: 0; }
            }
        </style>
        
        <div id="tiempo-wrapper">
            <div id="tiempo-top">
                <div id="weather-city"><i class="fa-solid fa-location-dot"></i> DETECTANDO...</div>
                <div id="weather-icon"><i class="fa-solid fa-spinner fa-spin" style="color:#f59e0b;"></i></div>
                <div id="weather-temp" class="val-text">--°</div>
            </div>
            <div id="weekly-forecast">Cargando pronóstico...</div>
        </div>
    `,
    
    onInit: (core) => {
        window.fetchWeather = async (lat, lon, name) => {
            window.lastCoords = { lat, lon }; // Guardamos para la gráfica semanal
            const urlDirecta = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
            const urlBypass = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlDirecta)}`;
            
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
                try {
                    let resBypass = await fetch(urlBypass);
                    pintarClima(await resBypass.json());
                } catch (e2) {
                    document.getElementById('weather-city').innerText = "ERROR API";
                }
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
        if (ciudadActual === "DETECTANDO..." || ciudadActual === "UBICACIÓN") ciudadActual = "";
        
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
