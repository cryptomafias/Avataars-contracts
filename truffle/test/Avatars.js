const Avatars = artifacts.require("Avatars");
const Transformium = artifacts.require("Transformium");

contract("Avatars test", async (accounts) => {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  let owner = accounts[0];
  let nonOwner = accounts[1];
  let catchRevert = require("./exceptions.js").catchRevert;
  let instance;

  describe("sanity check:", function () {
    before(async function () {
      transformium = await Transformium.new(10**10);
      instance = await Avatars.new(1, transformium.address, 1000, 100, 204);
    });
    it("should have minted 10**10 Transformium in the first account", async () => {
      const balance = await transformium.balanceOf.call(owner);
      assert.equal(balance.valueOf(), 10**10);
    });
    it("should have avatarCreationFee of 1000", async () => {
      const fee = await instance.avatarCreationFee.call();
      assert.equal(fee.valueOf(), 1000);
    });
    it("should have attachmentCreationFee of 100", async () => {
      const fee = await instance.attachmentCreationFee.call();
      assert.equal(fee.valueOf(), 100);
    });
    it("should have 204 total tokens", async () => {
      const tokens = await instance.totalTokens.call();
      assert.equal(tokens.valueOf(), 204);
    });
    it("should have 204 total attachments", async () => {
      const tokens = await instance.totalAttachments.call();
      assert.equal(tokens.valueOf(), 204);
    });
  });

  describe("only owner can change avatarCreationFee:", function () {
    before(async function () {
      transformium = await Transformium.new(10**10);
      instance = await Avatars.new(1, transformium.address, 1000, 100, 204);
    });
    it("should complete successfully", async function () {
      await instance.setAvatarCreationFee(2000);
      const fee = await instance.avatarCreationFee.call();
      assert.equal(fee.valueOf(), 2000);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.setAvatarCreationFee(2000, { from: nonOwner }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("only owner can change attachmentCreationFee:", function () {
    before(async function () {
      transformium = await Transformium.new(10**10);
      instance = await Avatars.new(1, transformium.address, 1000, 100, 204);
    });
    it("should complete successfully", async function () {
      await instance.setAttachmentCreationFee(200);
      const fee = await instance.attachmentCreationFee.call();
      assert.equal(fee.valueOf(), 200);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.setAttachmentCreationFee(200, { from: nonOwner }),
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("only allow person with enough transformium to create an avatar", function () {
    before(async function () {
      transformium = await Transformium.new(10**10);
      instance = await Avatars.new(1, transformium.address, 1000, 100, 204);
      await transformium.approve(instance.address, 10 ** 10, {from: owner});
      await transformium.approve(instance.address, 10 ** 10, {from: nonOwner});
    });
    it("should complete successfully", async function () {
      nextTokenId = await instance.totalTokens.call();
      tx = await instance.createAvatar({from: owner});
      const eventLogs = tx.receipt.logs;

      assert.equal(eventLogs[0].event, "UpdateDefaultAvatar");
      assert.equal(eventLogs[0].args.updater, owner);
      assert.equal(eventLogs[0].args.avatarId.toString(), nextTokenId.toString());

      // Check if it mints a new Avatar NFT
      assert.equal(eventLogs[1].event, "TransferSingle");
      assert.equal(eventLogs[1].args.id.toString(), nextTokenId.toString());
      assert.equal(eventLogs[1].args.value.valueOf(), 1);
      assert.equal(eventLogs[1].args.from, ZERO_ADDRESS);
      assert.equal(eventLogs[1].args.to, owner);

      // Todo: Test for Transformium burn
      // Check if it burns 1000 Transformium
      // assert.equal(eventLogs[2].event, "Transfer");
      // assert.equal(eventLogs[2].args.value.valueOf(), 1000);
      // assert.equal(eventLogs[2].args.from, owner);
      // assert.equal(eventLogs[2].args.to, ZERO_ADDRESS);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.createAvatar({ from: nonOwner }),
        "ERC20: burn amount exceeds balance"
      );
    });
  });

  describe("only allow person with enough transformium to buy attachments", function () {
    before(async function () {
      transformium = await Transformium.new(10**10);
      instance = await Avatars.new(1, transformium.address, 1000, 100, 204);
      await transformium.approve(instance.address, 10 ** 10, {from: owner});
      await transformium.approve(instance.address, 10 ** 10, {from: nonOwner});
    });
    it("should complete successfully", async function () {
      tx = await instance.buyAttachment(0);
      const eventLogs = tx.receipt.logs;
      // Todo: Check if it burns 100 Transformium
      // assert.equal(eventLogs[0].event, "TransferSingle");
      // assert.equal(eventLogs[0].args.id.valueOf(), 0);
      // assert.equal(eventLogs[0].args.value.valueOf(), 100);
      // assert.equal(eventLogs[0].args.from, owner);
      // assert.equal(eventLogs[0].args.to, ZERO_ADDRESS);

      // // Check if it mints a new Avatar NFT
      assert.equal(eventLogs[0].event, "TransferSingle");
      assert.equal(eventLogs[0].args.id.valueOf(), 0);
      assert.equal(eventLogs[0].args.value.valueOf(), 1);
      assert.equal(eventLogs[0].args.from, ZERO_ADDRESS);
      assert.equal(eventLogs[0].args.to, owner);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.buyAttachment(0, { from: nonOwner }),
        "ERC20: burn amount exceeds balance"
      );
    });
  });

  // describe("only allow person with attachment to sell it", function () {
  //   before(async function () {
  //     instance = await Avatars.new(1000, 100);
  //     tx = await instance.buyAttachment("skin", 1);
  //   });
  //   it("should complete successfully", async function () {
  //     tx = await instance.sellAttachment("skin", 1);
  //     const eventLogs = tx.receipt.logs;
  //     // Check if it burns 1000 Transformium
  //     assert.equal(eventLogs[0].event, "TransferSingle");
  //     assert.equal(eventLogs[0].args.id.valueOf(), 0);
  //     assert.equal(eventLogs[0].args.value.valueOf(), 100);
  //     assert.equal(eventLogs[0].args.from, ZERO_ADDRESS);
  //     assert.equal(eventLogs[0].args.to, owner);

  //     // Check if it mints a new Avatar NFT
  //     assert.equal(eventLogs[1].event, "TransferSingle");
  //     assert.equal(eventLogs[1].args.id.valueOf(), 162);
  //     assert.equal(eventLogs[1].args.value.valueOf(), 1);
  //     assert.equal(eventLogs[1].args.from, owner);
  //     assert.equal(eventLogs[1].args.to, ZERO_ADDRESS);
  //   });
  //   it("should abort with an error", async function () {
  //     await catchRevert(
  //       instance.sellAttachment("skin", 1, { from: nonOwner }),
  //       "ERC1155: burn amount exceeds balance"
  //     );
  //   });
  // });

  describe("only allow person with attachment to attach it", function () {
    before(async function () {
      transformium = await Transformium.new(10**10);
      instance = await Avatars.new(1, transformium.address, 1000, 100, 204);

      await transformium.transfer(nonOwner, 10000, {from: owner});
      await transformium.approve(instance.address, 10 ** 10, {from: owner});
      await transformium.approve(instance.address, 10 ** 10, {from: nonOwner});
  
      await instance.createAvatar({from: owner});
      await instance.createAvatar({from: nonOwner});
      await instance.buyAttachment(1, {from: owner});
    });
    it("should complete successfully", async function () {
      tx = await instance.addAttachment(205, 1);
      const eventLogs = tx.receipt.logs;

      // Check if Attachment is added
      assert.equal(eventLogs[0].event, "AttachmentAdded");
      assert.equal(eventLogs[0].args.updater, owner);
      assert.equal(eventLogs[0].args.avatarId.valueOf(), 205);
      assert.equal(eventLogs[0].args.attachmentId.valueOf(), 1);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.addAttachment(206, 1, { from: nonOwner }),
        "Avatars: You must own Attachments!"
      );
    });
  });

// Todo: Implement this
//   describe("only allow person with attachment attached to remove it", function () {
//     before(async function () {
//       transformium = await Transformium.new(10**10);
//       instance = await Avatars.new(1, transformium.address, 1000, 100, 204);

//       await transformium.transfer(nonOwner, 10000, {from: owner});
//       await transformium.approve(instance.address, 10 ** 10, {from: owner});
//       await transformium.approve(instance.address, 10 ** 10, {from: nonOwner});
  
//       await instance.createAvatar({from: owner});
//       await instance.createAvatar({from: nonOwner});
//       await instance.buyAttachment(1, {from: owner});
//       tx = await instance.addAttachment(205, 1);
//     });
//     it("should complete successfully", async function () {
//       tx = await instance.removeAttachment(205, 1);
//       const eventLogs = tx.receipt.logs;

//       // Check if Attachment is added
//       assert.equal(eventLogs[0].event, "AttachmentRemoved");
//       assert.equal(eventLogs[0].args.updater, owner);
//       assert.equal(eventLogs[0].args.avatarId.valueOf(), 205);
//       assert.equal(eventLogs[0].args.attachmentId.valueOf(), 1);
//     });
//     it("should abort with an error", async function () {
//       await catchRevert(
//         instance.removeAttachment(206, 1, { from: nonOwner }),
//         "Avatars: You must own Attachments!"
//       );
//     });
//   });
});
