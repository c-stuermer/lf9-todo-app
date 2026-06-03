// Build the full API URL dynamically from the configuration file
const API_URL = `${CONFIG.API_BASE_URL}/todo-list`;

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
        
        const res = await fetch(API_URL);
        const lists = await res.json();
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
        
        const res = await fetch(`${API_URL}/${listId}`);
        const entries = await res.json();
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
        const res = await fetch(`${API_URL}/entry/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() })
        });
        // Fetch entries automatically unlocks the UI upon reloading
        if (res.ok) fetchEntries(currentListId);
    } catch (err) { console.error(err); }
}

// --- DATA MUTATION HELPERS ---

async function createList() {
    const input = document.getElementById('newListName');
    if (!input.value.trim()) return;
    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input.value.trim() })
    });
    input.value = '';
    fetchLists();
}

async function createEntry() {
    const nInput = document.getElementById('newEntryName');
    const dInput = document.getElementById('newEntryDesc');
    if (!nInput.value.trim()) return;
    await fetch(`${API_URL}/${currentListId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nInput.value.trim(), description: dInput.value.trim() })
    });
    nInput.value = ''; dInput.value = '';
    fetchEntries(currentListId);
}

async function deleteList(id) {
    // Confirm dialogue before deletion
    if (confirm("Liste löschen?")) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        fetchLists();
    }
}

async function deleteEntry(id) {
    await fetch(`${API_URL}/entry/${id}`, { method: 'DELETE' });
    fetchEntries(currentListId);
}

// Initialize application on load
fetchLists();