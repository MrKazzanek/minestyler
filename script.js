// script.js (WERSJA DLA LIVE SERVER)
document.addEventListener('DOMContentLoaded', () => {
    const clothesGrid = document.getElementById('clothes-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const skinViewerContainer = document.getElementById('skin-viewer-container');
    const uploadBtn = document.getElementById('upload-btn');
    const skinUploadInput = document.getElementById('skin-upload-input');
    const downloadBtn = document.getElementById('download-btn');
    const selectedItemsList = document.getElementById('selected-items-list');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const selectedItemsContainer = document.getElementById('selected-items-container');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const themeSystemBtn = document.getElementById('theme-system');
    const themeLightBtn = document.getElementById('theme-light');
    const themeDarkBtn = document.getElementById('theme-dark');
    let baseSkinUrl = null;
    let selectedItems = {};

    const applyTheme = (theme) => {
        document.body.classList.remove('dark-theme');
        if (theme === 'dark') document.body.classList.add('dark-theme');
        document.querySelectorAll('.theme-switcher button').forEach(b => b.classList.remove('active'));
        document.getElementById(`theme-${theme}`).classList.add('active');
        localStorage.setItem('theme', theme);
    };
    const handleSystemTheme = () => {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
        document.getElementById('theme-system').classList.add('active');
        localStorage.setItem('theme', 'system');
    };
    themeLightBtn.addEventListener('click', () => applyTheme('light'));
    themeDarkBtn.addEventListener('click', () => applyTheme('dark'));
    themeSystemBtn.addEventListener('click', handleSystemTheme);
    const savedTheme = localStorage.getItem('theme') || 'system';
    if (savedTheme === 'system') handleSystemTheme(); else applyTheme(savedTheme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'system') handleSystemTheme();
    });

    const drawSkinPreview = (dataUrl) => {
        skinViewerContainer.innerHTML = '';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
        skinViewerContainer.appendChild(canvas);
    };
    const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject({ src, err });
        img.src = src;
    });
    
    const showModal = (title, message) => {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        modalOverlay.classList.remove('hidden');
    };
    const hideModal = () => modalOverlay.classList.add('hidden');
    modalCloseBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) hideModal(); });

    const renderClothes = (items) => {
        clothesGrid.innerHTML = '';
        if (items.length === 0) {
            clothesGrid.innerHTML = '<p class="placeholder-text">Nie znaleziono przedmiotów.</p>'; return;
        }
        items.forEach(item => {
            const isActive = selectedItems[item.category] && selectedItems[item.category].id === item.id;
            const tile = document.createElement('div');
            tile.className = `clothing-tile ${isActive ? 'active' : ''}`;
            tile.dataset.id = item.id; tile.dataset.category = item.category;
            tile.innerHTML = `
                <div class="tile-media">
                    <img src="${item.imageUrl}" alt="${item.name}" loading="lazy">
                    <video src="${item.videoUrl}" loop muted playsinline></video>
                </div>
                <div class="tile-info">
                    <div class="tile-header">
                        <h4>${item.name}</h4>
                        <button class="download-icon" title="Pobierz teksturę przedmiotu"><i class="ph-download-simple-bold"></i></button>
                    </div>
                    <p class="tile-description">${item.description}</p>
                    <div class="tile-footer">
                        <a href="${item.authorLink}" target="_blank" class="author">@${item.author}</a>
                        <span class="category">${item.category}</span>
                    </div>
                </div>`;
            clothesGrid.appendChild(tile);
            tile.addEventListener('mouseenter', () => {
                const video = tile.querySelector('video');
                if (video) video.play().catch(e => {});
            });
            tile.addEventListener('mouseleave', () => {
                const video = tile.querySelector('video');
                if (video) video.pause();
            });
        });
    };
    
    const updateSelectedItemsList = () => {
        selectedItemsList.innerHTML = '';
        const items = Object.values(selectedItems);
        if (items.length > 0) {
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.category}: ${item.name}</span>
                    <button class="remove-item-btn" data-id="${item.id}" title="Usuń element"><i class="ph-x-bold"></i></button>`;
                selectedItemsList.appendChild(li);
            });
            selectedItemsContainer.classList.remove('hidden');
        } else {
            selectedItemsContainer.classList.add('hidden');
        }
    };
    
    const updateCombinedSkin = async () => {
        if (!baseSkinUrl) return;
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        try {
            const baseSkinImg = await loadImage(baseSkinUrl);
            ctx.drawImage(baseSkinImg, 0, 0);
            const textureUrls = Object.values(selectedItems).map(item => item.textureUrl);
            const textureImages = await Promise.all(textureUrls.map(url => loadImage(url)));
            textureImages.forEach(texImg => ctx.drawImage(texImg, 0, 0));
            drawSkinPreview(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error("Błąd podczas ładowania obrazu:", error.src, error.err);
            showModal("Błąd ładowania", `Nie udało się wczytać obrazu. Upewnij się, że plik istnieje w folderze 'assets' i strona jest uruchomiona przez Live Server.`);
        }
    };

    uploadBtn.addEventListener('click', () => skinUploadInput.click());
    skinUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'image/png') {
            const reader = new FileReader();
            reader.onload = (e) => {
                baseSkinUrl = e.target.result;
                updateCombinedSkin();
                downloadBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Proszę wybrać plik PNG!');
        }
    });
    clothesGrid.addEventListener('click', (e) => {
        const tile = e.target.closest('.clothing-tile');
        const downloadIcon = e.target.closest('.download-icon');
        if (downloadIcon) {
            e.stopPropagation();
            const id = parseInt(tile.dataset.id, 10);
            const item = clothesData.find(i => i.id === id);
            if (item) {
                const link = document.createElement('a');
                link.href = item.textureUrl;
                link.download = `item_${item.name.replace(/\s+/g, '_')}.png`;
                link.click();
            }
            return;
        }
        if (tile) {
            const id = parseInt(tile.dataset.id, 10);
            const item = clothesData.find(i => i.id === id);
            if (selectedItems[item.category] && selectedItems[item.category].id === item.id) {
                delete selectedItems[item.category];
            } else if (selectedItems[item.category]) {
                showModal('Selection error', `You can only have one item from category "${item.category}". Uncheck first "${selectedItems[item.category].name}".`);
            } else {
                selectedItems[item.category] = item;
            }
            filterAndRender(); updateCombinedSkin(); updateSelectedItemsList();
        }
    });
    selectedItemsList.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-item-btn');
        if (removeBtn) {
            const id = parseInt(removeBtn.dataset.id, 10);
            const itemToRemove = clothesData.find(i => i.id === id);
            if (itemToRemove) {
                delete selectedItems[itemToRemove.category];
                filterAndRender(); updateCombinedSkin(); updateSelectedItemsList();
            }
        }
    });
    downloadBtn.addEventListener('click', () => {
        const canvas = skinViewerContainer.querySelector('canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'my_custom_skin.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });
    clearSelectionBtn.addEventListener('click', () => {
        selectedItems = {};
        filterAndRender(); updateCombinedSkin(); updateSelectedItemsList();
    });

    const filterAndRender = () => {
        const query = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;
        const filtered = clothesData.filter(item => {
            const matchesCategory = category === 'all' || item.category === category;
            const matchesQuery = item.name.toLowerCase().includes(query) ||
                                 item.description.toLowerCase().includes(query) ||
                                 item.author.toLowerCase().includes(query);
            return matchesCategory && matchesQuery;
        });
        renderClothes(filtered);
    };

    const populateCategories = () => {
        const categories = [...new Set(clothesData.map(item => item.category))];
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat; option.textContent = cat;
            categoryFilter.appendChild(option);
        });
    };
    searchInput.addEventListener('input', filterAndRender);
    categoryFilter.addEventListener('change', filterAndRender);
    populateCategories();
    renderClothes(clothesData);
});
