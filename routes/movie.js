const express = require("express");
const {
  uploadTrailer,
  createMovie,
  updateMovie,
  removeMovie,
  getMovies,
  getMovieForUpdate,
  searchMovies,
  getLatestUploads,
  getSingleMovie,
  getRelatedMovies,
  getTopRatedMovies,
  searchPublicMovies,
  updateMovieWithPoster,
  updateMovieWithoutPoster,
} = require("../controllers/movie");
const { isAuth, isAdmin } = require("../middlewares/isAuth");
const { uploadVideo, uploadImage } = require("../middlewares/multer");
const { validateMovie, validate, validateTrailer } = require("../middlewares/validator");
const { parseData } = require("../utils/helper");

//Creating movie router
const router = express.Router();

//Route for the uplaoding new trailer
router.post(
  "/upload-trailer",
  isAuth,
  isAdmin,
  uploadVideo.single("video"),
  uploadTrailer
);

//Route for creating new movie
router.post(
  "/create",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  // (req,res,next)=>{
  //   console.log(req.body);
  //   next()
  // },
  parseData,
  validateMovie,
  validateTrailer,
  validate,
  createMovie
);

//Route for the updating the movies without poster
router.patch(
  "/update-movie-without-poster/:movieId",
  isAuth,
  isAdmin,
  // parseData,
  validateMovie,
  validate,
  updateMovieWithoutPoster
);

//Route for the updating the movies with poster
router.patch(
  "/update-movie-with-poster/:movieId",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validate,
  updateMovieWithPoster
);

//Route to update movie with or without poster
router.patch(
  "/update/:movieId",
  isAuth,
  isAdmin,
  uploadImage.single("poster"),
  parseData,
  validateMovie,
  validate,
  updateMovie
);

//Route for the deleting the movies via movie Id
router.delete("/:movieId", isAuth, isAdmin, removeMovie);

router.get("/movies", isAuth, isAdmin, getMovies);
router.get("/for-update/:movieId", isAuth, isAdmin, getMovieForUpdate);
router.get("/search", isAuth, isAdmin, searchMovies);

router.get("/latest-uploads", getLatestUploads);
router.get("/single/:movieId", getSingleMovie);
router.get("/related/:movieId", getRelatedMovies);
router.get("/top-rated", getTopRatedMovies);
router.get("/search-public", searchPublicMovies);

module.exports = router;
