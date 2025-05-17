const User = require('./../models/users')
const UnverifiedUser = require('./../models/unverified_users')
const amqplib = require('amqplib');
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
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
const welcome_mail = require("../mailtrap/welcome-mail")
const passwordReset_mail = require("../mailtrap/passwordReset-mail")
const verificationCode_mail = require("../mailtrap/verificationCode-mail")

const exchangeName = "topic_logs";
const exchangeType = 'topic';
const routing_keys = ['auth.managersName.delete']
// const routing_keys = ["auth_01", "auth_02"]
let channel_auth_producer;
// let channel_02;

const sendTask = async () => {
  const connection = await rabbitMQ_connection()
  channel_auth_producer = await connection.createChannel();
  await channel_auth_producer.assertExchange(exchangeName, exchangeType, {durable: false});
  console.log("Connected to rabbitMQ authServices")

}

sendTask();



 
// const exchangeName = "topic_logs";
let channel_auth_consumer;
const binding_keys = ["auth_03"]

const consumeTask = async () => {
  // const connection = await amqplib.connect('amqp://localhost');
  const connection = await rabbitMQ_connection()
  channel_auth_consumer = await connection.createChannel();
  await channel_auth_consumer.assertExchange(exchangeName, exchangeType, {durable: false});
  await channel_auth_consumer.assertQueue('auth_queue', {durable: true});

  channel_auth_consumer.prefetch(1);
  //console.log("Waiting for messages in auth_queue");

  binding_keys.forEach((key) => {
    channel_auth_consumer.bindQueue("auth_queue", exchangeName, key);
  });



  channel_auth_consumer.consume('auth_queue', msg => {
    const product = JSON.parse(msg.content.toString());
      //console.log(`Received product: ${product.name}`);
      channel_auth_consumer.ack(msg)
  }, {noAck: false})
}

consumeTask();



// const register = async (req, res, next) => {

//     try {
//         const { username, email, password, name, token } = req.body
//         if (!password || !email || !username || !name) return next(createError('fail', 400, "forgot to type in your password or username or email"))
        
//         // check if user checked the recaptcha box
//         const response = await axios.post(
//           "https://www.google.com/recaptcha/api/siteverify",
//           `secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${token}` // Replace with your secret key
//         );
    
//         if (!response.data.success) {
//           return next(createError('fail', 400, "Invalid CAPTCHA, Signup again and check the box to indicate you are not a robot"))
//         } 

//         // check if username already exist
//         const duplicateUsername = await User.findOne({username: username})
//         if (duplicateUsername) {
//             return next(createError('fail', 400, "username already exist"))
//         }

//         // check if email already exist
//         const duplicateEmail = await User.findOne({email: email})
//         if (duplicateEmail) {
//             return next(createError('fail', 400, "email already exist"))
//         }

//         // To verify user email, generate a random number between 0 and 999999, then pad with leading zeros, 
//         const verificationCode = () => {  
//           return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
//         }

//         const emailCode = verificationCode()

//         const encryptedPassword = await bcrypt.hash(password, 12)
//         const newUser = new User({
//             name,
//             username,
//             email,
//             password: encryptedPassword, 
//             verificationCode: emailCode,
//             verificationCodeExpiration: Date.now() + 10 * 60 * 1000 //expires after 10 minutes
//         })

//         // There is a pre save hook in the users file, in the models directory, that updates the passwordResetTime property 
//         const user = await newUser.save()

//         const mail_template = verificationCode_mail(user.name, emailCode)

//         await sendMail(user.email, "Email Verification Code", mail_template, "VerificationCode mail")

//         // do not display the password to the user
//         user.password = undefined

//         // await sendOutMail(user)

//         res.status(201).json({data: user._id})
//     } catch (err) {
//         next(err)
//     }
// }



