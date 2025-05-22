import { OmniFarmingModule } from "../omni-farming/OmniFarmingModule";

export abstract class Module {
    public abstract name: string;
    public abstract chainId: string;
    public abstract address: string;
    public abstract usdcAddress: string;
    abstract getAgentOnChain(): Promise<string>;
    abstract getAPY(): Promise<number>;
    abstract deposit(): Promise<void>;
    abstract transferAllToModule(module: Module): Promise<void>;
    abstract withdraw(amountNeedForWithdraw: number, omnifarming: OmniFarmingModule): Promise<void>;
    abstract getTotalValue(): Promise<number>;
}
