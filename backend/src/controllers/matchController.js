// import {
//   createMatch,
//   addPlayerToMatch,
//   completeMatch,
// } from "../models/matchModel";

const rooms = new Map();
// TODO: temporally while rooms are not supported in UI
rooms.set("42", { players: [] });

export function handlePongWebSocket(socket) {
  socket.on("message", (msg) => {
    console.log("received ws msg: " + msg);

    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      socket.send(JSON.stringify({ message: "Invalid JSON" }));
      socket.close();
      return;
    }

    switch (data.action) {
      case "create":
        createRoom(socket);
        break;
      case "join":
        joinRoom(socket, data.roomId);
        break;
      case "update":
        forwardUpdate(socket, data);
        break;
      default:
        socket.send(JSON.stringify({ message: "Unknown action" }));
        socket.close();
    }
  });
}

function forwardUpdate(socket, data) {
  // TODO: include roomId into data
  const room = rooms.get("42")
  const otherPlayer = room.players.filter((s) => s !== socket)
  if (otherPlayer.length === 1) {
    otherPlayer[0].send(JSON.stringify(data))
  }
}

function createRoom(socket) {
  const roomId = Math.random().toString(36).slice(2, 8);
  rooms.set(roomId, { players: [socket] });
  socket.send(JSON.stringify({ type: "room-created", roomId }));
  setupCloseHandler(roomId, socket);
}

function joinRoom(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    socket.send(JSON.stringify({ message: "Room not found" }));
    socket.close();
    return;
  }
  if (room.players.length >= 2) {
    socket.send(JSON.stringify({ message: "Room full" }));
    socket.close();
    return;
  }
  room.players.push(socket);
  socket.send(JSON.stringify({ type: "room-joined", roomId }));
  setupCloseHandler(roomId, socket);
}

function setupCloseHandler(roomId, socket) {
  socket.on("close", () => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.players = room.players.filter((s) => s !== socket);
    if (room.players.length === 0) {
      // TODO: temporally while rooms are not supported in UI
      if (roomId != "42") {
        rooms.delete(roomId);
      }
    }
  });
}
