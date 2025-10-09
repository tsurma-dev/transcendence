import { gameProperties, PAD_MAX_POS_X } from "./gameProperties.js";

//const PAD_MAX_POS_X = gameProperties.PAD_MAX_POS_X;

export class Game {
	constructor(gameState) {
		this.ball = {
			z: 0,
			x: 0,
			radius: gameProperties.BALL_RADIUS,
			speedZ: gameProperties.BALL_SPEED_Z,
			speedX: gameProperties.BALL_SPEED_X,
			deltaSpeed: gameProperties.DELTA_SPEED,
		};
		this.paddle1 = {
			z: -gameProperties.GAME_WIDTH / 2, // -PADDLE_WIDTH/2
			x: 0,
			speed: gameProperties.PADDLE_SPEED,
			direction: 0,
		};
		this.paddle2 = {
			z: gameProperties.GAME_WIDTH / 2, // + gameProperties.PADDLE_WIDTH,
			x: 0,
			speed: gameProperties.PADDLE_SPEED,
			direction: 0,
		};
		this.score = {
			player1: 0,
			player2: 0,
		};
		this.collisionEvent = null; // "paddle", "wall"
		this.scoreEvent = null; // "first", "second"
		this.gameState = gameState; // 'waiting' | 'playing' | 'finished'
		this.ballCount = 0;
		this.winner = null;
	}

	resetBall() {
		this.ballCount += 1;
		if (this.ballCount >= gameProperties.BALL_COUNT) {
			this.gameState = "finished";
			this.winner = this.score.player1 > this.score.player2 ? "first" : "second";
			return;
		}
		this.ball.z = 0;
		this.ball.x = 0;
		this.ball.speedZ = (Math.random() > 0.5 ? 1 : -1) * gameProperties.BALL_SPEED_Z;
		this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * gameProperties.BALL_SPEED_X;
		this.ball.deltaSpeed -= 1; // increase ball speed each score
	}

	movePaddle(paddle) {
		if (paddle.direction === -1) {
			paddle.x = Math.max(-PAD_MAX_POS_X, paddle.x - paddle.speed);
		} else if (paddle.direction === 1) {
			paddle.x = Math.min(PAD_MAX_POS_X, paddle.x + paddle.speed);
		}
		return paddle.x;
	}

	update() {
		// reset all events
		this.collisionEvent = null;
		this.scoreEvent = null;

		// Move ball
		this.ball.z += this.ball.speedZ / this.ball.deltaSpeed;
		this.ball.x += this.ball.speedX / this.ball.deltaSpeed;

		// Move paddles
		this.paddle1.x = this.movePaddle(this.paddle1);
		console.log("Paddle1 new position: " + this.paddle1.x + ", direction: " + this.paddle1.direction);
		this.paddle2.x = this.movePaddle(this.paddle2);
		console.log("Paddle2 new position: " + this.paddle2.x + ", direction: " + this.paddle2.direction);

		// Ball collision with top/bottom
		if (this.ball.x - this.ball.radius < -gameProperties.GAME_HEIGHT / 2 
			|| this.ball.x + this.ball.radius > gameProperties.GAME_HEIGHT / 2) {
			this.ball.speedX *= -1;
			this.collisionEvent = "wall";
		}

		if (
			this.ball.z - this.ball.radius < this.paddle1.z &&
			this.ball.x + this.ball.radius / 2 > this.paddle1.x - gameProperties.PADDLE_HEIGHT / 2 &&
			this.ball.x - this.ball.radius / 2 < this.paddle1.x + gameProperties.PADDLE_HEIGHT / 2
		) {
			this.ball.speedZ *= -1;
			this.ball.z = this.paddle1.z + this.ball.radius;
			this.collisionEvent = "paddle";
		}

		if (
			this.ball.z + this.ball.radius > this.paddle2.z &&
			this.ball.x + this.ball.radius / 2 > this.paddle2.x - gameProperties.PADDLE_HEIGHT / 2 &&
			this.ball.x - this.ball.radius / 2 < this.paddle2.x + gameProperties.PADDLE_HEIGHT / 2
		) {
			this.ball.speedZ *= -1;
			this.ball.z = this.paddle2.z - this.ball.radius;
			this.collisionEvent = "paddle";
		}

		// Score update
		if (this.ball.z < -gameProperties.GAME_WIDTH / 2 - gameProperties.EXTRA_SPACE - gameProperties.BALL_SIZE) {
			this.score.player2 += 1;
			this.scoreEvent = "second";
			this.resetBall();
		} else if (this.ball.z > gameProperties.GAME_WIDTH / 2 + gameProperties.EXTRA_SPACE + gameProperties.BALL_SIZE) {
			this.score.player1 += 1;
			this.scoreEvent = "first";
			this.resetBall();
		}
	}

	getState() {
		const eventses = new Array();
		if (this.collisionEvent)
			eventses.push({type: "collision", collisionType: this.collisionEvent});
		if (this.scoreEvent)
			eventses.push({
				type: "score", 
				playerID: this.scoreEvent, 
				points: this.scoreEvent === "first" ? this.score.player1 : this.score.player2
			});
		return {
			ballPosX: this.ball.x,
			ballPosZ: this.ball.z,
			paddle1X: this.paddle1.x,
			paddle2X: this.paddle2.x,
			player1Score: this.score.player1,
			player2Score: this.score.player2,
			gameState: this.gameState,
			winner: this.winner,
			//collision: this.collisionEvent, // events: "paddle", "wall", null
			events: eventses,
		};
	}

	getBallState() {
		return {
			x: this.ball.x,
			z: this.ball.z,
			speedX: this.ball.speedX,
			speedZ: this.ball.speedZ,
			deltaSpeed: this.ball.deltaSpeed,
			//collision: this.ball.collision,
		};
	}
}

//module.exports = Game;
