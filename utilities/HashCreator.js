const crypto = require('crypto');

const createHash = (email) => {
  const hash = crypto.createHash('sha256');
  hash.update(email);
  return hash.digest("hex"); // hash value created for the user
}

module.exports = createHash;
