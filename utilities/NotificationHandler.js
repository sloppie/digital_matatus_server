const admin = require('firebase-admin');
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
