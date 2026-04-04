export default {
    transform: {},
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testEnvironment: "node",
    setupFiles: ["dotenv/config"],
};
