import io from 'socket.io-client';

// CHANGE TO YOUR RENDER URL FOR DEPLOYMENT
// const URL = 'https://swiftroute-backend.onrender.com'; 
const URL = 'http://localhost:8000'; 

export const socket = io(URL);