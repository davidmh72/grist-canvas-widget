import React, { useState, useEffect } from 'react';

// --- CONFIGURATION ---
const WIDGET_VERSION = "v2.3";

// --- INITIALIZATION ---
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

    grist.ready({
      // Tell Grist which columns we need. This ensures the widget receives
      // the correct data regardless of which table is currently active.
      columns: ['X', 'Y', 'W', 'H', 'Label', 'Link', 'Color', 'Type', 'Pages'],
      requiredAccess: 'full'
    });

    grist.onRecords((records) => {
      console.log("Received records from Grist:", records);

      if (!records || records.length === 0) {
        setStatus("No configuration found. Please link to the SysDashboard_Config table.");
        setItems([]);
        return;
      }

      // Restore the original data mapping logic.
      // This converts Grist columns into properties used for rendering.
      const mappedData = records.map(rec => ({
        id: rec.id,
        x: (Math.round(Number(rec.X)) || 0) + 1,
        y: (Math.round(Number(rec.Y)) || 0) + 1,
        w: Math.round(Number(rec.W)) || 2,
        h: Math.round(Number(rec.H)) || 1,
        label: rec.Label || '',
        link: rec.Link || '',
        color: rec.Color || 'var(--color-cell-fg, #3d3d3d)',
        bgColor: rec.Color ? 'rgba(255,255,255,0.05)' : 'var(--color-cell-bg, white)',
        // Add the new fields for the Menu element
        type: rec.Type,
        pages: rec.Pages,
      }));

      setItems(mappedData);
      setStatus(null);
    });
  }, [grist]);

  if (status) {
    return <div className="status-message">{status}</div>;
  }

  // Restore the original rendering logic with <a> tags and grid-based positioning.
  return (
    <div className="dashboard-canvas">
      {items.map(item => (
        <Element key={item.id} item={item} />
      ))}
    </div>
  );
}

// --- ELEMENT DISPATCHER ---
// This component decides which type of element to render based on the 'Type' field.
function Element({ item }) {
  // If the Type is 'Menu' and there is page data, render the MenuElement.
  if (item.type === 'Menu' && Array.isArray(item.pages) && item.pages.length > 1) {
    return <MenuElement item={item} />;
  }
  // Otherwise, fall back to the default.
  return <DefaultElement item={item} />;
}


// --- MENU ELEMENT ---
function MenuElement({ item }) {
  // The 'pages' data from Grist is a list where the first element is the table name
  // and the second element is the list of records.
  const pageRecords = Array.isArray(item.pages) && item.pages.length > 1 ? item.pages[1] : [];

  return (
    <div
      style={{
        position: 'absolute',
        left: `${item.x * 20}px`,
        top: `${item.y * 20}px`,
        width: `${item.w * 20}px`,
        height: `${item.h * 20}px`,
        border: '1px solid #ddd',
        background: item.bgColor,
        boxSizing: 'border-box',
        padding: '5px',
        overflowY: 'auto',
      }}
    >
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {pageRecords.map(page => (
          <li key={page.id} style={{ marginBottom: '5px' }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // Construct the internal Grist page link and pass to the handler
                handleNavigate(`#p=${encodeURIComponent(page.fields.page_name)}`);
              }}
              style={{
                textDecoration: 'none',
                color: item.color,
                fontSize: '12px',
              }}
            >
              {page.fields.page_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}


// --- NAVIGATION HANDLER ---
// A single function to handle all navigation. It can handle both internal Grist
// page links (hashes) and full external URLs.
const handleNavigate = (url) => {
  if (!url) return;

  // If it's an internal Grist page link (starts with #), use the History API.
  if (url.startsWith('#')) {
    const newUrl = new URL(window.top.location.href);
    newUrl.hash = url.substring(1); // Remove the leading '#'
    window.top.history.pushState(null, '', newUrl.href);
    window.top.dispatchEvent(new PopStateEvent('popstate'));
  } else {
    // For full URLs, just navigate the top-level window.
    window.top.location.href = url;
  }
};


// --- DEFAULT ELEMENT ---
// This component now uses the handleNavigate function for same-tab navigation.
function DefaultElement({ item }) {
  return (
    <a
      href={item.link || '#'}
      onClick={(e) => {
        e.preventDefault(); // Prevent the default link behavior
        handleNavigate(item.link);
      }}
      style={{
        position: 'absolute',
        left: `${item.x * 20}px`,
        top: `${item.y * 20}px`,
        width: `${item.w * 20}px`,
        height: `${item.h * 20}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #ddd',
        textDecoration: 'none',
        color: item.color,
        background: item.bgColor,
        boxSizing: 'border-box',
        padding: '5px',
        fontSize: '12px',
        overflow: 'hidden',
      }}>
      {item.label}
    </a>
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