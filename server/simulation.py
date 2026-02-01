import random
import requests
import time

# FREE Routing API (No Key Needed)
OSRM_URL = "http://router.project-osrm.org/route/v1/driving/"

class TripManager:
    def __init__(self):
        self.drivers = {} 
        self.passengers = {}
        self.active_trips = {}
        self.ride_queue = {} # For Predictive Dispatch

    def register_driver(self, sid, lat, lng, gender="M"):
        # Demo Logic: Randomly assign safety ratings
        safety_score = round(random.uniform(3.5, 5.0), 1)
        self.drivers[sid] = {
            "id": f"D-{random.randint(100,999)}",
            "sid": sid,
            "lat": lat,
            "lng": lng,
            "status": "IDLE",
            "gender": gender,
            "rating": safety_score,
            "trip_end_time": 0, # UNIX timestamp when current trip ends
            "trip_end_loc": None # {lat, lng} of current drop
        }
        return self.drivers[sid]

    def get_route(self, start_lat, start_lng, end_lat, end_lng):
        # Call OSRM API
        url = f"{OSRM_URL}{start_lng},{start_lat};{end_lng},{end_lat}?overview=full&geometries=geojson"
        try:
            resp = requests.get(url, timeout=2).json()
            route = resp['routes'][0]
            return {
                "duration": route['duration'], # Seconds
                "distance": route['distance'], # Meters
                "geometry": [[p[1], p[0]] for p in route['geometry']['coordinates']]
            }
        except:
             # Fallback line if API fails
            return {"duration": 600, "distance": 2000, "geometry": [[start_lat, start_lng], [end_lat, end_lng]]}

    def request_ride(self, passenger_sid, p_lat, p_lng, d_lat, d_lng, safety_mode=False):
        best_driver = None
        min_total_wait = float('inf')
        is_predictive = False

        # 1. FIND BEST DRIVER (Predictive Algorithm)
        for sid, driver in self.drivers.items():
            
            # Feature 1: Safety Filter (Pink Ride)
            if safety_mode:
                # If driver is Male and rating is low, SKIP him
                if driver['gender'] == 'M' and driver['rating'] < 4.7:
                    continue 

            # Calculate Wait Time
            time_to_arrive = float('inf')

            if driver['status'] == 'IDLE':
                # Simple: Drive from current loc -> pickup
                route = self.get_route(driver['lat'], driver['lng'], p_lat, p_lng)
                time_to_arrive = route['duration']
                
            elif driver['status'] == 'BUSY':
                # Feature 2: Predictive Dispatch
                # Time remaining in current trip + Drive from Drop -> New Pickup
                time_remaining = max(0, driver['trip_end_time'] - time.time())
                
                # Only consider if finishing soon (< 5 mins)
                if time_remaining < 300 and driver['trip_end_loc']:
                    drop_lat = driver['trip_end_loc']['lat']
                    drop_lng = driver['trip_end_loc']['lng']
                    route_to_new = self.get_route(drop_lat, drop_lng, p_lat, p_lng)
                    time_to_arrive = time_remaining + route_to_new['duration']
                    is_predictive = True # Mark as queued job

            # Pick Winner
            if time_to_arrive < min_total_wait:
                min_total_wait = time_to_arrive
                best_driver = driver
                # Save the flag so we know if this specific winner was predictive or not
                # But we need to reset it if an Idle driver beats a Busy one later in the loop
                # So logic: if we found a better idle driver, is_predictive becomes False
                if driver['status'] == 'IDLE': is_predictive = False
                elif driver['status'] == 'BUSY': is_predictive = True


        if best_driver:
            # Calculate Price
            trip_route = self.get_route(p_lat, p_lng, d_lat, d_lng)
            base_price = (trip_route['distance'] / 1000) * 12 # ₹12 per km
            base_price = max(40, base_price)
            
            # Apply Safety Bonus
            final_price = base_price
            msg = "Standard Ride"
            if safety_mode:
                final_price = base_price * 1.10 # +10%
                msg = f"Safety Priority: {best_driver['rating']}⭐ Driver (+10% Bonus)"

            otp = str(random.randint(1000, 9999))
            ride_id = f"R-{random.randint(10000,99999)}"
            
            result = {
                "found": True,
                "driver": best_driver,
                "price": round(final_price),
                "eta": min_total_wait,
                "otp": otp,
                "ride_id": ride_id,
                "msg": msg,
                "route": trip_route['geometry']
            }

            if is_predictive:
                result['status'] = 'queued'
                self.ride_queue[best_driver['sid']] = result
                return result
            else:
                # Immediate Assignment
                result['status'] = 'active'
                self.drivers[best_driver['sid']]['status'] = 'BUSY'
                self.drivers[best_driver['sid']]['trip_end_time'] = time.time() + trip_route['duration']
                self.drivers[best_driver['sid']]['trip_end_loc'] = {'lat': d_lat, 'lng': d_lng}
                self.active_trips[ride_id] = result
                return result

        return {"found": False}

    def verify_otp(self, ride_id, otp):
        if ride_id in self.active_trips and self.active_trips[ride_id]['otp'] == otp:
            return True
        return False

    def get_all_drivers(self):
        return [d for d in self.drivers.values()]

trip_manager = TripManager()