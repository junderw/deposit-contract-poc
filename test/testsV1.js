const assert = require('assert');
const DepositsV1 = artifacts.require('DepositsV1');

contract('DepositsV1', async (accounts) => {
  let deposit;
  const RECEIVER = accounts[8];
  beforeEach(async () => {
    deposit = await DepositsV1.new(RECEIVER);
  });
  describe('Events', async () => {
    it('should emit an event', async () => {
      const tx = await deposit.deposit('0x0102030405060708', {
        value: '1000000000000000000',
      });
      logger(`    ********** Gas used for deposit: ${tx.receipt.gasUsed}`);

      const results = await deposit.getPastEvents('Deposit', {
        fromBlock: 0,
        toBlock: 'latest',
      });
      assert.equal(results.length, 1);

      const { id, amount, forwardTo } = results[0].returnValues;
      assert.equal(id, '0x0102030405060708');
      assert.equal(amount.toString(10), '1000000000000000000');
      assert.equal(forwardTo, RECEIVER);
    });
  });

  describe('Balance', async () => {
    it('should forward the balance to RECEIVER', async () => {
      const receiverBalance1 = BigInt(await web3.eth.getBalance(RECEIVER));
      await deposit.deposit('0x0102030405060708', {
        value: '1000000000000000000',
      });
      const receiverBalance2 = BigInt(await web3.eth.getBalance(RECEIVER));

      assert.equal(
        (receiverBalance2 - receiverBalance1).toString(10),
        '1000000000000000000',
      );
    });
  });

  describe('Failure', async () => {
    it('should revert when forwarding fails', async () => {
      const deposit2 = await DepositsV1.new(deposit.address);
      await assert.rejects(
        deposit2.deposit('0x0102030405060708', {
          value: '1000000000000000000',
        }),
        /Could not forward funds\.$/,
      );
    });
  });
});

// Don't report gas if running coverage
// solidity-coverage gas costs are irregular
const IS_COVERAGE = process.env.npm_lifecycle_script === 'truffle run coverage';
const logger = IS_COVERAGE ? () => {} : console.log;
