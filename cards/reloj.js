export const RelojCard = {
    id: "Clock",
    size: "tall", // 1 Ancho x 2 Alto
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%">
            <div style="text-align:center; padding-bottom:5px; border-bottom:1px solid var(--border)">
                <i class="fa-solid fa-earth-americas icon" style="font-size:1.5rem; margin:0; color:#6366f1"></i>
            </div>
            
            <div class="clock-vertical-container">
                <div class="clock-city-block">
                    <div class="clock-city-name" style="color:#ef4444">Madrid</div>
                    <div id="clock-mad" class="clock-city-time">--:--</div>
                </div>

                <div class="clock-city-block">
                    <div class="clock-city-name" style="color:#3b82f6">Londres</div>
                    <div id="clock-lon" class="clock-city-time">--:--</div>
                </div>

                <div class="clock-city-block">
                    <div class="clock-city-name" style="color:#22c55e">New York</div>
                    <div id="clock-nyc" class="clock-city-time">--:--</div>
                </div>
            </div>
        </div>
    `,
    onInit: () => {
        const update = () => {
            const now = new Date();
            const opt = {hour:'2-digit', minute:'2-digit'};
            document.getElementById('clock-mad').innerText = now.toLocaleTimeString('es-ES', {...opt});
            document.getElementById('clock-lon').innerText = now.toLocaleTimeString('en-GB', {...opt, timeZone:'Europe/London'});
            document.getElementById('clock-nyc').innerText = now.toLocaleTimeString('en-US', {...opt, timeZone:'America/New_York'});
        };
        setInterval(update, 1000);
        update(); // Ejecutar ya para no esperar 1seg
    }
};
