// ═══════════════════════════════════════════════════
//  CLIENT-APP.JS — Portal del Cliente
// ═══════════════════════════════════════════════════

/* ── Toast helper ── */
function toast(msg, type='') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'show' + (type ? ' toast-'+type : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = '', 3500);
}

/* ── Navigation ── */
function goTo(target) {
    document.querySelectorAll('.c-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.c-nav li').forEach(l => l.classList.remove('active'));
    document.getElementById('s-'+target).classList.add('active');
    document.querySelector(`.c-nav li[data-target="${target}"]`).classList.add('active');
    if (target === 'catalogo') renderCatalog();
    if (target === 'carrito') renderCart();
    if (target === 'cuenta') renderAccount();
    if (target === 'inicio') renderHome();
    if (target === 'citas') { renderMyAppts(); if(window._cal) window._cal.render(); }
}

document.querySelectorAll('.c-nav li').forEach(li => {
    li.addEventListener('click', () => {
        goTo(li.dataset.target);
        document.querySelector('.c-sidebar').classList.remove('open');
    });
});

/* ── Auth ── */
function switchAuth(tab) {
    document.getElementById('form-login').style.display = tab === 'login' ? '' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? '' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-pass').value;
    const res = Auth.login(username, pass);
    if (!res.success) {
        const el = document.getElementById('login-err');
        el.textContent = res.error; el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 3000);
    } else { initPortal(); }
}

function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-pass').value;
    if (!name || !username || !pass) { showRegErr('Completa todos los campos requeridos.'); return; }
    if (pass.length < 6) { showRegErr('La contraseña debe tener al menos 6 caracteres.'); return; }
    const res = Auth.register(name, phone, username, pass);
    if (!res.success) { showRegErr(res.error); } else { initPortal(); }
}

function showRegErr(msg) {
    const el = document.getElementById('reg-err');
    el.textContent = msg; el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}

function initPortal() {
    const user = Auth.getCurrentUser();
    if (!user) { document.getElementById('auth-overlay').style.display = 'flex'; return; }
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('sb-username').textContent = `Hola, ${user.name.split(' ')[0]} 👋`;
    document.getElementById('sb-user-name').textContent = user.name;
    document.getElementById('sb-user-username').textContent = user.username || user.email || '—';
    document.getElementById('welcome-name').textContent = user.name.split(' ')[0];
    Cart.updateBadge();
    initCalendar();
    renderHome();
}

/* ── Home stats ── */
function renderHome() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    const appts = StorageManager.get('appointments').filter(a => a.clientId === user.id);
    const orders = StorageManager.get('orders').filter(o => o.clientId === user.id);
    const inventory = StorageManager.get('inventory');
    document.getElementById('my-appt-count').textContent = appts.length;
    document.getElementById('my-order-count').textContent = orders.length;
    document.getElementById('services-count').textContent = inventory.filter(i => i.type === 'Servicio').length;
}

/* ── Catalog ── */
let catFilter = 'all', catSearch = '';

function renderCatalog() {
    const inventory = StorageManager.get('inventory');
    let items = inventory.filter(i => catFilter === 'all' || i.type === catFilter);
    if (catSearch) items = items.filter(i => i.name.toLowerCase().includes(catSearch.toLowerCase()));
    const grid = document.getElementById('catalog-grid');
    if (!items.length) { grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1">No se encontraron ítems.</p>'; return; }
    grid.innerHTML = items.map(item => {
        const img = item.image
            ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">`
            : `<div class="cat-img-placeholder">${item.type === 'Servicio' ? '✂️' : '🛍️'}</div>`;
        const isProduct = item.type === 'Producto';
        const btn = isProduct
            ? `<button class="btn btn-primary btn-sm" onclick="addToCart('${item.id}')">🛒 Agregar</button>`
            : `<button class="btn btn-secondary btn-sm" onclick="openBookFromCatalog('${item.id}')">📅 Agendar</button>`;
        return `<div class="cat-card">
            ${img}
            <div class="cat-card-body">
                <div class="cat-type">${item.type}</div>
                <h3>${item.name}</h3>
                <div class="price">$${parseFloat(item.price).toFixed(2)}</div>
                ${btn}
            </div>
        </div>`;
    }).join('');
}

document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        catFilter = btn.dataset.filter;
        renderCatalog();
    });
});
document.getElementById('cat-search').addEventListener('input', e => { catSearch = e.target.value; renderCatalog(); });

