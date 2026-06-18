import { io } from 'socket.io-client';

function getSocketUrl() {
  const explicitUrl = process.env.REACT_APP_SOCKET_URL;
  if (explicitUrl) return explicitUrl;

  const apiUrl = process.env.REACT_APP_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    try {
      const url = new URL(apiUrl);
      return `${url.protocol}//${url.host}`;
    } catch {
      // fallback
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
}

const SOCKET_URL = getSocketUrl();

class SocketManager {
  constructor() {
    this.sockets = {};
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  connect(namespace = '') {
    const key = namespace || '/';
    if (this.sockets[key]?.connected) return this.sockets[key];

    const url = namespace ? `${SOCKET_URL}${namespace}` : SOCKET_URL;
    const socket = io(url, {
      auth: { token: this.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.sockets[key] = socket;
    return socket;
  }

  disconnect(namespace = '') {
    const key = namespace || '/';
    if (this.sockets[key]) {
      this.sockets[key].close();
      delete this.sockets[key];
    }
  }

  disconnectAll() {
    Object.keys(this.sockets).forEach(key => this.disconnect(key));
  }
}

const socketManager = new SocketManager();
export default socketManager;
