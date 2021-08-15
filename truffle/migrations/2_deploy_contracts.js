let Avatars = artifacts.require("Avatars");
let Transformium = artifacts.require("Transformium");

module.exports = async function (deployer) {
    // deployment steps
    await deployer.deploy(Transformium, (10 ** 10));
    await deployer.deploy(Avatars, 1, Transformium.address, 1000, 100, 204);
};