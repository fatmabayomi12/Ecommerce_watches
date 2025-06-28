import mongoose from 'mongoose';

const globalshippingPriceSchema = new mongoose.Schema({
    shippingPrice: {
        type: Number,
        required: true,
        min: [0, 'shipping price must be a positive number']
    }
});

export default mongoose.model('globalShippingPrice', globalshippingPriceSchema);