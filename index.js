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
    
      //twiml.dial('610-568-8542')
      twiml.record({
        timeout: 10,
        maxLength: 10,
        action: '/wait',
        recordingStatusCallback: '/notify'
      });

      // Render the response as XML in reply to the webhook request
      response.type("text/xml");
      response.send(twiml.toString());
  } catch (e) {
    console.log("ERROR IN INCOMING CALL", e);
  }
});


app.post("/notify", (request, response) => {
  
  // TODO: give option to accept or decline, figure out how to use gather inside of client.calls.create
  try {
    const res = new VoiceResponse();
    const message = request.body.RecordingUrl
    console.log(request.body);

    client.calls
    .create({
      //TODO: Need to forward to personal number through twilio number
        twiml: "<Response><Play>" + message + "</Play><Gather action='https://twilio-phone-burner-4dgbzfempa-uc.a.run.app/connect' numDigits='1' input='dtmf'><Say>Press 1 to accept this call</Say></Gather></Response>",
        //twiml: "<Response><Dial>610-568-8542</Dial></Response>", 
        to: '+16105688542',
        from: '+18327865719'
      })
    
   
  } catch (e) {
    console.log("ERROR IN CALL CONTINUATION", e)
  };
});

// Create TwiML for outbound calls
app.post("/wait", (request, response) => {
  console.log(response.body)
  try {
    const res = new VoiceResponse();
    const dial = res.dial();
    console.log(request.body)
    dial.enqueue({
      waitUrl: 'music.xml'
    }, 'waiting')

  } catch (e) {
    console.log("ERROR", e);
  }
});

app.post("/music", (request, response) => {
  try{
    const res = new VoiceResponse();
    res.play('http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-Borghestral.mp3');
  } catch (e) {
      console.log("ERROR in wait", e);
  }
  })


app.post("/connect", (request, response) => {
  console.log(response.body)
  try{
    const res = new VoiceResponse();
    res.say("Please wait while we connect you")
    if (request.body === "1") {
      res.dial(request.body.Caller)
    } else {
      res.say('Sorry, we could not complete your call')
      res.hangup();
    }
    response.send(200)
  } catch (e) {
    console.log("ERROR", e);
  }
})


// app.post("/recording", upload.any(), (request, response) => {
//   console.log("REQUEST FILES", request.files);
//   fs.writeFile("./recording.webm", request.files.buffer, function (e) {
//     if (e) console.log("fs.writeFile error " + e);
//   });
//   res.send(200);
// });

let port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express Server listening on ${port}`);
});

module.exports = app;
