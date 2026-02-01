import React, { useState } from 'react';

const DriverPanel = ({ job, active, onVerify, onEnd }) => {
  const [otp, setOtp] = useState('');

  return (
    <div className="floating-panel driver">
      <div className="status-bar">
        <h3>Driver App</h3>
        <span className={`status-badge ${active ? 'busy' : 'online'}`}>
          {active ? 'ON TRIP' : 'ONLINE'}
        </span>
      </div>

      {!job && !active && (
        <div className="radar">
          <div className="radar-pulse"></div>
          <p>Finding rides...</p>
        </div>
      )}

      {job && !active && (
        <div className="job-alert">
          <h3>🔔 New Request</h3>
          <p>{job.msg}</p>
          <h1>₹{job.price}</h1>
          
          <div className="verify-box">
            <input 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              placeholder="Enter OTP" 
            />
            <button onClick={() => onVerify(otp)}>Start</button>
          </div>
        </div>
      )}

      {active && (
        <button className="btn-red" onClick={onEnd}>
          End Trip
        </button>
      )}
    </div>
  );
};

export default DriverPanel;