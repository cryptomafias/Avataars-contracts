// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IAvatars is IERC1155 {
    function setAvatarCreationFee(uint fee) external;
    function setAttachmentCreationFee(uint fee) external;
    function createAvatar() external;
    function changeDefaultAvatar(uint tokenId) external;
    function isAttachment(uint tokenId) external returns (bool);
    function addAttachment(uint avatarId, string memory attachmentName, uint attachmentId) external;
    function removeAttachment(uint avatarId, string memory attachmentName, uint attachmentId) external;
    function buyAttachment(string memory attachmentName, uint attachmentId) external;

    event AttachmentAdded(address indexed updater, uint avatarId, uint attachmentId);
    event AttachmentRemoved(address indexed updater, uint avatarId, uint attachmentId);
    event UpdateDefaultAvatar(address indexed updater, uint avatarId);
}