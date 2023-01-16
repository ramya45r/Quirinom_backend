const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

//create schema
const userSchema = new mongoose.Schema(
  {
    firstName: {
      required: [true, "First name is required"],
      type: String,
    },
    lastName: {
      required: [true, "Last name is required"],
      type: String,
    },
    profilePhoto: {
      type: String,
      
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    bio: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Hei buddy Password is required"],
    },
    postCount: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["Admin", "Guest", "Blogger"],
    },
    // isFollowing: {
    //   type: Boolean,
    //   default: false,
    // },
    // isUnFollowing: {
    //   type: Boolean,
    //   default: false,
    // },
   
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
); 



//Hash password

userSchema.pre("save", async function (next) {
  if(!this.isModified('password')){
    next()
  }


  //hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
//match password
userSchema.methods.isPasswordMatched = async function (enteredPassword){
  return await bcrypt.compare(enteredPassword,this.password);
}

//Compile schema into model
const User = mongoose.model("User", userSchema);

module.exports = User;
