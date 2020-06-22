const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();

const photoStorage = multer.diskStorage({
  destination: path.join(__dirname, "cdn", "photo"),
  filename: (req, file, cb) => {
    let cdnSize = fs.readdirSync(path.join(__dirname, "cdn", "photo")).length;
    let fileName = `IMG_${cdnSize}.${file.mimetype.split("/")[1]}`;
    console.log("Creating file: " + fileName);
    cb(null, fileName);
  },
});

const photoUpload = multer({
  storage: photoStorage,
}).single("media"); // process the "media" (part to get the file data)

const videoStorage = multer.diskStorage({
  destination: path.join(__dirname, "cdn", "video"),
  filename: (req, file, cb) => {
    let cdnSize = fs.readdirSync(path.join(__dirname, "cdn", "video")).length;
    let fileName = `VID_${cdnSize}.${file.mimetype.split("/")[1]}`;
    console.log("Creating file: " + fileName);
    cb(null, fileName);
  }
});

const videoUpload = multer({
  storage: videoStorage
}).single("media"); // process the "media" (part to get the file data)

const audioStorage = multer.diskStorage({
  dest: path.join(__dirname, "cdn", "audio"),
  filename: (req, file, cb) => {
    let cdnSize = fs.readdirSync(path.join(__dirname, "cdn", "audio")).length;
    let fileName = `AUD_${cdnSize}.${file.mimetype.split("/")[1]}`;
    console.log("Creating file: " + fileName);
    cb(null, fileName);
  }
});

const audioUpload = multer({
  storage: audioStorage
}).single("media"); // process the "media" (part to get the file data)

// routers
const routes = require('./routes');
const CDNHandler = require('./utilities/CDNHandler');

mongoose.connect("mongodb://127.0.0.1:27017/digital_matatus", {useNewUrlParser: true});

const db = mongoose.connection; // database conection

db.on("error", () => console.log("Failed to connect"));

app.use("/api", routes.api);

app.use(bodyParser.raw({type: "image/*", limit: "10mb"}));
app.use(bodyParser.raw({type: "audio/*", limit: "50mb"}));
app.use(bodyParser.raw({type: "video/*", limit: "50mb"}));
// app.use(bodyParser.raw({type: "multipart/form-data", limit: "50mb"}));

app.get("/", (request, response) => {

  response.send("Open for service");
});

module.exports = {
  dirname: __dirname
};

// This route is used to erve the static files that are the Photos and videos and audio
// route has two parameters: 
// - mediaType -> contaiins the media type to help decide which folder in the cdn to nav to.
// - fileName -> this is the fileName of the nedia file being retrieved
// sends back a response of:
// - sendFile -> if the file is successfully resolved
// - send('Media file not found') -> if the media file is not resolved
app.get("/cdn/fetch/:mediaType/:fileName", (request, response) => {
  let {mediaType, fileName} = request.params;
  let location = path.join(__dirname, "cdn", mediaType);
  let file = null; // stores the file

  let children = fs.readdirSync(location); // children
  
  for(let i=0; i<children.length; i++) {
    let mediaFile = path.join(location, children[i]);
    
    if(path.parse(mediaFile).name == fileName) {
      file = mediaFile;
      break;
    }

  }

  if(file) {
    response.sendFile(file);
  } else {
    response.send('Media file not found');
  }

});

app.post("/cdn/upload/:mediaType", (request, response) => {
  let {mediaType} = request.params;

  if(mediaType === "audio") {
    audioUpload(request, response, (err) => {
      if(err)
        response.json({mediaUrl: null});
      else {
        console.log("Uploading content from audio call");
        let dirSize = fs.readdirSync(path.join(__dirname, "cdn", "audio")).length;
        // since the last file was the one saved by the middleware
        response.json({mediaUrl: `http://192.168.43.89:3000/cdn/fetch/audio/AUD_${dirSize - 1}`});
      }
    });
  } else if(mediaType === "photo") {
    photoUpload(request, response, (err) => {
      if(err)
        response.json({mediaUrl: null});
      else {
        console.log("Uploading content");
        console.log("Uploading content from photo call");
        let dirSize = fs.readdirSync(path.join(__dirname, "cdn", "photo")).length;
        // since the last file was the one saved by the middleware
        response.json({mediaUrl: `http://192.168.43.89:3000/cdn/fetch/photo/IMG_${dirSize - 1}`});
      }
    });
  } else if(mediaType === "video") {
    videoUpload(request, response, (err) => {
      if(err)
        response.json({mediaUrl: null});
      else {
        console.log("Uploading content");
        console.log("Uploading content from video call");
        let dirSize = fs.readdirSync(path.join(__dirname, "cdn", "video")).length;
        // since the last file was the one saved by the middleware
        response.json({mediaUrl: `http://192.168.43.89:300/cdn/fetch/video/VID_${dirSize - 1}`});
      }
    });
  }

});

app.listen(3000, () => console.log("listening on port 3000"));

