// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface DepositEIP2 {
    function deposit(bytes8 id) external payable returns (bool);
}

contract DepositsV2 is DepositEIP2 {
    address payable public immutable forwardAddress;

    constructor(address payable forwardAddr) public {
        forwardAddress = forwardAddr;
    }

    event Deposit(bytes8 id, uint256 amount, address forwardTo);

    function deposit(bytes8 id) external override payable returns (bool) {
        bytes32 chkhash = keccak256(
            abi.encodePacked(address(this), bytes5(id))
        );
        bytes3 chkh = bytes3(chkhash);
        bytes3 chki = bytes3(bytes8(uint64(id) << 40));
        require(chkh == chki, 'checksum mismatch');
        (bool result, ) = forwardAddress.call{ value: msg.value }('');
        require(result, 'Could not forward funds');
        emit Deposit(id, msg.value, forwardAddress);
        return true;
    }
}
