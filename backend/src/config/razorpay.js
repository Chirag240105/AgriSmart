import Razorpay from 'razorpay'
export const razorPay = new Razorpay({
    key_id: process.env.Razorpay_key_id,
    key_secret: process.env.Razorpay_key_secret
});