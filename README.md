# Deposit Contract POC

## Abstract

Merchants and centralized exchanges would benefit from having a unified methodology 
of depositing ETH funds without the need to deploy one contract per user, OR create 
a primitive hot wallet that sends ETH received.

This POC is a rough idea of what I want to accomplish. The ERC itself would likely need
to define the interface for the wallet, and the address format.

I have created a very rough address format just as an example.

You can read the tests and run them using the following on Mac/Linux or Linux subsystem on Windows:

```bash
npm install # you will likely see a lot of errors, ignore them, as long as the install succeeds.
npm test
```

## Part 1: New address format

In order to add the new deposit id data, we need to encode it along with the 20 byte
account address. For this POC, I have just appended the 8 byte id to the end of the
address.

A 3 byte checksum is included in the id, which is the first 3 bytes of the keccak256
hash of the 20 byte address and first 5 bytes of the id concatenation (25 bytes).

DepositV2 has a contract that validates the checksum itself and reverts if incorrect.

## Part 2: The Interface

A contract that follows this ERC:

- `The contract` MUST revert if sent a transaction where `msg.data` is null (A pure value transaction).
- `The contract` MUST have a function a deposit function as follows:

```solidity
interface DepositEIP {
  function deposit(bytes8 id) external payable returns (bool);
}
```

- `deposit(bytes8)` MUST return `false` when the contract needs to keep the value, but signal to the depositor that the deposit (in terms of the parent application) itself has not yet succeeded. (This can be used for partial payment, ie. the invoice is for 5 ETH, sending 3 ETH returns false, but sending a second tx with 2 ETH will return true.)
- `deposit(bytes8)` MUST revert if the deposit somehow failed and the contract does not need to keep the value sent.
- `deposit(bytes8)` MUST return `true` if the value will be kept and the payment is logically considered complete by the parent application (exchange/merchant).
- `deposit(bytes8)` SHOULD check the checksum contained within the 8 byte id. (See DepositV2)
- `deposit(bytes8)` SHOULD return any excess value received if the deposit id is a one-time-use invoice that has a set value and the value received is higher than the set value. However, this SHOULD NOT be done by sending back to `msg.sender` directly, but rather should be noted in the parent application and the depositor should be contacted out-of-band to the best of the application manager's ability.

## Part 3: Ease of support

`encodeFunctionSignature('deposit(bytes8)')` is `0x3ef8e69a`, so the process for
"supporting" sending to an address like this is as follows:

1. If you see a 28 byte address instead of a 20 byte one, keccak256 the first 25
and see if the first 3 bytes of that hash match the last 3 bytes.
2. If they match, send ETH to the first 20 byte address as normal, but with extra data.
3. The data field is `0x3ef8e69aNNNNNNNNNNNNNNNN000000000000000000000000000000000000000000000000`
4 byte function signature (constant), 8 byte id from the address
(same order, endianness does not change), and 24 0x00 bytes.
4. This will call the function with the 8 byte id as the first parameter.
5. This also makes it easy for users to send to these contracts when wallets don't support
the new address format, as long as the wallet allows arbitrary data entry for transactions.