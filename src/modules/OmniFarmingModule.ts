import { ethers, Wallet } from "ethers";
import { Provider } from "ethers";
import { JsonRpcProvider } from "ethers";
import { Module } from "./Module";
import { CHAIN_ID, EVM_ADDRESS, RPC } from "../common/config/config";
import { OmniFarming, OmniFarming__factory } from "../typechain-types";
import { isProduction } from "../common/config/secrets";

export class OmniFarmingModule {
    public address: string = EVM_ADDRESS.sapphire.omniFarming;
    public chainId: string = CHAIN_ID.sapphire;
    public usdcAddress: string = EVM_ADDRESS.sapphire.usdc;
    private agent: Wallet;
    private provider: Provider;
    private omnifarming: OmniFarming;

    constructor(privateKeyAgent: string) {
        this.provider = new JsonRpcProvider(RPC.sapphire);
        this.agent = new Wallet(privateKeyAgent, this.provider);
        this.omnifarming = OmniFarming__factory.connect(EVM_ADDRESS.sapphire.omniFarming, this.agent);
    }

    async getRate() {
        const rate = await this.omnifarming.rate();
        return rate;
    }

    async getAmountNeedForWithdraw() {
        const amountLP = await this.omnifarming.totalSupplyLocked();
        const rate = await this.getRate();
        const amountNeedForWithdraw = (amountLP * rate) / 10n ** 18n;
        return Number(ethers.formatUnits(amountNeedForWithdraw, 6));
    }

    async enableWithdrawing() {
        console.log("Processing enable withdrawing transaction....");
        if (isProduction) {
            let txResponse = await this.omnifarming.setWithdrawing(true);
            await txResponse.wait();
        }
        console.log("Enable withdrawing transaction success!!!");
    }

    async disableWithdrawing() {
        console.log("Processing disable withdrawing transaction....");
        if (isProduction) {
            let txResponse = await this.omnifarming.setWithdrawing(false);
            await txResponse.wait();
        }
        console.log("Disable withdrawing transaction success!!!");
    }

    async checkAndWithdrawForUser() {
        if (isProduction) {
            let size = await this.omnifarming.getWithdrawListLength();
            if (size > 0) {
                let user = await this.omnifarming.listAccountWithdraw(0);
                let txResponse = await this.withdrawForUser(user);
                await this.checkAndWithdrawForUser();
            } else {
                return;
            }
        }
    }

    async withdrawForUser(user: string) {
        console.log("Withdraw for user: ", user);
        let txResponse = await this.omnifarming.withdraw(user);
        await txResponse.wait();
        console.log("Withdraw for user success");
    }

    async WithdrawProcess() {
        console.log("Withdraw process");
        await this.enableWithdrawing();
        await this.checkAndWithdrawForUser();
        await this.disableWithdrawing();
        console.log("Withdraw process done!!");
    }

    async bridgeToModule(module: Module) {
        // todo
        console.log("Processing bridge from Omni Farming to module....");
        if (isProduction) {
            // todo call bridge here
            // let txResponse = await this.omnifarming.bridge(module.address);
            // await txResponse.wait();
        }
        console.log("Bridge from Omni Farming to module success!!!");
    }
}
