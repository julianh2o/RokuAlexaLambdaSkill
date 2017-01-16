//null will cause the server to discover the Roku on startup, hard coding a value will allow for faster startups
// When manually setting this, include the protocol, port, and trailing slash eg:
// exports.rokuAddress = "http://192.168.1.100:8060/";
exports.rokuAddress = null;
exports.port=1234; //this is the port you are enabling forwarding to. Reminder: you are port forwarding your public IP to the computer playing this script...NOT the roku IP
exports.pass='password' //this is the password used in the AWS lambda files to help stop others from running commands on your roku, should they guess your IP and port
