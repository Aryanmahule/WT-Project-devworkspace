import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      const userJson = localStorage.getItem('apex_user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          socketInstance?.emit('authenticate', { user_id: user.id });
        } catch {}
      }
    });
  }
  return socketInstance;
}
