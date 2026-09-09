const mongoose = require("mongoose");
const Post = require("./postModel");

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, "A comment cannot be empty"],
      trim: true,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A comment must belong to a user"],
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
      required: [true, "A comment must belong to a post"],
    },
    parentComment: {
      type: mongoose.Schema.ObjectId,
      ref: "Comment",
      default: null, // null = top-level comment, otherwise it's a reply
    },
    score: {
      type: Number,
      default: 0,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

commentSchema.index({ post: 1, createdAt: -1 });

commentSchema.pre(/^find/, function () {
  this.populate({ path: "author", select: "name photo" });
});

commentSchema.post("save", async function () {
  await Post.findByIdAndUpdate(this.post, { $inc: { commentsCount: 1 } });
});

commentSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await Post.findByIdAndUpdate(doc.post, { $inc: { commentsCount: -1 } });
  }
});
const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
