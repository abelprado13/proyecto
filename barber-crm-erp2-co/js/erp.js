document.addEventListener('DOMContentLoaded', () => {
    const formItem = document.getElementById('form-item');
    const tableInventory = document.querySelector('#table-inventory tbody');
    const itemIdInput = document.getElementById('item-id');
    const btnCancel = document.getElementById('btn-cancel-item');

    function processImage(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8)); // Compress as JPEG
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

    function renderInventory() {
        const inventory = StorageManager.get('inventory');
        tableInventory.innerHTML = '';
        inventory.forEach(item => {
            const tr = document.createElement('tr');
            const imgHtml = item.image 
                ? `<img src="${item.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; border:1px solid var(--border-color);">`
                : `<div style="width:40px; height:40px; background:#333; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:10px; color:#888;">N/A</div>`;
                
            tr.innerHTML = `
                <td>${imgHtml}</td>
                <td><span class="status ${item.type === 'Servicio' ? 'pending' : 'completed'}">${item.type}</span></td>
                <td>${item.name}</td>
                <td>$${parseFloat(item.price).toFixed(2)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editItem('${item.id}')">✏️ Editar</button>
                    <button class="action-btn delete-btn" onclick="deleteItem('${item.id}')">🗑️ Eliminar</button>
                </td>
            `;
            tableInventory.appendChild(tr);
        });
        updateDashboard();
        updateAppointmentSelects();
    }

    formItem.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = itemIdInput.value;
        const type = document.getElementById('item-type').value;
        const name = document.getElementById('item-name').value;
        const price = document.getElementById('item-price').value;
        const imageInput = document.getElementById('item-image');

        let inventory = StorageManager.get('inventory');
        let imageBase64 = null;

        // Process image if selected
        if (imageInput.files && imageInput.files[0]) {
            try {
                // Show a brief loading state on button
                const submitBtn = formItem.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;
                submitBtn.innerText = 'Procesando...';
                submitBtn.disabled = true;
                
                imageBase64 = await processImage(imageInput.files[0]);
                
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            } catch (err) {
                alert("Error al procesar la imagen. Intenta con otra.");
                return;
            }
        } else if (id) {
            // If editing and no new image, keep the old one
            const existingItem = inventory.find(i => i.id === id);
            if (existingItem) {
                imageBase64 = existingItem.image || null;
            }
        }

        if (id) {
            // Update
            inventory = inventory.map(i => i.id === id ? { id, type, name, price, image: imageBase64 } : i);
        } else {
            // Create
            inventory.push({ id: StorageManager.generateId(), type, name, price, image: imageBase64 });
        }

        StorageManager.save('inventory', inventory);
        formItem.reset();
        itemIdInput.value = '';
        btnCancel.style.display = 'none';
        renderInventory();
        if (typeof window.renderCatalog === 'function') window.renderCatalog();
    });

    window.editItem = (id) => {
        const inventory = StorageManager.get('inventory');
        const item = inventory.find(i => i.id === id);
        if (item) {
            itemIdInput.value = item.id;
            document.getElementById('item-type').value = item.type;
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-price').value = item.price;
            document.getElementById('item-image').value = ''; // Reset file input
            btnCancel.style.display = 'inline-block';
        }
    };

    window.deleteItem = (id) => {
        if (confirm('¿Estás seguro de eliminar este ítem?')) {
            let inventory = StorageManager.get('inventory');
            inventory = inventory.filter(i => i.id !== id);
            StorageManager.save('inventory', inventory);
            renderInventory();
            if (typeof window.renderCatalog === 'function') window.renderCatalog();
        }
    };

    btnCancel.addEventListener('click', () => {
        formItem.reset();
        itemIdInput.value = '';
        btnCancel.style.display = 'none';
    });

    // Initial render
    renderInventory();
});
