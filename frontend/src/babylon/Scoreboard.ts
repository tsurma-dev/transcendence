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

  constructor(player1Name: string, player2Name: string, gameMode: 'local' | 'online' | 'AI' = 'local') {
    this.player1NameText = new TextBlock("player1Name", player1Name || "Player 1");
    this.player2NameText = new TextBlock("player2Name", player2Name || "Player 2");
    // Create GUI texture
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI("ScoreboardUI");

    // Create main container
    this.scoreboardContainer = new Rectangle("scoreboardContainer");
    this.scoreboardContainer.widthInPixels = 400;
    this.scoreboardContainer.heightInPixels = 150;
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
      this.scoreboardContainer.leftInPixels = -20; // **20px from right edge**
    }
    this.guiTexture.addControl(this.scoreboardContainer);

    // Create text elements
    this.createTextElements();
  }

  private createTextElements(): void {
    // Game Status (TOP)
    this.gameStatusText = new TextBlock("gameStatus", "Game starting...");
    this.gameStatusText.color = "white";
    this.gameStatusText.fontSize = 16;
    this.gameStatusText.fontWeight = "bold";
    this.gameStatusText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.gameStatusText.topInPixels = -60; // Move higher
    this.scoreboardContainer.addControl(this.gameStatusText);

    // Player 1 (LEFT SIDE - Orange  paddle)
    this.player1NameText = new TextBlock("player1Name", this.player1NameText.text);
    this.player1NameText.color = "#ff6b35"; // **Orange**
    this.player1NameText.fontSize = 18;
    this.player1NameText.fontWeight = "bold";
    this.player1NameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player1NameText.leftInPixels = -100; // Move closer to center
    this.player1NameText.topInPixels = -20; // Move up
    this.scoreboardContainer.addControl(this.player1NameText);

    this.player1ScoreText = new TextBlock("player1Score", "0");
    this.player1ScoreText.color = "#ff6b35"; // **Orange**
    this.player1ScoreText.fontSize = 32; // Bigger
    this.player1ScoreText.fontWeight = "bold";
    this.player1ScoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player1ScoreText.leftInPixels = -100;
    this.player1ScoreText.topInPixels = 10; // Below name
    this.scoreboardContainer.addControl(this.player1ScoreText);

    // VS text (CENTER)
    const vsText = new TextBlock("vsText", "VS");
    vsText.color = "white";
    vsText.fontSize = 16;
    vsText.fontWeight = "bold";
    vsText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    vsText.topInPixels = -5; // Center vertically
    this.scoreboardContainer.addControl(vsText);

    // Player 2 (RIGHT SIDE - Pink paddle)
    this.player2NameText = new TextBlock("player2Name", this.player2NameText.text);
    this.player2NameText.color = "#ff69b4"; // **Pink**
    this.player2NameText.fontSize = 18;
    this.player2NameText.fontWeight = "bold";
    this.player2NameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player2NameText.leftInPixels = 100; // Move closer to center
    this.player2NameText.topInPixels = -20; // Move up
    this.scoreboardContainer.addControl(this.player2NameText);

    this.player2ScoreText = new TextBlock("player2Score", "0");
    this.player2ScoreText.color =  "#ff69b4"; // **Pink**
    this.player2ScoreText.fontSize = 32; // Bigger
    this.player2ScoreText.fontWeight = "bold";
    this.player2ScoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.player2ScoreText.leftInPixels = 100;
    this.player2ScoreText.topInPixels = 10; // Below name
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