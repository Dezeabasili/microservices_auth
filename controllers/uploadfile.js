
const User = require("./../models/users");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const upload_file = async (req, res, next) => {
  try {
    // get the user
    const user = await User.findById(req.userInfo.id);
    if (!user)
      return next(createError("fail", 404, "this user does not exist"));

    if (req.body.urlArray.length == 0)
      return next(createError("fail", 404, "no secure URL from cloudinary"));

    if (req.body.fileCode == "profilephoto") {
      const photoId = user.photo_id;
      user.photo = req.body.urlArray[0];
      user.photo_id = req.body.public_idArray[0];
      await user.save();
      if (photoId) {
        await cloudinary.uploader.destroy(photoId);
      }
    } 
    

    res.status(200).json("file(s) uploaded successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = upload_file;
