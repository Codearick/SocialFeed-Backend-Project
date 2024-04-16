// require('dotenv').config()
import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path: "./env"
})

const port = process.env.PORT || 8000;



connectDB()
.then(()=>{
    app.on("error", (err)=>{
        console.log("Server down :: ",err);
        throw err;
    })
    app.listen(port, ()=>{
        console.log(`Server is running on port ${port}`)
    })
})
.catch((err)=>{
    console.log("Mongo db connection failed !!",err);
})
















/*
import express from "express"
const app = express();
const port = process.env.PORT;

;( async()=>{
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error)=>{
            console.log("Error :: ", error)
            throw error
        })

        app.listen(port, ()=> {
            console.log(`App listening on port ${port}`)
        })

    } catch (error) {
        console.log("ERROR ::", error);
        throw error
    }
})()
*/
