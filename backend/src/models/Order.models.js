import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    buyerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shipmentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment'
    },
    cropId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop'
    },
    quantity:{
        type: Number,
        required: true
    },
    pricePerUnit: Number,
    totalAmount:{
        type: Number,
        required: true
    },
    status:{
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending"
    },
    paymentMethod: String,
    cancelledReason: String
}, {timestamps: true})

export const Order = mongoose.model("Order", orderSchema);
