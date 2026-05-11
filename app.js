document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        mockList: document.getElementById('mock-list'),
        newMockBtn: document.getElementById('new-mock-btn'),
        mockNameInput: document.getElementById('mock-name'),
        saveStatus: document.getElementById('save-status'),
        formatBtn: document.getElementById('format-btn'),
        minifyBtn: document.getElementById('minify-btn'),
        saveBtn: document.getElementById('save-btn'),
        copyBtn: document.getElementById('copy-btn'),
        tabs: document.querySelectorAll('.tab-btn'),
        panes: document.querySelectorAll('.pane'),
        jsonInput: document.getElementById('json-input'),
        treeContainer: document.getElementById('tree-container'),
        validationMsg: document.getElementById('validation-msg'),
        charCount: document.getElementById('char-count'),
        emptyState: document.getElementById('empty-state'),
        loadSampleBtn: document.getElementById('load-sample-btn'),
    };

    // State
    let mocks = [];
    let activeMockId = null;
    let parsedJsonCache = null; // Holds valid JSON object
    let isEditing = false; // Tracks unsaved changes

    const SAMPLE_JSON = JSON.stringify({
        status: 200,
        message: "Success",
        data: {
            user: {
                id: 1,
                name: "Jane Doe",
                email: "jane.doe@example.com",
                roles: ["admin", "editor"]
            },
            pagination: {
                page: 1,
                pageSize: 20,
                totalItems: 84,
                totalPages: 5
            }
        },
        timestamp: "2026-05-11T22:00:00Z"
    }, null, 2);

    // Initialize
    init();

    function init() {
        loadMocks();
        setupEventListeners();

        if (mocks.length > 0) {
            selectMock(mocks[0].id);
        } else {
            createNewMock();
        }
    }

    function setupEventListeners() {
        // Sidebar
        elements.newMockBtn.addEventListener('click', createNewMock);

        // Toolbar
        elements.saveBtn.addEventListener('click', saveActiveMock);
        elements.formatBtn.addEventListener('click', formatJson);
        elements.minifyBtn.addEventListener('click', minifyJson);
        elements.copyBtn.addEventListener('click', copyToClipboard);

        // Input Changes
        elements.mockNameInput.addEventListener('input', () => setUnsaved(true));
        elements.jsonInput.addEventListener('input', handleJsonInput);

        // Sample JSON loader
        elements.loadSampleBtn.addEventListener('click', () => {
            elements.jsonInput.value = SAMPLE_JSON;
            handleJsonInput();
            elements.jsonInput.focus();
        });
        
        // Tabs
        elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.target));
        });
    }

    // --- State Management ---
    
    // NOTE: localStorage is unencrypted and readable by any JS on the page.
    // Do NOT store sensitive/production credentials here.
    function loadMocks() {
        const stored = localStorage.getItem('jsonMocks');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Guard against prototype pollution: only accept plain arrays of objects
                if (Array.isArray(parsed) && parsed.every(m => m && typeof m === 'object' && !Array.isArray(m))) {
                    mocks = parsed.map(m => ({
                        id: String(m.id ?? ''),
                        name: String(m.name ?? 'Unnamed Mock'),
                        content: String(m.content ?? '')
                    }));
                } else {
                    mocks = [];
                }
            } catch (e) {
                mocks = [];
            }
        }
        renderSidebar();
    }

    function saveMocksToStorage() {
        localStorage.setItem('jsonMocks', JSON.stringify(mocks));
        renderSidebar();
    }

    function createNewMock() {
        const newMock = {
            id: Date.now().toString(),
            name: 'New Mock Response',
            content: ''
        };
        mocks.unshift(newMock);
        saveMocksToStorage();
        selectMock(newMock.id);
    }

    function selectMock(id) {
        // Prompt to save if there are unsaved changes
        if (isEditing && activeMockId !== id) {
            if (!confirm('You have unsaved changes. Discard them?')) {
                return;
            }
        }

        activeMockId = id;
        const mock = mocks.find(m => m.id === id);
        if (!mock) return;

        elements.mockNameInput.value = mock.name;
        elements.jsonInput.value = mock.content;
        
        setUnsaved(false);
        handleJsonInput(); // trigger validation, tree render, and empty-state
        renderSidebar();
    }

    function saveActiveMock() {
        if (!activeMockId) return;
        const mockIndex = mocks.findIndex(m => m.id === activeMockId);
        if (mockIndex !== -1) {
            mocks[mockIndex].name = elements.mockNameInput.value || 'Unnamed Mock';
            mocks[mockIndex].content = elements.jsonInput.value;
            saveMocksToStorage();
            setUnsaved(false);
        }
    }

    function deleteMock(id) {
        if (confirm('Are you sure you want to delete this mock?')) {
            mocks = mocks.filter(m => m.id !== id);
            saveMocksToStorage();
            if (activeMockId === id) {
                isEditing = false;
                if (mocks.length > 0) {
                    selectMock(mocks[0].id);
                } else {
                    createNewMock();
                }
            }
        }
    }

    function setUnsaved(status) {
        isEditing = status;
        if (status) {
            elements.saveStatus.textContent = 'Unsaved';
            elements.saveStatus.className = 'status-badge unsaved';
        } else {
            elements.saveStatus.textContent = 'Saved';
            elements.saveStatus.className = 'status-badge saved';
        }
    }

    // --- UI Rendering ---

    function renderSidebar() {
        elements.mockList.innerHTML = '';
        mocks.forEach(mock => {
            const li = document.createElement('li');
            li.className = `mock-item ${mock.id === activeMockId ? 'active' : ''}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'mock-item-name';
            nameSpan.textContent = mock.name;
            nameSpan.title = mock.name;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-mock-btn';
            deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            deleteBtn.title = "Delete Mock";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteMock(mock.id);
            };

            li.onclick = () => selectMock(mock.id);
            
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            elements.mockList.appendChild(li);
        });
    }

    function switchTab(targetId) {
        elements.tabs.forEach(t => t.classList.remove('active'));
        elements.panes.forEach(p => p.classList.remove('active'));
        
        document.querySelector(`.tab-btn[data-target="${targetId}"]`).classList.add('active');
        document.getElementById(targetId).classList.add('active');

        // If switching to tree, ensure it's up to date
        if (targetId === 'tree-editor' && parsedJsonCache) {
            renderTree(parsedJsonCache);
        }
    }

    // --- Editor & JSON Logic ---

    function handleJsonInput() {
        setUnsaved(true);
        const raw = elements.jsonInput.value;
        elements.charCount.textContent = `${raw.length} chars`;
        toggleEmptyState(raw);

        if (!raw.trim()) {
            setValidation(false, 'Empty');
            parsedJsonCache = null;
            elements.treeContainer.innerHTML = '<div class="tree-placeholder">Enter JSON to view tree.</div>';
            return;
        }

        try {
            parsedJsonCache = JSON.parse(raw);
            setValidation(true, 'Valid JSON');
            // We don't render tree immediately on every keystroke to save performance, 
            // but we can render it if tree tab is active
            if (document.getElementById('tree-editor').classList.contains('active')) {
                renderTree(parsedJsonCache);
            }
        } catch (e) {
            parsedJsonCache = null;
            setValidation(false, e.message);
        }
    }

    function toggleEmptyState(raw) {
        const isEmpty = !raw || !raw.trim();
        elements.emptyState.style.display = isEmpty ? 'flex' : 'none';
    }

    // Build validation UI with safe DOM APIs — no innerHTML with user-controlled data.
    function makeSvgIcon(pathData) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('fill', 'none');
        // pathData is a static constant defined in our own code, not user input.
        svg.innerHTML = pathData;
        return svg;
    }

    const SVG_CHECK  = '<polyline points="20 6 9 17 4 12"></polyline>';
    const SVG_ALERT  = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';

    function setValidation(isValid, message) {
        const msg = elements.validationMsg;
        msg.className = isValid ? 'validation-msg success' : 'validation-msg error';
        // Clear previous content safely
        while (msg.firstChild) msg.removeChild(msg.firstChild);

        msg.appendChild(makeSvgIcon(isValid ? SVG_CHECK : SVG_ALERT));

        const textSpan = document.createElement('span');
        // Use textContent so error messages from JSON.parse cannot inject markup.
        textSpan.textContent = message;
        msg.appendChild(textSpan);
    }

    function formatJson() {
        if (parsedJsonCache) {
            elements.jsonInput.value = JSON.stringify(parsedJsonCache, null, 2);
            handleJsonInput();
        } else {
            alert('Cannot format invalid JSON. Please fix errors first.');
        }
    }

    function minifyJson() {
        if (parsedJsonCache) {
            elements.jsonInput.value = JSON.stringify(parsedJsonCache);
            handleJsonInput();
        } else {
            alert('Cannot minify invalid JSON. Please fix errors first.');
        }
    }

    function copyToClipboard() {
        if (!elements.jsonInput.value.trim()) return;

        navigator.clipboard.writeText(elements.jsonInput.value).then(() => {
            // Snapshot original children via cloneNode to avoid storing/restoring innerHTML.
            const originalChildren = Array.from(elements.copyBtn.childNodes).map(n => n.cloneNode(true));

            elements.copyBtn.classList.add('copy-success');
            // Build "Copied!" state with safe DOM APIs
            while (elements.copyBtn.firstChild) elements.copyBtn.removeChild(elements.copyBtn.firstChild);
            const ns = 'http://www.w3.org/2000/svg';
            const checkSvg = document.createElementNS(ns, 'svg');
            checkSvg.setAttribute('viewBox', '0 0 24 24');
            checkSvg.setAttribute('width', '18');
            checkSvg.setAttribute('height', '18');
            checkSvg.setAttribute('stroke', 'currentColor');
            checkSvg.setAttribute('stroke-width', '2');
            checkSvg.setAttribute('fill', 'none');
            checkSvg.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>'; // static constant
            const copiedLabel = document.createElement('span');
            copiedLabel.textContent = 'Copied!';
            elements.copyBtn.appendChild(checkSvg);
            elements.copyBtn.appendChild(copiedLabel);

            setTimeout(() => {
                elements.copyBtn.classList.remove('copy-success');
                while (elements.copyBtn.firstChild) elements.copyBtn.removeChild(elements.copyBtn.firstChild);
                originalChildren.forEach(n => elements.copyBtn.appendChild(n));
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard.');
        });
    }

    // --- Tree View Rendering ---

    function renderTree(jsonObj) {
        elements.treeContainer.innerHTML = '';
        const rootNode = buildTreeNode('root', jsonObj, true, true);
        elements.treeContainer.appendChild(rootNode);
    }

    function buildTreeNode(key, value, isLast, isRoot = false) {
        const container = document.createElement('div');
        container.className = 'tree-node';

        const row = document.createElement('div');
        row.className = 'tree-row';
        
        const isComplex = typeof value === 'object' && value !== null;
        const isArray = Array.isArray(value);

        // Toggle icon
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        toggle.innerHTML = isComplex ? '▼' : '';
        row.appendChild(toggle);

        // Key
        if (!isRoot && key !== null && key !== undefined) {
            const keySpan = document.createElement('span');
            keySpan.className = 'tree-key';
            keySpan.textContent = `"${key}"`;
            row.appendChild(keySpan);
            
            const colon = document.createElement('span');
            colon.className = 'tree-colon';
            colon.textContent = ':';
            row.appendChild(colon);
        }

        // Value
        if (isComplex) {
            const bracketOpen = document.createElement('span');
            bracketOpen.className = 'tree-bracket';
            bracketOpen.textContent = isArray ? '[' : '{';
            row.appendChild(bracketOpen);
            
            container.appendChild(row);

            const childrenContainer = document.createElement('div');
            const keys = Object.keys(value);
            keys.forEach((k, index) => {
                const childNode = buildTreeNode(isArray ? null : k, value[k], index === keys.length - 1);
                childrenContainer.appendChild(childNode);
            });
            container.appendChild(childrenContainer);

            const closeRow = document.createElement('div');
            closeRow.className = 'tree-row';
            const bracketClose = document.createElement('span');
            bracketClose.className = 'tree-bracket';
            // Align closing bracket
            bracketClose.style.marginLeft = '16px'; 
            bracketClose.textContent = (isArray ? ']' : '}') + (isLast ? '' : ',');
            closeRow.appendChild(bracketClose);
            container.appendChild(closeRow);

            // Toggle logic
            toggle.onclick = () => {
                if (childrenContainer.style.display === 'none') {
                    childrenContainer.style.display = 'block';
                    closeRow.style.display = 'flex';
                    toggle.innerHTML = '▼';
                    bracketOpen.textContent = isArray ? '[' : '{';
                } else {
                    childrenContainer.style.display = 'none';
                    closeRow.style.display = 'none';
                    toggle.innerHTML = '▶';
                    bracketOpen.textContent = (isArray ? '[...]' : '{...}') + (isLast ? '' : ',');
                }
            };
        } else {
            const valSpan = document.createElement('span');
            valSpan.className = 'tree-value';
            
            // Format value correctly based on type
            if (value === null) {
                valSpan.textContent = 'null';
                valSpan.classList.add('null');
            } else if (typeof value === 'string') {
                valSpan.textContent = `"${value}"`;
                valSpan.classList.add('string');
            } else if (typeof value === 'number') {
                valSpan.textContent = value;
                valSpan.classList.add('number');
            } else if (typeof value === 'boolean') {
                valSpan.textContent = value;
                valSpan.classList.add('boolean');
            }
            
            // contentEditable removed: it allowed pasting arbitrary HTML/JS into the DOM
            // (stored-XSS risk). Tree view is intentionally read-only for now.

            row.appendChild(valSpan);
            
            if (!isLast) {
                const comma = document.createElement('span');
                comma.className = 'tree-bracket';
                comma.textContent = ',';
                row.appendChild(comma);
            }
            
            container.appendChild(row);
        }

        return container;
    }
});
