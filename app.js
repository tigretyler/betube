class VideoPlatform {
    constructor() {
        this.init();
    }

    init() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.bindEvents();
        this.checkAuth();
        this.loadContent();
    }

    bindEvents() {
        // Eventos de autenticación
        document.getElementById('loginForm')?.addEventListener('submit', this.handleLogin.bind(this));
        document.getElementById('registerForm')?.addEventListener('submit', this.handleRegister.bind(this));
        
        // Eventos de navegación
        document.getElementById('logoutBtn')?.addEventListener('click', this.handleLogout.bind(this));
        document.getElementById('uploadBtn')?.addEventListener('click', this.toggleUploadForm.bind(this));
        
        // Eventos de contenido
        document.getElementById('videoForm')?.addEventListener('submit', this.handleVideoUpload.bind(this));
    }

    checkAuth() {
        if (!this.currentUser && window.location.pathname.endsWith('home.html')) {
            window.location.href = 'index.html';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notifications');
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Sistema de autenticación
    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'home.html';
        } else {
            this.showNotification('Credenciales incorrectas', 'error');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.some(u => u.username === username)) {
            this.showNotification('El usuario ya existe', 'error');
            return;
        }
        
        const newUser = {
            username,
            password,
            subscriptions: [],
            likedVideos: []
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        this.showNotification('Registro exitoso!');
        document.getElementById('registerForm').reset();
        document.querySelectorAll('.auth-form').forEach(form => form.style.display = 'none');
        document.getElementById('loginForm').style.display = 'flex';
    }

    // Sistema de contenido
    async handleVideoUpload(e) {
        e.preventDefault();
        const title = document.getElementById('videoTitle').value;
        const url = document.getElementById('videoUrl').value;
        const description = document.getElementById('videoDescription').value;
        
        if (!this.validateYouTubeUrl(url)) {
            this.showNotification('URL de YouTube inválida', 'error');
            return;
        }
        
        const videoData = {
            id: Date.now().toString(),
            title: this.sanitizeInput(title),
            url: this.convertToEmbedUrl(url),
            description: this.sanitizeInput(description),
            author: this.currentUser.username,
            likes: [],
            comments: [],
            timestamp: Date.now()
        };
        
        this.saveVideo(videoData);
        this.loadContent();
        e.target.reset();
        this.showNotification('Video subido exitosamente!');
    }

    validateYouTubeUrl(url) {
        const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]{11})/;
        return pattern.test(url);
    }

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    convertToEmbedUrl(url) {
        const videoId = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)[1];
        return `https://www.youtube.com/embed/${videoId}`;
    }

    saveVideo(video) {
        const videos = JSON.parse(localStorage.getItem('videos')) || [];
        videos.unshift(video);
        localStorage.setItem('videos', JSON.stringify(videos));
    }

    loadContent() {
        if (!document.getElementById('videosContainer')) return;
        
        const videos = JSON.parse(localStorage.getItem('videos')) || [];
        const container = document.getElementById('videosContainer');
        container.innerHTML = '';
        
        videos.forEach(video => {
            const videoCard = this.createVideoCard(video);
            container.appendChild(videoCard);
        });
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <iframe class="video-player" src="${video.url}" frameborder="0" allowfullscreen></iframe>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description}</p>
                <div class="video-meta">
                    <span class="video-author">${video.author}</span>
                    <span class="video-date">${new Date(video.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="interaction-buttons">
                    <button class="btn btn-like ${this.currentUser.likedVideos.includes(video.id) ? 'active' : ''}" 
                            data-video-id="${video.id}">
                        👍 ${video.likes.length}
                    </button>
                    <button class="btn btn-comment" data-video-id="${video.id}">
                        💬 Comentarios (${video.comments.length})
                    </button>
                    <button class="btn btn-subscribe ${this.currentUser.subscriptions.includes(video.author) ? 'active' : ''}" 
                            data-author="${video.author}">
                        🔔 ${this.currentUser.subscriptions.includes(video.author) ? 'Suscrito' : 'Suscribirse'}
                    </button>
                </div>
                <div class="comments-section hidden" data-video-id="${video.id}">
                    <div class="comment-list"></div>
                    <form class="comment-form">
                        <textarea class="comment-input" placeholder="Añade un comentario..." required></textarea>
                        <button type="submit" class="btn">Comentar</button>
                    </form>
                </div>
            </div>
        `;
        
        this.addCardInteractions(card, video);
        return card;
    }

    addCardInteractions(card, video) {
        // Likes
        const likeBtn = card.querySelector('.btn-like');
        likeBtn.addEventListener('click', () => this.handleLike(video.id));

        // Comentarios
        const commentBtn = card.querySelector('.btn-comment');
        commentBtn.addEventListener('click', () => this.toggleComments(video.id));

        // Suscripciones
        const subscribeBtn = card.querySelector('.btn-subscribe');
        subscribeBtn.addEventListener('click', () => this.handleSubscribe(video.author));

        // Formulario de comentarios
        const commentForm = card.querySelector('.comment-form');
        commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e, video.id));
    }

    handleLike(videoId) {
        const videos = JSON.parse(localStorage.getItem('videos'));
        const video = videos.find(v => v.id === videoId);
        
        if (video.likes.includes(this.currentUser.username)) {
            video.likes = video.likes.filter(u => u !== this.currentUser.username);
            this.currentUser.likedVideos = this.currentUser.likedVideos.filter(id => id !== videoId);
        } else {
            video.likes.push(this.currentUser.username);
            this.currentUser.likedVideos.push(videoId);
        }
        
        this.updateStorage(videos);
        this.loadContent();
    }

    handleSubscribe(author) {
        if (this.currentUser.subscriptions.includes(author)) {
            this.currentUser.subscriptions = this.currentUser.subscriptions.filter(a => a !== author);
        } else {
            this.currentUser.subscriptions.push(author);
        }
        
        this.updateUserData();
        this.loadContent();
        this.showNotification(`Suscripción a ${author} actualizada`);
    }

    toggleComments(videoId) {
        const commentsSection = document.querySelector(`[data-video-id="${videoId}"]`);
        commentsSection.classList.toggle('hidden');
        this.loadComments(videoId);
    }

    handleCommentSubmit(e, videoId) {
        e.preventDefault();
        const input = e.target.querySelector('.comment-input');
        const commentText = this.sanitizeInput(input.value.trim());
        
        if (!commentText) return;

        const videos = JSON.parse(localStorage.getItem('videos'));
        const video = videos.find(v => v.id === videoId);
        
        video.comments.unshift({
            user: this.currentUser.username,
            text: commentText,
            timestamp: Date.now()
        });
        
        this.updateStorage(videos);
        this.loadComments(videoId);
        input.value = '';
        this.showNotification('Comentario añadido');
    }

    loadComments(videoId) {
        const videos = JSON.parse(localStorage.getItem('videos'));
        const video = videos.find(v => v.id === videoId);
        const commentList = document.querySelector(`[data-video-id="${videoId}"] .comment-list`);
        
        commentList.innerHTML = video.comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.user}</span>
                    <span class="comment-date">${new Date(comment.timestamp).toLocaleDateString()}</span>
                </div>
                <p class="comment-text">${comment.text}</p>
            </div>
        `).join('');
    }

    updateStorage(videos) {
        localStorage.setItem('videos', JSON.stringify(videos));
        
        // Actualizar datos de usuario
        const users = JSON.parse(localStorage.getItem('users'));
        const userIndex = users.findIndex(u => u.username === this.currentUser.username);
        users[userIndex] = this.currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    toggleUploadForm() {
        const form = document.getElementById('videoForm');
        form.classList.toggle('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    handleLogout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new VideoPlatform();
});