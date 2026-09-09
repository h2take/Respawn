const mongoose = require("mongoose");
const validator = require("validator");

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    maxlength: [40, "Name cannot be more than 40 characters"],
    minlength: [2, "Name cannot be less than 2 characters"],
  },
  description: {
    type: String,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Community = mongoose.model("Community", communitySchema);
module.exports = Community;
