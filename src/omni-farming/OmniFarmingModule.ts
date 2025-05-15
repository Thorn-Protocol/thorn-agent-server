import { ethers, Wallet } from "ethers";
import { Provider } from "ethers";
import { JsonRpcProvider } from "ethers";
import { Module } from "../modules/Module";
import { CHAIN_ID, EVM_ADDRESS, MIN_BRIDGE_AMOUNT, RPC } from "../common/config/config";
import { ERC20__factory, OmniFarming, OmniFarming__factory } from "../typechain-types";
import { routerService } from "../services/bridges/RouterService";
import { fundFeeService } from "../funding/FungingSerivce";
import { wrapEthersSigner, wrapEthersProvider } from "@oasisprotocol/sapphire-ethers-v6";

export class OmniFarmingModule {
    public address: string = EVM_ADDRESS.sapphire.omniFarming;
    public chainId: string = CHAIN_ID.sapphire;
    public usdcAddress: string = EVM_ADDRESS.sapphire.usdc;
    private agent: Wallet;
    private provider: Provider;
    private omnifarming: OmniFarming;

    constructor(privateKeyAgent: string) {
        this.provider = new JsonRpcProvider(RPC.sapphire);
        this.agent = wrapEthersSigner(new Wallet(privateKeyAgent, this.provider));
        console.log("Agent address: ", this.agent.address);
        this.omnifarming = OmniFarming__factory.connect(EVM_ADDRESS.sapphire.omniFarming, this.agent);
    }

    async getRate() {
        const rate = await this.omnifarming.lpToUsdcRate();
        return rate;
    }

    async getTotalLp() {
        const totalLpSupply = await this.omnifarming.totalLpSupply();
        return totalLpSupply;
    }

    async getTotalValue(): Promise<number> {
        let balance = await ERC20__factory.connect(this.usdcAddress, this.agent).balanceOf(this.address);
        return Number(Number(ethers.formatUnits(balance, 6)).toFixed(6));
    }

    async updateRate(totalValue: number) {
        const totalLpSupply = await this.getTotalLp();

        const value = ethers.parseUnits(totalValue.toFixed(6), 6);
        console.log("Total value: ", totalValue);
        console.log("Total lp supply: ", totalLpSupply);
        const rate = (value * 10n ** 18n) / totalLpSupply;
        const oldRate = await this.getRate();
        if (rate == oldRate) return;
        console.log("Update rate: ", oldRate, " -> ", rate);
        try {
            //await this.omnifarming.connect(this.agent).updateRate.staticCall(rate);
            let txResponse = await this.omnifarming.updateRate(rate);
            let txReceipt = await txResponse.wait();
            let txHash = txReceipt!.hash;
            console.log("Update rate success: https://explorer.oasis.io/mainnet/sapphire/tx/" + txHash);
        } catch (error: any) {
            console.log("Error update rate: ", error.message);
        }
    }

    async getAmountNeedForWithdraw() {
        const totalLpLocked = await this.omnifarming.totalLockedLpSupply();
        const rate = await this.getRate();
        const amountNeedForWithdraw = (totalLpLocked * rate) / 10n ** 18n;
        let balanceUSDC = await ERC20__factory.connect(this.usdcAddress, this.agent).balanceOf(this.address);
        if (balanceUSDC >= amountNeedForWithdraw) {
            return 0;
        } else {
            let result = Number(ethers.formatUnits(((amountNeedForWithdraw - balanceUSDC) * 105n) / 100n, 6));
            return result;
        }
    }

    async checkAndWithdrawForUser() {
        let currentWithdrawalIndex = await this.omnifarming.currentWithdrawalIndex();
        let totalWithdrawalRequests = await this.omnifarming.totalWithdrawalRequests();

        if (currentWithdrawalIndex < totalWithdrawalRequests) {
            let [user, lockedLp] = await this.omnifarming.getDataForNextWithdraw();
            let rate = await this.getRate();
            let amountNeedForWithdraw = (lockedLp * rate) / 10n ** 18n;
            let balanceUSDC = await ERC20__factory.connect(this.usdcAddress, this.agent).balanceOf(this.address);
            if (balanceUSDC < amountNeedForWithdraw) {
                console.log(`Agent: Not enough balance in Omni to withdraw for user ${user}, need ${ethers.formatUnits(amountNeedForWithdraw, 6)} USDC, but only have ${ethers.formatUnits(balanceUSDC, 6)} USDC`);
                return;
            }
            //await this.omnifarming.connect(this.agent).withdrawForRequested.staticCall();
            let txResponse = await this.omnifarming.withdrawForRequested();
            let txReceipt = await txResponse.wait();
            let txHash = txReceipt!.hash;
            console.log(`Agent: Withdraw for requested ${currentWithdrawalIndex} success: https://explorer.oasis.io/mainnet/sapphire/tx/${txHash}`);
            // next person
            await this.checkAndWithdrawForUser();
        } else {
            return;
        }
    }

    async withdrawProcess() {
        await this.checkAndWithdrawForUser();
    }

    async getBalance() {
        let balance = await ERC20__factory.connect(this.usdcAddress, this.agent).balanceOf(this.address);
        return ethers.formatUnits(balance, 6);
    }

    async bridgeToModule(module: Module) {
        try {
            let usdcContract = ERC20__factory.connect(this.usdcAddress, this.agent);
            let balance = await usdcContract.balanceOf(this.address);
            if (balance >= BigInt(ethers.parseUnits(MIN_BRIDGE_AMOUNT.toString(), 6))) {
                console.log("Processing bridge from Omni Farming to module....");
                let txnBridge = await routerService.getTxnBridgeUSDC(this.address, module.address, this.chainId, module.chainId, this.usdcAddress, module.usdcAddress, balance);
                //await this.omnifarming.connect(this.agent).transferToTreasury.staticCall(balance, txnBridge.allowanceTo, txnBridge.to, txnBridge.data);
                let txResponse = await this.omnifarming.connect(this.agent).transferToTreasury(balance, txnBridge.allowanceTo, txnBridge.to, txnBridge.data);
                let txReceipt = await txResponse.wait();
                let txHash = txReceipt!.hash;
                console.log("Bridge transaction: https://explorer.routernitro.com/tx/" + txHash);
                await routerService.wait(txHash);
                console.log("Bridge success");
                await fundFeeService.fundFee(txnBridge.feeOnDestChain, module.address, txHash, module.chainId);
                console.log("Bridge from Omni Farming to module success!!!");
            }
        } catch (error: any) {
            console.log("Error bridge from Omni Farming to module: ", error.message);
        }
    }
}
