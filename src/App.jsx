import Widget from './Widget';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Daily Workout Randomizer</h1>
        <p>Standalone Mode - Development Preview</p>
      </header>

      <main className="app-main">
        <div className="widget-preview">
          <Widget />
        </div>
      </main>

      <footer className="app-footer">
        <p>This widget can be embedded in the micro-frontend dashboard</p>
      </footer>
    </div>
  );
}

export default App;
