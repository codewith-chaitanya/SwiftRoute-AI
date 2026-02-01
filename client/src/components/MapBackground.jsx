import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- ICONS SETUP (Same as before) ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CarIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const UserIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

// --- OPTIMIZED COMPONENTS ---

// 1. Animation Controller: Only runs when `coords` changes significantly
const MapController = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

// 2. Driver Markers: Separated to prevent full map re-renders
const DriverMarkers = React.memo(({ drivers }) => {
  return (
    <>
      {drivers.map(d => (
        <Marker key={d.id} position={[d.lat, d.lng]} icon={CarIcon} />
      ))}
    </>
  );
});

// 3. Main Background Component
const MapBackground = React.memo(({ myLoc, drivers, pickup, drop, route }) => {
  
  // Memoize the route line so it doesn't flicker
  const routeLine = useMemo(() => {
    return route.length > 0 ? <Polyline positions={route} color="black" weight={4} /> : null;
  }, [route]);

  return (
    <div className="map-container">
      <MapContainer 
        center={myLoc} 
        zoom={13} 
        zoomControl={false} 
        style={{ height: '100%', width: '100%' }}
        // These props prevent Leaflet from working too hard on simple updates
        preferCanvas={true} 
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        
        <MapController coords={myLoc} />
        
        {/* Static Elements */}
        <Marker position={myLoc} icon={UserIcon} />
        {pickup && <Marker position={pickup}><Popup>Pickup</Popup></Marker>}
        {drop && <Marker position={drop}><Popup>Drop</Popup></Marker>}

        {/* Dynamic Elements (Optimized) */}
        <DriverMarkers drivers={drivers} />
        {routeLine}

      </MapContainer>
    </div>
  );
});

export default MapBackground;