"use strict";


require('dotenv').config();
const express = require("express");
const { urlencoded } = require("body-parser");
const twilio = require("twilio");
const ClientCapability = twilio.jwt.ClientCapability;
const VoiceResponse = twilio.twiml.VoiceResponse;
const cors = require("cors");
const multer = require("multer");
const upload = multer();
const fs = require("fs");
// TODO: need to set gcloud env variables instead of using .env file. add ENV KEY1=sid, etc. to dockerfile
const accountSid = '';
const authToken = ''
const client = require("twilio")(accountSid, authToken);
const axios = require("axios");
const { off } = require("process");
const { request } = require("express");

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
      timeout: 10,
      maxLength: 10,
      action: '/continue'
    });

    // Render the response as XML in reply to the webhook request
    response.type("text/xml");
    response.send(twiml.toString());
  } catch (e) {
    console.log("ERROR IN INCOMING CALL", e);
  }
});


app.post("/continue", (request, response) => {
  
  // TODO: give option to accept or decline, figure out how to use gather inside of client.calls.create
  const message = request.body.RecordingUrl
  try {
    // by default play the recording
    const response = new VoiceResponse();
    client.calls
    .create({
       twiml: "<Response><Play>" + message + "</Play><Gather input='dtmf' action='https://twilio-phone-burner-4dgbzfempa-uc.a.run.app/voice'><Say>Press 1 to accept this call</Say></Gather></Response>",
       to: '+16105688542',
       from: '+18327865719'
     })
    //response.play(message);
    // TODO: handle call accept/reject statement
    // If call is accepted, connect call
    const gather = response.gather({
      input: 'dtmf',
      action: '/voice'
    })

    gather.say('Would you like to accept this call?')
  } catch (e) {
    console.log("ERROR IN CALL CONTINUATION", e)
  };
});

// Create TwiML for outbound calls
app.post("/voice", (request, response) => {
  response = new VoiceResponse();

  try {
    if (request.body === '1') {
      client.calls
        .create({
           //url: 'http://demo.twilio.com/docs/voice.xml',
           to: '+16105688542',
           from: '+18327865719'
         })
        .then(call => console.log(call.sid));
      response.type("text/xml");
      response.sendStatus(200);
    } else {
      response.hangup();
    }
  } catch (e) {
    console.log("ERROR", e);
  }
});


// app.post("/recording", upload.any(), (request, response) => {
//   console.log("REQUEST FILES", request.files);
//   fs.writeFile("./recording.webm", request.files.buffer, function (e) {
//     if (e) console.log("fs.writeFile error " + e);
//   });
//   response.send(200);
// });

let port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express Server listening on ${port}`);
});

module.exports = app;
