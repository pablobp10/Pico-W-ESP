export const TiempoCard = {
    id: "Tiempo",
    category: "info",
    
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; align-items:center; height:100%; width:100%;">
            <div id="weather-city" style="font-size: 0.75rem; font-weight: 700; color: var(--text-sec); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
                <i class="fa-solid fa-location-dot"></i> DETECTANDO...
            </div>
            <div id="weather-icon" style="font-size: 3rem; flex-grow: 1; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                <i class="fa-solid fa-spinner fa-spin" style="color:#f59e0b; font-size:2rem"></i>
            </div>
            <div id="weather-temp" class="val-text" style="font-size: 2.2rem; margin-bottom: 5px; line-height: 1;">--°</div>
        </div>
    `,
    onInit: (core) => {
        window.fetchWeather = async (lat, lon, name) => {
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
                if (!res.ok) throw new Error("Bloqueado por Firewall");
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

        // 🧠 Leemos la base de datos local para ver si el usuario forzó una ciudad
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
    
    // 🧠 LA MAGIA: Interceptamos si la IA (o el usuario) manda el nombre de una ciudad
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

    // ⚙️ AJUSTES PROPIOS DE LA TARJETA
    abrirAjustes: (core) => {
        let ciudadActual = document.getElementById('weather-city').innerText;
        if (ciudadActual === "DETECTANDO..." || ciudadActual === "UBICACIÓN") ciudadActual = "";
        
        let nuevaCiudad = prompt("Escribe una ciudad para forzar el clima (déjalo en blanco para usar GPS):", ciudadActual);
        
        if (nuevaCiudad !== null) { 
            if (nuevaCiudad.trim() === "") {
                // Borramos la ciudad y forzamos reinicio para que pille el GPS
                localStorage.removeItem('pico_tiempo_ciudad');
                core.notificar("Restaurando GPS...", "🛰️");
                TiempoCard.onInit(core); 
            } else {
                // Guardamos la nueva ciudad y la buscamos
                localStorage.setItem('pico_tiempo_ciudad', nuevaCiudad);
                TiempoCard.onData(nuevaCiudad); 
                core.notificar(`Buscando clima en ${nuevaCiudad}...`, "🔎");
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
