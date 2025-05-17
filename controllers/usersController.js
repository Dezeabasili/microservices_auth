const User = require('./../models/users')
const amqplib = require('amqplib');
const bcrypt = require('bcrypt')
const createError = require('./../utils/error')
const passwordResetMail = require('../utils/passwordResetEmail')
const sendOutMail = require('../utils/handleEmail')
const rabbitMQ_connection = require('../utils/producer')

const crypto = require("crypto");
const path = require("path");
const sendSubscriptionMail = require("../utils/handleSubscriptionEmail");
const cloudinary = require("cloudinary").v2;
const axios = require("axios")
const sendMail = require("../mailtrap/mailconfig")
const subscription_mail = require("../mailtrap/subscription-mail")


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });


  const exchangeName = "topic_logs";
  const exchangeType = 'topic';
  const routing_key = ['auth.usersBooking.deleteMany', 'auth.hotelStaff.deleteMany', 'auth.hotelStaff.updateMany', 'auth.changeName.updateMany']
  let channel_users_producer;
  // let channel_02;
  
  const sendTask = async () => {
    const connection = await rabbitMQ_connection()
    channel_users_producer = await connection.createChannel();
    await channel_users_producer.assertExchange(exchangeName, exchangeType, {durable: false});
    //console.log("Connected to rabbitMQ authServices")

  }
  
  sendTask(); 


  
  // get all users
  const getAllUsers = async (req, res, next) => {
    try {
      const users = await User.find();
  
      res.status(200).json({
        number: users.length,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  };
  
  // get all staff of a hotel
  const getHotelStaff = async (req, res, next) => {
    try {
      const users = await User.find({_id: {$in: req.body.hotelStaff}});
  
      res.status(200).json({
        number: users.length,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  };
  
  // get a specific user
  const getUser = async (req, res, next) => {
    try {
      const user = await User.findById(req.params.user_id);
      if (!user)
        return next(createError("fail", 404, "this user does not exist"));

      res.status(200).json({
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
  // get a specific user by user email
  const findUser = async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user)
        return next(createError("fail", 404, "this user does not exist"));
      res.status(200).json({
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
  
  // update a specific user
  const updateUser = async (req, res, next) => {
    try {
      let Obj = {};
      if (req.body.roles) {
        if (
          req.body.roles * 1 != 2010 &&
          req.body.roles * 1 != 2020 &&
          req.body.roles * 1 != 2030
        )
          return next(
            createError("fail", 404, "user's role can only be 2010, 2020 or 2030")
          );
  
        Obj.roles = req.body.roles * 1;
      }
  
      if (req.body.active) {
        if (req.body.active.toLowerCase() === "yes") {
          Obj.active = true;
        } else if (req.body.active.toLowerCase() === "no") {
          Obj.active = false;
        }
      }
  
      const user = await User.updateOne({ email: req.body.email }, { $set: Obj });
      //console.log("user: ", user);
      if (user.matchedCount === 0)
        return next(createError("fail", 404, "This user does not exist"));
  
      res.status(200).json({
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
  
  // Admin deletes a specific user
  const deleteUser = async (req, res, next) => {
    try {
      // check if the user exists
      const userToDelete = await User.findById(req.params.user_id);
      if (!userToDelete)
        return next(createError("fail", 404, "this user does not exist"));
  
      // delete user's bookings
      channel_users_producer.publish(exchangeName, routing_key[0], Buffer.from(JSON.stringify({ user: req.params.user_id })));
  
      // delete user from hotel information if user is a staff or a manager
      channel_users_producer.publish(exchangeName, routing_key[1], Buffer.from(JSON.stringify({ user: req.params.user_id })));
  
      await User.findByIdAndDelete(req.params.user_id);
  
      res.status(204).json("User has been deleted");
    } catch (err) {
      next(err);
    }
  };
  
  // get user categories
  const usersByCategories = async (req, res, next) => {
    try {
      const userCategories = await User.aggregate([
        {
          $unwind: "$roles",
        },
        {
          $group: {
            _id: "$roles",
            numInCategory: { $sum: 1 },
            personsInCategory: { $push: "$username" },
          },
        },
        {
          $addFields: { role: "$_id" },
        },
        {
          $project: { _id: 0 },
        },
        {
          $sort: { numInCategory: -1 },
        },
      ]);
      res.status(200).json({
        data: userCategories,
      });
    } catch (err) {
      next(err);
    }
  };
  
  // the request handler below is for a logged in user who wants to change his/her data in the database
  const updateMyAccount = async (req, res, next) => {
    try {
      // get user with the user id
      const loggedInUser = await User.findById(req.userInfo.id);
      if (!loggedInUser)
        return next(createError("fail", 404, "This user no longer exists"));
  
      // check if user provided any information to update
      if (!req.body.email && !req.body.username && !req.body.name)
        return next(
          createError(
            "fail",
            400,
            "You did not provide any information to update"
          )
        );
  
      // get user information to update
      if (req.body.email) {
        // check if email already exist
        const duplicateEmail = await User.findOne({ email: req.body.email });
        if (duplicateEmail) {
          return next(createError("fail", 400, "email already exist"));
        }
        loggedInUser.email = req.body.email;
      }
      if (req.body.username) {
        // check if username already exist
        const duplicateUsername = await User.findOne({
          username: req.body.username,
        });
        if (duplicateUsername) {
          return next(createError("fail", 400, "username already exist"));
        }
        loggedInUser.username = req.body.username;
      }
      if (req.body.name) {
        loggedInUser.name = req.body.name;
        const staffInfo = {ref_number: req.userInfo.id, name: req.body.name}
        if (req.userInfo.assignedRoles == 2030 || req.userInfo.assignedRoles == 2020) {
          channel_users_producer.publish(exchangeName, routing_key[2], Buffer.from(JSON.stringify(staffInfo)));
        } else {
          channel_users_producer.publish(exchangeName, routing_key[3], Buffer.from(JSON.stringify(staffInfo)));
          //console.log("Sent data to review_services")
        }
      }  
      // update user information
      await loggedInUser.save();
  
      res.status(200).json("Your information has been updated");
    } catch (err) {
      next(err);
    }
  };
  
  // the request handler below is for a logged in user who wants to delete his/her account
  const deleteMyAccount = async (req, res, next) => {
    try {
      // get user with the user id
      const loggedInUser = await User.findById(req.userInfo.id).select("+active");
      if (!loggedInUser)
        return next(createError("fail", 404, "This user no longer exists"));
  
      // deactivate user
      loggedInUser.active = false;
  
      // update user information
      await loggedInUser.save();

      // delete user from hotel information if user is a staff or a manager
      channel_users_producer.publish(exchangeName, routing_key[1], Buffer.from(JSON.stringify({ user: req.params.user_id })));
  
      // delete user's bookings
      channel_users_producer.publish(exchangeName, routing_key[0], Buffer.from(JSON.stringify({ user: req.params.user_id })));

      // there is a query middleware in the user Schema that includes only users with active: true
      // before any query beginning with 'find' is executed.
  
      res.status(204).json("Sorry to see you leave");
    } catch (err) {
      next(err);
    }
  };
  
  // the request handler below is for a logged in user who wants to see his/her account information
  const seeMyAccount = async (req, res, next) => {
    try {
      //get user with the user id
      const loggedInUser = await User.findById(req.userInfo.id);
      if (!loggedInUser)
        return next(createError("fail", 404, "This user no longer exists"));
  
      // res.sendFile(path.join(__dirname, '..', 'views', "mines.html"));
      res.status(200).json({
        data: loggedInUser,
      });
    } catch (err) {
      next(err);
    }
  };
  
  // the request handler below is for updating the user's profile photo
  const seeMyPhoto = async (req, res, next) => {
    try {
      // get user with the user id
      const loggedInUser = await User.findById(req.userInfo.id);
      if (!loggedInUser)
        return next(createError("fail", 404, "This user no longer exists"));
  
      return res.status(200).json({ data: loggedInUser.photo });
    } catch (err) {
      next(err);
    }
  };
  
  // the request handler below is for deleting the user's profile photo
  const deleteMyPhoto = async (req, res, next) => {
    try {
      // get user with the user id
      const loggedInUser = await User.findById(req.userInfo.id);
      if (!loggedInUser)
        return next(createError("fail", 404, "This user no longer exists"));
      const publicId = loggedInUser.photo_id;
      loggedInUser.photo =
        "https://res.cloudinary.com/dmth3elzl/image/upload/v1705633392/profilephotos/edeo8b4vzeppeovxny9c.png";
      loggedInUser.photo_id = undefined;
  
      await loggedInUser.save();
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
  
      return res.status(204).json("profile photo changed successfully");
    } catch (err) {
      next(err);
    }
  };
  
  const handleSubscription = async (req, res, next) => {
    try {
      const { token } = req.body
      //get user with the submitted email
      const user = await User.findOne({ email: req.body.email.toLowerCase() });
      if (!user)
        return next(createError("fail", 404, "This user does not exist"));

      // check if user checked the recaptcha box
      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        `secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${token}` // Replace with your secret key
      );
  
      if (!response.data.success) {
        return next(createError('fail', 400, "Invalid CAPTCHA, go back to the subscription page and check the box to indicate you are not a robot"))
      } 
  
      user.password = undefined;

      const mail_template = subscription_mail(user.name)
      
      await sendMail(user.email, "Meridian Hosts Quarterly Newsletter", mail_template, "Newsletter mail")
  
      // await sendSubscriptionMail(user);
  
      res.status(200).json("Thank you for subscribing to our newsletters");
    } catch (err) {
      next(err);
    }
  };



  module.exports = {
    getAllUsers,
    getHotelStaff,
    getUser,
    findUser,
    updateUser,
    deleteUser,
    usersByCategories,
    updateMyAccount,
    deleteMyAccount,
    seeMyAccount,
    seeMyPhoto,
    deleteMyPhoto,
    handleSubscription,
  };
  