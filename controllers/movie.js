const {
  sendError,
  formatActor,
  averageRatingPipeline,
  relatedMovieAggregation,
  getAverageRatings,
  topRatedMoviesPipeline,
} = require("../utils/helper");
const cloudinary = require("../cloud");
const Review = require("../models/review");
const Movie = require("../models/movie");
const { isValidObjectId } = require("mongoose");
// const { isValidObjectId } = require("mongoose");

//middleware which will handle uploading trailer to the cloud
exports.uploadTrailer = async (req, res) => {
  const { file } = req; //Acquiring the file from the req which was attached by multer
  if (!file) return sendError(res, "Video file is missing!"); //throw error if not presrent

  //upload to the cloud with resource type of vedio
  const { secure_url: url, public_id } = await cloudinary.uploader.upload(
    file.path,
    {
      resource_type: "video",
    }
  );
  //return its url and public id
  res.status(201).json({ url, public_id });
};

//Middleware to create new movie
exports.createMovie = async (req, res) => {
  const { file, body } = req; //Fetch if file is present in the req which can be poster

  console.log(body);
  //Acquire the details from the req.body
  const {
    title,
    storyLine,
    director,
    releseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = body;
  console.log(body);

  //Creation of new Movie document
  const newMovie = new Movie({
    title,
    storyLine,
    releseDate,
    status,
    type,
    genres,
    tags,
    cast,
    trailer,
    language,
  });

  console.log("hello")
  //If there is a director map it
  if (director) {
    if (!isValidObjectId(director))
      return sendError(res, "Invalid director id!");
    newMovie.director = director;
  }

  //If there is a writer map it
  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id!");
    }

    newMovie.writers = writers;
  }

  // uploading poster  if there is poster
  if (file) {
    const {
      secure_url: url, //mapping url as secure_url
      public_id,
      responsive_breakpoints, //responsive breakpoints for the responsive images of different dimensions
    } = await cloudinary.uploader.upload(file.path, {
      //transforming to the following dimension of data
      transformation: {
        width: 1280,
        height: 720,
      },

      responsive_breakpoints: {
        //Responsive breakpoint where how many breakpoints would be and what will be max widht of the image
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });

    //generating final poster with url and responsive breakpoints
    const finalPoster = { url, public_id, responsive: [] };

    //Breakpoint is fetched
    const { breakpoints } = responsive_breakpoints[0];
    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url);
      }
    }
    newMovie.poster = finalPoster;
  }

  //Saving the new movie
  await newMovie.save();

  // console.log(newMovie);
  res.status(201).json({
    movie: {
      id: newMovie._id,
      title,
    },
  });
};

