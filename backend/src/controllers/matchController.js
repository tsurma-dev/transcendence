// import {
//   createMatch,
//   addPlayerToMatch,
//   completeMatch,
// } from "../models/matchModel";

import { Game } from "../game/pongGame.js";
import { AIplayer } from "../game/aiPlayer.js";

const rooms = new Map();
const aiPlayers = new Map();
var waitingRoom = null;
let aiPlay = 0;
roomsLoop(rooms);

export function handlePongWebSocket(socket, req) {
	//db = app.db;
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

	switch (data.type) {
		case "create":
			const roomId = createRoom('private');
			joinRoom(socket, roomId, data.payload?.playerName);
			break;
		case "create-ai":
			setAIroom(socket, data.payload.playerName);
			break;
		case "join":
			joinRoom(socket, data.payload?.roomId, data.payload?.playerName);
			break;
		case "ready-to-play":
			setReady(data.payload?.roomId, data.payload?.playerId, socket);
			break;
		case "input":
			//console.log("Updating player " + data.payload.playerId + " room " + data.payload.roomId + " with direction " + data.payload.direction);
			updatePlayer(socket, data.payload?.roomId, data.payload?.playerId, data.payload?.direction);
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

function setReady(roomId, playerId, socket) {
	const room = rooms.get(roomId);
	if (!room) return;
	if (playerId === "first") {
		if (room.player1.socket !== socket) return;
		room.player1.ready = true;
	}
	else if (playerId === "second") {
		if (room.player2.socket !== socket) return;
		room.player2.ready = true;
	}
	
	// When both players are ready, send start-countdown message
	if (room.player1.ready && (room.player2.ready || room.player2.name === "AIplayer")) {
		console.log("Both players ready in room " + roomId + " - sending start-countdown");
		const startCountdownMessage = {
			type: "start-countdown",
		};
		room.player1.socket.send(JSON.stringify(startCountdownMessage));
		if (room.player2.socket) {
			room.player2.socket.send(JSON.stringify(startCountdownMessage));
		}

		// Start the actual game after a delay (3 seconds for countdown + small buffer)
		setTimeout(() => {
			startGame(roomId);
		}, 4000);
	}
}

//set new Game instance to room and send "game-start" to both players
function startGame(roomId) {
	const room = rooms.get(roomId);
	if (!room || room.game) return;
	if (!room.player1.socket || (!room.player2.socket && room.player2.name !== "AIplayer")) return;
	room.game = new Game("playing");
	const startState = {type: "game-start"};
	room.player1.socket.send(JSON.stringify(startState));
	if (room.player2.name === "AIplayer") {
		const ai = new AIplayer(room.game);
		aiPlayers.set(roomId, ai);
		if (aiPlay === 0) {
			aiPlay = setInterval(() => {
				aiPlayers.forEach((ai, id) => {
					ai.updatePaddle();
				});
			}, 1000);
		}
	} else {
		room.player2.socket.send(JSON.stringify(startState));
	}
	console.log("Starting game in room " + roomId);
	console.log("rooms count: " + rooms.size);
}

//set room.game to null, send "game-over" to both players
function endGame(roomId) {
	const room = rooms.get(roomId);
	if (!room || !room.game) return;
	const endState = {
		type: "game-over",
		payload: {
			player1Score: room.game.score.player1,
			player2Score: room.game.score.player2,
			winner: room.game.score.player1 > room.game.score.player2 ? "first" : "second",
			// winner: room.game.score.player1 > room.game.score.player2 ? room.player1.name : room.player2.name,
		},
	};
	if (room.player1.socket) {
		room.player1.socket.send(JSON.stringify(endState));
		room.player1.socket.close();
	}
	if (room.player2.socket) {
		room.player2.socket.send(JSON.stringify(endState));
		room.player2.socket.close();
	}
	if (aiPlayers.has(roomId)) {
		//const ai = aiPlayers.get(roomId);
		//ai.stop();
		aiPlayers.delete(roomId);
		if (aiPlayers.size === 0 && aiPlay !== 0) {
			clearInterval(aiPlay);
			aiPlay = 0;
		}
	}

	//store match result in DB

	room.game = null;
	rooms.delete(roomId);
	console.log("Game ended in room " + roomId + ", rooms count: " + rooms.size);
}

// Send room-ready message to both players when room is full
function sendRoomReady(roomId) {
	const room = rooms.get(roomId);
	if (!room || !room.player1.socket || (!room.player2.socket && room.player2.name !== "AIplayer")) return;

	console.log("Room " + roomId + " is ready! Sending room-ready to both players");
	
	const roomReadyMessage = {
		type: "room-ready",
		payload: {
			player1: { name: room.player1.name, id: "first" },
			player2: { name: room.player2.name, id: "second" }
		}
	};
	
	room.player1.socket.send(JSON.stringify(roomReadyMessage));
	if (room.player2.socket) {
		room.player2.socket.send(JSON.stringify(roomReadyMessage));
	}
}

//loop through rooms and call room.game.update() and send game state to both players
function roomsLoop(rooms) {
	setInterval(() => {
		if (!rooms || rooms.size === 0) return;
		rooms.forEach((room, roomId) => {
			if (room.game && room.game.gameState === "playing") {
				room.game.update();
				const body = room.game.getState();
				const gameState = {
					type: "game-state",
					payload: body,
				};
				if (room.player1.socket) {
					room.player1.socket.send(JSON.stringify(gameState));
				}
				if (room.player2.socket) {
					room.player2.socket.send(JSON.stringify(gameState));
				}
				//end game if one of players disconnected
				if (!room.player1.socket || 
					(!room.player2.socket && room.player2.name !== "AIplayer") || 
					room.game.gameState === "finished") {
						endGame(roomId);
				}
			}
		});
	}, 1000 / 30); // 30 FPS
}

function createRoom(type) {
  const roomId = Math.random().toString(36).slice(2, 8);
  rooms.set(roomId, { 
			player1: { id: null, socket: null, name: null, ready: false }, 
			player2: { id: null, socket: null, name: null, ready: false }, 
			game: null
		});
  if (type === 'public') {
	waitingRoom = roomId;
  }
  console.log("Room created with ID: " + roomId + ", type: " + type);
  return roomId;
}

// add names received from client
function joinRoom(socket, roomId, playerName) {
  if (!roomId) {
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
	room.player1.name = playerName || "Player 1";
	let message = { 
		type: "room-joined",
		payload: { roomId: roomId }
	};
	socket.send(JSON.stringify(message));
	setupCloseHandler(roomId, socket);
	return;
  }
  if (!room.player2.socket) {
	if (roomId === waitingRoom) {
		waitingRoom = null;
	}
	room.player2.id = "second";
	room.player2.socket = socket;
	room.player2.name = playerName || "Player 2";
	let message = { 
		type: "room-joined",
		payload: { roomId: roomId }
	};
	socket.send(JSON.stringify(message));
	
	// Send room-ready message to both players with names and positions
	sendRoomReady(roomId);
	setupCloseHandler(roomId, socket);
	return;
  }
  else {
    socket.send(JSON.stringify({ message: "Room full" }));
    socket.close();
    return;
  }
}

function setAIroom(socket, playerName) {
  const roomId = createRoom('AI');
  joinRoom(socket, roomId, playerName);
  // set AI as player2
  const room = rooms.get(roomId);
  room.player2.name = "AIplayer";
  room.player2.id = "second";
  room.player2.ready = true;
  // no socket for AI
  console.log("AI player set in room " + roomId);
  sendRoomReady(roomId);
}

function setupCloseHandler(roomId, socket) {
  socket.on("close", () => {
    const room = rooms.get(roomId);
    if (!room) return;
	console.log("Socket closed, game in room " + roomId + " ended");
    endGame(roomId);
  });
}
