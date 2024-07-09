const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VerifierContract", (m) => {
  const verifier = m.contract("Groth16Verifier");

  return { verifier };
});