// ─── Cart ─────────────────────────────────────────────────────────────────────
const Cart = {
    get() { return StorageManager.get('cart'); },
    save(items) { StorageManager.save('cart', items); },
    add(item) {
        const cart = this.get();
        const existing = cart.find(c => c.id === item.id);
        if (existing) { existing.qty = (existing.qty||1) + 1; }
        else { cart.push({ ...item, qty: 1 }); }
        this.save(cart);
        this.updateBadge();
    },
    remove(id) {
        const cart = this.get().filter(c => c.id !== id);
        this.save(cart);
        this.updateBadge();
    },
    updateQty(id, qty) {
        const cart = this.get();
        const item = cart.find(c => c.id === id);
        if (item) { item.qty = Math.max(1, qty); }
        this.save(cart);
    },
    clear() { StorageManager.save('cart', []); this.updateBadge(); },
    total() { return this.get().reduce((s, i) => s + parseFloat(i.price) * (i.qty||1), 0); },
    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;
        const count = this.get().reduce((s, i) => s + (i.qty||1), 0);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    },
    luhnCheck(num) {
        const digits = num.replace(/\D/g,'').split('').reverse().map(Number);
        const sum = digits.reduce((acc, d, i) => {
            if (i % 2 !== 0) { d *= 2; if (d > 9) d -= 9; }
            return acc + d;
        }, 0);
        return sum % 10 === 0;
    }
};
