// Weather-related variables
let weatherCache = {};

// Load weather settings from localStorage
function loadWeatherSettings() {
    const location = localStorage.getItem('weatherLocation');
    const lat = localStorage.getItem('weatherLat');
    const lon = localStorage.getItem('weatherLon');

    if (location) document.getElementById('locationInput').value = location;

    if (!location || !lat || !lon) {
        document.getElementById('setupNotice').style.display = 'block';
    }

    return { location, lat, lon };
}

// Geocode city name to coordinates using Open-Meteo
async function geocodeCity(cityName) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
        );

        if (!response.ok) {
            console.error('Geocoding API error:', response.status);
            return null;
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                lat: result.latitude,
                lon: result.longitude,
                name: result.name,
                country: result.country
            };
        }

        return null;
    } catch (error) {
        console.error('Error geocoding city:', error);
        return null;
    }
}

// Save weather settings
async function saveWeatherSettings() {
    const location = document.getElementById('locationInput').value.trim();

    if (!location) {
        alert('Please enter a city name');
        return;
    }

    // Geocode the city
    const coords = await geocodeCity(location);
    if (!coords) {
        alert('Could not find that city. Please try another name or be more specific.');
        return;
    }

    localStorage.setItem('weatherLocation', location);
    localStorage.setItem('weatherLat', coords.lat);
    localStorage.setItem('weatherLon', coords.lon);
    document.getElementById('setupNotice').style.display = 'none';

    alert(`Location set to ${coords.name}, ${coords.country}. Refreshing...`);
    window.location.reload();
}

// Clear weather settings
function clearWeatherSettings() {
    localStorage.removeItem('weatherLocation');
    localStorage.removeItem('weatherLat');
    localStorage.removeItem('weatherLon');
    document.getElementById('locationInput').value = '';
    document.getElementById('setupNotice').style.display = 'block';
    weatherCache = {};
    window.location.reload();
}

// Fetch weather forecast using Open-Meteo
async function getWeatherForecast() {
    const { lat, lon } = loadWeatherSettings();

    if (!lat || !lon) return null;

    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,windspeed_10m_max&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`
        );

        if (!response.ok) {
            console.error('Weather API error:', response.status);
            return null;
        }

        const data = await response.json();

        // Process forecast data into daily summaries
        const dailyForecasts = {};

        data.daily.time.forEach((date, index) => {
            const tempMax = data.daily.temperature_2m_max[index];
            const tempMin = data.daily.temperature_2m_min[index];
            const precipitation = data.daily.precipitation_sum[index];
            const snowfall = data.daily.snowfall_sum[index];
            const windMax = data.daily.windspeed_10m_max[index];

            dailyForecasts[date] = {
                temps: [(tempMax + tempMin) / 2], // Use average temp
                tempMax: tempMax,
                tempMin: tempMin,
                rain: precipitation > 0.1, // More than 0.1 inches
                snow: snowfall > 0.1,
                wind: [windMax]
            };
        });

        return dailyForecasts;
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

// Determine if weather is good for outdoor running
function isGoodRunningWeather(forecast) {
    if (!forecast) return null;

    const avgTemp = forecast.temps.reduce((a, b) => a + b, 0) / forecast.temps.length;
    const maxWind = Math.max(...forecast.wind);

    // Bad conditions: too cold (<25°F), too hot (>95°F), heavy rain/snow, high wind (>25mph)
    if (avgTemp < 25 || avgTemp > 95) return { good: false, reason: `${Math.round(avgTemp)}°F - too extreme` };
    if (forecast.snow) return { good: false, reason: 'Snow expected' };
    if (forecast.rain) return { good: false, reason: 'Rain expected' };
    if (maxWind > 25) return { good: false, reason: `High winds ${Math.round(maxWind)}mph` };

    return { good: true, reason: `${Math.round(avgTemp)}°F - good conditions` };
}
