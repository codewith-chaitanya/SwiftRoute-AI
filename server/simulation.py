import random
import asyncio

# A simple Car class
class Car:
    def __init__(self, id, start_lat, start_lng):
        self.id = id
        self.lat = start_lat
        self.lng = start_lng
        # Random speed and direction for now
        self.lat_speed = random.uniform(-0.0001, 0.0001)
        self.lng_speed = random.uniform(-0.0001, 0.0001)

    def move(self):
        # Update position
        self.lat += self.lat_speed
        self.lng += self.lng_speed
        
        # Boundary check (Bounce back if they go too far from center)
        # Center is roughly 40.7128, -74.0060
        if self.lat > 40.75 or self.lat < 40.65:
            self.lat_speed *= -1
        if self.lng > -73.95 or self.lng < -74.05:
            self.lng_speed *= -1

    def to_dict(self):
        return {
            "id": self.id,
            "lat": self.lat,
            "lng": self.lng
        }

# The Manager class
class CitySimulation:
    def __init__(self):
        self.cars = []
        # Spawn 10 random cars around New York
        for i in range(10):
            lat = 40.7128 + random.uniform(-0.02, 0.02)
            lng = -74.0060 + random.uniform(-0.02, 0.02)
            self.cars.append(Car(i, lat, lng))

    def update(self):
        # Move every car
        for car in self.cars:
            car.move()
        
        # Return data for frontend
        return [car.to_dict() for car in self.cars]

# Create a single instance
simulation = CitySimulation()