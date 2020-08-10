const Deposits = artifacts.require('Deposits');

module.exports = async (deployer, network, accounts) => {
  if (network === 'development') {
    await deployer.deploy(Deposits, accounts[8], { from: accounts[9] });
  }
};
