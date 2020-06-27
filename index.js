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
  console.log("Fetching the Media file: " + request.params.fileName);
  let {mediaType, fileName} = request.params;
  let location = path.join(__dirname, "cdn", mediaType);
  let file = null; // stores the file

  let children = fs.readdirSync(location); // children
  
  for(let i=0; i<children.length; i++) {
    let mediaFile = path.join(location, children[i]);
    
    if(children[i] == fileName) {
      file = mediaFile;
      break;
    }

  }

  if(file) {
    console.log("sending back file: " + file);
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
        console.log("Uploading content to audio storage");
        let folderChildren = fs.readdirSync(path.join(__dirname, "cdn", "audio"));
        let dirSize = folderChildren.length - 1;
        // this will return an array with only the last file added
        // since the array returned will be of size 1, we can just pop the element
        // and store it.
        let mediaSavedName = folderChildren.filter(file => new RegExp(`AUD_${dirSize}`).test(file)).pop();

        response.json({mediaUrl: `/cdn/fetch/audio/AUD_${mediaSavedName}`});
      }
      
    });
  } else if(mediaType === "photo") {
    photoUpload(request, response, (err) => {

      if(err)
        response.json({mediaUrl: null});
      else {
        console.log("Uploading content to photo storage");
        let folderChildren = fs.readdirSync(path.join(__dirname, "cdn", "photo"));
        let dirSize = folderChildren.length - 1;
        // this will return an array with only the last file added
        // since the array returned will be of size 1, we can just pop the element
        // and store it.
        let mediaSavedName = folderChildren.filter(file => new RegExp(`IMG_${dirSize}`).test(file)).pop();

        response.json({mediaUrl: `/cdn/fetch/photo/${mediaSavedName}`});
      }

    });
  } else if(mediaType === "video") {
    videoUpload(request, response, (err) => {

      if(err)
        response.json({mediaUrl: null});
      else {
        console.log("Uploading content");
        console.log("Uploading content to video");
        let folderChildren = fs.readdirSync(path.join(__dirname, "cdn", "video"));
        let dirSize = folderChildren.length - 1;
        // this will return an array with only the last file added
        // since the array returned will be of size 1, we can just pop the element
        // and store it.
        let mediaSavedName = folderChildren.filter(file => new RegExp(`VID_${dirSize}`).test(file)).pop();

        response.json({mediaUrl: `/cdn/fetch/video/VID_${mediaSavedName}`});
      }

    });
  }

});

app.listen(3000, () => console.log("listening on port 3000"));

