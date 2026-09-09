const express = require("express");
const postController = require("../controllers/postController");
const authController = require("../controllers/authController");
const voteController = require("../controllers/voteController");
const commentRouter = require("./commentRoutes");

// mergeParams lets this router read :communityId from the parent router
const router = express.Router({ mergeParams: true });

router.use("/:postId/comments", commentRouter);

router
  .route("/:postId/vote")
  .put(authController.protect, voteController.votePost);

router
  .route("/")
  .get(postController.getAllPosts)
  .post(
    authController.protect,
    postController.setCommunityAndAuthor,
    postController.createPost,
  );

router
  .route("/search")
  .get(postController.searchPosts);

router
  .route("/:id")
  .get(postController.getPost)
  .patch(
    authController.protect,
    postController.checkPostOwnership,
    postController.updatePost,
  )
  .delete(
    authController.protect,
    postController.checkPostOwnership,
    postController.deletePost,
  );

module.exports = router;
