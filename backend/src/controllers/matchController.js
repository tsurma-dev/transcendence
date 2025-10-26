import { createMatch } from "../models/matchModel.js";
import { findUserByUsername } from "../models/userModel.js";

import { Game } from "../game/pongGame.js";
import { AIplayer } from "../game/aiPlayer.js";
import { Tournament } from "../tournament/tournament.js";

const TIMEOUT = 30 * 60 * 5; // 30 times per second * 60 seconds * n minutes
const PING_DELAY = 100; // approx 3 seconds

let db = null;
const connections = new Map(); // socket -> { tournamentId, roomId, playerName, lastPing }
const tournaments = new Map(); // tournamentId -> Tournament instance
const rooms = new Map();
const aiPlayers = new Map();
var waitingRoom = null;
let aiPlay = 0;
roomsLoop(rooms);

export function handlePongWebSocket(socket, req) {
	db = req.server.db;
	socket.on("message", (msg) => {
	//console.log("received ws msg: " + msg);

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
		case "tournament-join":
			joinTournament(socket, data.payload?.tournamentId, data.payload?.playerName);
			break;
		case "ping":
			const connection = connections.get(socket);
			if (connection) {
				connection.lastPing = 0;
			}
			socket.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
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
					ai.updateGameState(room.game.getBallState(), room.game.paddle2.x);
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
			winner: room.game.score.player1 > room.game.score.player2 ? room.player1.name : room.player2.name,
		},
	};
	if (room.player1.socket) {
		room.player1.socket.send(JSON.stringify(endState));
	}
	if (room.player2.socket) {
		room.player2.socket.send(JSON.stringify(endState));
	}

	// store match result in DB if both players are real
	if (room.player2.name !== "AIplayer") {
		storeMatchResult(roomId);
	}

	console.log("Game ended in room " + roomId + ", rooms count: " + rooms.size);

	if (room.tournamentId) {
		handleTournamentResult(room.tournamentId, roomId);
	} // if finished remove from tournaments map

	clearRoom(roomId);
}

function storeMatchResult(roomId) {
	if (!db) {
		console.error("Database connection not available");
		return;
	}
	const room = rooms.get(roomId);
	if (!room) return;
	try {
		const player1 = findUserByUsername(db, room.player1.name);
		const player2 = findUserByUsername(db, room.player2.name);
		if (!player1 || !player2) {
			console.error("One or both players not found in DB");
			return;
		}
		createMatch(
			db,
			room.tournamentId,
			player1.id, // get actual user IDs from auth system
			player2.id,
			room.game.score.player1,
			room.game.score.player2,
			room.game.score.player1 > room.game.score.player2 ? player1.id : player2.id
		);
	} catch (error) {
		console.error("Match result not stored in DB because of error: ", error);
		return;
	}
	console.log("Match result stored in DB for room " + roomId);
}

