// ─── StorageManager ───────────────────────────────────────────────────────────
class StorageManager {
    static get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }
    static getObj(key, defaultVal = {}) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultVal;
    }
    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }
    static generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
}

// ─── Initial data stores ──────────────────────────────────────────────────────
const INITIAL_DATA = {
    clients: [],
    inventory: [],
    appointments: [],
    orders: [],
    schedules: [],
    users: []
};

for (const key in INITIAL_DATA) {
    if (!localStorage.getItem(key)) {
        StorageManager.save(key, INITIAL_DATA[key]);
    }
}
