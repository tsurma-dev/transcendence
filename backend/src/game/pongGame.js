import { gameProperties } from "./gameProperties";

class PongGame {
	constructor(player1Id, player2Id, roomId) {
		//this.width = gameProperties.GAME_WIDTH;
		//this.height = gameProperties.GAME_HEIGHT;
		this.player1Id = player1Id;
		this.player2Id = player2Id;
		this.roomId = roomId;
		this.ball = {
			x: gameProperties.GAME_WIDTH / 2,
			y: gameProperties.GAME_HEIGHT / 2,
			radius: gameProperties.BALL_SIZE / 2,
			speedX: 5,
			speedY: 3,
		};
		//this.paddleWidth = gameProperties.PADDLE_WIDTH;
		//this.paddleHeight = gameProperties.PADDLE_HEIGHT;
		this.paddle1 = {
			x: 0 + gameProperties.PADDLE_WIDTH,
			y: gameProperties.GAME_HEIGHT / 2 - gameProperties.PADDLE_HEIGHT / 2,
			speed: gameProperties.PADDLE_SPEED,
		};
		this.paddle2 = {
			x: gameProperties.GAME_WIDTH - gameProperties.PADDLE_WIDTH,
			y: gameProperties.GAME_HEIGHT / 2 - this.paddleHeight / 2,
			speed: gameProperties.PADDLE_SPEED,
		};
		this.score = {
			left: 0,
			right: 0,
		};
	}

	resetBall() {
		this.ball.x = gameProperties.GAME_WIDTH / 2;
		this.ball.y = gameProperties.GAME_HEIGHT / 2;
		this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
		this.ball.speedY = (Math.random() > 0.5 ? 1 : -1) * 5;
	}

	movePaddle(paddle, direction) {
		if (direction === 'up') {
			paddle.y = Math.max(gameProperties.PADDLE_HEIGHT / 2, paddle.y - paddle.speed);
		} else if (direction === 'down') {
			paddle.y = Math.min(gameProperties.GAME_HEIGHT - gameProperties.PADDLE_HEIGHT / 2, paddle.y + paddle.speed);
		}
	}

	update() {
		// Move ball
		this.ball.x += this.ball.speedX;
		this.ball.y += this.ball.speedY;

		// Ball collision with top/bottom
		if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > gameProperties.GAME_HEIGHT) {
			this.ball.speedY *= -1;
		}

		// Ball collision with paddles
		if (
			this.ball.x - this.ball.radius < this.paddle1.x + gameProperties.PADDLE_WIDTH &&
			this.ball.y > this.paddle1.y &&
			this.ball.y < this.paddle1.y + gameProperties.PADDLE_HEIGHT / 2
		) {
			this.ball.speedX *= -1;
			this.ball.x = this.paddle1.x + gameProperties.PADDLE_WIDTH / 2 + this.ball.radius;
		}

		if (
			this.ball.x + this.ball.radius > this.paddle2.x &&
			this.ball.y > this.paddle2.y - gameProperties.PADDLE_HEIGHT / 2 &&
			this.ball.y < this.paddle2.y + gameProperties.PADDLE_HEIGHT / 2
		) {
			this.ball.speedX *= -1;
			this.ball.x = this.paddle2.x - this.ball.radius;
		}

		// Score update
		if (this.ball.x < 0) {
			this.score.right += 1;
			this.resetBall();
		} else if (this.ball.x > gameProperties.GAME_WIDTH) {
			this.score.left += 1;
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

module.exports = PongGame;
