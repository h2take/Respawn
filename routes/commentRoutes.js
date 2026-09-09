const express = require("express");
const commentController = require("../controllers/commentController");
const authController = require("../controllers/authController");
const voteController = require("../controllers/voteController");

const router = express.Router({ mergeParams: true });

router
  .route("/:commentId/vote")
  .put(authController.protect, voteController.voteComment);

router
  .route("/")
  .get(commentController.getAllComments)
  .post(
    authController.protect,
    commentController.setPostAndAuthor,
    commentController.createComment,
  );

router
  .route("/:id")
  .get(commentController.getComment)
  .patch(
    authController.protect,
    commentController.checkCommentOwnership,
    commentController.updateComment,
  )
  .delete(
    authController.protect,
    commentController.checkCommentOwnership,
    commentController.deleteComment,
  );

module.exports = router;
