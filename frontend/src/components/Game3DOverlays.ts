
import type { TournamentState, TournamentRound} from "./types";

export class Game3DOverlays {
    private container: HTMLElement;
    private loadingOverlay?: HTMLElement;
    private roomCreatedOverlay?: HTMLElement;
    private tournamentConnectingOverlay?: HTMLElement;
    private tournamentLobbyOverlay?: HTMLElement;
    private gameEndOverlay?: HTMLElement;

    public poolScene?: { dispose: () => void };
    public onReturnToMenu?: () => Promise<void>;
    public onRestartLocalGame?: () => void;
    public onStartTournamentGame?: (roomId: string) => Promise<void>;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    setupUI(): void {
        this.createLoadingOverlay();
        this.createRoomCreatedOverlay();
        this.createTournamentConnectingOverlay();
        this.createTournamentLobbyOverlay();
        this.createGameEndOverlay();
        this.createQuitButton();
    }

    private static readonly PONG_ASCII = [
        "_|_|_|      _|_|    _|      _|    _|_|_|",
        "_|    _|  _|    _|  _|_|    _|  _|      ",
        "_|_|_|    _|    _|  _|  _|  _|  _|  _|_|",
        "_|        _|    _|  _|    _|_|  _|    _|",
        "_|          _|_|    _|      _|    _|_|_|"
    ].join('\n');

    //==============================================
    // Overlay creation
    //===============================================

    // REPEATING ELEMENTS

    private createBaseOverlay(zIndex: number): HTMLElement {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom right, #fde047, #f59e0b, #fb923c);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: ${zIndex};
            `;
        return overlay;
    }

    private createPongContentWrapper(content: string): string {
        return `
         <div class="container-main-pink max-w-lg text-center">
            <div class="text-center mb-8">
            <pre class="font-mono text-black text-1xl font-bold drop-shadow-lg">${Game3DOverlays.PONG_ASCII}</pre>
            </div>
            ${content}
        </div>
        `;
    }

    // LOADING OVERLAY
    private createLoadingOverlay(): void {
        this.loadingOverlay = this.createBaseOverlay(20);
        this.loadingOverlay.style.display = 'flex';
        this.loadingOverlay.innerHTML = this.createPongContentWrapper(`
        <div>
            <div class="text-black font-mono text-2xl font-bold drop-shadow-lg animate-pulse text-center mb-6">
            Loading game assets...
            </div>
        </div>
        `);
        this.container.appendChild(this.loadingOverlay);
    }

    // ROOM CREATED OVERLAY
    private createRoomCreatedOverlay(): void {
        this.roomCreatedOverlay = this.createBaseOverlay(25);
        this.container.appendChild(this.roomCreatedOverlay);
    }

    // TOURNAMENT CONNECTING OVERLAY
    private createTournamentConnectingOverlay(): void {
        this.tournamentConnectingOverlay = this.createBaseOverlay(25);
        this.container.appendChild(this.tournamentConnectingOverlay);
    }

    // TOURNAMENT LOBBY OVERLAY
    private createTournamentLobbyOverlay(): void {
        this.tournamentLobbyOverlay = this.createBaseOverlay(25);
        // Enable scrolling for lobby overlay
        this.tournamentLobbyOverlay.style.overflowY = 'auto';
        this.tournamentLobbyOverlay.style.maxHeight = '100vh';
        this.container.appendChild(this.tournamentLobbyOverlay);
    }

    // GAME END POP-UP OVERLAY
    private createGameEndOverlay(): void {
        this.gameEndOverlay = document.createElement("div");
        this.gameEndOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 30;
            `;
        this.container.appendChild(this.gameEndOverlay);
    }

