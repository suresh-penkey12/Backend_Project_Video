let express =require("express");
let jwt =require("jsonwebtoken");
let model = require("../models/auth");
let {Stripe} =require("stripe");
require("dotenv").config();
let nodemailer =require("nodemailer");
var transport = nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASS    
    }
})
const { connection } = require("mongoose");
let {connections,profile}=model;

//stripe method to invoke

const root = async(req,res)=>{
    res.send("connection page");
}
// Api for Request adding to user
const assign = async(req,res)=>{
    let requestmail = req.params.email;
    let email = req.user.email;
    let status = req.params.status;
    console.log("i'm invoked")
    try {
        let data = await connections.findOne({ useremail: requestmail });
        console.log(data)
                if(status==="free"){
                    if (!data) {
                        let newEntry = await connections.create({
                            useremail: requestmail,
                            requests: [email]
                        });
                        return res.status(200).send({ message: "Request sent successfully", details: newEntry });
                    } else if(data){
                        if(data.requests.includes(email)){
                            res.send({message:"Request already sent,wait for response!"})
                        }
                        else{
                            let updatedEntry = await connections.updateOne(
                                { useremail: requestmail },
                                { $push: { requests: email } } 
                            );
                        }
            
                        return res.send({ message: "Request sent successfully"});
                    }
                }else if(status === "membor"){
                    if(!data){
                        let newEntry=await connections.create({
                            useremail:requestmail,
                            memborship_requests:[email]
                        });
                        return res.status(200).send({message:"Request sent Successfully",details:newEntry});
                    }else if(data){
                        if(data.memborship_requests.includes(email)){
                            res.send({message:"Request already sent,wait for response!"})
                        }
                        else{
                            let updatedEntry =await connections.findOne({
                                useremail:requestmail,
                                $push:{memborship_requests:email}
    
                            });
                        }
                        res.status(200).send({message:"request sent successfully"});
                    }
                }
            
    
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Bad request" });
    }
}

