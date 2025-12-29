import { useState, useEffect } from 'react';
import './Widget.css';

// Workout activities with metadata
const activities = {
  run: {
    name: 'Run',
    icon: '🏃',
    easy: false,
    type: 'cardio',
    intensity: 'high',
    muscleGroups: ['legs', 'cardio']
  },
  swim: {
    name: 'Swim',
    icon: '🏊',
    easy: false,
    seasonal: true,
    type: 'cardio',
    intensity: 'high',
    muscleGroups: ['fullbody', 'cardio']
  },
  weights: {
    name: 'Lift Weights',
    icon: '🏋️',
    easy: false,
    type: 'strength',
    intensity: 'high',
    muscleGroups: ['fullbody', 'strength']
  },
  bag: {
    name: 'Punching Bag',
    icon: '🥊',
    easy: false,
    type: 'cardio',
    intensity: 'high',
    muscleGroups: ['arms', 'cardio']
  },
  yoga: {
    name: 'Yoga',
    icon: '🧘',
    easy: true,
    type: 'recovery',
    intensity: 'low',
    muscleGroups: ['flexibility']
  },
  tabletennis: {
    name: 'Table Tennis',
    icon: '🏓',
    easy: true,
    type: 'cardio',
    intensity: 'low',
    muscleGroups: ['arms', 'cardio']
  }
};

// Simple seeded random number generator
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate a seed from a date
function dateSeed(date) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

// Check if it's summer (June, July, August)
function isSummer(date) {
  const month = date.getMonth();
  return month >= 5 && month <= 7;
}

// Get available activities for a given date
function getAvailableActivities(date) {
  const summer = isSummer(date);
  return Object.entries(activities).filter(([key, activity]) => {
    if (activity.seasonal) {
      return summer;
    }
    return true;
  });
}

// Check if activity is suitable after previous day's workout
function isActivitySuitable(activityKey, activity, previousWorkout) {
  if (!previousWorkout || previousWorkout.length === 0) return true;

  const prevPrimary = previousWorkout[0];

  if (activity.type === 'strength' && activity.intensity === 'high' &&
      prevPrimary.type === 'strength' && prevPrimary.intensity === 'high') {
    return false;
  }

  if (activityKey === prevPrimary.key) {
    return false;
  }

  if (activityKey === 'run' && prevPrimary.key === 'run') {
    return false;
  }

  return true;
}

// Generate workout for a specific date with best practices
function generateWorkout(date, previousWorkout = null) {
  const availableActivities = getAvailableActivities(date);
  const seed = dateSeed(date);

  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);
  const rand3 = seededRandom(seed + 2);

  let suitableActivities = availableActivities.filter(([key, activity]) =>
    isActivitySuitable(key, activity, previousWorkout)
  );

  if (suitableActivities.length === 0) {
    suitableActivities = availableActivities;
  }

  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) {
    const recoveryActivities = suitableActivities.filter(([key, act]) =>
      act.intensity === 'low'
    );
    if (recoveryActivities.length > 0) {
      suitableActivities = recoveryActivities;
    }
  }

  const primaryIndex = Math.floor(rand1 * suitableActivities.length);
  const [primaryKey, primaryActivity] = suitableActivities[primaryIndex];

  const selectedActivities = [{ key: primaryKey, ...primaryActivity }];

  const secondaryChance = primaryActivity.intensity === 'high' ? 0.6 : 0.4;
  const addSecondary = rand3 > secondaryChance;

  if (addSecondary) {
    let secondaryOptions;

    if (primaryActivity.intensity === 'high') {
      secondaryOptions = availableActivities.filter(([key, act]) =>
        act.intensity === 'low' && key !== primaryKey
      );
    } else {
      secondaryOptions = availableActivities.filter(([key, act]) =>
        act.intensity === 'low' && key !== primaryKey
      );
    }

    if (secondaryOptions.length > 0) {
      const secondaryIndex = Math.floor(rand2 * secondaryOptions.length);
      const [secondaryKey, secondaryActivity] = secondaryOptions[secondaryIndex];
      selectedActivities.push({ key: secondaryKey, ...secondaryActivity });
    }
  }

  return selectedActivities;
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