/* ── Add to cart ── */
function addToCart(id) {
    const item = StorageManager.get('inventory').find(i => i.id === id);
    if (!item) return;
    Cart.add(item);
    toast(`✅ "${item.name}" agregado al carrito`, 'success');
}

/* ── Book from catalog ── */
function openBookFromCatalog(id) {
    window._preselectedService = id;
    goTo('citas');
}

/* ── Calendar ── */
function initCalendar() {
    window._cal = new BarberCalendar('client-calendar', (date, time) => {
        openBookModal(date, time);
    });
}

let _bookDate = '', _bookTime = '';
function openBookModal(date, time) {
    _bookDate = date; _bookTime = time;
    const services = StorageManager.get('inventory').filter(i => i.type === 'Servicio');
    const sel = document.getElementById('book-service');
    sel.innerHTML = services.map(s => `<option value="${s.id}">${s.name} — $${parseFloat(s.price).toFixed(2)}</option>`).join('');
    if (window._preselectedService) {
        sel.value = window._preselectedService;
        window._preselectedService = null;
    }
    updateBookSummary();
    sel.onchange = updateBookSummary;
    document.getElementById('book-modal').classList.add('active');
}

function updateBookSummary() {
    const sid = document.getElementById('book-service').value;
    const svc = StorageManager.get('inventory').find(i => i.id === sid);
    const d = new Date(_bookDate + 'T12:00:00');
    const dStr = d.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    document.getElementById('book-summary').innerHTML = `
        <div style="display:flex;flex-direction:column;gap:.4rem;">
            <div>📅 <b>Fecha:</b> ${dStr}</div>
            <div>⏰ <b>Hora:</b> ${_bookTime}</div>
            <div>✂️ <b>Servicio:</b> ${svc ? svc.name : '—'}</div>
            <div>💰 <b>Precio:</b> $${svc ? parseFloat(svc.price).toFixed(2) : '0.00'}</div>
        </div>`;
}

function confirmBooking() {
    const user = Auth.getCurrentUser();
    if (!user) { toast('Debes iniciar sesión', 'error'); return; }
    const sid = document.getElementById('book-service').value;
    if (!sid) { toast('Selecciona un servicio', 'error'); return; }
    const appts = StorageManager.get('appointments');
    const conflict = appts.find(a => a.date === _bookDate && a.time === _bookTime && a.status !== 'cancelled');
    if (conflict) { toast('Ese horario ya fue tomado. Elige otro.', 'error'); return; }
    const newAppt = {
        id: StorageManager.generateId(),
        clientId: user.id,
        serviceId: sid,
        date: _bookDate,
        time: _bookTime,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    appts.push(newAppt);
    StorageManager.save('appointments', appts);
    document.getElementById('book-modal').classList.remove('active');
    window._cal.render();
    renderMyAppts();
    toast('✅ Cita solicitada. El admin la confirmará pronto.', 'success');
}

/* ── My appointments ── */
function renderMyAppts() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    const appts = StorageManager.get('appointments').filter(a => a.clientId === user.id);
    const inventory = StorageManager.get('inventory');
    const container = document.getElementById('my-appts-list');
    if (!appts.length) { container.innerHTML = '<p style="color:var(--muted)">Sin citas registradas aún.</p>'; return; }
    const statusLabel = { pending:'Pendiente', confirmed:'Confirmada', completed:'Completada', cancelled:'Cancelada' };
    const statusClass = { pending:'badge-pending', confirmed:'badge-confirmed', completed:'badge-completed', cancelled:'badge-cancelled' };
    container.innerHTML = appts.sort((a,b) => new Date(a.date+' '+a.time) - new Date(b.date+' '+b.time)).map(a => {
        const svc = inventory.find(i => i.id === a.serviceId);
        const d = new Date(a.date + 'T12:00:00');
        const dStr = d.toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' });
        return `<div class="appt-card">
            <div class="ac-icon">✂️</div>
            <div class="ac-info">
                <h4>${svc ? svc.name : 'Servicio'}</h4>
                <p>📅 ${dStr} a las ${a.time}</p>
                <span class="badge ${statusClass[a.status]||'badge-pending'}" style="margin-top:.3rem">${statusLabel[a.status]||a.status}</span>
            </div>
        </div>`;
    }).join('');
}

