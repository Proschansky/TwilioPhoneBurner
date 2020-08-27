"use strict";

if (process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
require("dotenv").config();
const http = require("http");
const express = require("express");
const { urlencoded } = require("body-parser");
const twilio = require("twilio");
const ClientCapability = twilio.jwt.ClientCapability;
const VoiceResponse = twilio.twiml.VoiceResponse;
const cors = require("cors");
const multer = require("multer");
const upload = multer();
const fs = require("fs");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

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

// Generate a Twilio Client capability token
app.get("/token", (request, response) => {
  try{
    const capability = new ClientCapability({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    });
  
    capability.addScope(
      new ClientCapability.OutgoingClientScope({
        applicationSid: process.env.TWILIO_TWIML_APP_SID,
      })
    );
  
    capability.addScope(new ClientCapability.IncomingClientScope("sam"));
  
    const token = capability.toJwt();
  
    // Include token in a JSON response
    response.send({
      token: token,
    });
  } catch (e){
    res.send(e)
  }
  
});

app.post("/incoming", (request, response) => {
  try {
    const twiml = new VoiceResponse();
    const dial = twiml.dial();
    dial.client(
      {
        statusCallbackEvent: "initiated ringing answered completed",
        statusCallback: "https://twiliophoneburner.herokuapp.com/callStatus",
        statusCallbackMethod: "POST",
      },
      "sam"
    );
    // Render the response as XML in reply to the webhook request
    response.type("text/xml");
    response.send(twiml.toString());
  } catch (e) {
    console.log("ERROR IN INCOMING CALL", e);
  }
});

// Create TwiML for outbound calls
app.post("/voice", (request, response) => {
  console.log(request.body.message);
  try {
    const voiceResponse = new VoiceResponse();
    voiceResponse.dial(
      {
        action: `https://twiliophoneburner.herokuapp.com/sendMessage/${request.body.number}`,
        method: "POST",
        message: request.body.message,
        callerId: process.env.TWILIO_NUMBER,
        timeout: 5
      },
      request.body.number
    );
    response.type("text/xml");
    response.send(voiceResponse.toString());
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.post("/callStatus", (request, response) => {
  response.end();
});

app.post("/sendMessage/:phoneNumber", (request, response) => {
  console.log("ROUTE HIT", request.params)
  const { phoneNumber } = request.params;
  const { DialCallStatus } = request.body;
  console.log("SEND MESSAGE REQUEST PARAMETERS", request.params);
  console.log("SEND MESSAGE REQUEST BODY", request.body);
  console.log("SEND MESSAGE REQUEST QUERY", request.query);
  // console.log("DIAL STATUS", request.params.DialCallStatus)
  
  if (DialCallStatus === "no-answer"){
    
    client.messages
      .create({
        body: message,
        to: phoneNumber,
        from: process.env.TWILIO_NUMBER,
      })
      .then((message) => console.log("Message", message))
      .catch((err) => console.log("ERROR", err));
    const voiceResponse = new VoiceResponse();
    voiceResponse.say("Sending sms message from twilio");

    setTimeout(() => {
      response.type("text/xml");
      response.send(voiceResponse.toString());  
    }, 5000);
  }

  else {
    const voiceResponse = new VoiceResponse();
    voiceResponse.hangup();
    response.type("text/xml");
    response.send(voiceResponse.toString());
  }
});

app.post("/message", (request, response) => {
  message = request.body.message;
  response.sendStatus(200);
});

app.post("/recording", upload.any(), (request, response) => {
  console.log("REQUEST FILES", request.files);
  fs.writeFile("./recording.webm", request.files.buffer, function (e) {
    if (e) console.log("fs.writeFile error " + e);
  });
  response.send(200);
});

let server = http.createServer(app);
let port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Express Server listening on ${port}`);
});

module.exports = app;
