// Referencias a los objetos ChatManager y BluetoothChat
class UIManager {
  constructor(chatManager) {
    this.chat = chatManager;
    
    // Referencias DOM
    this.scanButton = document.getElementById('scanButton');
    this.devicesContainer = document.getElementById('devicesContainer');
    this.statusElement = document.getElementById('status');
    this.emojiPicker = document.getElementById('emojiPicker');
    this.gifPicker = document.getElementById('gifPicker');
    
    this.initializeUI();
  }

  initializeUI() {
    // Cargar emojis
    this.loadEmojis();
    
    // Event listeners
    this.scanButton.addEventListener('click', this.startScanning.bind(this));
    
    // GIF search
    const gifSearch = document.getElementById('gifSearch');
    gifSearch.addEventListener('input', this.debounce(this.searchGifs.bind(this), 500));
  }

  async startScanning() {
    this.scanButton.disabled = true;
    this.scanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    
    try {
      const devices = await this.chat.bluetooth.scanForDevices();
      this.renderDevices(devices);
      this.updateStatus('Dispositivos encontrados');
    } catch (error) {
      this.updateStatus('Error al buscar dispositivos');
      console.error(error);
    } finally {
      this.scanButton.disabled = false;
      this.scanButton.innerHTML = '<i class="fas fa-sync-alt"></i> Buscar dispositivos';
    }
  }

  renderDevices(devices) {
    this.devicesContainer.innerHTML = '';
    
    devices.forEach(device => {
      const deviceElement = document.createElement('div');
      deviceElement.classList.add('device-item');
      deviceElement.innerHTML = `
        <i class="fas fa-bluetooth"></i>
        ${device.name || 'Dispositivo desconocido'}
      `;
      
      deviceElement.addEventListener('click', () => this.connectToDevice(device));
      this.devicesContainer.appendChild(deviceElement);
    });
  }

  async connectToDevice(device) {
    try {
      await this.chat.bluetooth.connect(device);
      this.updateStatus(`Conectado a ${device.name || 'dispositivo'}`);
      document.querySelector('.devices-list').style.display = 'none';
      document.querySelector('.chat-container').style.display = 'flex';
    } catch (error) {
      this.updateStatus('Error al conectar');
      console.error(error);
    }
  }

  updateStatus(message) {
    this.statusElement.textContent = `Bluetooth: ${message}`;
  }

  loadEmojis() {
    const emojis = ['😀', '😂', '😊', '😍', '🥰', '😎', '😴', '🤔', '😅', '😌',
                    '👍', '👎', '👋', '❤️', '💔', '💯', '🎉', '🌟', '🔥', '💫'];
    
    const emojiGrid = document.createElement('div');
    emojiGrid.style.display = 'grid';
    emojiGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    emojiGrid.style.gap = '0.5rem';
    
    emojis.forEach(emoji => {
      const button = document.createElement('button');
      button.textContent = emoji;
      button.onclick = () => {
        this.chat.messageInput.value += emoji;
        this.emojiPicker.classList.remove('active');
      };
      emojiGrid.appendChild(button);
    });
    
    this.emojiPicker.appendChild(emojiGrid);
  }

  async searchGifs(event) {
    const query = event.target.value;
    if (!query) return;

    const GIPHY_API_KEY = 'McAWb0Q1161ZnE0DIMGQUJIXxvt0h8kE'; // Demo key - replace with your own
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=15`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const gifResults = document.getElementById('gifResults');
      gifResults.innerHTML = '';
      
      data.data.forEach(gif => {
        const img = document.createElement('img');
        img.src = gif.images.fixed_height_small.url;
        img.classList.add('gif-item');
        img.onclick = () => {
          this.chat.sendMessage(gif.images.original.url, 'gif');
          this.gifPicker.classList.remove('active');
        };
        gifResults.appendChild(img);
      });
    } catch (error) {
      console.error('Error al buscar GIFs:', error);
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  window.bluetoothChat = new BluetoothChat();
  window.chatManager = new ChatManager(window.bluetoothChat);
  window.uiManager = new UIManager(window.chatManager);
});