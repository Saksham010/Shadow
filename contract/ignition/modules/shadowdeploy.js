const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpdatedFinalShadowContract", (m) => {
  const shadow = m.contract("Shadow",["0xe4c86752a1aeC71Bc3F9c5231A2A87D279C37562","0x0057944092F3da98305b7805190A349E9Fc38Cfb"]);

  return { shadow };
});