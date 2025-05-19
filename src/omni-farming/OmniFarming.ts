import { Module } from "../modules/Module";
import { Mutex } from "async-mutex";
import { OmniFarmingModule } from "./OmniFarmingModule";
import { TIME_EACH_PROCESS } from "../common/config/config";
import { routerService } from "../services/bridges/RouterService";

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

    async updateRate() {
        try {
            let totalValue = 0;

            for (const module of this.modules) {
                let value = await module.getTotalValue();
                totalValue += value;
            }

            totalValue += await this.omnifarming.getTotalValue();
            totalValue += await routerService.getBalanceBridging("0xc378E3e2304476bf4c2fBf3204535236F7628B7A");
            await this.omnifarming.updateRate(totalValue);
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
            let bestModule = this.modules[0];
            let bestAPY;
            try {
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

                console.log(bestModule.name, bestAPY);
                if (bestModule != this.bestModule) {
                    this.bestModule = bestModule;
                    console.log(`Best module update: ${bestModule.name} with APY: ${bestAPY}`);
                }
                for (const module of this.modules) {
                    await module.transferAllToModule(bestModule);
                }
                let amountUSDCNeedBridgeForWithdraw = await this.omnifarming.getAmountNeedForWithdraw();
                await this.bestModule.withdraw(amountUSDCNeedBridgeForWithdraw, this.omnifarming);
            } catch (error) {
                console.log("Error processing: ", error);
            }
            await this.updateRate();

            await this.omnifarming.withdrawProcess();
            await this.omnifarming.bridgeToModule(bestModule);
            await bestModule.deposit();
        } catch (error) {
            console.log(error);
        }
    }
    async setup() {
        // Sort modules by chainId
        this.modules.sort((a: Module, b: Module) => a.chainId.localeCompare(b.chainId));

        // Initial processing
        await this.processing();
        // Set interval for periodic processing
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
