const express = require('express');
const bodyParser = require('body-parser');

// data models
const ReportModel = require('../../../models').Report;
const Report = new ReportModel();

const UserModel = require('../../../models').User;
const User = new UserModel();

const RoutesModel = require('../../../models').Routes;
const Routes = new RoutesModel();

const route = express.Router();

// middleware
route.use(bodyParser.json({limit: "50mb"}))

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

      Routes.insertNewReport( // route add new report STUB 
        doc.route_id, // route_id to be added to
        doc._id, // is of the report to be pushed to the Route.reports
        onRouteAddSuccess, // success adding info to the route
        onRouteAddErr // error adding info to the route
      );
        
    } // onUserAddSuccess

    const onUserAddErr = () => {

      Routes.insertNewReport( // route add new report STUB
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

// this is used to query results based on the report categories available described in
// in the query field of the application.
// one of the parameters has to be a valid key (userID or OrgID) for it to present a valid result.
// http://localhost/find/categories=route_id;date;location_type;flags&route_id={string}&date={timestamp}:{timestamp}&location_type={string}&flags=Verbal;Non-verbal;Physical&key={string}
route.get("/find", (request, response) => {
  // fetch all the search query queries and split at the delimiter to get an Array to use to query
  let categories = request.query.categories.split(";");
  let objValues = {};

  categories.forEach(category => {
    objValues[category] = request.query[category];
  });

  const onSuccess = (payload) => {

    if(!response.headersSent)
      response.json(payload);

  }

  const onError = () => {

    if(!response.headersSent)
      response.json(false);

  }

  Report.find(
    categories,
    objValues, // values to search by
    onSuccess, // onSuccess payload
    onError, // onErr callback
  );

});

route.get("/find/:reportid", (request, response) => {
  let _id = request.params.reportid
  console.log(`_id: ${_id}`)
  Report.findById(
    _id, 
    (result) => response.json(result),
    () => response.status(404).json(false)
  );
});

module.exports = route;