//Middleware which will handle the movie update without poster
exports.updateMovieWithoutPoster = async (req, res) => {
  const { movieId } = req.params; //Fetching movie id from params

  //Checking if the id is valid
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie ID!");

  const movie = await Movie.findById(movieId); //finding the movie in database
  if (!movie) return sendError(res, "Movie Not Found!", 404);

  //Acquiring the movie details
  const {
    title,
    storyLine,
    director,
    releseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  //Updating it with the new details
  movie.title = title;
  movie.storyLine = storyLine;
  movie.tags = tags;
  movie.releseDate = releseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;

  //Updating director details if provided
  if (director) {
    if (!isValidObjectId(director))
      return sendError(res, "Invalid director id!");
    movie.director = director;
  }

  //Updating writer details if provided
  if (writers) {
    for (let writerId of writers) {
      //Checking valadity of each writer
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id!");
    }

    movie.writers = writers;
  }

  // Commiting the update
  await movie.save();

  res.json({ message: "Movie is updated", movie });
};

//Middleware to handle update request with poster
exports.updateMovieWithPoster = async (req, res) => {
  const { movieId } = req.params; //acquire movie id from params

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie ID!"); //Checking if valid object

  if (!req.file) return sendError(res, "Movie poster is missing!");

  const movie = await Movie.findById(movieId); //Finding the movie which is to be updated
  if (!movie) return sendError(res, "Movie Not Found!", 404);

  const {
    title,
    storyLine,
    director,
    releseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  //Updating with provided datails
  movie.title = title;
  movie.storyLine = storyLine;
  movie.tags = tags;
  movie.releseDate = releseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;

  //Updating director if provided
  if (director) {
    if (!isValidObjectId(director))
      return sendError(res, "Invalid director id!");
    movie.director = director;
  }
  //Updating writer if provided
  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id!");
    }

    movie.writers = writers;
  }

  // update poster
  // removing poster from cloud if there is any.
  const posterID = movie.poster?.public_id;
  if (posterID) {
    const { result } = await cloudinary.uploader.destroy(posterID); //Remove call to cloudinary to delete poster
    if (result !== "ok") {
      return sendError(res, "Could not update poster at the moment!");
    }

    // uploading new poster poster
    const {
      secure_url: url,
      public_id,
      responsive_breakpoints,
    } = await cloudinary.uploader.upload(req.file.path, {
      transformation: {
        width: 1280,
        height: 720,
      },
      responsive_breakpoints: {
        create_derived: true,
        max_width: 640,
        max_images: 3,
      },
    });

    const finalPoster = { url, public_id, responsive: [] };

    const { breakpoints } = responsive_breakpoints[0]; //Fetching breakpoints
    if (breakpoints.length) {
      for (let imgObj of breakpoints) {
        const { secure_url } = imgObj;
        finalPoster.responsive.push(secure_url); //Creating responsive urls
      }
    }

    movie.poster = finalPoster;
  }

  await movie.save(); //Commiting update

  res.json({ message: "Movie is updated", movie });
};

//Middleware which handles the update to the movie
exports.updateMovie = async (req, res) => {
  const { movieId } = req.params; //Fetches the movied Id as param
  const { file } = req; //fetching file added by multer

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie ID!"); //Validating movieID

  const movie = await Movie.findById(movieId); //searching the movie in Movie cluster
  if (!movie) return sendError(res, "Movie Not Found!", 404); //Not found

  //fetching
  const {
    title,
    storyLine,
    director,
    releseDate,
    status,
    type,
    genres,
    tags,
    cast,
    writers,
    trailer,
    language,
  } = req.body;

  //Updating
  movie.title = title;
  movie.storyLine = storyLine;
  movie.tags = tags;
  movie.releseDate = releseDate;
  movie.status = status;
  movie.type = type;
  movie.genres = genres;
  movie.cast = cast;
  movie.language = language;

  //If director is availbale update it
  if (director) {
    if (!isValidObjectId(director))
      return sendError(res, "Invalid director id!");
    movie.director = director;
  }

  //If writer is availbale update it
  if (writers) {
    for (let writerId of writers) {
      if (!isValidObjectId(writerId))
        return sendError(res, "Invalid writer id!");
    }

    movie.writers = writers;
  }

  // update poster
  if (file) {
    // removing poster from cloud if there is any.
    const posterID = movie.poster?.public_id;
    if (posterID) {
      const { result } = await cloudinary.uploader.destroy(posterID);
      if (result !== "ok") {
        return sendError(res, "Cou ld not update poster at the moment!");
      }

      // uploading poster
      const {
        secure_url: url,
        public_id,
        responsive_breakpoints,
      } = await cloudinary.uploader.upload(req.file.path, {
        transformation: {
          width: 1280,
          height: 720,
        },
        responsive_breakpoints: {
          create_derived: true,
          max_width: 640,
          max_images: 3,
        },
      });

      const finalPoster = { url, public_id, responsive: [] };

      const { breakpoints } = responsive_breakpoints[0];
      if (breakpoints.length) {
        for (let imgObj of breakpoints) {
          const { secure_url } = imgObj;
          finalPoster.responsive.push(secure_url);
        }
      }

      movie.poster = finalPoster;
    }
  }

  await movie.save();

  res.json({
    message: "Movie is updated",
    movie: {
      id: movie._id,
      title: movie.title,
      poster: movie.poster?.url,
      genres: movie.genres,
      status: movie.status,
    },
  });
};

