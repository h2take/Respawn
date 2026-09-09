const Post = require("../models/postModel");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// for nested routes: /communities/:communityId/posts
exports.setCommunityAndAuthor = (req, res, next) => {
  if (!req.body.community) req.body.community = req.params.communityId;
  if (!req.body.author) req.body.author = req.user.id;
  next();
};

exports.checkPostOwnership = catchAsync(async (req, res, next) => {
  // check if the post exists and if the user is the owner of the post or an admin
  const post = await Post.findById(req.params.id);
  if (!post) {
    return AppError("No post found with that ID", 404);
  }
  if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
    return AppError("You are not the owner of this post", 403);
  }
  next();
});

exports.searchPosts = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  if (!search) {
    return next(new AppError("Please provide a search query", 400));
  }

  const posts = await Post.find(
    { $text: { $search: search } },
    { textScore: { $meta: "textScore" } },
  ).sort({ textScore: { $meta: "textScore" } });

  res.status(200).json({
    status: "success",
    results: posts.length,
    data: { posts },
  });
});

exports.createPost = factory.createOne(Post, [
  { path: "author", select: "name photo" },
  { path: "community", select: "name" },
]);
exports.getAllPosts = factory.getAll(Post);
exports.getPost = factory.getOne(Post, { path: "comments" });
exports.updatePost = factory.updateOne(Post);
exports.deletePost = factory.deleteOne(Post);
