import axios, { AxiosInstance } from "axios";
import { Agent } from "http";
import * as http from "http";

interface TxParams {
    gas: string | number;
    to: string;
    value: string | number;
    data: string;
}

export class RoflService {
    private socketPath: string;
    private client: AxiosInstance;
    static readonly DEFAULT_SOCKET_PATH = "/run/rofl-appd.sock";

    constructor(socketPath: string = RoflService.DEFAULT_SOCKET_PATH) {
        this.socketPath = socketPath;

        this.client = axios.create({
            baseURL: "http://localhost",
            httpAgent: new http.Agent({}),
            socketPath: this.socketPath,
        });
    }

    async getAgentKey() {
        let privateKey = await this.fetchKey("agent-ecdsa");
        return privateKey;
    }

    private async _appdPost(path: string, payload: unknown): Promise<unknown> {
        const fullUrl = `${path}`;
        console.log(`Send request ${JSON.stringify(payload)} to ${fullUrl} via UNIX socket ${this.socketPath}`);

        try {
            const response = await this.client.post(fullUrl, payload, {
                timeout: 0,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Request failed: ${error.response?.status || "unknown status"} ` + `${error.response?.statusText || error.message}`);
        }
    }

    async fetchKey(id: string): Promise<string> {
        const payload = {
            key_id: id,
            kind: "secp256k1",
        };

        const path = "/rofl/v1/keys/generate";

        const response = (await this._appdPost(path, payload)) as { key: string };
        return response.key;
    }

    async submitTx(tx: TxParams): Promise<unknown> {
        const payload = {
            tx: {
                kind: "eth",
                data: {
                    gas_limit: tx.gas,
                    to: tx.to.replace(/^0x/, ""),
                    value: tx.value,
                    data: tx.data.replace(/^0x/, ""),
                },
            },
            encrypted: false,
        };

        const path = "/rofl/v1/tx/sign-submit";

        return this._appdPost(path, payload);
    }
}
