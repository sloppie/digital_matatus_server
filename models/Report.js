const mongoose = require('mongoose');
const DataModel = require('./DataModel');
const CDNHandler = require('../utilities/CDNHandler');
const NotificationHandler = require('../utilities/NotificationHandler');
const EventEmitter = require('events');

// handle query finish events
class QeuryHandler extends EventEmitter {}
const QueryState = new QeuryHandler();


const ReportSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  incidentDescription: String,
  culpritDescription: String,
  privateInformation: {
    type: String,
  },
  culpritIdentified: {
    type: String,
  }, // Arrays of culprits identified are stringified
});

const ReportModel = mongoose.model('report', ReportSchema, 'report');

class Report extends DataModel {

  constructor(Model=ReportModel) {
    super(Model);
  }

  /**
   * 
   * @param {*} incidentDescription 
   */
  addNewReport(userSentReport, onSuccess, onErr) {
    // STEP ONE:
    // Pack the report into a reportable format
    let packedReport = Report.packReport(userSentReport);

    // generate report id by keeping count of report count in collection
    ReportModel.find().count((err, result) => {

      if(err)
        onErr();
      else {
        let report_id = `r_id_${result}`;
        packedReport._id = report_id;

        console.log("Creating notification...")
        ReportModel.create(packedReport).then(doc => {
          let route_id = userSentReport.culpritDescription.routeID;
          NotificationHandler.sendNotifications(
            NotificationHandler.generateReportMessage(userSentReport, report_id),
            route_id
          );
          console.log("Notification created");
          onSuccess({_id: report_id, route_id});
        }).catch(err => {console.log(err); onErr()});
      }

    });

  }

  /**
   * @todo refactor and turn this into a function that is a member of super(), all it has to do,
   * is take in the keys and priority of each key as an object also
   * 
   * recursive function that recurses over the data until all the keys are parsed
   * 
   * @param {Array<String>} remainingKeys is the amount of keys that are yet to be processed
   * @param {{}} queryValues values to search by
   * @param {(payload: {}) => {}} onSuccess callback to be executed onSuccess, payload is passed in
   * @param {() => {}} onErr callback to executed on an error
   * @param {Array<Document>} resultsProcessed contains a payload of the results processed before hand
   */
  find(remainingKeys, queryValues, onSuccess, onErr, resultsProcessed=null) {

    if(remainingKeys.length == 0) {
      QueryState.removeAllListeners("QUERY_FINISHED");
      onSuccess(resultsProcessed);
      return;
    }

    let priorities = {
      route_id: 1, // helps narrow down most
      date: 2, // narrows down more significantly than the ones below
      location_type: 3, // same priority as the flags
      flags: 3, // each has a location and a flag, it will not help arrow down as much as route_id & Date will
      not_there: 20
    };
    
    let activePriority = "not_there"; // store the one that will be used to query the data

    remainingKeys.forEach(value => {

        if(priorities[activePriority] > priorities[value])
          activePriority = value;

    });

    const handleFinishedQuery = (data, key) => {

      remainingKeys.splice(remainingKeys.indexOf(key), 1);
      this.find(
        remainingKeys,
        queryValues,
        onSuccess,
        onErr,
        data // filteredData
      );
    }

    QueryState.on("QUERY_FINISHED", handleFinishedQuery);

    switch(activePriority) {
      case "route_id":
        this.queryRouteID(queryValues[activePriority], onErr);
        break;
      case "date":
        this.queryDate(queryValues[activePriority], onErr, resultsProcessed);
        break;
      case "location_type":
        this.queryLocation(queryValues[activePriority], onErr, resultsProcessed);
        break;
      case "flags": 
        this.queryFlags(queryValues[activePriority], onErr, resultsProcessed);
        break;
    }

  }

  updateCulpritsIdentified = (report_id, newCulpritObj, onSuccess, onErr) => {
    ReportModel.findById(
      report_id,
      (err, results) => {
        if(err)
          onErr();
        else {
          let culpritsIdentified = results.culpritsIdentified;

          if(culpritsIdentified) {
            let newCulprits = [...JSON.parse(culpritsIdentified), newCulpritObj];

            this.updateDetails(
              report_id,
              {culpritsIdentified: JSON.stringify(newCulprits)},
              onSuccess,
              onErr
            );
          } else {
            this.updateDetails(
              report_id, 
              {culpritsIdentified: JSON.stringify([newCulpritObj])},
              onSuccess,
              onErr
            )
          }

        }
          
      }
    )
  }

  updateMatatuDetails = (report_id, payload, onSuccess, onErr) => {

    ReportModel,this.findById(report_id,  (err, result) => {
      if(err)
        onErr();
      else {
        let culpritDescription = JSON.parse(result.culpritDescription);
        culpritDescription["matatuDetails"] = payload;

        this.updateDetails(
          report_id,
          {culpritDescription: JSON.stringify(culpritDescription)},
          onSuccess,
          onErr
        );
      }
    });

  }

  // callback for querying route_id
  /**
   * 
   * @param {string} _id on error id
   * @param {*} onErr 
   */
  queryRouteID(_id, onErr) {
    console.log("Route query value: " + _id);
    ReportModel.find({culpritDescription: new RegExp("\"routeID\":\"" + _id + "\"")}, (err, result) => {
      if(err)
         console.log(err);
        // onErr(); // throw err in advance and send it back to the user
      else {
        console.log("EVENT_EMITTED by: RouteID. resultsSize: " + result.length);
        QueryState.emit("QUERY_FINISHED", result, "route_id");
      }
      
    });

  }

