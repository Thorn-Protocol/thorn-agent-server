import { Provider, Wallet } from "ethers";
import { FundFee } from "../typechain-types";

export abstract class FungingTemplate {
    public abstract chainId: string;
    public abstract funding(amount: bigint, address: string, txnHash: string): Promise<void>;
}
