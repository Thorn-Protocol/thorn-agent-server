import { ethers, JsonRpcProvider, Provider, Wallet } from "ethers";
import { CHAIN_ID, EVM_ADDRESS, MIN_BALANCE_TO_DEPOSIT, MIN_BRIDGE_AMOUNT, RPC } from "../../../common/config/config";
import { CompoundV3Module, CompoundV3Module__factory, ERC20, ERC20__factory } from "../../../typechain-types";

import { Module } from "../../Module";
import { routerService } from "../../../services/bridges/RouterService";
import { isProduction } from "../../../common/config/secrets";
import { OmniFarmingModule } from "../../../omni-farming/OmniFarmingModule";
import { fundFeeService } from "../../../funding/FungingSerivce";
import { centic } from "../../../services/data/CenticService";

export class BaseCompoundV3Module extends Module {
    public name: string = "Base - Compound V3";
    public chainId: string = CHAIN_ID.base;
    private agent: Wallet;
    private provider: Provider;
    private module: CompoundV3Module;
    public address: string = EVM_ADDRESS.base.compoundV3Module;
    public usdcAddress: string = EVM_ADDRESS.base.usdc;
    public usdcContract: ERC20;

    constructor(privateKeyAgent: string) {
        super();
        this.provider = new JsonRpcProvider(RPC.base);
        this.agent = new Wallet(privateKeyAgent, this.provider);
        this.module = CompoundV3Module__factory.connect(EVM_ADDRESS.base.compoundV3Module, this.agent);
        this.usdcContract = ERC20__factory.connect(EVM_ADDRESS.base.usdc, this.agent);
    }

    async getAPY(): Promise<number> {
        //todo call centic data
        return centic.getCompoundV3AprOnBase(EVM_ADDRESS.base.usdc);
    }

    async deposit(): Promise<void> {
        let balanceUSDC = await this.usdcContract.balanceOf(this.address);
        if (balanceUSDC >= ethers.parseUnits(MIN_BALANCE_TO_DEPOSIT.toString(), 6)) {
            console.log(`Depositing to Base Compound V3 Module with ${ethers.formatUnits(balanceUSDC, 6)} USDC ....`);
            let txResponse = await this.module.deposit();
            await txResponse.wait();
            console.log(`Depositing to Base Compound V3 Module success`);
        }
    }

    async transferAllToModule(module: Module): Promise<void> {
        if (module.chainId != CHAIN_ID.base) {
            return this.transferAllToNonBaseModule(module);
        } else {
            return this.transferAllToBaseModule(module);
        }
    }

    public async getBalance(): Promise<bigint> {
        let balance = await this.module.getTotalValue();
        return balance;
    }

    private async transferAllToBaseModule(module: Module): Promise<void> {
        if (module.address == this.address) return;
        let balance = await this.module.getTotalValue();
        let txResponse = await this.module.transfer(module.address, balance);
        await txResponse.wait();
    }

    private async transferAllToNonBaseModule(module: Module): Promise<void> {
        try {
            let balance = await this.getBalance();
            console.log(balance);
            if (balance < ethers.parseUnits(MIN_BRIDGE_AMOUNT.toString(), 6)) return;
            console.log(`Bridge from ${this.name} to ${module.name} with ${ethers.formatUnits(balance, 6)} USDC ....`);
            let txnBridge = await routerService.getTxnBridgeUSDC(this.agent.address, module.address, this.chainId, module.chainId, this.usdcAddress, module.usdcAddress, BigInt(balance));
            if (txnBridge.feeData.symbol == "ETH") {
                let amount = BigInt(txnBridge.feeData.amount);
                let txResponse = await this.module.bridgeAll(txnBridge.allowanceTo, txnBridge.to, txnBridge.data, { value: amount });
                let txReceipt = await txResponse.wait();
                let txHash = txReceipt!.hash;
                console.log("Send tx Bridge success: https://explorer.routernitro.com/tx/" + txReceipt!.hash);
                await routerService.wait(txHash);
                return;
            }
            let txResponse = await this.module.bridgeAll(txnBridge.allowanceTo, txnBridge.to, txnBridge.data);
            let txReceipt = await txResponse.wait();
            let txHash = txReceipt!.hash;
            console.log("Send tx Bridge success: https://explorer.routernitro.com/tx/" + txReceipt!.hash);
            await routerService.wait(txHash);
            console.log(`Bridge success https://explorer.routernitro.com/tx/${txHash}`);
            await fundFeeService.fundFee(txnBridge.feeOnDestChain, module.address, txHash, module.chainId);
        } catch (error) {
            console.log(" Error when transfer", error);
        }
    }

    async getTotalValue(): Promise<number> {
        let balance = await this.module.getTotalValue();
        return Number(Number(ethers.formatUnits(balance, 6)).toFixed(6));
    }

    async withdraw(amount: number, omni: OmniFarmingModule): Promise<void> {
        if (amount < MIN_BRIDGE_AMOUNT) return;
        console.log(`Withdrawing from Base Compound V3 Module with ${amount} USDC ....`);
        let amountInput = ethers.parseUnits(amount.toString(), 6);
        let balance = await this.getBalance();
        if (amountInput > balance) {
            console.log(`Not enough balance in Base Compound V3 Module, need ${amountInput} USDC, but only have ${balance} USDC`);
            return;
        }
        let txnBridge = await routerService.getTxnBridgeUSDC(this.address, omni.address, this.chainId, omni.chainId, this.usdcAddress, omni.usdcAddress, amountInput);
        console.log("Bridge from base to Sapphire....");
        let txResponse = await this.module.bridge(amountInput, txnBridge.allowanceTo, txnBridge.to, txnBridge.data);
        let txReceipt = await txResponse.wait();
        let txHash = txReceipt!.hash;
        console.log("Send tx Bridge success: https://explorer.routernitro.com/tx/" + txReceipt!.hash);
        await routerService.wait(txHash);
        console.log(`Bridge success https://explorer.routernitro.com/tx/${txHash}`);
        await fundFeeService.fundFee(txnBridge.feeOnDestChain, omni.address, txHash, omni.chainId);
    }
}
