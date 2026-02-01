import heapq
import math
from graph import city_graph

# Heuristic: Euclidean distance between two nodes
def heuristic(node_a, node_b):
    pos_a = city_graph.get_coords(node_a)
    pos_b = city_graph.get_coords(node_b)
    return math.sqrt((pos_a['lat'] - pos_b['lat'])**2 + (pos_a['lng'] - pos_b['lng'])**2)

def a_star_search(start_node, goal_node):
    # Priority Queue stores (priority, node_id)
    frontier = []
    heapq.heappush(frontier, (0, start_node))
    
    came_from = {start_node: None}
    cost_so_far = {start_node: 0}
    
    while frontier:
        _, current = heapq.heappop(frontier)
        
        if current == goal_node:
            break
        
        # Check all neighbors
        neighbors = city_graph.get_neighbors(current)
        for next_node, weight in neighbors.items():
            new_cost = cost_so_far[current] + weight
            
            if next_node not in cost_so_far or new_cost < cost_so_far[next_node]:
                cost_so_far[next_node] = new_cost
                priority = new_cost + heuristic(next_node, goal_node)
                heapq.heappush(frontier, (priority, next_node))
                came_from[next_node] = current
                
    # Reconstruct Path (Backtrack from goal to start)
    if goal_node not in came_from:
        return [] # No path found
        
    path = []
    current = goal_node
    while current != start_node:
        path.append(current)
        current = came_from[current]
    path.append(start_node)
    path.reverse()
    return path