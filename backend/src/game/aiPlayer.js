import { Game } from "../game/pongGame.js";

export class AIplayer {
    constructor(pongGame) {
        //this.roomId = roomId;
        this.game = new Game();
        this.game = pongGame;
        this.prevBallPos = {
			z: 0,
			x: 0,
        };
    }

    updatePaddle() {
        if (this.game.ball.z >= 0 && 
            this.prevBallPos.z < this.game.ball.z) {
            //update direction
            if (this.game.ball.x < this.game.paddle2.x) {
                this.game.paddle2.direction = -1; //move up
            } else if (this.game.ball.x > this.game.paddle2.x) {
                this.game.paddle2.direction = 1; //move down
            } 
        } else {
            this.game.paddle2.direction = 0;
        }
        this.prevBallPos.z = this.game.ball.z;
        this.prevBallPos.x = this.game.ball.x;
    }
}