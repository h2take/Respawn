const mongoose = require("mongoose");


// Reddit-style "hot" ranking: combines vote score with recency
function calculateHotScore(score, createdAt) {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  const seconds = createdAt.getTime() / 1000 - 1134028003;
  return sign * order + seconds / 45000;
}

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A post must have a title"],
      trim: true,
      maxlength: [300, "A post title cannot exceed 300 characters"],
    },
    body: {
      type: String,
      required: [true, "A post must have content"],
      trim: true,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A post must belong to a user"],
    },
    community: {
      type: mongoose.Schema.ObjectId,
      ref: "Community",
      required: [true, "A post must belong to a community"],
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0, // = upvotes - downvotes, kept for fast "Top" sorting
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    hotScore: {
      type: Number,
      default: 0, // for "Hot" sorting, calculated using Reddit's hot ranking algorithm
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

// index for fast home-feed sorting
postSchema.index({ score: -1 });
//get all posts sorted by newest first
postSchema.index({ createdAt: -1 });
//get all posts in a community sorted by newest first
postSchema.index({ community: 1, createdAt: -1 });
//search index for title and body
postSchema.index({ title: "text", body: "text" });

// virtual populate — comments live in their own collection, ref back to post
postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "post",
  localField: "_id",
});

// always populate author's basic info + community name when querying posts
postSchema.pre(/^find/, function () {
  this.populate({ path: "author", select: "name photo" }).populate({
    path: "community",
    select: "name",
  });
});



const Post = mongoose.model("Post", postSchema);
module.exports.calculateHotScore = calculateHotScore;
module.exports = Post;