const register = async (req, res, next) => {

    try {
        const { username, email, password, name, token } = req.body
        if (!password || !email || !username || !name) return next(createError('fail', 400, "forgot to type in your password or username or email"))
        
        // check if user checked the recaptcha box
        const response = await axios.post(
          "https://www.google.com/recaptcha/api/siteverify",
          `secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${token}` // Replace with your secret key
        );
    
        if (!response.data.success) {
          return next(createError('fail', 400, "Invalid CAPTCHA, Signup again and check the box to indicate you are not a robot"))
        } 

        // check if username already exist
        const duplicateUsername = await User.findOne({username: username})
        if (duplicateUsername) {
            return next(createError('fail', 400, "username already exist"))
        }

        // check if email already exist
        const duplicateEmail = await User.findOne({email: email})
        if (duplicateEmail) {
            return next(createError('fail', 400, "email already exist"))
        }

        // To verify user email, generate a random number between 0 and 999999, then pad with leading zeros, 
        const verificationCode = () => {  
          return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        }

        const emailCode = verificationCode()

        const encryptedPassword = await bcrypt.hash(password, 12)
        const newUser = new UnverifiedUser({
            name,
            username,
            email,
            password: encryptedPassword, 
            verificationCode: emailCode,
            verificationCodeExpiration: Date.now() + 10 * 60 * 1000 //expires after 10 minutes
        })

        // There is a pre save hook in the users file, in the models directory, that updates the passwordResetTime property 
        const user = await newUser.save()

        const mail_template = verificationCode_mail(user.name, emailCode)

        await sendMail(user.email, "Email Verification Code", mail_template, "VerificationCode mail")

        // do not display the password to the user
        user.password = undefined

        // await sendOutMail(user)

        res.status(201).json({data: user._id})
    } catch (err) {
        next(err)
    }
}



const verifyEmail = async (req, res, next) => {

    try {
        const { user_id, verificationCode } = req.body
        if (!user_id || !verificationCode) return next(createError('fail', 400, "Forgot to type your email verification code"))
        

        // check if the submitted verification code is correct
        const unverifiedUser = await UnverifiedUser.findOne({_id: user_id, verificationCode: verificationCode}).select("+password")
        if (!unverifiedUser) {
            await UnverifiedUser.deleteOne({_id: user_id})
            return next(createError('fail', 400, "The verification code enterred is incorrect. Please Signup again"))
        }

        // check if the code has expired
        const notExpired = Date.now() < new Date(unverifiedUser.verificationCodeExpiration).getTime();
        if (!notExpired) {
          await UnverifiedUser.deleteOne({_id: user_id})
          return next(createError("fail", 401, "Verification code has expired. Please Signup again"))
        }


        const newUser = new User({
          name: unverifiedUser.name,
          username: unverifiedUser.username,
          email: unverifiedUser.email,
          password: unverifiedUser.password,
        })

      const user = await newUser.save()

      // delete the user after verification
      await UnverifiedUser.deleteOne({_id: user_id}) 

      // do not display the password to the user
      // user.password = undefined

      res.status(200).json({data: user._id})

    } catch (err) {
        next(err)
    }
}



