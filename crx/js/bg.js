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
    return chrome.storage.local.get(null, cb);
}

function loadStateFromServer() {
    // TODO
    // saveStorage();
}


let localStorage = {};


$(document).ready(function() {
    let ws = io("http://localhost:3000");

    ws.on("connect", () => {
        loadStateFromServer();
    });

    ws.on("message", (payload) => {
        console.log(`message from server: ${JSON.stringify(payload)}`);
    });

    ws.on("countUpdate", (payload) => {
        localStorage.count = payload.count;
        saveStorage({"count": payload.count});
        chrome.runtime.sendMessage({
            messageType: "countUpdate",
            payload: payload
        });
    });

    chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
        switch(req.messageType) {
            case "load":
                loadStorage((data) => {
                    localStorage = data;
                    sendRes(localStorage);
                });
                break;
            case "signup":
            case "signoff":
                {
                    ws.emit(req.messageType, req.payload);
                    sendRes();
                }
                break;
            default:
        }
        return true;
    });
});