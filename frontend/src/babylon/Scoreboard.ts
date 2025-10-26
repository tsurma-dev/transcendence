import { AdvancedDynamicTexture, Rectangle, TextBlock, Control } from "@babylonjs/gui";
import type { GameState } from "@shared/types";

export class Scoreboard {
  private guiTexture: AdvancedDynamicTexture;
  private scoreboardContainer: Rectangle;
  private player1NameText!: TextBlock;
  private player1ScoreText!: TextBlock;
  private player2NameText!: TextBlock;
  private player2ScoreText!: TextBlock;
  private gameStatusText!: TextBlock;

  constructor(player1Name: string, player2Name: string, gameMode: 'local' | 'online' | 'AI' | 'tournament'= 'local') {
    this.player1NameText = new TextBlock("player1Name", player1Name || "Player 1");
    this.player2NameText = new TextBlock("player2Name", player2Name || "Player 2");
    // Create GUI texture
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("ScoreboardUI");

    // Create main container
    this.scoreboardContainer = new Rectangle("scoreboardContainer");
    this.scoreboardContainer.width = "250px";
    this.scoreboardContainer.height = "80px";
    this.scoreboardContainer.cornerRadius = 10;
    this.scoreboardContainer.color = "white";
    this.scoreboardContainer.thickness = 2;
    this.scoreboardContainer.background = "rgba(0, 0, 0, 0.7)";
   // **POSITIONING BASED ON GAME MODE**
    if (gameMode === 'local') {
      // **LOCAL: Center top (original position)**
      this.scoreboardContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      this.scoreboardContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.scoreboardContainer.topInPixels = 20;
    } else {
      // **ONLINE: Right top corner**
      this.scoreboardContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.scoreboardContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      this.scoreboardContainer.topInPixels = 20;
      this.scoreboardContainer.leftInPixels = -20; 
    }
    this.guiTexture.addControl(this.scoreboardContainer);

    // Create text elements
    this.createTextElements();
  }

  private createTextElements(): void {
    // Game Status (TOP)
    this.gameStatusText = new TextBlock("gameStatus", "Game starting...");
    this.gameStatusText.color = "white";
    this.gameStatusText.fontSize = "14px";
    this.gameStatusText.fontWeight = "bold";
    this.gameStatusText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.gameStatusText.topInPixels = -25; 
    this.gameStatusText.resizeToFit = true;
    this.scoreboardContainer.addControl(this.gameStatusText);

    // Player 1 (LEFT SIDE - Orange  paddle)
    this.player1NameText = new TextBlock("player1Name", this.player1NameText.text);
    this.player1NameText.color = "#ff6b35"; // **Orange**
    this.player1NameText.fontSize = "18px";
    this.player1NameText.fontWeight = "bold";
    this.player1NameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player1NameText.leftInPixels = -80;
    this.player1NameText.topInPixels = -5;
    this.player1NameText.resizeToFit = true;
    this.scoreboardContainer.addControl(this.player1NameText);

    this.player1ScoreText = new TextBlock("player1Score", "0");
    this.player1ScoreText.color = "#ff6b35"; // **Orange**
    this.player1ScoreText.fontSize = "32px";
    this.player1ScoreText.fontWeight = "bold";
    this.player1ScoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player1ScoreText.leftInPixels = -80;
    this.player1ScoreText.topInPixels = 15; 
    this.player1ScoreText.resizeToFit = true;
    this.scoreboardContainer.addControl(this.player1ScoreText);

    // VS text (CENTER)
    const vsText = new TextBlock("vsText", "VS");
    vsText.color = "white";
    vsText.fontSize = "16px";
    vsText.fontWeight = "bold";
    vsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    vsText.topInPixels = 5;
    vsText.resizeToFit = true;
    this.scoreboardContainer.addControl(vsText);

    // Player 2 (RIGHT SIDE - Pink paddle)
    this.player2NameText = new TextBlock("player2Name", this.player2NameText.text);
    this.player2NameText.color = "#ff69b4"; // **Pink**
    this.player2NameText.fontSize = "18px";
    this.player2NameText.fontWeight = "bold";
    this.player2NameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player2NameText.leftInPixels = 80;
    this.player2NameText.topInPixels = -5;
    this.player2NameText.resizeToFit = true;
    this.scoreboardContainer.addControl(this.player2NameText);

    this.player2ScoreText = new TextBlock("player2Score", "0");
    this.player2ScoreText.color =  "#ff69b4"; // **Pink**
    this.player2ScoreText.fontSize = "32px"; 
    this.player2ScoreText.fontWeight = "bold";
    this.player2ScoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player2ScoreText.leftInPixels = 80;
    this.player2ScoreText.topInPixels = 15;
    this.player2ScoreText.resizeToFit = true;
    this.scoreboardContainer.addControl(this.player2ScoreText);
  }

  updateFromGameState(state: GameState): void {

    // Update game status
    switch (state.status) {
      case 'waiting':
        this.gameStatusText.text = "Game starting...";
        this.gameStatusText.color = "yellow";
        break;
      case 'playing':
        this.gameStatusText.text = "GAME IN PROGRESS";
        this.gameStatusText.color = "lime";
        break;
      case 'finished':
        this.gameStatusText.text = `GAME OVER`;
        this.gameStatusText.color = "gold";
        break;
    }

    // Update scores using the new simplified structure
    if (state.scores) {
      this.player1ScoreText.text = state.scores.player1.toString();
      this.player2ScoreText.text = state.scores.player2.toString();
    } else {
      // Fallback if no scores are provided
      this.player1ScoreText.text = "0";
      this.player2ScoreText.text = "0";
    }
  }

  reset(): void {
    // Reset scores to 0
    this.player1ScoreText.text = "0";
    this.player2ScoreText.text = "0";
    
    // Reset game status
    this.gameStatusText.text = "Game starting...";
    this.gameStatusText.color = "yellow";
  }

  setGameInProgress(): void {
    this.gameStatusText.text = "GAME IN PROGRESS";
    this.gameStatusText.color = "lime";
  }

  updatePlayerNames(player1Name: string, player2Name: string): void {
    this.player1NameText.text = player1Name;
    this.player2NameText.text = player2Name;
  }

  dispose(): void {
    this.guiTexture.dispose();
  }
}