// Fetch weather forecast using Open-Meteo
async function getWeatherForecast(lat, lon) {
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

    const dailyForecasts = {};

    data.daily.time.forEach((date, index) => {
      const tempMax = data.daily.temperature_2m_max[index];
      const tempMin = data.daily.temperature_2m_min[index];
      const precipitation = data.daily.precipitation_sum[index];
      const snowfall = data.daily.snowfall_sum[index];
      const windMax = data.daily.windspeed_10m_max[index];

      dailyForecasts[date] = {
        temps: [(tempMax + tempMin) / 2],
        tempMax: tempMax,
        tempMin: tempMin,
        rain: precipitation > 0.1,
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

  if (avgTemp < 25 || avgTemp > 95) return { good: false, reason: `${Math.round(avgTemp)}°F - too extreme` };
  if (forecast.snow) return { good: false, reason: 'Snow expected' };
  if (forecast.rain) return { good: false, reason: 'Rain expected' };
  if (maxWind > 25) return { good: false, reason: `High winds ${Math.round(maxWind)}mph` };

  return { good: true, reason: `${Math.round(avgTemp)}°F - good conditions` };
}

/**
 * Workout Widget Component
 * Exposed via Module Federation - loaded dynamically by dashboard
 */
export default function Widget(props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workout, setWorkout] = useState([]);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);
  const [weatherCache, setWeatherCache] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [location, setLocation] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [showSetupNotice, setShowSetupNotice] = useState(false);

  // Load weather settings from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem('workoutsWidget:weatherLocation');
    const savedLat = localStorage.getItem('workoutsWidget:weatherLat');
    const savedLon = localStorage.getItem('workoutsWidget:weatherLon');

    if (savedLocation) {
      setLocation(savedLocation);
      setLocationInput(savedLocation);
    }

    if (!savedLocation || !savedLat || !savedLon) {
      setShowSetupNotice(true);
    }

    // Fetch weather forecast
    if (savedLat && savedLon) {
      getWeatherForecast(savedLat, savedLon).then(forecast => {
        if (forecast) {
          setWeatherCache(forecast);
        }
      });
    }
  }, []);

  // Generate workouts when date or weather changes
  useEffect(() => {
    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    const previousWorkout = generateWorkout(previousDate);

    const todayWorkout = generateWorkout(currentDate, previousWorkout);
    setWorkout(todayWorkout);

    // Generate upcoming workouts
    const upcoming = [];
    let prevWorkout = todayWorkout;

    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + i);

      const futureWorkout = generateWorkout(futureDate, prevWorkout);
      prevWorkout = futureWorkout;

      upcoming.push({
        date: futureDate,
        workout: futureWorkout
      });
    }

    setUpcomingWorkouts(upcoming);
  }, [currentDate, weatherCache]);

  const handleSaveLocation = async () => {
    if (!locationInput.trim()) {
      alert('Please enter a city name');
      return;
    }

    const coords = await geocodeCity(locationInput);
    if (!coords) {
      alert('Could not find that city. Please try another name or be more specific.');
      return;
    }

    localStorage.setItem('workoutsWidget:weatherLocation', locationInput);
    localStorage.setItem('workoutsWidget:weatherLat', coords.lat);
    localStorage.setItem('workoutsWidget:weatherLon', coords.lon);

    setLocation(locationInput);
    setShowSetupNotice(false);

    // Fetch new weather forecast
    const forecast = await getWeatherForecast(coords.lat, coords.lon);
    if (forecast) {
      setWeatherCache(forecast);
    }

    alert(`Location set to ${coords.name}, ${coords.country}`);
  };

  const handleClearLocation = () => {
    localStorage.removeItem('workoutsWidget:weatherLocation');
    localStorage.removeItem('workoutsWidget:weatherLat');
    localStorage.removeItem('workoutsWidget:weatherLon');

    setLocation('');
    setLocationInput('');
    setShowSetupNotice(true);
    setWeatherCache({});
  };

  const handleDateChange = () => {
    const dateStr = prompt('Enter a date (YYYY-MM-DD):');
    if (dateStr) {
      const date = new Date(dateStr + 'T12:00:00');
      if (!isNaN(date.getTime())) {
        setCurrentDate(date);
      } else {
        alert('Invalid date format. Please use YYYY-MM-DD');
      }
    }
  };

  const handleRefresh = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatPreviewDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getWeatherForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return weatherCache[dateKey];
  };

  const renderWeatherIndicator = () => {
    if (!workout.some(w => w.key === 'run')) return null;

    const forecast = getWeatherForDate(currentDate);
    const weather = isGoodRunningWeather(forecast);

    if (!weather) return null;

    const weatherClass = weather.good ? 'weather-good' : 'weather-bad';
    const recommendation = weather.good ? '🌤️ Good for outdoor running!' : `⚠️ Consider treadmill: ${weather.reason}`;

    return <div className={`workouts-widget-weather-indicator ${weatherClass}`}>{recommendation}</div>;
  };

  return (
    <div className="workouts-widget">
      <button
        className="workouts-widget-settings-toggle"
        onClick={() => setShowSettings(!showSettings)}
        title="Settings"
      >
        ⚙️
      </button>

      <h1 className="workouts-widget-title">Daily Workout</h1>
      <div className="workouts-widget-date">{formatDate(currentDate)}</div>

      {showSetupNotice && (
        <div className="workouts-widget-setup-notice">
          To enable weather-based running recommendations, enter your city name below. No API key needed - using free Open-Meteo weather service!
        </div>
      )}

      <div className="workouts-widget-workout-display">
        <div className="workouts-widget-activity-icon">{workout[0]?.icon}</div>
        <div className="workouts-widget-activities">
          {workout.map((activity, index) => (
            <div key={index} className="workouts-widget-activity">{activity.name}</div>
          ))}
        </div>
        {renderWeatherIndicator()}
      </div>

      <div className="workouts-widget-preview-section">
        <h2 className="workouts-widget-preview-title">Coming Up This Week</h2>
        <div className="workouts-widget-preview-list">
          {upcomingWorkouts.map((item, index) => {
            const hasRun = item.workout.some(w => w.key === 'run');
            const forecast = getWeatherForDate(item.date);
            const weather = hasRun ? isGoodRunningWeather(forecast) : null;

            return (
              <div key={index} className="workouts-widget-preview-item">
                <div className="workouts-widget-preview-date">
                  {formatPreviewDate(item.date)}
                  {weather && (
                    <div className={`workouts-widget-preview-weather ${weather.good ? 'good' : 'bad'}`}>
                      {weather.good ? '✓ Outdoor' : '⚠ Treadmill'}
                    </div>
                  )}
                </div>
                <div className="workouts-widget-preview-activities">
                  {item.workout.map((activity, actIndex) => (
                    <div key={actIndex} className="workouts-widget-preview-activity-row">
                      <span className="workouts-widget-preview-icon">{activity.icon}</span>
                      <span className="workouts-widget-preview-activity">{activity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showSettings && (
        <div className="workouts-widget-settings-panel">
          <div className="workouts-widget-settings-section">
            <h3>Weather Settings</h3>
            <div className="workouts-widget-settings-row">
              <label>Your City:</label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="e.g., London, New York, Tokyo"
              />
            </div>
            <div className="workouts-widget-settings-row">
              <button onClick={handleSaveLocation}>Save Location</button>
              <button onClick={handleClearLocation}>Clear Location</button>
            </div>
          </div>

          <div className="workouts-widget-controls">
            <button onClick={handleDateChange}>Pick Different Date</button>
            <button onClick={handleRefresh}>Refresh</button>
          </div>

          <div className="workouts-widget-info">
            <strong>Workout Best Practices Applied:</strong><br />
            • No high-intensity strength training on consecutive days<br />
            • Same workout never repeats two days in a row<br />
            • Sundays are recovery days (yoga or table tennis)<br />
            • Recovery activities often paired with intense workouts<br />
            • Workouts adapt based on previous day's activity
          </div>
        </div>
      )}
    </div>
  );
}
