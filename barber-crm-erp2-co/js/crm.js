document.addEventListener('DOMContentLoaded', () => {
    const formClient = document.getElementById('form-client');
    const tableClients = document.querySelector('#table-clients tbody');
    const clientIdInput = document.getElementById('client-id');
    const btnCancel = document.getElementById('btn-cancel-client');

    function renderClients() {
        const clients = StorageManager.get('clients');
        tableClients.innerHTML = '';
        clients.forEach(client => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${client.name}</td>
                <td>${client.phone}</td>
                <td>${client.email}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editClient('${client.id}')">✏️ Editar</button>
                    <button class="action-btn delete-btn" onclick="deleteClient('${client.id}')">🗑️ Eliminar</button>
                </td>
            `;
            tableClients.appendChild(tr);
        });
        updateDashboard();
        updateAppointmentSelects();
    }

    formClient.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = clientIdInput.value;
        const name = document.getElementById('client-name').value;
        const phone = document.getElementById('client-phone').value;
        const email = document.getElementById('client-email').value;

        let clients = StorageManager.get('clients');

        if (id) {
            // Update
            clients = clients.map(c => c.id === id ? { id, name, phone, email } : c);
        } else {
            // Create
            clients.push({ id: StorageManager.generateId(), name, phone, email });
        }

        StorageManager.save('clients', clients);
        formClient.reset();
        clientIdInput.value = '';
        btnCancel.style.display = 'none';
        renderClients();
    });

    window.editClient = (id) => {
        const clients = StorageManager.get('clients');
        const client = clients.find(c => c.id === id);
        if (client) {
            clientIdInput.value = client.id;
            document.getElementById('client-name').value = client.name;
            document.getElementById('client-phone').value = client.phone;
            document.getElementById('client-email').value = client.email;
            btnCancel.style.display = 'inline-block';
        }
    };

    window.deleteClient = (id) => {
        if (confirm('¿Estás seguro de eliminar este cliente?')) {
            let clients = StorageManager.get('clients');
            clients = clients.filter(c => c.id !== id);
            StorageManager.save('clients', clients);
            renderClients();
        }
    };

    btnCancel.addEventListener('click', () => {
        formClient.reset();
        clientIdInput.value = '';
        btnCancel.style.display = 'none';
    });

    // Initial render
    renderClients();
});
