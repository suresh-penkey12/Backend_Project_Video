const mongoose=require("mongoose");
require("dotenv").config();
async function dbConnect(){
    try{
        await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_pASSWORD}@${process.env.DB_CLUSTER}.4hiyp.mongodb.net/Auth?retryWrites=true&w=majority&appName=Cluster-main`,{
            serverSelectionTimeoutMS: 1000000, // Increase timeout
            connectTimeoutMS: 100000 // Connection timeout
        })
        console.log("database connected");
    }
    catch(error){
        console.log(error);
        console.log("connection faild")
    }
}
module.exports=dbConnect;