function elemSync(storage) {
    console.log(storage);
    $("#conn-count").text((storage.count ? storage.count : 0));
}

$(document).ready(() => {
    chrome.runtime.sendMessage({
        "messageType": "load"
    },
        (storage) => { elemSync(storage);
    });

    $("#button-signup").click(() => {
        chrome.runtime.sendMessage({
            "messageType": "signup",
            "payload": {
                "user": "test"
            }
        },
            (res) => {
                console.log(`sign up response: ${res}`);
            });
    });

    $("#button-signoff").click(() => {
        chrome.runtime.sendMessage({
                "messageType": "signoff",
                "payload": {
                    "user": "test"
                }
            },
            (res) => {
                console.log(`sign off response: ${res}`);
            });
    });

    chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
        if (req.messageType === "countUpdate") {
            $("#conn-count").text(req.payload.count);
        }
        sendRes();
        return true;
    });
});