/* ── Cart rendering ── */
function renderCart() {
    const items = Cart.get();
    const list = document.getElementById('cart-items-list');
    const total = document.getElementById('cart-total');
    if (!items.length) {
        list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted)"><div style="font-size:4rem">🛒</div><p style="margin-top:1rem">Tu carrito está vacío.</p><button class="btn btn-primary" style="margin-top:1rem" onclick="goTo(\'catalogo\')">Ver catálogo</button></div>';
        total.textContent = '$0.00'; return;
    }
    list.innerHTML = items.map(item => {
        const img = item.image
            ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<div class=cart-item-img>🛍️</div>'">`
            : `<div class="cart-item-img">🛍️</div>`;
        return `<div class="cart-item">
            ${img}
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="ci-price">$${(parseFloat(item.price)*(item.qty||1)).toFixed(2)}</div>
            </div>
            <div class="cart-qty">
                <button class="qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
                <span>${item.qty||1}</span>
                <button class="qty-btn" onclick="changeQty('${item.id}',1)">+</button>
            </div>
            <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.id}')">🗑️</button>
        </div>`;
    }).join('');
    total.textContent = `$${Cart.total().toFixed(2)}`;
}

function changeQty(id, delta) {
    const cart = Cart.get();
    const item = cart.find(c => c.id === id);
    if (!item) return;
    const newQty = (item.qty||1) + delta;
    if (newQty < 1) { Cart.remove(id); } else { Cart.updateQty(id, newQty); }
    Cart.updateBadge();
    renderCart();
}
function removeFromCart(id) { Cart.remove(id); renderCart(); }

/* ── Payment ── */
let payMethod = 'card';
function openPayment() {
    if (!Cart.get().length) { toast('El carrito está vacío','error'); return; }
    document.getElementById('pay-total').textContent = '$'+Cart.total().toFixed(2);
    document.getElementById('payment-modal').classList.add('active');
}
function selectPayMethod(m) {
    payMethod = m;
    document.getElementById('pm-card').classList.toggle('active', m==='card');
    document.getElementById('pm-cash').classList.toggle('active', m==='cash');
    document.getElementById('card-form').style.display = m==='card' ? '' : 'none';
    document.getElementById('cash-info').style.display = m==='cash' ? '' : 'none';
}
function fmtCard(el) {
    let v = el.value.replace(/\D/g,'').substring(0,16);
    el.value = v.replace(/(.{4})/g,'$1 ').trim();
    document.getElementById('cv-num').textContent = el.value || '•••• •••• •••• ••••';
}
function fmtExp(el) {
    let v = el.value.replace(/\D/g,'');
    if (v.length >= 2) v = v.substring(0,2)+'/'+v.substring(2,4);
    el.value = v;
    document.getElementById('cv-exp').textContent = el.value || 'MM/AA';
}
document.getElementById('card-name').addEventListener('input', e => {
    document.getElementById('cv-name').textContent = e.target.value.toUpperCase() || 'NOMBRE TITULAR';
});

