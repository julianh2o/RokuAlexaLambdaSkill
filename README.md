RokuAlexaLambdaSkill
====================
## Description

This project provides an Alexa skill to control a local Roku device with voice commands using <a href="https://sdkdocs.roku.com/display/sdkdoc/External+Control+Guide">Roku External Controls</a>.  See the the blog post below for original content/commands

Added commands:  Lauch Plex, Pandora, Hulu, Amazon Video, Home

## Provides

  * nodejs server for controlling the local device
  * AWS Lambda code
  * Alexa Skill code

## Installation/Usage

For detailed instructions, check out the blog post on http://reflowster.com/blog/2015/07/21/rokuvoicecontrol.html

* Modify RokuControlServer/server.js with the port your want to use
* Modify RokuLamba/serverinfo.js with your external IP and the port you want to use
* Modify RokuLambda/index.js with your application ID (From Alexa Skills Dashboard, step 4 below) 

1. Start the Roku control server by running "npm install" and "node server.js" in the RokuControlServer folder
2. Make this server accessible to the outside world using port forwarding on your router being sure to include the proper port (default: 1234)
3. Configure Alexa as an event source under the event source tab in the AWS Lambda Function panel. (AWS Lambda Dashboard) - Skip code upload for now
4. Configure a Alexa Skill using the contents of the RokuSkill folder, the ARN of your above Lambda Function, and the <a href="https://developer.amazon.com/edw/home.html">Alexa Skills Dashboard</a>.
4. Zip the .js files in RokuLamba up and upload them as a new AWS Lambda Function using the <a href="https://console.aws.amazon.com/lambda">AWS Lambda Dashboard</a>

## Contributors
* jaknoll
* kaptainkommie
* djobes
* chris1642
* phlkchan
* heydabop

Please feel encouraged to submit pull requests!

## License

This project is released under the MIT License. See the bundled LICENSE file for
details.
