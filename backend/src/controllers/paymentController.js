import crypto from 'crypto'
import { Order } from '../models/Order.models.js'

export const createPaymentOrder = async(req, res) =>{
    try{
        const {orderId } = req.body

        const order = await Order.findById(orderId)

        if(!orderId)return res.status(404).json({message : 'Order not found'});

        
    const razorpayOrder = await razorpay.orders.create({
      amount: order.totalAmount * 100,
      currency: 'INR',
      receipt: `receipt_${orderId}`,
      notes: { orderId: orderId.toString() },
    });

     res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
    } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Mark order as paid
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

    res.json({ message: 'Payment verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── 3. REFUND (Buyer requests refund) ───────────────────────────────────────
export const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order || order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'No paid payment found for this order' });
    }

    const refund = await razorpay.payments.refund(order.paymentId, {
      amount: order.totalAmount * 100, // full refund; partial: pass custom amount
    });

    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'refunded' });

    res.json({ message: 'Refund initiated', refundId: refund.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── 4. PAYOUT TO FARMER ─────────────────────────────────────────────────────
export const payoutToFarmer = async (req, res) => {
  try {
    const { farmerId, amount, accountNumber, ifscCode, farmerName } = req.body;

    // Step 1 — create contact
    const contact = await razorpay.contacts.create({
      name: farmerName,
      type: 'vendor',
      reference_id: farmerId,
    });

    // Step 2 — create fund account
    const fundAccount = await razorpay.fundAccount.create({
      contact_id: contact.id,
      account_type: 'bank_account',
      bank_account: {
        name: farmerName,
        ifsc: ifscCode,
        account_number: accountNumber,
      },
    });

    // Step 3 — create payout
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER, // your Razorpay X account
      fund_account_id: fundAccount.id,
      amount: amount * 100,
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'vendor_advance',
      queue_if_low_balance: true,
    });

    res.json({ message: 'Payout initiated', payoutId: payout.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};