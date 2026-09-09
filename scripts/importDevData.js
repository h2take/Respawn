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

const password = "GameForum123!";

const usersData = [
  { name: "Maya Chen", email: demoEmails[0], role: "admin" },
  { name: "Leo Martin", email: demoEmails[1] },
  { name: "Sofia Rossi", email: demoEmails[2] },
  { name: "Noah Williams", email: demoEmails[3] },
];

const communitiesData = [
  {
    name: "Indie Quest",
    description: "A place for thoughtful discussion about independent games.",
    owner: 0,
  },
  {
    name: "RPG Campfire",
    description: "Builds, stories, quests, and everything role-playing.",
    owner: 1,
  },
  {
    name: "Competitive Corner",
    description: "Ranked games, strategy, esports, and healthy competition.",
    owner: 2,
  },
  {
    name: "Cozy Controllers",
    description: "Relaxed games for quiet evenings and slow weekends.",
    owner: 3,
  },
];

const postsData = [
  {
    title: "What indie game surprised you this year?",
    body: "I went in expecting a short weekend game and ended up thinking about its characters for days. Which recent indie games caught you off guard?",
    author: 0,
    community: 0,
    score: 8,
    upvotes: 9,
    downvotes: 1,
  },
  {
    title: "The best small details in Hollow Knight",
    body: "The environmental storytelling is incredible. I keep finding tiny animations and background details I missed on my first playthrough.",
    author: 2,
    community: 0,
    score: 5,
    upvotes: 6,
    downvotes: 1,
  },
  {
    title: "Help me choose my next RPG build",
    body: "I am starting a new run and cannot decide between a stealth archer, a support mage, or a strength-focused warrior. What build stayed fun all the way through?",
    author: 1,
    community: 1,
    score: 6,
    upvotes: 7,
    downvotes: 1,
  },
  {
    title: "Games with companions worth remembering",
    body: "Looking for RPGs where the party feels like a real group of people instead of a collection of stat bonuses.",
    author: 3,
    community: 1,
    score: 4,
    upvotes: 4,
    downvotes: 0,
  },
  {
    title: "How do you practice without burning out?",
    body: "I want to improve at ranked matches, but repeating the same drills for hours makes the game feel like work. What practice routines actually helped you?",
    author: 2,
    community: 2,
    score: 7,
    upvotes: 8,
    downvotes: 1,
  },
  {
    title: "A reminder to review your replays",
    body: "Watching one replay with a specific question in mind taught me more than several unfocused matches. What do you look for when reviewing a loss?",
    author: 0,
    community: 2,
    score: 3,
    upvotes: 3,
    downvotes: 0,
  },
  {
    title: "Your favorite low-stakes evening game",
    body: "Some nights I want a game with no timers, no ranked ladder, and no pressure. What is your reliable comfort pick?",
    author: 3,
    community: 3,
    score: 10,
    upvotes: 10,
    downvotes: 0,
  },
  {
    title: "Co-op games for two people who are new to gaming",
    body: "I am looking for something welcoming, preferably with teamwork and a gentle learning curve. Extra points if we can play in short sessions.",
    author: 1,
    community: 3,
    score: 6,
    upvotes: 6,
    downvotes: 0,
  },
];

const commentsData = [
  [0, 1, "Outer Wilds completely changed how I think about exploration games."],
  [0, 3, "Same here. The less I knew going in, the better it felt."],
  [1, 2, "The little bugs in the background are my favorite detail."],
  [
    2,
    3,
    "Support mage is surprisingly active if you build around crowd control.",
  ],
  [
    2,
    0,
    "I always return to a simple warrior build when I want to focus on the story.",
  ],
  [3, 1, "Dragon Age: Origins still has some of my favorite party banter."],
  [4, 0, "Short, focused sessions helped me more than marathon practice."],
  [4, 2, "I started tracking one mistake per match and saw progress quickly."],
  [
    5,
    1,
    "Reviewing positioning made a bigger difference for me than aim drills.",
  ],
  [6, 0, "Dorfromantik is perfect for that mood."],
  [6, 2, "Stardew Valley, especially when I ignore the optimization guides."],
  [7, 3, "It Takes Two is excellent for a first co-op game."],
];

async function removePreviousDemoData() {
  const demoUsers = await User.find({ email: { $in: demoEmails } }).select(
    "_id",
  );
  const userIds = demoUsers.map((user) => user._id);
  const demoCommunities = await Community.find({
    owner: { $in: userIds },
  }).select("_id");
  const communityIds = demoCommunities.map((community) => community._id);
  const demoPosts = await Post.find({
    $or: [{ author: { $in: userIds } }, { community: { $in: communityIds } }],
  }).select("_id");
  const postIds = demoPosts.map((post) => post._id);
  const demoComments = await Comment.find({ post: { $in: postIds } }).select(
    "_id",
  );
  const commentIds = demoComments.map((comment) => comment._id);

  await Vote.deleteMany({
    $or: [
      { user: { $in: userIds } },
      { post: { $in: postIds } },
      { comment: { $in: commentIds } },
    ],
  });
  await Comment.deleteMany({ _id: { $in: commentIds } });
  await Post.deleteMany({ _id: { $in: postIds } });
  await Community.deleteMany({ _id: { $in: communityIds } });
  await User.deleteMany({ _id: { $in: userIds } });
}

async function importDevData() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to import development data while NODE_ENV=production",
    );
  }

  const database = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD,
  );
  await mongoose.connect(database);
  await Vote.syncIndexes();
  await removePreviousDemoData();

  const users = [];
  for (const userData of usersData) {
    users.push(
      await User.create({ ...userData, password, passwordConfirm: password }),
    );
  }

  const communities = await Community.create(
    communitiesData.map((community) => ({
      ...community,
      owner: users[community.owner]._id,
    })),
  );

  const posts = await Post.create(
    postsData.map((post) => ({
      ...post,
      author: users[post.author]._id,
      community: communities[post.community]._id,
      hotScore: post.score,
    })),
  );

  const comments = await Comment.insertMany(
    commentsData.map(([post, author, body]) => ({
      post: posts[post]._id,
      author: users[author]._id,
      body,
      score: 1,
      upvotes: 1,
    })),
  );

  await Post.bulkWrite(
    posts.map((post, index) => ({
      updateOne: {
        filter: { _id: post._id },
        update: {
          commentsCount: commentsData.filter(
            ([postIndex]) => postIndex === index,
          ).length,
        },
      },
    })),
  );

  await Vote.insertMany([
    ...posts.slice(0, 4).map((post, index) => ({
      user: users[(index + 1) % users.length]._id,
      post: post._id,
      value: 1,
    })),
    ...posts.slice(4).map((post, index) => ({
      user: users[(index + 2) % users.length]._id,
      post: post._id,
      value: 1,
    })),
    ...comments.slice(0, 8).map((comment, index) => ({
      user: users[(index + 2) % users.length]._id,
      comment: comment._id,
      value: 1,
    })),
  ]);

  console.log(
    `Imported ${users.length} users, ${communities.length} communities, ${posts.length} posts, ${comments.length} comments, and demo votes.`,
  );
  console.log("Demo password for every user: GameForum123!");
}

importDevData()
  .catch((error) => {
    console.error("Development data import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
