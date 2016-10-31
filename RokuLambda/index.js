var APP_ID = null; //replace this with your app ID to make use of APP_ID verification

var AlexaSkill = require("./AlexaSkill");
var serverinfo = require("./serverinfo");
var http = require("http");

if (serverinfo.host == "127.0.0.1") {
    throw "Default hostname found, edit your serverinfo.js file to include your server's external IP address";
}

var AlexaRoku = function () {
    AlexaSkill.call(this, APP_ID);
};

AlexaRoku.prototype = Object.create(AlexaSkill.prototype);
AlexaRoku.prototype.constructor = AlexaRoku;

function sendCommand(path,body,callback) {
    var opt = {
        host:serverinfo.host,
		port:serverinfo.port,
        path: path,
        method: 'POST',
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
    Amazon: function (intent, session, response) {
		sendCommand("/roku/amazon",null,function() {
			response.tellWithCard("Launching Amazon");
		});
    },
    Pandora: function (intent, session, response) {
		sendCommand("/roku/pandora",null,function() {
			response.tellWithCard("Launching Pandora");
		});
    },
    Hulu: function (intent, session, response) {
		sendCommand("/roku/hulu",null,function() {
			response.tellWithCard("Launching Hulu");
		});
    },
    Plex: function (intent, session, response) {
		sendCommand("/roku/plex",null,function() {
			response.tellWithCard("Launching Plex");
		});
    },
    PlayLast: function (intent, session, response) {
		sendCommand("/roku/playlast",null,function() {
			response.tellWithCard("Playing the last Netflix show you searched");
		});
    },
	NextEpisode: function (intent, session, response) {
		sendCommand("/roku/nextepisode",null,function() {
			response.tellWithCard("Playing next episode");
		});
    },
	LastEpisode: function (intent, session, response) {
		sendCommand("/roku/lastepisode",null,function() {
			response.tellWithCard("Playing previous episode");
		});
    },
    Type: function (intent, session, response) {
		sendCommand("/roku/type",intent.slots.Text.value,function() {
			response.tellWithCard("Typing text: "+intent.slots.Text.value,"Roku","Typing text: "+intent.slots.Text.value);
		});
    },
	PlayPause: function (intent, session, response) {
		sendCommand("/roku/playpause",null,function() {
			response.tell("Affirmative");
		});
    },
	SearchPlay: function (intent, session, response) {
		sendCommand("/roku/searchplay",intent.slots.Text.value,function() {
			response.tellWithCard("Playing: "+intent.slots.Text.value,"Roku","Playing: "+intent.slots.Text.value);
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
