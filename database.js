const { response } = require('express');
const Firebase = require('firebase-admin');
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

// gets numbers array from firebase
const getData = (data) => {
    // console.log(data);
    database.once('value', (snap) => {
        if (snap.exists()) {
          let doc = snap.val()[0].numbers;
          response.status(200).send(doc)
          console.log(doc);
        } else {
            console.log("No Document")
        }
    });
}


module.exports = {
  getData
}