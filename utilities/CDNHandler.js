const fs = require('fs');
const path = require('path');
const baseDir = require('../').dirname;
// const audio = require('');

console.log(baseDir)

class CDNHandler {

  /**
   * 
   * @param {String} type these may be one of three: "audio" | "video" | "photo"
   * @param {Array<String>} mediaArr the media is brought in as String files
   */
  constructor(type, mediaArr) {
    this.type = type;
    this.mediaArr = mediaArr;
  }

  static get ACCEPTED_TYPES() {

    return {
      photo: "photo",
      audio: "audio",
      video: "video"
    };
  }

  static get MEDIA_HEADER() {
    return {
      "audio": "AUD_",
      "video": "VID_",
      "photo": "IMG_"
    };
  }

  /**
   * 
   * @returns {String} returns a fileName of how the Media will be saved in the CDN
   */
  getFileName() {
    let {length} = fs.readdirSync(
      path.join(`D:\\digital_matatus_server`, "cdn", this.type)
    ); // returns the length of the directory
    
    let fileName = `${CDNHandler.MEDIA_HEADER[this.type]}${length}`;

    return fileName;
  }

  /**
   * passes over media handed in by the user and is then transferred to the CDN
   * 
   * @returns {Array<String>} returns an array of urls that when resolved by the client will pull
   * the respective media
   */
  storeMedia() {

    let mediaFileLinks = this.mediaArr.map(mediaFile => {
      let fileName = this.getFileName();
      fs.writeFileSync(
        path.join("D:\\digital_matatus_server", "cdn", this.type, fileName),
        mediaFile
      );

      return `http://localhost:3000/cdn/${this.type}/${fileName}`; // url representing how to fetch the file
    });

    return mediaFileLinks;
  }

}

module.exports = CDNHandler;
