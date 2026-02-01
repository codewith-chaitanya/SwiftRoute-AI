import math

# A simple 5x5 Grid Graph
# Nodes are intersections. Edges are roads.

class Graph:
    def update_weight(self, u, v, new_weight):
        # Update both directions
        if v in self.edges[u]:
            self.edges[u][v] = new_weight
        if u in self.edges[v]:
            self.edges[v][u] = new_weight
    def __init__(self):
        self.nodes = {}  # {node_id: {'lat': x, 'lng': y}}
        self.edges = {}  # {node_id: {neighbor_id: weight}}
        self.width = 5
        self.height = 5
        self.base_lat = 40.7128
        self.base_lng = -74.0060
        self.spacing = 0.004  # Distance between nodes

        self._generate_grid()

    def _generate_grid(self):
        # 1. Create Nodes (0 to 24)
        count = 0
        for i in range(self.width):
            for j in range(self.height):
                self.nodes[count] = {
                    'lat': self.base_lat + (i * self.spacing),
                    'lng': self.base_lng + (j * self.spacing)
                }
                self.edges[count] = {}
                count += 1
        
        # 2. Create Edges (Connect neighbors)
        for i in range(self.width):
            for j in range(self.height):
                current_id = (i * self.height) + j
                
                # Connect Right
                if j < self.height - 1:
                    right_neighbor = current_id + 1
                    self.add_edge(current_id, right_neighbor, 1) # Weight 1 = Normal Traffic
                    self.add_edge(right_neighbor, current_id, 1)

                # Connect Up
                if i < self.width - 1:
                    up_neighbor = ((i + 1) * self.height) + j
                    self.add_edge(current_id, up_neighbor, 1)
                    self.add_edge(up_neighbor, current_id, 1)

    def add_edge(self, u, v, weight):
        self.edges[u][v] = weight

    def get_neighbors(self, node_id):
        return self.edges.get(node_id, {})

    def get_coords(self, node_id):
        return self.nodes[node_id]

# Create the global graph instance
city_graph = Graph()
