// Display the workout with weather info
async function displayWorkout(date) {
    // Get previous day's workout for best practices
    const previousDate = new Date(date);
    previousDate.setDate(date.getDate() - 1);
    const previousWorkout = generateWorkout(previousDate);

    const workout = generateWorkout(date, previousWorkout);

    // Update date display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = date.toLocaleDateString('en-US', options);

    // Update activities display
    const activitiesDiv = document.getElementById('activities');
    activitiesDiv.innerHTML = workout.map(activity =>
        `<div class="activity">${activity.name}</div>`
    ).join('');

    // Update icon (use first activity's icon)
    document.getElementById('activityIcon').textContent = workout[0].icon;

    // Add weather recommendation for running
    const weatherIndicator = document.getElementById('weatherIndicator');
    if (workout.some(w => w.key === 'run')) {
        const dateKey = date.toISOString().split('T')[0];
        const forecast = weatherCache[dateKey];
        const weather = isGoodRunningWeather(forecast);

        if (weather) {
            const weatherClass = weather.good ? 'weather-good' : 'weather-bad';
            const recommendation = weather.good ? '🌤️ Good for outdoor running!' : `⚠️ Consider treadmill: ${weather.reason}`;
            weatherIndicator.innerHTML = `<div class="weather-indicator ${weatherClass}">${recommendation}</div>`;
        } else {
            weatherIndicator.innerHTML = '';
        }
    } else {
        weatherIndicator.innerHTML = '';
    }

    // Display upcoming workouts
    displayUpcomingWorkouts(date);
}

// Display upcoming workouts for the next 6 days with weather
async function displayUpcomingWorkouts(currentDate) {
    const previewList = document.getElementById('previewList');
    const previewHTML = [];

    // Track previous workout for proper sequencing
    let previousWorkout = generateWorkout(currentDate);

    for (let i = 1; i <= 6; i++) {
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + i);

        // Generate workout considering previous day
        const workout = generateWorkout(futureDate, previousWorkout);
        previousWorkout = workout; // Update for next iteration

        const dateStr = futureDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        const activitiesHTML = workout.map(activity =>
            `<div class="preview-activity-row">
                <span class="preview-icon">${activity.icon}</span>
                <span class="preview-activity">${activity.name}</span>
            </div>`
        ).join('');

        // Add weather info for running days
        let weatherHTML = '';
        if (workout.some(w => w.key === 'run')) {
            const dateKey = futureDate.toISOString().split('T')[0];
            const forecast = weatherCache[dateKey];
            const weather = isGoodRunningWeather(forecast);

            if (weather) {
                const weatherClass = weather.good ? 'good' : 'bad';
                const weatherText = weather.good ? '✓ Outdoor' : '⚠ Treadmill';
                weatherHTML = `<div class="preview-weather ${weatherClass}">${weatherText}</div>`;
            }
        }

        previewHTML.push(`
            <div class="preview-item">
                <div class="preview-date">${dateStr}${weatherHTML}</div>
                <div class="preview-activities">
                    ${activitiesHTML}
                </div>
            </div>
        `);
    }

    previewList.innerHTML = previewHTML.join('');
}

// Show workout for a different date
async function showDifferentDate() {
    const dateStr = prompt('Enter a date (YYYY-MM-DD):');
    if (dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        if (!isNaN(date.getTime())) {
            await displayWorkout(date);
        } else {
            alert('Invalid date format. Please use YYYY-MM-DD');
        }
    }
}

// Toggle settings panel visibility
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// Initialize the app
async function initializeApp() {
    loadWeatherSettings();

    // Fetch weather data
    const forecast = await getWeatherForecast();
    if (forecast) {
        weatherCache = forecast;
    }

    // Display today's workout
    await displayWorkout(new Date());
}

// Initialize when DOM is ready
initializeApp();
