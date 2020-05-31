const mongoose = require('mongoose');
const DataModel = require('./DataModel');
const CDNHandler = require('../utilities/CDNHandler');

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

const ReportModel = mongoose.model('report', ReportSchema, 'route');

class Report extends DataModel {

  constructor(Model=ReportModel) {
    super(Model);
  }

  /**
   * 
   * @param {*} incidentDescription 
   */
  addNewReport(userSentReport, onErr, onSuccess) {
    // STEP ONE:
    // Pack the report into a reportable format
    let packedReport = Report.packReport(userSentReport);

    ReportModel.create(packedReport)
      .then(doc => {
        let {_id, culpritDescription} = doc; // _id
        let {route_id} = JSON.parse(culpritsDescription); // route_id

        // !TODO add the FCM http api for sending out notifications

        onSuccess({_id, route_id});
      }).catch(err => onErr()) ;
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

}

module.exports = Report;
