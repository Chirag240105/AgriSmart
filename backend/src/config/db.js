import mongoose from "mongoose"

export const connectDB=async(req, res)=>{
    try{
        const mongoDB_Connection =await mongoose.connect(process.env.MONGO_URI)
        console.log("MONGO_DB connection successfully estanblished")
    }catch(error){
        console.log("MONGODB Connection error || ", error)
        process.exit(1)
    }
}
