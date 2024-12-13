const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

module.exports.isAuthenticated = async (req, res, next) => {
  try {
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1];
    //validation
    if(!token){
      res.status(401).send({
        success:false,
        message:"UnAuthorized User"
      })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser=await User.findById(decoded.id)
    if(!currentUser){
      return res.status(400).json({
        success:false,
        message:"The User belonging to this token does not exist"
      })
    }
    req.user=currentUser;
    next();
  } catch (error) {
    console.log("Error in token verification:", error);
    return res.status(401).send({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports.checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      // console.log(user);

      // Check if the user has one of the required roles
      if (!roles.includes(user.role)) {
        return res.status(401).send({
          success: false,
          message: "Unauthorized Access",
        });
      }
      next();
    } catch (error) {
      console.log("Error in checkRole Middleware", error);
      res.status(400).send({
        success: false,
        message: "Error in role middleware",
        error,
      });
    }
  };
};
