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
const database = Firebase.database().ref()

// const companies = database.collection('cka-course-312717-default-rtdb').doc('company')

const getData = (data) => {
    if (!database.exsits) {
        console.log('No document');
    } else {
        database.where('company', '==' , data).get('users');
        console.log(database.data())
    }
}


module.exports = {
  getData
}