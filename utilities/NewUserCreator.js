const createNewUser = (userHash, data, dir) => {
  let userProfiles = require("./../mock_database/users.json");
  userProfiles[userHash] = data;
}

module.exports = createNewUser;