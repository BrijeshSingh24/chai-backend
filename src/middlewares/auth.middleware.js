import {asyncHandler} from '../utills/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utills/ApiError.js';
import jwt from 'jsonwebtoken';

export const veryfyJWT = asyncHandler(async (req, _, next) => {
//  if res not is use then you can user underscore _
    try {
        const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "");
    
        if(!token) {
            throw new ApiError(401, "Unauthorized request!");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user) {
            // TODO: Discuss about frontend!
            throw new ApiError(401, "Invalid Access Token!");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token!");
    }

});

