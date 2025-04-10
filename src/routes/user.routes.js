import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../utills/multer.middleware.js";

const router = Router();


router.route('/register').post(
    upload.field(
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImages',
            maxCount: 1
        }
    )
    ,registerUser)






export default router;