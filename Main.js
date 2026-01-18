// ==UserScript==
// @name Livery-Injector
// @namespace https://github.com/Yicha25/Better-Lightting/
// @version 1.0
// @match https://www.geo-fs.com/geofs.php?v=*
// @match https://*.geo-fs.com/geofs.php*
// @grant none
// ==/UserScript==


(function() {
    const UI_ID = "geofs-force-texture-panel";
    const BUTTON_ID = "geofs-injector-toggle-btn";


    if (document.getElementById(UI_ID)) document.getElementById(UI_ID).remove();
    if (document.getElementById(BUTTON_ID)) document.getElementById(BUTTON_ID).remove();


    const style = document.createElement('style');
    style.textContent = `
        #${UI_ID} {
            position: fixed; bottom: 80px; left: 10px; width: 250px; 
            background: rgba(15, 15, 15, 0.98); color: white; 
            padding: 15px; border-radius: 8px; font-family: sans-serif; 
            z-index: 10005; border: 2px solid #3f5f8a;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
            display: none; /* Toggleable */
        }
        #${UI_ID}.visible { display: block; }
        
        .force-btn {
            width: 100%; padding: 10px; margin-top: 10px; 
            background: #3f5f8a; color: white; border: none; 
            border-radius: 4px; cursor: pointer; font-weight: bold;
            transition: background 0.2s;
        }
        .force-btn:hover { background: #567db3; }
        .force-status { font-size: 11px; margin-top: 8px; color: #00ff00; font-family: monospace; }
        
        .mode-container {
            margin-top: 10px; font-size: 11px; color: #ccc;
            display: flex; align-items: center; gap: 5px;
        }

        .geofs-ui-bottom-button-icon-only {
            display: inline-flex; height: 40px; width: 40px;
            background: transparent; color: white; margin-right: 5px;
            cursor: pointer; border-radius: 5px; transition: background 0.2s;
            vertical-align: middle; align-items: center; justify-content: center;
        }
        .geofs-ui-bottom-button-icon-only img {
            height: 28px; width: 28px; object-fit: contain;
        }
        .geofs-ui-bottom-button-icon-only:hover { background: rgba(255, 255, 255, 0.1); }
        .geofs-ui-active { background: rgba(63, 95, 138, 0.4) !important; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = UI_ID;
    panel.innerHTML = `
        <div style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #3f5f8a; text-transform: uppercase; display: flex; justify-content: space-between;">
            Livery Injector
            <span style="cursor:pointer; color:#cf0c0c;" onclick="window.toggleLiveryInjector()">[X]</span>
        </div>
        <input type="file" id="force-file-input" accept="image/*" style="width: 100%; font-size: 12px; background: #222; padding: 5px; border-radius: 4px;">
        
        <div class="mode-container">
            <input type="checkbox" id="smart-mode-check" checked>
            <label for="smart-mode-check">Smart Mode (Preserve Wings/Parts)</label>
        </div>

        <button id="force-apply-btn" class="force-btn">FORCE OVERWRITE</button>
        <div id="force-msg" class="force-status">STANDBY</div>
        <div style="font-size: 9px; color: #666; margin-top: 10px; line-height: 1.2;">
            *Smart Mode targets common livery texture slots while avoiding often wings/engines texture.
        </div>
    `;
    document.body.appendChild(panel);

    // 3. Logic for Toggling the UI
    window.toggleLiveryInjector = function() {
        const p = document.getElementById(UI_ID);
        const b = document.getElementById(BUTTON_ID);
        if (!p || !b) return;
        const isVisible = p.classList.toggle('visible');
        b.classList.toggle('geofs-ui-active', isVisible);
    };

    const bottomMenu = document.querySelector('.geofs-ui-bottom') || document.body;
    const toggleBtn = document.createElement('div');
    toggleBtn.id = BUTTON_ID;
    toggleBtn.className = "geofs-ui-bottom-button-icon-only";
    toggleBtn.innerHTML = `<img src="https://i.ibb.co/60MZqKYJ/image.png" alt="injector-icon">`;
    toggleBtn.title = "Livery Injector";
    toggleBtn.onclick = window.toggleLiveryInjector;
    bottomMenu.appendChild(toggleBtn);

    document.getElementById('force-apply-btn').onclick = function() {
        const fileInput = document.getElementById('force-file-input');
        const status = document.getElementById('force-msg');
        const smartMode = document.getElementById('smart-mode-check').checked;

        if (!fileInput.files.length) return;
        
        const file = fileInput.files[0];
        const reader = new FileReader();

        status.innerText = "PROCESSING...";

        reader.onload = function(event) {
            const dataUrl = event.target.result;
            const aircraft = geofs.aircraft.instance;
            
            try {
                aircraft.definition.texture = dataUrl;
                if (aircraft.definition.liveries) {
                    aircraft.definition.liveries = [{texture: dataUrl, name: "Forced"}];
                }


                aircraft.definition.parts.forEach((part) => {
                    if (part['3dmodel'] && part['3dmodel']._model) {
                        const model = part['3dmodel']._model;


                        const targetSlots = smartMode ? [0, 2] : [0, 1, 2, 3];

                        targetSlots.forEach(i => {
                            try {
                                if (geofs.version >= 3.0) {
                                    geofs.api.changeModelTexture(model, dataUrl, { index: i });
                                } else {
                                    geofs.api.changeModelTexture(dataUrl, i, part['3dmodel']);
                                }
                            } catch(e) {}
                        });

                        if (model.getMaterial) {
                            const mat = model.getMaterial();
                            if (mat && mat.setValue) {
                                try { mat.setValue("baseColorFactor", new Cesium.Cartesian4(1, 1, 1, 1)); } catch(e) {}
                            }
                        }
                    }
                });

                status.innerText = "INJECTED SUCCESSFULLY";
                status.style.color = "#00ff00";
            } catch (err) {
                console.error(err);
                status.innerText = "INJECTION FAILED";
                status.style.color = "#ff0000";
            }
        };

        reader.readAsDataURL(file);
    };
})();
