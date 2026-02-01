import React, { useState } from 'react';

const vehicles = [
  { id: 'moto', name: 'Moto', price: 0.5, time: '3 min', icon: '🛵' },
  { id: 'auto', name: 'Auto', price: 0.8, time: '5 min', icon: '🛺' },
  { id: 'prime', name: 'Prime', price: 1.2, time: '8 min', icon: '🚗' },
];

const SearchInput = ({ placeholder, icon, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  
  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 3) return setResults([]);
    
    try {
      // Added 'addressdetails=1' to get accurate full data
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${val}&addressdetails=1&limit=5`);
      const data = await res.json();
      setResults(data);
    } catch(e) {
      console.error(e);
    }
  };

  const handleSelectResult = (result) => {
    // 1. Set the Input Box to show the FULL address
    setQuery(result.display_name);
    // 2. Clear the dropdown list
    setResults([]);
    // 3. Send data to parent
    onSelect(result);
  };

  return (
    <div className="search-box">
      <span className="search-icon">{icon}</span>
      <input 
        value={query}
        onChange={(e) => handleSearch(e.target.value)} 
        placeholder={placeholder} 
      />
      
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i} onClick={() => handleSelectResult(r)}>
              {/* Bold Name */}
              <div className="result-title">
                {r.display_name.split(',')[0]}
              </div>
              {/* Full Address below it */}
              <div className="result-address">
                {r.display_name}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PassengerPanel = ({ onBook, rideData, pickup, drop }) => {
  const [vehicle, setVehicle] = useState(null);
  const [safety, setSafety] = useState(false);

  // 1. RIDE CONFIRMED VIEW
  if (rideData) {
    return (
      <div className="floating-panel confirmed">
        <div className="otp-circle">✅</div>
        <h2>Driver on the way</h2>
        
        <div className="otp-box">
          <small>OTP</small>
          <h1>{rideData.otp}</h1>
        </div>

        <div className="driver-info">
          <div>
            <strong>Driver #{rideData.driver.id}</strong>
            <p>{rideData.msg}</p>
          </div>
          <div className="price-tag">₹{rideData.price}</div>
        </div>
      </div>
    );
  }

  // 2. BOOKING VIEW
  return (
    <div className="floating-panel">
      <h2>Get a ride</h2>
      
      <div className="input-group">
        <div className="line-connector"></div>
        <SearchInput 
          placeholder="Pickup location" 
          icon="🟢" 
          onSelect={(r) => onBook('pickup', r)} 
        />
        <SearchInput 
          placeholder="Where to?" 
          icon="🟥" 
          onSelect={(r) => onBook('drop', r)} 
        />
      </div>

      <div 
        className={`safety-toggle ${safety ? 'active' : ''}`} 
        onClick={() => setSafety(!safety)}
      >
        <span>👩 Pink Ride (Safety)</span>
        <div className="toggle-switch"></div>
      </div>

      {pickup && drop && (
        <div className="vehicle-list">
          {vehicles.map(v => (
            <div 
              key={v.id} 
              className={`vehicle-card ${vehicle === v.id ? 'selected' : ''}`}
              onClick={() => setVehicle(v.id)}
            >
              <div className="v-icon">{v.icon}</div>
              <div className="v-info">
                <strong>{v.name}</strong>
                <small>{v.time}</small>
              </div>
              <div className="v-price">
                ₹{Math.round(100 * v.price * (safety ? 1.1 : 1))}
              </div>
            </div>
          ))}
          
          <button 
            className="btn-black" 
            disabled={!vehicle}
            onClick={() => onBook('request', { vehicle, safety })}
          >
            Confirm Ride
          </button>
        </div>
      )}
    </div>
  );
};

export default PassengerPanel;