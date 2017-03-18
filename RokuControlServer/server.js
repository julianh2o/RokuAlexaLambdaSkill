var serverinfo = require("./serverinfo");
var rokuChannel = require("./rokuchannels");
var http = require('http');
var fs = require('fs');
var urllib = require("url");
var Client = require('node-ssdp').Client;
var dgram = require('dgram');
var ssdp = new Client();

var keyDelay = 100; //typing delay in ms. If you have a faster roku, you can probably reduce this, slower ones may have to increase it.

//null will cause the server to discover the Roku on startup, hard coding a value will allow for faster startups
// When manually setting this, include the protocol, port, and trailing slash eg:
// exports.rokuAddress = "http://192.168.1.100:8060/";
var rokuAddress = null;

//handle the ssdp response when the roku is found
ssdp.on('response', function (headers, statusCode, rinfo) {
    if ( headers.ST === 'roku:ecp' ) {
        rokuAddress = headers.LOCATION;
        console.log("Found Roku: ",rokuAddress);
    }
});

//this is called periodically and will only look for the roku if we don't already have an address
function searchForRoku() {
    if (rokuAddress == null) {
        ssdp.search('roku:ecp');
    }
    else {
        clearInterval(rokuSearchInterval)
    }
}

//a simple wrapper to post to a url with no payload (to send roku commands)
function post(url,callback) {
    var info = urllib.parse(url);
    console.log("Posting: ",url);
    var opt = {
        host:info.hostname,
        port:info.port,
        path: info.path,
        method: 'POST',
    };

    var req = http.request(opt, callback);

    req.end();
}

//Performing an operation on the roku normally takes a handful of button presses
//This function will perform the list of commands in order and if a numerical value is included in the sequence it will be inserted as a delay
function postSequence(sequence,callback) {
    function handler() {
        if (sequence.length == 0) {
            if (callback) callback();
            return;
        }
        var next = sequence.shift();
        if (typeof next === "number") {
            setTimeout(handler,next);
        } else if (typeof next === "string") {
            post(next,function(res) {
                res.on("data",function() {}); //required for the request to go through without error
                handler();
            });
        }
    }
    handler();
}

//In order to send keyboard input to the roku, we use the keyress/Lit_* endpoint which can be any alphanumeric character
//This function turns a string into a series of these commands with delays built in
function createTypeSequence(text) {
    var sequence = [];
    for (i=0; i<text.length; i++) {
        var c = text.charCodeAt(i); 
        if (c == 32) {
            sequence.push(rokuAddress+"keypress/Lit_%20");
        } else if (c >= 97 && c <=122) {
            sequence.push(rokuAddress+"keypress/Lit_"+text.charAt(i));
        }
        sequence.push(keyDelay);    
    }
    return sequence;
}
//simple helper function to pull the data out of a post request. This could be avoided by using a more capable library such
function getRequestData(request,callback) {
    var body = "";
    request.on("data",function(data) {
        body += String(data);
    });
    request.on("end",function() {
        callback(body);
    });
}

function generateRepeatedKeyResponse(key,count) {
    var arr = [];
    for (var i=0; i<count; i++) {
        arr.push(rokuAddress+key);
        arr.push(keyDelay);
    }
    return function(request,response) {
        postSequence(arr);
        response.end("OK");
    }
}