  queryDate(dateString, onErr, data=null) {
    let newResults;
    let dateObj = {
      from: Number(dateString.split(":")[0]),
      to: Number(dateString.split(":")[1])
    };

    if(data !== null) {
      newResults = data.filter(report => {
        let incidentDescription = JSON.parse(report.incidentDescription);
        let date = new Date(incidentDescription.date).getTime();

        return date > dateObj.from && date < dateObj.to;
      });

        console.log("EVENT_EMITTED by: Date");
      QueryState.emit("QUERY_FINISHED", newResults, "date");
    } else {
      ReportModel.find((err, results) => {

        if(err)
         console.log(err);
          // onErr();
        else {
          newResults = results.filter(report => {
            let incidentDescription = JSON.parse(report.incidentDescription);
            let date = new Date(incidentDescription.date).getTime();

            return date > dateObj.from && date < dateObj.to;
          });

        console.log("EVENT_EMITTED by: Date");
          QueryState.emit("QUERY_FINISHED", newResults, "date");
        }

      }); 
    }

  }

  queryLocation(locationType, onErr, data=null) {
    let newResults;
    let testableRegExp = new RegExp("\"type\":\"" + locationType + "\"", "i");

    if(data !== null) {
      newResults = data.filter(report => testableRegExp.test(report.incidentDescription));
      QueryState.emit("QUERY_FINISHED", newResults, "location_type");
    } else {
      ReportModel.find(
        {incidentDescription: new RegExp("\"type\":\"" + locationType + "\"", "i")}, 
        (err, results) => {
          if(err)
         console.log(err);
            // onErr();
          else {
            QueryState.emit("QUERY_FINISHED", results, "location_type");
          }
        }
      );
    }

  }

  queryFlags(flagsString, onErr, data=null) {
    let flags = flagsString.split(";");

    if(data !== null) {
      let results = data.filter(report => {

        let trues = flags.filter(flag => {
          return new RegExp("\"" + flag + "\"", "i").test(report.incidentDescription);
        });

        return trues.length == flags.length;
      });

      QueryState.emit("QUERY_FINISHED", results, "flags");
    } else {
      ReportModel.find((err, results) => {
        if(err)
         console.log(err);
          // onErr();
        else {

          let newResults = results.filter(report => {

            let trues = flags.filter(flag => {
              return new RegExp("\"" + flag + "\"", "i").test(report.incidentDescription);
            });

            return trues.length == flags.length;
          });

          QueryState.emit("QUERY_FINISHED", newResults, "flags");
        }

      });
    }

  }

  /**
   * @param incidentDescription combs through the incident and also looks for media to convert
   * in the attached audio, video and photo segment to prevent adding of strings of data that
   * contain raw media files in them
   * 
   * @returns {{
   *  date: Date,
   *  location: {
   *    coords: {latitude: Number, longitude: Number},
   *    type: Enumerator('INSIDE_BUS', 'ON_BUS_TERMINAL', 'ON_BUS_ENTRANCE') 
   *  },
   *  media: {
   *    attachedAudioUrls: Array<String>,
   *    attachedPhotosUrls: Array<String>,
   *    attachedVideosUrls: Array<String>,
   *  }
   *  harassmentFlags: {
   *    'Verbal': Array<String>,
   *    'Non-verbal': Array<String>,
   *    'Physical': Array<String>
   *  },
   * }} object of the normalised report data
   */
  static unpackIncident(incidentDescription) {
    let {
      attachedAudiosData,
      attachedPhotosData,
      attachedVideosData
    } = incidentDescription;

    let attachedAudioUrls = new CDNHandler(
      CDNHandler.ACCEPTED_TYPES.audio, // type
      attachedAudiosData // mediaDataArr
    ).storeMedia();

    let attachedPhotosUrls = new CDNHandler(
      CDNHandler.ACCEPTED_TYPES.photo, // type
      attachedPhotosData // mediaDataArr
    ).storeMedia();

    let attachedVideosUrls = new CDNHandler(
      CDNHandler.ACCEPTED_TYPES.video, // type
      attachedVideosData // mediaDataArr
    ).storeMedia();
    
    let packedIncident = {
      date: incidentDescription.date, // date
      location: incidentDescription.location, // location
      harassmentFlags: incidentDescription.flags,
      media: {
        audio: attachedAudioUrls,
        photo: attachedPhotosUrls,
        video: attachedVideosUrls
      }
    };

    return packedIncident;
  }

  /**
   * This is used to pack the userSentReport into the ReportSchema described above
   * 
   * @param {{}} userSentReport this is the Object got from the application sent by the user
   */
  static packReport(userSentReport) {
    let finalReport = {};

    // each part of the report is stringified and sent to the collection as a String
    finalReport.incidentDescription = JSON.stringify(Report.unpackIncident(userSentReport.incidentDescription));
    finalReport.culpritDescription = JSON.stringify(userSentReport.culpritDescription);
    finalReport.culpritsIdentified = JSON.stringify([]); // this will be used to push any culprit identified
    finalReport.privateInformation = JSON.stringify(userSentReport.privateInformation)

    return finalReport;
  }

  static generateReportID() {
    return ReportModel.find().count()
  }

}

module.exports = Report;
