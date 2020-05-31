const fs = require("fs");
const path = require("path");

function handleReport (report, mock_database, cdnLocation) {
  let reports = require("../mock_database/reports.json");
  let users = require("../mock_database/users.json");
  let routes = require("../mock_database/routes.json");
  let reportId = `re_${Object.keys(report).length + 1}`;

  let {incidentDescription, culpritDescription, privateInformation, userId} = report;

  let audioFiles = incidentDescription.attachedAudiosData;
  let videoFiles = incidentDescription.attachedVideosData;
  let photos = incidentDescription.attachedPhotosData;

  let audioFilesLocation = [];
  let videoFilesLocation = [];
  let photosLocation = [];

  audioFiles.forEach(data => {
    let fileName = generateCDNFileName("audio", cdnLocation, "wav");
    fs.writeFileSync(path.join(mock_database, "audio", fileName), data);
    audioFilesLocation.push(fileName);
  });

  videoFiles.forEach(data => {
    let fileName = generateCDNFileName("video", cdnLocation, "mp4");
    fs.writeFileSync(path.join(mock_database, "video", fileName), data);
    videoFilesLocation.push(fileName);
  });

  photos.forEach(data => {
    let fileName = generateCDNFileName("photo", cdnLocation, "jpeg");
    fs.writeFileSync(path.join(mock_database, "photo", fileName), data);
    photosLocation.push(fileName);
  });

  let newReport = {
    reportId,
    incidentDescription: {
      media: {
        audio: [...audioFilesLocation],
        photo: [...photosLocation],
        video: [...videoFilesLocation]
      },
      location: incidentDescription.location,
      harassmentFlags: incidentDescription.harassmentFlags,
      date: incidentDescription.date
    },
    culpritDescription,
    followers: [], // users that would like to follow up on the issue
    culpritsIdentified: [], // culprits details are attached once identified by the users (crowdsource)
    userId // creator of the issue
  };

  reports[reportId] = newReport;

  users[userId].sentReports.push(reportId);

  routes[culpritDescription.routeID].reports.push(reportId);

  fs.writeFileSync(path.join(mock_database, "routes.json"), JSON.stringify(routes));
  fs.writeFileSync(path.join(mock_database, "reports.json"), JSON.stringify(reports));
  fs.writeFileSync(path.join(mock_database, "users.json"), JSON.stringify(users));

  let ROUTES = require("../GTFS_FEED/routes/routes.json");

  let title = `Harassment incident on Route ${ROUTES[culpritDescription.routeID]}`
  let shortMessage = `An incident has been reported along the ${ROUTES[culpritDescription.routeID]}.`;
  let message = `An incident has been reported along the ${ROUTES[culpritDescription.routeID]}. This happened on ${culpritDescription.location.type}. You are advised to be careful when using this route`;

  return {title, shortMessage, message};
}

function addUserToFollowUp(userId, reportId) {
  let report = require("../mock_database/reports.json");
  let users = require("../mock_database/users.json");
  // add prevent re-adding cautionary code
  users[userId].activeFollowing.push(reportId);
  report[reportId].followers.push(userId);
  fs.writeFileSync(path.join(mock_database, "reports.json"), JSON.stringify(reports));
  fs.writeFileSync(path.join(mock_database, "users.json"), JSON.stringify(users));
}

function addCulpritToReport(reportId, userId, culpritDetails) {
  let report = require("../mock_database/reports.json");
  let users = require("../mock_database/users.json");

  culpritDetails[culpritId] = `${reportId}_culp_${report[reportId].culpritsIdentified.length}`;
  culpritDetails.culpritIdentifier = userId;

  users[userId].contributions.push({reportId, date: new Date().getTime(), culpritDetails});
  report[reportId].culpritsIdentified.push(culpritDetails);
  fs.writeFileSync(path.join(mock_database, "reports.json"), JSON.stringify(reports));
  fs.writeFileSync(path.join(mock_database, "users.json"), JSON.stringify(users));

  return {
    title: "Culprit identified!",
    short_message: `A culprit going by name: ${culpritDetails.name} has been identified to have been involved in a report you follow`,
    message: `A culprit has been identified to have been involved in a report you follow`,

  };
}

function generateCDNFileName(type, cdnLocation, extension) {
  let filepath = path.join(cdnLocation, type);

  let dir = fs.readdirSync(filepath).length;

  return `${type}_${dir}.${extension}`;
}


module.exports = {
  handleReport,
  addUserToFollowUp
};