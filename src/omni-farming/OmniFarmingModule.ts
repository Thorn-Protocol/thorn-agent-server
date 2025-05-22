import { ethers, Wallet } from "ethers";
import { Provider } from "ethers";
import { JsonRpcProvider } from "ethers";
import { Module } from "../modules/Module";
import { CHAIN_ID, EVM_ADDRESS, MIN_BRIDGE_AMOUNT, RPC } from "../common/config/config";
import { ERC20__factory, OmniFarming, OmniFarming__factory } from "../typechain-types";

import { wrapEthersSigner } from "@oasisprotocol/sapphire-ethers-v6";
import { logs } from "../services/logs/LogService";
import { bridge } from "../services/bridges/RouterService";

export class OmniFarmingModule {
    public address: string = EVM_ADDRESS.sapphire.omniFarming;
    public chainId: string = CHAIN_ID.sapphire;
    public usdcAddress: string = EVM_ADDRESS.sapphire.usdc;
    private agent: Wallet;
    private provider: Provider;
    private contract: OmniFarming;

    constructor(privateKeyAgent: string) {
        this.provider = new JsonRpcProvider(RPC.sapphire);
        this.agent = wrapEthersSigner(new Wallet(privateKeyAgent, this.provider));
        console.log("Agent address: ", this.agent.address);
        this.contract = OmniFarming__factory.connect(EVM_ADDRESS.sapphire.omniFarming, this.agent);
    }

    async getTotalLp() {
        const totalLpSupply = await this.contract.totalLockedShares();
        return totalLpSupply;
    }

    async getTotalValue(): Promise<number> {
        let balance = await ERC20__factory.connect(this.usdcAddress, this.agent).balanceOf(this.address);
        return Number(Number(ethers.formatUnits(balance, 6)).toFixed(6));
    }

    async getTotalAsset() {
        let totalAsset = await this.contract.totalAssets();
        return Number(Number(ethers.formatUnits(totalAsset, 6)).toFixed(6));
    }

    async updateTotalAssets(totalAsset: number) {
        let last = await this.contract.totalAssets();
        const old = Number(ethers.formatUnits(last, 6));
        logs.log(`Old total asset: ${old}, New total asset: ${totalAsset}`);
        if (totalAsset > old) {
            try {
                let deadline = Math.floor(Date.now() / 1000) + 5 * 60; /// 5 minutes
                let profit = ethers.parseUnits(totalAsset.toFixed(6), 6) - ethers.parseUnits(old.toFixed(6), 6);
                let response = await this.contract.updateTotalAssets(last, profit, deadline);
                let receipt = await response.wait();
                let hash = receipt!.hash;
                logs.log(`Update rate success: https://explorer.oasis.io/mainnet/sapphire/tx/${hash}`);
            } catch (error: any) {
                logs.log(`Error update rate:  ${error.message}`);
            }
        }
    }

    async getAmountNeedForWithdraw() {
        let lockedShares = await this.contract.totalLockedShares();
        let need = await this.contract.convertToAssets(lockedShares);
        let balance = await ERC20__factory.connect(this.usdcAddress, this.agent).balanceOf(this.address);
        if (balance >= need) {
            return 0;
        } else {
            let result = Number(ethers.formatUnits(need - balance, 6));
            return result;
        }
    }

    async checkAndWithdrawForUser() {
        let current = await this.contract.currentWithdrawalIndex();
        let total = await this.contract.totalWithdrawalRequests();
        await logs.log(`Current withdrawal index: ${current}`);
        await logs.log(`Total withdrawal requests:${total}`);
        if (current < total) {
            let [user, lockedShare] = await this.contract.getDataForNextWithdraw();
            let need = await this.contract.convertToAssets(lockedShare);
            let balance = await ERC20__factory.connect(this.usdcAddress, this.agent).balanceOf(this.address);
            if (balance < need) {
                console.log(`Agent: Not enough balance in Omni to withdraw for user ${user}, need ${ethers.formatUnits(need, 6)} USDC, but only have ${ethers.formatUnits(balance, 6)} USDC`);
                return;
            }
            let txResponse = await this.contract.withdrawForRequested();
            let txReceipt = await txResponse.wait();
            let txHash = txReceipt!.hash;
            console.log(`Agent: Withdraw for requested ${current} success: https://explorer.oasis.io/mainnet/sapphire/tx/${txHash}`);
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

            let totalLocked = await this.contract.totalLockedShares();
            let totalAssetNeedForWithdraw = await this.contract.convertToAssets(totalLocked);

            if (totalAssetNeedForWithdraw >= balance) {
                return;
            }
            if (balance >= BigInt(ethers.parseUnits(MIN_BRIDGE_AMOUNT.toString(), 6))) {
                console.log("Processing bridge from Omni Farming to module....");
                let txnBridge = await bridge.getTxnBridgeUSDC(this.address, module.address, this.chainId, module.chainId, this.usdcAddress, module.usdcAddress, balance);
                let txResponse = await this.contract.connect(this.agent).transferToTreasury(balance, txnBridge.allowanceTo, txnBridge.to, txnBridge.data);
                let txReceipt = await txResponse.wait();
                let txHash = txReceipt!.hash;
                console.log("Bridge transaction: https://explorer.routernitro.com/tx/" + txHash);
                await bridge.wait(txHash);
                console.log("Bridge success");
            }
        } catch (error: any) {
            console.log("Error bridge from Omni Farming to module: ", error.message);
        }
    }
}
