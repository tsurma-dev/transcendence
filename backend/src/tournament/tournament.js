export class Tournament {
	constructor(id) {
		this.id = id;
        this.players = new Map(); // Map of player number to player data
        this.playersCount = 0;

        // first round matches
        this.group1A = {
            roomId: null,
            player1: null,
            player2: null,
            score : [0, 0],
            winner: null,
            gameOver: false,
        }
        this.group1B = {
            roomId: null,
            player1: null,
            player2: null,
            score : [0, 0],
            winner: null,
            gameOver: false,
        }

        // final match
        this.group2A = {
            roomId: null,
            player1: null,
            player2: null,
            score: [0, 0],
            winner: null,
            gameOver: false,
        }
        // third place match
        this.group2B = {
            roomId: null,
            player1: null,
            player2: null,
            score: [0, 0],
            winner: null,
            gameOver: false,
        }

        this.champions = {
            first: null,
            second: null,
            third: null,
        };
        this.state = 'waiting'; // waiting, ongoing-first-round, ongoing-second-round, finished
	}

    addPlayer(name, socket) {
        let size = this.players.size;
        if (this.playersCount == 4) {
            socket.send(JSON.stringify({ type: 'fail', message: 'Tournament is full' }));
            socket.close();
            return -1; // Tournament is full
        }
        if (size == this.playersCount) {
            this.players.set(size + 1, { name: name, socket: socket });
            this.playersCount++;
            this.sendStateUpdate('tournament-player-joined', { playerNumber: size + 1, playerName: name, state: this.state });
        }
        else {
            for (let [number, player] of this.players) {
                if (!player.name) {
                    player.name = name;
                    player.socket = socket;
                this.playersCount++;
                this.sendStateUpdate('tournament-player-joined', { playerNumber: number, playerName: name, state: this.state });
                break;
                }
            }
        }
        const participants = [];
        for (let [_, player] of this.players) {
            participants.push(player.name);
        }
        socket.send(JSON.stringify({ type: 'registered', payload: { tournamentId: this.id, players: participants, state: this.state } }));
        return this.playersCount;
    }

    removePlayer(socket) {
        let numberToRemove = 0;
        for (let [playerNumber, player] of this.players) {
            if (player.socket === socket) {
                numberToRemove = playerNumber;
                break;
            }
        }
        const playerGone = this.players.get(numberToRemove);
        if (!playerGone) return;
        playerGone.socket = null; // mark as disconnected
        if (this.state === 'waiting') {
            this.sendStateUpdate('tournament-player-left', { playersCount: this.players.size, playerName: playerGone.name, state: this.state });
        }
        playerGone.name = null;
        this.playersCount--;
    }

    setFirstRound(room1, room2) {
        // Assign players to group 1A and 1B
        this.group1A.roomId = room1;
        this.group1B.roomId = room2;

        this.group1A.player1 = this.players.get(1);
        this.inviteToRoom(this.group1A.player1, room1);

        this.group1A.player2 = this.players.get(2);
        this.inviteToRoom(this.group1A.player2, room1);

        this.group1B.player1 = this.players.get(3);
        this.inviteToRoom(this.group1B.player1, room2);

        this.group1B.player2 = this.players.get(4);
        this.inviteToRoom(this.group1B.player2, room2);

        this.state = 'ongoing-first-round';
    }

    setSecondRound(room1, room2) {
        // Assign players to group 2A and 2B
        this.group2A.roomId = room1;
        this.group2B.roomId = room2;

        this.group2A.player1 = this.group1A.winner;
        this.inviteToRoom(this.group1A.winner, room1);

        this.group2A.player2 = this.group1B.winner;
        this.inviteToRoom(this.group1B.winner, room1);

        let player1, player2;
        if (this.group1A.winner === this.group1A.player1) {
            player1 = this.group1A.player2;
        } else {
            player1 = this.group1A.player1;
        }
        if (this.group1B.winner === this.group1B.player1) {
            player2 = this.group1B.player2;
        } else {
            player2 = this.group1B.player1;
        }

        this.group2B.player1 = player1;
        this.inviteToRoom(player1, room2);

        this.group2B.player2 = player2;
        this.inviteToRoom(player2, room2);

        this.state = 'ongoing-second-round';
    }

    inviteToRoom(player, room) {
        //const player = this.players.get(playerNumber);
        if (player && player.socket) {
            player.socket.send(JSON.stringify({ type: 'join-tournament-room', payload: { roomId: room } }));
        }
    }

    setScore(room, score) {
        if (room === this.group1A.roomId) {
            this.group1A.score = score;
            this.group1A.gameOver = true;
        } else if (room === this.group1B.roomId) {
            this.group1B.score = score;
            this.group1B.gameOver = true;
        } else if (room === this.group2A.roomId) {
            this.group2A.score = score;
            this.group2A.gameOver = true;
        } else if (room === this.group2B.roomId) {
            this.group2B.score = score;
            this.group2B.gameOver = true;
        }
        if (this.group1A.gameOver && this.group1B.gameOver && this.state === 'ongoing-first-round') {
            this.finishFirstRound();
            return 1; // first round finished
        }
        if (this.group2A.gameOver && this.group2B.gameOver && this.state === 'ongoing-second-round') {
            this.finishSecondRound();
            return 2; // second round finished
        }
        return 0; // round not finished
    }

    finishFirstRound() {
        // Determine winners of group 1A and 1B
        if (this.group1A.score[0] > this.group1A.score[1]) {
            this.group1A.winner = this.group1A.player1;
        } else {
            this.group1A.winner = this.group1A.player2;
        }

        if (this.group1B.score[0] > this.group1B.score[1]) {
            this.group1B.winner = this.group1B.player1;
        } else {
            this.group1B.winner = this.group1B.player2;
        }
        this.sendStateUpdate(
            'tournament-first-round-finished', { 
            matchA: { 
                player1: this.group1A.player1.name, 
                player2: this.group1A.player2.name, 
                score: this.group1A.score, 
                winner: this.group1A.winner.name 
            }, 
            matchB: { 
                player1: this.group1B.player1.name, 
                player2: this.group1B.player2.name, 
                score: this.group1B.score, 
                winner: this.group1B.winner.name 
            } 
        });
    }

    finishSecondRound() {
        // Determine winners of group 2A and 2B
        if (this.group2A.score[0] > this.group2A.score[1]) {
            this.group2A.winner = this.group2A.player1;
            this.champions.first = this.group2A.player1.name;
            this.champions.second = this.group2A.player2.name;
        } else {
            this.group2A.winner = this.group2A.player2;
            this.champions.first = this.group2A.player2.name;
            this.champions.second = this.group2A.player1.name;
        }

        if (this.group2B.score[0] > this.group2B.score[1]) {
            this.group2B.winner = this.group2B.player1;
            this.champions.third = this.group2B.player1.name;
        } else {
            this.group2B.winner = this.group2B.player2;
            this.champions.third = this.group2B.player2.name;
        }

        this.state = 'finished';
        this.sendStateUpdate(
            'tournament-finished', { 
            finalMatch: { 
                player1: this.group2A.player1.name, 
                player2: this.group2A.player2.name, 
                score: this.group2A.score, 
                winner: this.group2A.winner.name 
            }, 
            thirdPlaceMatch: { 
                player1: this.group2B.player1.name, 
                player2: this.group2B.player2.name, 
                score: this.group2B.score, 
                winner: this.group2B.winner.name 
            },
            champions: this.champions 
        });
        this.closeSockets();
    }
    
    cancel(socket) {
        this.removePlayer(socket);
        this.sendStateUpdate('tournament-cancelled', { message: 'Tournament has been cancelled due to player disconnect' });
        this.closeSockets();
    }
    
    closeSockets() {
        if (!this.players) return;
        for (let [_, player] of this.players) {
            if (player.socket) {
                player.socket.close();
            }
        }
        this.playersCount = 0;
    }

    sendStateUpdate(state, data) {
        for (let [_, player] of this.players) {
            if (player.socket) {
                player.socket.send(JSON.stringify({ type: state, payload: data }));
            }
        }
    }
}
