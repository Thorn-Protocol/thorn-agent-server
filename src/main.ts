import { AGENT_EVM_PRIVATE_KEY } from "./common/config/secrets";
import { BaseCompoundV3Module } from "./modules/BaseCompoundv3Module";
import { OmniFarmingModule } from "./modules/OmniFarmingModule";
import { OmniFarming } from "./OmniFarming";
async function main() {
    const omniFarming = new OmniFarmingModule(AGENT_EVM_PRIVATE_KEY);
    const baseCompoundV3Module = new BaseCompoundV3Module(AGENT_EVM_PRIVATE_KEY);
    let balance = await baseCompoundV3Module.getBalance();
    console.log(balance);
    const omni = new OmniFarming(omniFarming);
    await omni.addModule(baseCompoundV3Module);
    await omni.setup();
}

main();
