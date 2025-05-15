import { Contract, ethers, JsonRpcProvider, Wallet } from "ethers";
import { ERC20__factory, FundFee, FundFee__factory } from "../../typechain-types";

import { CHAIN_ID, EVM_ADDRESS, RPC } from "../../common/config/config";
import { FungingTemplate } from "../FundFeeContract";

export class FundingArbitrum extends FungingTemplate {
    public chainId: string = CHAIN_ID.arbitrum;
    private usdcAddress: string;
    private agent: Wallet;
    private provider: JsonRpcProvider;
    private address: string;
    private contract: FundFee;
    constructor(privateKeyAgent: string) {
        super();
        this.provider = new JsonRpcProvider(RPC.arbitrum);
        this.agent = new Wallet(privateKeyAgent, this.provider);
        this.usdcAddress = EVM_ADDRESS.arbitrum.usdc;
        this.address = EVM_ADDRESS.arbitrum.fundFee;
        this.contract = FundFee__factory.connect(EVM_ADDRESS.arbitrum.fundFee, this.agent);
    }

    async funding(amount: bigint, address: string, txnHash: string) {
        console.log("Funding bridge fee at Arbitrum Network: ", amount);
        let usdcContract = ERC20__factory.connect(this.usdcAddress, this.agent);
        let balance = await usdcContract.balanceOf(this.address);
        if (balance < amount) {
            console.log("Insufficient balance in Arbitrum Fund Fee");
            return;
        }
        let txResponse = await this.contract.fee_compensation(txnHash, address, amount);
        let txReceipt = await txResponse.wait();
        console.log("Funding success: https://arbiscan.io/tx/" + txReceipt!.hash);
    }
}
