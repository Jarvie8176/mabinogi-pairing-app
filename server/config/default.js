const path = require("path");

const basePath = path.join(__dirname, "..");

const paths = {
    basePath: basePath
};


module.exports = {
    paths: paths,
    db: {
        database: "main",
        username: null,
        password: null,
        dialect: "sqlite",
        storage: path.join(paths.basePath, "db/main.db")
    }
};