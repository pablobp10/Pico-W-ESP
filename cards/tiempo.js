export const TiempoCard = {
    id: "Tiempo",
    // Tamaño estándar 1x1
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; align-items:center; height:100%; width:100%;">
            
            <div id="weather-city" style="
                font-size: 0.75rem; 
                font-weight: 700; 
                color: var(--text-sec); 
                text-transform: uppercase; 
                letter-spacing: 0.5px;
                margin-top: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
            ">
                <i class="fa-solid fa-location-dot"></i> DETECTANDO...
            </div>

            <div id="weather-icon" style="
                font-size: 3rem; 
                flex-grow: 1; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
            ">
                <i class="fa-solid fa-spinner fa-spin" style="color:#f59e0b; font-size:2rem"></i>
            </div>

            <div id="weather-temp" class="val-text" style="
                font-size: 2.2rem; 
                margin-bottom: 5px; 
                line-height: 1;
            ">--°</div>
        </div>
    `,
    onInit: () => {
        // Coordenadas por defecto: PONTEVEDRA
        const DEF_LAT = 42.431;
        const DEF_LON = -8.644;
        const DEF_NAME = "PONTEVEDRA";

        // Función principal que pide los datos
        const fetchWeather = (lat, lon, name) => {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
            
            // Actualizamos nombre ciudad inmediatamente
            document.getElementById('weather-city').innerText = name;

            fetch(url)
                .then(r => r.json())
                .then(d => {
                    if(!d.current_weather) return;
                    
                    const t = Math.round(d.current_weather.temperature);
                    const code = d.current_weather.weathercode;
                    
                    // Actualizar Temperatura
                    document.getElementById('weather-temp').innerText = `${t}°`;
                    
                    // Mapear Icono
                    const { icon, color } = getWeatherIcon(code);
                    
                    const iconDiv = document.getElementById('weather-icon');
                    iconDiv.innerHTML = `<i class="${icon}"></i>`;
                    iconDiv.style.color = color;
                })
                .catch(e => {
                    document.getElementById('weather-city').innerText = "ERROR API";
                });
        };

        // LÓGICA DE UBICACIÓN
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    // ÉXITO: Usamos coordenadas reales
                    fetchWeather(pos.coords.latitude, pos.coords.longitude, "UBICACIÓN");
                },
                (err) => {
                    // ERROR/DENEGADO: Usamos Pontevedra
                    console.log("GPS denegado, usando Pontevedra");
                    fetchWeather(DEF_LAT, DEF_LON, DEF_NAME);
                }
            );
        } else {
            // NO SOPORTADO: Usamos Pontevedra
            fetchWeather(DEF_LAT, DEF_LON, DEF_NAME);
        }
    }
};

// Función auxiliar (Solo devuelve Icono y Color, sin texto)
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
