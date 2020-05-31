const express = require('express');
const path = require('path');

const baseDir = require('../../').dirname; // root directory of the server

const route = express.Router();

route.get("/:mediaType/:fileName", (request, response) => {
  let {mediaType, fileName} = request.params;
  let location = path.join(baseDir, "cdn", mediaType, fileName);

  console.log(`location: ${location}`)

  response.sendFile(location);
});

module.exports = route;
