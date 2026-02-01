import socketio
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation import simulation  # Import our new logic

# 1. Setup
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

# 2. Background Task: The Heartbeat
# This runs the game loop 10 times a second
async def simulation_loop():
    while True:
        # 1. Update positions
        car_data = simulation.update()
        
        # 2. Send to Frontend (only if someone is watching)
        await sio.emit('game_state', {'cars': car_data})
        
        # 3. Wait 0.1 seconds (10 FPS)
        await asyncio.sleep(0.1)

# Start the loop when the server starts
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())

@app.get("/")
def read_root():
    return {"message": "SwiftRoute Backend Online"}

@sio.event
async def connect(sid, environ):
    print(f"Client Connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client Disconnected: {sid}")