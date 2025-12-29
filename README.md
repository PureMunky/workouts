# Daily Workout Randomizer Widget

A React widget that generates randomized daily workouts based on best fitness practices and weather conditions. Compatible with micro-frontend dashboards using Module Federation.

## Features

- **Smart Workout Generation**: Uses seeded randomization to ensure consistent workouts for each date
- **Best Practice Rules**:
  - No high-intensity strength training on consecutive days
  - Same workout never repeats two days in a row
  - Sundays are recovery days (yoga or table tennis)
  - Recovery activities often paired with intense workouts
  - Workouts adapt based on previous day's activity
- **Weather Integration**: Fetches 7-day weather forecast to recommend outdoor vs indoor running
- **Weekly Preview**: Shows upcoming workouts for the next 6 days
- **Seasonal Workouts**: Swimming only available during summer months (June-August)
- **Standalone & Embeddable**: Works both as a standalone app and as a micro-frontend widget

## Workout Types

### High-Intensity Activities
- 🏃 **Run** - Cardio (legs)
- 🏊 **Swim** - Full-body cardio (summer only)
- 🏋️ **Lift Weights** - Full-body strength training
- 🥊 **Punching Bag** - Arms and cardio

### Recovery Activities
- 🧘 **Yoga** - Flexibility and recovery
- 🏓 **Table Tennis** - Light cardio and coordination

## Development

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development Mode

Run the widget in standalone mode:

```bash
npm run dev
```

Visit http://localhost:5173 to see the widget.

### Build

Build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, including:
- `dist/assets/remoteEntry.js` - Module Federation entry point
- `dist/index.html` - Standalone application

### Preview Build

Preview the production build locally:

```bash
npm run preview
```

## Deployment

### GitHub Pages

This widget is configured for automatic deployment to GitHub Pages via GitHub Actions.

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Set Source to: **GitHub Actions**

2. **Deploy**:
   - Push to the `main` branch
   - GitHub Actions will automatically build and deploy
   - Widget will be available at: `https://USERNAME.github.io/workouts/`

## Dashboard Integration

### Adding to Micro-Frontend Dashboard

Once deployed, add the widget to your dashboard configuration:

```json
{
  "id": "workouts",
  "name": "Daily Workout",
  "url": "https://USERNAME.github.io/workouts",
  "scope": "workoutsWidget",
  "module": "./Widget",
  "props": {}
}
```

**Configuration Details:**
- `scope`: Must be `"workoutsWidget"` (matches `vite.config.js`)
- `module`: Must be `"./Widget"`
- `url`: Your GitHub Pages URL (without trailing slash)
- `props`: Optional properties to pass to the widget

## Weather Settings

### Setting Your Location

1. Click the ⚙️ settings icon
2. Enter your city name (e.g., "London", "New York", "Tokyo")
3. Click "Save Location"
4. Weather forecasts will be fetched for the next 7 days

**Note**: Uses the free Open-Meteo API - no API key required!

### Weather-Based Recommendations

When running is scheduled, the widget will check weather conditions:

**Good for Outdoor Running** 🌤️:
- Temperature between 25°F and 95°F
- No rain or snow
- Wind speed under 25 mph

**Consider Treadmill** ⚠️:
- Temperature too extreme
- Rain or snow expected
- High winds

## Technical Details

### Module Federation

- **Name**: `workoutsWidget`
- **Exposed Module**: `./Widget` (from `src/Widget.jsx`)
- **Shared Dependencies**: React 18.3.1 (singleton)
- **Base Path**: `/workouts/` (matches GitHub repository name)

### File Structure

```
workouts/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── src/
│   ├── Widget.jsx              # Main widget (exposed via Module Federation)
│   ├── Widget.css              # Scoped widget styles
│   ├── App.jsx                 # Standalone wrapper for development
│   ├── App.css                 # Standalone app styles
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html                  # HTML template
├── vite.config.js              # Vite + Module Federation config
├── package.json                # Dependencies
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

### Storage

The widget uses `localStorage` to persist:
- `workoutsWidget:weatherLocation` - User's city name
- `workoutsWidget:weatherLat` - Latitude for weather API
- `workoutsWidget:weatherLon` - Longitude for weather API

All storage keys are prefixed with `workoutsWidget:` to avoid conflicts.

### CSS Scoping

All CSS classes are prefixed with `workouts-widget-` to prevent style conflicts when embedded in dashboards.

## API Usage

### Open-Meteo APIs

The widget uses two free Open-Meteo APIs:

1. **Geocoding API**: Converts city names to coordinates
   - Endpoint: `https://geocoding-api.open-meteo.com/v1/search`
   - No API key required

2. **Weather Forecast API**: Fetches 7-day weather forecast
   - Endpoint: `https://api.open-meteo.com/v1/forecast`
   - Returns: temperature, precipitation, snowfall, wind speed
   - No API key required

## Browser Support

- Modern browsers with ES6+ support
- Tested on Chrome, Firefox, Safari, Edge

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Credits

Created by [Your Name]

Weather data provided by [Open-Meteo](https://open-meteo.com/)
