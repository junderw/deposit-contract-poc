const DepositsV1 = artifacts.require('DepositsV1');
const DepositsV2 = artifacts.require('DepositsV2');

module.exports = async (deployer, network, accounts) => {
  if (network === 'development') {
    await deployer.deploy(DepositsV1, accounts[8], { from: accounts[9] });
    await deployer.deploy(DepositsV2, accounts[8], { from: accounts[9] });
  }
};
