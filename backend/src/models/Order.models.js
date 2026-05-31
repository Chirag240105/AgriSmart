import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      default: null,
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
    },
    quantity: {
      type: Number,
      required: true,
    },
    pricePerUnit: Number,
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: String,
    cancelledReason: String,
    paymentId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    refundId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    transportationMode: {
      type: String,
      enum: ["self", "platform"],
      default: "self",
    },
    transportFee: {
      type: Number,
      default: 0,
    },
    transport_type: {
      type: String,
      enum: ["self", "platform"],
      default: "self",
    },
    delivery_charge: {
      type: Number,
      default: 0,
    },
    shippingAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);