const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/userModel");
const Community = require("../models/communityModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const Vote = require("../models/voteModel");

dotenv.config({ path: "./config.env" });

const demoEmails = [
  "maya.chen@forum.test",
  "leo.martin@forum.test",
  "sofia.rossi@forum.test",
  "noah.williams@forum.test",
];

async function deleteDevData() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to delete development data while NODE_ENV=production",
    );
  }

  const database = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD,
  );
  await mongoose.connect(database);

  const users = await User.find({ email: { $in: demoEmails } }).select("_id");
  const userIds = users.map((user) => user._id);
  const communities = await Community.find({ owner: { $in: userIds } }).select(
    "_id",
  );
  const communityIds = communities.map((community) => community._id);
  const posts = await Post.find({
    $or: [{ author: { $in: userIds } }, { community: { $in: communityIds } }],
  }).select("_id");
  const postIds = posts.map((post) => post._id);
  const comments = await Comment.find({ post: { $in: postIds } }).select("_id");
  const commentIds = comments.map((comment) => comment._id);

  const votesResult = await Vote.deleteMany({
    $or: [
      { user: { $in: userIds } },
      { post: { $in: postIds } },
      { comment: { $in: commentIds } },
    ],
  });
  const commentsResult = await Comment.deleteMany({ _id: { $in: commentIds } });
  const postsResult = await Post.deleteMany({ _id: { $in: postIds } });
  const communitiesResult = await Community.deleteMany({
    _id: { $in: communityIds },
  });
  const usersResult = await User.deleteMany({ _id: { $in: userIds } });

  console.log(
    `Deleted ${usersResult.deletedCount} users, ${communitiesResult.deletedCount} communities, ${postsResult.deletedCount} posts, ${commentsResult.deletedCount} comments, and ${votesResult.deletedCount} votes.`,
  );
}

deleteDevData()
  .catch((error) => {
    console.error("Development data deletion failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
