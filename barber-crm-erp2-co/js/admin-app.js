// ═══════════════════════════════════════════════════
//  ADMIN-APP.JS — Portal del Administrador
// ═══════════════════════════════════════════════════

/* ── Auth guard ── */
if (localStorage.getItem('adminAuth') !== 'true') {
    window.location.href = 'index.html';
}

/* ── Toast ── */
function toast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'show' + (type ? ' toast-' + type : '');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = '', 3500);
}

/* ── Navigation ── */
document.querySelectorAll('.a-nav li').forEach(li => {
    li.addEventListener('click', () => {
        document.querySelectorAll('.a-nav li').forEach(x => x.classList.remove('active'));
        document.querySelectorAll('.a-section').forEach(x => x.classList.remove('active'));
        li.classList.add('active');
        const map = {
            dashboard: 'a-dashboard', pending: 'a-pending', sales: 'a-sales',
            crm: 'a-crm', inventory: 'a-inventory', schedules: 'a-schedules', 'catalog-prev': 'a-catalog-prev'
        };
        const secId = map[li.dataset.target];
        if (secId) document.getElementById(secId).classList.add('active');
        if (li.dataset.target === 'dashboard') renderDashboard();
        if (li.dataset.target === 'pending') renderPending();
        if (li.dataset.target === 'sales') renderSales();
        if (li.dataset.target === 'crm') renderCRM();
        if (li.dataset.target === 'inventory') renderInventory();
        if (li.dataset.target === 'schedules') renderSchedules();
        if (li.dataset.target === 'catalog-prev') renderAdminCatalog();
        document.querySelector('.a-sidebar').classList.remove('open');
    });
});

function exitAdmin() {
    localStorage.removeItem('adminAuth');
    window.location.href = 'index.html';
}

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */
function renderDashboard() {
    const clients   = StorageManager.get('clients');
    const appts     = StorageManager.get('appointments');
    const orders    = StorageManager.get('orders');
    const inventory = StorageManager.get('inventory');

    const pending   = appts.filter(a => a.status === 'pending').length;
    const confirmed = appts.filter(a => a.status === 'confirmed').length;
    const totalSales = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0);

    document.getElementById('d-clients').textContent   = clients.length;
    document.getElementById('d-pending').textContent   = pending;
    document.getElementById('d-confirmed').textContent = confirmed;
    document.getElementById('d-sales').textContent     = '$' + totalSales.toFixed(2);
    document.getElementById('d-inventory').textContent = inventory.length;
    document.getElementById('d-orders').textContent    = orders.length;

    // Pending dot on sidebar
    const dot = document.getElementById('pending-dot');
    dot.textContent = pending;
    dot.classList.toggle('show', pending > 0);

    // Upcoming confirmed
    const now = new Date();
    const upcoming = appts
        .filter(a => a.status === 'confirmed' && new Date(a.date + 'T' + a.time) >= now)
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
        .slice(0, 5);

    const inv = StorageManager.get('inventory');
    const cls = StorageManager.get('clients');
    const ul  = document.getElementById('upcoming-list');
    if (!upcoming.length) {
        ul.innerHTML = '<p style="color:var(--muted)">No hay citas confirmadas próximas.</p>';
        return;
    }
    ul.innerHTML = upcoming.map(a => {
        const client = cls.find(c => c.id === a.clientId);
        const svc    = inv.find(i => i.id === a.serviceId);
        const init   = client ? client.name.charAt(0).toUpperCase() : '?';
        const d = new Date(a.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
        return `<div class="appt-row">
            <div class="appt-avatar" title="${client ? client.name : ''}">${init}</div>
            <div class="appt-info">
                <h4>${client ? client.name : 'Cliente'}</h4>
                <p>✂️ ${svc ? svc.name : 'Servicio'} · 📅 ${d} · ⏰ ${a.time}</p>
            </div>
            <span class="badge badge-confirmed">Confirmada</span>
        </div>`;
    }).join('');
}

/* ════════════════════════════════════════════
   PENDING APPOINTMENTS
════════════════════════════════════════════ */
let _activeApptId = null;

