// User Authentication
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Login/Register Toggle
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (showRegister && showLogin) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'flex';
        });

        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'flex';
        });
    }

    // Check if user is logged in
    if (localStorage.getItem('currentUser')) {
        window.location.href = 'home.html';
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                window.location.href = 'home.html';
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        });
    }

    // Register
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            const users = JSON.parse(localStorage.getItem('users')) || [];
            
            if (users.some(u => u.username === username)) {
                alert('El usuario ya existe');
                return;
            }
            
            users.push({ username, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert('Registro exitoso! Por favor inicia sesión');
            registerForm.reset();
            loginForm.style.display = 'flex';
            registerForm.style.display = 'none';
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // Video Handling
    if (window.location.pathname.endsWith('home.html')) {
        loadVideos();
        
        document.getElementById('videoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('videoTitle').value;
            const url = document.getElementById('videoUrl').value;
            const description = document.getElementById('videoDescription').value;
            
            const video = {
                title,
                url: convertToEmbedUrl(url),
                description,
                user: JSON.parse(localStorage.getItem('currentUser')).username
            };
            
            saveVideo(video);
            loadVideos();
            e.target.reset();
        });
    }
});

function convertToEmbedUrl(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return `https://www.youtube.com/embed/${videoId}`;
}

function saveVideo(video) {
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    videos.push(video);
    localStorage.setItem('videos', JSON.stringify(videos));
}

function loadVideos() {
    const videosContainer = document.getElementById('videosContainer');
    videosContainer.innerHTML = '';
    const videos = JSON.parse(localStorage.getItem('videos')) || [];
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.innerHTML = `
            <iframe src="${video.url}" allowfullscreen></iframe>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description}</p>
                <small>Subido por: ${video.user}</small>
            </div>
        `;
        videosContainer.appendChild(videoCard);
    });
}