// Displaying the available request for user
const requests =async(req,res)=>{
    console.log("i'm invoked in connections");
    let email = req.user.email;
    console.log(email);
    // console.log(req.params);
    try {
        let data = await connections.findOne({useremail:email }); // Use findOne instead of find

        if (!data || !data.requests || data.requests.length === 0) {
            return res.status(200).json({ message: ["No requests to you"] });
        }
        const users = await profile.find({ email: { $in: data.requests } });

        return res.status(200).json({ message: users });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return res.status(500).send({ message: "Server error" });
    }
      
}
const membor_requests =async(req,res)=>{
    let email =req.user.email;
    try{
        let data =await connections.findOne({useremail:email});
        console.log(data);
        if(!data || !data.memborship_requests || data.memborship_requests.length ===0){
            return res.status(200).send({message:["No requests to you"]});
        }
        const users =await profile.find({email:{$in:data.memborship_requests}});
        return res.status(200).json({message:users});
    }
    catch(error){
        return res.status(500).send({message:"server error"});
    }
}
// Api for Status ,wheather a user can be accepted or rejected
const response =async(req,res)=>{
    let email = req.user.email;
    console.log(email);
    let action =req.params.action;
    let responseemail=req.params.email;
    let result=req.params.result;
    console.log(action);
    console.log(responseemail);
    console.log("i'm invoked in response");
    try{
        let currdata = await connections.findOne({useremail:email});
        let respdata = await connections.findOne({useremail:responseemail});
        let profiledata = await profile.findOne({email:responseemail});
        console.log(currdata);
        console.log(respdata);
        // let 
        if(result === "free"){
            if(action === "Accept"){
                currdata.status.push(responseemail);
                currdata.requests = currdata.requests.filter(item=>item!==responseemail);
                currdata.save();
                if(!respdata){
                    let newEntry = await connections.create({
                        useremail: responseemail,
                        status: [email]
                    });
                }else{
                    respdata.status.push(email);
                    respdata.save();
                }
                res.status(200).send({message:"Accepted the user"});
            }else{
                currdata.requests = currdata.requests.filter(item=>item!=responseemail);
                currdata.save();
                res.send({message:"Rejects the user"});
            }
        }
        else{
            let token =jwt.sign({email:responseemail},process.env.SECRET_KEY,{ expiresIn: "30d"});
            if(action === "Accept"){
                currdata.membership.push(responseemail);
                currdata.memborship_requests = currdata.memborship_requests.filter(item=>item!==responseemail);
                currdata.save();
                if(!respdata){
                    let newEntry = await connections.create({
                        useremail: responseemail,
                        membership: [email]
                    });
                }else{
                    respdata.membership.push(email);
                    respdata.save();
                }
                profiledata.token=token;
                res.status(200).send({message:"Accepted the user"});
            }else{
                // profiledata.token=token;
                currdata.memborship_requests = currdata.memborship_requests.filter(item=>item!=responseemail);
                currdata.save();
                res.send({message:"Rejects the user"});
            }
        }
    }
    catch(err){
        res.status(400).send({messgae:"An server exception occured"});
    }
}
//Api for showing friends list
const friends = async(req,res)=>{
    let email = req.user.email;
    let data =await connections.findOne({useremail:email});
    try{
        if(!data){
            res.status(400).send({message:"No user Found"});
        }
        else{
            if(data.status.length<1){
                res.status(200).send({message:["You Have No friends ,Please make some friends"]});
            }
            else{
                const friendlist = await profile.find({ email: { $in: data.status} });
                res.status(200).send({message:friendlist});  
            }
        }
    }
    catch(err){
        res.status(500).send({message:"Error Occured At Server"});
    }

}
/// Api for showing who takes memborship
const memborships =async(req,res)=>{
    let email =req.user.email;
    console.log("user email" ,email);
    let data =await connections.findOne({useremail:email});
    console.log(data);
    try{
        // console.log("i'm in try block")
        if(data.membership?.length===0){
            console.log("i'm entering into membership zone")
            res.status(400).send({message:["You have No friends, Please take memborships"]});
        }
        else{
            console.log("i'm entering into else ")
            const list = await profile.find({email:{$in:data.membership}});
            console.log(list)
            res.status(200).send({message:list});        
        }
    }
    catch(error){
        console.log(error);
        res.status(500).send({message:"A server side Error occured"});
    }
}
// Api for payment process
const stripe = new Stripe(process.env.STRIPE_KEY);
const payment =async(req,res)=>{
    let{amount}=req.body;
    console.log("amount",amount);
    // console.log(priceId);
    console.log("i'm invoked");
    try{
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                { 
                    price_data: {
                        currency: "inr",  
                        product_data: {
                            name: "Service Payment",
                        },
                        unit_amount: Math.round(amount * 100) 
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: "http://localhost:5173/success",
            cancel_url: "http://localhost:5173/failure",
            
        })
        console.log(session);
        res.json({id:session.id})
    }
    catch(error){
        console.log("error block")
        // console.log(error);
        res.status(500).send({message:"A Server side Exception Occureed"});
    }
}
// Api for delete the user memborship user ,if the token expires
const deletemember =async(req,res)=>{
    let email = req.user.email;
    let deletemail = req.params.email;
    console.log("email",email);
    console.log("deletemail",deletemail);
    let data =await connections.findOne({useremail:email});
    try{
        console.log("i'm in delete mail code")
        if(!data){
            res.status(400).send("invalid requeest");
        }else{
            data.membership=data.membership.filter((m)=>m!==deletemail);
            await data.save()
        }
        res.status(200).send({message:"user deleted successfully"});

    }
    catch(error){
        res.status(500).send("server side exception occured");
    }
}
const mail = async(req,res)=>{
    let sender = req.user.email;
    let reciever = req.params.email;
    let {data}=req.body;
    console.log("sender",sender);
    console.log("receiver",reciever);
    console.log("data",data);
    try{
        var mailoptions ={
            from:sender,
            to:reciever,
            subject:"Sending mail for room details",
            html:data
        }
        let result = await transport.sendMail(mailoptions);
        if(result){
            res.send({message:"MAil Send Successfully"});
        }else{
            res.send({message:""})
        }
    }
    catch(error){
        res.status(500).send({message:"Server side error Occured"});
    }

}
module.exports ={root,assign,requests,response,friends,membor_requests,memborships,payment,deletemember,mail};