    // QUIT BUTTON AND CONFIRMATION
    private createQuitButton(): void {
        const quitButton = document.createElement('button');
        quitButton.id = 'quit-button';
        quitButton.innerHTML = 'Quit';
        quitButton.style.cssText = `
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 1000;
            background-color: #000000;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            display: none;
            `;
        quitButton.addEventListener('mouseenter', () => {
            quitButton.style.backgroundColor = '#374151';
        });
        quitButton.addEventListener('mouseleave', () => {
            quitButton.style.backgroundColor = '#000000';
        });
        quitButton.addEventListener('click', () => {
            this.showQuitConfirmation();
        });
        this.container.appendChild(quitButton);

        // Create confirmation overlay
        const confirmOverlay = document.createElement('div');
        confirmOverlay.id = 'quit-confirmation-overlay';
        confirmOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1001;
            `;
        const confirmContent = document.createElement('div');
        confirmContent.style.cssText = `
            background-color: white;
            padding: 32px;
            border-radius: 8px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            text-align: center;
            max-width: 400px;
            `;
        const confirmTitle = document.createElement('h3');
        confirmTitle.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #374151;
            `;
        confirmTitle.textContent = 'Quit Game?';
        const confirmMessage = document.createElement('p');
        confirmMessage.style.cssText = `
            color: #6b7280;
            margin-bottom: 24px;
            line-height: 1.5;
            `;
        confirmMessage.textContent = 'Are you sure you want to quit the game and return to menu?';
        const confirmButtons = document.createElement('div');
        confirmButtons.style.cssText = `
            display: flex;
            gap: 16px;
            justify-content: center;
            `;
        const cancelButton = document.createElement('button');
        cancelButton.style.cssText = `
            padding: 8px 24px;
            background-color: #d1d5db;
            color: #374151;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
            `;
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.backgroundColor = '#9ca3af';
        });
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.backgroundColor = '#d1d5db';
        });
        cancelButton.addEventListener('click', () => {
            this.hideQuitConfirmation();
        });
        const confirmQuitButton = document.createElement('button');
        confirmQuitButton.style.cssText = `
            padding: 8px 24px;
            background-color: #ec4899;
            color: white;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
            `;
        confirmQuitButton.textContent = 'Quit';
        confirmQuitButton.addEventListener('mouseenter', () => {
            confirmQuitButton.style.backgroundColor = '#db2777';
        });
        confirmQuitButton.addEventListener('mouseleave', () => {
            confirmQuitButton.style.backgroundColor = '#ec4899';
        });
        confirmQuitButton.addEventListener('click', async () => {
            this.hideQuitConfirmation();
            this.hideQuitButton();
            if (this.onReturnToMenu) await this.onReturnToMenu();
        });
        confirmButtons.appendChild(cancelButton);
        confirmButtons.appendChild(confirmQuitButton);
        confirmContent.appendChild(confirmTitle);
        confirmContent.appendChild(confirmMessage);
        confirmContent.appendChild(confirmButtons);
        confirmOverlay.appendChild(confirmContent);
        this.container.appendChild(confirmOverlay);
    }

    //==============================================
    // Overlay Update methods
    //===============================================

    // LOADING SCREEN

    public showLoadingScreen(): void {
        this.hideQuitButton();
        console.log('⏳ Showing loading screen');
        if (this.loadingOverlay) this.loadingOverlay.style.display = "flex";
        if (this.roomCreatedOverlay) this.roomCreatedOverlay.style.display = "none";
    }

    public hideLoadingScreen(): void {
        console.log('✅ Hiding loading screen');
        if (this.loadingOverlay) this.loadingOverlay.style.display = "none";
    }

    // ROOM CREATED SCREEN

    public showRoomCreatedScreen(roomId?: string): void {
        if (!this.roomCreatedOverlay) return;

        this.hideQuitButton();

        const displayRoomId = roomId || '------';
        this.roomCreatedOverlay.innerHTML = this.createPongContentWrapper(`
        <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">Room Created!</p>
        <div class="mb-6">
            <p class="font-mono text-black text-lg font-bold mb-2">Room ID:</p>
            <div class="relative">
                <div class="w-full bg-black text-white font-mono text-2xl font-bold px-8 py-3 rounded border-4 border-black text-center">
                    <span id="roomIdDisplay">${displayRoomId}</span>
                </div>
                <button id="copyRoomIdBtn"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-500 text-sm transition-colors duration-150"
                    title="Copy Room ID">
                    🔗
                </button>
            </div>
        </div>
        <div class="animate-pulse mb-6">
            <p class="font-mono text-black text-lg font-bold">Waiting for Player 2...</p>
        </div>
        <div class="space-y-4">
            <button id="backToMenuFromWaitingBtn"
                class="w-full px-6 py-4 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 text-white font-bold text-lg rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-mono uppercase tracking-wider">
                ← Back
            </button>
        </div> `
        );

        this.roomCreatedOverlay.style.display = "flex";

        // Add event listeners
        const copyBtn = this.roomCreatedOverlay.querySelector('#copyRoomIdBtn');
        const backBtn = this.roomCreatedOverlay.querySelector('#backToMenuFromWaitingBtn');

        copyBtn?.addEventListener('click', () => {
            const roomIdElement = document.getElementById('roomIdDisplay');
            if (roomIdElement) {
                const roomId = roomIdElement.textContent || '';
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(roomId).then(() => {
                        copyBtn.textContent = '✅';
                        setTimeout(() => {
                            copyBtn.textContent = '🔗';
                        }, 1000);
                    }).catch(() => {
                        // Fallback for older browsers
                        alert(`Room ID: ${roomId}\nCopy this manually!`);
                    });
                } else {
                    // Fallback for older browsers
                    alert(`Room ID: ${roomId}\nCopy this manually!`);
                }
            }
        });

        backBtn?.addEventListener('click', async () => {
            if (this.onReturnToMenu) await this.onReturnToMenu();
        });
    }

    public hideRoomCreatedScreen(): void {
        if (this.roomCreatedOverlay) this.roomCreatedOverlay.style.display = "none";
    }

    // TOURNAMENT CONNECTING SCREEN

    public showTournamentConnectingScreen(): void {
        if (!this.tournamentConnectingOverlay) return;

        this.hideQuitButton();

        this.tournamentConnectingOverlay.innerHTML = this.createPongContentWrapper(`
            <p class="font-mono text-black text-2xl font-bold drop-shadow-lg mb-6">🏆 Joining Tournament</p>
            <div class="mb-6">
                <div class="text-black font-mono text-lg animate-pulse text-center">
                Connecting to tournament server...
                </div>
            </div>
            <div class="space-y-4">
                <button id="cancelTournamentBtn"
                    class="w-full px-6 py-4 bg-gradient-to-b from-red-400 to-red-600 hover:from-red-300 hover:to-red-500 text-white font-bold text-lg rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 font-mono uppercase tracking-wider">
                    ← Cancel
                </button>
            </div>
        `);

        this.tournamentConnectingOverlay.style.display = "flex";

        // Add event listener for cancel button
        const cancelBtn = this.tournamentConnectingOverlay.querySelector('#cancelTournamentBtn');
        cancelBtn?.addEventListener('click', async () => {
            if (this.onReturnToMenu) await this.onReturnToMenu();
        });
    }

    public hideTournamentConnectingScreen(): void {
        if (this.tournamentConnectingOverlay) this.tournamentConnectingOverlay.style.display = "none";
    }


    // TOURNAMENT LOBBY SCREEN

    public showTournamentLobbyScreen(): void {
        if (!this.tournamentLobbyOverlay) return;

        this.hideQuitButton();
        this.tournamentLobbyOverlay.innerHTML = `
        <div class="min-h-full p-4 flex items-center justify-center">
            <div class="container-main-pink max-w-4xl w-full">
                <div class="text-center mb-8">
                    <h1 class="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                        🏆 Tournament Lobby
                    </h1>
                    <p class="text-black font-mono text-lg" id="tournamentStatusMessage">
                        Waiting for players to join...
                    </p>
                </div>

                <!-- Tournament Info Panel -->
                <div class="container-white p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="text-center">
                        <div class="text-black text-2xl font-bold font-mono" id="tournamentPlayers">-</div>
                        <div class="text-black text-sm font-mono uppercase">Players Joined</div>
                        </div>
                        <div class="text-center">
                        <div class="text-black text-2xl font-bold font-mono" id="tournamentMaxPlayers">4</div>
                        <div class="text-black text-sm font-mono uppercase">Max Players</div>
                        </div>
                        <div class="text-center">
                        <div class="text-black text-2xl font-bold font-mono" id="tournamentStatus">Loading...</div>
                        <div class="text-black text-sm font-mono uppercase">Status</div>
                        </div>
                    </div>
                </div>

                <!-- Players List -->
                <div class="container-white p-6 mb-6">
                    <h2 class="text-2xl font-bold text-black mb-4 font-mono uppercase text-center">Players</h2>
                    <div id="tournamentPlayersList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Player slots will be populated dynamically -->
                        <div class="col-span-2 text-center text-gray-500 font-mono p-8">
                        Loading tournament players...
                        </div>
                    </div>
                </div>

                <!-- Tournament Matches -->
                <div class="container-white p-6 mb-6">
                    <h2 class="text-2xl font-bold text-black mb-4 font-mono uppercase text-center">Tournament Matches</h2>

                    <!-- Placeholder (shown when waiting for players) -->
                    <div id="tournamentPlaceholder" class="text-center">
                        <div class="inline-block border-2 border-dashed border-gray-400 p-8 rounded-none">
                            <div class="text-content">Matches will be generated when all players join</div>
                        </div>
                    </div>

                    <!-- Tournament Bracket (hidden by default) -->
                    <div id="tournamentBracketContainer" class="tournament-bracket space-y-6 hidden">
                        
                        <!-- Semifinals -->
                        <div class="semifinals">
                            <h3 class="text-lg font-bold text-black mb-4 text-center font-mono uppercase">Semifinals</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                
                                <!-- Semi-Final 1 -->
                                <div class="match-card container-shadowed bg-gradient-to-r from-blue-100 to-blue-200 p-4">
                                    <div class="text-center mb-2">
                                        <div class="text-black font-mono font-bold text-sm">SEMIFINAL 1</div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex items-center justify-between p-2 bg-white border-2 border-black">
                                            <span id="semi1Player1" class="font-mono font-bold text-black">Player 1</span>
                                            <span class="text-black">VS</span>
                                            <span id="semi1Player2" class="font-mono font-bold text-black">Player 2</span>
                                        </div>
                                        <div class="text-center">
                                            <span id="semi1Status" class="text-xs font-mono uppercase text-black bg-yellow-200 px-2 py-1 border border-black">
                                                PENDING
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Semi-Final 2 -->
                                <div class="match-card container-shadowed bg-gradient-to-r from-green-100 to-green-200 p-4">
                                    <div class="text-center mb-2">
                                        <div class="text-black font-mono font-bold text-sm">SEMIFINAL 2</div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex items-center justify-between p-2 bg-white border-2 border-black">
                                            <span id="semi2Player1" class="font-mono font-bold text-black">Player 3</span>
                                            <span class="text-black">VS</span>
                                            <span id="semi2Player2" class="font-mono font-bold text-black">Player 4</span>
                                        </div>
                                        <div class="text-center">
                                            <span id="semi2Status" class="text-xs font-mono uppercase text-black bg-yellow-200 px-2 py-1 border border-black">
                                                PENDING
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Final -->
                        <div class="finals">
                            <h3 class="text-lg font-bold text-black mb-4 text-center font-mono uppercase">Final</h3>
                            <div class="flex justify-center">
                                <div class="match-card container-shadowed bg-gradient-to-r from-yellow-100 to-yellow-200 p-6 w-full max-w-md">
                                    <div class="text-center mb-4">
                                        <div class="text-black font-mono font-bold text-lg">🏆 FINAL MATCH</div>
                                    </div>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-center p-3 bg-white border-2 border-black">
                                            <span id="finalPlayer1" class="text-gray-500 font-mono italic">Winner of SF1</span>
                                            <span class="mx-4 text-black font-bold">VS</span>
                                            <span id="finalPlayer2" class="text-gray-500 font-mono italic">Winner of SF2</span>
                                        </div>
                                        <div class="text-center">
                                            <span id="finalStatus" class="text-xs font-mono uppercase text-black bg-gray-200 px-2 py-1 border border-black">
                                                WAITING
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Bronze Match -->
                        <div class="bronze-match mt-6">
                            <h3 class="text-lg font-bold text-black mb-4 text-center font-mono uppercase">3rd Place Match</h3>
                            <div class="flex justify-center">
                                <div class="match-card container-shadowed bg-gradient-to-r from-orange-100 to-orange-200 p-6 w-full max-w-md">
                                    <div class="text-center mb-4">
                                        <div class="text-black font-mono font-bold text-lg">🥉 BRONZE MATCH</div>
                                    </div>
                                    <div class="space-y-4">
                                        <div class="flex items-center justify-center p-3 bg-white border-2 border-black">
                                            <span id="bronzePlayer1" class="text-gray-500 font-mono italic">Loser of SF1</span>
                                            <span class="mx-4 text-black font-bold">VS</span>
                                            <span id="bronzePlayer2" class="text-gray-500 font-mono italic">Loser of SF2</span>
                                        </div>
                                        <div class="text-center">
                                            <span id="bronzeStatus" class="text-xs font-mono uppercase text-black bg-gray-200 px-2 py-1 border border-black">
                                                WAITING
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            <!-- Tournament Start Button -->
            <div class="flex justify-center mt-6">
                <button id="startTournamentBtn" class="btn-green px-8 py-3 text-lg font-bold w-full max-w-md" style="display: none;">
                    START TOURNAMENT
                </button>
            </div>

            <!-- Leave Tournament Button-->
            <div class="flex justify-center mt-6">
                <button
                    id="leaveTournamentBtn"
                    class="btn-red px-8 py-3 text-lg font-bold w-full max-w-md">
                    Leave Tournament
                </button>
            </div>
        </div>
        `;

        this.tournamentLobbyOverlay.style.display = "block";

        // Add event listeners
        const leaveTournamentBtn = this.tournamentLobbyOverlay.querySelector('#leaveTournamentBtn');

        leaveTournamentBtn?.addEventListener('click', async () => {
            if (this.onReturnToMenu) await this.onReturnToMenu();
        });
    }

    public hideTournamentLobbyScreen(): void {
        if (this.tournamentLobbyOverlay) this.tournamentLobbyOverlay.style.display = "none";
    }

    // Update tournament lobby with current players and state
    public updateTournamentLobby(players: string[], state: string): void {
        if (!this.tournamentLobbyOverlay || this.tournamentLobbyOverlay.style.display === 'none') return;

        // Ensure players array is always 4 slots
        const slots = 4;
        const normalizedPlayers = Array.from({ length: slots }, (_, i) => players[i] || "");

        const joinedCount = normalizedPlayers.filter(p => p.trim() !== '').length;

        // Update tournament status
        const statusElement = document.getElementById('tournamentStatus');
        if (statusElement) {
        statusElement.textContent = state.toUpperCase();
        }

        // Update Players Joined count
        const playerCountElement = document.getElementById('tournamentPlayers');
        if (playerCountElement) {
        playerCountElement.textContent = joinedCount.toString();
        }

        // Update main status message based on player count
        const statusMessageElement = document.getElementById('tournamentStatusMessage');
        if (statusMessageElement) {
        if (normalizedPlayers.filter(p => p.trim() !== '').length >= 4) {
            statusMessageElement.textContent = 'All players ready!';
            statusMessageElement.style.color = '';
            statusMessageElement.style.fontWeight = '';
            const statusElement = document.getElementById('tournamentStatus');
            if (statusElement) {
                statusElement.textContent = 'ONGOING';
                statusElement.style.color = '#00dd00';
                statusElement.style.fontWeight = 'bold';
            }
        } else {
            statusMessageElement.textContent = 'Waiting for players to join...';
            statusMessageElement.style.color = '';
            statusMessageElement.style.fontWeight = '';
        }
        }

        // Update player list
        const playersList = document.getElementById('tournamentPlayersList');
        if (playersList) {
        // Always show 4 slots
        const playerSlots = [];
        for (let i = 0; i < slots; i++) {
            const player = normalizedPlayers[i];
            if (player && player.trim() !== '') {
            playerSlots.push(`
                <div class="bg-white border-2 border-black p-4 text-center">
                <div class="text-black font-mono font-bold text-lg">${player}</div>
                <div class="text-green-600 font-mono text-sm">✓ READY</div>
                </div>
            `);
            } else {
            playerSlots.push(`
                <div class="bg-gray-100 border-2 border-dashed border-gray-400 p-4 text-center">
                <div class="text-gray-500 font-mono font-bold text-lg">Waiting...</div>
                <div class="text-gray-400 font-mono text-sm">Player ${i + 1}</div>
                </div>
            `);
            }
        }
        playersList.innerHTML = playerSlots.join('');
        }

        // Show/hide tournament bracket based on player count
        const placeholderElement = document.getElementById('tournamentPlaceholder');
        const bracketElement = document.getElementById('tournamentBracketContainer');

        if (joinedCount >= 4) {
        if (placeholderElement) placeholderElement.style.display = 'none';
        if (bracketElement) {
            bracketElement.classList.remove('hidden');
            // Update semifinal matches
            const semi1Player1 = document.getElementById('semi1Player1');
            const semi1Player2 = document.getElementById('semi1Player2');
            const semi2Player1 = document.getElementById('semi2Player1');
            const semi2Player2 = document.getElementById('semi2Player2');
            if (semi1Player1) semi1Player1.textContent = normalizedPlayers[0] || 'Player 1';
            if (semi1Player2) semi1Player2.textContent = normalizedPlayers[1] || 'Player 2';
            if (semi2Player1) semi2Player1.textContent = normalizedPlayers[2] || 'Player 3';
            if (semi2Player2) semi2Player2.textContent = normalizedPlayers[3] || 'Player 4';
        }
        } else {
        if (placeholderElement) placeholderElement.style.display = 'block';
        if (bracketElement) bracketElement.classList.add('hidden');
        }
    }


    // Enable the existing start tournament button
    public showStartTournamentButton(roomId: string): void {
        const startTournamentBtn = this.tournamentLobbyOverlay?.querySelector('#startTournamentBtn') as HTMLButtonElement;

        if (startTournamentBtn) {
        startTournamentBtn.style.display = 'block';
        startTournamentBtn.disabled = false;
        startTournamentBtn.style.opacity = '1';
        startTournamentBtn.textContent = '🎮 START TOURNAMENT GAME';

        startTournamentBtn.addEventListener('click', async () => {
            if (this.onStartTournamentGame && roomId) {
            await this.onStartTournamentGame(roomId);
            }
        });
        }
    }

    // GAME END OVERLAY POP-UP - also used for DISCONNECTS

    public showGameEndOverlay(winner: string, isLocalGame: boolean): void {
        if (!this.gameEndOverlay) return;

        this.gameEndOverlay.innerHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            padding: 24px;
            max-width: 448px;
            text-align: center;
            border: 4px solid black;">
            <div style="margin-bottom: 24px;">
            <h2 style="
                font-family: monospace; 
                color: white; 
                font-size: 30px; 
                font-weight: bold; 
                margin-bottom: 8px;">
                🏆 Game Over
            </h2>
            <p style="
                font-family: monospace; 
                color: white; 
                font-size: 20px; 
                font-weight: bold;">
                ${winner} Wins!
            </p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${isLocalGame ? `
          <button id="playAgainBtn" style="
            width: 100%;
            color: white ;
            font-family: monospace ;
            font-size: 18px ;
            font-weight: bold ;
            background: rgb(249, 115, 22) ;
            padding: 12px 24px ;
            border-radius: 8px ;
            border: 2px solid black ;
            cursor: pointer ;
            transition: all 0.2s ;
            " onmouseover="this.style.background='rgb(234, 88, 12)'" onmouseout="this.style.background='rgb(249, 115, 22)'">
            🎮 Play Again
          </button>
          ` : ''}

          <button id="returnToMenuBtn" style="
            width: 100% ;
            color: white ;
            font-family: monospace ;
            font-size: 18px ;
            font-weight: bold ;
            background: rgb(236, 72, 153) ;
            padding: 12px 24px ;
            border-radius: 8px ;
            border: 2px solid black ;
            cursor: pointer ;
            transition: all 0.2s ;
            " onmouseover="this.style.background='rgb(219, 39, 119)'" onmouseout="this.style.background='rgb(236, 72, 153)'">
            🏠 Return to Menu
          </button>
        </div>
      </div>
    `;

        // Add return to menu listener
        const returnToMenuBtnImmediate = this.gameEndOverlay.querySelector('#returnToMenuBtn');
        returnToMenuBtnImmediate?.addEventListener('click', async () => {
            if (this.onReturnToMenu) await this.onReturnToMenu();
        });

        // Add event listeners
        const playAgainBtn = this.gameEndOverlay.querySelector('#playAgainBtn');
        const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');

        // Only add Play Again listener for local games
        if (isLocalGame && playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                if (this.onRestartLocalGame) this.onRestartLocalGame();
            });
        }

        returnToMenuBtn?.addEventListener('click', async () => {
            if (this.onReturnToMenu) await this.onReturnToMenu();
        });

        // Show the overlay
        this.gameEndOverlay.style.display = "flex";
    }

    public hideGameEndOverlay(): void {
        if (this.gameEndOverlay) this.gameEndOverlay.style.display = "none";
    }

    // TOURNAMENT GAME END OVERLAY - shows different content based on round and state

    public showTournamentGameEndOverlay(round: TournamentRound, state: TournamentState, isCurrentPlayerWinner: boolean, winner: string, roomID: string | null, afterRound: number): void {
        if (!this.gameEndOverlay) return;

        // After first round:
        // Show waiting if no room ID, continue if room ID is present
        if (afterRound === 1) {
            let overlayContent = '';
            if (roomID) {
                overlayContent = `
                <button id="continueTournamentBtn" style="
                    width: 100%; 
                    color: white; 
                    font-family: monospace; 
                    font-size: 18px; 
                    font-weight: bold; 
                    background: rgb(34, 197, 94); 
                    padding: 12px 24px; 
                    border-radius: 8px; 
                    border: 2px solid black; 
                    cursor: pointer; 
                    transition: background 0.2s, transform 0.2s;">
                    🎮 CONTINUE TO MATCH
                </button>`;
            } else {
                overlayContent = `
                <div id="waitingForOtherGame" class="animate-pulse" style="
                    width: 100%; 
                    color: #333; 
                    font-family: monospace; 
                    font-size: 18px; 
                    font-weight: bold; 
                    background: #f3f4f6; 
                    padding: 12px 24px; 
                    border-radius: 8px; 
                    border: 2px solid #aaa; 
                    margin-bottom: 8px;">
                    ⏳ Waiting for the other game to finish...
                </div>`;
            }
            this.gameEndOverlay.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                padding: 24px;
                max-width: 448px;
                text-align: center;
                border: 4px solid black;">
                <div style="margin-bottom: 24px">
                    <h2 style="
                        font-family: monospace; 
                        color: white; 
                        font-size: 30px; 
                        font-weight: bold; 
                        margin-bottom: 8px;">
                        ${isCurrentPlayerWinner ? '🏆 You Won!!' : '💔 You Lost!'}
                    <p style="
                        font-family: monospace; 
                        color: rgb(249, 115, 22); 
                        font-size: 16px; 
                        margin-top: 8px;">
                        ${isCurrentPlayerWinner ? 'You advance to the Final!' : 'You can still fight for 3rd place!'}
                    </p>
                </div>
                <div style="
                    display: flex; 
                    flex-direction: column; 
                    gap: 12px;">
                    ${overlayContent}
                    <button id="returnToMenuBtn" style="
                        width: 100%;
                        color: white;
                        font-family: monospace;
                        font-size: 16px;
                        font-weight: bold;
                        background: rgb(107, 114, 128);
                        padding: 10px 20px;
                        border-radius: 8px;
                        border: 2px solid black;
                        cursor: pointer;
                        transition: all 0.2s;" 
                        onmouseover="this.style.background='rgb(75, 85, 99)'" onmouseout="this.style.background='rgb(107, 114, 128)'">
                        🏠 Return to Menu
                    </button>
                </div>
            </div>`;
            // Add event listeners
            const continueBtn = this.gameEndOverlay.querySelector('#continueTournamentBtn');
            if (continueBtn) {
                const btn = continueBtn as HTMLElement;
                btn.addEventListener('click', async () => {
                    if (roomID) {
                        if (this.onStartTournamentGame) {
                            await this.onStartTournamentGame(roomID);
                        }
                    }
                });
                // Add onmouseover/onmouseout for hover effect
                btn.onmouseover = function () {
                    btn.style.background = 'rgba(13, 182, 50, 0.68), 1)';
                    btn.style.transform = 'scale(1.04)';
                };
                btn.onmouseout = function () {
                    btn.style.background = 'rgb(34, 197, 94)';
                    btn.style.transform = 'scale(1)';
                };
            }
            const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');
            returnToMenuBtn?.addEventListener('click', async () => {
                if (this.onReturnToMenu) await this.onReturnToMenu();
            });
            // Show the overlay
            this.gameEndOverlay.style.display = "flex";
        }
        // After final round:
        else  {
            // If tournament is finished, show go to results button immediately
            let resultsButtonHtml = '';
            if (state === 'finished') {
                resultsButtonHtml = `<button id="goToResultsBtn" style="
                    width: 100% ; 
                    color: white; 
                    font-family: monospace; 
                    font-size: 18px; 
                    font-weight: bold; 
                    background: rgb(236, 72, 153); 
                    padding: 12px 24px; 
                    border-radius: 8px; 
                    border: 2px solid black; 
                    cursor: pointer; 
                    transition: all 0.2s;" 
                    onmouseover="this.style.background='rgb(219, 39, 119)'" onmouseout="this.style.background='rgb(236, 72, 153)'">
                    🏆 View Tournament Results
                </button>`;
            }
            this.gameEndOverlay.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.4) ;
                backdrop-filter: blur(10px) ;
                border-radius: 12px ;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) ;
                padding: 32px ;
                max-width: 500px ;
                text-align: center ;
                border: 4px solid black ;">
                <div style="margin-bottom: 32px ;">
                    <h1 style="font-family: monospace ; color: white ; font-size: 36px ; font-weight: bold ; margin-bottom: 16px ;">
                    ${isCurrentPlayerWinner ? '🏆 YOU WON!' : '💔 YOU LOST!'}
                    </h1>
                    <p style="font-family: monospace ; color: white ; font-size: 18px ; font-weight: bold ;">
                    ${round === 'final' ?
                            (isCurrentPlayerWinner ? 'You are the Tournament Champion!' : `${winner} is the Tournament Champion!`) :
                            (isCurrentPlayerWinner ? 'You won 3rd place!' : `${winner} takes 3rd place!`)
                        }
                    </p>
                </div>
                <div style="font-family: monospace ; color: rgb(249, 115, 22) ; font-size: 16px ;">
                    ${state === 'finished' ? '' : '<div id="waitingForFinalResults">⏳ Waiting for the other game to end...</div>'}
                </div>
                <div style="margin-top: 24px;">
                    ${resultsButtonHtml}
                </div>
                <div style="margin-top: 12px;">
                    <button id="returnToMenuBtn" style="width: 100% ; color: white ; font-family: monospace ; font-size: 16px ; font-weight: bold ; background: rgb(107, 114, 128) ; padding: 10px 20px ; border-radius: 8px ; border: 2px solid black ; cursor: pointer ; transition: all 0.2s ;" onmouseover="this.style.background='rgb(75, 85, 99)'" onmouseout="this.style.background='rgb(107, 114, 128)'">🏠 Return to Menu</button>
                </div>
            </div>
         `;

            this.gameEndOverlay.style.display = "flex";
            // Add go to results button handler if present
            const goToResultsBtn = this.gameEndOverlay.querySelector('#goToResultsBtn');
            goToResultsBtn?.addEventListener('click', () => {
                if (this.poolScene) {
                    this.poolScene.dispose();
                }
                this.gameEndOverlay!.style.display = 'none';
                if (this.tournamentLobbyOverlay) {
                    this.tournamentLobbyOverlay.style.display = 'block';
                }
            });
            // Add return to menu button handler
            const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');
            returnToMenuBtn?.addEventListener('click', async () => {
                if (this.onReturnToMenu) await this.onReturnToMenu();
            });

            this.gameEndOverlay.style.display = "flex";
            return;
        }
    }


    public updateGameEndOverlayMessage(roomId: string): void {
      if (this.gameEndOverlay && this.gameEndOverlay.style.display === 'flex') {
        const waitingDiv = this.gameEndOverlay.querySelector('#waitingForOtherGame');
        if (waitingDiv) {
          waitingDiv.outerHTML = `<button id="continueTournamentBtn" style=
            "width: 100% ; 
            color: white ; 
            font-family: monospace ; 
            font-size: 18px ; 
            font-weight: bold ; 
            background: rgb(34, 197, 94) ; 
            padding: 12px 24px ; 
            border-radius: 8px ; 
            border: 2px solid black ; 
            cursor: pointer ; 
            transition: all 0.2s ;">
            🎮 CONTINUE TO MATCH
            </button>`;
          const continueBtn = this.gameEndOverlay.querySelector('#continueTournamentBtn');
          continueBtn?.addEventListener('click', async () => {
            if (this.onStartTournamentGame && roomId) {
              await this.onStartTournamentGame(roomId);
            }
          });
        }
      }
    }

    public updateSeeResultsButton(): void {
        // If we are in the final sequence, swap waiting for a button
        if (this.gameEndOverlay) {
            const waitingDiv = this.gameEndOverlay.querySelector('#waitingForFinalResults');
            if (waitingDiv) {
                waitingDiv.outerHTML = `<button id="goToResultsBtn" style="width: 100% ; color: white ; font-family: monospace ; font-size: 18px ; font-weight: bold ; background: rgb(236, 72, 153) ; padding: 12px 24px ; border-radius: 8px ; border: 2px solid black ; cursor: pointer ; transition: all 0.2s ;">🏆 View Tournament Results</button>`;
                const goToResultsBtn = this.gameEndOverlay.querySelector('#goToResultsBtn');
                goToResultsBtn?.addEventListener('click', () => {
                    this.poolScene?.dispose();
                    this.gameEndOverlay!.style.display = 'none';
                    if (this.tournamentLobbyOverlay) {
                        this.tournamentLobbyOverlay.style.display = 'block';
                    }
                });
            }
        }
    }

    // TOURNAMENT RESULTS OVERLAY

    // Handle tournament round completion (e.g., semifinals, finals)
    public updateTournamentFirstRoundResults(results: any): void {

        // Parse and update match results in the lobby
        if (results.matchA && results.matchB) {
        // Update semifinals match cards
        const semi1Player1 = document.getElementById('semi1Player1');
        const semi1Player2 = document.getElementById('semi1Player2');
        const semi1Status = document.getElementById('semi1Status');
        if (semi1Player1) semi1Player1.textContent = results.matchA.player1;
        if (semi1Player2) semi1Player2.textContent = results.matchA.player2;
        if (semi1Status) {
            semi1Status.textContent = `${results.matchA.score[0]} - ${results.matchA.score[1]} | Winner: ${results.matchA.winner}`;
            semi1Status.style.background = '#bbf7d0';
            semi1Status.style.color = '#166534';
        }

        const semi2Player1 = document.getElementById('semi2Player1');
        const semi2Player2 = document.getElementById('semi2Player2');
        const semi2Status = document.getElementById('semi2Status');
        if (semi2Player1) semi2Player1.textContent = results.matchB.player1;
        if (semi2Player2) semi2Player2.textContent = results.matchB.player2;
        if (semi2Status) {
            semi2Status.textContent = `${results.matchB.score[0]} - ${results.matchB.score[1]} | Winner: ${results.matchB.winner}`;
            semi2Status.style.background = '#bbf7d0';
            semi2Status.style.color = '#166534';
        }
        }

        // Keep the lobby hidden until final sequence is complete
        if (this.tournamentLobbyOverlay) {
        this.tournamentLobbyOverlay.style.display = 'none';
        // Hide the start tournament button
        const startTournamentBtn = this.tournamentLobbyOverlay.querySelector('#startTournamentBtn') as HTMLButtonElement;
        if (startTournamentBtn) {
            startTournamentBtn.style.display = 'none';
            startTournamentBtn.disabled = true;
        }
        // Hide the Player list
        const playersListContainers = this.tournamentLobbyOverlay.querySelectorAll('.container-white.p-6.mb-6');
        playersListContainers.forEach(container => {
            const heading = container.querySelector('h2');
            if (heading && heading.textContent?.trim().toUpperCase() === 'PLAYERS') {
            (container as HTMLElement).style.display = 'none';
            }
        });
        }
    }


    // Handle final tournament results from server 
    public updateTournamentFinalResults(tournamentResults: any): void {
        // Update final match card
        if (tournamentResults.finalMatch) {
        const finalPlayer1 = document.getElementById('finalPlayer1');
        const finalPlayer2 = document.getElementById('finalPlayer2');
        const finalStatus = document.getElementById('finalStatus');
        if (finalPlayer1) finalPlayer1.textContent = tournamentResults.finalMatch.player1;
        if (finalPlayer2) finalPlayer2.textContent = tournamentResults.finalMatch.player2;
        if (finalStatus) {
            finalStatus.textContent = `${tournamentResults.finalMatch.score[0]} - ${tournamentResults.finalMatch.score[1]} | Winner: ${tournamentResults.finalMatch.winner}`;
            finalStatus.style.background = '#fef9c3';
            finalStatus.style.color = '#ca8a04';
        }
        }

        // Update bronze match card
        if (tournamentResults.thirdPlaceMatch) {
        const bronzePlayer1 = document.getElementById('bronzePlayer1');
        const bronzePlayer2 = document.getElementById('bronzePlayer2');
        const bronzeStatus = document.getElementById('bronzeStatus');
        if (bronzePlayer1) bronzePlayer1.textContent = tournamentResults.thirdPlaceMatch.player1;
        if (bronzePlayer2) bronzePlayer2.textContent = tournamentResults.thirdPlaceMatch.player2;
        if (bronzeStatus) {
            bronzeStatus.textContent = `${tournamentResults.thirdPlaceMatch.score[0]} - ${tournamentResults.thirdPlaceMatch.score[1]} | Winner: ${tournamentResults.thirdPlaceMatch.winner}`;
            bronzeStatus.style.background = '#fed7aa';
            bronzeStatus.style.color = '#c2410c';
        }
        }

        // Update tournament status
        const statusElement = document.getElementById('tournamentStatus');
        if (statusElement) {
        statusElement.textContent = 'FINISHED';
        statusElement.style.color = '#00dd00';
        statusElement.style.fontWeight = 'bold';
        }

        // Update main status message 
        const statusMessageElement = document.getElementById('tournamentStatusMessage');
        if (statusMessageElement) {
            statusMessageElement.textContent = 'TOURNAMENT FINISHED!';
        }
        // Ensure tournament lobby is hidden
        if (this.tournamentLobbyOverlay) {
        this.tournamentLobbyOverlay.style.display = 'none';
        }

    }

    // DISCONNECT OVERLAY

    public showDisconnectOverlay(message: string): void {
        if (!this.gameEndOverlay) return;

        // Hide quit button when showing disconnect overlay
        this.hideQuitButton();

        // Increase z-index to ensure it's above animations and other content
        this.gameEndOverlay.style.zIndex = '9999';

        this.gameEndOverlay.innerHTML = `
    <div style="
      background: rgba(0, 0, 0, 0.4) ;
      backdrop-filter: blur(10px) ;
      border-radius: 12px ;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) ;
      padding: 24px ;
      max-width: 448px ;
      text-align: center ;
      border: 4px solid black ;
    ">
      <div style="margin-bottom: 24px ;">
        <h2 style="font-family: monospace ; color: #ef4444 ; font-size: 30px ; font-weight: bold ; margin-bottom: 8px ;">⚠️ Connection Lost</h2>
        <p style="font-family: monospace ; color: white ; font-size: 18px ; font-weight: bold ;">${message}</p>
      </div>

      <div style="display: flex ; flex-direction: column ; gap: 12px ;">
        <button id="returnToMenuBtn" style="
          width: 100% ;
          color: white ;
          font-family: monospace ;
          font-size: 18px ;
          font-weight: bold ;
          background: rgb(236, 72, 153) ;
          padding: 12px 24px ;
          border-radius: 8px ;
          border: 2px solid black ;
          cursor: pointer ;
          transition: all 0.2s ;
        " onmouseover="this.style.background='rgb(219, 39, 119)'" onmouseout="this.style.background='rgb(236, 72, 153)'">
          🏠 Return to Menu
        </button>
      </div>
    </div>
  `;

        // Add event listener for return to menu
        const returnToMenuBtn = this.gameEndOverlay.querySelector('#returnToMenuBtn');
        returnToMenuBtn?.addEventListener('click', async () => {
            if (this.onReturnToMenu) await this.onReturnToMenu();
        });

        // Show the overlay
        this.gameEndOverlay.style.display = "flex";
    }

    // QUIT BUTTON AND CONFIRMATION

    public showQuitButton(): void {
        const quitButton = document.getElementById('quit-button');
        if (quitButton) {
            quitButton.style.display = 'block';
        }
    }

    public hideQuitButton(): void {
        const quitButton = document.getElementById('quit-button');
        if (quitButton) {
            quitButton.style.display = 'none';
        }
    }

    public showQuitConfirmation(): void {
        const overlay = document.getElementById('quit-confirmation-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    public hideQuitConfirmation(): void {
        const overlay = document.getElementById('quit-confirmation-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }



    //===============================================
    // Overlay disposal methods
    //===============================================

    public dispose(): void {
        // Remove overlays from DOM
        [this.loadingOverlay, this.roomCreatedOverlay, this.tournamentConnectingOverlay, this.tournamentLobbyOverlay, this.gameEndOverlay].forEach(overlay => {
            if (overlay && overlay.parentElement) {
                overlay.parentElement.removeChild(overlay);
            }
        });
        // Remove quit button and confirmation overlay if present
        const quitButton = document.getElementById('quit-button');
        if (quitButton && quitButton.parentElement) {
            quitButton.parentElement.removeChild(quitButton);
        }
        const quitConfirmOverlay = document.getElementById('quit-confirmation-overlay');
        if (quitConfirmOverlay && quitConfirmOverlay.parentElement) {
            quitConfirmOverlay.parentElement.removeChild(quitConfirmOverlay);
        }
        // Remove event listeners if any

    }
}
