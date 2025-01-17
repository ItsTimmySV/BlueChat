class BluetoothChat {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.onReceiveMessage = null;
    
    // Bluetooth UUIDs
    this.SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
    this.CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';
  }

  async initialize() {
    if (!navigator.bluetooth) {
      throw new Error('Bluetooth no está disponible en este dispositivo');
    }
  }

  async scanForDevices() {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [this.SERVICE_UUID]
      });

      this.device = device;
      device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
      
      return device;
    } catch (error) {
      console.error('Error al escanear dispositivos:', error);
      throw error;
    }
  }

  async connect(device) {
    try {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(this.SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);
      
      // Configurar notificaciones
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener('characteristicvaluechanged',
        this.handleCharacteristicValueChanged.bind(this));
        
      return true;
    } catch (error) {
      console.error('Error al conectar:', error);
      throw error;
    }
  }

  async sendMessage(message) {
    if (!this.characteristic) {
      throw new Error('No hay conexión Bluetooth');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    try {
      await this.characteristic.writeValue(data);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }

  handleCharacteristicValueChanged(event) {
    const value = event.target.value;
    const decoder = new TextDecoder();
    const message = decoder.decode(value);
    
    if (this.onReceiveMessage) {
      this.onReceiveMessage(message);
    }
  }

  onDisconnected() {
    this.characteristic = null;
    console.log('Dispositivo desconectado');
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }
  }

  // Métodos para manejar diferentes tipos de datos
  async sendFile(file) {
    // Convertir archivo a ArrayBuffer
    const buffer = await file.arrayBuffer();
    const chunks = this.chunkData(buffer);
    
    // Enviar metadatos
    await this.sendMessage(JSON.stringify({
      type: 'file',
      name: file.name,
      size: file.size,
      chunks: chunks.length
    }));

    // Enviar chunks
    for (let i = 0; i < chunks.length; i++) {
      await this.characteristic.writeValue(chunks[i]);
    }
  }

  chunkData(buffer, chunkSize = 512) {
    const chunks = [];
    const view = new Uint8Array(buffer);
    
    for (let i = 0; i < view.length; i += chunkSize) {
      chunks.push(view.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
}

window.BluetoothChat = BluetoothChat;