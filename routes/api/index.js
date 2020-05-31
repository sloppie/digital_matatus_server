const express = require('express');

const app = express.Router();

// mini routes
const report = require('./report');
const routes = require('./routes');
const user = require('./user');

app.use("/report", report);
app.use("/routes", routes);
app.use("/user", user)


app.get("/", (request, response) => {
  console.log("Connected to routes")

  response.send("Connected to API")
});

module.exports = app;