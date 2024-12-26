import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { emailRegex } from "../constants.js"

const userSchema = new Schema({
    userName: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        lowercase: true,
        trim: true,
        index: true //for indexing while search
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (value) {
                return emailRegex.test(value);
            },
            message: "Invalid email format",
        },
    },
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
        index: true
    },
    avatar: {
        type: String,// cloudinary url
        required: [true, "Avatar is required"],
    },
    coverImage: {
        type: String,// cloudinary url
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    },
    deletionDate: { 
        type: Date, 
        // index: true,
        default: null 
    }
},
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields

    }
)
// Add a partial index for deletionDate
userSchema.index({ deletionDate: 1 }, { partialFilterExpression: { deletionDate: { $exists: true } } });


userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next() // isModified by default available here that check field is modified or not

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password) // this will return a boolean value that field is match or not
}
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    ) // sign use for generate toke and we give the value those we want to keep in token in this operation async await is optional because this happens fast 
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema)