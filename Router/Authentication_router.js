let express=require("express");
let app=express();
let router = express.Router();
let multer =require("multer");
require("dotenv").config();
// let {S3Client} =require("@aws-sdk/client-s3");
let path=require("path");
let middleware=require("../middleware/middleware.js");

let upload = multer({storage:multer.memoryStorage()});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
let Auth_control = require("../Controllers/Authentication_controller.js");
router.get("/",Auth_control.root);
router.post("/register",Auth_control.register);
router.post("/login",Auth_control.login);
router.post("/google-login",Auth_control.google_login);
router.get("/profile-check",middleware,Auth_control.profile_check);
router.post("/create-profile",upload.single("image"),middleware,Auth_control.profile);
router.get("/profile_data/:email",middleware,Auth_control.getData);
router.post("/AllData",Auth_control.All_data);
router.get("/Get_Data/:id",Auth_control.Get_Profile);
router.get("/Profile_valid/:email",Auth_control.Profile_valid);
module.exports=router;

