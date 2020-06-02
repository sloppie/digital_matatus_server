const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();

// routers
const routes = require('./routes');

mongoose.connect("mongodb://127.0.0.1:27017/digital_matatus", {useNewUrlParser: true});

const db = mongoose.connection; // database conection

db.on("error", () => console.log("Failed to connect"));

app.use("/api", routes.api);

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
app.get("/cdn/:mediaType/:fileName", (request, response) => {
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

app.listen(3000, () => console.log("listening on port 3000"));

