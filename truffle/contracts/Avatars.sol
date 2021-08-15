// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ITransformium.sol";

// Chainlink random number haven't implemented because of some limitations.
contract Avatars is ERC1155, Ownable {
    using SafeERC20 for IERC20;

    ITransformium public transformium;

    uint256 public avatarCreationFee;
    uint256 public attachmentCreationFee;
    uint256 public totalAttachments;
    uint256 public totalTokens;
    uint256 public version;

    // owner => tokenId => no. of attachment attached to avatars
    mapping(address => mapping(uint => uint)) public attachmentInUse; 
    mapping(address => uint) public totalAvatars;
    mapping(address => uint) public defaultAvatar;


    // mapping(bytes32 => uint) public requestToToken; //request ID to token ID
    // mapping(bytes32 => address) public requestToOwner; //request ID to token ID

    event AttachmentAdded(address indexed updater, uint avatarId, uint attachmentId);
    event AttachmentRemoved(address indexed updater, uint avatarId, uint attachmentId);
    event UpdateDefaultAvatar(address indexed updater, uint avatarId);

    constructor(
        uint _version, 
        address _transformium, 
        uint _avatarCreationFee, 
        uint _attachmentCreationFee, 
        uint _totalAttachments
    ) ERC1155("") {
        avatarCreationFee = _avatarCreationFee;
        attachmentCreationFee = _attachmentCreationFee;
        transformium = ITransformium(_transformium);
        totalAttachments = _totalAttachments;
        totalTokens = _totalAttachments;
        version = _version;
    }

    function setAvatarCreationFee(uint fee) public onlyOwner {
        avatarCreationFee = fee;
    }

    function setAttachmentCreationFee(uint fee) public onlyOwner {
        attachmentCreationFee = fee;
    }

    // Note: Make sure to give approval for spending TFM from frontend.
    function createAvatar() external {
        uint tokenId = totalTokens;
        if(totalAvatars[_msgSender()] == 0){
            defaultAvatar[_msgSender()] = tokenId;
            emit UpdateDefaultAvatar(_msgSender(), tokenId);
        } 
        totalAvatars[_msgSender()]++;
        transformium.burnFrom(_msgSender(), avatarCreationFee);
        _mint(_msgSender(), tokenId, 1, "");
        totalTokens++;
    }

    function changeDefaultAvatar(uint tokenId) external {
        require(!isAttachment(tokenId), "Avatars: Not a valid avatar!");
        require(balanceOf(_msgSender(), tokenId) == 1, "Avatars: You must be owner of the avatar!");
        defaultAvatar[_msgSender()] = tokenId;
        emit UpdateDefaultAvatar(_msgSender(), tokenId);
    }

    // Todo: Maintain list of attached attachement so that removal can be possible.
    function addAttachment(uint avatarId, uint tokenId) external {
        require(isAttachment(tokenId), "Avatars: Not a valid attachment!");
        require(balanceOf(_msgSender(), tokenId) >= 1, "Avatars: You must own Attachments!");
        attachmentInUse[_msgSender()][tokenId] += 1;
        emit AttachmentAdded(_msgSender(), avatarId, tokenId);
    }

    // function removeAttachment(uint avatarId, uint tokenId) external {
    //     require(isAttachment(tokenId), "Avatars: Not a valid attachment!");
        
    //     attachmentInUse[_msgSender()][tokenId] -= 1;
    //     emit AttachmentRemoved(_msgSender(), avatarId, tokenId);
    // }

    function buyAttachment(uint tokenId) external {
        require(isAttachment(tokenId), "Avatars: Not a valid attachment!");
        transformium.burnFrom(_msgSender(), attachmentCreationFee);
        _mint(_msgSender(), tokenId, 1, "");
    }

    function isAttachment(uint tokenId) public view returns (bool) {
        return tokenId < totalAttachments;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    )
        public
        override
    {
        require(!isAttachment(id), "Avataars can't be transferred!");
        require(
            balanceOf(from, id) - attachmentInUse[from][id] >= amount, 
            "Avatars: Insufficient tokens!"
        );
        super.safeTransferFrom(from, to, id, amount, data);

    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        public
        virtual
        override
    {
        for (uint256 i = 0; i < ids.length; ++i) {
            require(!isAttachment(ids[i]), "Avataars can't be transferred!");
            require(
                balanceOf(from, ids[i]) - attachmentInUse[from][ids[i]] >= amounts[i], 
                "Avatars: Insufficient tokens!"
            );
        }
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }
}