from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import networkx as nx
import random
from routes import blueprint
import logging
from models import db, Node, Edge  

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, template_folder="templates") 
CORS(app)  
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///city23.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)  

app.register_blueprint(blueprint)

@app.route('/')
def index():
    return render_template('index.html')  

@app.route('/shortest-path', methods=['POST'])
def shortest_path():
    try:
        data = request.json
        logger.debug(f"Received data: {data}")
        
        start = int(data.get('start'))
        end = int(data.get('end'))
        traffic_factor = float(data.get('traffic_factor', 0.5))  
        
        logger.debug(f"Calculating shortest path from {start} to {end} with traffic factor {traffic_factor}")
        
        if start is None or end is None:
            return jsonify({"error": "Start and end nodes are required"}), 400
        
        G = nx.Graph()
        nodes = []
        edges = []
        
        with app.app_context():
            nodes = [node for node in db.session.execute(db.select(Node)).scalars()]
            edges = [edge for edge in db.session.execute(db.select(Edge)).scalars()]
        
        logger.debug(f"Found {len(nodes)} nodes and {len(edges)} edges")
        
        for node in nodes:
            G.add_node(node.id)
        
        for edge in edges:
            # Calculate the effective weight as a combination of distance and traffic
            # traffic_factor determines how much traffic affects the total weight
            # (1-traffic_factor) determines how much distance affects the total weight
            effective_weight = edge.weight * (1-traffic_factor) + (edge.weight * edge.traffic * traffic_factor)
            
            G.add_edge(edge.start, edge.end, 
                      weight=effective_weight, 
                      raw_distance=edge.weight, 
                      traffic=edge.traffic)
            
            logger.debug(f"Added edge: {edge.start} -> {edge.end} (distance: {edge.weight}, traffic: {edge.traffic:.2f}, effective weight: {effective_weight:.2f})")
        
        logger.debug(f"Graph has {len(G.nodes)} nodes and {len(G.edges)} edges")
        
        if start not in G:
            logger.error(f"Start node {start} not in graph")
            return jsonify({"error": f"Start node {start} does not exist"}), 404
        
        if end not in G:
            logger.error(f"End node {end} not in graph")
            return jsonify({"error": f"End node {end} does not exist"}), 404
        
        try:
            path = nx.shortest_path(G, source=start, target=end, weight='weight')
            distance = nx.shortest_path_length(G, source=start, target=end, weight='weight')
            
            # Calculate raw distance and average traffic for the path
            raw_distance = 0
            total_traffic = 0
            edge_details = []
            
            for i in range(len(path) - 1):
                edge_data = G.get_edge_data(path[i], path[i+1])
                raw_distance += edge_data['raw_distance']
                total_traffic += edge_data['traffic']
                
                edge_details.append({
                    'start': path[i],
                    'end': path[i+1],
                    'distance': edge_data['raw_distance'],
                    'traffic': edge_data['traffic']
                })
            
            avg_traffic = total_traffic / (len(path) - 1) if len(path) > 1 else 0
            
            logger.debug(f"Found path: {path}, effective distance: {distance:.2f}, raw distance: {raw_distance}, avg traffic: {avg_traffic:.2f}")
            
            return jsonify({
                "path": path, 
                "distance": distance,
                "raw_distance": raw_distance,
                "avg_traffic": avg_traffic,
                "edge_details": edge_details
            })
            
        except nx.NetworkXNoPath:
            logger.error(f"No path exists between nodes {start} and {end}")
            return jsonify({"error": "No path exists between these nodes", "path": [], "distance": 0}), 200
        except Exception as e:
            logger.error(f"Error calculating path: {str(e)}")
            return jsonify({"error": str(e)}), 500
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/update-traffic', methods=['POST'])
def update_traffic():
    try:
        with app.app_context():
            edges = db.session.execute(db.select(Edge)).scalars().all()
            for edge in edges:
                # Generate random traffic between 0.5 (light traffic) and 3.0 (heavy traffic)
                edge.traffic = random.uniform(0.5, 3.0)
            db.session.commit()
        
        return jsonify({"success": True, "message": "Traffic updated successfully"})
    except Exception as e:
        logger.error(f"Error updating traffic: {str(e)}")
        return jsonify({"error": str(e)}), 500

def init_db(app):
    with app.app_context():
        db.create_all()
        if not Node.query.first():
            for i in range(1, 16):
                db.session.add(Node(id=i, name=f'Node {i}'))
            db.session.commit()
            
            nodes = list(range(1, 16))
            connected = [1]  
            remaining = nodes[1:]
            
            while remaining:
                start = random.choice(connected)
                end = random.choice(remaining)
                weight = random.randint(1, 10)  # Distance weight
                traffic = random.uniform(0.5, 3.0)  # Random traffic multiplier
                db.session.add(Edge(start=start, end=end, weight=weight, traffic=traffic))
                connected.append(end)
                remaining.remove(end)
            
            edges = set((e.start, e.end) for e in db.session.query(Edge).all())
            additional_edges = 10
            
            while len(edges) < len(nodes) + additional_edges:
                start, end = random.sample(range(1, 16), 2)
                if start != end and (start, end) not in edges and (end, start) not in edges:
                    weight = random.randint(1, 10)  # Distance weight
                    traffic = random.uniform(0.5, 3.0)  # Random traffic multiplier
                    db.session.add(Edge(start=start, end=end, weight=weight, traffic=traffic))
                    edges.add((start, end))
            
            db.session.commit()
            logger.info(f"Database initialized with {len(nodes)} nodes and {len(edges)} edges")

if __name__ == '__main__':
    init_db(app)  
    app.run(debug=True)