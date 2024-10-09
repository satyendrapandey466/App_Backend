//This is set of midddlewares handling operations for reviews

const { isValidObjectId } = require("mongoose");
const Movie = require("../models/movie");
const Review = require("../models/review");
const { sendError, getAverageRatings } = require("../utils/helper");

//Helper function handling the add review to the movie by corresponding user
exports.addReview = async (req, res) => {
  const { movieId } = req.params; //Extracting movie id passed as params
  const { content, rating } = req.body; //Extracting reviews data from body
  const userId = req.user._id; //Extracting user id from headers which wass added in req from useAuth middleware

  if (!isValidObjectId(userId)) return sendError(res, "Invalid User!"); //Validating objectId of movie

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie!"); //Validating objectId of movie

  if (!req.user.isVerified)
    return sendError(res, "Please verify you email first!");

  const movie = await Movie.findOne({ _id: movieId, status: "public" }); //Searching  the movie id in database
  if (!movie) return sendError(res, "Movie not found!", 404); //Error  if movie doesn't exist

  //Checking if review has already document with same user and movie
  const isAlreadyReviewed = await Review.findOne({
    owner: userId,
    parentMovie: movie._id,
  });
  if (isAlreadyReviewed)
    return sendError(res, "Invalid request, review is already their!");

  //Creating new review with data
  const newReview = new Review({
    owner: userId,
    parentMovie: movie._id,
    content,
    rating,
  });

  //Pushing the new data to the movie review section
  movie.reviews.push(newReview._id);
  await movie.save(); //commiting the update

  // saving new review
  await newReview.save();

  const reviews = await getAverageRatings(movie._id);

  res.json({ message: "Your review has been added.", reviews });
};

//Helper function to handle update review 
exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;//Getting review id as param
  const { content, rating } = req.body;//Extrxting data from req.body
  const userId = req.user._id;//Extracting user details from header

  if (!isValidObjectId(reviewId)) return sendError(res, "Invalid Review ID!");//Validaating id

  //Searching reviews for document with owner as userid and id with reviewid
  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review) return sendError(res, "Review not found!", 404);//If not found error

  //Data update
  review.content = content;
  review.rating = rating;

  await review.save();//commiting update

  res.json({ message: "Your review has been updated." });
};

//Helper function handles the delete request of an review
exports.removeReview = async (req, res) => {
  const { reviewId } = req.params;//Extracting review id as params
  const userId = req.user._id;

  if (!isValidObjectId(reviewId)) return sendError(res, "Invalid review ID!");

  // Acquiring the review from database with same userid and reviewid
  const review = await Review.findOne({ owner: userId, _id: reviewId });
  if (!review) return sendError(res, "Invalid request, review not found!");//Not found case

  //Searching the movie with the movie id in that review
  const movie = await Movie.findById(review.parentMovie).select("reviews");
  //Filtering out the review id from the movie reviews
  movie.reviews = movie.reviews.filter((rId) => rId.toString() !== reviewId);


  //Deleting the review
  await Review.findByIdAndDelete(reviewId);

  // commiting movie update
  await movie.save();

  res.json({ message: "Review removed successfully." });
};

//Helper function which returns details of user and review for a movie as an array
exports.getReviewsByMovie = async (req, res) => {

  const { movieId } = req.params;//Getting movieId as param

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie ID!");//validatoing

  //Finding the movie into movie cluster and then populating the object relations as each movie reviews section will contain 
  //object id of reviews then populating the reviews user sectin to get details of user
  const movie = await Movie.findById(movieId)//populate expression which popultaes the reviews of movie and selects the reviews
    .populate({
      path: "reviews",
      populate: { //Then populate the owner of the review and retreives only name id is retreived by default
        path: "owner",
        select: "name",
      },
    })
    .select("reviews title");

    //Formatting the data
  const reviews = movie.reviews.map((r) => {
    const { owner, content, rating, _id: reviewID } = r;
    const { name, _id: ownerId } = owner;

    return {
      id: reviewID,
      owner: {
        id: ownerId,
        name,
      },
      content,
      rating,
    };
  });

  res.json({ movie: { reviews, title: movie.title } });	};
