export const TiempoCard = {
    id: "Tiempo",
    // Tamaño estándar 1x1
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%">
            <div id="weather-icon" style="font-size:3.5rem; margin-bottom:10px; color:#f59e0b">
                <i class="fa-solid fa-spinner fa-spin"></i>
            </div>
            <div class="val-text" id="weather-temp" style="font-size:2.5rem; margin:0">--°</div>
            <div class="label" id="weather-desc" style="margin-top:5px; opacity:0.8">Cargando...</div>
            <div class="label" id="weather-loc" style="font-size:0.6rem; color:var(--text-sec); margin-top:10px">
                <i class="fa-solid fa-location-dot"></i> <span>Detectando...</span>
            </div>
        </div>
    `,
    onInit: () => {
        // Coordenadas por defecto: PONTEVEDRA
        const DEF_LAT = 42.431;
        const DEF_LON = -8.644;
        const DEF_NAME = "Pontevedra";

        // Función principal que pide los datos
        const fetchWeather = (lat, lon, name) => {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
            
            fetch(url)
                .then(r => r.json())
                .then(d => {
                    if(!d.current_weather) return;
                    
                    const t = Math.round(d.current_weather.temperature);
                    const code = d.current_weather.weathercode;
                    
                    // Actualizar textos
                    document.getElementById('weather-temp').innerText = `${t}°`;
                    document.getElementById('weather-loc').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${name}`;
                    
                    // Mapear código WMO a Iconos y Descripción
                    const { icon, desc, color } = getWeatherIcon(code);
                    
                    const iconDiv = document.getElementById('weather-icon');
                    iconDiv.innerHTML = `<i class="${icon}"></i>`;
                    iconDiv.style.color = color;
                    
                    document.getElementById('weather-desc').innerText = desc;
                })
                .catch(e => {
                    document.getElementById('weather-desc').innerText = "Error API";
                });
        };

        // LÓGICA DE UBICACIÓN
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // 1. ÉXITO (Permiso concedido)
                (pos) => {
                    fetchWeather(pos.coords.latitude, pos.coords.longitude, "Ubicación Actual");
                },
                // 2. ERROR o DENEGADO (Usar Pontevedra)
                (err) => {
                    console.log("GPS denegado, usando Pontevedra");
                    fetchWeather(DEF_LAT, DEF_LON, DEF_NAME);
                }
            );
        } else {
            // 3. Navegador no soporta GPS (Usar Pontevedra)
            fetchWeather(DEF_LAT, DEF_LON, DEF_NAME);
        }
    }
};

// Función auxiliar para traducir códigos del tiempo a iconos bonitos
function getWeatherIcon(code) {
    // Códigos WMO de Open-Meteo
    if (code === 0) return { icon: "fa-solid fa-sun", desc: "Despejado", color: "#f59e0b" };
    if (code >= 1 && code <= 3) return { icon: "fa-solid fa-cloud-sun", desc: "Nublado", color: "#a8a29e" };
    if (code >= 45 && code <= 48) return { icon: "fa-solid fa-smog", desc: "Niebla", color: "#78716c" };
    if (code >= 51 && code <= 67) return { icon: "fa-solid fa-cloud-rain", desc: "Lluvia", color: "#3b82f6" };
    if (code >= 71 && code <= 77) return { icon: "fa-regular fa-snowflake", desc: "Nieve", color: "#0ea5e9" };
    if (code >= 80 && code <= 82) return { icon: "fa-solid fa-cloud-showers-heavy", desc: "Lluvia Fuerte", color: "#2563eb" };
    if (code >= 95 && code <= 99) return { icon: "fa-solid fa-bolt", desc: "Tormenta", color: "#8b5cf6" };
    
    return { icon: "fa-solid fa-circle-question", desc: "Desc", color: "#9ca3af" };
}
