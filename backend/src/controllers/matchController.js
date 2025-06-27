import { createMatch, addPlayerToMatch, completeMatch } from "../models/matchModel";

const rooms = new Map();

export function handlePongWebSocket(connection) {
  connection.socket.once('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      connection.socket.send(JSON.stringify({ message: 'Invalid JSON' }));
      connection.socket.close();
      return;
    }

    switch (data.action) {
      case 'create':
        createRoom(connection.socket);
        break;
      case 'join':
        joinRoom(connection.socket, data.roomId);
        break;
      default:
        connection.socket.send(JSON.stringify({ message: 'Unknown action' }));
        connection.socket.close();
    }
  });
}

function createRoom(socket) {
  const roomId = Math.random().toString(36).slice(2, 8);
  rooms.set(roomId, { players: [socket] });
  socket.send(JSON.stringify({ type: 'room-created', roomId }));
  setupCloseHandler(roomId, socket);
}

function joinRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    socket.send(JSON.stringify({ message: 'Room not found' }));
    socket.close();
    return;
  }
  if (room.players.length >= 2) {
    socket.send(JSON.stringify({ message: 'Room full' }));
    socket.close();
    return;
  }
  room.players.push(socket);
  socket.send(JSON.stringify({ type: 'room-joined', roomId }));
  setupCloseHandler(roomId, socket);
}

function setupCloseHandler(roomId, socket) {
  socket.on('close', () => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.players = room.players.filter(s => s !== socket);
    if (room.players.length === 0) {
      rooms.delete(roomId);
    }
  });
}
