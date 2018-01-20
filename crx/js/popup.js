function elemLoad() {
    chrome.runtime.sendMessage({
            "messageType": "load"
        },
        (storage) => {
            elemSync(storage);
        });
}

function elemSync(storage) {
    console.log(storage);
    $("#conn-count").text(storage.waitingList.length);
    $("#connIndicator").text((storage.connected) ? "同步中" : "离线");
    $("#connIndicator").css("color", (storage.connected) ? "#227D51" : "#000000");
    if (!storage.name) {
        $(".container").css("display", "none");
        $("#splash").css("display", "block");
    }

    $("#wlist-data").empty().append(_.map(storage.waitingList, (item) => {
        return `<ul>${item.name}</ul>`
    }));

}

function uiListenerSetup() {
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

    $("#button-reset").click(() => {
        chrome.runtime.sendMessage({
            "messageType": "reset"
        }, () => {
            elemLoad();
        });
    });

    $("#name-form").submit((e) => {
        chrome.runtime.sendMessage({
            "messageType": "profileUpdate",
            "payload": {
                "name": $("#name-form").find('input[name="name"]').val()
            }
        });
    });
}
function uiElemSetup() {
    elemLoad();
}

// ==========

let data, clusterize;

// ==========

$(document).ready(() => {
    uiElemSetup();
    uiListenerSetup();

    chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
        console.log(`new message: ${req.messageType}`);
        switch (req.messageType) {
            case "waitingListUpdate":
                $("#conn-count").text(req.payload.length);
                $("#wlist-data").empty().append(_.map(req.payload, (item) => {
                    return `<ul>${item.name}</ul>`
                }));
                break;
            case "connectionUpdate":
                $("#connIndicator").css("color", (req.payload.connected) ? "#227D51" : "#000000");
                $("#connIndicator").text((req.payload.connected) ? "同步中" : "离线");
                break;
            default:
                console.log(`unsupported message: ${req.messageType}`);
        }
        sendRes();
        return true;
    });


});