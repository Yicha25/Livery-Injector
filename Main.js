// ==UserScript==
// @name Livery-Injector
// @version 1.1
// @match https://www.geo-fs.com/geofs.php?v=*
// @grant none
// ==/UserScript==


(function() {
    const UI_ID = "geofs-force-texture-panel";
    const BUTTON_ID = "geofs-injector-toggle-btn";
    const STYLE_ID = "geofs-injector-style";
    const DB_NAME = "GeofsLiveryDB_v3"; 
    const STORE_NAME = "liveries";
    const SETTINGS_STORE = "settings";

    if (document.getElementById(UI_ID)) document.getElementById(UI_ID).remove();
    if (document.getElementById(BUTTON_ID)) document.getElementById(BUTTON_ID).remove();
    if (document.getElementById(STYLE_ID)) document.getElementById(STYLE_ID).remove();

    async function openDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "storageKey" });
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE);
            };
            request.onsuccess = () => resolve(request.result);
        });
    }

    async function saveSetting(k, v) {
        const db = await openDB();
        db.transaction(SETTINGS_STORE, "readwrite").objectStore(SETTINGS_STORE).put(v, k);
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${UI_ID} {
            position: fixed; bottom: 80px; left: 10px; width: 260px; 
            background: rgba(255, 255, 255, 0.98); color: #333; 
            padding: 15px; border-radius: 12px; font-family: sans-serif; 
            z-index: 10005; border: 1px solid #ddd;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15); display: none;
            backdrop-filter: blur(2px);
        }
        #${UI_ID}.visible { display: block; }
        .aircraft-indicator { font-size: 9px; color: #3f5f8a; background: #eef4ff; padding: 6px; border-radius: 4px; margin-bottom: 10px; font-weight: bold; text-align: center; border: 1px solid #d0deef; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .force-btn { width: 100%; padding: 8px; margin-top: 8px; background: #3f5f8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; }
        .search-input { width: 100%; padding: 8px; background: #f5f5f5; border: 1px solid #ddd; color: #333; border-radius: 6px; font-size: 11px; margin-top: 10px; box-sizing: border-box; outline: none; }
        .livery-list { margin-top: 10px; max-height: 180px; overflow-y: auto; border-top: 1px solid #eee; padding-top: 5px; }
        .livery-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; margin-bottom: 4px; background: #fff; border: 1px solid #eee; border-radius: 6px; font-size: 11px; cursor: pointer; }
        .livery-item:hover { background: #f0f7ff; border-color: #3f5f8a; }
        .delete-x { color: #cc0000; font-size: 16px; padding: 0 8px; font-weight: bold; cursor: pointer; }
        .geofs-ui-bottom-button-icon-only#${BUTTON_ID} { display: inline-flex !important; height: 40px !important; width: 40px !important; align-items: center !important; justify-content: center !important; vertical-align: top !important; }
        
        #${BUTTON_ID} img { height: 30px !important; width: 30px !important; object-fit: contain; }

        .storage-bar { font-size: 9px; color: #999; margin-top: 5px; text-align: right; }
        .tool-row { display: flex; gap: 4px; margin-top: 5px; }
        .tool-btn { flex: 1; font-size: 9px; background: #eee; color: #555; border: 1px solid #ddd; padding: 5px; border-radius: 4px; cursor: pointer; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = UI_ID;
    panel.innerHTML = `
        <div style="font-size: 11px; font-weight: bold; color: #3f5f8a; display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            Livery Injector 1.1
            <span style="cursor:pointer; font-size: 20px; color: #aaa;" onclick="window.toggleLiveryInjector()">×</span>
        </div>
        <div id="current-ac-display" class="aircraft-indicator">Syncing Aircraft Record...</div>
        <input type="file" id="force-file-input" accept="image/*" style="width: 100%; font-size: 10px; margin-bottom: 10px;">
        <div style="display:flex; align-items:center; gap:8px; background:#f9f9f9; padding:8px; border-radius:6px; border:1px solid #eee;">
            <input type="checkbox" id="smart-mode-check">
            <label for="smart-mode-check" style="font-size:10px; cursor:pointer;">Smart Mode</label>
        </div>
        <button id="force-apply-btn" class="force-btn">Save & Load</button>
        <input type="text" id="livery-search-box" class="search-input" placeholder="Search liveries...">
        <div class="livery-list" id="livery-gallery"></div>
        <div id="storage-info" class="storage-bar">Storage: 0.0 MB</div>
        <div class="tool-row">
            <button id="export-btn" class="tool-btn">Export .json</button>
            <button id="import-btn" class="tool-btn">Import .json</button>
            <button id="clear-all-btn" class="tool-btn" style="color:#cc0000;">Delete All</button>
        </div>
        <input type="file" id="import-selector" accept=".json" style="display:none;">
        <div id="force-msg" style="font-size: 9px; margin-top: 8px; color: #999; font-family: monospace; text-align: center;">No livery loaded. Upload the file first!</div>
    `;
    document.body.appendChild(panel);

    function getACRecord() {
        return geofs.aircraft.instance.aircraftRecord || { id: "unknown", name: "Unknown" };
    }

    async function updateGallery() {
        const filter = document.getElementById('livery-search-box').value.toLowerCase();
        const container = document.getElementById('livery-gallery');
        const record = getACRecord();
        document.getElementById('current-ac-display').innerText = "Aircraft: " + record.name;
        
        const db = await openDB();
        const items = await new Promise(res => {
            const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
            req.onsuccess = () => res(req.result);
        });
        
        container.innerHTML = "";
        const filteredItems = items.filter(i => {
            return i.aircraftId == record.id && i.name.toLowerCase().includes(filter);
        });
        
        filteredItems.sort((a,b)=>b.timestamp-a.timestamp).forEach(item => {
            const div = document.createElement('div');
            div.className = "livery-item";
            div.innerHTML = `<span style="flex:1; overflow:hidden; text-overflow:ellipsis;">${item.name}</span><span class="delete-x">×</span>`;
            div.onclick = (e) => { if(e.target.className !== 'delete-x') applyTexture(item.data, item.name); };
            div.querySelector('.delete-x').onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${item.name}"?`)) {
                    db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(item.storageKey);
                    updateGallery();
                }
            };
            container.appendChild(div);
        });
        
        let total = 0; items.forEach(i => total += i.data.length);
        document.getElementById('storage-info').innerText = `Storage: ${(total/(1024*1024)).toFixed(1)} MB`;
    }

    function applyTexture(dataUrl, name) {
        const aircraft = geofs.aircraft?.instance;
        if (!aircraft) return;
        const smart = document.getElementById('smart-mode-check').checked;
        aircraft.definition.texture = dataUrl;
        aircraft.definition.parts.forEach(p => {
            if (p['3dmodel']?._model) {
                const slots = smart ? [0, 2] : [0,1,2,3];
                slots.forEach(i => {
                    try {
                        if (geofs.version >= 3.0) geofs.api.changeModelTexture(p['3dmodel']._model, dataUrl, {index:i});
                        else geofs.api.changeModelTexture(dataUrl, i, p['3dmodel']);
                    } catch(e){}
                });
                const mat = p['3dmodel']._model.getMaterial?.();
                if (mat?.setValue) mat.setValue("baseColorFactor", new Cesium.Cartesian4(1,1,1,1));
            }
        });
        document.getElementById('force-msg').innerText = "Livery loaded: " + name;
        saveSetting("last_used_" + getACRecord().id, name);
    }

    document.getElementById('livery-search-box').addEventListener('input', updateGallery);
    window.toggleLiveryInjector = () => panel.classList.toggle('visible');

    document.getElementById('force-apply-btn').onclick = async function() {
        const file = document.getElementById('force-file-input').files[0];
        if (!file) return;
        const db = await openDB();
        const record = getACRecord();
        const storageKey = `AC_${record.id}_${file.name}`;
        
        const exists = await new Promise(res => {
            const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(storageKey);
            req.onsuccess = () => res(!!req.result);
        });
        if (exists && !confirm(`Overwrite existing livery for ${record.name}?`)) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).put({ 
                storageKey: storageKey,
                name: file.name, 
                aircraftId: record.id, 
                data: e.target.result, 
                timestamp: Date.now() 
            });
            tx.oncomplete = () => { applyTexture(e.target.result, file.name); updateGallery(); };
        };
        reader.readAsDataURL(file);
    };

    setInterval(() => {
        const record = getACRecord();
        if (panel.dataset.lastAcId !== record.id) {
            panel.dataset.lastAcId = record.id;
            updateGallery();
            checkLastUsed();
        }
    }, 2000);

    async function checkLastUsed() {
        const db = await openDB();
        const record = getACRecord();
        const last = await new Promise(res => {
            const req = db.transaction(SETTINGS_STORE).objectStore(SETTINGS_STORE).get("last_used_" + record.id);
            req.onsuccess = () => res(req.result);
        });
        if (last) {
            const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(`AC_${record.id}_${last}`);
            req.onsuccess = () => { if (req.result) applyTexture(req.result.data, req.result.name); };
        }
    }

    document.getElementById('export-btn').onclick = async function() {
        const db = await openDB();
        const items = await new Promise(res => {
            const req = db.transaction(STORE_NAME).objectStore(STORE_NAME).getAll();
            req.onsuccess = () => res(req.result);
        });
        const blob = new Blob([JSON.stringify(items)], {type: 'application/json'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'geofs_saved_liveries.json'; a.click();
    };

    document.getElementById('import-btn').onclick = () => document.getElementById('import-selector').click();
    document.getElementById('import-selector').onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const items = JSON.parse(ev.target.result);
                const db = await openDB();
                const tx = db.transaction(STORE_NAME, "readwrite");
                items.forEach(item => {
                    if (!item.storageKey) item.storageKey = `AC_${item.aircraftId}_${item.name}`;
                    tx.objectStore(STORE_NAME).put(item);
                });
                tx.oncomplete = () => { alert("Imported!"); updateGallery(); };
            } catch(err) { alert("Load Failed"); }
        };
        reader.readAsText(file);
    };

    document.getElementById('clear-all-btn').onclick = async () => {
        if (confirm("Wipe all saved livery on this plane? (WARNING: THIS CANNOT BE UNDONE!)")) {
            const db = await openDB();
            db.transaction([STORE_NAME, SETTINGS_STORE], "readwrite").objectStore(STORE_NAME).clear();
            updateGallery();
        }
    };

    panel.querySelectorAll('input').forEach(i => {
        ['keydown','keypress','keyup'].forEach(ev => i.addEventListener(ev, e => e.stopPropagation()));
    });

    const bottomMenu = document.querySelector('.geofs-ui-bottom');
    if (bottomMenu) {
        const btn = document.createElement('div');
        btn.id = BUTTON_ID; btn.className = "geofs-ui-bottom-button-icon-only";
        btn.innerHTML = `<img src="https://i.ibb.co/60MZqKYJ/image.png">`;
        btn.onclick = window.toggleLiveryInjector;
        bottomMenu.appendChild(btn);
    }
})();
