let tableName = "profile";

module.exports = function(sequelize, DataTypes) {
    let model = sequelize.define(tableName, {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: true,
            unique: true
        },
        signup_status: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        }
    }, {
        tableName: tableName,
        timestamps: false,
        freezeTableName: true,
        name: {
            singular: tableName,
            plural: tableName
        }
    });

    return model;
};