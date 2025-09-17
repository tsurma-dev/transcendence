// import {
//   createMatch,
//   addPlayerToMatch,
//   completeMatch,
// } from "../models/matchModel";

import { Game } from "../game/pongGame.js";

const rooms = new Map();
var waitingRoom = null;
roomsLoop(rooms);
//key: roomId, value: { players: { id, socket1 } [], gameInstance }
// TODO: temporally while multiple rooms are not supported
//       create an array of rooms available to join

//rooms.set("42", { player1: { id: null, socket: null}, player2: { id: null, socket: null}, game: null});

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
		//case "play":
		//startGame(data.roomId);
		//break;
		case "update":
			//console.log("Updating player " + data.playerId + " room " + data.roomId + " with direction " + data.direction);
			// check if playerId is matched to socket in the room
			updatePlayer(socket, data.roomId, data.playerId, data.direction);
			break;
		default:
			socket.send(JSON.stringify({ message: "Unknown action" }));
			socket.close();
	}
	});
}

//update player direction in room.game instance
function updatePlayer(socket, roomId, playerId, direction) {
	const room = rooms.get(roomId);
	if (!room || !room.game) return;
	if (playerId === "first") {
		if (room.player1.socket !== socket) return;
		room.game.paddle1.direction = direction; // -1 up, 1 down, 0 stop
	} else if (playerId === "second") {
		if (room.player2.socket !== socket) return;
		room.game.paddle2.direction = direction; // -1 up, 1 down, 0 stop
	}
}

//set new Game instance to room and send "game-start" to both players
function startGame(roomId) {
	const room = rooms.get(roomId);
	if (!room || room.game) return;
	if (!room.player1.socket || !room.player2.socket) return;
	console.log("Starting game in room " + roomId);
	room.game = new Game("running");
	const startState = {
		type: "game-start",
		gameState: room.game.gameState,
	};
	room.player1.socket.send(JSON.stringify(startState));
	room.player2.socket.send(JSON.stringify(startState));
	console.log("rooms count: " + rooms.size);
}

//set room.game to null, send "game-over" to both players
function endGame(roomId) {
	const room = rooms.get(roomId);
	if (!room || !room.game) return;
	const endState = {
		type: "game-over",
		P1Score: room.game.score.player1,
		P2Score: room.game.score.player2,
	};
	if (room.player1.socket) {
		room.player1.socket.send(JSON.stringify(endState));
		room.player1.socket = null;
	}
	if (room.player2.socket) {
		room.player2.socket.send(JSON.stringify(endState));
		room.player2.socket = null;
	}
	//store match result in DB
	room.game = null;
	rooms.delete(roomId);
	console.log("Game ended in room " + roomId + ", rooms count: " + rooms.size);
}

//loop through rooms and call room.game.update() and send game state to both players
function roomsLoop(rooms) {
	setInterval(() => {
		if (!rooms || rooms.size === 0) return;
		rooms.forEach((room, roomId) => {
			if (room.game && room.game.gameState === "running") {
				room.game.update();
				const gameState = {
					type: "game-state",
					ballPosX: room.game.ball.x,
					ballPosY: room.game.ball.y,
					paddle1Y: room.game.paddle1.y,
					paddle2Y: room.game.paddle2.y,
					P1Score: room.game.score.player1,
					P2Score: room.game.score.player2,
				};
				if (room.player1.socket) {
					room.player1.socket.send(JSON.stringify(gameState));
				}
				if (room.player2.socket) {
					room.player2.socket.send(JSON.stringify(gameState));
				}
				//end game if one of players disconnected
				if (!room.player1.socket || !room.player2.socket || room.game.gameState === "game-over") {
					endGame(roomId);
				}
			}
		});
	}, 1000 / 30); // 30 FPS
}

function createRoom(access) {
  const roomId = Math.random().toString(36).slice(2, 8);
  rooms.set(roomId, { player1: { id: null, socket: null }, player2: { id: null, socket: null}, game: null});
  if (access === 'public') {
	waitingRoom = roomId;
  }
  console.log("Room created with ID: " + roomId + ", access: " + access);
  return roomId;
}

function joinRoom(socket, roomId) {
  if (!roomId) {
	//roomId = "42";
	if (waitingRoom && rooms.has(waitingRoom)) {
		roomId = waitingRoom;
	} else {
		roomId = createRoom('public');
	}
  }
  const room = rooms.get(roomId);
  if (!room) {
    socket.send(JSON.stringify({ message: "Room not found or error occurred" }));
    socket.close();
    return;
  }
  if (!room.player1.socket) {
	room.player1.id = "first";
	room.player1.socket = socket;
	socket.send(JSON.stringify({ type: "room-joined", room: roomId, playerId: "first" }));
	setupCloseHandler(roomId, socket);
	return;
  }
  if (!room.player2.socket) {
	if (roomId === waitingRoom) {
		waitingRoom = null;
	}
	room.player2.id = "second";
	room.player2.socket = socket;
	socket.send(JSON.stringify({ type: "room-joined", room: roomId, playerId: "second" }));
	startGame(roomId);
	setupCloseHandler(roomId, socket);
	return;
  }
  else {
    socket.send(JSON.stringify({ message: "Room full" }));
    socket.close();
    return;
  }
}

function setupCloseHandler(roomId, socket) {
  socket.on("close", () => {
    const room = rooms.get(roomId);
    if (!room) return;
	if (room.player1.socket === socket) {
		room.player1.socket = null;
	}
	if (room.player2.socket === socket) {
		room.player2.socket = null;
	}
    endGame(roomId);

    // if (roomId != "42") {
    //   rooms.delete(roomId);
	// }
  });
}
