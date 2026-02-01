import socketio
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation import trip_manager

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
socket_app = socketio.ASGIApp(sio, app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def broadcast_loop():
    while True:
        drivers = trip_manager.get_all_drivers()
        await sio.emit('drivers_update', drivers)
        await asyncio.sleep(2)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_loop())

@sio.event
async def join_driver(sid, coords):
    # Register with random gender for demo
    import random
    gender = "F" if random.random() > 0.5 else "M"
    trip_manager.register_driver(sid, coords['lat'], coords['lng'], gender)
    await sio.emit('login_success', {'role': 'driver'}, to=sid)

@sio.event
async def join_passenger(sid, coords):
    await sio.emit('login_success', {'role': 'passenger'}, to=sid)

@sio.event
async def request_ride(sid, data):
    p_lat, p_lng = data['pickup']['lat'], data['pickup']['lng']
    d_lat, d_lng = data['drop']['lat'], data['drop']['lng']
    safety = data.get('safety_mode', False) # New Flag
    
    result = trip_manager.request_ride(sid, p_lat, p_lng, d_lat, d_lng, safety)
    
    if result['found']:
        await sio.emit('ride_confirmed', result, to=sid)
        # Notify driver
        await sio.emit('new_job', result, to=result['driver']['sid'])
    else:
        await sio.emit('ride_error', {'msg': 'No Drivers Available'}, to=sid)

@sio.event
async def verify_otp(sid, data):
    if trip_manager.verify_otp(data['ride_id'], data['otp']):
        await sio.emit('otp_success', {}, to=sid)

@app.get("/")
def read_root(): return {"status": "SwiftRoute Pro Backend"}