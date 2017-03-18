var AlexaSkill = require("./AlexaSkill");
var serverinfo = require("./serverinfo");
var http = require("http");

if (serverinfo.host == "127.0.0.1") {
    throw "Default hostname found, edit your serverinfo.js file to include your server's external IP address";
}

var AlexaRoku = function () {
    AlexaSkill.call(this, serverinfo.appId);
};

AlexaRoku.prototype = Object.create(AlexaSkill.prototype);
AlexaRoku.prototype.constructor = AlexaRoku;

function sendCommand(path,body,callback) {
    var opt = {
        host: serverinfo.host,
        port: serverinfo.port,
        path: path,
        method: 'POST',
        headers: {'Authorization': serverinfo.pass},
    };

    var req = http.request(opt, function(res) {
        callback();
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    if (body) req.write(body);
    req.end();
}

AlexaRoku.prototype.intentHandlers = {
    Home: function (intent, session, response) {
        sendCommand("/roku/home",null,function() {
            response.tellWithCard("Going Home");
        });
    },
    Launch: function (intent, session, response) {
        sendCommand("/roku/launch",intent.slots.Text.value,function() {
            response.tellWithCard("Launching "+ intent.slots.Text.value);
        });
    },
    Captionson: function (intent, session, response) {
        sendCommand("/roku/captionson",null,function() {
            response.tellWithCard("Turning On Captions");
        });
    },
    Captionsoff: function (intent, session, response) {
        sendCommand("/roku/captionsoff",null,function() {
            response.tellWithCard("Turning Off Captions");
        });
    },
    Select: function (intent, session, response) {
        sendCommand("/roku/select",null,function() {
            response.tellWithCard("Ok");
        });
    },
    Back: function (intent, session, response) {
        sendCommand("/roku/back",null,function() {
            response.tellWithCard("Going Back");
        });
    },
    TV: function (intent, session, response) {
        sendCommand("/roku/tv",null,function() {
            response.tellWithCard("TV");
        });
    },
    Rewind: function (intent, session, response) {
        sendCommand("/roku/rewind",null,function() {
            response.tellWithCard("Rewinding");
        });
    
    },
    Fastforward: function (intent, session, response) {
        sendCommand("/roku/fastforward",null,function() {
            response.tellWithCard("Fast forwarding");
        });
    
    },
    Instantreplay: function (intent, session, response) {
        sendCommand("/roku/instantreplay",null,function() {
            response.tellWithCard("Instant Replay");
        });
    
    },
    Up: function (intent, session, response) {
        sendCommand("/roku/up",null,function() {
            response.tellWithCard("Up");
        });
    
    },
    Uptwo: function (intent, session, response) {
        sendCommand("/roku/uptwo",null,function() {
            response.tellWithCard("Up Two");
        });
    
    },
    Upthree: function (intent, session, response) {
        sendCommand("/roku/upthree",null,function() {
            response.tellWithCard("Up Three");
        });
    
    },
    Upfour: function (intent, session, response) {
        sendCommand("/roku/upfour",null,function() {
            response.tellWithCard("Up Four");
        });
    
    },
    Upfive: function (intent, session, response) {
        sendCommand("/roku/upfive",null,function() {
            response.tellWithCard("Up five");
        });
    
    },
    Down: function (intent, session, response) {
        sendCommand("/roku/down",null,function() {
            response.tellWithCard("Down");
        });
    
    },
    Downtwo: function (intent, session, response) {
        sendCommand("/roku/downtwo",null,function() {
            response.tellWithCard("Down Two");
        });
    
    },
    Downthree: function (intent, session, response) {
        sendCommand("/roku/downthree",null,function() {
            response.tellWithCard("Down Three");
        });
    
    },
    Downfour: function (intent, session, response) {
        sendCommand("/roku/downfour",null,function() {
            response.tellWithCard("Down Four");
        });
        
    },
    Downfive: function (intent, session, response) {
        sendCommand("/roku/downfive",null,function() {
            response.tellWithCard("Down Five");
        });
    
    },
    Power: function (intent, session, response) {
        sendCommand("/roku/power",null,function() {
            response.tellWithCard("Power");
        });
    
    },
    Left: function (intent, session, response) {
        sendCommand("/roku/left",null,function() {
            response.tellWithCard("Left");
        });
    
    }, 
    Lefttwo: function (intent, session, response) {
        sendCommand("/roku/lefttwo",null,function() {
            response.tellWithCard("Left Two");
        });
    
    },
    Leftthree: function (intent, session, response) {
        sendCommand("/roku/leftthree",null,function() {
            response.tellWithCard("Left Three");
        });
    
    },
    Leftfour: function (intent, session, response) {
        sendCommand("/roku/leftfour",null,function() {
            response.tellWithCard("Left Four");
        });
    
    },
    Leftfive: function (intent, session, response) {
        sendCommand("/roku/leftfive",null,function() {
            response.tellWithCard("Left Five");
        });
    
    },
    Right: function (intent, session, response) {
        sendCommand("/roku/right",null,function() {
            response.tellWithCard("Right");
        });
    
    },   
    Righttwo: function (intent, session, response) {
        sendCommand("/roku/righttwo",null,function() {
            response.tellWithCard("Right Two");
        });
    
    },
    Rightthree: function (intent, session, response) {
        sendCommand("/roku/rightthree",null,function() {
            response.tellWithCard("Right Three");
        });
    
    },
    Rightfour: function (intent, session, response) {
        sendCommand("/roku/rightfour",null,function() {
            response.tellWithCard("Right Four");
        });
    
    },
    Rightfive: function (intent, session, response) {
        sendCommand("/roku/rightfive",null,function() {
            response.tellWithCard("Right Five");
        });
    
    },
    Type: function (intent, session, response) {
        sendCommand("/roku/type",intent.slots.Text.value,function() {
            response.tellWithCard("Typing text: "+intent.slots.Text.value,"Roku","Typing text: "+intent.slots.Text.value);
        });
    },
    PlayPause: function (intent, session, response) {
        sendCommand("/roku/playpause",null,function() {
            response.tell("Ok");
        });
    },
    Playlastyoutube: function (intent, session, response) {
        sendCommand("/roku/playlastyoutube",null,function() {
            response.tellWithCard("Playing Last Search on YouTube");
        });
    
    },
    Search: function (intent, session, response) {
        sendCommand("/roku/search",intent.slots.Text.value,function() {
            response.tellWithCard("Searching: " + intent.slots.Text.value, "Roku", "Playing: " + intent.slots.Text.value);
        });
    },
    SearchChannel: function (intent, session, response) {
        // join multiple slot values with arbitrary ampersand, which we will split in server code.
        var slots = intent.slots.Text.value + "&" + intent.slots.Channel.value
        sendCommand("/roku/searchChannel",slots,function() {
            response.tellWithCard("Searching: " + intent.slots.Text.value + " on " + intent.slots.Channel.value, "Roku", "Playing: "+intent.slots.Text.value+" on "+ intent.slots.Channel.value);
        });
    },
    HelpIntent: function (intent, session, response) {
        response.tell("No help available at this time.");
    }
};

exports.handler = function (event, context) {
    var roku = new AlexaRoku();
    roku.execute(event, context);
};
