// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface DepositEIP1 {
    function deposit(bytes8 id) external payable returns (bool);
}

contract DepositsV1 is DepositEIP1 {
    address payable public immutable forwardAddress;

    constructor(address payable forwardAddr) public {
        forwardAddress = forwardAddr;
    }

    event Deposit(bytes8 id, uint256 amount, address forwardTo);

    function deposit(bytes8 id) external override payable returns (bool) {
        (bool result, ) = forwardAddress.call{ value: msg.value }('');
        require(result, 'Could not forward funds');
        emit Deposit(id, msg.value, forwardAddress);
        return true;
    }
}
