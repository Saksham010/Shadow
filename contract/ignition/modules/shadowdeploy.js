const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ShadowContract", (m) => {
  const shadow = m.contract("Shadow",["0xe4c86752a1aeC71Bc3F9c5231A2A87D279C37562","0xe4c86752a1aeC71Bc3F9c5231A2A87D279C37562"]);

  return { shadow };
});