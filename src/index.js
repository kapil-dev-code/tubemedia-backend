// require("dotenv").config({path:'./env'}) or we can ue import but make change in package.json
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path: "../.env",
});
connectDB().then(() => {

    app.on("error", (error) => {
        console.error("ERROR", error)
        throw error
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`App is listening on port ${process.env.PORT}`)
    })
}).catch(error => {
    console.error("ERROR", error)
    throw error
})



















/*  this is the other way to connect db using IIFE
;(async()=>{
    try{
await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
// import app from express ie app=express() and use app.on and hit error event of that 
app.on("error",(error)=>{
    console.error("ERROR",error)
    throw error
})
app.listen(process.env.PORT,()=>{
    console.log(`App is listening on port ${process.env.PORT}`)
})
    }
    catch(error){
        console.error("ERROR",error)
        throw error
    }
})()
    */ 