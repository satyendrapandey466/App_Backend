const mongoose = require("mongoose");
const { imageUpload } = require("../middlewares/multer");

//This is the schema for Actors creation

const actorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    about: {
      type: String,
      trim: true,
      required: true,
    },
    gender: {
      type: String,
      trim: true,
      required: true,
    },
    avatar: {
      type: Object,
      url: String,
      public_id: String,
    },
  },
  { timestamps: true }
);

// Database indexing
actorSchema.index({ name: "text" });

//Model Creation
module.exports = mongoose.model("Actor", actorSchema);
