const Promise = require("bluebird");
const config = require("config");
const path = require("path");

const models = require(path.join(config.get("paths.basePath"), "models"));
const Sequelize = models.Sequelize;
const sequelize = models.sequelize;

class ClientEventHandler {
    constructor() {}

    _broadcastToAll(socket, event, payload) {
        socket.emit(event, payload);
        socket.broadcast.emit(event, payload);
    }

    registerHandler(socket) {
        socket.on("signup", (payload) => {
            // validation
            if (typeof(payload.name) !== "string") {
                console.log("invalid singup: invalid parameter: name");
            }

            return sequelize.transaction(() => {
                return Promise.try(() => {
                    return models.profile.findOne({
                        where: {
                            name: {
                                [Sequelize.Op.eq]: payload.name
                            }
                        }
                    });
                }).then((res) => {
                    if (res && res.signup_status) {
                        // already signed up
                    }
                    else {
                        return models.profile.upsert({
                            name: payload.name,
                            signup_status: true
                        });
                    }
                })
            }).then(() => {
                return models.profile.findAll({
                    where: {
                        signup_status: {
                            [Sequelize.Op.eq]: true
                        }
                    }
                });
            }).then((activeUsers) => {
                console.log(`sign on, name: ${payload.name}, count: ${activeUsers.length}`);
                this._broadcastToAll(socket, "waitingListUpdate", activeUsers);
            });
        });

        socket.on("signoff", (payload) => {
            // validation
            if (typeof(payload.name) !== "string") {
                console.log("invalid singup: invalid parameter: name");
            }

            return sequelize.transaction(() => {
                return Promise.try(() => {
                    return models.profile.findOne({
                        where: {
                            name: {
                                [Sequelize.Op.eq]: payload.name
                            }
                        }
                    });
                }).then((res) => {
                    if (res && res.signup_status) {
                        return models.profile.upsert({
                            name: payload.name,
                            signup_status: false
                        });
                    }
                    else {
                        // already signed off or profile doesn't exist
                    }
                })
            }).then(() => {
                return models.profile.findAll({
                    where: {
                        signup_status: {
                            [Sequelize.Op.eq]: true
                        }
                    }
                });
            }).then((activeUsers) => {
                console.log(`sign off, name: ${payload.name}, count: ${activeUsers.length}`);
                this._broadcastToAll(socket, "waitingListUpdate", activeUsers);
            });
        });
    }
}

module.exports = new ClientEventHandler();