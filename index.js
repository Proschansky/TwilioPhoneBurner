"use strict";

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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
// const client = require("twilio")(accountSid, authToken);
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

// Generate a Twilio Client capability token
app.get("/token/:officeId/:sid/:token/:sid_token", (request, response) => {
  console.log("ROUTE HIT", request.params);
  const { officeId } = request.params;
  console.log("OFFICE ID", officeId);
  try {
    const capability = new ClientCapability({
      accountSid: request.params.sid,
      authToken: request.params.token,
    });
    console.log("CAPABILITY", capability);
    capability.addScope(
      new ClientCapability.OutgoingClientScope({
        applicationSid: request.params.sid_token
      })
    );
    console.log("CAPABILITY 1", capability);
    capability.addScope(new ClientCapability.IncomingClientScope(officeId));
    console.log("CAPABILITY 2", capability);
    const token = capability.toJwt();
    console.log("TOKEN", token);
    // Include token in a JSON response
    response.send({
      token: token,
    });
  } catch (e) {
    console.log("TOKEN ROUTE ERROR", e);
    response.send(e);
  }
});

app.post("/incoming", async (request, response) => {
  // axios.post('https://recruiter.jobs2me.com/v2/process/phoneburner/incomingRoute.php', request.body);
  const To = request.body.To.slice(1);
  const From = request.body.From.slice(1);

  console.log("To", To, "From", From);

  const callerName = await axios
    .get(
      `https://recruiter.jobs2me.com/v2/process/phoneburner/incomingRouteGet.php?twilioNumber=${To}&callFrom=${From}`
    )
    .then((res) => {
      return res.data.callerName;
    });

  // await axios.get('https://recruiter.jobs2me.com/v2/nav/topnav.php?fyIHpQ5JgI4NtWgOMvwe');

  console.log("CALLER NAME", callerName);

  try {
    const twiml = new VoiceResponse();
    const dial = twiml.dial({
      action: "https://twiliophoneburner.herokuapp.com/voiceMail",
    });

    let client = dial.client(
      {
        statusCallbackEvent: "initiated ringing answered completed",
        statusCallback: "https://twiliophoneburner.herokuapp.com/callStatus",
        statusCallbackMethod: "POST",
      },
      officeIds[request.body.To]
    );

    client.parameter({ callerName: callerName });
    // Render the response as XML in reply to the webhook request
    response.type("text/xml");
    response.send(twiml.toString());
  } catch (e) {
    console.log("ERROR IN INCOMING CALL", e);
  }
});

app.post("/api/handlerFail", (request, response) => {
  console.log("FAILED", request.body)
})

//Handles incoming call voice mail.
app.post("/voiceMail", (request, response) => {
  console.log("VOICEMAIL REQUEST", request.body);
  try {
    axios
      .post(
        "https://recruiter.jobs2me.com/v2/process/twilio/route.php?method=missedCall",
        request.body
      )
      .then((res) => console.log("VOICEMAIL POSTED", res.data));
    if (request.body.DialCallStatus === "no-answer" || "busy") {
      const twiml = new VoiceResponse();
      twiml.say(
        "Please leave a message at the beep. Press the star key when finished."
      );
      twiml.record({
        timeout: 20,
      });
      twiml.hangup();
      response.type("text/xml");
      response.send(twiml.toString());
    }
  } catch(e){
    console.log("ERROR IN VOICEMAIL", e);
  }
});

// Create TwiML for outbound calls
app.post("/voice", (request, response) => {
  console.log("VOICE REQUEST BODY", request.body);
  let message = encodeURIComponent(request.body.message);
  let from = encodeURIComponent(request.body.from);
  let sid = encodeURIComponent(request.body.sid);
  let token = encodeURIComponent(request.body.token);

  try {
    const voiceResponse = new VoiceResponse();
    voiceResponse.dial(
      {
        action: `https://twiliophoneburner.herokuapp.com/sendMessage/${request.body.number}%20?message=${message}&from=${from}&sid=${sid}&token=${token}`,
        method: "POST",
        message: request.body.message,
        callerId: request.body.from,
        timeout: 10,
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
  console.log("REQUEST BODY", request.body);
  response.end();
});

app.post("/sendMessage/:phoneNumber", (request, response) => {
  console.log("ROUTE HIT", request.params);
  const { phoneNumber } = request.params;
  const { DialCallStatus } = request.body;
  console.log("SEND MESSAGE REQUEST QUERY", request.query);
  const message = request.query.message;
  const from = request.query.from;
  const sid = request.query.sid;
  const token = request.query.token;
  // console.log("DIAL STATUS", request.params.DialCallStatus)

  if (DialCallStatus === "no-answer") {
    const client = require("twilio")(sid, token);
    client.messages
      .create({
        body: message,
        to: phoneNumber,
        from: from,
      })
      .then((message) => console.log("Message", message))
      .catch((err) => console.log("ERROR", err));
    const voiceResponse = new VoiceResponse();
    voiceResponse.say("Sending sms message from twilio");

    setTimeout(() => {
      response.type("text/xml");
      response.send(voiceResponse.toString());
    }, 5000);
  } else {
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

let port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express Server listening on ${port}`);
});

module.exports = app;
