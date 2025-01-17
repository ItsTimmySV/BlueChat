class ChatManager {
  constructor(bluetoothChat) {
    this.bluetooth = bluetoothChat;
    this.messages = [];
    this.onMessageReceived = null;
    
    // Referencias DOM
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.attachButton = document.getElementById('attachButton');
    this.inputOptions = document.getElementById('inputOptions');
    this.messagesContainer = document.getElementById('messages');
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Enviar mensaje
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Opciones de entrada
    this.attachButton.addEventListener('click', () => {
      this.inputOptions.classList.toggle('active');
    });

    // Manejadores para diferentes tipos de entrada
    document.querySelectorAll('.input-options button').forEach(button => {
      button.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.handleInputType(type);
      });
    });
  }

  async sendMessage(content = this.messageInput.value, type = 'text') {
    if (!content) return;

    const message = {
      type,
      content,
      timestamp: Date.now(),
      sender: 'self'
    };

    try {
      await this.bluetooth.sendMessage(JSON.stringify(message));
      this.addMessage(message);
      this.messageInput.value = '';
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar mensaje');
    }
  }

  addMessage(message) {
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  renderMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', message.sender === 'self' ? 'sent' : 'received');

    switch (message.type) {
      case 'text':
        messageElement.textContent = message.content;
        break;
      case 'image':
        const img = document.createElement('img');
        img.src = message.content;
        messageElement.appendChild(img);
        break;
      case 'audio':
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = message.content;
        messageElement.appendChild(audio);
        break;
      case 'gif':
        const gif = document.createElement('img');
        gif.src = message.content;
        messageElement.appendChild(gif);
        break;
    }

    this.messagesContainer.appendChild(messageElement);
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  async handleInputType(type) {
    this.inputOptions.classList.remove('active');

    switch (type) {
      case 'image':
        this.handleImageUpload();
        break;
      case 'audio':
        this.handleAudioRecording();
        break;
      case 'gif':
        document.getElementById('gifPicker').classList.toggle('active');
        break;
      case 'emoji':
        document.getElementById('emojiPicker').classList.toggle('active');
        break;
    }
  }

  async handleImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        await this.bluetooth.sendFile(file);
      } catch (error) {
        console.error('Error al enviar imagen:', error);
        alert('Error al enviar imagen');
      }
    };

    input.click();
  }

  async handleAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks);
        await this.bluetooth.sendFile(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      });

      // Comenzar grabación
      mediaRecorder.start();
      
      // Detener después de 5 segundos
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);

    } catch (error) {
      console.error('Error al grabar audio:', error);
      alert('Error al acceder al micrófono');
    }
  }
}

window.ChatManager = ChatManager;