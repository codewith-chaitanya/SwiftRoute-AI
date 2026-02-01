import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import MapBackground from './components/MapBackground';
import LoginPanel from './components/LoginPanel';
import PassengerPanel from './components/PassengerPanel';
import DriverPanel from './components/DriverPanel';
import './App.css';

function App() {
  const DEFAULT_LOC = { lat: 28.6139, lng: 77.2090 }; // Delhi
  const [myLoc, setMyLoc] = useState(DEFAULT_LOC);
  const [role, setRole] = useState(null);
  const [drivers, setDrivers] = useState([]);
  
  // Passenger State
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [route, setRoute] = useState([]);

  // Driver State
  const [job, setJob] = useState(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log("GPS Error, using default"),
      { enableHighAccuracy: true }
    );

    // Socket Events
    socket.on('drivers_update', setDrivers);
    socket.on('login_success', (data) => setRole(data.role));
    
    socket.on('ride_confirmed', (data) => {
      setRideData(data);
      if(data.route) setRoute(data.route);
    });

    socket.on('new_job', setJob);
    
    socket.on('otp_success', () => {
      setActive(true);
      setJob(null);
    });

    return () => socket.offAny();
  }, []);

  const handleLogin = (r) => {
    socket.emit(r === 'driver' ? 'join_driver' : 'join_passenger', myLoc);
  };

  // --- FIXED HANDLER ---
  const handleBooking = (type, data) => {
    if (type === 'pickup') {
      const coords = { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
      setPickup(coords); // Update App State directly
    }
    if (type === 'drop') {
      const coords = { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
      setDrop(coords);   // Update App State directly
    }
    if (type === 'request') {
      // Now App state has the coords, so this will work!
      socket.emit('request_ride', { 
        pickup, 
        drop, 
        safety_mode: data.safety 
      });
    }
  };

  const handleDriverAction = (action, data) => {
    if (action === 'verify') {
      socket.emit('verify_otp', { ride_id: job.ride_id, otp: data });
    }
    if (action === 'end') {
      window.location.reload();
    }
  };

  return (
    <div className="app-container">
      {/* 1. Map Layer (Always Visible) */}
      <MapBackground 
        myLoc={myLoc} 
        drivers={drivers} 
        pickup={pickup} 
        drop={drop} 
        route={route} 
      />

      {/* 2. UI Layer */}
      {!role && <LoginPanel onLogin={handleLogin} />}
      
      {role === 'passenger' && (
        <PassengerPanel 
          onBook={handleBooking} 
          rideData={rideData}
          // PASS STATE DOWN
          pickup={pickup}
          drop={drop}
        />
      )}

      {role === 'driver' && (
        <DriverPanel 
          job={job} 
          active={active} 
          onVerify={(otp) => handleDriverAction('verify', otp)} 
          onEnd={() => handleDriverAction('end')} 
        />
      )}
    </div>
  );
}

export default App;