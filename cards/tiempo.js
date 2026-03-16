export const TiempoCard = {
    id: "Tiempo",
    category: "info",
    rol: "guest", // Ejemplo de uso del nuevo sistema modular
    defaultSize: "1x1", 
    customAccion: {
        titulo: "Pronóstico Semanal",
        icono: "fa-solid fa-calendar-week",
        color: "#f59e0b",
        ejecutar: (core) => {
            const card = document.getElementById('card-Tiempo');
            const weeklyDiv = document.getElementById('weekly-forecast');
            
            let savedSizes = JSON.parse(localStorage.getItem('pico_card_sizes')) || {};
            let currentSize = savedSizes['Tiempo'] || "1x1";
            
            if (currentSize === "2x3" && card.classList.contains('modo-semana')) {
                card.classList.remove('size-2x3');
                card.classList.add('size-1x1');
                savedSizes['Tiempo'] = '1x1';
                localStorage.setItem('pico_card_sizes', JSON.stringify(savedSizes));
                card.classList.remove('modo-semana');
                weeklyDiv.classList.remove('active');
            } else {
                card.classList.remove(`size-${currentSize}`);
                card.classList.add('size-2x3');
                savedSizes['Tiempo'] = '2x3';
                localStorage.setItem('pico_card_sizes', JSON.stringify(savedSizes));
                card.classList.add('modo-semana');
                weeklyDiv.classList.add('active');
                if (window.fetchWeeklyWeather) window.fetchWeeklyWeather();
            }
        }
    },
    html: `
        <style>
            #tiempo-wrapper { display: flex; flex-direction: column; justify-content: flex-start; align-items: center; height: 100%; width: 100%; box-sizing: border-box; padding: 6px; }
            #tiempo-top { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; gap: 0; }
            #weather-city { font-size: clamp(0.6rem, 12cqmin, 0.9rem); font-weight: 800; color: var(--text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center; margin: 0 0 auto 0; width: 100%; transform: translateY(-5px); }
            #weather-icon { font-size: clamp(2.25rem, 30cqmin, 3.6rem); display: flex; align-items: center; justify-content: center; margin: auto 0; }
            #weather-temp { font-size: clamp(1.2rem, 22cqmin, 2.5rem); font-weight: 800; line-height: 1; margin: auto 0 2px 0; transform: translateY(5px); }
            #weekly-forecast { display: none !important; width: 100%; padding: 5px 10px; flex-grow: 1; flex-direction: column; justify-content: space-evenly; box-sizing:border-box;}
            #weekly-forecast.active { display: flex !important; }
            #card-Tiempo.modo-semana #tiempo-top { height: auto; padding-bottom: 5px; border-bottom: 1px solid var(--border); margin-bottom: 5px; }
            
            @container (aspect-ratio > 1.2) {
                #tiempo-top { flex-direction: row; justify-content: space-around; padding: 10px; }
                #weather-city { position: absolute; top: 10px; left: 10px; text-align: left; width: auto; margin:0; }
                #weather-icon { margin: 0; }
                #weather-temp { margin: 0; }
            }

            /* 🎨 CSS PARA ICONOS MULTICAPA Y NOCTURNOS */
            .w-sun { color: #facc15; filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.6)); animation: w-pulse 3s infinite alternate; }
            .w-moon { color: #e2e8f0; filter: drop-shadow(0 0 8px rgba(226, 232, 240, 0.5)); animation: w-pulse 4s infinite alternate; }
            .w-cloud { color: #e2e8f0; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.1)); }
            .w-cloud-dark { color: #64748b; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); }
            .w-cloud-night { color: #334155; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6)); }
            .w-rain { color: #38bdf8; animation: w-rain 1s infinite linear; }
            .w-snow { color: #bae6fd; animation: w-snow 3s infinite linear; }
            .w-bolt { color: #facc15; filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.8)); animation: w-flash 2s infinite; }

            @keyframes w-pulse { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
            @keyframes w-flash { 0%, 95%, 98% { opacity: 1; } 96%, 99% { opacity: 0; } }
            @keyframes w-rain { 0% { margin-top: -0.1em; opacity:0; } 50% { opacity:1; } 100% { margin-top: 0.2em; opacity:0; } }
            @keyframes w-snow { 0% { margin-top: -0.1em; opacity:0.8; } 100% { margin-top: 0.2em; opacity:0; } }
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
        window.fetchWeeklyWeather = () => {
            const weeklyDiv = document.getElementById('weekly-forecast');
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
                        // Para la semana forzamos que muestre iconos de Día (1)
                        const iconData = getWeatherIcon(d.daily.weathercode[i], 1);
                        html += `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:3px 0; border-bottom:1px solid var(--border);">
                                <span style="width:35px; font-weight:bold; color:var(--text-sec); font-size:0.8rem">${dias[date.getDay()]}</span>
                                <div style="font-size:1.4rem; display:flex; justify-content:center; align-items:center;">${iconData.html}</div>
                                <span style="font-weight:bold; color:var(--text-main); font-size:0.9rem">${tMax}° <span style="color:var(--text-sec); font-weight:normal">${tMin}°</span></span>
                            </div>
                        `;
                    }
                    weeklyDiv.innerHTML = html;
                }).catch(e => {
                    weeklyDiv.innerHTML = '<div style="text-align:center; color:#ff453a; font-size:0.8rem;">Error de red</div>';
                });
        };

        window.fetchWeather = async (lat, lon, name) => {
            window.lastCoords = { lat, lon }; 
            const urlDirecta = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
            
            document.getElementById('weather-city').innerText = name;

            const pintarClima = (d) => {
                if(!d.current_weather) return;
                document.getElementById('weather-temp').innerText = `${Math.round(d.current_weather.temperature)}°`;
                // Enviamos código + indicador de si es de día o de noche
                const iconData = getWeatherIcon(d.current_weather.weathercode, d.current_weather.is_day);
                document.getElementById('weather-icon').innerHTML = iconData.html;
            };

            try {
                let res = await fetch(urlDirecta);
                if (!res.ok) throw new Error("Bloqueado");
                pintarClima(await res.json());
            } catch (e1) {
                document.getElementById('weather-city').innerText = "ERR. RED";
            }

            let savedSizes = JSON.parse(localStorage.getItem('pico_card_sizes')) || {};
            if (savedSizes['Tiempo'] === '2x3') {
                const card = document.getElementById('card-Tiempo');
                const weeklyDiv = document.getElementById('weekly-forecast');
                if(card) card.classList.add('modo-semana');
                if(weeklyDiv) weeklyDiv.classList.add('active');
                window.fetchWeeklyWeather();
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

function getWeatherIcon(code, isDay = 1) {
    const baseStyle = "width:1em; height:1em; line-height:1em; display:inline-block;";
    const astroIcon = isDay ? `<i class="fa-solid fa-sun w-sun"></i>` : `<i class="fa-solid fa-moon w-moon"></i>`;
    const astroIconSmall = isDay ? `<i class="fa-solid fa-sun fa-stack-1x w-sun" style="transform: translate(0.3em, -0.3em) scale(0.7);"></i>` : `<i class="fa-solid fa-moon fa-stack-1x w-moon" style="transform: translate(0.3em, -0.3em) scale(0.7);"></i>`;
    const cloudType = isDay ? "w-cloud" : "w-cloud-night"; // Nubes más oscuras de noche
    
    if (code === 0 || code === 1) return { html: astroIcon };
    
    if (code >= 2 && code <= 3) return {
        html: `<span class="fa-stack" style="${baseStyle}">
                 ${astroIconSmall}
                 <i class="fa-solid fa-cloud fa-stack-1x ${cloudType}"></i>
               </span>`
    };
    if (code >= 45 && code <= 48) return {
        html: `<span class="fa-stack" style="${baseStyle}">
                 <i class="fa-solid fa-cloud fa-stack-1x w-cloud-dark" style="transform: translateY(-0.1em);"></i>
                 <i class="fa-solid fa-smog fa-stack-1x ${cloudType}" style="transform: translateY(0.2em); opacity:0.8;"></i>
               </span>`
    };
    if (code >= 51 && code <= 67) return {
        html: `<span class="fa-stack" style="${baseStyle}">
                 <i class="fa-solid fa-cloud fa-stack-1x w-cloud-dark"></i>
                 <i class="fa-solid fa-droplet fa-stack-1x w-rain" style="transform: translate(-0.2em, 0.3em) scale(0.4);"></i>
                 <i class="fa-solid fa-droplet fa-stack-1x w-rain" style="transform: translate(0.2em, 0.3em) scale(0.4); animation-delay:0.5s;"></i>
               </span>`
    };
    if (code >= 71 && code <= 77) return {
        html: `<span class="fa-stack" style="${baseStyle}">
                 <i class="fa-solid fa-cloud fa-stack-1x ${cloudType}"></i>
                 <i class="fa-regular fa-snowflake fa-stack-1x w-snow" style="transform: translate(-0.2em, 0.3em) scale(0.4);"></i>
                 <i class="fa-regular fa-snowflake fa-stack-1x w-snow" style="transform: translate(0.2em, 0.3em) scale(0.4); animation-delay:1.5s;"></i>
               </span>`
    };
    if (code >= 80 && code <= 82) return {
        html: `<span class="fa-stack" style="${baseStyle}">
                 <i class="fa-solid fa-cloud fa-stack-1x w-cloud-dark"></i>
                 <i class="fa-solid fa-cloud-showers-heavy fa-stack-1x w-rain" style="transform: translateY(0.1em) scale(0.8);"></i>
               </span>`
    };
    if (code >= 95 && code <= 99) return {
        html: `<span class="fa-stack" style="${baseStyle}">
                 <i class="fa-solid fa-cloud fa-stack-1x w-cloud-dark"></i>
                 <i class="fa-solid fa-bolt fa-stack-1x w-bolt" style="transform: translate(0.1em, 0.2em) scale(0.7);"></i>
               </span>`
    };
    
    return { html: `<i class="fa-solid fa-circle-question" style="color:#9ca3af;"></i>` };
}
