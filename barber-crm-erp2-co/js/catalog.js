document.addEventListener('DOMContentLoaded', () => {
    const catalogServicesContainer = document.getElementById('catalog-services');
    const catalogProductsContainer = document.getElementById('catalog-products');
    const searchInput = document.getElementById('catalog-search');

    function renderCatalogCards(items, container, emptyText) {
        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = `<p class="empty-message">${emptyText}</p>`;
            return;
        }

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'catalog-card';
            
            const imgHtml = item.image 
                ? `<img src="${item.image}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px; margin-bottom: 1rem;">`
                : `<div style="width: 100%; height: 180px; background: #333; border-radius: 6px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: #666;">Sin imagen</div>`;

            card.innerHTML = `
                ${imgHtml}
                <h3>${item.name}</h3>
                <div class="price">$${parseFloat(item.price).toFixed(2)}</div>
            `;
            container.appendChild(card);
        });
    }

    // Expose this globally so it can be called if inventory is updated while on this tab
    window.renderCatalog = (searchTerm = '') => {
        if (!catalogServicesContainer || !catalogProductsContainer) return;

        const inventory = StorageManager.get('inventory');
        const lowerTerm = searchTerm.toLowerCase();

        const filteredInventory = inventory.filter(item => 
            item.name.toLowerCase().includes(lowerTerm)
        );

        const services = filteredInventory.filter(item => item.type === 'Servicio');
        const products = filteredInventory.filter(item => item.type === 'Producto');

        renderCatalogCards(services, catalogServicesContainer, 'No se encontraron servicios.');
        renderCatalogCards(products, catalogProductsContainer, 'No se encontraron productos.');
    };

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            window.renderCatalog(e.target.value);
        });
    }

    // Initial render
    window.renderCatalog();
});
