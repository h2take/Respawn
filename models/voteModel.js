const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A vote must belong to a user"],
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
    },
    comment: {
      type: mongoose.Schema.ObjectId,
      ref: "Comment",
    },
    value: {
      type: Number,
      enum: [1, -1],
      required: [true, "A vote must be an upvote or downvote"],
    },
  },
  { timestamps: true },
);

voteSchema.index(
  { user: 1, post: 1 },
  {
    unique: true,
    partialFilterExpression: { post: { $type: "objectId" } },
  },
);
voteSchema.index(
  { user: 1, comment: 1 },
  {
    unique: true,
    partialFilterExpression: { comment: { $type: "objectId" } },
  },
);

voteSchema.pre("validate", function () {
  if ((this.post && this.comment) || (!this.post && !this.comment)) {
    this.invalidate("post", "A vote must target exactly one post or comment");
  }
});

const Vote = mongoose.model("Vote", voteSchema);
module.exports = Vote;
