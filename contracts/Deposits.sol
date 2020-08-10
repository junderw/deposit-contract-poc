// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface DepositEIP {
    function deposit(bytes8 id) external payable returns (bool);
}

contract Deposits is DepositEIP {
    address payable public immutable forwardAddress;

    constructor(address payable forwardAddr) public {
        forwardAddress = forwardAddr;
    }

    event Deposit(bytes8 id, uint256 amount);

    function checksumMatch(bytes8 id) internal view returns (bool) {
        bytes32 chkhash = keccak256(
            abi.encodePacked(address(this), bytes5(id))
        );
        bytes3 chkh = bytes3(chkhash);
        bytes3 chki = bytes3(bytes8(uint64(id) << 40));
        return chkh == chki;
    }

    function deposit(bytes8 id) external override payable returns (bool) {
        require(checksumMatch(id), 'checksum mismatch');

        (bool result, ) = forwardAddress.call{ value: msg.value }('');
        require(result, 'Could not forward funds');

        emit Deposit(id, msg.value);
        return true;
    }
}
