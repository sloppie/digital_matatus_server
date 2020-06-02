const express = require('express');
const bodyParser = require('body-parser');

// Models
const UserModel = require('../../../models/User'); // used when wanting to use static functions
const User = new UserModel(); // create user class to help engage with all the queries

const route = express.Router();

// middleware
route.use(bodyParser.json({limit: "50mb"})); // parse JSON sent to the server
route.use(bodyParser.urlencoded({limit: "50mb", extended: false})); // parse JSON sent to the server

route.get("/", (request, response) => {
  let email = "sloppie@example.com";
  let userData = {
    favouriteRoutes: JSON.stringify([
      "eh ihwfbia",
      "cjiurvbuiaeb"
    ]),
    reportsFollowed: JSON.stringify([
      "iuiuebsuirega"
    ]),
    reported: JSON.stringify([
      "cjnjdsuiebubbuareg"
    ]),
    deviceToken: "jiubiueabiubeiabhdfvbdbyyiubfeaibvoyra"
  };
  (User.addNewUser(email, userData)) ? response.json(true): response.json(false);
});

// This method could get ideal use when confirming whether the details are actually available in the
// databasse even before the user opts to send the email to generate the hash
// this method returns:
// TRUE - if the data is found in the system
// FALSE - if the data is not found in the system
route.get("/isUser/:email", (request, response) => {
  // returns a boolean to the user
  User.isUser(
    request.params.email,
    () => response.json(true),
    () => response.json(false)
  );
  // response.json(User.isUser(request.params.email));
});

// route.get("/login", (request, response) => {
//   User.updateUserDetails(
//     createEmailHash("sloppie@example.com"),
//     {
//       favouriteRoutes: JSON.stringify(["sksksksksksksksksksks"]),
//       reported: JSON.stringify(["sksksksksksksksksksks"])
//     },
//     () => response.send("Updated!"),
//     () => response.send("Failed to update")
//   );
// });

route.get("/login", (request, response) => {
  console.log(request.query.email)
  User.findById(
    User.generateHash(request.query.email),
    (details) => response.json(details),
    () => response.json(false)
  )
});

// use a  PUT request to update the deviceToken (since they already filled in their preferences)
// returns a response of:
// UserDetails if the data was found, and the user was able to update the deviceToken parameter
// else:
//  if any one of this steps fails, it sends back FALSE
route.put("/login", (request, response) => {
  // fetch user details
  User.findById( // prevent loggin in to new-users
    User.generateHash(request.body.email),
    (details) => { // onSuccess proceed to add userDetails on the newDeviceToken
      // !TODO - create a function that will fetch the previous device token from notification tray
      // and replace with the new deviceToken
      User.updateUserDetails(
        User.generateHash(request.body.email), // create a hash of the user details
        {deviceToken: request.body.deviceToken}, // only update needed to be carried
        (newDetails) => response.json(newDetails), // onSuccessful update, push payload to user to restore their data
        () => response.json(false) // onError updating,
      );
    },
    () => response.json(false)
  );

  
});

// Inserts a new user to the database 
// returns a response of:
// true - if the addition of the user was successful
// false - if addition was not successful
route.post("/new", (request, response) => {
  let added = User.addNewUser(
    request.body.email, // email to be hashed
    UserModel.generateUserDetails(request.body), // generates user details from the request body
  );

  (added)? response.json({state: true, _id: createEmailHash(request.body.email)}): response.json(false);
});


// helper funtions
function createEmailHash(email) {
  const crypto = require('crypto');
  const hash = crypto.createHash("sha256"); // 256-bit encryption
  hash.update(email);

  return hash.digest("hex");
}

module.exports = route;
