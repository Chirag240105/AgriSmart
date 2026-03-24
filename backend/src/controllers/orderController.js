import { Order } from "../models/Order.models.js";
import { Crop } from "../models/Crop.models.js";

export const createOrder = async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({ success: false, message: "Only buyers can create orders" });
    }

    const { cropId, quantity, paymentMethod } = req.body;
    if (!cropId || !quantity) {
      return res.status(400).json({ success: false, message: "cropId and quantity are required" });
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ success: false, message: "Crop not found" });
    }
    if (crop.status !== "available") {
      return res.status(400).json({ success: false, message: "Crop is not available" });
    }
    if (quantity > crop.availableQuantity) {
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available quantity" });
    }

    const totalAmount = Number(quantity) * Number(crop.pricePerUnit);

    const order = await Order.create({
      buyerId: req.user.id,
      cropId,
      quantity,
      pricePerUnit: crop.pricePerUnit,
      totalAmount,
      paymentMethod,
      status: "pending",
    });

    crop.availableQuantity -= Number(quantity);
    if (crop.availableQuantity <= 0) {
      crop.status = "sold";
    }
    await crop.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "buyer") {
      query = { buyerId: req.user.id };
    } else if (req.user.role === "farmer") {
      const farmerCrops = await Crop.find({ farmerId: req.user.id }).select("_id");
      query = { cropId: { $in: farmerCrops.map((crop) => crop._id) } };
    }

    const orders = await Order.find(query)
      .populate("cropId", "cropName pricePerUnit farmerId")
      .populate("shipmentId")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("cropId").populate("shipmentId");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (req.user.role === "buyer" && order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, cancelledReason } = req.body;
    const allowedStatuses = ["pending", "paid", "failed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    order.status = status;
    if (cancelledReason) {
      order.cancelledReason = cancelledReason;
    }
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
