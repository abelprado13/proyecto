// ─── Auth ─────────────────────────────────────────────────────────────────────
const Auth = {
    getCurrentUser() {
        const d = localStorage.getItem('currentUser');
        return d ? JSON.parse(d) : null;
    },
    setCurrentUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },
    register(name, phone, username, password) {
        const users = StorageManager.get('users');
        if (users.find(u => (u.username||u.email||'').toLowerCase() === username.toLowerCase())) {
            return { success: false, error: 'Este usuario ya está registrado.' };
        }
        const id = StorageManager.generateId();
        const user = { id, name, phone, username, password, createdAt: new Date().toISOString() };
        users.push(user);
        StorageManager.save('users', users);

        // Mirror into CRM clients list
        const clients = StorageManager.get('clients');
        if (!clients.find(c => c.id === id)) {
            clients.push({ id, name, phone, username });
            StorageManager.save('clients', clients);
        }

        this.setCurrentUser({ id, name, phone, username });
        return { success: true, user };
    },
    login(username, password) {
        const users = StorageManager.get('users');
        const user = users.find(u => (u.username||u.email||'').toLowerCase() === username.toLowerCase() && u.password === password);
        if (!user) return { success: false, error: 'Usuario o contraseña incorrectos.' };
        this.setCurrentUser({ id: user.id, name: user.name, phone: user.phone, username: user.username || user.email });
        return { success: true, user };
    }
};
