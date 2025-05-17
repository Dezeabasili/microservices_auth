const express = require("express");
const dotenv = require("dotenv").config();
const cookieParser = require("cookie-parser");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
// const corsConfiguration = require("./utils/corsConfiguration")

const schedule = require("node-schedule")
const UnverifiedUser = require('./models/unverified_users')
const amqplib = require('amqplib');
const exchangeName = "direct_logs";
const authRouter = require("./routes/auth");
const app = express();
const PORT = process.env.PORT || 4000;

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("connected to MongoDB");
  } catch (err) {
    //console.log(err.msg);
    console.log("err from Mongodb");
  }
};

app.use(
  // cors(corsConfiguration)
  cors({origin: "https://meridian-hosts.com", credentials: true,})
);

app.use(cookieParser());

app.use(express.json())



app.use("/api/v1/auth", authRouter);

// app.get("/", (req, res) => {
//   const user = {name: "myname2"}
//   // channel.sendToQueue('auth_queue', Buffer.from(JSON.stringify(user)))
//   res.send("message was received in Auth app");
// });





app.use((err, req, res, next) => {
  // console.error('ERROR ', err)
  let error;
  if (err.name === "CastError") {
    error = { ...err };
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = 400;
    error.status = "fail";
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  if (err.name === "JsonWebTokenError") {
    error = { ...err };
    error.message = "Your access token has been tampered with";
    error.statusCode = 401;
    error.status = "fail";
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  if (err.name === "TokenExpiredError") {
    error = { ...err };
    error.message = "Your access token has expired";
    error.statusCode = 401;
    error.status = "fail";
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  if (err.name === "ValidationError") {
    error = { ...err };
    // get all the errors from the error object
    const validationErrorsArray = Object.values(error.errors);

    // map through the validationErrorsArray to retrieve all the error messages
    const errorMessages = validationErrorsArray.map((vError) => vError.message);

    // join all the messages together
    const combinedMessage = errorMessages.join(". ");
    error.message = combinedMessage;
    error.statusCode = 400;
    error.status = "fail";
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  if (err.code === 11000) {
    error = { ...err };
    error.message = `You tried to use a duplicate value, ${JSON.stringify(
      err.keyValue
    )}. Please provide a different value`;
    error.statusCode = 400;
    error.status = "fail";
    //console.log(error);
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  const errorStatus = err.status || "error";
  const errorStatusCode = err.statusCode || 500;
  const errorMessage = err.message || "Something went wrong !!";

  res.status(errorStatusCode).json({
    status: errorStatus,
    message: errorMessage,
    error: err,
  });
});



// repeat task
schedule.scheduleJob('0 8 * * *', async () => {

  let usersToDelete = []
  // get every user in the unverified users collection
  const users = await UnverifiedUser.find()

  // delete unverified users whose verification codes have expired
  if (users.length > 0) {
    users.forEach(user => {
      if (Date.now() > new Date(user.verificationCodeExpiration).getTime()) {
        usersToDelete.push(user._id)
      }
    })
    
    if (usersToDelete.length > 0) {
      await UnverifiedUser.deleteMany({_id: {$in: usersToDelete}})
    }
  }
  
})




const server = app.listen(PORT, () => {
  
  connect();
  console.log("listening on port 4000");
  // const args2 = process.argv.slice(2);
  // const args = process.argv;
  // //console.log("args: ", args);
});

