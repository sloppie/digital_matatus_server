const admin = require('firebase-admin');

// UserModel
const models = require('../models');
const User = new models.User();

// routes JSON
const routes = require('../GTFS_FEED/routes/routes.json');

const serviceJSON = require('../../firebase_credentials/digitalmatatus-firebase-adminsdk-eag40-3995d03871.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceJSON),
  databaseURL: "https://digitalmatatus.firebaseio.com",
});

/**
 * 
 * @param {{}} userSentReport this is the report that was sent by the useer and is to be stored
 * in the database, this message sends to all Users, who had subscribed to the respective route
 * that the incident has happened
 * @param {String} reportID ID of the report that is to be quoted
 * 
 * @returns {{
 *  notification: {title: String, body: String},
 *  data: {reportID: String},
 * }} the constructed message that will be sent out to the users
 */
const generateReportMessage = (userSentReport, reportID) => {

  let partyInvolved = (
    (userSentReport.culpritDecription.culpritType == "Driver")
    ? "a matatu driver"
    : (userSentReport.culpritDecription.culpritType == "Conductor")
    ? "a matatu conductor"
    : (userSentReport.culpritDecription.culpritType == "Route Handler")
    ? "the matatu route handler"
    : "a third party (pedestrian motorist etc.)"
  );

  let location = (
    (userSentReport.culpritDecription.location == "BUS_TERMINAL")
    ? "on the bus terminal"
    : (userSentReport.culpritDecription.location == "ON_BUS_ENTRANCE")
    ? "as the victim entered the bus"
    : "inside the bus"
  );

  const message = {
    notification: {
      title: `Incident on Route ${routes[userSentReport.culpritDescription.routeID]}`,
      body: `An incident occured involving ${partyInvolved} which ocurred ${location}`
    },
    data: {reportID},
  };

  return message;
}

/**
 * sends notification to all users tied to a certain route
 * 
 * @param message is the object containing the message to be sent out to the user
 * @param routeID is the routeID the incident happened in to allow notification of each user
 */
const sendNotifications = (message, routeID) => {
  let regExp = `"${routeID}"`; // works because the double quotations make sure the exact string is present
  let messagePools = [{...message, tokens: []}]; // this holds pools that are of max length 100
  let activePool = 0; // this helps keep track of active message pool and prevent the pool being more than 500

  User.DataModel.find({routes: new RegExp(regExp)}, (err, result) => { // createMessagePools

    if(err)
      console.log("Messages not sent")
    
    result.forEach(user => {

      if(messagePools[activePool].tokens.length != 500) {
        messagePools[activePool].tokens.push(user.deviceToken);
      } else {
        activePool++; // increment activePool for future purposes
        // creates a new pool, with the first message being the unique mesage at hand
        messagePools.push({
          ...message,
          tokens: [user.deviceToken]
        }); 
      }

    });

  });

  // after the messagePools are fully populated, we have to send out the messages
  messagePools.forEach(pool => {
    admin.messaging().sendMulticast(pool)
      .then(res => {
        console.log(`${res.successCount} messages were sent succesfully`);
      })
      .catch(err => console.log(err));
  });

}