//depending on the URL endpoint accessed, we use a different handler.
//This is almost certainly not the optimal way to build a TCP server, but for our simple example, it is more than sufficient
var handlers = {
    "/roku/playlast":function(request,response) {
        postSequence([
            rokuAddress+"keypress/home",    //wake the roku up, if its not already
            rokuAddress+"keypress/home",    //go back to the home screen (even if we're in netflix, we need to reset the interface)
            3000,                           //loading the home screen takes a few seconds
            rokuAddress+"launch/"+ rokuChannel['netflix'],        //launch the netflix channel (presumably this is always id 12..)
            7000,                           //loading netflix also takes some time
            rokuAddress+"keypress/down",    //the last searched item is always one click down and one click to the right of where the cursor starts
            rokuAddress+"keypress/right",
            1000,                           //more delays, experimentally tweaked.. can probably be significantly reduced by more tweaking
            rokuAddress+"keypress/Select",  //select the show from the main menu
            3000,                           //give the show splash screen time to load up
            rokuAddress+"keypress/Play"     //play the current/next episode (whichever one comes up by default)
        ]);
        response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
    },
    "/roku/downtwo":generateRepeatedKeyResponse("keypress/down",2),
    "/roku/downthree":generateRepeatedKeyResponse("keypress/down",3),
    "/roku/downfour":generateRepeatedKeyResponse("keypress/down",4),
    "/roku/downfive":generateRepeatedKeyResponse("keypress/down",5),

    "/roku/uptwo":generateRepeatedKeyResponse("keypress/up",2),
    "/roku/upthree":generateRepeatedKeyResponse("keypress/up",3),
    "/roku/upfour":generateRepeatedKeyResponse("keypress/up",4),
    "/roku/upfive":generateRepeatedKeyResponse("keypress/up",5),

    "/roku/righttwo":generateRepeatedKeyResponse("keypress/right",2),
    "/roku/rightthree":generateRepeatedKeyResponse("keypress/right",3),
    "/roku/rightfour":generateRepeatedKeyResponse("keypress/right",4),
    "/roku/rightfive":generateRepeatedKeyResponse("keypress/right",5),

    "/roku/lefttwo":generateRepeatedKeyResponse("keypress/left",2),
    "/roku/leftthree":generateRepeatedKeyResponse("keypress/left",3),
    "/roku/leftfour":generateRepeatedKeyResponse("keypress/left",4),
    "/roku/leftfive":generateRepeatedKeyResponse("keypress/left",5),
    "/roku/captionson":function(request,response) {
        postSequence([
            rokuAddress+"keypress/info",    //this function only works with a Roku TV, as a regular roku's caption's sequence is based on the individual app.
            keyDelay,
            rokuAddress+"keypress/down",    
            keyDelay,
            rokuAddress+"keypress/down",   
            keyDelay,
            rokuAddress+"keypress/down",    
            keyDelay,
            rokuAddress+"keypress/down",    
            keyDelay,                           
            rokuAddress+"keypress/down",    
            keyDelay,                           
            rokuAddress+"keypress/right",    
            keyDelay,
            rokuAddress+"keypress/info",    //presses info a second time to exit menu
            keyDelay,                           
        ]);
        response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
    },
    "/roku/captionsoff":function(request,response) {
        postSequence([
            rokuAddress+"keypress/info",    //this function only works with a Roku TV, as a regular roku's caption's sequence is based on the individual app.
            keyDelay,
            rokuAddress+"keypress/down",    
            keyDelay,
            rokuAddress+"keypress/down",   
            keyDelay,
            rokuAddress+"keypress/down",    
            keyDelay,
            rokuAddress+"keypress/down",    
            keyDelay,                          
            rokuAddress+"keypress/down",    
            keyDelay,                           
            rokuAddress+"keypress/left",    
            keyDelay,          
            rokuAddress+"keypress/info",    //presses info a second time to exit menu
            keyDelay,                 
        ]);
        response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
    },
    //This endpoint doenst perform any operations, but it allows an easy way for you to dictate typed text without having to use the on screen keyboard
    "/roku/type":function(request,response) {
        getRequestData(request,function(data) {
            var text = data.replace().toLowerCase(); 
            var sequence = createTypeSequence(text);
            postSequence(sequence,function() {

            });
            response.end("OK");    
        });
    },
    //Takes the POST data and uses it to search for a show and then immediate plays that show
    "/roku/searchroku":function(request,response) {
        getRequestData(request,function(data) {
            var text = data.replace().toLowerCase();      //Master search....if a movie, will auto go to channel (first choice is always the free channel you have installed - if no free channel, will take you but not hit play.
            var sequence = [].concat([            //If a TV show....will stop before selecting a channel (first choice is based on how many episodes avaialble, NOT based on cost - meaning manually choose - will also allow you to choose the specific season and episode manually using voice or remote)
                rokuAddress+"keypress/home",    //wake roku
                rokuAddress+"keypress/home",    //reset to home screen
                2000,
                rokuAddress+"keypress/down",
                keyDelay,
                rokuAddress+"keypress/down",
                keyDelay,
                rokuAddress+"keypress/down",
                keyDelay,
                rokuAddress+"keypress/down",
                keyDelay,
                rokuAddress+"keypress/down",
                keyDelay,
                rokuAddress+"keypress/select",
                500,
                ],createTypeSequence(text),[
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                500,
                rokuAddress+"keypress/select",
                1000,
                rokuAddress+"keypress/select",
                4000,
                ]);
            postSequence(sequence);
            response.end("OK");     //respond with OK before the operation finishes
        });
    },
    "/roku/searchplex":function(request,response) {
        getRequestData(request,function(data) {
            var text = data.replace().toLowerCase();      //Master search....if a movie, will auto go to channel (first choice is always the free channel you have installed - if no free channel, will take you but not hit play.
            var sequence = [].concat([            //If a TV show....will stop before selecting a channel (first choice is based on how many episodes avaialble, NOT based on cost - meaning manually choose - will also allow you to choose the specific season and episode manually using voice or remote)
                rokuAddress+"keypress/home",    //wake roku
                rokuAddress+"keypress/home",    //reset to home screen
                2000,            
                rokuAddress+"launch/"+rokuChannel['plex'],    //open plex
                5000,
                rokuAddress+"keypress/up",
                keyDelay,
                rokuAddress+"keypress/select",
                keyDelay,
                ],createTypeSequence(text),[
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                keyDelay,
                rokuAddress+"keypress/right",
                1500,
                rokuAddress+"keypress/right",
                1000,
                rokuAddress+"keypress/select",
                500,
                rokuAddress+"keypress/select",
                500,
                ]);
            postSequence(sequence);
            response.end("OK");     //respond with OK before the operation finishes
        });
    },
    "/roku/playlastyoutube":function(request,response) {    //not working yet - youtube search does not allow keyboard input. Next best thing is to play most recent.
        getRequestData(request,function(data) {
            var sequence = [].concat([
                rokuAddress+"keypress/home",    //wake roku
                keyDelay,
                rokuAddress+"launch/"+ rokuChannel['youtube'],        //launch youtube app
                6000,
                rokuAddress+"keypress/up",    //navigate to search
                200,
                rokuAddress+"keypress/up",  //Navigate to search
                200,
                rokuAddress+"keypress/select",  //select search
                200,
                rokuAddress+"keypress/up",   //go to search selections (which show up to the right of they keyboard.. we need to tap through them)
                200,
                rokuAddress+"keypress/select",
                2500,
                rokuAddress+"keypress/select", //selected the top result and returns to the main screen
                2500,                          //wait for main menu
            ]);
            postSequence(sequence);
            response.end("OK");     //respond with OK before the operation finishes
        });
    },
    "/roku/playpause":function(request,response) {        //the play and pause buttons are the same and is called "Play"
        post(rokuAddress+"keypress/Play");
        response.end("OK");    
    },
    "/roku/power":function(request,response) {        //Only for roku TV - can only turn TV OFF....not On, as once it is turned off, it will disable the network,
        post(rokuAddress+"keypress/Power");
        response.end("OK");    
    },
    "/roku/rewind":function(request,response) {        //rewind
        post(rokuAddress+"keypress/rev");
        response.end("OK");    
    },
    "/roku/fastforward":function(request,response) {    //fast forward
        post(rokuAddress+"keypress/fwd");
        response.end("OK");    
    },
    "/roku/up":function(request,response) {            //up
        post(rokuAddress+"keypress/up");
        response.end("OK");    
    },
    "/roku/down":function(request,response) {        //down
        post(rokuAddress+"keypress/down");
        response.end("OK");    
    },
    "/roku/back":function(request,response) {        //back
        post(rokuAddress+"keypress/back");
        response.end("OK");    
    },
    "/roku/left":function(request,response) {        //left
        post(rokuAddress+"keypress/left");
        response.end("OK");    
    },
    "/roku/instantreplay":function(request,response) {    //instant replay, go back 10 secounds
        post(rokuAddress+"keypress/instantreplay");
        response.end("OK");    
    },
    "/roku/right":function(request,response) {        //right
        post(rokuAddress+"keypress/right");
        response.end("OK");    
    },
    "/roku/select":function(request,response) {        //select - this is often more useful than play/pause - same as OK on the remote
        post(rokuAddress+"keypress/select");
        response.end("OK");    
    },
    "/roku/nextepisode":function(request,response) {    //NOT being utilized right now, needs tweaking
        postSequence([
            rokuAddress+"keypress/back",
            1000,
            rokuAddress+"keypress/down",
            keyDelay,
            rokuAddress+"keypress/down",
            keyDelay,
            rokuAddress+"keypress/select",
            2000,
            rokuAddress+"keypress/right",
            keyDelay,
            rokuAddress+"keypress/select",
            1000,
            rokuAddress+"keypress/Play",
        ],function() {

        });
        response.end("OK");
    },
    "/roku/lastepisode":function(request,response) {    //NOT being utilized right now, needs tweaking
        postSequence([
            rokuAddress+"keypress/back",
            1000,
            rokuAddress+"keypress/down",
            keyDelay,
            rokuAddress+"keypress/down",
            keyDelay,
            rokuAddress+"keypress/select",
            2000,
            rokuAddress+"keypress/left",
            keyDelay,
            rokuAddress+"keypress/select",
            1000,
            rokuAddress+"keypress/Play",
        ],function() {

        });
        response.end("OK");
    },
    "/roku/launch":function(request,response) {  //function to open a roku channel from the channel list
        getRequestData(request,function(data) {
            var channelRequest = data.replace().toLowerCase();
            console.log("Loading Channel: " + channelRequest);
            if (rokuChannel[channelRequest]) {
                postSequence([rokuAddress + "launch/" + rokuChannel[channelRequest]], function () {
                });
                response.end("OK");
            } else {
                console.log('Channel not found.');
                response.end("Channel not found.");
            }
        });
        response.end("OK");     //respond with OK before the operation finishes
    }
}

//handles and incoming request by calling the appropriate handler based on the URL
function handleRequest(request, response){
    if (request.headers.authorization !== serverinfo.pass) {
        console.log("Invalid authorization header");
        response.end();
        return;
    }
    if (handlers[request.url]) {
        handlers[request.url](request,response);
    } else {
        console.log("Unknown request URL: ",request.url);
        response.end();
    }
}

// Sends the Home button
function home(address){
     return address+"keypress/home";
}

//start the MSEARCH background task to try every second (run it immediately too)
var rokuSearchInterval = setInterval(searchForRoku,1000);
searchForRoku();

//start the tcp server
http.createServer(handleRequest).listen(serverinfo.port,function(){
    console.log("Server listening on port %s", serverinfo.port);
});
