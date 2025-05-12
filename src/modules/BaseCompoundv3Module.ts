import { ethers, JsonRpcProvider, Provider, Wallet } from "ethers";
import { CHAIN_ID, EVM_ADDRESS, RPC } from "./../common/config/config";
import { CompoundV3Module, CompoundV3Module__factory, ERC20, ERC20__factory } from "../typechain-types";

import { Module } from "./Module";
import { routerService } from "../bridge/RouterService";
import { isProduction } from "../common/config/secrets";
import { OmniFarmingModule } from "./OmniFarmingModule";

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
        return 4.21;
    }

    async deposit(): Promise<void> {
        if (!isProduction) return;
        let balance = await this.getBalance();
        if (balance >= 10 * 10 ** 6) {
            let txResponse = await this.module.deposit();
            await txResponse.wait();
        }
    }

    async transferAllToModule(module: Module): Promise<void> {
        if (module.chainId != CHAIN_ID.base) {
            return this.transferAllToNonBaseModule(module);
        } else {
            return this.transferAllToBaseModule(module);
        }
    }

    public async getBalance(): Promise<number> {
        let balance = await this.module.getTotalValue();

        return 0;
    }

    private async transferAllToBaseModule(module: Module): Promise<void> {
        if (!isProduction) return;
        if (module.address == this.address) return;
        let balance = await this.module.getTotalValue();
        let txResponse = await this.module.transfer(module.address, balance);
        await txResponse.wait();
    }

    private async transferAllToNonBaseModule(module: Module): Promise<void> {
        let balance = await this.getBalance();
        let txnBridge = await routerService.getTxnBridgeUSDC(this.agent.address, module.address, this.chainId, module.chainId, this.usdcAddress, module.usdcAddress, BigInt(balance));
        console.log(txnBridge);
        // bridge all
        let txResponse = await this.module.bridgeAll(txnBridge.allowanceTo, txnBridge.to, txnBridge.data, txnBridge.value);
        let txHash = await txResponse.wait();
        // check on router
    }

    async withdraw(amount: number, omni: OmniFarmingModule): Promise<void> {
        if (amount == 0) return;
        if (!isProduction) return;
        let amountInput = ethers.parseUnits(amount.toString(), 6);
        let txnBridge = await routerService.getTxnBridgeUSDC(this.address, omni.address, this.chainId, omni.chainId, this.usdcAddress, omni.usdcAddress, amountInput);
        console.log(txnBridge);
        let txResponse = await this.module.bridgeAll(txnBridge.allowanceTo, txnBridge.to, txnBridge.data, txnBridge.value);
        let txHash = await txResponse.wait();
        // check on router
        //
    }
}
