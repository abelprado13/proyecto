document.addEventListener('DOMContentLoaded', () => {
    let inventory = StorageManager.get('inventory') || [];
    let hasSeeded = localStorage.getItem('has_seeded_images_v1');
    
    // Si no hemos precargado las fotos iniciales aún, lo hacemos ahora mismo por esta única ocasión
    if (!hasSeeded) {
        const seedData = [
            // Servicios (Cortes)
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte César', price: '150.00', image: 'css/cortes/Corte-Cesar-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Mohicano', price: '180.00', image: 'css/cortes/Corte-Mohicano-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Degradado (Fade)', price: '200.00', image: 'css/cortes/Corte-degradado-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Comb Over', price: '160.00', image: 'css/cortes/Corte-pelo-comb-over.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte con Rayas', price: '220.00', image: 'css/cortes/Corte-rayas-masculino.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Seta', price: '140.00', image: 'css/cortes/Corte-seta-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Spiky', price: '170.00', image: 'css/cortes/Corte-spiky-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Taper', price: '190.00', image: 'css/cortes/Corte-taper-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Clásico', price: '130.00', image: 'css/cortes/corte-clasico-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Fade', price: '200.00', image: 'css/cortes/corte-fade-para-hombres.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte con Flequillo', price: '160.00', image: 'css/cortes/corte-flequillo-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Pompadour', price: '250.00', image: 'css/cortes/corte-hombre-Pompadour.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Corte Rapado', price: '100.00', image: 'css/cortes/corte-rapado-hombre.jpg' },
            { id: StorageManager.generateId(), type: 'Servicio', name: 'Undercut', price: '180.00', image: 'css/cortes/undercut-masculino.jpg' },
            
            // Productos
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 1', price: '120.00', image: 'css/productos/ti1.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 2', price: '130.00', image: 'css/productos/ti2.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 3', price: '150.00', image: 'css/productos/ti3.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 4', price: '200.00', image: 'css/productos/ti4.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 5', price: '90.00', image: 'css/productos/ti5.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 6', price: '140.00', image: 'css/productos/ti6.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 7', price: '180.00', image: 'css/productos/ti7.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 8', price: '210.00', image: 'css/productos/ti8.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 9', price: '110.00', image: 'css/productos/ti9.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 10', price: '160.00', image: 'css/productos/ti10.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 11', price: '170.00', image: 'css/productos/ti11.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 12', price: '190.00', image: 'css/productos/ti12.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 13', price: '220.00', image: 'css/productos/ti13.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 14', price: '135.00', image: 'css/productos/ti14.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 15', price: '145.00', image: 'css/productos/ti15.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 16', price: '185.00', image: 'css/productos/ti16.png' },
            { id: StorageManager.generateId(), type: 'Producto', name: 'Producto Ti 17', price: '250.00', image: 'css/productos/ti17.png' }
        ];

        // Mezclamos lo que ya tenías guardado con las nuevas fotos
        const newInventory = [...inventory, ...seedData];
        StorageManager.save('inventory', newInventory);
        
        // Marcamos que ya subimos las fotos para que no se vuelvan a subir si recargas la página
        localStorage.setItem('has_seeded_images_v1', 'true');
        
        // Forzamos un pequeño recargo para que los veas inmediatamente
        setTimeout(() => {
            location.reload();
        }, 100);
    }
});
