function badgeUpdate(payload) {
    console.log(`badgeUpdate: payload: ${JSON.stringify(payload)}`);
    if (typeof(payload.count) !== "undefined") {
        chrome.browserAction.setBadgeText({"text": payload.count.toString()});
    }
    if (typeof(payload.connected) !== "undefined") {
        chrome.browserAction.setBadgeBackgroundColor({"color": (payload.connected) ? "#227D51" : "#000000"});
    }
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
}

function startConnection() {
    if (!ws) {
        ws = io(host, {
            "reconnectionAttempts": 1
        });
        return;
    }
    if (!ws.connected) {
        ws.connect();
    }
}

function browserListenerSetup() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
        console.log(changes);
        for (let key in changes) {
            if (key === "waitingList" && namespace === "local") {
                badgeUpdate({ count: changes[key].newValue.length });
            }
            if (key === "connected" && namespace === "local") {
                badgeUpdate({ connected: changes[key].newValue });
            }
        }
    });

    chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
        switch(req.messageType) {
            case "load":
            {
                startConnection(ws);
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
}

function init() {
    browserListenerSetup();
    startConnection();
    badgeUpdate({
        count: localStorage.waitingList.length,
        connected: ws.connected
    });
}


// ================

const defLocalStorage = {
    name: null,
    connected: false,
    waitingList: []
};

const host = "https://mabi.wiarlawd.me:9000";

let localStorage = _.clone(defLocalStorage, true);
let ws;


// ================

$(document).ready(function() {
    init();

    ws.on("connect", () => {
        localStorage.connected = true;
        saveStorage({"connected": localStorage.connected});
        badgeUpdate({ connected: localStorage.connected }); // somehow the first storage update event is not delivered to the listener
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
        localStorage.waitingList = payload;
        saveStorage({"waitingList": localStorage.waitingList});
        deliverEvent({
            messageType: "waitingListUpdate",
            payload: payload
        });
    });

    ws.on("error", (payload) => {
        console.log(payload)
    });
});