function clearRoom(roomId) {
	const room = rooms.get(roomId);
	if (!room) return;

	if (!room.tournamentId || !tournaments.has(room.tournamentId)) {
		// If the room is not part of a tournament, close player sockets
		if (room.player1.socket) {
			room.player1.socket.close();
		}
		if (room.player2.socket) {
			room.player2.socket.close();
		}
	}

	// Clear player data
	room.player1 = { id: null, socket: null, name: null, ready: false };
	room.player2 = { id: null, socket: null, name: null, ready: false };
	room.game = null;

	// Remove AI player if exists
	if (aiPlayers.has(roomId)) {
		aiPlayers.delete(roomId);
		if (aiPlayers.size === 0 && aiPlay !== 0) {
			clearInterval(aiPlay);
			aiPlay = 0;
		}
	}

	rooms.delete(roomId);
	console.log("Room " + roomId + " cleared");
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

function checkConnections() {
	if (!connections || connections.size === 0) return;
	// Update lastPing for each connection
	connections.forEach((conn, socket) => {
		conn.lastPing += 1;
		if (conn.lastPing > PING_DELAY) {
			// Timeout reached, close socket and clean up
			console.log("Client " + conn.playerName + " disconnected");
			socket.close();
			//connections.delete(socket);
		}
	});
}

//loop through rooms and call room.game.update() and send game state to both players
function roomsLoop(rooms) {
	setInterval(() => {
		checkConnections();
		if (!rooms || rooms.size === 0) return;
		rooms.forEach((room, roomId) => {
			if (!room.game) {
				room.timeout -= 1;
				if (room.timeout <= 0) {
					sendGameState(roomId, "room-closed");
					console.log("Room " + roomId + " timed out due to inactivity");
					clearRoom(roomId);
				}
			}
			if (room.game && room.game.gameState === "playing") {
				if (room.player2.name === "AIplayer" && aiPlayers.has(roomId)) {
					const ai = aiPlayers.get(roomId);
					const aiDirection = ai.updatePaddle();
					room.game.paddle2.direction = aiDirection;
				}
				room.game.update();
				sendGameState(roomId, "update");
				if (room.game.gameState === "finished") {
						endGame(roomId);
				}
			}
		});
	}, 1000 / 30); // 30 FPS
}

function sendGameState(roomId, state) {
	const room = rooms.get(roomId);
	if (!room) return;

	let gameState = null;

	switch (state) {
		case "failed":
			gameState = {
				type: "game-failed",
				payload: { message: "Opponent disconnected" },
			};
			break;
		case "room-closed":
			gameState = {
				type: "game-failed",
				payload: { message: "Room closed because of inactivity" },
			};
			break;
		case "update":
			const body = room.game.getState();
			gameState = {
				type: "game-state",
				payload: body,
			};
			break;
		default:
			return;
	}

	if (room.player1.socket) {
		room.player1.socket.send(JSON.stringify(gameState));
	}
	if (room.player2.socket) {
		room.player2.socket.send(JSON.stringify(gameState));
	}
}

function createRoom(type, tId) {
	// Create a unique room ID
	do {
		var roomId = Math.random().toString(36).slice(2, 8);
	} while (rooms.has(roomId));
	rooms.set(roomId, {
		player1: { id: null, socket: null, name: null, ready: false },
		player2: { id: null, socket: null, name: null, ready: false },
		game: null,
			tournamentId: tId || null,
			timeout: TIMEOUT
		});
	if (type === 'public') {
		waitingRoom = roomId;
	}
	console.log("Room created with ID: " + roomId + ", type: " + type);
	return roomId;
}

function joinTournament(socket, tournamentId, playerName) {
	if (!tournamentId) {
		// Join the first available tournament in 'waiting' state or create a new one
		tournamentId = getCurTournament();
	}
	if (!tournamentId) {
		// No available tournament, create a new one
		do {
			tournamentId = Math.random().toString(36).slice(2, 8);
		} while (tournaments.has(tournamentId));
		//const tournament = new Tournament(tournamentId);
		tournaments.set(tournamentId, new Tournament(tournamentId));
		console.log("Tournament created with ID: " + tournamentId);
	}
	const tournament = tournaments.get(tournamentId);
	if (!tournament) {
		socket.send(JSON.stringify({ type: 'fail', message: 'Tournament not found' }));
		socket.close();
		return;
	}
	connections.set(socket, { tournamentId: tournamentId, roomId: null, playerName: playerName, lastPing: 0 });
	let res = tournament.addPlayer(playerName, socket);
	setupCloseHandler(socket);
	if (res === 4) {
		tournament.setFirstRound(createRoom('tournament', tournamentId), createRoom('tournament', tournamentId));
	}
}

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
	const connection = connections.get(socket);
	if (!connection) {
		connections.set(socket, { tournamentId: null, roomId: roomId, playerName: playerName, lastPing: 0 });
	}
	else {
		connection.roomId = roomId;
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
		if (!room.tournamentId) {
			setupCloseHandler(socket);
		}
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
		if (!room.tournamentId) {
			setupCloseHandler(socket);
		}
		return;
	} else {
		socket.send(JSON.stringify({ message: "Room full" }));
		connections.delete(socket);
		socket.close();
		return;
  }
}

function handleTournamentResult(tournamentId, roomId) {
	if (!tournaments.has(tournamentId)) return;
	const tournament = tournaments.get(tournamentId);
	if (!tournament) return;
	const room = rooms.get(roomId);
	if (!room) return;
	const score = [room.game.score.player1, room.game.score.player2];
	const round = tournament.setScore(roomId, score);
	if (round === 1) {
		// first round finished, set up second round
		tournament.setSecondRound(createRoom('tournament', tournamentId), createRoom('tournament', tournamentId));
	} else if (round === 2) {
		// tournament finished
		tournaments.delete(tournamentId);
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

function setupCloseHandler(socket) {
  socket.on("close", () => {
	if (!connections || connections.size === 0) return;
	const connection = connections.get(socket);
	if (!connection) return;
	const roomId = connection.roomId;
	const tournamentId = connection.tournamentId;
	if (roomId) {
    	const room = rooms.get(roomId);
		if (room && room.game && room.game.gameState === "finished") {
			console.log("Socket closed, game in room " + roomId + " ended");
		}
		else if (room) {
			if (room.player1.socket === socket) {
				room.player1.socket = null;
			}
			if (room.player2.socket === socket) {
				room.player2.socket = null;
			}
			sendGameState(roomId, "failed");
			console.log("Game in room " + roomId + " ended due to player disconnect");
			clearRoom(roomId);
		}
	}
	if (tournamentId) {
		const tournament = tournaments.get(tournamentId);
		if (tournament) {
			if (tournament.state === 'waiting') {
				tournament.removePlayer(socket);
			} else if (tournament.state !== 'finished') {
				tournament.cancel(socket);
			}
			if (tournament.playersCount === 0) {
				tournaments.delete(tournamentId);
			}
		}
	}
	connections.delete(socket);
    //endGame(roomId);
  });
}

function getCurTournament() {
  for (let [id, tournament] of tournaments) {
    if (tournament.state === 'waiting') {
      return id;
    }
  }
  return null;
}
