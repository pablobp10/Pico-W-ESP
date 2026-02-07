 export const TiempoCard = {
    id: "Weather",
    html: `
        <i class="fa-solid fa-sun icon" style="font-size:3rem; color:#f59e0b" id="weather-icon"></i>
        <div id="weather-temp" class="val-text">--°</div>
        <div class="label">PONTEVEDRA</div>
    `,
    onInit: () => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=42.43&longitude=-8.64&current_weather=true`)
            .then(r=>r.json()).then(d=>{ document.getElementById('weather-temp').innerText = d.current_weather.temperature + "°"; });
    }
};