function renderPending() {
    const appts     = StorageManager.get('appointments').filter(a => a.status === 'pending');
    const clients   = StorageManager.get('clients');
    const inventory = StorageManager.get('inventory');
    const container = document.getElementById('pending-list');

    // Update badge
    const dot = document.getElementById('pending-dot');
    dot.textContent = appts.length;
    dot.classList.toggle('show', appts.length > 0);

    if (!appts.length) {
        container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--muted)"><div style="font-size:4rem">✅</div><p style="margin-top:1rem">No hay citas pendientes. ¡Todo al día!</p></div>';
        return;
    }

    container.innerHTML = appts
        .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
        .map(a => {
            const client = clients.find(c => c.id === a.clientId);
            const svc    = inventory.find(i => i.id === a.serviceId);
            const init   = client ? client.name.charAt(0).toUpperCase() : '?';
            const d = new Date(a.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
            return `<div class="appt-row">
                <div class="appt-avatar" title="Ver perfil" onclick="openClientModal('${a.id}')">${init}</div>
                <div class="appt-info">
                    <h4>${client ? client.name : 'Cliente eliminado'}</h4>
                    <p>✂️ ${svc ? svc.name : 'Servicio'} · 📅 ${d} · ⏰ ${a.time}</p>
                </div>
                <div class="appt-actions">
                    <button class="btn btn-success btn-sm" onclick="openClientModal('${a.id}')">👤 Ver perfil</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectAppointment('${a.id}')">✕ Rechazar</button>
                </div>
            </div>`;
        }).join('');
}

