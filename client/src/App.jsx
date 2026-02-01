import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [cars, setCars] = useState([]); // State to store car data

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // LISTEN for updates from Python
    socket.on('game_state', (data) => {
      setCars(data.cars);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game_state');
    };
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      {/* UI Overlay */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', padding: '15px', borderRadius: '8px',
        fontFamily: 'monospace'
      }}>
        <div style={{ marginBottom: '5px' }}>
          STATUS: <span style={{ color: isConnected ? '#0f0' : '#f00', fontWeight: 'bold' }}>
            {isConnected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
        <div>ACTIVE CARS: {cars.length}</div>
      </div>

      <MapContainer center={[40.7128, -74.0060]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render Logic: Map through the cars array */}
        {cars.map((car) => (
          <CircleMarker 
            key={car.id} 
            center={[car.lat, car.lng]} 
            pathOptions={{ color: 'yellow', fillColor: 'yellow', fillOpacity: 1 }}
            radius={6}
          >
            <Popup>Car ID: {car.id}</Popup>
          </CircleMarker>
        ))}
        
      </MapContainer>
    </div>
  );
}

export default App;