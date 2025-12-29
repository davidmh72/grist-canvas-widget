import React, { useState, useEffect } from 'react';

// --- CONFIGURATION ---
const WIDGET_VERSION = "v2.0";

// --- INITIALIZATION ---
// Log the widget version to the console for easier debugging.
// This runs only once when the component is first mounted.
console.log(`Grist Canvas Widget ${WIDGET_VERSION} loaded.`);

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 20 }}>CRASH: {this.state.error?.toString()}</div>;
    }
    return this.props.children;
  }
}

// --- MAIN COMPONENT ---
function Dashboard() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Initializing...");
  const grist = window.grist;

  useEffect(() => {
    if (!grist) {
      setStatus("Error: Grist API not found.");
      return;
    }

    // Announce that the widget is ready
    grist.ready();

    // Listen for records from the linked table
    grist.onRecords((records) => {
      // Diagnostic log: show the raw data received from Grist.
      console.log("Received records from Grist:", records);

      if (!records || records.length === 0) {
        setStatus("No configuration found. Please link to the SysDashboard_Config table.");
        setItems([]);
        return;
      }
      setItems(records);
      setStatus(null); // Clear status once we have data
    });
  }, [grist]);

  if (status) {
    return <div className="status-message">{status}</div>;
  }

  return (
    <div className="dashboard-canvas">
      {items.map(item => (
        <div
          key={item.id}
          className="dashboard-item"
          style={{
            position: 'absolute',
            left: `${item.X}px`,
            top: `${item.Y}px`,
            width: `${item.W}px`,
            height: `${item.H}px`,
          }}
        >
          {item.Label}
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

export default App;