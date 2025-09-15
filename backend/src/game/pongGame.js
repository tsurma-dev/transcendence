import { gameProperties } from "./gameProperties.js";

export class Game {
	constructor(gameState) {
		this.ball = {
			x: gameProperties.GAME_WIDTH / 2,
			y: gameProperties.GAME_HEIGHT / 2,
			radius: gameProperties.BALL_SIZE / 2,
			speedX: gameProperties.BALL_SPEED_X,
			speedY: gameProperties.BALL_SPEED_Y,
			collision: null, // "paddle1", "paddle2", "wall"
		};
		this.paddle1 = {
			x: 0 + gameProperties.PADDLE_WIDTH,
			y: gameProperties.GAME_HEIGHT / 2 - gameProperties.PADDLE_HEIGHT / 2,
			speed: gameProperties.PADDLE_SPEED,
			direction: 0,
		};
		this.paddle2 = {
			x: gameProperties.GAME_WIDTH - gameProperties.PADDLE_WIDTH,
			y: gameProperties.GAME_HEIGHT / 2 - gameProperties.PADDLE_HEIGHT / 2,
			speed: gameProperties.PADDLE_SPEED,
			direction: 0,
		};
		this.score = {
			player1: 0,
			player2: 0,
		};
		this.gameState = gameState; // "running", "game-over"
		this.ballCount = 0;
	}

	resetBall() {
		this.ballCount += 1;
		if (this.ballCount >= gameProperties.BALL_COUNT) {
			this.gameState = "game-over";
			return;
		}
		this.ball.x = gameProperties.GAME_WIDTH / 2;
		this.ball.y = gameProperties.GAME_HEIGHT / 2;
		this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * gameProperties.BALL_SPEED_X;
		this.ball.speedY = (Math.random() > 0.5 ? 1 : -1) * gameProperties.BALL_SPEED_Y;
	}

	movePaddle(paddle) {
		if (paddle.direction === -1) {
			paddle.y = Math.max(gameProperties.PADDLE_HEIGHT / 2, paddle.y - paddle.speed);
		} else if (paddle.direction === 1) {
			paddle.y = Math.min(gameProperties.GAME_HEIGHT - gameProperties.PADDLE_HEIGHT / 2, paddle.y + paddle.speed);
		}
		return paddle.y;
	}

	update() {
		// Move ball
		this.ball.x += this.ball.speedX;
		this.ball.y += this.ball.speedY;

		// Move paddles
		this.paddle1.y = this.movePaddle(this.paddle1);
		console.log("Paddle1 new position: " + this.paddle1.y + ", direction: " + this.paddle1.direction);
		this.paddle2.y = this.movePaddle(this.paddle2);
		console.log("Paddle2 new position: " + this.paddle2.y + ", direction: " + this.paddle2.direction);

		// Ball collision with top/bottom
		if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > gameProperties.GAME_HEIGHT) {
			this.ball.speedY *= -1;
			this.ball.collision = "wall";
		}

		// Ball collision with paddles
		if (
			this.ball.x - this.ball.radius < this.paddle1.x &&
			this.ball.y > this.paddle1.y &&
			this.ball.y < this.paddle1.y + gameProperties.PADDLE_HEIGHT
		) {
			this.ball.speedX *= -1;
			this.ball.x = this.paddle1.x + this.ball.radius;
			//this.ball.x = this.paddle1.x + gameProperties.PADDLE_WIDTH / 2 + this.ball.radius;
			this.ball.collision = "paddle1";
		}

		if (
			this.ball.x + this.ball.radius > this.paddle2.x &&
			this.ball.y > this.paddle2.y &&
			this.ball.y < this.paddle2.y + gameProperties.PADDLE_HEIGHT
		) {
			this.ball.speedX *= -1;
			this.ball.x = this.paddle2.x - this.ball.radius;
			this.ball.collision = "paddle2";
		}

		// Score update
		if (this.ball.x < 0) {
			this.score.player2 += 1;
			this.resetBall();
		} else if (this.ball.x > gameProperties.GAME_WIDTH) {
			this.score.player1 += 1;
			this.resetBall();
		}
	}

	getState() {
		return {
			ball: { ...this.ball },
			paddle1: { ...this.paddle1 },
			paddle2: { ...this.paddle2 },
			score: { ...this.score },
		};
	}
}

//module.exports = Game;
