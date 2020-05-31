const mongoose = require("mongoose");

const Test = new mongoose.Schema({
  _id: {
    type: Number,
    required: true,
  },
  name: String
});

const TestModel = mongoose.model(
  "test", // model name
  Test, // model schema
  'test' // collection name
);

module.exports = TestModel;
