const Comment = require("../models/commentModel");
const factory = require("./handlerFactory");
const AppError = require("../utils/appError");
exports.setPostAndAuthor = (req, res, next) => {
  if (!req.body.post) req.body.post = req.params.postId;
  req.body.author = req.user.id;
  next();
};

exports.checkCommentOwnership = async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return next(AppError("No comment found with that ID", 404));
  }
  if (comment.author.toString() !== req.user.id) {
    return next(AppError('You do not have permission to perform this action on this comment', 403));
  }
  next();
};

exports.createComment = factory.createOne(Comment, [
  {
    path: "author",
    select: "name photo",
  },
  {
    path: "post",
    select: "title community",
    populate: {
      path: "community",
      select: "name",
    },
  },
]);
exports.getAllComments = factory.getAll(Comment);
exports.getComment = factory.getOne(Comment);
exports.updateComment = factory.updateOne(Comment);
exports.deleteComment = factory.deleteOne(Comment);