const login = async (req, res, next) => {
    const pwd = req.body.password;
    const username = req.body.username.toLowerCase();
  
    try {
      if (!pwd || !username)
        return next(
          createError("fail", 400, "forgot to type in your password or username")
        );
      const user = await User.findOne({ username }).select("+password");
  
      if (!user)
        return next(
          createError("fail", 400, "no user matches the provided information")
        );
  
      // alternative way to compare user password and the encrypted password
      // using an instance method defined in the userSchema file.
      // const pwdCorrect = user.comparePasswords(pwd)
  
      const pwdCorrect = await bcrypt.compare(pwd, user.password);
      if (!pwdCorrect)
        return next(createError("fail", 400, "Sorry, cannot log you in"));
  
      const accessToken = jwt.sign(
        { id: user._id, assignedRoles: user.roles },
        process.env.ACCESS_TOKEN,
        { expiresIn: "1d" }
      );
      const refreshToken = jwt.sign(
        { id: user._id, assignedRoles: user.roles },
        process.env.REFRESH_TOKEN,
        { expiresIn: "1d" }
      );
  
      // Creates Secure Cookie with refresh token
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      });
  
      const assignedRoles = user.roles;
      const profilePhoto = user.photo;
      const user_id = user._id;
 
      res.status(200).json({
        accessToken,
        assignedRoles,
        profilePhoto,
        user_id,
      });
    } catch (err) {
      next(err);
    }
  };
  
  // the next two request handlers are for users who forgot their passwords.
  // such users should be able to remember their registered emails.
  const forgotPassword = async (req, res, next) => {
    try {
      const { token } = req.body
      // check if user checked the recaptcha box
      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        `secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${token}` // Replace with your secret key
      );
  
      if (!response.data.success) {
        return next(createError('fail', 400, "Invalid CAPTCHA, go back to login page and check the box to indicate you are not a robot"))
      } 


      // email address from the user is the only information known
      let user = await User.findOne({ email: req.body.email });
      if (!user)
        return next(createError("fail", 404, "this user does not exist"));
  
      // generate a random rest token
      const randomToken = crypto.randomBytes(32).toString("hex");
      const pass_token = await bcrypt.hash(randomToken, 12);
  
      user.passwordResetToken = pass_token;
      user.passwordTokenExpiration = Date.now() + 10 * 60 * 1000; //expires after 10 min
      user = await user.save();
  
      // send the generated token to the user's email
  
      // const passwordResetURL = `${req.protocol}://${req.hostname}/resetpassword/${randomToken}/${user._id}`
      const passwordResetURL = `${process.env.CLIENT_URL}/resetpassword/${randomToken}/${user._id}`;
  
      // const message = `Forgot your password? Click on the link below to submit a new password.\n${passwordResetURL}
      // \nIf you did not forget your password, please ignore this email`
  
      try {
        // await passwordResetMail(user, passwordResetURL);
        const mail_template = passwordReset_mail(passwordResetURL)

        await sendMail(user.email, "Password reset assistance", mail_template, "PasswordReset mail")
  
        res.status(200).json({
          status: "success",
          message: "Token sent to your email",
        });
      } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordTokenExpiration = undefined;
        await user.save();
        return next(
          createError("fail", 500, "Email was not sent. Please try again")
        );
      }
    } catch (err) {
      next(err);
    }
  };
  
  const resetPassword = async (req, res, next) => {
    try {
      // get the user that owns the reset token
      const user = await User.findById(req.params.user_id);
      if (!user)
        return next(createError("fail", 404, "this user does not exist"));
      const token = req.params.resettoken;
  
      // confirm the reset token
      const pwdCorrect = await bcrypt.compare(token, user.passwordResetToken);
      if (!pwdCorrect)
        return next(
          createError(
            "fail",
            401,
            "Token has been tampered with. Please request for another password reset token in the forgot password link"
          )
        );
  
      // confirm reset token has not expired
      const notExpired =
        Date.now() < new Date(user.passwordTokenExpiration).getTime();
      if (!notExpired)
        return next(
          createError(
            "fail",
            401,
            "Token has expired. Please request for another password reset token in the forgot password link"
          )
        );
  
      // encrypt new password and save to database
      const pwd = req.body.password;
      if (!pwd)
        return next(
          createError("fail", 400, "forgot to provide your new password")
        );
      const encryptedPassword = await bcrypt.hash(pwd, 12);
      user.password = encryptedPassword;
      //see the pre save hook in the users file, in the model directory, as an alternative way of setting the passwordResetTime property
      user.passwordResetTime = new Date();
      user.passwordTokenExpiration = undefined;
      user.passwordResetToken = undefined;
      await user.save();
  
      res
        .status(200)
        .json(
          "Password reset was successful. Please sign in with your new password "
        );
    } catch (err) {
      next(err);
    }
  };
  
  // the request handler below is for a logged in user who wants to change his/her password
  // the user is required to know his/her current password
  const changePassword = async (req, res, next) => {
    try {
      // get the user with the user id
      const loggedInUser = await User.findById(req.userInfo.id).select(
        "+password"
      );
      if (!loggedInUser)
        return next(createError("fail", 404, "This user no longer exists"));
  
      // compared the provided password with the password in the database
      const pwdCorrect = await bcrypt.compare(
        req.body.currentPassword,
        loggedInUser.password
      );
      if (!pwdCorrect)
        return next(
          createError(
            "fail",
            401,
            "Your password is incorrect. Please provide the correct password"
          )
        );
  
      // encrypt the new password and save to database
      const encryptedPassword = await bcrypt.hash(req.body.password, 12);
      loggedInUser.password = encryptedPassword;
      loggedInUser.passwordResetTime = new Date();
      await loggedInUser.save();
  
      res
        .status(200)
        .json(
          "Password reset was successful. Please sign in with your new password "
        );
    } catch (err) {
      next(err);
    }
  };




module.exports = { 
    register, 
    verifyEmail,  
    login,
    forgotPassword,
    resetPassword,
    changePassword, 
}