var http = require('http');
var fs = require('fs');
var urllib = require("url");
var Client = require('node-ssdp').Client;
var dgram = require('dgram'); 

//null will cause the server to discover the Roku on startup, hard coding a value will allow for faster startups
// When manually setting this, include the protocol, port, and trailing slash eg:
// var rokuAddress = "http://192.168.1.100:8060/";
var rokuAddress = null; 
var PORT=1234; //this is the port you are enabling forwarding to. Reminder: you are port forwarding your public IP to the computer playing this script...NOT the roku IP

var ssdp = new Client();

//handle the ssdp response when the roku is found
ssdp.on('response', function (headers, statusCode, rinfo) {
	rokuAddress = headers.LOCATION;
	console.log("Found Roku: ",rokuAddress);
});

//this is called periodically and will only look for the roku if we don't already have an address
function searchForRoku() {
	if (rokuAddress == null) {
		ssdp.search('roku:ecp');
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
//This function turns a string into a series of these commands with delays of 100ms built in
//NOTE: this currently ignores anything that isn't lowercase alpha
function createTypeSequence(text) {
	var sequence = [];
	for (i=0; i<text.length; i++) {
		var c = text.charCodeAt(i); 
		if (c == 32)
			sequence.push(rokuAddress+"keypress/Lit_%20");
		else
			sequence.push(rokuAddress+"keypress/Lit_"+text.charAt(i));
		sequence.push(100);	
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

//depending on the URL endpoint accessed, we use a different handler.
//This is almost certainly not the optimal way to build a TCP server, but for our simple example, it is more than sufficient
var handlers = {
    //This will play the last searched movie or show, we use it because it consistently resides to the right of the search box
	"/roku/playlast":function(request,response) { //NOT WORKING RIGHT NOW - NETFLIX CHANGED, NEEDS MODIFICATION TO APPLY TO ALL APPS
		postSequence([
			rokuAddress+"keypress/home",    //wake the roku up, if its not already
			rokuAddress+"keypress/home",    //go back to the home screen (even if we're in netflix, we need to reset the interface)
			3000,                           //loading the home screen takes a few seconds
			rokuAddress+"launch/12",        //launch the netflix channel (presumably this is always id 12..)
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
	"/roku/downtwo":function(request,response) {
		postSequence([
			rokuAddress+"keypress/down",    //Down twice
			100,
			rokuAddress+"keypress/down",    
			100,                           
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/downthree":function(request,response) {
		postSequence([
			rokuAddress+"keypress/down",    //Down three times
			100,
			rokuAddress+"keypress/down",    
			100, 
			rokuAddress+"keypress/down",    
			100,			                        
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/downfour":function(request,response) {
		postSequence([
			rokuAddress+"keypress/down",    //Down four times
			100,
			rokuAddress+"keypress/down",   
			100,                           
			rokuAddress+"keypress/down",   
			100,
			rokuAddress+"keypress/down",    
			100,
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/downfive":function(request,response) {
		postSequence([
			rokuAddress+"keypress/down",    //Down five times
			100,
			rokuAddress+"keypress/down",    
			100,                          
			rokuAddress+"keypress/down",    
			100,
			rokuAddress+"keypress/down",    
			100,
			rokuAddress+"keypress/down",    //go back to the home screen (even if we're in netflix, we need to reset the interface)
			100,
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/uptwo":function(request,response) {
		postSequence([
			rokuAddress+"keypress/up",    //up twice
			100,
			rokuAddress+"keypress/up",    
			100,                         
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/upthree":function(request,response) {
		postSequence([
			rokuAddress+"keypress/up",    //up three times
			150,
			rokuAddress+"keypress/up",   
			150,      
			rokuAddress+"keypress/up",    
			150,                 
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/upfour":function(request,response) {
		postSequence([
			rokuAddress+"keypress/up",    //up four times
			150,
			rokuAddress+"keypress/up",   
			150,    
			rokuAddress+"keypress/up",   
			150,
			rokuAddress+"keypress/up",    
			150,                       //loading the home screen takes a few seconds
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/upfive":function(request,response) {
		postSequence([
			rokuAddress+"keypress/up",    //up five times
			150,
			rokuAddress+"keypress/up",    
			150,                  
			rokuAddress+"keypress/up",    
			150,
			rokuAddress+"keypress/up",   
			150,
			rokuAddress+"keypress/up",   
			150,        
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/righttwo":function(request,response) {
		postSequence([
			rokuAddress+"keypress/right",    //right two times
			150,
			rokuAddress+"keypress/right",    
			150,                          
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/rightthree":function(request,response) {
		postSequence([
			rokuAddress+"keypress/right",    //right three times
			150,
			rokuAddress+"keypress/right",    
			150,      
			rokuAddress+"keypress/right",  
			150,                    
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/rightfour":function(request,response) {
		postSequence([
			rokuAddress+"keypress/right",    //right four times
			150,
			rokuAddress+"keypress/right",    
			150,   
			rokuAddress+"keypress/right",   
			150,
			rokuAddress+"keypress/right",    
			150,                       
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/rightfive":function(request,response) {
		postSequence([
			rokuAddress+"keypress/right",    //right five times
			150,
			rokuAddress+"keypress/right",    
			150,
			rokuAddress+"keypress/right",    
			150,
			rokuAddress+"keypress/right",    
			150,
			rokuAddress+"keypress/right",   
			150,                 
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/lefttwo":function(request,response) {
		postSequence([
			rokuAddress+"keypress/left",    //left twice
			150,
			rokuAddress+"keypress/left",   
			150,                           
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/leftthree":function(request,response) {
		postSequence([
			rokuAddress+"keypress/left",    //left three times
			150,
			rokuAddress+"keypress/left",    
			150,
			rokuAddress+"keypress/left",   
			150,                           
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/leftfour":function(request,response) {
		postSequence([
			rokuAddress+"keypress/left",    //left four times
			150,
			rokuAddress+"keypress/left",    
			150,
			rokuAddress+"keypress/left",    
			150,
			rokuAddress+"keypress/left",   
			150,                          
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/leftfive":function(request,response) {
		postSequence([
			rokuAddress+"keypress/left",    //left five times
			150,
			rokuAddress+"keypress/left",    
			150,
			rokuAddress+"keypress/left",    
			150,
			rokuAddress+"keypress/left",    
			150,
			rokuAddress+"keypress/left",    
			150,                           
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/captionson":function(request,response) {
		postSequence([
			rokuAddress+"keypress/info",    //this function only works with a Roku TV, as a regular roku's caption's sequence is based on the individual app.
			150,
			rokuAddress+"keypress/down",    
			150,
			rokuAddress+"keypress/down",   
			150,
			rokuAddress+"keypress/down",    
			150,
			rokuAddress+"keypress/down",    
			150,                           
			rokuAddress+"keypress/down",    
			150,                           
			rokuAddress+"keypress/right",    
			150,
			rokuAddress+"keypress/info",    //presses info a second time to exit menu
			150,                           
		]);
		response.end("OK"); //we provide an OK response before the operation finishes so that our AWS Lambda service doesn't wait around through our delays
	},
	"/roku/captionsoff":function(request,response) {
		postSequence([
			rokuAddress+"keypress/info",    //this function only works with a Roku TV, as a regular roku's caption's sequence is based on the individual app.
			150,
			rokuAddress+"keypress/down",    
			150,
			rokuAddress+"keypress/down",   
			150,
			rokuAddress+"keypress/down",    
			150,
			rokuAddress+"keypress/down",    
			150,                          
			rokuAddress+"keypress/down",    
			150,                           
			rokuAddress+"keypress/left",    
			150,          
			rokuAddress+"keypress/info",    //presses info a second time to exit menu
			150,                 
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
	"/roku/search":function(request,response) {
		getRequestData(request,function(data) {
			var text = data.replace().toLowerCase();
			var sequence = [].concat([			
				createTypeSequence(text),
				]);
			postSequence(sequence);
			response.end("OK");	 //respond with OK before the operation finishes
		});
	},
    //Takes the POST data and uses it to search for a show and then immediate plays that show
	"/roku/searchroku":function(request,response) {
		getRequestData(request,function(data) {
			var text = data.replace().toLowerCase();      //Master search....if a movie, will auto go to channel (first choice is always the free channel you have installed - if no free channel, will take you but not hit play.
			var sequence = [].concat([			//If a TV show....will stop before selecting a channel (first choice is based on how many episodes avaialble, NOT based on cost - meaning manually choose - will also allow you to choose the specific season and episode manually using voice or remote)
				rokuAddress+"keypress/home",    //wake roku
				rokuAddress+"keypress/home",    //reset to home screen
				2200,
				rokuAddress+"keypress/down",
				150,
				rokuAddress+"keypress/down",
				150,
				rokuAddress+"keypress/down",
				150,
				rokuAddress+"keypress/down",
				150,
				rokuAddress+"keypress/down",
				150,
				rokuAddress+"keypress/select",
				800,
				],createTypeSequence(text),[
				rokuAddress+"keypress/right",
				150,
				rokuAddress+"keypress/right",
				150,
				rokuAddress+"keypress/right",
				150,
				rokuAddress+"keypress/right",
				150,
				rokuAddress+"keypress/right",
				150,
				rokuAddress+"keypress/right",
				500,
				rokuAddress+"keypress/select",
				1700,
				rokuAddress+"keypress/select",
				4000,
				]);
			postSequence(sequence);
			response.end("OK");	 //respond with OK before the operation finishes
		});
	},
	"/roku/searchplex":function(request,response) {
		getRequestData(request,function(data) {
			var text = data.replace().toLowerCase();      //Master search....if a movie, will auto go to channel (first choice is always the free channel you have installed - if no free channel, will take you but not hit play.
			var sequence = [].concat([			//If a TV show....will stop before selecting a channel (first choice is based on how many episodes avaialble, NOT based on cost - meaning manually choose - will also allow you to choose the specific season and episode manually using voice or remote)
				rokuAddress+"keypress/home",    //wake roku
				rokuAddress+"keypress/home",    //reset to home screen
				2000,			
				rokuAddress+"launch/13535",    //open plex
				7250,
				rokuAddress+"keypress/up",
				250,
				rokuAddress+"keypress/select",
				250,
				],createTypeSequence(text),[
				rokuAddress+"keypress/right",
				250,
				rokuAddress+"keypress/right",
				250,
				rokuAddress+"keypress/right",
				250,
				rokuAddress+"keypress/right",
				250,
				rokuAddress+"keypress/right",
				1500,
				rokuAddress+"keypress/right",
				1200,
				rokuAddress+"keypress/select",
				750,
				rokuAddress+"keypress/select",
				750,
				]);
			postSequence(sequence);
			response.end("OK");	 //respond with OK before the operation finishes
		});
	},
	"/roku/playlastyoutube":function(request,response) {    //not working yet - youtube search does not allow keyboard input. Next best thing is to play most recent.
		getRequestData(request,function(data) {
			var sequence = [].concat([
				rokuAddress+"keypress/home",    //wake roku
				500,
				rokuAddress+"launch/837",        //launch youtube app
				20000,
				rokuAddress+"keypress/up",    //navigate to search
				400,
				rokuAddress+"keypress/up",  //Navigate to search
				400,
				rokuAddress+"keypress/select",  //select search
				800,
				rokuAddress+"keypress/up",   //go to search selections (which show up to the right of they keyboard.. we need to tap through them)
				800,
				rokuAddress+"keypress/select",
				3200,
				rokuAddress+"keypress/select", 
				3200,                          //wait for main menu
				rokuAddress+"keypress/select", 
				3000,
			]);
			postSequence(sequence);
			response.end("OK");	 //respond with OK before the operation finishes
		});
	},
	"/roku/playpause":function(request,response) {		//the play and pause buttons are the same and is called "Play"
		post(rokuAddress+"keypress/Play");
		response.end("OK");	
	},
	"/roku/power":function(request,response) {		//Only for roku TV - can only turn TV OFF....not On, as once it is turned off, it will disable the network,
		post(rokuAddress+"keypress/Power");
		response.end("OK");	
	},
	"/roku/rewind":function(request,response) {		//rewind
		post(rokuAddress+"keypress/rev");
		response.end("OK");	
	},
	"/roku/fastforward":function(request,response) {	//fast forward
		post(rokuAddress+"keypress/fwd");
		response.end("OK");	
	},
	"/roku/up":function(request,response) {			//up
		post(rokuAddress+"keypress/up");
		response.end("OK");	
	},
	"/roku/down":function(request,response) {		//down
		post(rokuAddress+"keypress/down");
		response.end("OK");	
	},
	"/roku/back":function(request,response) {		//back
		post(rokuAddress+"keypress/back");
		response.end("OK");	
	},
	"/roku/left":function(request,response) {		//left
		post(rokuAddress+"keypress/left");
		response.end("OK");	
	},
	"/roku/instantreplay":function(request,response) {	//instant replay, go back 10 secounds
		post(rokuAddress+"keypress/instantreplay");
		response.end("OK");	
	},
	"/roku/right":function(request,response) {		//right
		post(rokuAddress+"keypress/right");
		response.end("OK");	
	},
	"/roku/select":function(request,response) {		//select - this is often more useful than play/pause - same as OK on the remote
		post(rokuAddress+"keypress/select");
		response.end("OK");	
	},
	"/roku/nextepisode":function(request,response) {	//NOT being utilized right now, needs tweaking
		postSequence([
			rokuAddress+"keypress/back",
			1000,
			rokuAddress+"keypress/down",
			100,
			rokuAddress+"keypress/down",
			100,
			rokuAddress+"keypress/select",
			2000,
			rokuAddress+"keypress/right",
			100,
			rokuAddress+"keypress/select",
			1000,
			rokuAddress+"keypress/Play",
		],function() {

		});
		response.end("OK");
	},
	"/roku/lastepisode":function(request,response) {	//NOT being utilized right now, needs tweaking
		postSequence([
			rokuAddress+"keypress/back",
			1000,
			rokuAddress+"keypress/down",
			100,
			rokuAddress+"keypress/down",
			100,
			rokuAddress+"keypress/select",
			2000,
			rokuAddress+"keypress/left",
			100,
			rokuAddress+"keypress/select",
			1000,
			rokuAddress+"keypress/Play",
		],function() {

		});
		response.end("OK");
	},
        "/roku/amazon":function(request,response) {			//function to open Amazon, ID below
        	postSequence([
			amazon(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
        "/roku/plex":function(request,response) {			//function to open Plex, ID below
        	postSequence([
			plex(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
        "/roku/pandora":function(request,response) {			//function to open Pandora, ID below
        	postSequence([
			pandora(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
        "/roku/hulu":function(request,response) {			//function to oen Hulu, ID below
        	postSequence([
			hulu(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
        "/roku/home":function(request,response) {			//function for Home button, ID below
        	postSequence([
			home(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
		"/roku/tv":function(request,response) {			//function for TV input - ROKU TV ONLY
        	postSequence([
			tv(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
		"/roku/fourk":function(request,response) {		//Function for 4K Spotlight Channel - possibly 4k Roku version only
        	postSequence([
			fourk(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
		"/roku/hbo":function(request,response) {		//function for HBOGO, ID below
        	postSequence([
			hbo(rokuAddress),
		],function(){

		});
		response.end("OK");
        },		
        "/roku/youtube":function(request,response) {			//function for YouTube, ID below
        	postSequence([
			youtube(rokuAddress),
		],function(){

		});
		response.end("OK");
        },		
        "/roku/netflix":function(request,response) {			//function for Netflix, ID below
        	postSequence([
			netflix(rokuAddress),
		],function(){

		});
		response.end("OK");
        },
		"/roku/fx":function(request,response) {			//function for FX Channel, ID below
        	postSequence([
			fx(rokuAddress),
		],function(){

		});
		response.end("OK");
        }
}

//handles and incoming request by calling the appropriate handler based on the URL
function handleRequest(request, response){
	if (handlers[request.url]) {
		handlers[request.url](request,response);
	} else {
		console.log("Unknown request URL: ",request.url);
		response.end();
	}
}


// Launches the Amazon Video channel (id 13)
function amazon(address){
 return address+"launch/13";
}
// Launches the Pandora channel (id 28)
function pandora(address){
 return address+"launch/28";
}

// Launches the Hulu channel (id 2285)
function hulu(address){
 return address+"launch/2285";
}

// Launches the Plex channel (id 13535)
function plex(address){
 return address+"launch/13535";
}

// Sends the Home button
function home(address){
  return address+"keypress/home";
}

// Launches the TV channel (id tvinput.dtv)
function tv(address){
 return address+"launch/tvinput.dtv";
}

// Launches the fourK channel (id 69091)
function fourk(address){
 return address+"launch/69091";
}

// Launches the HBO channel (id 8378)
function hbo(address){
 return address+"launch/8378";
}

// Launches the FX channel (id 47389)
function fx(address){
 return address+"launch/47389";
}

// Launches the YouTube channel (id 837)
function youtube(address){
 return address+"launch/837";
}

// Launches the Netflix channel (id 12)
function netflix(address){
 return address+"launch/12";
}


//start the MSEARCH background task to try every second (run it immediately too)
setInterval(searchForRoku,1000);
searchForRoku();

//start the tcp server
http.createServer(handleRequest).listen(PORT,function(){
    console.log("Server listening on: http://localhost:%s", PORT);
});