function openClientModal(apptId) {
    _activeApptId = apptId;
    const appts   = StorageManager.get('appointments');
    const clients = StorageManager.get('clients');
    const inv     = StorageManager.get('inventory');
    const a       = appts.find(x => x.id === apptId);
    if (!a) return;
    const client  = clients.find(c => c.id === a.clientId);
    const svc     = inv.find(i => i.id === a.serviceId);
    const init    = client ? client.name.charAt(0).toUpperCase() : '?';

    document.getElementById('cm-avatar').textContent  = init;
    document.getElementById('cm-name').textContent    = client ? client.name : 'Cliente';
    document.getElementById('cm-sub').textContent     = client ? (client.username || client.email || '') : '';

    const d = new Date(a.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('cm-details').innerHTML = `
        <div class="cdr"><span>📱 Teléfono</span><span>${client ? client.phone || 'Sin teléfono' : '—'}</span></div>
        <div class="cdr"><span>✂️ Servicio</span><span>${svc ? svc.name : 'Eliminado'}</span></div>
        <div class="cdr"><span>📅 Fecha</span><span>${d}</span></div>
        <div class="cdr"><span>⏰ Hora</span><span>${a.time}</span></div>
        <div class="cdr"><span>💰 Precio</span><span>$${svc ? parseFloat(svc.price).toFixed(2) : '0.00'}</span></div>
        <div class="cdr"><span>🕐 Solicitada</span><span>${new Date(a.createdAt).toLocaleDateString('es-MX')}</span></div>`;

    document.getElementById('client-modal').classList.add('active');
}

function confirmAppointment() {
    if (!_activeApptId) return;
    const appts   = StorageManager.get('appointments');
    const clients = StorageManager.get('clients');
    const inv     = StorageManager.get('inventory');
    const a       = appts.find(x => x.id === _activeApptId);
    if (!a) return;

    // Update status
    a.status = 'confirmed';
    StorageManager.save('appointments', appts);

    const client = clients.find(c => c.id === a.clientId);
    const svc    = inv.find(i => i.id === a.serviceId);

    document.getElementById('client-modal').classList.remove('active');
    renderPending();
    renderDashboard();
    toast('✅ Cita confirmada. Enviando WhatsApp...', 'success');

    // Send WhatsApp
    if (client && client.phone) {
        const phone   = client.phone.replace(/\D/g, '');
        const d       = new Date(a.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const message = `¡Hola ${client.name}! 💈 Tu cita en *BarberShop Pro* ha sido *confirmada*.\n\n✂️ Servicio: ${svc ? svc.name : ''}\n📅 Fecha: ${d}\n⏰ Hora: ${a.time}\n\n¡Te esperamos! 🙌`;
        setTimeout(() => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank'), 500);
    } else {
        toast('⚠️ El cliente no tiene teléfono registrado para WhatsApp.', '');
    }
}

function cancelAppointmentAdmin() {
    if (!_activeApptId) return;
    if (!confirm('¿Cancelar esta cita?')) return;
    rejectAppointment(_activeApptId);
    document.getElementById('client-modal').classList.remove('active');
}

function rejectAppointment(id) {
    const appts = StorageManager.get('appointments');
    const a = appts.find(x => x.id === id);
    if (a) a.status = 'cancelled';
    StorageManager.save('appointments', appts);
    renderPending();
    renderDashboard();
    toast('Cita cancelada.', '');
}

/* ════════════════════════════════════════════
   SALES / ORDERS
════════════════════════════════════════════ */
function renderSales() {
    const orders  = StorageManager.get('orders');
    const clients = StorageManager.get('clients');
    const tbody   = document.getElementById('sales-body');
    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:2rem">No hay ventas registradas aún.</td></tr>';
        return;
    }
    tbody.innerHTML = orders
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((o, idx) => {
            const client = clients.find(c => c.id === o.clientId);
            const items  = o.items.map(i => `${i.name} x${i.qty}`).join(', ');
            const d      = new Date(o.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
            const payIcon = o.paymentMethod === 'card' ? '💳' : '💵';
            const cls    = o.status === 'completed' ? 'badge-completed' : 'badge-pending';
            const label  = o.status === 'completed' ? 'Completada' : 'Pendiente';
            return `<tr>
                <td><b>#${String(idx+1).padStart(3,'0')}</b></td>
                <td>${client ? client.name : o.clientName || 'Cliente'}</td>
                <td style="max-width:200px;font-size:.83rem;color:var(--muted)">${items}</td>
                <td><b style="color:var(--primary)">$${parseFloat(o.total).toFixed(2)}</b></td>
                <td>${payIcon} ${o.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}</td>
                <td><span class="badge ${cls}">${label}</span></td>
                <td style="font-size:.83rem">${d}</td>
                <td>${o.status !== 'completed' ? `<button class="action-btn edit-btn" onclick="completeOrder('${o.id}')">✅ Completar</button>` : ''}</td>
            </tr>`;
        }).join('');
}

function completeOrder(id) {
    const orders = StorageManager.get('orders');
    const o = orders.find(x => x.id === id);
    if (o) o.status = 'completed';
    StorageManager.save('orders', orders);
    renderSales();
    renderDashboard();
    toast('Orden marcada como completada', 'success');
}

/* ════════════════════════════════════════════
   CRM
════════════════════════════════════════════ */
function renderCRM() {
    const clients = StorageManager.get('clients');
    const appts   = StorageManager.get('appointments');
    const tbody   = document.getElementById('crm-body');
    tbody.innerHTML = clients.map(c => {
        const cAppts = appts.filter(a => a.clientId === c.id).length;
        return `<tr>
            <td><b>${c.name}</b></td>
            <td>${c.phone || '—'}</td>
            <td>${c.username || c.email || '—'}</td>
            <td><span class="badge badge-pending">${cAppts}</span></td>
            <td>
                <button class="action-btn edit-btn" onclick="editClient('${c.id}')">✏️ Editar</button>
                <button class="action-btn delete-btn" onclick="deleteClient('${c.id}')">🗑️</button>
                ${c.phone ? `<button class="action-btn" style="color:var(--success)" onclick="waClient('${c.id}')">💬 WA</button>` : ''}
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem">Sin clientes aún.</td></tr>';
}

function saveClient() {
    const id    = document.getElementById('client-id').value;
    const name  = document.getElementById('client-name').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const username = document.getElementById('client-username').value.trim();
    if (!name) { toast('El nombre es obligatorio', 'error'); return; }
    let clients = StorageManager.get('clients');
    if (id) {
        clients = clients.map(c => c.id === id ? { ...c, name, phone, username } : c);
    } else {
        clients.push({ id: StorageManager.generateId(), name, phone, username });
    }
    StorageManager.save('clients', clients);
    cancelClient();
    renderCRM();
    toast('Cliente guardado', 'success');
}

function editClient(id) {
    const c = StorageManager.get('clients').find(x => x.id === id);
    if (!c) return;
    document.getElementById('client-id').value    = c.id;
    document.getElementById('client-name').value  = c.name;
    document.getElementById('client-phone').value = c.phone || '';
    document.getElementById('client-username').value = c.username || c.email || '';
    document.getElementById('btn-cancel-client').style.display = '';
}

function cancelClient() {
    document.getElementById('client-id').value    = '';
    document.getElementById('client-name').value  = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-username').value = '';
    document.getElementById('btn-cancel-client').style.display = 'none';
}

function deleteClient(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    StorageManager.save('clients', StorageManager.get('clients').filter(c => c.id !== id));
    renderCRM();
}

function waClient(id) {
    const c = StorageManager.get('clients').find(x => x.id === id);
    if (!c || !c.phone) return;
    window.open(`https://wa.me/${c.phone.replace(/\D/g,'')}`, '_blank');
}

/* ════════════════════════════════════════════
   INVENTORY
════════════════════════════════════════════ */
function renderInventory() {
    const inv   = StorageManager.get('inventory');
    const tbody = document.getElementById('inv-body');
    tbody.innerHTML = inv.map(item => {
        const imgHtml = item.image
            ? `<img src="${item.image}" class="inv-img" alt="${item.name}">`
            : `<div class="inv-img-ph">${item.type === 'Servicio' ? '✂️' : '🛍️'}</div>`;
        const typeBadge = item.type === 'Servicio' ? 'badge-pending' : 'badge-confirmed';
        return `<tr>
            <td>${imgHtml}</td>
            <td><span class="badge ${typeBadge}">${item.type}</span></td>
            <td>${item.name}</td>
            <td><b style="color:var(--primary)">$${parseFloat(item.price).toFixed(2)}</b></td>
            <td>
                <button class="action-btn edit-btn" onclick="editItem('${item.id}')">✏️ Editar</button>
                <button class="action-btn delete-btn" onclick="deleteItem('${item.id}')">🗑️</button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem">Sin ítems. Agrega servicios o productos.</td></tr>';
}

function saveItem() {
    const id    = document.getElementById('item-id').value;
    const type  = document.getElementById('item-type').value;
    const name  = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value;
    const file  = document.getElementById('item-image').files[0];
    if (!name || !price) { toast('Nombre y precio son obligatorios', 'error'); return; }

    const doSave = (img) => {
        let inv = StorageManager.get('inventory');
        if (id) {
            inv = inv.map(i => i.id === id ? { ...i, type, name, price, image: img !== undefined ? img : i.image } : i);
        } else {
            inv.push({ id: StorageManager.generateId(), type, name, price, image: img || null });
        }
        StorageManager.save('inventory', inv);
        cancelItem();
        renderInventory();
        toast('Ítem guardado', 'success');
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            const canvas = document.createElement('canvas');
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height, M = 400;
                if (w > h && w > M) { h = h * M / w; w = M; }
                else if (h > M) { w = w * M / h; h = M; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                doSave(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        doSave(undefined);
    }
}

function editItem(id) {
    const item = StorageManager.get('inventory').find(i => i.id === id);
    if (!item) return;
    document.getElementById('item-id').value     = item.id;
    document.getElementById('item-type').value   = item.type;
    document.getElementById('item-name').value   = item.name;
    document.getElementById('item-price').value  = item.price;
    document.getElementById('btn-cancel-item').style.display = '';
}

function cancelItem() {
    document.getElementById('item-id').value    = '';
    document.getElementById('item-name').value  = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-image').value = '';
    document.getElementById('btn-cancel-item').style.display = 'none';
}

function deleteItem(id) {
    if (!confirm('¿Eliminar este ítem?')) return;
    StorageManager.save('inventory', StorageManager.get('inventory').filter(i => i.id !== id));
    renderInventory();
}

/* ════════════════════════════════════════════
   SCHEDULES
════════════════════════════════════════════ */
function blockDay() {
    const date = document.getElementById('block-date').value;
    if (!date) { toast('Selecciona una fecha', 'error'); return; }
    const schedules = StorageManager.get('schedules');
    const existing  = schedules.find(s => s.date === date);
    if (existing) { existing.isDayOff = true; }
    else { schedules.push({ date, isDayOff: true, blockedSlots: [] }); }
    StorageManager.save('schedules', schedules);
    renderSchedules();
    toast('Día bloqueado', 'success');
}

function blockSlot() {
    const date = document.getElementById('block-slot-date').value;
    const time = document.getElementById('block-slot-time').value;
    if (!date) { toast('Selecciona una fecha', 'error'); return; }
    const schedules = StorageManager.get('schedules');
    let s = schedules.find(x => x.date === date);
    if (!s) { s = { date, isDayOff: false, blockedSlots: [] }; schedules.push(s); }
    if (!s.blockedSlots.includes(time)) s.blockedSlots.push(time);
    StorageManager.save('schedules', schedules);
    renderSchedules();
    toast(`Hora ${time} bloqueada en ${date}`, 'success');
}

function unblockDay(date) {
    let schedules = StorageManager.get('schedules').filter(s => !(s.date === date && s.isDayOff && s.blockedSlots.length === 0));
    const s = schedules.find(x => x.date === date);
    if (s) s.isDayOff = false;
    StorageManager.save('schedules', schedules.filter(x => x.isDayOff || x.blockedSlots.length > 0));
    renderSchedules();
}

function unblockSlot(date, time) {
    const schedules = StorageManager.get('schedules');
    const s = schedules.find(x => x.date === date);
    if (s) s.blockedSlots = s.blockedSlots.filter(t => t !== time);
    StorageManager.save('schedules', schedules.filter(x => x.isDayOff || x.blockedSlots.length > 0));
    renderSchedules();
}

function renderSchedules() {
    const schedules = StorageManager.get('schedules');
    const container = document.getElementById('blocked-list');
    if (!schedules.length) {
        container.innerHTML = '<p style="color:var(--muted)">No hay días ni horas bloqueadas.</p>'; return;
    }
    container.innerHTML = schedules.map(s => {
        const d = new Date(s.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        let html = '';
        if (s.isDayOff) {
            html += `<div class="blocked-day-card"><span>🚫 <b>${d}</b> — Día completo</span><button onclick="unblockDay('${s.date}')">✕</button></div>`;
        }
        if (s.blockedSlots && s.blockedSlots.length) {
            s.blockedSlots.forEach(t => {
                html += `<div class="blocked-day-card" style="border-color:rgba(212,175,55,.3);background:rgba(212,175,55,.07)"><span>⏰ <b>${d}</b> — ${t}</span><button onclick="unblockSlot('${s.date}','${t}')">✕</button></div>`;
            });
        }
        return html;
    }).join('');
}

/* ════════════════════════════════════════════
   CATALOG PREVIEW
════════════════════════════════════════════ */
function renderAdminCatalog() {
    const inv  = StorageManager.get('inventory');
    const grid = document.getElementById('admin-catalog-grid');
    grid.innerHTML = inv.map(item => {
        const img = item.image
            ? `<img src="${item.image}" style="width:100%;height:150px;object-fit:cover;" alt="">`
            : `<div style="width:100%;height:150px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:2.5rem;">${item.type === 'Servicio' ? '✂️' : '🛍️'}</div>`;
        return `<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;">
            ${img}
            <div style="padding:1rem;">
                <div style="font-size:.75rem;color:var(--muted);text-transform:uppercase">${item.type}</div>
                <h3 style="margin:.3rem 0;font-size:1rem">${item.name}</h3>
                <div style="color:var(--primary);font-weight:800;font-size:1.2rem">$${parseFloat(item.price).toFixed(2)}</div>
            </div>
        </div>`;
    }).join('') || '<p style="color:var(--muted)">Sin ítems en el catálogo.</p>';
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
});
