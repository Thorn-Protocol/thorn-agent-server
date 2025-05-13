import { AGENT_EVM_PRIVATE_KEY } from "./common/config/secrets";
import { BaseFundFee } from "./FundFee/BaseFundFee";
import { fundFeeService } from "./FundFee/FundFeeService";
import { SapphireFundFee } from "./FundFee/SapphireFundFee";
import { BaseCompoundV3Module } from "./modules/BaseCompoundv3Module";
import { OmniFarmingModule } from "./modules/OmniFarmingModule";
import { OmniFarming } from "./OmniFarming/OmniFarming";

async function main() {
    const sapphireFundFee = new SapphireFundFee(AGENT_EVM_PRIVATE_KEY);
    const baseFundFee = new BaseFundFee(AGENT_EVM_PRIVATE_KEY);
    await fundFeeService.addFundFeeContract(sapphireFundFee);
    await fundFeeService.addFundFeeContract(baseFundFee);

    const omniFarming = new OmniFarmingModule(AGENT_EVM_PRIVATE_KEY);
    const baseCompoundV3Module = new BaseCompoundV3Module(AGENT_EVM_PRIVATE_KEY);
    const omni = new OmniFarming(omniFarming);
    await omni.addModule(baseCompoundV3Module);
    await omni.setup();
}

main();
