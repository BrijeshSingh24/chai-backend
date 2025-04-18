import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username: {
        type: String,    // data type
        required: true,  // required field
        unique: true,   // unique index
        lowercase: true, // convert to lowercase
        trim: true,  // remove white spaces
        index: true // for faster search
    },
    email: {
        type: String,    // data type
        required: true,  // required field
        unique: true,   // unique index
        lowercase: true, // convert to lowercase
        trim: true,  // remove white spaces
    },
    fullName: {
        type: String,    // data type
        required: true,  // required field
        trim: true,  // remove white spaces
        index: true // for faster search
    },
    avatar: {
        type: String,    // cloudinary url
        required: true,  // required field
    },
    coverImage: {
        type: String,    // cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,    // data type
        required: [true, 'Password is required!'],  // required field
    },
    refreshToken: {
        type: String,    // data type
    },
}, {timestamps: true}
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)