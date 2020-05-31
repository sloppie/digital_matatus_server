
/**
 * @description this contains menial tasks that are carried out by Models instead of
 * re-implementing them each time. e.g:
 *  - updateDetails(String, {newDetails}, onSuccess: Function, onErr:Function) - each Model
 *  needs a method to actually carry out updates and execute callbacks after it's done
 */
class DataModel {

  constructor(DataModel) {
    this.dataModel = DataModel
  }

  /**
   * in order to prevent need to override all the Methods in the MongoDB classs, we
   * expose the undelying {DataModel: mongoose.model} to the API
   * @returns {mongoose.model} object that represents the respective Collection
   */
  get DataModel() {
    return this.dataModel;
  }

  /**
   * 
   * @param {String} _id this is the supplied id for the document 
   * @param {Function} onSuccess - callback to be executed when the ID is found
   * a payload of the details found is passed as a parameter to the onSuccess callback
   * @param {Function} onErr - callback to be executed when the ID is not found
   * 
   */
  findById(_id, onSuccess, onErr) {

    this.DataModel.findById(_id, (err, result) => {
      
      if(err)
        onErr(); // repond to err callback
      else {
        
        if(result)
          onSuccess(result);
        else
          onErr();
      }

    });

  }

  /**
   * @todo refactor the inside to use DataModel.findByIdAndUpdate(_id, {details})
   * 
   * @param _id this is the unique hash for the specific user
   * @param {{key: any, value: any}} newDetails this is the new details to be added to the object
   * @param {Function} onSuccess - callback to be called on successful update
   * @param {Function} onErr - callback to be called once an error occurs
   */
  updateDetails(_id, newDetails, onSuccess, onErr) {

    this.DataModel.updateOne(
      {_id}, // grab by ID
      newDetails, // new Details
      (err, data) => { // callback on request finish
        
        if(err)
          onErr(); // on err
        else {

          if(data)
            onSuccess(); // on success
          else
            onErr(); // on err -> data is empty

        }

      }
    );

  }

}

module.exports = DataModel;