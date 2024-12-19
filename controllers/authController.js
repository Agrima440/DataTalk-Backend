const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const crypto = require('crypto');
const generateOtp = require("../utils/generateOtp");
const { STATUS_CODES } = require("http");
const sendEmail = require("../utils/email");

 
const signToken=(id)=>{
  return jwt.sign({id},process.env.JWT_SECRET,{
    expiresIn:process.env.JWT_EXPIRES_IN
  })
}
const createSendToken=(user,res,message)=>{
  const token=signToken(user._id);
  const cookieOptions={
    expires:new Date(
      Date.now()+process.env.JWT_COOKIE_EXPIRES_IN *24*60*60*1000
    ),
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:process.env.NODE_ENV==="production"?"none":"Lax",

  }
  res.cookie("token",token,cookieOptions)
  user.password=undefined;
  user.Passwordconfirm=undefined;
  res.status(200).json({
success:true,
message,
token,
data:{
  user
}
  })
}

/////////// Sign Up //////////

exports.signup = async (req, res) => { 
    const {name, email, password, passwordconfirm} = req.body;
    // validation
    if (!name) {
      return res.json({ error: "Name is Required" });
    }
    if (!email) {
      return res
        .status(404)
        .json({ error: "Email is Required", success: false });
    }
    if (!password) {
      return res.json({ error: "Password is Required" });
    }
    // check user
    let existinguser = await User.findOne({ email });

    // existing user 
    if (existinguser) {
      return res.status(200).json({
        success: false,
        message: "Email Already Register, please login !",
      });
    }
    const otp = generateOtp();
    const otpExpires = Date.now() + 24 * 60 * 60 * 100;
    
    // Create user without passwordconfirm
    let newuser = await User.create({ name, email, password, otp, otpExpires });
    
    try {
await sendEmail({
  email:newuser.email,
  subject:"OTP for email Verification", 
  html:`<h1>Your OTP is : ${otp}</h1>`
})
createSendToken(newuser,res,"Registration Successful")

  }
  catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error in Registration",
      error,
    });
  }
};

////////////////// Verify Account By OTP /////////

exports.verifyAccount=async(req,res)=>{
  const {otp}=req.body;
  if(!otp){
    return res.status(400).json({success:false,
      message:"Otp is missing"
    })

  }
  const user=req.user;
  if(user.otp!==otp){
    return res.status(400).json({
      success:false,
      message:"Invalid OTP"
    })
  }
  if(Date.now()>user.otpExpires){
    return res.status(400).json({
      success:false,
      message:"OTP has expired. Please request a new OTP"
    })
    }
    user.isVerified=true,
    user.otp=undefined,
    user.otpExpires=undefined
    await user.save({validateBeforeSave:false})

    createSendToken(user,res,"Email has been verified")
 
}

////////// Resend OTP /////////////

exports.resendOTP=async(req,res)=>{
  const { email } = req.body;
  if(!email){
    return res.status(400).json({
      success:false,
      message:"Email is required to resend otp"
    })
  }
  const user=await User.findOne({email})
  if(!user){
    return res.status(400).json({
      success:false,
      message:"User Not Found"
    })
  }
  if(user.isVerified){
    return res.status(400).json({
 success:false,
      message:"User is already verified"
    })
  }
  const newOtp=generateOtp();
  user.otp=newOtp;
  user.otpExpires=Date.now()+24*60*60*1000;

  await user.save({validateBeforeSave:false})
try{
await sendEmail({
  email:user.email,
  subject:"Resend otp for Email Verification",
  html:`<h1>Your New Otp ${newOtp}</h1>`
})
res.status(200).json({
  success:true,
  message:"A new otp has sent to your email"
})
}
catch(error){
  user.otp=undefined;
  user.otpExpires=undefined;
  await user.save({validateBeforeSave:false})
  console.log(error);
  res.status(500).json({
    success: false,
    message: "Error in Resend OTP",
    error,
  });
}

}

///////////////////// Login ///////////////////..

exports.loginController = async (req, res) => {
  const { email, password} = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: "Please Provide Email and password",
      });
    }
   
    let user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password,user.password))) return res.json({ message: "User not found", success: false });
   createSendToken(user,res,"Login Successful")
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error in Login",
      error,
    });
  }
};
  
/////////////////// Logout /////////////////

exports.logoutController=async(req,res)=>{
  try{
res.cookie("token","loggedout",{
  expires:new Date(Date.now()+10*1000),
  httpOnly:true,
  secure:process.env.NODE_ENV==="production"
})
res.status(200).send({
  success:true,
  message:"Logged Out Successfully",
})
  }
  catch(error){
    await User.findByIdAndDelete(newuser.id)
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while logging out",
      error,
    });
  }
}

/////////////// Google Authentication /////////////

// exports.googleAuthController=async(req,res)=>{
//   try {
//       const { email, name, googleId } = req.body;

//       let user = await User.findOne({ $or: [{ email }, { googleId }] });

//       if (!user) {
//           user = new User({
//               name,
//               email,
//               googleId,
//               role: 'user'
//           });
//           await user.save();
//       } else {
//           user.googleId = googleId;
//           await user.save();
//       }

//       const token = jwt.sign({ _id: user._id }, process.env.JWT_KEY, {
//           expiresIn: '7d',
//       });

//       res.status(200)
//           .cookie("token", token, {
//               expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//               secure: process.env.NODE_ENV === "development" ? true : false,
//               httpOnly: process.env.NODE_ENV === "development" ? true : false,
//               sameSite: process.env.NODE_ENV === "development" ? true : false,
//           })
//           .json({
//               success: true,
//               message: 'Google authentication successful',
//               user: {
//                   name: user.name,
//                   email: user.email,
                 
//                   role: user.role
//               },
//               token
//           });
//   } catch (error) {
//       console.error('Google auth error:', error);
//       res.status(500).json({
//           success: false,
//           message: 'Authentication failed'
//       });
//   }
// }

 //////////////// Forget Password ////////////// 

exports.forgetPassword=async(req,res)=>{
  const {email}=req.body;
  const user=await User.findOne({email});
  if(!user){
    return res.status(400).json({
      success:false,
      message:"No user found"
    })
  }
  const otp=generateOtp();
  user.resetPasswordOTP=otp;
  user.resetPasswordOTPExpires=Date.now() + 300000;

  await user.save({validateBeforeSave:false});
  try{
    await sendEmail({
      email:user.email,
      subject:"Your password reset otp {valid for 5 min} ",
      html:`<h1>Your password reset Otp ${otp}</h1>`
    })
    res.status(200).json({
      success:true,
      message:"Password Reset Otp is send to your email"
    })
  }
  catch(error){
    user.resetPasswordOTP=undefined;
    user.resetPasswordOTPExpires=undefined;
    await user.save({
      validateBeforeSave:false
    })
    console.error('Error Reset Password:', error);
    res.status(500).json({
        success: false,
        message: 'Error Reset Password'
    });

  }
}

////////////////// Reset Password /////////////////

exports.resetPassword=async(req,res)=>{
  const {email,otp,password,passwordconfirm}=req.body;
  const user=await User.findOne({
    email,
    resetPasswordOTP:otp,
resetPasswordOTPExpires:{$gt:Date.now()},
  })

  if(!user) return res.status(400).json({
    success:false,
    message:"No user found"
  })
  user.password=password;
  user.passwordconfirm=passwordconfirm;
  user.resetPasswordOTP=undefined;
  user.resetPasswordOTPExpires=undefined

  await user.save();

  createSendToken(user,res,"Password reset successfully")
}

