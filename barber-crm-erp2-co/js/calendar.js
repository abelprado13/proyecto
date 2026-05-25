// ─── BarberCalendar ───────────────────────────────────────────────────────────
class BarberCalendar {
    constructor(containerId, onSlotSelected) {
        this.container = document.getElementById(containerId);
        this.onSlotSelected = onSlotSelected;
        this.viewDate = new Date();
        this.viewDate.setDate(1);
        this.HOURS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
        this.render();
    }

    fmt(date) {
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }

    getBookedSlots(dateStr) {
        return StorageManager.get('appointments')
            .filter(a => a.date === dateStr && a.status !== 'cancelled')
            .map(a => a.time);
    }

    getBlockedSlots(dateStr) {
        const schedules = StorageManager.get('schedules');
        const s = schedules.find(x => x.date === dateStr);
        return s ? s.blockedSlots || [] : [];
    }

    isDayOff(dateStr) {
        const schedules = StorageManager.get('schedules');
        const s = schedules.find(x => x.date === dateStr);
        return s && s.isDayOff;
    }

    isAvailable(date) {
        const today = new Date(); today.setHours(0,0,0,0);
        if (date <= today) return false;
        if (date.getDay() === 0) return false; // Sunday closed
        const ds = this.fmt(date);
        if (this.isDayOff(ds)) return false;
        const booked = this.getBookedSlots(ds);
        const blocked = this.getBlockedSlots(ds);
        return this.HOURS.some(h => !booked.includes(h) && !blocked.includes(h));
    }

    getSlotsForDay(dateStr) {
        const booked = this.getBookedSlots(dateStr);
        const blocked = this.getBlockedSlots(dateStr);
        return this.HOURS.map(h => ({ time: h, available: !booked.includes(h) && !blocked.includes(h) }));
    }

    prevMonth() { this.viewDate.setMonth(this.viewDate.getMonth()-1); this.render(); }
    nextMonth() { this.viewDate.setMonth(this.viewDate.getMonth()+1); this.render(); }

    showSlots(dateStr, displayDate) {
        const slots = this.getSlotsForDay(dateStr);
        const modal = document.getElementById('slots-modal');
        document.getElementById('slots-modal-title').textContent = `Horarios — ${displayDate}`;
        const grid = document.getElementById('slots-grid');
        grid.innerHTML = '';
        slots.forEach(s => {
            const btn = document.createElement('button');
            btn.className = `slot-btn ${s.available ? 'slot-available' : 'slot-taken'}`;
            btn.textContent = s.time;
            btn.disabled = !s.available;
            if (s.available) {
                btn.onclick = () => {
                    modal.classList.remove('active');
                    this.onSlotSelected(dateStr, s.time);
                };
            }
            grid.appendChild(btn);
        });
        modal.classList.add('active');
    }

    render() {
        const y = this.viewDate.getFullYear();
        const m = this.viewDate.getMonth();
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m+1, 0).getDate();
        const today = new Date(); today.setHours(0,0,0,0);

        let html = `
        <div class="cal-header">
            <button class="cal-nav" onclick="window._cal.prevMonth()">‹</button>
            <span class="cal-title">${monthNames[m]} ${y}</span>
            <button class="cal-nav" onclick="window._cal.nextMonth()">›</button>
        </div>
        <div class="cal-grid">
            ${dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('')}`;

        for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(y, m, d);
            const ds = this.fmt(date);
            const isPast = date <= today;
            const isSun = date.getDay() === 0;
            const avail = !isPast && !isSun && this.isAvailable(date);
            const cls = isPast || isSun || this.isDayOff(ds) ? 'cal-day past' :
                        avail ? 'cal-day available' : 'cal-day unavailable';
            const displayDate = `${d} de ${monthNames[m]} ${y}`;
            const click = avail ? `onclick="window._cal.showSlots('${ds}','${displayDate}')"` : '';
            html += `<div class="${cls}" ${click}>${d}</div>`;
        }

        html += `</div>
        <div class="cal-legend">
            <span><i class="legend-dot avail"></i> Disponible</span>
            <span><i class="legend-dot unavail"></i> No disponible</span>
        </div>`;

        this.container.innerHTML = html;
    }
}
