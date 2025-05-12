import { Wallet } from "ethers";
import { Module } from "./modules/Module";
import { Mutex } from "async-mutex";
import { OmniFarmingModule } from "./modules/OmniFarmingModule";

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
        if (this.bestModule == null) {
            console.log("No modules found");
            return;
        }
        console.log("---- Starting processing -----");
        //todo find best module
        console.log("Finding best module");
        let bestModule = this.bestModule;
        let bestAPY = await bestModule.getAPY();
        for (const module of this.modules) {
            let apy = await module.getAPY();
            console.log(`${module.name} with APY: ${apy}`);
            if (apy >= bestAPY) {
                bestModule = module;
                bestAPY = apy;
            }
        }
        this.bestModule = bestModule;
        console.log(`Best module: ${bestModule.name} with APY: ${bestAPY}`);
        //todo transfer all to best module
        console.log("Transferring all to best module");
        for (const module of this.modules) {
            await module.transferAllToModule(bestModule);
        }
        let amountNeedForWithdraw = await this.omnifarming.getAmountNeedForWithdraw();

        await this.bestModule.withdraw(amountNeedForWithdraw, this.omnifarming);
        //todo withdraw for user
        await this.omnifarming.WithdrawProcess();
        //todo transfer omnifarming to best module
        await this.omnifarming.bridgeToModule(bestModule);
        //todo deposit to omnifarming
        console.log("Depositing to best module...");
        await bestModule.deposit();
        console.log("Depositing to best module success!!!");
    }

    async setup() {
        await this.mutex.runExclusive(async () => {
            await this.processing();
        });
        setInterval(async () => {
            await this.mutex.runExclusive(async () => {
                await this.processing();
            });
        }, 20 * 1000);
    }
}
