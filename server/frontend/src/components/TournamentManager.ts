// Handles tournament state, player management, and server event handling
import type { TournamentState, TournamentRound } from "./types";

export class TournamentManager {
  private state: TournamentState = 'waiting';
  private players: string[] = [];
  private round: TournamentRound = 'semifinals';
  private tournamentRoomId = '';
  private afterRound: number = 0; // 1 or 2 to indicate which round has completed


  constructor() {}


  // GETTERS AND SETTERS

  public getPlayers(): string[] {
    return [...this.players];
  }

  public getState(): TournamentState {
    return this.state;
  }

  public setState(state: TournamentState): void {
    this.state = state;
  }

  public getRound(): TournamentRound {
    return this.round;
  }

  public setRound(round: TournamentRound): void {
    this.round = round;
  }

  public getTournamentRoomId(): string | undefined {
    return this.tournamentRoomId;
  }

  public setTournamentRoomId(roomId: string): void {
    this.tournamentRoomId = roomId;
  }

  public getAfterRound(): number {
    return this.afterRound;
  }

  public setAfterRound(afterRound: number): void {
    this.afterRound = afterRound;
  }


  // TOURNAMENT MANAGEMENT

  public registerPlayer(players: string[]): void {
    this.players = players;
  }

  public addPlayer(playerNumber: number, playerName: string): void {
    this.players[playerNumber - 1] = playerName;
  }

  public removePlayer(playerName: string): void {
    const index = this.players.indexOf(playerName);
    this.players[index] = '';
  }

  public async onGameInvite(roomId: string): Promise<void> {
    // Store the room ID
    this.tournamentRoomId = roomId;
  }


  public dispose(): void {
    // Clean up any resources if needed
  }
}
