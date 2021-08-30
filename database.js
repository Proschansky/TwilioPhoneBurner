const Firestore = require('@google-cloud/firestore');


const db = new Firestore({
  projectId: 'cka-course-312717',
  keyFilename: './select-caller.json',
});

// example of insert:
const docRef = db.collection('users').doc('alovelace');

await docRef.set({
  first: 'Ada',
  last: 'Lovelace',
  born: 1815
});






module.exports = {
  docRef
}