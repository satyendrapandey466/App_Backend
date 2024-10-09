const crypto = require('crypto')
const cloudinary = require('../cloud')
const Review = require("../models/review");
//Function to send error.

exports.sendError = (res, error, statusCode = 401) => (
    res.status(statusCode).json({ error })
)

// Function to generate random bytes and returning a promise
exports.generateRandomByte = () => {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(30, (err, buff) => {
            if (err) reject(err);
            const buffString = buff.toString("hex");

            resolve(buffString);
        });
    });
};

//Function to throw error for the 404 not found 
exports.notFoundHandler = (req,res)=>{
    return this.sendError(res,"Not found",404);
}

//Helper function which handles the data upload to the cloud

exports.uploadImageToCloud = async (file) => {
    const { secure_url: url, public_id } = await cloudinary.uploader.upload(
      file,
      { gravity: "face", height: 500, width: 500, crop: "thumb" }//These aare the custom filters that can be applied like image resolution is set to 500*500
    );
  
    return { url, public_id };
  };
  
  //Helper function which formats the data. Filters out those data which are not sendable
  exports.formatActor = (actor) => {
    const { name, gender, about, _id, avatar } = actor;
    return {
      id: _id,
      name,
      about,
      gender,
      avatar: avatar?.url,
    };
  };

  //This is helper middleware which woll parse the JSON data from the frontend to javascrip Object form
  exports.parseData = (req, res, next) => {
    const { trailer, cast, genres, tags, writers } = req.body;
    if (trailer) req.body.trailer = JSON.parse(trailer);
    if (cast) req.body.cast = JSON.parse(cast);
    if (genres) req.body.genres = JSON.parse(genres);
    if (tags) req.body.tags = JSON.parse(tags);
    if (writers) req.body.writers = JSON.parse(writers);
  
    next();
  };
  

  //This is an mongoDB agrregation function which looks movieId into the 
  exports.averageRatingPipeline = (movieId) => {
    return [
      {
        $lookup: {
          from: "Review",
          localField: "rating",
          foreignField: "_id",
          as: "avgRat",
        },
      },
      {
        $match: { parentMovie: movieId },
      },
      {
        $group: {
          _id: null,
          ratingAvg: {
            $avg: "$rating",
          },
          reviewCount: {
            $sum: 1,
          },
        },
      },
    ];
  };
  
  exports.relatedMovieAggregation = (tags, movieId) => {
    return [
      {
        $lookup: {
          from: "Movie",
          localField: "tags",
          foreignField: "_id",
          as: "relatedMovies",
        },
      },
      {
        $match: {
          tags: { $in: [...tags] },
          _id: { $ne: movieId },
        },
      },
      {
        $project: {
          title: 1,
          poster: "$poster.url",
          responsivePosters: "$poster.responsive",
        },
      },
      {
        $limit: 5,
      },
    ];
  };
  
  exports.topRatedMoviesPipeline = (type) => {
    const matchOptions = {
      reviews: { $exists: true },
      status: { $eq: "public" },
    };
  
    if (type) matchOptions.type = { $eq: type };
  
    return [
      {
        $lookup: {
          from: "Movie",
          localField: "reviews",
          foreignField: "_id",
          as: "topRated",
        },
      },
      {
        $match: matchOptions,
      },
      {
        $project: {
          title: 1,
          poster: "$poster.url",
          responsivePosters: "$poster.responsive",
          reviewCount: { $size: "$reviews" },
        },
      },
      {
        $sort: {
          reviewCount: -1,
        },
      },
      {
        $limit: 5,
      },
    ];
  };
  
  exports.getAverageRatings = async (movieId) => {
    const [aggregatedResponse] = await Review.aggregate(
      this.averageRatingPipeline(movieId)
    );
    const reviews = {};
  
    if (aggregatedResponse) {
      const { ratingAvg, reviewCount } = aggregatedResponse;
      reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
      reviews.reviewCount = reviewCount;
    }
  
    return reviews;
  };
  