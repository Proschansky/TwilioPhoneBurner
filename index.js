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
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_ACCOUNT_TOKEN;
const client = require("twilio")(accountSid, authToken);
const axios = require("axios");
const { off } = require("process");
const { request, response } = require("express");
// const db = require('./database.js');
const Firebase = require('firebase-admin');
const { registerVersion } = require('@firebase/app');
require('firebase/auth');
require('firebase/app');


const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  databaseURL: process.env.databaseURL,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId
};
Firebase.initializeApp(firebaseConfig);
const database = Firebase.database().ref("numbers/")

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
  app.use(express())
  app.use(cors());
  app.use(urlencoded({ extended: false }));
  app.use(express.static(__dirname + "/public"));
  
  app.get('/ping', (req, res)=>{
    res.send("TWILIO PHONE BURNER IS LISTENING!");
  });
  
  var currentNumber;
  client.incomingPhoneNumbers()
  .fetch()
  .then(incoming => {
    currentNumber = incoming.phone_number;
    console.log(incoming)
  })

  let numArray;
  
  async function getData (data, res, req, next) {
    // console.log(data);
      return await database.once('value', (snap) => {
          if (snap.exists()) {
            req.doc = JSON.stringify(snap.val()[0].numbers);
            return req.doc
          } else {
              console.log("No Document")
          }
        })

    const isInWhiteList = (numbers) => {
      numbers.forEach(element => {
        if (element.whiteList.includes()) {
          return true;
        } else {
          return false;
        }
      });
    }
  }

  
  
  app.use(getData);
  
  
  app.all("/getUser", (request, response, next) => {
    
    try{
      // console.log(request.body);
      let calledNum = "+12223338989"
      

      
      getData(calledNum, response, request, next).then(data => {
        console.log(data.val()[0].numbers)
        numArray = data.val()[0].numbers
        numArray.map((number) => {
          if (number[calledNum] && number[calledNum].whiteList.includes("+18889997575")) {
            console.log(true);
            numArray = true
            return numArray;
          } else {
            return false
          }
        })
      })

      

      response.sendStatus(200)
    } catch (e) {
      console.log("ERROR GETTING USER FROM DB", e);
      response.sendStatus(400);
    }
  })
  
  app.post("/incoming", (request, response, next) => {

    // console.log("from incoming", numArray)    
    try {



      const twiml = new VoiceResponse();

        let calledNum = "+12223338989"
        let caller = "+18889997575"
      

      
      getData(calledNum, response, request, next).then(data => {
        console.log(data.val()[0].numbers)
        numArray = data.val()[0].numbers
        numArray.map((number) => {
          if (number[calledNum] && !number[calledNum].whiteList.includes(caller)) {
            console.log(number[calledNum], number[calledNum].whiteList);
            // numArray = true
            twiml.say("We live bitches! Please say a short message about the nature of this call.");
          
            twiml.record({
              timeout: 10,
              maxLength: 10,
              action: '/wait',
              recordingStatusCallback: '/notify'
            });
      
            // Render the response as XML in reply to the webhook request
            response.type("text/xml");
            response.send(twiml.toString());
            // return numArray;
          } else if (number[calledNum] && number[calledNum].whiteList.includes(caller)) {
            twiml.dial(calledNum)
            response.type("text/xml")
            response.send(twiml.toString())
          }
        })
      }).catch(err => console.log(err))
    
  } catch (e) {
    console.log("ERROR IN INCOMING CALL", e);
  }
});


app.post("/notify", (request, response) => {
  
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
    
      response.type('text/xml');
      response.send(res.toString());
  } catch (e) {
    console.log("ERROR IN CALL CONTINUATION", e)
  };
});

// Create TwiML for outbound calls
app.post("/wait", (request, response) => {
  console.log(response.body)
  try {
    const res = new VoiceResponse();
    console.log(request.body)
    res.enqueue({
      waitUrl: '/music'
    }, 'waiting')
    response.type('text/xml');
    response.send(res.toString());
  } catch (e) {
    console.log("ERROR", e);
  }
});

app.post("/music", (request, response) => {
  try{
    const res = new VoiceResponse();
    res.play('http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-Borghestral.mp3');
    response.type('text/xml');
    response.send(res.toString());
  } catch (e) {
      console.log("ERROR in wait", e);
  }
  })


app.post("/connect", (request, response) => {
  console.log(response.body, request.body)
  try{
    const res = new VoiceResponse();
    const dial = res.dial();
    res.say("Please wait while we connect you")
    if (request.body.Digits === "1") {
      dial.queue({
        url: '/aboutToConnect'
      }, 'waiting')
    } else {
      res.say('Sorry, we could not complete your call')
      res.hangup();
    }
    response.type('text/xml');
    response.send(res.toString());
  } catch (e) {
    console.log("ERROR", e);
  }
})

app.post("/aboutToConnect", (request, response) => {
  try {
    const res = new VoiceResponse();
    res.say("Connecting your call")
  } catch (e) {
    console.log("Error", e);
  }
});

let port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express Server listening on ${port}`);
});

module.exports = app;
