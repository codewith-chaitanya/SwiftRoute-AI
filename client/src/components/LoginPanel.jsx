import React from 'react';

const LoginPanel = ({ onLogin }) => {
  return (
    <div className="login-overlay">
      <div className="login-card">
        <h1>SwiftRoute</h1>
        <p>Advanced Traffic-Aware Dispatch</p>
        
        <div className="login-buttons">
          <button onClick={() => onLogin('passenger')} className="btn-black">
            Get a Ride
          </button>
          <button onClick={() => onLogin('driver')} className="btn-outline">
            Drive with Us
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPanel;