document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation Logic
    const navLinks = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active class from all links and tabs
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // Add active class to clicked link and corresponding tab
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Global function to update Dashboard counters
    window.updateDashboard = () => {
        const clientsCount = StorageManager.get('clients').length;
        const inventoryCount = StorageManager.get('inventory').length;
        
        const appointments = StorageManager.get('appointments');
        const pendingAppointments = appointments.filter(a => a.status === 'Pendiente').length;

        document.getElementById('total-clients').textContent = clientsCount;
        document.getElementById('total-inventory').textContent = inventoryCount;
        document.getElementById('total-appointments').textContent = pendingAppointments;
    };

    // Initial Dashboard Update
    updateDashboard();
});
