import { Contract, ethers, JsonRpcProvider, Wallet } from "ethers";
import { ERC20__factory, FundFee, FundFee__factory } from "../../typechain-types";

import { CHAIN_ID, EVM_ADDRESS, RPC } from "../../common/config/config";

export class FundingFee {
    public chainId: string = CHAIN_ID.sapphire;
    private usdc: string;
    private agent: Wallet;
    private provider: JsonRpcProvider;
    private address: string;
    private contract: FundFee;
    constructor(privateKeyAgent: string) {
        this.provider = new JsonRpcProvider(RPC.sapphire);
        this.agent = new Wallet(privateKeyAgent, this.provider);
        this.usdc = EVM_ADDRESS.sapphire.usdc;
        this.address = EVM_ADDRESS.sapphire.fundFee;
        this.contract = FundFee__factory.connect(EVM_ADDRESS.sapphire.fundFee, this.agent);
    }

    async funding(amount: number, address: string, txnHash: string) {
        console.log("Funding fee amount at Sapphire: ", amount);
        let amountInput = ethers.parseUnits(amount.toString(), 6);
        let usdcContract = ERC20__factory.connect(this.usdc, this.agent);
        let balance = await usdcContract.balanceOf(this.address);
        if (balance < amountInput) {
            console.log("Insufficient balance in Sapphire Fund Fee");
            return;
        }
        let txResponse = await this.contract.fee_compensation(txnHash, address, amountInput);
        let txReceipt = await txResponse.wait();
        console.log("Funded successfully at https://explorer.oasis.io/mainnet/sapphire/tx/" + txReceipt!.hash);
    }
}
