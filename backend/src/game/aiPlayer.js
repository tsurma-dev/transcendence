import { Game } from "../game/pongGame.js";
import { gameProperties, PAD_MAX_POS_X } from "./gameProperties.js";

const PAD_HALF_SIZE = gameProperties.PADDLE_HEIGHT / 2;

export class AIplayer {
    constructor() {
        this.paddle = {
            z: gameProperties.GAME_WIDTH / 2, // + gameProperties.PADDLE_WIDTH,
            x: 0,
            speed: gameProperties.PADDLE_SPEED,

        }
        this.ballPos = {
            z: 0,
            x: 0,
        };
        this.ballSpeed = {
            z: 0,
            x: 0,
        };
    }

    updateGameState(ball, paddleX) { // ball = {z, x, speedZ, speedX}
        this.ballPos.z = ball.z;
        this.ballPos.x = ball.x;
        this.ballSpeed.z = ball.speedZ;
        this.ballSpeed.x = ball.speedX;
        this.paddle.x = paddleX;
    }

    updatePaddle() { // ball = {z, x}, paddle = {z, x}
        let direction = 0;
        if (this.ballPos.z < 0 || this.ballSpeed.z < 0) { // if ball is moving towards AI paddle
            return direction; // do not move
        }
        if (this.ballPos.x < this.paddle.x - PAD_HALF_SIZE && this.paddle.x > -PAD_MAX_POS_X) {
            direction = -1; //move up
        } else if (this.ballPos.x > this.paddle.x + PAD_HALF_SIZE && this.paddle.x < PAD_MAX_POS_X) {
            direction = 1; //move down
        }

        this.paddle.x = this.paddle.x + direction * this.paddle.speed * 0.5;
        if (this.paddle.x < -PAD_MAX_POS_X) {
            this.paddle.x = -PAD_MAX_POS_X;
        } else if (this.paddle.x > PAD_MAX_POS_X) {
            this.paddle.x = PAD_MAX_POS_X;
        }

        this.ballPos = this.predictedBallPos();
        return direction;
    }

    predictedBallPos() {
        const predictedPos = {
            z: this.ballPos.z + this.ballSpeed.z / 10,
            x: this.ballPos.x + this.ballSpeed.x / 10,
        };
        if (predictedPos.x < -gameProperties.GAME_HEIGHT / 2 + gameProperties.BALL_SIZE / 2) {
            predictedPos.x = -gameProperties.GAME_HEIGHT / 2 + gameProperties.BALL_SIZE / 2;
            this.ballSpeed.x *= -1;
        } else if (predictedPos.x > gameProperties.GAME_HEIGHT / 2 - gameProperties.BALL_SIZE / 2) {
            predictedPos.x = gameProperties.GAME_HEIGHT / 2 - gameProperties.BALL_SIZE / 2;
            this.ballSpeed.x *= -1;
        }
        return predictedPos;
    }
}