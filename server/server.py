import uuid
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from prometheus_flask_exporter import PrometheusMetrics

# initialize Flask server
app = Flask(__name__)
CORS(app)
metrics = PrometheusMetrics(app)

# create unique id for lists, entries
todo_list_1_id = '1318d3d1-d979-47e1-a225-dab1751dbe75'
todo_list_2_id = '3062dc25-6b80-4315-bb1d-a7c86b014c65'
todo_list_3_id = '44b02e00-03bc-451d-8d01-0c67ea866fee'
todo_1_id = str(uuid.uuid4())
todo_2_id = str(uuid.uuid4())
todo_3_id = str(uuid.uuid4())
todo_4_id = str(uuid.uuid4())

# define internal data structures with example data
todo_lists = [
    {'id': todo_list_1_id, 'name': 'Einkaufsliste'},
    {'id': todo_list_2_id, 'name': 'Arbeit'},
    {'id': todo_list_3_id, 'name': 'Privat'},
]
entries = [
    {'id': todo_1_id, 'name': 'Milch', 'description': '3,5%', 'list_id': todo_list_1_id},
    {'id': todo_2_id, 'name': 'Arbeitsblätter ausdrucken', 'description': '', 'list_id': todo_list_2_id},
    {'id': todo_3_id, 'name': 'Kinokarten kaufen', 'description': '', 'list_id': todo_list_3_id},
    {'id': todo_4_id, 'name': 'Eier', 'description': '', 'list_id': todo_list_1_id},
]

# --- HELPER FUNCTIONS ---

def get_item_or_404(collection, item_id):
    #Helper to find an item by ID or abort with 404.
    for item in collection:
        if item['id'] == item_id:
            return item
    abort(404)

def validate_list_data(data):
    # Validates payload for creating a new list.
    if not data or 'name' not in data:
        return jsonify({"error": "Bad Request", "message": "Missing required field: 'name'"}), 400
    if not isinstance(data['name'], str) or not data['name'].strip():
        return jsonify({"error": "Bad Request", "message": "The field 'name' must be a non-empty string"}), 400
    return None # Validation passed

def validate_entry_data(data, is_patch=False):
    # Validates payload for entries. Restricts allowed fields.
    if not data:
        return jsonify({"error": "Bad Request", "message": "Empty request body"}), 400
    
    # strictly limit which fields the client is allowed to send/update
    allowed_fields = {'name', 'description'}
    for key in data.keys():
        if key not in allowed_fields:
            return jsonify({"error": "Bad Request", "message": f"Modifying field '{key}' is not allowed"}), 400
            
    # 'name' is required for POST, but optional for PATCH
    if not is_patch and 'name' not in data:
        return jsonify({"error": "Bad Request", "message": "Missing required field: 'name'"}), 400
        
    if 'name' in data and (not isinstance(data['name'], str) or not data['name'].strip()):
        return jsonify({"error": "Bad Request", "message": "The field 'name' must be a non-empty string"}), 400
        
    if 'description' in data and not isinstance(data['description'], str):
        return jsonify({"error": "Bad Request", "message": "The field 'description' must be a string"}), 400
        
    return None # Validation passed

# --- GLOBAL ERROR HANDLERS ---

@app.errorhandler(404)
def handle_not_found(error):
    return jsonify({"error": "Not Found", "message": "The requested ID does not exist"}), 404

@app.errorhandler(405)
def handle_method_not_allowed(error):
    return jsonify({"error": "Method Not Allowed", "message": "Invalid method called on an existing endpoint"}), 405

@app.errorhandler(429)
def handle_too_many_requests(error):
    return jsonify({"error": "Too Many Requests", "message": "Too many requests made"}), 429

@app.errorhandler(500)
def handle_internal_server_error(error):
    return jsonify({"error": "Internal Server Error", "message": "An internal server error occurred"}), 500

@app.errorhandler(502)
def handle_bad_gateway(error):
    return jsonify({"error": "Bad Gateway", "message": "An invalid endpoint was called"}), 502

# --- ROUTES ---

@app.route('/todo-list', methods=['GET'])
def get_all_lists():
    return jsonify(todo_lists)

@app.route('/todo-list', methods=['POST'])
def add_new_list():
    if not request.is_json:
        return jsonify({"error": "Bad Request", "message": "Content-Type must be application/json"}), 400

    new_list_data = request.get_json()
    
    validation_error = validate_list_data(new_list_data)
    if validation_error:
        return validation_error

    created_list = {
        "id": str(uuid.uuid4()),
        "name": new_list_data['name']
    }
    todo_lists.append(created_list)
    return jsonify(created_list), 201

@app.route('/todo-list/<list_id>', methods=['GET', 'DELETE'])
def handle_list(list_id):
    global entries
    list_item = get_item_or_404(todo_lists, list_id)
    
    if request.method == 'GET':
        return jsonify([i for i in entries if i['list_id'] == list_id])
        
    elif request.method == 'DELETE':
        todo_lists.remove(list_item)
        entries = [i for i in entries if i['list_id'] != list_id]
        return '', 204

@app.route('/todo-list/<list_id>', methods=['POST'])
def add_new_entry(list_id):
    get_item_or_404(todo_lists, list_id)

    if not request.is_json:
        return jsonify({"error": "Bad Request", "message": "Content-Type must be application/json"}), 400

    new_entry_data = request.get_json()
    
    validation_error = validate_entry_data(new_entry_data, is_patch=False)
    if validation_error:
        return validation_error
    
    new_entry = {
        'id': str(uuid.uuid4()),
        'name': new_entry_data['name'],
        'description': new_entry_data.get('description', ''),
        'list_id': list_id
    }
    
    entries.append(new_entry)
    return jsonify(new_entry), 201

@app.route('/todo-list/entry/<entry_id>', methods=['PATCH', 'DELETE'])
def handle_entry(entry_id):
    entry_item = get_item_or_404(entries, entry_id)
    
    if request.method == 'PATCH':
        if not request.is_json:
            return jsonify({"error": "Bad Request", "message": "Content-Type must be application/json"}), 400
            
        update_data = request.get_json()
        
        validation_error = validate_entry_data(update_data, is_patch=True)
        if validation_error:
            return validation_error
            
        entry_item.update(update_data)
        return jsonify(entry_item), 200

    elif request.method == 'DELETE':
        entries.remove(entry_item)
        return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)