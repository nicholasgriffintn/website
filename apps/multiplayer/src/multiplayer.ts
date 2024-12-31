import type { DurableObjectState } from "@cloudflare/workers-types";

import type { Env } from "./types/app";
import { AI_NAMES } from "./constants";
import type { BaseMultiplayerGame } from "./games/base";
import { DrawingGame } from "./games/anyone-can-draw";

export class Multiplayer {
	private game!: BaseMultiplayerGame;
	private state: DurableObjectState;
	private env: Env;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request: Request) {
		const url = new URL(request.url);
		const gameType = url.pathname.split("/")[1];

		if (!gameType) {
			throw new Error("Game type is required");
		}

		if (!this.game) {
			switch (gameType) {
				case "anyone-can-draw":
					this.game = new DrawingGame(this.state, this.env, {
						gameDuration: 120,
						minPlayers: 2,
						maxPlayers: 8,
						aiEnabled: true,
						aiGuessCooldown: 10000,
						correctGuesserScore: 5,
						correctDrawerScore: 2,
						aiNames: AI_NAMES,
					});
					break;
				default:
					throw new Error(`Unknown game type: ${gameType}`);
			}
		}

		return this.game.fetch(request);
	}

	async webSocketMessage(ws: WebSocket, message: string) {
		if (!this.game) {
			throw new Error("Game not initialized");
		}
		return this.game.webSocketMessage(ws, message);
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		if (!this.game) {
			throw new Error("Game not initialized");
		}
		return this.game.webSocketClose(ws, code, reason);
	}

	async alarm() {
		if (!this.game) {
			throw new Error("Game not initialized");
		}
		return this.game.alarm();
	}
}