//Middle ware to handle
exports.removeMovie = async (req, res) => {
  const { movieId } = req.params; //Acquiring movie id

  if (!isValidObjectId(movieId)) return sendError(res, "Invalid Movie ID!");

  const movie = await Movie.findById(movieId); //Getting the movie

  if (!movie) return sendError(res, "Movie Not Found!", 404);

  // check if there is poster or not.
  // if yes then we need to remove that.

  const posterId = movie.poster?.public_id;
  if (posterId) {
    const { result } = await cloudinary.uploader.destroy(posterId);
    if (result !== "ok")
      return sendError(res, "Could not remove poster from cloud!");
  }

  // removing trailer
  const trailerId = movie.trailer?.public_id;
  if (!trailerId) return sendError(res, "Could not find trailer in the cloud!");
  const { result } = await cloudinary.uploader.destroy(trailerId, {
    resource_type: "video",
  });
  if (result !== "ok")
    return sendError(res, "Could not remove trailer from cloud!");

  await Movie.findByIdAndDelete(movieId); //Delete document from the database

  res.json({ message: "Movie removed successfully." });
};

//Middle ware to get all the movies accepting paging
exports.getMovies = async (req, res) => {
  const { pageNo = 0, limit = 10 } = req.query; //Fetching the pageNo and limit from query params for paging

  //Fetch the documents and skip to the required document
  const movies = await Movie.find({})
    .sort({ createdAt: -1 })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit));

  //Results
  const results = movies.map((movie) => ({
    id: movie._id,
    title: movie.title,
    poster: movie.poster?.url,
    responsivePosters: movie.poster?.responsive,
    genres: movie.genres,
    status: movie.status,
  }));

  res.json({ movies: results });
};

//Middleware to fetchdetails of movie for update form
exports.getMovieForUpdate = async (req, res) => {
  const { movieId } = req.params; //Fetching movie ID

  if (!isValidObjectId(movieId)) return sendError(res, "Id is invalid!");

  //Search the movies in the movie the database and populating the actor details like
  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  //Returning formatted results
  res.json({
    movie: {
      id: movie._id,
      title: movie.title,
      storyLine: movie.storyLine,
      poster: movie.poster?.url,
      releseDate: movie.releseDate,
      status: movie.status,
      type: movie.type,
      language: movie.language,
      genres: movie.genres,
      tags: movie.tags,
      director: formatActor(movie.director),
      writers: movie.writers.map((w) => formatActor(w)),
      cast: movie.cast.map((c) => {
        return {
          id: c.id,
          profile: formatActor(c.actor),
          roleAs: c.roleAs,
          leadActor: c.leadActor,
        };
      }),
    },
  });
};

//Middleware handling the searchmovies with given text finding all movies
exports.searchMovies = async (req, res) => {
  const { title } = req.query;

  if (!title.trim()) return sendError(res, "Invalid request!");

  //...................................
  //....................................
  //Need to limit the search result too
  const movies = await Movie.find({ title: { $regex: title, $options: "i" } });
  res.json({
    //Refactoring the data
    results: movies.map((m) => {
      return {
        id: m._id,
        title: m.title,
        poster: m.poster?.url,
        genres: m.genres,
        status: m.status,
      };
    }),
  });
};

//To get the latest uploads by createdAt field of movie
exports.getLatestUploads = async (req, res) => {
  const { limit = 5 } = req.query; //limits from query

  //Finding all the movies by sorting the data in descending order wrt created At and returning only public status field
  const results = await Movie.find({ status: "public" })
    .sort("-createdAt")
    .limit(parseInt(limit));

  const movies = results.map((m) => {
    return {
      ///Refactoring the data
      id: m._id,
      title: m.title,
      storyLine: m.storyLine,
      poster: m.poster?.url,
      responsivePosters: m.poster.responsive,
      trailer: m.trailer?.url,
    };
  });
  res.json({ movies });
};

