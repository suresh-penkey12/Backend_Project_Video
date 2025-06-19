require("dotenv").config();
let jwt = require("jsonwebtoken");
let authMiddleware = async(req,res,next)=>{
  console.log(req.headers)
    const authHeader = req.headers.authorization;
    // console.log( authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];
//   console.log(jwt.decode(token));
//   console.log(process.env.SECRET_KEY);
  try {
    console.log("i'm here");
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    // console.log(decoded);
    req.user = decoded;
    next();
  } catch (error) {
    // console.log("i'm entering these block")
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}
module.exports=authMiddleware;