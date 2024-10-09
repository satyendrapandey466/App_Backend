const express = require("express");

const {
  createActor,
  updateActor,
  removeActor,
  searchActor,
  getLatestActors,
  getSingleActor,
  getActors,
} = require("../controllers/actor");
const { uploadImage } = require("../middlewares/multer");
const { actorInfoValidator, validate } = require("../middlewares/validator");
const { isAuth, isAdmin } = require("../middlewares/isAuth");

// Router creation of the actor router
const router = express.Router();

//Handlign new creation request of actor
router.post(
  "/create",
  uploadImage.single("avatar"),
  isAuth,
  isAdmin,
  actorInfoValidator,
  validate,
  createActor
);

//Handling update request for the users requires id of actor
router.post(
  "/update/:actorId",
  uploadImage.single("avatar"),
  isAuth,
  isAdmin,
  actorInfoValidator,
  validate,
  updateActor
);

//Handles delete request
router.delete("/:actorId", isAuth, isAdmin, removeActor);

//Handles search by text requests having query parameters containing text
router.get("/search", isAuth, isAdmin, searchActor);

// Handles the getting latest actors with paggination support
router.get("/actors", isAuth, isAdmin, getActors);

//Handles latest upload with a limit of 12
router.get("/latest-uploads", isAuth, isAdmin, getLatestActors);

//Handles the fetch request of data of a single actor via id
router.get("/single/:id", getSingleActor);

module.exports = router;
