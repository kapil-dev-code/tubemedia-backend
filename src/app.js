import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
export const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN
}))

// For JSON data accept and set limit(when we get data from form)
app.use(express.json({ limit: "16kb" }))

// when we get data form url  extended use for nested object.by the way { extended: true, limit: "16kb" } this is optional.
app.use(express.urlencoded({ extended: true, limit: "16kb" }))

//static use for store file and folder in to server
app.use(express.static("public"))

//for get and set cookie form server
app.use(cookieParser())

//routes import

import userRoute from "./routes/user.routes.js"

//routers declaration
app.use("/api/v1/users",userRoute)