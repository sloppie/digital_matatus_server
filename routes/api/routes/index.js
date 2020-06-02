const express = require('express');
const bodyParser = require('body-parser');

// models
const models = require('../../../models');
const RouteModel = models.Routes; // used to access the static methods of the class
const Routes = new RouteModel(); // Routes class instance
const ReportModel = models.Report;
const Report = new ReportModel();
const UserModel = models.User;
const User = new UserModel();

const route = express.Router();

// middleware
route.use(bodyParser.json({limit: "50mb"}));

route.get("/", (request, response) => {
  try {
    let routes = require('../../../GTFS_FEED/routes/routes.json');

    let modelledRoutes = Object.keys(routes).map(route_id => {
      let routeObj = {
        _id: routes[route_id].route_id, // I KNOOOOOOW :)
        route_long_name: routes[route_id].route_long_name,
        route_short_name: routes[route_id].route_short_name,
        reports: JSON.stringify([]),
        saccos: JSON.stringify([]),
      };

      return routeObj;
    });

    Routes.DataModel.insertMany(modelledRoutes, (err, result) => {

      if(err) {
        Routes.DataModel.find({route_long_name: new RegExp("wangige", "gi")}, (err, docs) => {
          if(err)
            response.send("eror");
          else {
            response.json(docs);
          }
        });
      }
      else {
        response.json(result[0]);
      }

    });

  } catch(err) {
    console.log(err);
    console.log("Routes already added");
  }

});

// this object returns the details stored on about a certain route
// onSuccess => responds the JSON data pertaining to that route
// onErr => responds with an empty {} to the client
route.get("/:route_id", (request, response) => {

  const onSuccess = (result) => {
    response.json(result);
  }

  const onErr = () => {
    response.json({});
  }

  Routes.findById(
    request.params.route_id, // route_id
    onSuccess, // onSuccess callback
    onErr, // onErr callback
  );

});

// this is the route used to fetch all the reports concerned with a certain route
// onSuccess -> responds with an array of all the cases
// onErr -> reponds with an empty Array
route.get("/:route_id/reports", (request, response) => {
  const {route_id} = request.params; // _id

  // needs assistance from the Report class
  // STEP 1: get all the reportIDs stored in the Route details
  const onSuccessFind = (result) => {
    let ALL_REPORTS = [];
    let report_ids = JSON.parse(result.reports);

    // STEP 2:
    // create mini success callbacks that will be called on each iteration of report_ids found in route
    const onMiniSuccess = (report) => ALL_REPORTS.push(report);
    const onMiniError = () => console.log("Error and/or no reports being added to route: " + route_id);

    // STEP 3:
    // iterate through each id and fetch the corresponding report
    report_ids.forEach(report_id => Report.findById(
      report_id, // report id
      onMiniSuccess, // called on successful retrieval
      onMiniError // called on error retrieving
    ));

    response.json(ALL_REPORTS);
  }

  const onErrorFind = () => response.json([]);

  Routes.findById(
    route_id, // id
    onSuccessFind, // success callback
    onErrorFind // error callback
  );
});

module.exports = route;