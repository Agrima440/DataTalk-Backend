const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt=require("bcryptjs")


const userSchema = mongoose.Schema({
  name: {
    type: String,
    Required: [true, "Name is Required"],
    trim:true,
    minlength:3,
    maxlength:30,
    index:true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    Required: [true, "Email is Required"],
    validate:[validator.isEmail, "Please provide a valid Email"]
  },
  password: {
    type: String,
    minlength: 3,
    required: function () {
      return !this.googleId;
    },
  },
  passwordconfirm:{
type:String,
required:[true,"Please confirm your password"],
validate:{
  validator:function(el){
    return el===this.password;
  },
  message:"Passwords are not same"
}
  },
  role: {
    type: String,
    enum: ["admin", "user", "guest"],
    default: "user",
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isVerified:{
    type:Boolean,
    default:false
  },
  otp: { type: String ,
    default:null

  },
  otpExpires: { type: Date ,
    default:null
  },
  resetPasswordOTP:{
    type: String ,
    default:null
  },
  resetPasswordOTPExpires:{
    type: Date ,
    default:null
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
},{
  timestamps:true,
});


userSchema.pre("save",async function (next){
  if(!this.isModified("password")) return next();
  this.password=await bcrypt.hash(this.password,12);
  this.passwordconfirm=undefined;
  next();
})

userSchema.methods.correctPassword=async function(password,userPassword){
  return await bcrypt.compare(password,userPassword);
}

const User = mongoose.model("User", userSchema);
module.exports=User
