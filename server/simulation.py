import random
import math
from graph import city_graph
from algorithms import a_star_search

class Car:
    def __init__(self, id, start_node):
        self.id = id
        self.current_node = start_node
        self.target_node = start_node
        
        # Position logic
        coords = city_graph.get_coords(start_node)
        self.lat = coords['lat']
        self.lng = coords['lng']
        
        # Movement
        self.path = [] # List of node_ids to follow
        self.speed = 0.0005 # Movement speed per tick
        self.is_moving = False
        self.next_hop_index = 0

    def set_destination(self, end_node):
        # calculate path using A*
        self.path = a_star_search(self.current_node, end_node)
        if len(self.path) > 1:
            self.is_moving = True
            self.next_hop_index = 1 # 0 is current, 1 is next
            self.target_node = end_node

    def move(self):
        if not self.is_moving or not self.path:
            return

        # Get coordinates of the next node in the path
        next_node_id = self.path[self.next_hop_index]
        target_coords = city_graph.get_coords(next_node_id)
        
        # Move towards target
        d_lat = target_coords['lat'] - self.lat
        d_lng = target_coords['lng'] - self.lng
        distance = math.sqrt(d_lat**2 + d_lng**2)
        
        if distance < self.speed:
            # Snap to node (Arrival)
            self.lat = target_coords['lat']
            self.lng = target_coords['lng']
            self.current_node = next_node_id
            self.next_hop_index += 1
            
            # Check if reached final destination
            if self.next_hop_index >= len(self.path):
                self.is_moving = False
                self.path = []
                # Auto-pick new random destination (to keep simulation alive)
                new_dest = random.randint(0, 24)
                self.set_destination(new_dest)
        else:
            # Interpolate (Move fraction of the way)
            ratio = self.speed / distance
            self.lat += d_lat * ratio
            self.lng += d_lng * ratio

    def to_dict(self):
        return {
            "id": self.id,
            "lat": self.lat,
            "lng": self.lng,
            "moving": self.is_moving
        }

class CitySimulation:
    def trigger_repath(self):
        # Force all moving cars to recalculate their path immediately
        for car in self.cars:
            if car.is_moving:
                # Re-run A* from current location to same target
                car.set_destination(car.target_node)
    def __init__(self):
        self.cars = []
        # Spawn 5 cars at random nodes
        for i in range(5):
            start_node = random.randint(0, 24)
            car = Car(i, start_node)
            # Give them a random initial destination
            car.set_destination(random.randint(0, 24))
            self.cars.append(car)

    def update(self):
        for car in self.cars:
            car.move()
        return [car.to_dict() for car in self.cars]

    # Helper to expose graph structure to frontend (Visuals)
    def get_graph_data(self):
        return {
            "nodes": city_graph.nodes,
            "edges": city_graph.edges
        }

simulation = CitySimulation()