import {asyncHandler} from '../utills/asyncHandler.js';
import { ApiError } from '../utills/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utills/cloudinary.js';
import { ApiResponse } from '../utills/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }

}

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


const loginUser = asyncHandler(async (req, res) => {
    // req.body -> data from frontend,
    // username or email id,
    // find the user in DB,
    //  check the password,
    //  Access and Refresh Token generate,
    //  send cookies,

    const {email, username, password} = req.body;

    if(!(username || email )){
        throw new ApiError(400, "Username or Email Id is required!");
    }

    // if(!username || !email ){
    //     throw new ApiError(400, "Username or Email Id is required!");
    // }

    const user = await User.findOne({$or: [{username}, {email}]});

    if(!user){
        throw new ApiError(404, "User does not exist!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credencials!");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
    },
        "User logged in successfully"
    ))

    

})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, {
        $set: { refreshToken : undefined } 
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"))

})


const refreshAccessToken = asyncHandler(async(req, res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken || req.query.refreshToken;

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized! request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, " Invalid refresh Token");
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used!");
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, {
            accessToken,
            refreshToken: newRefreshToken
        }, "Access token refreshed successfully!"))
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");   
        
    }

})



export { registerUser, loginUser, logoutUser, refreshAccessToken };