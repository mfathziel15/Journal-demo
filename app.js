let notes = JSON.parse(localStorage.getItem('pro_notes_v2')) || [];
let routines = JSON.parse(localStorage.getItem('pro_routines_v2')) || [];

const categoryColors = {
    'Pribadi': 'bg-primary bg-opacity-10 text-primary',
    'Pekerjaan': 'bg-danger bg-opacity-10 text-danger',
    'Ide': 'bg-success bg-opacity-10 text-success',
    'Belajar': 'bg-info bg-opacity-10 text-info'
};

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 60000);
    
    document.getElementById('btnSaveNote').addEventListener('click', saveNote);
    document.getElementById('routineForm').addEventListener('submit', function(e) {
        e.preventDefault(); saveRoutine();
    });
    document.getElementById('btnNotif').addEventListener('click', requestNotificationPermission);
    
    // Fitur Live Search (Untuk Mobile dan Desktop)
    const handleSearch = (e) => renderNotes(e.target.value.toLowerCase());
    const desktopSearch = document.getElementById('searchInput');
    const mobileSearch = document.getElementById('mobileSearchInput');
    
    if(desktopSearch) desktopSearch.addEventListener('input', handleSearch);
    if(mobileSearch) mobileSearch.addEventListener('input', handleSearch);
    
    // Mobile Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const openBtn = document.getElementById('openSidebarBtn');
    const closeBtn = document.getElementById('closeSidebarBtn');

    function toggleSidebar() {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    }

    if(openBtn) openBtn.addEventListener('click', toggleSidebar);
    if(closeBtn) closeBtn.addEventListener('click', toggleSidebar);
    if(overlay) overlay.addEventListener('click', toggleSidebar); // Tutup menu jika layar gelap ditekan
    
    renderNotes();
    renderRoutines();
    updateStats();
    
    // Register Service Worker untuk PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('PWA Service Worker Terdaftar!', reg))
        .catch(err => console.error('Gagal mendaftar Service Worker', err));
    }
});

function updateClock() {
    const now = new Date();
    const dt = document.getElementById('currentDate');
    const tm = document.getElementById('currentTime');
    if(dt) dt.innerText = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if(tm) tm.innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function updateStats() {
    document.getElementById('statNotes').innerText = notes.length;
    const now = new Date().getTime();
    document.getElementById('statRoutines').innerText = routines.filter(r => new Date(r.time).getTime() > now).length;
}

function showToast(title, message, type = 'primary') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0 mb-2 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body"><strong>${title}</strong><br>${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toast = new bootstrap.Toast(document.getElementById(toastId), { delay: 4000 });
    toast.show();
}

function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;
    const category = document.getElementById('noteCategory').value;
    if(!title || !content) { showToast('Gagal', 'Kosong!', 'danger'); return; }
    
    notes.unshift({
        id: Date.now(), title, content, category,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    });
    localStorage.setItem('pro_notes_v2', JSON.stringify(notes));
    document.getElementById('noteTitle').value = ''; document.getElementById('noteContent').value = '';
    renderNotes(); updateStats(); showToast('Berhasil', 'Catatan disimpan.', 'success');
}

window.deleteNote = function(id) {
    if(confirm('Hapus catatan?')) {
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('pro_notes_v2', JSON.stringify(notes));
        renderNotes(); updateStats(); showToast('Dihapus', 'Catatan dihapus.', 'secondary');
    }
}

function renderNotes(searchQuery = '') {
    const container = document.getElementById('notesContainer');
    container.innerHTML = '';
    const filteredNotes = notes.filter(note => note.title.toLowerCase().includes(searchQuery) || note.content.toLowerCase().includes(searchQuery));
    if (filteredNotes.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="fas fa-folder-open fs-1 mb-3 opacity-50"></i><p>Belum ada catatan</p></div>`; return;
    }
    filteredNotes.forEach(note => {
        const badgeColor = categoryColors[note.category] || categoryColors['Pribadi'];
        container.innerHTML += `
            <div class="col-md-6">
                <div class="card note-card h-100 p-3 p-md-4 shadow-sm border-0">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge-category ${badgeColor}">${note.category}</span>
                        <button class="btn btn-sm text-danger border-0 bg-transparent p-0" onclick="deleteNote(${note.id})"><i class="fas fa-trash"></i></button>
                    </div>
                    <h5 class="note-title mt-2 mb-1">${note.title}</h5>
                    <small class="text-muted mb-3 d-block">${note.date}</small>
                    <p class="note-content m-0">${note.content}</p>
                </div>
            </div>`;
    });
}

function saveRoutine() {
    const title = document.getElementById('routineTitle').value;
    const time = document.getElementById('routineTime').value;
    if(!title || !time) return;
    routines.push({ id: Date.now(), title, time, notified: false });
    routines.sort((a, b) => new Date(a.time) - new Date(b.time)); 
    localStorage.setItem('pro_routines_v2', JSON.stringify(routines));
    document.getElementById('routineForm').reset();
    renderRoutines(); updateStats(); showToast('Alarm Disetel', 'Agenda ditambahkan.', 'success');
}

window.deleteRoutine = function(id) {
    routines = routines.filter(r => r.id !== id);
    localStorage.setItem('pro_routines_v2', JSON.stringify(routines));
    renderRoutines(); updateStats();
}

function renderRoutines() {
    const container = document.getElementById('routinesContainer');
    container.innerHTML = ''; const now = new Date().getTime();
    if (routines.length === 0) { container.innerHTML = `<div class="text-center py-4 text-muted small">Tidak ada agenda.</div>`; return; }
    routines.forEach(routine => {
        const dateObj = new Date(routine.time);
        const isPast = dateObj.getTime() < now;
        const opacity = isPast ? 'opacity-50' : '';
        const fDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        const fTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        container.innerHTML += `
            <div class="routine-item d-flex justify-content-between align-items-center ${opacity}">
                <div>
                    <h6 class="mb-1 fw-bold text-dark ${isPast ? 'text-decoration-line-through' : ''}">${routine.title}</h6>
                    <span class="routine-time-badge"><i class="fas fa-clock me-1"></i>${fDate}, ${fTime}</span>
                </div>
                <button class="btn btn-sm text-danger border-0 bg-transparent p-1" onclick="deleteRoutine(${routine.id})"><i class="fas fa-check-circle fs-5"></i></button>
            </div>`;
    });
}

function requestNotificationPermission() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(p => { if (p === 'granted') showToast('Akses Diberikan', 'Notifikasi sistem aktif!', 'success'); });
    } else showToast('Info', 'Notifikasi sudah aktif.', 'info');
}

setInterval(() => {
    const now = new Date().getTime(); let requiresUpdate = false;
    routines.forEach(routine => {
        if (now >= new Date(routine.time).getTime() && !routine.notified) {
            if (Notification.permission === 'granted') new Notification("Alarm ProJournal", { body: routine.title });
            showToast('⏰ ALARM!', routine.title, 'warning');
            routine.notified = true; requiresUpdate = true;
        }
    });
    if(requiresUpdate) { localStorage.setItem('pro_routines_v2', JSON.stringify(routines)); renderRoutines(); updateStats(); }
}, 1000);
