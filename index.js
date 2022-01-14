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
const Firebase = require('firebase-admin');
const { registerVersion } = require('@firebase/app');
const { async } = require('@firebase/util');
const bodyParser = require('body-parser');
const { time } = require('console');
require('firebase/auth');
require('firebase/app');

//#####################################
//######### USER VARS #################
const userNumber = process.env.USER_NUMBER
const personalNumber = process.env.PERSONAL_NUMBER
//#####################################
//#####################################


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
  app.use(urlencoded({ extended: true }));
  app.use(express.static(__dirname + "/public"));
  app.use(bodyParser.json())
  
  app.get('/ping', (req, res)=>{
    res.send("TWILIO PHONE BURNER IS LISTENING!");
  });
  
  
  async function getData (data, res, req, next) {
      return await database.once('value', (snap) => {
          if (snap.exists()) {
            req.doc = JSON.stringify(snap.val()[0].numbers);
            return req.doc
          } else {
              console.log("No Document")
          }
        })
  }

  async function setData (data, email, res, req) {
    const db = Firebase.database()
    const ref = db.ref("numbers/0")
    await ref.child("numbers").once("value", (snap) => {
      let numsArray = [];
      let index = 0;
      snap.forEach(() => {
        numsArray.push(Object.keys(snap.val()[index])[0])
        index++
      })
      numsArray.map(number => {
        for (var i = 0; i < snap.val().length; i++) {
          if (snap.val()[i][number] != undefined && snap.val()[i][number].email === email) {
            ref.child("numbers/" + i + "/" + number).update({
              whiteList: data.whiteList,
              otherNumbers: data.otherNumbers,
              voicemail: data.voicemail
            }).then(()=> {
              console.log("DATA SAVED")
              res.status(200)
            }).catch(err => {
              console.log("COULD NOT SAVE DATA", err)
              res.status(400).send(err)
            })
          }
        }
      })
    }).catch((err) => {
        console.log(err)
        res.status(400).send(err)
      })
  }

  
  
  app.use(getData, setData);

  app.put("/updateUser/:email", (request, response) => {
    const { email } = request.params
    const newData = request.body
    console.log("REQ.BODY", newData)
    try{
      if (!(Object.keys(newData).length === 0 && newData.constructor === Object)) {
        setData(newData, email, response, request).then(
        ).catch((err) => {
          console.log(err)
          response.send(400)
        })

      } else {
        response.status(400).send("REQUEST BODY IS EMPTY")
      }
    } catch (e) {
      console.log("ERROR ADDING USER TO DB", e);
      response.sendStatus(400);
    }
  })
    
    
  app.get("/getUser/:email", (request, response, next) => {

    const { email } = request.params;
    
    try{
      // needs to be hard coded per user. Twilio number goes here
      let calledNum = userNumber;

      
      getData(calledNum, response, request, next).then(data => {
        let numArray = data.val()[0].numbers
        numArray.map((number) => {
          if (number[calledNum] && number[calledNum].email === email) {
            response.send(number[calledNum])
          } else if (number[calledNum] && number[calledNum].email != email) {
            response.sendStatus(404)
          }
        })
      })
    } catch (e) {
      console.log("ERROR GETTING USER FROM DB", e);
      response.sendStatus(400);
    }
  })
    
  app.post("/incoming", (request, response, next) => {
    try {
      const twiml = new VoiceResponse();

        let calledNum = request.body.To
        let caller = request.body.From
        // console.log(request.body)
      
      getData(calledNum, response, request, next).then(data => {
        let numArray = data.val()[0].numbers
        numArray.map((number) => {
          if (number[calledNum] && !number[calledNum].whiteList.includes(caller)) {
            console.log("NOT IN WHITELIST");
            console.log(number[calledNum])
            if (!number[calledNum].otherNumbers.includes(caller)) {
              number[calledNum].otherNumbers.push(caller);
              setData(number[calledNum], number[calledNum].email, response, request);
            }
            twiml.say("Please say a short message about the nature of this call.");
          
            twiml.record({
              timeout: 15,
              maxLength: 15,
              action: '/wait',
              recordingStatusCallback: '/notify'
            });
      
            // Render the response as XML in reply to the webhook request
            response.type("text/xml");
            response.send(twiml.toString());
          } else if (number[calledNum] && number[calledNum].whiteList.includes(caller)) {
            "IN WHITELIST"
            // Add users personal number below
            twiml.dial(personalNumber)
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
      let call = request.body.CallSid;

      async function getFunc (call) {
        let callInfo = await client.calls(call).fetch();
        return callInfo;
      }

      getFunc(call).then((blob) => {
        client.calls
            .create({
                twiml: "<Response><Play>" + message + "</Play><Gather action='https://twilio-phone-burner-4dgbzfempa-uc.a.run.app/connect' numDigits='1' input='dtmf'><Say>Press 1 to accept this call</Say></Gather></Response>",
                // Add users number below
                to: personalNumber,
                from: blob.to
              }).catch(err => console.log(err))

              response.type('text/xml');
              response.send(res.toString()); 
      }).catch(err => console.log(err))

    } catch (e) {
      console.log("ERROR IN CALL CONTINUATION", e)
    };
  });

  // Adds caller to waitlist
  app.post("/wait", (request, response) => {
    const callStatus = request.body.CallStatus
    try {
      const res = new VoiceResponse();
      // console.log("IN WAIT API", request.body)
      
      res.enqueue({
        waitUrl: '/music'
      }, 'waiting');
      res.say("We're sorry, we cannot get to your call at this time, please leave a full message and we will return your call as soon as possible.");
      res.record({
        action: "/voicemail",
        // recordingStatusCallback: "/voicemail",
        maxLength: 30
      });
      response.type('text/xml');
      response.send(res.toString());
    } catch (e) {
      console.log("ERROR", e);
    }
  });

  app.post("/music", (request, response) => {
    console.log(request.body)
    const waitlistSize = Number(request.body.CurrentQueueSize);
    const res = new VoiceResponse();
    try{
      if (waitlistSize <= 1) {
        res.play(/*'http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-Borghestral.mp3'*/ 'https://api.twilio.com/cowbell.mp3');
        // res.record({
        //   action: "/rejectedCall",
        //   recordingStatusCallback: "/voicemail",
        //   maxLength: 60
        // });
        res.leave();
        response.type('text/xml');
        response.send(res.toString());
      } else {
        res.leave();
        response.type('text/xml');
        response.send(res.toString());
      }
    } catch (e) {
        console.log("ERROR in wait", e);
    }
    })

  app.post("/voicemail", (request, response, next) => {
    let recording = request.body.RecordingUrl;
    let twilioNumber = request.body.To
    let currCaller = request.body.From
    let currTimestamp = Date.now();
    let newVoicemail = {
      timestamp: currTimestamp,
      caller: currCaller,
      url: `${recording}.mp3`
    }
    const sortTimestamp = (dbVoicemailArray) => {
      dbVoicemailArray.sort((x,y) => {
        return Date.parse(x.timestamp) - Date.parse(y.timestamp);
      })

    }

    try {
      getData(twilioNumber, response, request, next).then(data => {
        let numArray = data.val()[0].numbers
        numArray.map((number, index) => {
          if (number[twilioNumber]) {
                number[twilioNumber].voicemail.push(newVoicemail);
                sortTimestamp(number[twilioNumber].voicemail);
                setData(number[twilioNumber], number[twilioNumber].email, response, request);
          }
        })
        response.status(200).send("Voicemail Saved!")
      }).catch(err => console.log(err))
    } catch (e) {
      console.log(e)
      response.status(500).send("Error in sending voicemail URL")
    }
  })

  app.post("/connect", (request, response) => {
    let digit = request.body.Digits;
    try{
      const res = new VoiceResponse();
      const dial = res.dial();
      if (digit === "1") {
        res.say("Please wait while we connect you")
        console.log("THIS IS THE DIGIT", digit);
        dial.queue('waiting')
      } else {
        res.hangup();
      }
      response.type('text/xml');
      response.send(res.toString());
    } catch (e) {
      console.log("ERROR", e);
    }
  })

  let port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Express Server listening on ${port}`);
  });

  module.exports = app;
