const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/helper');
const User = require("../models/user");

//Middle ware which handles the authentication part and checks whether the person is authenticated and authorized or not

exports.isAuth = async(req,res,next)=>{
  const token = req.headers?.authorization;//Retreives the token from the header
  if(!token)  return sendError(res,'Invalid token');//NO token means unauthorized
  const jwtToken = token.split('Bearer ')[1]//Token splitting as it is attached with an extra strign concatenation
  if(!jwtToken){
    return sendError(res,'Invalid Token', 401);
  }
  //Verifying that whether the token is valid or not and if valid then decode it
  const decode= jwt.verify(jwtToken,process.env.JWT_SECRET);
  const {userId} = decode//valid token after decode provides userid

  if(!userId){
    return sendError(res,'Invalid Token',401);//No user id means invalid token
  }
  const user = await User.findById(userId);//Fetches user details from the database by userid
  
  if(!user){
    return sendError(res,'Invalid User Token',404);
  }
  req.user = user;//attaching user details to req
  next();
}

//Middleware which checks whether the current user is admin or not if it is already authentic hence  should be used after isAuth middleware 
exports.isAdmin=(req,res,next)=>{
  const {user} = req;//fetching user details from req which wass attached b isAuth
  // console.log(user);
  //If not admin throw error
  if(user.role!='admin'){
    return sendError(res,'uauthorized Access');
    
  }
  next();
}