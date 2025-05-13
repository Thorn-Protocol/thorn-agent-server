import { ethers, Wallet } from "ethers";
import { Provider } from "ethers";
import { JsonRpcProvider } from "ethers";
import { Module } from "./Module";
import { CHAIN_ID, EVM_ADDRESS, RPC } from "../common/config/config";
import { ERC20__factory, OmniFarming, OmniFarming__factory } from "../typechain-types";
import { isProduction } from "../common/config/secrets";
import { routerService } from "../bridge/RouterService";
import { fundFeeService } from "../FundFee/FundFeeService";

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
        console.log("Omni Farming address: ", this.agent.address);
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
        let size = await this.omnifarming.getWithdrawListLength();
        if (size > 0) {
            await this.enableWithdrawing();
            await this.checkAndWithdrawForUser();
            await this.disableWithdrawing();
        }
    }

    async bridgeToModule(module: Module) {
        let usdcContract = ERC20__factory.connect(this.usdcAddress, this.agent);
        let balance = await usdcContract.balanceOf(this.address);
        console.log("Balance of Omni Farming: ", balance);
        if (balance > BigInt(5 * 10 ** 6)) {
            console.log("Processing bridge from Omni Farming to module....");
            let txnBridge = await routerService.getTxnBridgeUSDC(this.address, module.address, this.chainId, module.chainId, this.usdcAddress, module.usdcAddress, balance);
            console.log("Transaction bridge: ", txnBridge);
            let fakeTx = {};
            let txResponse = await this.omnifarming.transferToTreasury(balance, txnBridge.allowanceTo, txnBridge.to, txnBridge.data);
            let txReceipt = await txResponse.wait();
            let txHash = txReceipt!.hash;
            console.log("Transaction hash: ", txHash);
            await routerService.wait(txHash);
            await fundFeeService.fundFee(txnBridge.feeOnDestChain, module.address, txHash, module.chainId);
            console.log("Bridge from Omni Farming to module success!!!");
        }
    }
}
