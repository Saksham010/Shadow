const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("HasherContract", (m) => {
  const hasher = m.contract("Hasher");

  return { hasher };
});