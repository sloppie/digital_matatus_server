const mongoose = require("mongoose");

const DataModel = require('./DataModel');

// known hash:
// dgitau75@gmail.com - 37f20598c2e2a0ae4e0769a96c08812aac47f1284f435ce223f470f6075a6bc9

const UserSchema = new mongoose.Schema({
  _id: {
    type: String, // unique hash created using the email
    required: true,
  },
  favouriteRoutes: {
    type: String, // this is a Stringified collection of the users favourite routes
    required: true
  },
  reportsFollowed: {
    type: [String]
  },
  reported: { // these are the cases the user reported
    type: [String],
  },
  deviceToken: String, 
});

const UserModel = mongoose.model('user', UserSchema, 'user');

/**
 * @description this is the class that acts as an interface betweeen the User Collection in the database
 * and the API of the application
 * 
 * it can: 
 *  - generateHash
 *  - findByID
 *  - findUsers
 */
class User extends DataModel {

  /**
   * 
   * @param {mongoose.model} Model it is a param that defaults to the Model declared in the same file
   */
  constructor(Model=UserModel) {
    super(Model);
  }
  
  /**
   * 
   * @param {String} email - email to be hashed
   * @param {Function} onSuccess - callback executed on successful completion
   * @param {Function} onErr - callback executed on an error occurring 
   */
  isUser(email, onSuccess, onErr) {

    UserModel.findById(this.generateHash(email), (err, result) => {
      
      if(err)
        onErr();
      else {

        if(result)
          onSuccess();
        else
          onErr();

      }

    });

  }

  /**
   * 
   * @param {String} hash 
   * @param {Function} onSuccess - callback to be executed when the ID is found
   * a payload of the details found is pushed to the onSuccess callback
   * @param {Function} onErr - callback to be executed when the ID is not found
   */
  findById(hash, onSuccess, onErr) {

    this.DataModel.findById(hash, (err, result) => {
      
      if(err)
        onErr();
      else
        
        if(result)
          onSuccess(result);
        else
          onErr();

    });

  }

  /**
   * this is an asynchronous function that waits for the results to be added
   * 
   * @param {String} email an email of the user to be used to create a hash 
   * @param {{}} userData is an object containing the user details such as:
   *  - favouriteRoutes: required
   *  - reportsFollowed: (optional) initially empty
   *  - reported: (optional) initially empty
   * 
   * @returns {Boolean} a boolean that represents whether isSuccessful is true
   */
  async addNewUser(email, userData) {
    let status = false;

    try {
      let doc = await this.DataModel.create(
        {
          _id: this.generateHash(email),
          ...userData // spread out the data created
        },
      );

      status = doc !== null && doc !== undefined;

    } catch (err) {
      console.log(err);
      status = false;
    }

    return status;
  }

  /**
   * @todo refactor and use the super().updateDetails to carry this out
   * 
   * @param hash this is the unique hash for the specific user
   * @param {{key: any, value: any}} newDetails this is the new details to be added to the object
   * @param {Function} onSuccess - callback to be called on successful update
   * @param {Function} onErr - callback to be called once an error occurs
   */
  updateUserDetails(hash, newDetails, onSuccess, onErr) {
    UserModel.updateOne(
      {_id: hash}, // grab by ID
      newDetails, // new Details
      (err, data) => { // callback on request finish
        
        if(err)
          onErr();
        else {

          if(data)
            onSuccess();
          else
            onErr();

        }

      }
    );
  }

  /**
   * 
   * @param {String} userID this is the unique hash associated with the user 
   * @param {id} reportID
   * @param {Function} onSuccess called on successful update
   * @param {Function} onErr called on error updating User.reported
   * 
   */
  addNewReported(userID, reportID, onSuccess, onErr) {
    UserModel.findById(
      userID,
      (err, result) => {
        if(err)
          onErr();
        else {

          if(result) {
            let reported = JSON.parse(result.reported);

            report.unshift(reportID);

            // super().updateDetails handles the updating
            this.updateDetails(
              userID, // user-unique hash
              {reported: JSON.stringify(reported)}, // updated reported
              onSuccess, // success callback
              onErr // callback error
            );

          } else {
            onErr();
          }

        }
      }
    );
  }

  /**
   * This is the function used to hash the User emails 
   * @param {String} email this is the user email that is to be hashed and hecked in the database
   * 
   * @returns {String} a 256 bit hash output of the email
   */
  generateHash(email) {
    let hash = require('crypto').createHash("sha256");
    hash.update(email);

    let resultantHash = hash.digest("hex");

    console.log(`createdHash: ${resultantHash}`);
    
    return resultantHash;
  }

  /**
   * This method is used to normalise the user details xcept for the email which is supposed to be
   * hashed to create a unique userID (_id)
   * @param {{favouriteRoutes: Array<String>, deviceToken: String}} body - this contains the information object sent from the user
   *  This body contains: 
   *    - favouriteRoutes - an Array of the route details the user likes (cannot be empty)
   *    - deviceToken - a unique string generated from the FCM that helps communicate to User's device
   * 
   * @returns {{
   *  favouriteRoutes: Array<String>, 
   *  deviceToken: String, 
   *  reportsFollowed: Array<String>,
   *  reported: Array<String>
   * }} an object containing:
   *  - favouriteRoutes
   *  - deviceToken
   *  - reported
   *  - reportsFollowed
   */
  static generateUserDetails(body) {
    let {
      favouriteRoutes, 
      deviceToken
    } = body;

    return {
      favouriteRoutes: JSON.stringify(favouriteRoutes),
      reportsFollowed: JSON.stringify.stringify([]),
      reported: JSON.stringify([]),
      deviceToken: deviceToken
    };
  }

}

module.exports = User;
