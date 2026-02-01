import socketio
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation import simulation  # Ensure simulation.py exists in the same folder

# 1. Setup Socket.IO
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()

# 2. Wrap FastAPI with Socket.IO
# This is the 'socket_app' Uvicorn is looking for
socket_app = socketio.ASGIApp(sio, app)

# 3. CORS (Allow React to talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Background Task: Simulation Loop
async def simulation_loop():
    while True:
        # Update car positions
        simulation.update()
        
        # Send new positions to frontend
        car_data = [car.to_dict() for car in simulation.cars]
        await sio.emit('game_state', {'cars': car_data})
        
        # Wait 0.1s (10 FPS)
        await asyncio.sleep(0.1)

@app.on_event("startup")
async def startup_event():
    # Start the simulation loop in the background
    asyncio.create_task(simulation_loop())

@app.get("/")
def read_root():
    return {"message": "SwiftRoute Backend Online"}

# --- Socket Events ---
@sio.event
async def connect(sid, environ):
    print(f"Client Connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client Disconnected: {sid}")

@sio.event
async def request_grid(sid):
    # Send the static graph structure to the client
    grid_data = simulation.get_graph_data()
    await sio.emit('grid_data', grid_data, to=sid)

# ... inside main.py ...

@sio.event
async def toggle_traffic(sid, data):
    # data = {'u': node_id_1, 'v': node_id_2}
    u, v = int(data['u']), int(data['v'])
    
    # Toggle weight: If 1 -> make it 20 (Jam). If > 1 -> make it 1 (Clear).
    current_weight = simulation.get_graph_data()['edges'][u][v]
    new_weight = 20 if current_weight == 1 else 1
    
    # 1. Update Graph
    from graph import city_graph
    city_graph.update_weight(u, v, new_weight)
    
    # 2. Tell cars to re-calculate paths
    simulation.trigger_repath()
    
    # 3. Broadcast new grid to all clients (so the line turns Red)
    await sio.emit('grid_data', simulation.get_graph_data())