import mongoose from 'mongoose';
import { validate } from 'uuid';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a User']
    },
    cartItems: {
        type:
            [
                {
                    product: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'Product',
                        required: true
                    },
                    quantity: {
                        type: Number,
                        required: true,
                        min: [1, 'Quantity must be at least 1']
                    },
                    price: {
                        type: Number,
                        required: true,
                        min: [0, 'Price cannot be negative']
                    },
                    color: String
                }
            ],
    },
    shippingAddress: {
        address: String,
        phone: String,
        city: String,
        //zipCode: String,
        paymentMethodType: {
            type: String,
            enum: ['InstaPay', 'cash'],
            default: 'cash'
        }
    },
    // shippingPrice: {
    //     type: Number,
    //     default: 0,
    // },
    totalOrderPrice: { type: Number },
    totalPriceAfterDiscount: { type: Number },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: { type: Date },
    isDelivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: { type: Date }
},
    { timestamps: true }
);

export default mongoose.model('Order', orderSchema);

