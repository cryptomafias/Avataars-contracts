const Avatars = artifacts.require("Avatars");

contract("Avatars test", async (accounts) => {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  let owner = accounts[0];
  let nonOwner = accounts[1];
  let catchRevert = require("./exceptions.js").catchRevert;
  let instance;

  describe("sanity check:", function () {
    before(async function () {
      instance = await Avatars.new(1000, 100);
    });
    it("should put 10**12 Transformium in the first account", async () => {
      const balance = await instance.balanceOf.call(accounts[0], 0);
      assert.equal(balance.valueOf(), 1000000000000);
    });
    it("should have avatarCreationFee of 1000", async () => {
      const fee = await instance.avatarCreationFee.call();
      assert.equal(fee.valueOf(), 1000);
    });
    it("should have attachmentCreationFee of 100", async () => {
      const fee = await instance.attachmentCreationFee.call();
      assert.equal(fee.valueOf(), 100);
    });
    it("should have 205 total tokens", async () => {
      const tokens = await instance.totalTokens.call();
      assert.equal(tokens.valueOf(), 205);
    });
  });

  describe("only owner can change avatarCreationFee:", function () {
    before(async function () {
      instance = await Avatars.new(1000, 100);
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
      instance = await Avatars.new(1000, 100);
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
      instance = await Avatars.new(1000, 100);
    });
    it("should complete successfully", async function () {
      nextTokenId = await instance.totalTokens.call();
      tx = await instance.createAvatar();
      const eventLogs = tx.receipt.logs;
      // Check if it burns 1000 Transformium
      assert.equal(eventLogs[0].event, "TransferSingle");
      assert.equal(eventLogs[0].args.id.valueOf(), 0);
      assert.equal(eventLogs[0].args.value.valueOf(), 1000);
      assert.equal(eventLogs[0].args.from, owner);
      assert.equal(eventLogs[0].args.to, ZERO_ADDRESS);

      // Check if it mints a new Avatar NFT
      assert.equal(eventLogs[1].event, "TransferSingle");
      assert.equal(eventLogs[1].args.id.toString(), nextTokenId.toString());
      assert.equal(eventLogs[1].args.value.valueOf(), 1);
      assert.equal(eventLogs[1].args.from, ZERO_ADDRESS);
      assert.equal(eventLogs[1].args.to, owner);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.createAvatar({ from: nonOwner }),
        "ERC1155: burn amount exceeds balance"
      );
    });
  });

  describe("only allow person with enough transformium to buy attachments", function () {
    before(async function () {
      instance = await Avatars.new(1000, 100);
    });
    it("should complete successfully", async function () {
      tx = await instance.buyAttachment("skin", 1);
      const eventLogs = tx.receipt.logs;
      // Check if it burns 100 Transformium
      assert.equal(eventLogs[0].event, "TransferSingle");
      assert.equal(eventLogs[0].args.id.valueOf(), 0);
      assert.equal(eventLogs[0].args.value.valueOf(), 100);
      assert.equal(eventLogs[0].args.from, owner);
      assert.equal(eventLogs[0].args.to, ZERO_ADDRESS);

      // // Check if it mints a new Avatar NFT
      assert.equal(eventLogs[1].event, "TransferSingle");
      assert.equal(eventLogs[1].args.id.valueOf(), 162);
      assert.equal(eventLogs[1].args.value.valueOf(), 1);
      assert.equal(eventLogs[1].args.from, ZERO_ADDRESS);
      assert.equal(eventLogs[1].args.to, owner);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.buyAttachment("skin", 1, { from: nonOwner }),
        "ERC1155: burn amount exceeds balance"
      );
    });
  });

  describe("only allow person with attachment to sell it", function () {
    before(async function () {
      instance = await Avatars.new(1000, 100);
      tx = await instance.buyAttachment("skin", 1);
    });
    it("should complete successfully", async function () {
      tx = await instance.sellAttachment("skin", 1);
      const eventLogs = tx.receipt.logs;
      // Check if it burns 1000 Transformium
      assert.equal(eventLogs[0].event, "TransferSingle");
      assert.equal(eventLogs[0].args.id.valueOf(), 0);
      assert.equal(eventLogs[0].args.value.valueOf(), 100);
      assert.equal(eventLogs[0].args.from, ZERO_ADDRESS);
      assert.equal(eventLogs[0].args.to, owner);

      // Check if it mints a new Avatar NFT
      assert.equal(eventLogs[1].event, "TransferSingle");
      assert.equal(eventLogs[1].args.id.valueOf(), 162);
      assert.equal(eventLogs[1].args.value.valueOf(), 1);
      assert.equal(eventLogs[1].args.from, owner);
      assert.equal(eventLogs[1].args.to, ZERO_ADDRESS);
    });
    it("should abort with an error", async function () {
      await catchRevert(
        instance.sellAttachment("skin", 1, { from: nonOwner }),
        "ERC1155: burn amount exceeds balance"
      );
    });
  });

  // describe("only allow person with attachment can attach it", function () {
  //   before(async function () {
  //     instance = await Avatars.new(1000, 100);
  //     await instance.createAvatar({from: owner});
  //     await instance.createAvatar({from: nonOwner});
  //     await instance.buyAttachment("skin", 1, {from: owner});
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
});
