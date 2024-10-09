const { isValidObjectId } = require("mongoose");

const Actor = require("../models/actor");
const {
  sendError,
  uploadImageToCloud,
  formatActor,
} = require("../utils/helper");
const cloudinary = require("../cloud");

//Middleware function which handles the new acroe creation in
exports.createActor = async (req, res) => {
  const { name, about, gender } = req.body; //Acquirinf info from the body
  const { file } = req; //Acquiring file which placed in req by multer

  const newActor = new Actor({ name, about, gender }); //Creation of new actore document

  //If file exists then upload it to the cloud
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    newActor.avatar = { url, public_id }; //Update the avatar field of the actpr with id and url provided by cloudinary
  }
  // console.log(newActor);
  await newActor.save(); //Commit the save operation of crated actor document
  // const ans = { actor: formatActor(newActor) };
  // console.log(ans);
  res.status(201).json({ actor: formatActor(newActor) });
};

//Middleware handling the update request (i)update the data as provided and (ii)if file is also provided then
//deletes the old file from the cloud and upload the new provided file
exports.updateActor = async (req, res) => {
  const { name, about, gender } = req.body; //acquiring the data
  const { file } = req; //acquiring the file provided which was parsed by multer
  const { actorId } = req.params; //acquiring id from params

  if (!isValidObjectId(actorId)) return sendError(res, "Invalid request!");

  const actor = await Actor.findById(actorId); //search for the actor
  if (!actor) return sendError(res, "Invalid request, record not found!"); //Not found case

  const public_id = actor.avatar?.public_id; //If actor had already an avatar then  pulic_id of avatar

  // remove old image if there was one
  if (public_id && file) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove image from cloud!");
    }
  }

  // upload new avatar if there is one
  if (file) {
    const { url, public_id } = await uploadImageToCloud(file.path);
    actor.avatar = { url, public_id };
  }

  actor.name = name;
  actor.about = about;
  actor.gender = gender;

  await actor.save(); //Commit the save

  res.status(201).json({ actor: formatActor(actor) });
};

//Middleware handles the deletion of the actor from the database and deletion of avatar from cloud
exports.removeActor = async (req, res) => {
  const { actorId } = req.params; //Retreival of the actor_id from the params

  if (!isValidObjectId(actorId)) return sendError(res, "Invalid request!");

  const actor = await Actor.findById(actorId); //Searching for the user
  if (!actor) return sendError(res, "Invalid request, record not found!");

  const public_id = actor.avatar?.public_id; //Searching of the public_id of avatar

  // remove image if there was one
  if (public_id) {
    const { result } = await cloudinary.uploader.destroy(public_id);
    if (result !== "ok") {
      return sendError(res, "Could not remove image from cloud!");
    }
  }

  await Actor.findByIdAndDelete(actorId); //Delete the user from the database

  res.json({ message: "Record removed successfully." });
};

//Searching the actor via text
exports.searchActor = async (req, res) => {
  const { query } = req; //Reteiving the text fromm qury parameters

  const { name } = query;
  if (!name.trim()) return sendError(res, "Invalid request!"); //If no name query is  provided invalid input
  /*{
  // const result = await Actor.find({ $text: { $search: `"${query.name}"` } });
//searching the text in the database which was indexed
This method has problem that it only searches when a complete wprd ia matched
}*/

  //To find the all results having any substring as name
  const result = await Actor.find({
    name: { $regex: name, $options: "i" },
  });
  const actors = result.map((actor) => formatActor(actor)); //formatting the retreived document into the necessary format

  res.json({ results: actors });
};

//Middleware which provides the latest uploaded actors
exports.getLatestActors = async (req, res) => {
  //Sorting the database in descending order and then returning the all list of documents with limit of 12
  const result = await Actor.find().sort({ createdAt: "-1" }).limit(12);

  const actors = result.map((actor) => formatActor(actor)); //Formatting

  res.json(actors);
};

//Middleware which handles the search request of single user by id
exports.getSingleActor = async (req, res) => {
  const { id } = req.params; //Retreiving id of the user

  if (!isValidObjectId(id)) return sendError(res, "Invalid request!");

  //Searching the user
  const actor = await Actor.findById(id);
  if (!actor) return sendError(res, "Invalid request, actor not found!", 404);
  res.json({ actor: formatActor(actor) });
};

//Middleware which handles the pagination and return the actors accordingly
exports.getActors = async (req, res) => {
  const { pageNo, limit } = req.query; //extracting details from query params

  const actors = await Actor.find({})
    .sort({ createdAt: -1 }) //Sorting the database
    .skip(parseInt(pageNo) * parseInt(limit)) //skipping the values
    .limit(parseInt(limit)); //liniting the number of fetched  docs

  const profiles = actors.map((actor) => formatActor(actor)); //formatting the array oof actors
  res.json({
    profiles,
  });
};
