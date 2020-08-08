const assert = require('assert');
const DepositsV2 = artifacts.require('DepositsV2');

/**
 * Converts an address and a 5 byte id to a deposit address. The format of the
 * return value is 28 bytes as follows. The + operator is byte concatenation.
 * (baseAddress + id5Bytes + keccak256(baseAddress + id5Bytes)[:3])
 *
 * @method generateAddress
 * @param {String} baseAddress the given HEX address (20 byte hex string with 0x prepended)
 * @param {String} id5Bytes the given HEX id (5 byte hex string with 0x prepended)
 * @return {String}
 */
const generateAddress = (baseAddress, id5Bytes) => {
  if (
    !baseAddress.match(/^0x[0-9a-fA-F]{40}$/) ||
    !id5Bytes.match(/^0x[0-9a-fA-F]{10}$/)
  ) {
    throw new Error('Base Address and id must be 0x hex strings');
  }
  let ret =
    baseAddress.toLowerCase() + id5Bytes.toLowerCase().replace(/^0x/, '');
  const myHash = web3.utils.keccak256(ret);
  return ret + myHash.slice(2, 8); // first 3 bytes
};

contract('DepositsV2', async (accounts) => {
  let deposit;
  let testId;
  const RECEIVER = accounts[8];
  beforeEach(async () => {
    ({ deposit, testId } = await deploy(RECEIVER));
  });
  describe('Addresses', () => {
    it('should be able to generate addresses', () => {
      for (const { address, id, newAddress } of ADDRESS_FIXTURES) {
        assert.equal(generateAddress(address, id), newAddress);
      }
    });
  });
  describe('Events', async () => {
    it('should emit an event', async () => {
      await deposit.deposit(testId, {
        value: '1000000000000000000',
      });

      const results = await deposit.getPastEvents('Deposit', {
        fromBlock: 0,
        toBlock: 'latest',
      });
      assert.equal(results.length, 1);

      const { id, amount, forwardTo } = results[0].returnValues;
      assert.equal(id, testId);
      assert.equal(amount.toString(10), '1000000000000000000');
      assert.equal(forwardTo, RECEIVER);
    });
  });

  describe('Balance', async () => {
    it('should forward the balance to RECEIVER', async () => {
      const receiverBalance1 = BigInt(await web3.eth.getBalance(RECEIVER));
      await deposit.deposit(testId, {
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
      const { deposit: deposit2, testId: testId2 } = await deploy(
        deposit.address,
      );
      await assert.rejects(
        deposit2.deposit(testId2, {
          value: '1000000000000000000',
        }),
        /Could not forward funds\.$/,
      );
    });

    it('should revert when checksum mismatch', async () => {
      await assert.rejects(
        deposit.deposit('0x0102030405060708', {
          value: '1000000000000000000',
        }),
        /checksum mismatch\.$/,
      );
    });
  });
});

const deploy = async (addr) => {
  const deposit = await DepositsV2.new(addr);
  const newAddress = generateAddress(deposit.address, '0x0102030405');
  // id is the last 8 bytes of the new address.
  return { deposit, testId: '0x' + newAddress.slice(-16) };
};

const ADDRESS_FIXTURES = [
  {
    address: '0x083d6b05729c58289eb2d6d7c1bb1228d1e3f795',
    id: '0xbdd769c69b',
    newAddress: '0x083d6b05729c58289eb2d6d7c1bb1228d1e3f795bdd769c69b3b97b9',
  },
  {
    address: '0x433e064c42e87325fb6ffa9575a34862e0052f26',
    id: '0x913fd924f0',
    newAddress: '0x433e064c42e87325fb6ffa9575a34862e0052f26913fd924f056cd15',
  },
  {
    address: '0xbbc6597a834ef72570bfe5bb07030877c130e4be',
    id: '0x2c8f5b3348',
    newAddress: '0xbbc6597a834ef72570bfe5bb07030877c130e4be2c8f5b3348023045',
  },
  {
    address: '0x17627b07889cd22e9fae4c6abebb9a9ad0a904ee',
    id: '0xe619dbb618',
    newAddress: '0x17627b07889cd22e9fae4c6abebb9a9ad0a904eee619dbb618732ef0',
  },
  {
    address: '0x492cdf7701d3ebeaab63b4c7c0e66947c3d20247',
    id: '0x6808043984',
    newAddress: '0x492cdf7701d3ebeaab63b4c7c0e66947c3d202476808043984183dbe',
  },
];
