const expressAsyncHandler = require("express-async-handler");
const Filter = require("bad-words");
const fs = require("fs");
const Post = require("../../models/post/Post");
const validateMongodbId = require("../../utils/validateMongodb");
const User = require("../../models/user/User");

const cloudinaryUploadImg = require("../../utils/cloudinary");

// create Post----------------------
const createPostCtrl = expressAsyncHandler(async (req, res) => {
  const { _id } = req.user;
  const filter = new Filter();
  const isProfane = filter.isProfane(req.body.title, req.body.description);
  //Block user
  if (isProfane) {
    await User.findByIdAndUpdate(_id, {
      isBlocked: true,
    });
    throw new Error(
      "Creating Failed because it contains profane words and you have been blocked"
    );
  }

  //1. get the path to img
  const localPath = `public/images/posts/${req.file.filename}`;
  //2.upload to cloudinary
  const imgUploaded = await cloudinaryUploadImg(localPath);
  try {
    const post = await Post.create({
      ...req.body,
      user: _id,
      image:imgUploaded?.url,
    });
    res.json(post);
    //Remove uploaded img
  } catch (error) {
    res.json(error);
  }
});

//--------------Fetch all posts --------------------------------//
const fetchPostsCtrl = expressAsyncHandler(async (req, res) => {
  const hasCategory =req.query.category
  try {
    //check if it has a category
    if(hasCategory){
      const posts = await Post.find({category:hasCategory}).populate("user").sort('-createdAt');
      res.json(posts)
    }else{
      const posts = await Post.find({}).populate("user").populate("user").sort("-createdAt");
    res.json(posts);
    }
    
  } catch (error) {
    res.json(error);
  }
});
//--------------Fetch a single post --------------------------------//
const fetchPostCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const post = await Post.findById(id).populate("user");
    //update number of views
    await Post.findByIdAndUpdate(
      id,
      {
        $inc: { numViews: 1 },
      },
      { new: true }
    );
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//----------search post-------------------------------------//
const searchPostController = expressAsyncHandler(async (req, res) => {
  const query = req.query.q
  try {
    const posts = await Post.find({
      $or: [
        { title: { $regex: new RegExp("^" + query + ".*", "i") } },
        { description: { $regex: new RegExp("^" + query + ".*", "i") } },
        { category: { $regex: new RegExp("^" + query + ".*", "i") } },
      ],
    })
    res.status(200).json(posts)
  } catch (error) {
    throw new Error(error.message)
  }
})
//--------------Update post --------------------------------//
const updatePostCtrl = expressAsyncHandler(async (req, res) => {
  console.log(req.user);
  const { id } = req.params;
  validateMongodbId(id);
  try {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        ...req.body,
        user:req.user?._id,
      },
      {
        new: true,
      }
    );
    res.json(post);
  } catch (error) {
    res.json(error);
  }
});

//--------------Delete post --------------------------------//
const deletePostCtrl =expressAsyncHandler(async (req,res)=>{
  const {id} = req.params;
  validateMongodbId(id);
  try{
  const post =await Post.findOneAndDelete(id);
  res.json(post);
  }catch(error){
    res.json(error)
  }
  res.json("Delete")

})









module.exports = {
  createPostCtrl,
  fetchPostsCtrl,
  fetchPostCtrl,
  updatePostCtrl,
  deletePostCtrl,
  searchPostController,
 
  
};
