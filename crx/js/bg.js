function badgeUpdate(count) {
    console.log(`total waiting: ${count}`);
    chrome.browserAction.setBadgeText({"text": count.toString()});
}

function deliverEvent(message, cb) {
    console.log(`message delivery: ${message.messageType}`);
    chrome.runtime.sendMessage(message, cb);
}


function saveStorage(elem) {
    if (elem) {
        console.log(`saving ${JSON.stringify(elem)}`);
        chrome.storage.local.set(elem);
    }
    else {
        console.log("saving all");
        chrome.storage.local.set(storage);
    }
}

function loadStorage(cb) {
    return chrome.storage.local.get(null, (res) => {
        cb(res || {});
    });
}

function loadStateFromServer() {
    // TODO
    // saveStorage();

    // set count
    console.log(localStorage)
    badgeUpdate(localStorage.waitingList.length);
}

function initConnection(ws) {
    if (!ws.connected) {
        ws.connect();
    }
}


// ================

const defLocalStorage = {
    name: null,
    connected: false,
    waitingList: []
};

const host = "https://mabi.wiarlwad.me:9000";

let localStorage = _.clone(defLocalStorage, true);


// ================

$(document).ready(function() {
    let ws = io(host, {
        "reconnectionAttempts": 1
    });

    ws.on("connect", () => {
        localStorage.connected = true;
        saveStorage({"connected": localStorage.connected});
        loadStateFromServer();
        deliverEvent({
            messageType: "connectionUpdate",
            payload: {
                connected: true
            }
        })
    });

    ws.on("disconnect", () => {
        localStorage.conencted = false;
        saveStorage({"connected": localStorage.connected});
    });

    ws.on("reconnect_failed", () => {
        localStorage.connected = false;
        saveStorage({"connected": localStorage.connected});
        deliverEvent({
            messageType: "connectionUpdate",
            payload: {
                connected: false
            }
        })
    });

    ws.on("message", (payload) => {
        console.log(`message from server: ${JSON.stringify(payload)}`);
    });

    ws.on("waitingListUpdate", (payload) => {
        console.log(payload);
        localStorage.waitingList = payload;
        saveStorage({"waitingList": localStorage.waitingList});
        badgeUpdate(localStorage.waitingList.length);
        deliverEvent({
            messageType: "waitingListUpdate",
            payload: payload
        });
    });

    ws.on("error", (payload) => {
        console.log(payload)
    });

    chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
        switch(req.messageType) {
            case "load":
                {
                    initConnection(ws);
                    loadStorage((data) => {
                        localStorage = data;
                        sendRes(localStorage);
                    });
                }
                break;
            case "signup":
            case "signoff":
                {
                    ws.emit(req.messageType, { name: localStorage.name });
                    sendRes();
                }
                break;
            case "reset":
                {
                    // signoff
                    ws.emit("signoff", { name: localStorage.name });
                    localStorage = _.clone(defLocalStorage, true);
                    console.log(localStorage)
                    chrome.storage.local.clear();
                    localStorage.connected = ws.connected;
                    saveStorage(localStorage);
                    sendRes(localStorage);
                }
                break;
            case "profileUpdate":
                localStorage.name = req.payload.name;
                saveStorage({"name": localStorage.name});
                break;
            default:
                console.log(`unsupported message: ${req.messageType}`);
        }
        return true;
    });
});