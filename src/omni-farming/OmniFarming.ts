import { Module } from "../modules/Module";
import { Mutex } from "async-mutex";
import { OmniFarmingModule } from "./OmniFarmingModule";
import { TIME_EACH_PROCESS } from "../common/config/config";

export class OmniFarming {
    private omnifarming: OmniFarmingModule;
    private bestModule: Module | null;
    private modules: Module[];
    private mutex: Mutex = new Mutex();
    constructor(omnifarming: OmniFarmingModule) {
        this.omnifarming = omnifarming;
        this.modules = [];
        this.bestModule = null;
    }

    async addModule(module: Module) {
        this.modules.push(module);
        if (this.bestModule == null || (await this.bestModule.getAPY()) < (await module.getAPY())) {
            this.bestModule = module;
        }
    }

    async processing() {
        try {
            if (this.bestModule == null) {
                console.log("No modules found");
                return;
            }
            let bestModule = this.modules[0];
            let bestAPY = await bestModule.getAPY();
            for (const module of this.modules) {
                let apy = await module.getAPY();
                if (apy >= bestAPY) {
                    bestModule = module;
                    bestAPY = apy;
                }
            }
            if (bestModule != this.bestModule) {
                this.bestModule = bestModule;
                console.log(`Best module update: ${bestModule.name} with APY: ${bestAPY}`);
                for (const module of this.modules) {
                    await module.transferAllToModule(bestModule);
                }
            }
            let amountUSDCNeedBridgeForWithdraw = await this.omnifarming.getAmountNeedForWithdraw();
            await this.bestModule.withdraw(amountUSDCNeedBridgeForWithdraw, this.omnifarming);
            await this.omnifarming.withdrawProcess();
            await this.omnifarming.bridgeToModule(bestModule);
            await bestModule.deposit();
        } catch (error) {
            console.log(error);
        }
    }

    async setup() {
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
