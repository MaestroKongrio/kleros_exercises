pragma solidity ^0.8;
import "https://github.com/bokkypoobah/BokkyPooBahsDateTimeLibrary/blob/master/contracts/BokkyPooBahsDateTimeLibrary.sol";

contract Inheritance {
    using BokkyPooBahsDateTimeLibrary for uint;


    uint public lastUpdate;
    address public heir;
    address public owner;

    event withdrawal_executed(uint amount);
    event withdrawal_failed(bytes data);
    event heir_changed(address heic);
    event control_taked(address heic);

    constructor(address _heir) {
        require(_heir != address(0), "Heir cannot be zero address");
        require(msg.sender != _heir, "Please use a different heir");
        owner= msg.sender;
        heir=_heir;
        lastUpdate = block.timestamp;
    }

    modifier onlyOwner () {
        require(msg.sender==owner,"Unaurthorized Access");
        _;
    }

    //All the funds can only be withdrawed by owner, so I see no reentrancy danger
    //Anyway, pattern Check - Effect - Action doesn't hurt...
    function withdraw(uint amount) public onlyOwner {
        require(address(this).balance >= amount, 
                "insufficient funds");
        lastUpdate= block.timestamp;
        (bool success, bytes memory data) =owner.call{value: amount}("");
        if(success) {
            emit withdrawal_executed(amount);
        } else {
            emit withdrawal_failed(data);
        }
    }

    function changeHeir(address newHeir) public onlyOwner {
        heir= newHeir;
        emit heir_changed(newHeir);
    }

    function takeControl(address newHeir) public {
        require(addOneMonth(lastUpdate)<=block.timestamp,"Must wait longer");
        lastUpdate= block.timestamp;
        owner=heir;
        heir= newHeir;
        control_taked(newHeir);
    }

    //We're adding an extra day as margin before the take control function can be called
    //Since block.timestamp is manipulable to some extent, is better to add a small margin
    //to ensure that original owner is in fact "dead", and ensure he isn't fooled by timetamp
    //manipulation and loos monet even if last minute withdrawal is make
    function addOneMonth(uint timestamp) public pure returns(uint) {
        uint oneMonth= BokkyPooBahsDateTimeLibrary.addMonths(timestamp,1);
        return BokkyPooBahsDateTimeLibrary.addDays(oneMonth,1);
    }


    receive() external payable {}

}