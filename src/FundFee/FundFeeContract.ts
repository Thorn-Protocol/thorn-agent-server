import { Provider, Wallet } from "ethers";
import { FundFee } from "../typechain-types";

export abstract class FundFeeContract {
    public abstract chainId: string;
    public abstract fundFee(amount: bigint, address: string, txnHash: string): Promise<void>;
}
