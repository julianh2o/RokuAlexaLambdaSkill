RokuAlexaLambdaSkill
====================

For detailed instructions, check out the blog post on http://reflowster.com/blog/2015/07/21/rokuvoicecontrol.html

1. Start the Roku control server by running "npm install" and "node server.js" in the RokuControlServer folder
2. Make this server accessible to the outside world using port forwarding on your router being sure to include the proper port (default: 1234)
3. Setup the RokuLambda function by navigating to the RokuLamda folder and renaming serverinfo_example.js to serverinfo.js and editing the values to reflect your IP address and the port you used in step 2.
4. Zip the .js files in this folder up and upload them as a new AWS Lambda Function using the <a href="https://console.aws.amazon.com/lambda">AWS Lambda Dashboard</a>
5. Configure Alexa as an event source under the event source tab in the AWS Lambda Function panel.
6. Configure a Alexa Skill using the contents of the RokuSkill folder, the ARN of your above Lambda Function, and the <a href="https://developer.amazon.com/edw/home.html">Alexa Skills Dashboard</a>.
