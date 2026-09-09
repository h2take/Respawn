const factory = require("./handlerFactory");
const community = require("../models/communityModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.setOwner = (req, res, next) => {
  if (!req.body.owner) req.body.owner = req.user.id;
  next();
};

exports.checkCommunityOwnership = catchAsync(async (req, res, next) => {
  const communityDoc = await community.findById(req.params.id);

  if (!communityDoc) {
    return next(new AppError("No community found with that ID", 404));
  }

  if (
    communityDoc.owner.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new AppError("You do not have permission to perform this action", 403),
    );
  }

  next();
});

exports.joinCommunity = catchAsync(async (req, res, next) => {
  const updatedCommunity = await community.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { members: req.user.id } },
    { new: true },
  );

  if (!updatedCommunity) {
    return next(new AppError("No community found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      community: updatedCommunity,
    },
  });
});

exports.leaveCommunity = catchAsync(async (req, res, next) => {
  const updatedCommunity = await community.findByIdAndUpdate(
    req.params.id,
    { $pull: { members: req.user.id } },
    { new: true },
  );

  if (!updatedCommunity) {
    return next(new AppError("No community found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      community: updatedCommunity,
    },
  });
});

exports.createCommunity = factory.createOne(community);
exports.getAllCommunities = factory.getAll(community);
exports.getCommunity = factory.getOne(community);
exports.updateCommunity = factory.updateOne(community);
exports.deleteCommunity = factory.deleteOne(community);
