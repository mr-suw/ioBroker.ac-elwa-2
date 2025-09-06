// Don't silently swallow unhandled rejections
process.on("unhandledRejection", (e) => {
    throw e;
});

// enable the should interface with sinon
// and load chai-as-promised and sinon-chai by default
module.exports = {
    mochaHooks: {
        async beforeAll() {
            const chai = await import("chai");
            const sinonChai = await import("sinon-chai");
            const chaiAsPromised = await import("chai-as-promised");

            chai.should();
            chai.use(sinonChai.default);
            chai.use(chaiAsPromised.default);
        },
    },
};