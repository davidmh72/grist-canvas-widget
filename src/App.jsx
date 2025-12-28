import React, { useState, useEffect, useMemo } from 'react';

// --- CONFIGURATION ---
const WIDGET_VERSION = "v13.0 - CSS Grid (Clean)";
const TABLE_ID = 'SysDashboard_Config'; 

// --- ERROR BOUNDARY ---
// This prevents the "White Screen of Death" by catching React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Widget Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', border: '2px solid red', background: '#fff0f0' }}>
          <h3>⚠️ Widget Crashed</h3>
          <p>{this.state.error && this.state.error.toString()}</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children; 
  }
}

// --- MAIN DASHBOARD COMPONENT ---
function Dashboard() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Initializing connection...");
  const grist = window.grist;

  // 1. GRIST DATA CONNECTION
   useEffect(() => {
    if (!grist) {
      setStatus("Error: Grist API global not found.");
      return;
    }

    try {
      grist.ready({
        columns: [
          { name: 'Label', title: 'Label', type: 'Text'},
          { name: 'Link', title: 'Link URL', type: 'Text'},
          { name: 'X', title: 'X Pos', type: 'Numeric'},
          { name: 'Y', title: 'Y Pos', type: 'Numeric'},
          { name: 'W', title: 'Width', type: 'Numeric'},
          { name: 'H', title: 'Height', type: 'Numeric'},
          { name: 'Color', title: 'Color', type: 'Text', optional: true}
        ],
        // --------------------------------------------------------
        // FIX: Change 'read' to 'read table' or 'full'
        // --------------------------------------------------------
        requiredAccess: 'read table' 
      });

      grist.onRecords((records) => {
        if (!records || records.length === 0) {
          setStatus("Connected: 0 records found.");
          setItems([]);
          return;
        }

        const mappedData = records.map(rec => ({
          id: rec.id,
          // CSS Grid lines start at 1, but Grist often uses 0-based. 
          // We add 1 to ensure it sits inside the grid correctly.
          x: (Math.round(Number(rec.X)) || 0) + 1,
          y: (Math.round(Number(rec.Y)) || 0) + 1,
          w: Math.round(Number(rec.W)) || 2,
          h: Math.round(Number(rec.H)) || 1,
          label: rec.Label || "Untitled",
          linkUrl: rec.Link,
          color: rec.Color || '#ffffff'
        }));

        setItems(mappedData);
        setStatus(null); // Clear status means success
      });
    } catch (err) {
      setStatus(`Grist Init Error: ${err.message}`);
    }
  }, []);

  // 2. NAVIGATION HANDLER
  const handleNavigate = (url) => {
    if (!url) return;

    // CHECK: Are we on the same domain? (We should be now!)
    if (window.top.location.origin === window.location.origin) {
       console.log("⚡ Instant Navigation");
       
       // 1. Update the Browser URL silently
       window.top.history.pushState(null, '', url);
       
       // 2. Tell Grist to wake up and handle the change
       // Grist listens for 'popstate' to switch pages internally
       window.top.dispatchEvent(new PopStateEvent('popstate'));
       return;
    }

    // Fallback: Full Page Reload (Slow)
    console.log("🐢 Slow Navigation (Cross-Origin)");
    window.top.location.href = url;
  };

  if (status) {
    return <div style={{ padding: 20, color: '#555' }}>{status}</div>;
  }

  return (
    <div className="dashboard-container">
      {/* 
         12 Column Grid 
         We use minmax(0, 1fr) to prevent content from blowing out the grid cells
      */}
      <div className="grid-canvas">
        {items.map(item => (
          <div 
            key={item.id}
            className="grid-item"
            style={{
              gridColumnStart: item.x,
              gridColumnEnd: `span ${item.w}`,
              gridRowStart: item.y,
              gridRowEnd: `span ${item.h}`,
              backgroundColor: item.color
            }}
            onClick={() => item.linkUrl && handleNavigate(item.linkUrl)}
          >
             <div className="item-content">
                <span className="label">{item.label}</span>
                {item.linkUrl && <span className="link-icon">↗</span>}
             </div>
          </div>
        ))}
      </div>

      <div className="version-tag">{WIDGET_VERSION}</div>

      <style>{`
        /* RESET */
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

        /* LAYOUT */
        .dashboard-container {
            width: 100vw;
            min-height: 100vh;
            padding: 10px;
            background-color: #f0f2f5;
        }

        .grid-canvas {
            display: grid;
            /* 12 Columns, flexible width */
            grid-template-columns: repeat(12, minmax(0, 1fr));
            /* Auto rows, fixed height of 50px per unit (adjust as needed) */
            grid-auto-rows: 50px; 
            gap: 10px;
            width: 100%;
        }

        /* ITEMS */
        .grid-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.1s, box-shadow 0.1s;
            overflow: hidden;
            position: relative;
        }

        .grid-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            border-color: #bbb;
            z-index: 2;
        }

        .item-content {
            padding: 8px;
            text-align: center;
            width: 100%;
            font-weight: 500;
            color: #333;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 6px;
        }

        .link-icon {
            font-size: 10px;
            color: #999;
        }

        .version-tag {
            position: fixed; 
            bottom: 5px; right: 5px; 
            background: rgba(0,0,0,0.7); 
            color: lime; 
            padding: 2px 6px; 
            font-size: 10px; 
            border-radius: 4px;
            pointer-events: none;
        }
      `}</style>
    </div>
  );
}

// --- APP ENTRY POINT ---
export default function App() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}