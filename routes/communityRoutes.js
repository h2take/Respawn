const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const authController = require("../controllers/authController");
const postRouter = require("./postRoutes");

router.use("/:communityId/posts", postRouter);
router
  .route("/")
  .get(communityController.getAllCommunities)
  .post(
    authController.protect,
    communityController.setOwner,
    communityController.createCommunity,
  );

router.post(
  "/:id/join",
  authController.protect,
  communityController.joinCommunity,
);
router.delete(
  "/:id/leave",
  authController.protect,
  communityController.leaveCommunity,
);

router
  .route("/:id")
  .get(communityController.getCommunity)
  .patch(
    authController.protect,
    communityController.checkCommunityOwnership,
    communityController.updateCommunity,
  )
  .delete(
    authController.protect,
    communityController.checkCommunityOwnership,
    communityController.deleteCommunity,
  );

module.exports = router;