function processPayment() {
    const user = Auth.getCurrentUser();
    if (!user) { toast('Debes iniciar sesión','error'); return; }
    if (payMethod === 'card') {
        const num = document.getElementById('card-num').value.replace(/\s/g,'');
        const name = document.getElementById('card-name').value.trim();
        const exp = document.getElementById('card-exp').value;
        const cvv = document.getElementById('card-cvv').value;
        if (!num || !name || !exp || !cvv) { toast('Completa todos los datos de la tarjeta','error'); return; }
        if (!Cart.luhnCheck(num)) { toast('Número de tarjeta inválido','error'); return; }
        if (cvv.length < 3) { toast('CVV inválido','error'); return; }
    }
    const order = {
        id: StorageManager.generateId(),
        clientId: user.id,
        clientName: user.name,
        items: Cart.get().map(i => ({ id:i.id, name:i.name, price:i.price, qty:i.qty||1 })),
        total: Cart.total(),
        paymentMethod: payMethod,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    const orders = StorageManager.get('orders');
    orders.push(order);
    StorageManager.save('orders', orders);
    Cart.clear();
    document.getElementById('payment-modal').classList.remove('active');
    renderCart();
    toast('🎉 ¡Compra realizada con éxito!', 'success');
    renderHome();
}

/* ── My account ── */
function renderAccount() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    const appts = StorageManager.get('appointments').filter(a => a.clientId === user.id);
    const orders = StorageManager.get('orders').filter(o => o.clientId === user.id);
    const inventory = StorageManager.get('inventory');
    const statusLabel = { pending:'⏳ Pendiente', confirmed:'✅ Confirmada', completed:'🏁 Completada', cancelled:'❌ Cancelada' };
    const statusClass = { pending:'badge-pending', confirmed:'badge-confirmed', completed:'badge-completed', cancelled:'badge-cancelled' };

    // Fill profile info
    const fullUser = StorageManager.get('users').find(u => u.id === user.id);
    if(fullUser) {
        document.getElementById('prof-name').value = fullUser.name || '';
        document.getElementById('prof-phone').value = fullUser.phone || '';
        document.getElementById('prof-username').value = fullUser.username || fullUser.email || '';
        document.getElementById('prof-pass').value = fullUser.password || '';
    }

    const apptEl = document.getElementById('account-appts');
    apptEl.innerHTML = appts.length ? appts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(a => {
        const svc = inventory.find(i => i.id === a.serviceId);
        const d = new Date(a.date + 'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});
        return `<div class="appt-card">
            <div class="ac-icon">✂️</div>
            <div class="ac-info">
                <h4>${svc ? svc.name : 'Servicio eliminado'}</h4>
                <p>📅 ${d} · ${a.time}</p>
                <span class="badge ${statusClass[a.status]||'badge-pending'}" style="margin-top:.3rem">${statusLabel[a.status]||a.status}</span>
            </div>
        </div>`;
    }).join('') : '<p style="color:var(--muted)">Sin citas aún.</p>';

    const ordEl = document.getElementById('account-orders');
    ordEl.innerHTML = orders.length ? orders.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(o => {
        const d = new Date(o.createdAt).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'});
        const items = o.items.map(i=>`${i.name} x${i.qty}`).join(', ');
        return `<div class="appt-card">
            <div class="ac-icon">🛍️</div>
            <div class="ac-info">
                <h4>$${parseFloat(o.total).toFixed(2)} — ${o.paymentMethod==='card'?'💳 Tarjeta':'💵 Efectivo'}</h4>
                <p>${items}</p>
                <p style="color:var(--muted);font-size:.8rem">📅 ${d}</p>
                <span class="badge ${o.status==='completed'?'badge-completed':'badge-pending'}" style="margin-top:.3rem">${o.status==='completed'?'Completada':'Pendiente'}</span>
            </div>
        </div>`;
    }).join('') : '<p style="color:var(--muted)">Sin compras aún.</p>';
}

/* ── Profile Actions ── */
function updateProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    const name = document.getElementById('prof-name').value.trim();
    const phone = document.getElementById('prof-phone').value.trim();
    const pass = document.getElementById('prof-pass').value;
    
    if (!name || !pass) { toast('Nombre y contraseña son obligatorios', 'error'); return; }
    if (pass.length < 6) { toast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }

    const users = StorageManager.get('users');
    const u = users.find(x => x.id === user.id);
    if (u) { u.name = name; u.phone = phone; u.password = pass; }
    StorageManager.save('users', users);

    const clients = StorageManager.get('clients');
    const c = clients.find(x => x.id === user.id);
    if (c) { c.name = name; c.phone = phone; }
    StorageManager.save('clients', clients);

    user.name = name; user.phone = phone;
    Auth.setCurrentUser(user);

    initPortal();
    toast('✅ Perfil actualizado correctamente', 'success');
}

function deleteAccount() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    if (!confirm('¿Seguro que deseas eliminar tu cuenta permanentemente? Esta acción no se puede deshacer y perderás tus beneficios y citas.')) return;
    
    StorageManager.save('users', StorageManager.get('users').filter(u => u.id !== user.id));
    StorageManager.save('clients', StorageManager.get('clients').filter(c => c.id !== user.id));
    
    Auth.logout();
}

/* ── INIT ── */
initPortal();
