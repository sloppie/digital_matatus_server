/**
 * This is the data structure used to order the data found in reports after it is found
 * Preferred as due to the nature of the alog being O(logn) thus making it fast and 
 * efficient to add items to.
 * Even when extracting all  the items, this will only be an O(n) opeations as it will
 * just be a matter of printing what is in the tree.
 */
class BST {

  /**
   * 
   * @param {{
   *  _id: string, 
   *  incidentDescritption: String, 
   *  culpritdDescription: String, 
   *  privateInformation: String
   *  culpritsIdentified: String
   * }} firstReport this is the first report fetched by the `Report.find` method
   */
  constructor(firstReport) {
    this.head = new Report(firstReport);
  }

  /**
   * 
   * @param {{}} report the report being added (at first passed in as an `Object`) but
   * is quickly converted to `Report` Object
   */
  add(report) {
    let newReport = new Report(report);

    this.head.add(newReport);
  }

  /**
   * All reports stored in correct order
   */
  get reports() {
    const allReports = [];

    this.head.getReports(allReports);

    return allReports;
  }

}

/**
 * This id the data structure that will hold the reports.
 * In its body will be:
 *  - reportNumber -> fished from the `report._id` which has the format `r_id_{reportNumber}`
 *  - report - this is the report as fetch from the database (what will be returned when `this.getReport`)
 *  is called.
 */
class Report {

  /**
   * Takes in the report to be stored in the Node
   * 
   * @param {{
   *  _id: string, 
   *  incidentDescritption: String, 
   *  culpritdDescription: String, 
   *  privateInformation: String
   *  culpritsIdentified: String
   * }} report stored in the Node
   */
  constructor(report) {
    // the second index will contain the report's number
    this._reportNumber = Number(report._id.split("_")[2]);
    this._report = report;
    this._left = null; // left node
    this._right = null; // right node
  }

  /**
   * Fetches the reportNumber from that will be used to add objects into the BST
   * 
   * @returns {Number} `this._reportNumber`
   */
  get id() {

    return this._reportNumber;
  }

  /**
   * Getter method for retrieving the report
   * 
   * @returns {{
   *  _id: string, 
   *  incidentDescritption: String, 
   *  culpritdDescription: String, 
   *  privateInformation: String
   *  culpritsIdentified: String
   * }} report stored in the Node
   */
  get report() {

    return this._report;
  }

  /**
   * a reference to the Node stored on the left node
   */
  get left() {

    return this._left;
  }

  /**
   * add a new node on the left
   */
  set left(newReport) {
    this._left = newReport;
  }

  /**
   * a reference to the Node stored on the right node
   */
  get right() {

    return this._right;
  }

  /**
   * add a new node on the left
   */
  set right(newReport) {
    this._right = newReport;
  }

  /**
   * 
   * @param {Report} report the report to be added to the Report
   */
  add(report) {

    if(report.id < this.id) {
  
      if(this.left) {
        this._left.add(report);
      } else {
        this.left = report;
      }

    } else {

      if(this.right) {
        this._right.add(report);
      } else {
        this.right = report;
      }

    }

  }

  /**
   * A recursive function that will be able to fetch all reports from the `BST`
   * 
   * @param {Array<Object>} allReports an array that will have all reports added
   */
  getReports(allReports) {

    if(this.left)
      this._left.getReports(allReports);
    
    allReports.push(this.report);
    
    if(this.right)
      this._right.getReports(allReports);

  }

}

module.exports = {BST};
