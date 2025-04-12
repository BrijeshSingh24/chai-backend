import {asyncHandler} from '../utills/asyncHandler.js';
import { ApiError } from '../utills/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utills/cloudinary.js';
import { ApiResponse } from '../utills/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => { 
   // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {username, email, fullName, password } = req.body
    console.log("email: ", email);
    console.log("username: ", username);
    console.log("fullname: ", fullName);

    // if(username === "" || email === "" || fullname === "" || password === ""){
    //     throw new ApiError(400, "Please fill all the fields");
    // }

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    const existedUser = await User.findOne({$or: [{username}, {email}]});

    if(existedUser){
        throw new ApiError(400, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("avatarLocalPath: ", avatarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log("coverImageLocalPath: ", coverImageLocalPath);

    if(!avatarLocalPath) {
        throw new ApiError(400, "Please upload an avatar");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("avatar: ", avatar);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(500, "Avatar upload oooofailed");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    // res.status(201).json({createdUser});

    res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )



})

export { registerUser }