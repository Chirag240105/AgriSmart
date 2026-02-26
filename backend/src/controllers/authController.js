import { User } from "../models/User.models.js"
import jwt from 'jsonwebtoken';

const generateToken= (id) =>{
    return jwt.sign({id}, process.env.JWT_SECRET_KEY, {expiresIn: '7d'})
}
export const signup= async(req, res)=>{
    try{
    const {name, email, password , role, phone, location} = req.body
        if(!['farmer', 'buyer'].includes(role)){
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            })
        }

        let user = await User.findOne({email});
        if(user) return res.status(400).json({success: false, message: "User already exists"})

             let geoLocation = undefined;

    if (
      location &&
      typeof location.lat === "number" &&
      typeof location.lng === "number"
    ) {
      geoLocation = {
        type: "Point",
        coordinates: [location.lng, location.lat], 
      };
    }

            user = new User({
                name,
                email, 
                password, 
                role, 
                phone,
                location: geoLocation
            });

            await user.save();

            res.status(201).json({
                success: true,
                userId:{
                    id : user._id,
                    name,
                    email,
                    role
                },
                    token : generateToken(user._id)

            })
}catch(error){
    res.status(500).json({success: false, message: "Server error", error: error.message})
}
}
export const login= async(req, res)=>{
    try{
    const {email, password } = req.body
        let user = await User.findOne({email});
        if(!user) return res.status(400).json({success: false, message: "Invalid credentials"})
           const isMatch = await user.comparePassword(password);
        if(!isMatch) return res.status(403).json({success: false, message: "Invalid password. Re-Try"})

            res.status(201).json({
                success: true,
                user:{
                    id : user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                token : generateToken(user._id)
            })
}catch(error){
    res.status(500).json({success: false, message: "Server error", error: error.message})
}
}
