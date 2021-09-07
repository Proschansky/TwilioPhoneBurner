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
const database = Firebase.database().ref('"company"/users')
console.log(database)
const getData = (data) => {
    console.log(data);
    database.on('value', snap => {
        if (snap.exists()) {
            console.log(snap.val())
        } else {
            console.log("No Document")
        }
    });
}


module.exports = {
  getData
}