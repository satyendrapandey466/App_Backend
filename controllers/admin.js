const Movie = require("../models/movie");
const Review = require("../models/review");
const User = require("../models/user");
const {
  topRatedMoviesPipeline,
  getAverageRatings,
} = require("../utils/helper");

//Middle ware which counts the number of the documents like number of reviews and users etc
exports.getAppInfo = async (req, res) => {
  //Count of each  cluster i.e. movie, user and reviews
  const movieCount = await Movie.countDocuments();
  const reviewCount = await Review.countDocuments();
  const userCount = await User.countDocuments();

  res.json({ appInfo: { movieCount, reviewCount, userCount } });
};

//Middleware which provides the most rated movies in the databse by performing aggragation logic
exports.getMostRated = async (req, res) => {
  const movies = await Movie.aggregate(topRatedMoviesPipeline());//performing aggreagation logic to get most rated movie

  //Formatting the movie data according to required data that is to be sent
  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);//get average rating of that movie

    //Adding the reviews to the movie object 
    return {
      id: m._id,
      title: m.title,
      reviews: { ...reviews },
    };
  };

  const topRatedMovies = await Promise.all(movies.map(mapMovies));//Resolve all the promises

  res.json({ movies: topRatedMovies });
};
