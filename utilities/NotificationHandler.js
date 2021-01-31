const admin = require('firebase-admin');

// UserModel
const UserModel = require('../models/User');
const User = new UserModel();

// routes JSON
const routes = require('../GTFS_FEED/routes/routes.json');

const serviceJSON = require('../../firebase-credentials/digitalmatatus-firebase-adminsdk-eag40-3deaecdc5a.json');

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
    (userSentReport.culpritDescription.culpritType == "Driver")
    ? "a matatu driver"
    : (userSentReport.culpritDescription.culpritType == "Conductor")
    ? "a matatu conductor"
    : (userSentReport.culpritDescription.culpritType == "Stage Handler")
    ? "the matatu stage handler"
    : (userSentReport.culpritDescription.culpritType == "Pedestrian")
    ? "a pedestrian"
    : "a third party (pedestrian, motorist etc.)"
  );

  let location = (
    (userSentReport.incidentDescription.location.type == "BUS_TERMINAL")
    ? "on the bus terminal"
    : (userSentReport.incidentDescription.location.type == "ON_BUS_ENTRANCE")
    ? "as the victim entered the bus"
    : "inside the bus"
  );

  const message = {
    notification: {
      title: `Incident on Route ${routes[userSentReport.culpritDescription.routeID].route_short_name}`,
      body: `An incident occured involving ${partyInvolved} which ocurred ${location}`
    },
    data: {reportID},
  };

  console.log(JSON.stringify(message, null, 2));
  return message;
}

/**
 * sends notification to all users tied to a certain route
 * 
 * @param message is the object containing the message to be sent out to the user
 * @param routeID is the routeID the incident happened in to allow notification of each user
 */
const sendNotifications = (message, routeID) => {
  let regExp = "\"" + routeID + "\""; // works because the double quotations make sure the exact string is present
  let messagePools = [{...message, tokens: []}]; // this holds pools that are of max length 100
  let activePool = 0; // this helps keep track of active message pool and prevent the pool being more than 500

  console.log("Looking for users...");
  User.DataModel.find({favouriteRoutes: new RegExp(regExp)}, (err, result) => { // createMessagePools

    if(err)
      console.log("Messages not sent")
    else{
      result.forEach(user => {
        console.log(user.deviceToken);
  
        if(messagePools[activePool].tokens.length < 500) {
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


      console.log(JSON.stringify(messagePools[0], null, 2))
    
      if(messagePools[0].tokens.length == 0) // prevent EmptyTokenError
        return;
    
    
      // after the messagePools are fully populated, we have to send out the messages
      messagePools.forEach(pool => {
        admin.messaging().sendMulticast(pool)
          .then(res => {
            console.log(`${res.successCount} messages were sent succesfully`);
          })
          .catch(err => console.log(err));
      });
    
      console.log("Message pool created")

    }

  });


}

module.exports = {
  sendNotifications,
  generateReportMessage
};
