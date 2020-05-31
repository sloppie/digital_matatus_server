const express = require('express');

// data models
const ReportModel = require('../../../models/Report');
const Routes = new ReportModel();

const UserModel = require('../../../models/User');
const User = new UserModel();

const route = express.Router();

route.get("/", (request, response) => {

  response.send("Hello world");

});

route.post("/new", (request, response) => {
  // Create the new report collection,
  // pass in a callback that takes in the reultant report_id and the route_id where
  // it happened.

  // make sure it is added to the report payload
  let {userID} = request.body;

  // this payload is passsed back to the client to give it a response about the status
  // of each part of the reporting process.
  const payload = {
    reportAdded: false,
    userReportsAdded: false,
    routeReportAdded: false, // change wording
  };

  const onReportAddSuccess = (doc) => { // callback called on successful addition of report

    const onRouteAddSuccess = () => {
      payload.routeReportAdded = true;

      response.json(payload); // responds with successful add of data
    } // onRouteAddSuccess

    const onRouteAddErr = () => {
      response.json(payload);
    } // onRouteAddErr

    payload.reportAdded = true;
    
    const onUserAddSuccess = () => { // called when the details are added to User.reported
      payload.userReportsAdded = true;

      Routes.addNewReport( // route add new report STUB
        doc.route_id, // route_id to be added to
        doc._id, // is of the report to be pushed to the Route.reports
        onRouteAddSuccess, // success adding info to the route
        onRouteAddErr // error adding info to the route
      );
        
    } // onUserAddSuccess

    const onUserAddErr = () => {

      Routes.addNewReport( // route add new report STUB
        doc.route_id, // route_id to be added to
        doc._id, //
        onRouteAddSuccess, // success adding info to the route
        onRouteAddErr // error adding info to the route
      );

    } // onUserAddErr

    User.addNewReported(
      userID, // userID of the user that added the report
      doc._id, // the reportID after the report was successfully added
      onUserAddSuccess, // on success adding UserModel.reported
      onUserAddErr, // onErr adding route
    );
  }

  const onReportAddErr = () => response.json(payload);

  // start the process
  Report.addNewReport(
    request.body, // userSent Report
    onReportAddSuccess,
    onReportAddErr // on error adding the report
  );

});

module.exports = route;
