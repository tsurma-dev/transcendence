import { gameProperties } from "./gameProperties.js";

const PAD_MAX_POS_X = (gameProperties.GAME_HEIGHT - gameProperties.PADDLE_HEIGHT) / 2;

export class Game {
	constructor(gameState) {
		this.ball = {
			z: 0,
			x: 0,
			radius: gameProperties.BALL_SIZE / 2,
			speedZ: gameProperties.BALL_SPEED_Z,
			speedX: gameProperties.BALL_SPEED_X,
			collision: null, // "paddle1", "paddle2", "wall"
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
		this.ball.speedZ = (Math.random() > 0.5 ? 1 : -1) * gameProperties.BALL_SPEED_Z / 10;
		this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * gameProperties.BALL_SPEED_X / 10;
	}

	movePaddle(paddle) {
		if (paddle.direction === -1) {
			paddle.x = Math.max(-PAD_MAX_POS_X, paddle.x - paddle.speed / 10);
		} else if (paddle.direction === 1) {
			paddle.x = Math.min(PAD_MAX_POS_X, paddle.x + paddle.speed / 10);
		}
		return paddle.x;
	}

	update() {
		// Move ball
		this.ball.z += this.ball.speedZ / 10;
		this.ball.x += this.ball.speedX / 10;

		// Move paddles
		this.paddle1.x = this.movePaddle(this.paddle1);
		console.log("Paddle1 new position: " + this.paddle1.x + ", direction: " + this.paddle1.direction);
		this.paddle2.x = this.movePaddle(this.paddle2);
		console.log("Paddle2 new position: " + this.paddle2.x + ", direction: " + this.paddle2.direction);

		// Ball collision with top/bottom
		if (this.ball.x - this.ball.radius < -gameProperties.GAME_HEIGHT / 2 
			|| this.ball.x + this.ball.radius > gameProperties.GAME_HEIGHT / 2) {
			this.ball.speedX *= -1;
			this.ball.collision = "wall";
		}

		// Ball collision with paddles
		if (this.ball.collision) {
			// reset collision after sending it once
			this.ball.collision = null;
		}

		if (
			this.ball.z - this.ball.radius < this.paddle1.z &&
			this.ball.x > this.paddle1.x - gameProperties.PADDLE_HEIGHT / 2 &&
			this.ball.x < this.paddle1.x + gameProperties.PADDLE_HEIGHT / 2
		) {
			this.ball.speedZ *= -1;
			this.ball.z = this.paddle1.z + this.ball.radius;
			this.ball.collision = "paddle";
		}

		if (
			this.ball.z + this.ball.radius > this.paddle2.z &&
			this.ball.x > this.paddle2.x - gameProperties.PADDLE_HEIGHT / 2 &&
			this.ball.x < this.paddle2.x + gameProperties.PADDLE_HEIGHT / 2
		) {
			this.ball.speedZ *= -1;
			this.ball.z = this.paddle2.z - this.ball.radius;
			this.ball.collision = "paddle";
		}

		// Score update
		if (this.ball.z < -gameProperties.GAME_WIDTH / 2 - gameProperties.PADDLE_WIDTH) {
			this.score.player2 += 1;
			this.resetBall();
		} else if (this.ball.z > gameProperties.GAME_WIDTH / 2 + gameProperties.PADDLE_WIDTH) {
			this.score.player1 += 1;
			this.resetBall();
		}
	}

	getState() {
		return {
			ballPosX: this.ball.x,
			ballPosZ: this.ball.z,
			paddle1X: this.paddle1.x,
			paddle2X: this.paddle2.x,
			player1Score: this.score.player1,
			player2Score: this.score.player2,
			collision: this.ball.collision,
			gameState: this.gameState,
			winner: this.winner,
		};
	}
}

//module.exports = Game;
