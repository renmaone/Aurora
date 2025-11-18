class AuroraChat {
    constructor() {
        this.chatContainer = document.getElementById('chat-container');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.chatHistory = document.getElementById('chat-history');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.imageBtn = document.getElementById('image-btn');
        this.imageInput = document.getElementById('image-input');
        this.imagePreview = document.getElementById('image-preview');
        this.previewImg = document.getElementById('preview-img');
        this.removeImageBtn = document.getElementById('remove-image');
        this.uploadBtn = document.getElementById('upload-btn');
        this.themeBtn = document.getElementById('theme-btn');
        
        this.currentChatId = this.generateChatId();
        this.currentImage = null;
        this.currentTheme = 'default';
        
        this.init();
    }

    init() {
        this.loadChatHistory();
        this.setupEventListeners();
        this.renderChatHistorySidebar();
        this.hideSkeleton();
    }

    generateChatId() {
        return 'chat_' + Date.now();
    }

    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Rasm yuklash
        this.imageBtn.addEventListener('click', () => {
            this.imageInput.click();
        });

        this.imageInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        this.removeImageBtn.addEventListener('click', () => {
            this.removeImage();
        });

        this.uploadBtn.addEventListener('click', () => {
            this.imageInput.click();
        });

        // Suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.userInput.value = chip.dataset.prompt;
                this.sendMessage();
            });
        });

        // New chat button
        this.newChatBtn.addEventListener('click', () => {
            this.startNewChat();
        });

        // Theme toggle
        this.themeBtn.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'default' ? 'purple' : 'default';
        document.body.setAttribute('data-theme', this.currentTheme);
        
        // Update theme icon
        const themeIcon = this.themeBtn.querySelector('.theme-icon');
        themeIcon.textContent = this.currentTheme === 'default' ? '🌙' : '🔮';
    }

    hideSkeleton() {
        setTimeout(() => {
            const skeleton = document.querySelector('.skeleton-history');
            if (skeleton) {
                skeleton.style.display = 'none';
            }
        }, 1000);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Rasm hajmi 5MB dan kichik boʻlishi kerak');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewImg.src = e.target.result;
                this.imagePreview.style.display = 'flex';
                this.currentImage = e.target.result.split(',')[1];
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        this.imagePreview.style.display = 'none';
        this.previewImg.src = '';
        this.currentImage = null;
        this.imageInput.value = '';
    }

    startNewChat() {
        this.currentChatId = this.generateChatId();
        this.chatContainer.innerHTML = this.getWelcomeMessage();
        this.renderChatHistorySidebar();
        this.removeImage();
        this.setupSuggestionChips();
    }

    setupSuggestionChips() {
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.userInput.value = chip.dataset.prompt;
                this.sendMessage();
            });
        });
    }

    getWelcomeMessage() {
        return `
            <div class="welcome-message">
                <div class="avatar">
                    <img src="{{ url_for('static', filename='Aurora.png') }}" alt="Aurora" class="avatar-img">
                    <div class="avatar-glow"></div>
                </div>
                <h1>Salom! Men Aurora</h1>
                <p>Men sizga turli sohalarda yordam bera olaman. Savolingizni yozing yoki rasm yuklang!</p>
                <div class="suggestion-chips">
                    <button class="suggestion-chip" data-prompt="Matematika masalasi yechish">
                        <span class="chip-icon">∞</span>
                        Matematika
                    </button>
                    <button class="suggestion-chip" data-prompt="Dasturlash masalasi">
                        <span class="chip-icon"></></span>
                        Dasturlash
                    </button>
                    <button class="suggestion-chip" data-prompt="Ta'lim va o'qish">
                        <span class="chip-icon">🎓</span>
                        Ta'lim
                    </button>
                    <button class="suggestion-chip" data-prompt="Biznes va moliya">
                        <span class="chip-icon">💼</span>
                        Biznes
                    </button>
                    <button class="suggestion-chip" data-prompt="Texnologiya masalalari">
                        <span class="chip-icon">⚡</span>
                        Texnologiya
                    </button>
                    <button class="suggestion-chip" data-prompt="Sog'liq va tibbiyot">
                        <span class="chip-icon">❤️</span>
                        Sog'liq
                    </button>
                    <button class="suggestion-chip" data-prompt="San'at va ijod">
                        <span class="chip-icon">🎨</span>
                        San'at
                    </button>
                    <button class="suggestion-chip" data-prompt="Sport va fitnes">
                        <span class="chip-icon">⚽</span>
                        Sport
                    </button>
                </div>
            </div>
        `;
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        const image = this.currentImage;

        if (!message && !image) {
            alert('Iltimos, xabar yozing yoki rasm yuklang');
            return;
        }

        // Clear input
        this.userInput.value = '';

        // Remove welcome message if it's the first message
        const welcomeMessage = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        // Add user message
        this.addMessage('user', message, image);

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to Flask backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    image: image
                })
            });

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.reply) {
                this.addMessage('bot', data.reply);
                this.saveChatToHistory(message, data.reply, image);
                this.renderChatHistorySidebar();
                this.renderMathAndCode();
            } else {
                this.addMessage('bot', '❌ Xatolik yuz berdi. Iltimos, qaytadan urinib koʻring.');
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('bot', '❌ Server bilan aloqa xatosi. Iltimos, qaytadan urinib koʻring.');
        }

        // Clear image after sending
        this.removeImage();
    }

    addMessage(sender, content, image = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        let imageHtml = '';
        if (image && sender === 'user') {
            imageHtml = `<img src="data:image/jpeg;base64,${image}" class="message-image" alt="Yuklangan rasm">`;
        }
        
        messageDiv.innerHTML = `
            <div class="message-content">
                ${imageHtml}
                ${this.formatContent(content)}
            </div>
        `;

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatContent(content) {
        if (!content) return '';
        
        // Format code blocks
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="$1">$2</code></pre>');
        
        // Format inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Format line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    renderMathAndCode() {
        // Render MathJax
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
        
        // Highlight code
        if (window.hljs) {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;

        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    saveChatToHistory(userMessage, botResponse, image = null) {
        const chats = this.getChats();
        const chat = chats.find(chat => chat.id === this.currentChatId);
        
        if (chat) {
            chat.messages.push({ user: userMessage, bot: botResponse, image: image });
            chat.lastMessage = userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');
            chat.timestamp = new Date().toISOString();
        } else {
            chats.unshift({
                id: this.currentChatId,
                title: userMessage.substring(0, 20) + (userMessage.length > 20 ? '...' : ''),
                lastMessage: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
                timestamp: new Date().toISOString(),
                messages: [{ user: userMessage, bot: botResponse, image: image }]
            });
        }
        
        localStorage.setItem('auroraChats', JSON.stringify(chats));
    }

    getChats() {
        return JSON.parse(localStorage.getItem('auroraChats') || '[]');
    }

    loadChatHistory() {
        const chats = this.getChats();
        const currentChat = chats.find(chat => chat.id === this.currentChatId);
        
        if (currentChat && currentChat.messages.length > 0) {
            this.chatContainer.innerHTML = '';
            currentChat.messages.forEach(msg => {
                this.addMessage('user', msg.user, msg.image);
                this.addMessage('bot', msg.bot);
            });
            this.renderMathAndCode();
        }
    }

    renderChatHistorySidebar() {
        const chats = this.getChats();
        
        this.chatHistory.innerHTML = chats.map(chat => `
            <div class="chat-history-item ${chat.id === this.currentChatId ? 'active' : ''}" 
                 onclick="aurora.loadChat('${chat.id}')">
                <div class="chat-history-text">💬 ${chat.title}</div>
                <small class="chat-history-time">${this.formatTime(chat.timestamp)}</small>
            </div>
        `).join('');
    }

    loadChat(chatId) {
        this.currentChatId = chatId;
        this.loadChatHistory();
        this.renderChatHistorySidebar();
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('uz-UZ');
        }
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.aurora = new AuroraChat();
});