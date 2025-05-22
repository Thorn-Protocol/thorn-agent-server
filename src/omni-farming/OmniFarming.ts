import { PayableOverrides } from "./../typechain-types/common";
import { Module } from "../modules/Module";
import { Mutex } from "async-mutex";
import { OmniFarmingModule } from "./OmniFarmingModule";
import { TIME_EACH_PROCESS } from "../common/config/config";
import { ethers, Wallet } from "ethers";
import { bridge } from "../services/bridges/RouterService";
import { logs } from "../services/logs/LogService";
export class OmniFarming {
    private omnifarming: OmniFarmingModule;
    private bestModule: Module | null;
    private modules: Module[];
    private mutex: Mutex = new Mutex();
    private agent: Wallet;

    constructor(omnifarming: OmniFarmingModule, privateKeyAgent: string) {
        this.omnifarming = omnifarming;
        this.modules = [];
        this.bestModule = null;
        this.agent = new Wallet(privateKeyAgent);
    }

    async addModule(module: Module) {
        let agentOnChain = await module.getAgentOnChain();
        if (agentOnChain != this.agent.address) {
            logs.log(`Agent on ${module.name} not registered on chain`);
            return;
        }
        logs.log(`Add module: ${module.name}`);
        this.modules.push(module);
        if (this.bestModule == null || (await this.bestModule.getAPY()) < (await module.getAPY())) {
            this.bestModule = module;
        }
    }

    async updateTotalAssets() {
        try {
            let totalValue = 0;
            for (const module of this.modules) {
                let value = await module.getTotalValue();
                totalValue += value;
            }
            totalValue += await this.omnifarming.getTotalValue();
            totalValue += await bridge.getBalanceBridging("0xc378E3e2304476bf4c2fBf3204535236F7628B7A");
            await this.omnifarming.updateTotalAssets(totalValue);
        } catch (error) {
            console.log("Error update rate: ", error);
        }
    }

    async processing() {
        try {
            if (this.bestModule == null) {
                console.log("No modules found");
                return;
            }
            let bestModule = this.bestModule;
            let bestAPY;
            bestAPY = await bestModule.getAPY();
            for (const module of this.modules) {
                let apy = await module.getAPY();
                if (apy >= bestAPY && module.chainId == bestModule.chainId) {
                    bestModule = module;
                    bestAPY = apy;
                } else if (apy > bestAPY + 0.1 && module.chainId != bestModule.chainId) {
                    bestModule = module;
                    bestAPY = apy;
                }
            }
            if (bestModule != this.bestModule) {
                this.bestModule = bestModule;
            }
            for (let i = 0; i < this.modules.length; i++) {
                let module = this.modules[i];
                await module.transferAllToModule(bestModule);
            }
            await this.updateTotalAssets();
            let amountUSDCNeedBridgeForWithdraw = await this.omnifarming.getAmountNeedForWithdraw();
            await this.bestModule.withdraw(amountUSDCNeedBridgeForWithdraw, this.omnifarming);
            await this.omnifarming.withdrawProcess();
            await this.omnifarming.bridgeToModule(bestModule);
            await bestModule.deposit();
        } catch (error) {
            console.log("Error processing: ", error);
        }
    }
    async setup() {
        this.modules.sort((a: Module, b: Module) => a.chainId.localeCompare(b.chainId));
        await this.processing();
        const interval = setInterval(async () => {
            if (!this.mutex.isLocked()) {
                try {
                    await this.mutex.runExclusive(async () => {
                        await this.processing();
                    });
                } catch (error) {
                    console.error("Error in processing:", error);
                }
            }
        }, TIME_EACH_PROCESS);
    }
}
