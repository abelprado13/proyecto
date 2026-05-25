document.addEventListener('DOMContentLoaded', () => {
    const formAppointment = document.getElementById('form-appointment');
    const tableAppointments = document.querySelector('#table-appointments tbody');
    const appointmentIdInput = document.getElementById('appointment-id');

    window.updateAppointmentSelects = () => {
        const clientSelect = document.getElementById('appointment-client');
        const serviceSelect = document.getElementById('appointment-service');
        
        const clients = StorageManager.get('clients');
        const inventory = StorageManager.get('inventory');

        clientSelect.innerHTML = clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        serviceSelect.innerHTML = inventory.map(i => `<option value="${i.id}">${i.name} ($${i.price})</option>`).join('');
    };

    function renderAppointments() {
        const appointments = StorageManager.get('appointments');
        const clients = StorageManager.get('clients');
        const inventory = StorageManager.get('inventory');

        tableAppointments.innerHTML = '';
        appointments.forEach(app => {
            const client = clients.find(c => c.id === app.clientId);
            const item = inventory.find(i => i.id === app.itemId);
            
            const clientName = client ? client.name : 'Cliente Eliminado';
            const itemName = item ? item.name : 'Ítem Eliminado';
            
            const date = new Date(app.date).toLocaleString('es-ES');

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${clientName}</td>
                <td>${itemName}</td>
                <td>${date}</td>
                <td><span class="status ${app.status === 'Pendiente' ? 'pending' : 'completed'}">${app.status}</span></td>
                <td>
                    ${app.status === 'Pendiente' ? `<button class="action-btn complete-btn" onclick="completeAppointment('${app.id}')">✔️ Completar</button>` : ''}
                    <button class="action-btn delete-btn" onclick="deleteAppointment('${app.id}')">🗑️ Eliminar</button>
                </td>
            `;
            tableAppointments.appendChild(tr);
        });
        updateDashboard();
    }

    formAppointment.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = appointmentIdInput.value;
        const clientId = document.getElementById('appointment-client').value;
        const itemId = document.getElementById('appointment-service').value;
        const date = document.getElementById('appointment-date').value;

        if (!clientId || !itemId) {
            alert('Debes registrar al menos un cliente y un servicio/producto primero.');
            return;
        }

        let appointments = StorageManager.get('appointments');

        if (id) {
            appointments = appointments.map(a => a.id === id ? { ...a, clientId, itemId, date } : a);
        } else {
            appointments.push({ 
                id: StorageManager.generateId(), 
                clientId, 
                itemId, 
                date,
                status: 'Pendiente' 
            });
            
            // Send WhatsApp notification
            const clients = StorageManager.get('clients');
            const inventory = StorageManager.get('inventory');
            const client = clients.find(c => c.id === clientId);
            const item = inventory.find(i => i.id === itemId);
            
            if (client && client.phone) {
                if (confirm(`¿Deseas enviar un mensaje de confirmación a ${client.name} por WhatsApp?`)) {
                    const formattedDate = new Date(date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
                    const message = `Hola ${client.name}, tu cita para el servicio/producto "${item.name}" ha sido agendada para el ${formattedDate}. ¡Te esperamos!`;
                    // Clean phone number (remove non-digits, you might need country code if not included)
                    const cleanPhone = client.phone.replace(/\\D/g, '');
                    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }
            } else if (client && !client.phone) {
                alert(`Cita agendada, pero el cliente ${client.name} no tiene un número de teléfono registrado para notificar.`);
            }
        }

        StorageManager.save('appointments', appointments);
        formAppointment.reset();
        appointmentIdInput.value = '';
        renderAppointments();
    });

    window.completeAppointment = (id) => {
        let appointments = StorageManager.get('appointments');
        appointments = appointments.map(a => a.id === id ? { ...a, status: 'Completada' } : a);
        StorageManager.save('appointments', appointments);
        renderAppointments();
    };

    window.deleteAppointment = (id) => {
        if (confirm('¿Estás seguro de eliminar esta cita?')) {
            let appointments = StorageManager.get('appointments');
            appointments = appointments.filter(a => a.id !== id);
            StorageManager.save('appointments', appointments);
            renderAppointments();
        }
    };

    // Initial render
    updateAppointmentSelects();
    renderAppointments();
});
