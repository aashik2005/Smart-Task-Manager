const express=require('express')
const app=express()
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const taskRoutes = require("./routes/taskRoutes");
app.use(express.json());
dotenv.config();

connectDB();

app.use('/task',taskRoutes);


const PORT=process.env.PORT;




app.listen(PORT,()=>{
    console.log("backend is running...");
})

