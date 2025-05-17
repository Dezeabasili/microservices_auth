const mongoose = require('mongoose')
// const bcrypt = require('bcrypt')

const UnverifiedUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
    },
    username: {
        type: String,
        required: [true, 'Please provide username'],
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false,
        select: false
    },
    verificationCode: {
        type: String,
    },
    verificationCodeExpiration: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


module.exports = mongoose.model('UnverifiedUser', UnverifiedUserSchema)