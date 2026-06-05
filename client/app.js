// Build the full API URL dynamically from the configuration file
const API_URL = `${CONFIG.API_BASE_URL}/todo-list`;

// --- API WRAPPER ---

// Centralized fetch function to handle HTTP errors and JSON parsing uniformly
async function apiFetch(endpoint, options = {}) {
    // Automatically set JSON headers if a body is provided
    if (options.body && !options.headers) {
        options.headers = { 'Content-Type': 'application/json' };
    }
    const response = await fetch(endpoint, options);
    // Fetch does not reject on HTTP errors (like 404 or 500), so we must check manually
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
    }
    // Return null if the server sends a "204 No Content" (e.g., after a DELETE request)
    // Attempting to parse empty content with .json() would crash the app
    if (response.status === 204) {
        return null;
    }
    // Automatically parse and return the JSON payload
    return await response.json();
}

// Global variables
let currentListId = null;
let isEditingActive = false; 

// --- UI HELPERS ---

// Lock or unlock all elements outside the currently edited row
function setInterfaceLocked(locked) {
    isEditingActive = locked;
    const allMainActions = document.querySelectorAll('.main-action, .btn-edit, .btn-del');
    allMainActions.forEach(el => {
        // Check if element is inside a row that is currently being edited
        if (!el.closest('.is-editing')) { 
            el.disabled = locked;
        }
    });
}

// --- NAVIGATION ---

function showLanding() {
    if (isEditingActive) return; // Prevent navigation while editing
    document.getElementById('view-landing').classList.remove('hidden');
    document.getElementById('view-list').classList.add('hidden');
    currentListId = null;
    fetchLists();
}

function showList(id, name) {
    currentListId = id;
    document.getElementById('currentListName').innerText = name;
    document.getElementById('view-landing').classList.add('hidden');
    document.getElementById('view-list').classList.remove('hidden');
    fetchEntries(id);
}

// --- API LOGIC ---

async function fetchLists() {
    try {
        //unlock UI when loading lists
        setInterfaceLocked(false);

        const lists = await apiFetch(API_URL);
        const container = document.getElementById('listsContainer');
        container.innerHTML = '';

        lists.forEach(list => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info"><span class="item-title"></span></div>
                <div class="controls"><button class="btn-square btn-del">x</button></div>
            `;
            div.querySelector('.item-title').innerText = list.name;
            div.querySelector('.item-info').onclick = () => showList(list.id, list.name);
            div.querySelector('.btn-del').onclick = (e) => { e.stopPropagation(); deleteList(list.id); };
            container.appendChild(div);
        });
    } catch (err) { console.error(err); }
}

async function fetchEntries(listId) {
    try {
        // Unlock UI when loading entries (e.g. after cancel or save)
        setInterfaceLocked(false);
        
        const entries = await apiFetch(`${API_URL}/${listId}`);
        const container = document.getElementById('entriesContainer');
        container.innerHTML = '';

        entries.forEach(e => {
            const div = document.createElement('div');
            div.className = 'item-row';
            div.innerHTML = `
                <div class="item-info view-mode">
                    <span class="item-title"></span>
                    <span class="description"></span>
                </div>
                <div class="edit-fields edit-mode hidden">
                    <input type="text" class="edit-name-input">
                    <input type="text" class="edit-desc-input">
                </div>
                <div class="controls">
                    <button class="btn-square btn-edit edit-trigger">✎</button>
                    <button class="btn-square btn-cancel cancel-trigger hidden">✖</button>
                    <button class="btn-square btn-del del-trigger">x</button>
                </div>
            `;
            
            const viewMode = div.querySelector('.view-mode');
            const editMode = div.querySelector('.edit-mode');
            const nameInput = div.querySelector('.edit-name-input');
            const descInput = div.querySelector('.edit-desc-input');
            const editBtn = div.querySelector('.edit-trigger');
            const cancelBtn = div.querySelector('.cancel-trigger');
            const delBtn = div.querySelector('.del-trigger');

            // Fill data safely
            div.querySelector('.item-title').innerText = e.name;
            div.querySelector('.description').innerText = e.description || '';
            nameInput.value = e.name;
            descInput.value = e.description || '';

            // Edit button logic
            editBtn.onclick = () => {
                const isSaving = editBtn.classList.contains('btn-save');
                
                if (isSaving) {
                    // Save action
                    saveInlineEntry(e.id, nameInput.value, descInput.value);
                } else {
                    // Start editing action
                    div.classList.add('is-editing');
                    viewMode.classList.add('hidden');
                    editMode.classList.remove('hidden');
                    cancelBtn.classList.remove('hidden');
                    delBtn.classList.add('hidden');
                    
                    editBtn.innerText = '✔';
                    editBtn.classList.replace('btn-edit', 'btn-save');
                    
                    // Lock everything else on the screen
                    setInterfaceLocked(true);
                    nameInput.focus();
                }
            };

            // Cancel button logic
            cancelBtn.onclick = () => {
                fetchEntries(currentListId); // Reload entries resets the UI cleanly
            };

            // Delete button logic
            delBtn.onclick = () => deleteEntry(e.id);
            
            container.appendChild(div);
        });
    } catch (err) { console.error(err); }
}

async function saveInlineEntry(id, newName, newDesc) {
    if (!newName.trim()) { alert("Name darf nicht leer sein!"); return; }

    try {
        await apiFetch(`${API_URL}/entry/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() })
        });
        // Fetch entries automatically unlocks the UI upon reloading
        fetchEntries(currentListId);
    } catch (err) { console.error(err); }
}

// --- DATA MUTATION HELPERS ---

async function createList() {
    const input = document.getElementById('newListName');
    if (!input.value.trim()) return;
    try {
        await apiFetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ name: input.value.trim() })
        });
        input.value = '';
        fetchLists();
    } catch (err) { console.error(err); }
}

async function createEntry() {
    const nInput = document.getElementById('newEntryName');
    const dInput = document.getElementById('newEntryDesc');
    if (!nInput.value.trim()) return;
    try {
        await apiFetch(`${API_URL}/${currentListId}`, {
            method: 'POST',
            body: JSON.stringify({ name: nInput.value.trim(), description: dInput.value.trim() })
        });
        nInput.value = ''; dInput.value = '';
        fetchEntries(currentListId);
    } catch (err) { console.error(err); }
}

async function deleteList(id) {
    try {
        await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchLists();
    } catch (err) { console.error(err); }
}

async function deleteEntry(id) {
    try {
        await apiFetch(`${API_URL}/entry/${id}`, { method: 'DELETE' });
        fetchEntries(currentListId);
    } catch (err) { console.error(err); }
}

// Initialize application on load
fetchLists();