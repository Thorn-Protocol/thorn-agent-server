import { Contract, ethers, JsonRpcProvider, Wallet } from "ethers";
import { ERC20__factory, FundFee, FundFee__factory } from "../typechain-types";
import { FundFeeContract } from "./FundFeeContract";
import { CHAIN_ID, EVM_ADDRESS, RPC } from "../common/config/config";

export class BaseFundFee extends FundFeeContract {
    public chainId: string = CHAIN_ID.base;
    private usdcAddress: string;
    private agent: Wallet;
    private provider: JsonRpcProvider;
    private address: string;
    private contract: FundFee;
    constructor(privateKeyAgent: string) {
        super();
        this.provider = new JsonRpcProvider(RPC.base);
        this.agent = new Wallet(privateKeyAgent, this.provider);
        this.usdcAddress = EVM_ADDRESS.base.usdc;
        this.address = EVM_ADDRESS.base.fundFee;
        this.contract = FundFee__factory.connect(EVM_ADDRESS.base.fundFee, this.agent);
    }

    async fundFee(amount: bigint, address: string, txnHash: string) {
        console.log("Funding bridge fee at Base Network: ", amount);
        let usdcContract = ERC20__factory.connect(this.usdcAddress, this.agent);
        let balance = await usdcContract.balanceOf(this.address);
        if (balance < amount) {
            console.log("Insufficient balance in Base Fund Fee");
            return;
        }
        let txResponse = await this.contract.fee_compensation(txnHash, address, amount);
        let txReceipt = await txResponse.wait();
        console.log("Funding success: https://basescan.org/tx/" + txReceipt!.hash);
    }
}
