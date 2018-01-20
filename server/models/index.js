const config = require("config");
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const cls = require("continuation-local-storage");
const Sequelize = require("sequelize");

// NOTE: use transaction if switch to a more appropriate db, doesn't work well with sqlite
// Sequelize.useCLS(cls.createNamespace("sequelize-namespace"));

let options = {
    logging: false,
    operatorsAliases: false
};
let dbConfig = _.extend(config.get("db"), options);
let sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
let modelsDir = path.join(__dirname, 'models');
let db = importModels(modelsDir);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;


// ========

function importModels(modelsDir) {
    let db = {};
    let files = fs.readdirSync(modelsDir);

    // import models
    _.each(files, (modelFileName) => {
        let model = sequelize.import(path.join(modelsDir, modelFileName));
        db[model.name] = model;
    });

    // set up model association
    _.forOwn(db, (model) => {
        if ("associate" in model) {
            model.associate(db);
        }
    });

    return db;
}