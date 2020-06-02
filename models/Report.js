const mongoose = require('mongoose');
const DataModel = require('./DataModel');
const CDNHandler = require('../utilities/CDNHandler');
const NotificationHandler = require('../utilities/NotificationHandler');

const ReportSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  incidentDescription: String,
  culpritDescription: String,
  privateInformation: String,
  culpritIdentified: String, // Arrays of culprits identified are stringified
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

    // ReportModel.create(packedReport)
    //   .then(doc => {
    //     doc.model
    //     let {_id, culpritDescription} = doc; // _id
    //     let {route_id} = userSentReport.culpritDescription; // route_id

    //     // !TODO add the FCM http api for sending out notifications

    //     onSuccess({_id, route_id});
    //   }).catch(err => onErr()) ;

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
          console.log("Notification created")
          onSuccess({_id: report_id, route_id});
        }).catch(err => {console.log(err); onErr()});
      }

    });

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
