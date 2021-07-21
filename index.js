"use strict";

const express = require("express");
const { urlencoded } = require("body-parser");
const twilio = require("twilio");
const ClientCapability = twilio.jwt.ClientCapability;
const VoiceResponse = twilio.twiml.VoiceResponse;
const cors = require("cors");
const multer = require("multer");
const upload = multer();
const fs = require("fs");
const accountSid = 'ACcf2c6c3fbeaec5d92a7ef88bf92ce8dc';
const authToken = 'c4825524a36e38d0a825f66cea34af9a';
const client = require("twilio")(accountSid, authToken);
const axios = require("axios");
const { off } = require("process");

const officeIds = {
  "+14705707952": "8976",
  "+14076463947": "11214",
  "+14709997211": "15611"
};

const allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );

  // intercept OPTIONS method
  if ("OPTIONS" == req.method) {
    res.send(200);
  } else {
    next();
  }
};

let app = express();
app.use(cors());
app.use(urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

app.get('/ping', (req, res)=>{
  res.send("TWILIO PHONE BURNER IS LISTENING!");
});

app.post("/incoming", (request, response) => {

  try {
    const twiml = new VoiceResponse();
    
    twiml.say("We live bitches! Please say a short message about the nature of this call.");

    twiml.record({
      timeout: 30,
      transcribe: true,
      transcribeCallback: '/push',
      action: '/continue'
    });

    // Render the response as XML in reply to the webhook request
    response.type("text/xml");
    response.send(twiml.toString());
  } catch (e) {
    console.log("ERROR IN INCOMING CALL", e);
  }
});

app.post("/push", (request, response) => {

  try {
    // TODO: figure out how transcript comes in (assuming it's request)
    const transcription = request.body.TranscriptionStatus == 'failed' ? "No transcript available" : request.body.TranscriptionText;
    console.log(transcription)

    // TODO: send push notification to callee

  } catch(e) {
    console.log("ERROR IN PUSH NOTIFICATION", e);
  }
});

// Create TwiML for outbound calls
app.post("/voice", (request, response) => {
  // voiceResponse = new VoiceResponse();

  // voiceResponse.say("Hello, World!")

  try {
    client.calls
      .create({
         url: 'http://demo.twilio.com/docs/voice.xml',
         to: '+16105688542',
         from: '+18327865719'
       })
      .then(call => console.log(call.sid));
    response.type("text/xml");
    response.sendStatus(200);
  } catch (e) {
    console.log("ERROR", e);
  }
});


app.post("/recording", upload.any(), (request, response) => {
  console.log("REQUEST FILES", request.files);
  fs.writeFile("./recording.webm", request.files.buffer, function (e) {
    if (e) console.log("fs.writeFile error " + e);
  });
  response.send(200);
});

let port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express Server listening on ${port}`);
});

module.exports = app;