//Middleware handling the single movie
exports.getSingleMovie = async (req, res) => {
  const { movieId } = req.params;

  // mongoose.Types.ObjectId(movieId)//Can be used to conver string to mongo Object data type

  if (!isValidObjectId(movieId))
    return sendError(res, "Movie id is not valid!");

  //finding movie with movieId while populating director, writers, cast by actor schema
  const movie = await Movie.findById(movieId).populate(
    "director writers cast.actor"
  );

  //Aggregate function to find average rating of movie
  const [aggregatedResponse] = await Review.aggregate(
    averageRatingPipeline(movie._id)
  );

  const reviews = {};

  //Formatting the reveiws with the average rating and reviewcount
  if (aggregatedResponse) {
    const { ratingAvg, reviewCount } = aggregatedResponse;
    reviews.ratingAvg = parseFloat(ratingAvg).toFixed(1);
    reviews.reviewCount = reviewCount;
  }

  const {
    _id: id,
    title,
    storyLine,
    cast,
    writers,
    director,
    releseDate,
    genres,
    tags,
    language,
    poster,
    trailer,
    type,
  } = movie;

  //Formatting thedata to be send to the requestor
  res.json({
    movie: {
      id,
      title,
      storyLine,
      releseDate,
      genres,
      tags,
      language,
      type,
      poster: poster?.url,
      trailer: trailer?.url,
      cast: cast.map((c) => ({
        id: c._id,
        profile: {
          id: c.actor._id,
          name: c.actor.name,
          avatar: c.actor?.avatar?.url,
        },
        leadActor: c.leadActor,
        roleAs: c.roleAs,
      })),
      writers: writers.map((w) => ({
        id: w._id,
        name: w.name,
      })),
      director: {
        id: director._id,
        name: director.name,
      },
      reviews: { ...reviews },
    },
  });
};

//Middleware which fetches related movies by comparing tags of the current movie with other movie
exports.getRelatedMovies = async (req, res) => {
  const { movieId } = req.params;
  if (!isValidObjectId(movieId)) return sendError(res, "Invalid movie id!");

  const movie = await Movie.findById(movieId); //Finding movie in the movie database

  const movies = await Movie.aggregate(
    relatedMovieAggregation(movie.tags, movie._id)//Finding the movies which have same tags as current movie
  );

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);//Getting average rating of the movie

    // Foramatting the movie data and adding the review to the formatted movie
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };
  const relatedMovies = await Promise.all(movies.map(mapMovies)); //awaiting for all responses to be resolved

  res.json({ movies: relatedMovies });
};

//Middleware fetches top rated movies for its type
exports.getTopRatedMovies = async (req, res) => {
  const { type = "Film" } = req.query;
  
  // Fetching all the movies with required type having highest rating
  const movies = await Movie.aggregate(topRatedMoviesPipeline(type));

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id); //Fetching the reviews of that movie

    ///Formatting and adding reviews data to the movie data
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      responsivePosters: m.responsivePosters,
      reviews: { ...reviews },
    };
  };
  //Wait for resolving all the movie which were fetched by getAvaerageRatings
  const topRatedMovies = await Promise.all(movies.map(mapMovies));

  res.json({ movies: topRatedMovies });
};

//Miidle ware which searches movie with query text without any authentication
exports.searchPublicMovies = async (req, res) => {
  const { title } = req.query;//Fetching the name from query parameter

  if (!title.trim()) return sendError(res, "Invalid request!");

  //Searching the Movie cluster with all documents with movi name like provided title and status has public
  const movies = await Movie.find({
    title: { $regex: title, $options: "i" },
    status: "public",
  });

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id);//fetch the average rating of that movie

    //Format it to the required format and add reviews data too
    return {
      id: m._id,
      title: m.title,
      poster: m.poster?.url,
      responsivePosters: m.poster?.responsive,//adding responsive url for the small poster purpose
      reviews: { ...reviews },
    };
  };

  const results = await Promise.all(movies.map(mapMovies));//await to resolve all promises

  res.json({
    results,
  });
};

