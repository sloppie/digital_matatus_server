const mongoose = require('mongoose');

const DataModel = require('./DataModel');

const RoutesSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  route_long_name: String,
  route_short_name: String,
  reports: String, // this string is a JSON of all the incidents
  saccos: String
});

const RouteModel = mongoose.model('routes', RoutesSchema, 'routes');


class Routes extends DataModel {

  constructor(Model=RouteModel) {
    super(Model);
  }

  /**
   * 
   * @param {String} route_id route_id specified in the report
   * @param {String} reportID is the id of the report to be added to this
   * @param {Function} onSuccess callback on successful insert
   * @param {Function} onErr callback on error retrieving
   */
  insertNewReport(route_id, reportID, onSuccess, onErr) {
    RouteModel.findById(route_id, (err, result) => {
      
      if(err)
        onErr();
      else {
        
        if(result) {
          let reports = JSON.parse(result.reports);
          // insert at the top of the Array
          reports.unshift(reportID); // key can access the report

          let newReport = {reports: JSON.stringify(reports)}

          /**@see DataModel for implementation of the updateDetails method */
          this.updateDetails(route_id, newReport, onSuccess, onErr);
        } else {
          onErr();
        }

      }

    });
  }

}

module.exports = Routes;
