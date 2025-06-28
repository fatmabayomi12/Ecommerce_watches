import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, 'Coupon name is required'],
            uniuqe: true
        }, 
       expire: {
        type: Date,
        required: [true, 'Coupon expire date is required']
       },
         discount: {
          type: Number,
          required: [true, 'Coupon discount value is required']
         } 
    },
    {timestamps: true}
);

export default mongoose.model('Coupon', couponSchema);