import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [cars, setCars] = useState([]);
  const [grid, setGrid] = useState({ nodes: {}, edges: {} });
  const [logs, setLogs] = useState(["System Initialized..."]); // A little log window

  // Helper to add logs
  const addLog = (msg) => {
    setLogs(prev => [msg, ...prev].slice(0, 5)); // Keep last 5 logs
  };

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      addLog("Connected to Server");
      socket.emit('request_grid');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      addLog("Disconnected from Server");
    });
    
    socket.on('game_state', (data) => setCars(data.cars));
    
    socket.on('grid_data', (data) => {
      setGrid(data);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game_state');
      socket.off('grid_data');
    };
  }, []);

  const handleRoadClick = (u, v, isJam) => {
    const action = isJam ? "Clearing Traffic" : "Creating Traffic Jam";
    addLog(`${action} on Road ${u}-${v}`);
    socket.emit('toggle_traffic', { u, v });
  };

  // --- RENDERING HELPERS ---
  const renderRoads = () => {
    const lines = [];
    Object.keys(grid.edges).forEach(fromId => {
      const neighbors = grid.edges[fromId];
      Object.keys(neighbors).forEach(toId => {
        if (parseInt(fromId) < parseInt(toId)) {
          const fromNode = grid.nodes[fromId];
          const toNode = grid.nodes[toId];
          const weight = neighbors[toId];
          const isJam = weight > 1; // Logic: Weight > 1 means JAM
          
          lines.push(
            <Polyline 
              key={`${fromId}-${toId}`} 
              positions={[[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]]}
              pathOptions={{ 
                color: isJam ? '#ef4444' : '#4b5563', // Red vs Grey
                weight: isJam ? 8 : 4,                 // Thick vs Thin
                opacity: isJam ? 0.9 : 0.4,
                dashArray: isJam ? '5, 10' : null      // Dashed line for Jams
              }} 
              eventHandlers={{
                click: () => handleRoadClick(fromId, toId, isJam)
              }}
            >
              <Popup>Road {fromId}-{toId} <br/> Status: {isJam ? "CONGESTED" : "CLEAR"}</Popup>
            </Polyline>
          );
        }
      });
    });
    return lines;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: 'Arial, sans-serif' }}>
      
      {/* --- SIDEBAR (The Command Center) --- */}
      <div style={{ 
        width: '300px', 
        backgroundColor: '#1f2937', 
        color: 'white', 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '2px 0 5px rgba(0,0,0,0.5)',
        zIndex: 2
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#60a5fa' }}>SwiftRoute AI 🚕</h2>
        
        {/* Connection Status */}
        <div style={{ marginBottom: '20px', padding: '10px', background: isConnected ? '#065f46' : '#991b1b', borderRadius: '5px' }}>
          Status: <strong>{isConnected ? "SYSTEM ONLINE" : "DISCONNECTED"}</strong>
        </div>

        {/* Legend */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ borderBottom: '1px solid #4b5563', paddingBottom: '5px' }}>Map Legend</h4>
          <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
            <div style={{ width: '15px', height: '15px', background: '#eab308', borderRadius: '50%', marginRight: '10px' }}></div>
            <span>Taxi (AI Agent)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
            <div style={{ width: '30px', height: '4px', background: '#4b5563', marginRight: '10px' }}></div>
            <span>Clear Road</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
            <div style={{ width: '30px', height: '4px', background: '#ef4444', border: '1px dashed white', marginRight: '10px' }}></div>
            <span>Traffic Jam (Click to Toggle)</span>
          </div>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '20px', fontSize: '0.9em', color: '#d1d5db' }}>
          <p><strong>How to Demo:</strong></p>
          1. Watch cars follow grey paths.<br/>
          2. <strong>CLICK a grey road</strong> to create a Traffic Jam.<br/>
          3. Watch cars instantly re-route.<br/>
        </div>

        {/* Live Logs */}
        <div style={{ marginTop: 'auto', background: '#111827', padding: '10px', borderRadius: '5px', fontSize: '0.8em', fontFamily: 'monospace' }}>
          <div style={{ color: '#9ca3af', marginBottom: '5px' }}>EVENT LOG:</div>
          {logs.map((log, i) => (
            <div key={i} style={{ borderBottom: '1px solid #374151', padding: '2px 0' }}>{"> " + log}</div>
          ))}
        </div>
      </div>

      {/* --- MAP AREA --- */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[40.72, -74.00]} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          
          {/* Visual Elements */}
          {grid.nodes && renderRoads()}
          
          {Object.values(grid.nodes).map((node, idx) => (
            <CircleMarker key={`n-${idx}`} center={[node.lat, node.lng]} radius={2} pathOptions={{ color: '#ffffff55' }} />
          ))}

          {cars.map((car) => (
            <CircleMarker 
              key={car.id} 
              center={[car.lat, car.lng]} 
              pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 1 }}
              radius={6}
            >
              <Popup>
                <strong>Taxi ID: {car.id}</strong><br/>
                Destination: Node {car.target_node}<br/>
                Status: {car.moving ? "Driving" : "Idle"}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;