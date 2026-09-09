const Vote = require("../models/voteModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const { calculateHotScore } = require("../models/postModel");

const voteTarget = (targetType) =>
  catchAsync(async (req, res, next) => {
    const isPost = targetType === "post";
    const targetId = isPost ? req.params.postId : req.params.commentId;
    const value = Number(req.body.value);
    const Target = isPost ? Post : Comment;
    const targetField = isPost ? "post" : "comment";

    if (![1, -1].includes(value)) {
      return next(new AppError("Vote value must be 1 or -1", 400));
    }

    const target = await Target.findById(targetId);
    if (!target) {
      return next(new AppError(`No ${targetType} found with that ID`, 404));
    }

    const existingVote = await Vote.findOne({
      user: req.user.id,
      [targetField]: targetId,
    });

    let action;

    if (existingVote && existingVote.value === value) {
      await Vote.deleteOne({ _id: existingVote._id });
      await Target.findByIdAndUpdate(targetId, {
        $inc: {
          [value === 1 ? "upvotes" : "downvotes"]: -1,
          score: value === 1 ? -1 : 1,
        },
      });
      action = "removed";
    } else if (existingVote) {
      await Vote.findByIdAndUpdate(existingVote._id, { value });
      await Target.findByIdAndUpdate(targetId, {
        $inc: {
          upvotes: value === 1 ? 1 : -1,
          downvotes: value === -1 ? 1 : -1,
          score: value === 1 ? 2 : -2,
        },
      });
      action = "changed";
    } else {
      await Vote.create({
        user: req.user.id,
        [targetField]: targetId,
        value,
      });
      await Target.findByIdAndUpdate(targetId, {
        $inc: {
          [value === 1 ? "upvotes" : "downvotes"]: 1,
          score: value,
        },
      });
      action = value === 1 ? "upvoted" : "downvoted";
    }

    let updatedTarget = await Target.findById(targetId);

    if (isPost) {
      updatedTarget.hotScore = calculateHotScore(
        updatedTarget.score,
        updatedTarget.createdAt,
      );
      await updatedTarget.save();
    }

    res.status(200).json({
      status: "success",
      action,
      data: { target: updatedTarget },
    });
  });

exports.votePost = voteTarget("post");
exports.voteComment = voteTarget("comment");
