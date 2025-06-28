import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            unique: [true, 'Product already exists.'],
            minlength: [3, 'Too short product title'],
            maxlength: [100, 'Too long product title.']
        },
        slug: {
            type: String,
            lowercase: true,
        },
        description: {
            type: String,
            //required: [true, 'Product description is required.'],
            minlength: [20, 'Too short product description.']
        },
        quantity: {
            type: Number,
            required: [true, 'Product quantity is required.']
        },
        sold: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'Product price is required.'],
            trim: true,
            max: [50000, 'Too long product price.']
        },
        priceAfterDiscount: {
            type: Number
        },
        colors: [String],
        imageCover: {
            type: String,
            required: [true, 'Product Image is required.']
        },
        images: [String],
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Product must belong to category.']
        },
        subcategories: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubCategory'
        },
        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand'
        },
        ratingsAverage: {
            type: Number,
            min: [1, 'Rating must be above or equal 1.0'],
            max: [5, 'Rating must be below or equal 5.0']
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

productSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'product',
    localField: '_id'
});

productSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'category subcategories brand',
        select: 'name -_id'
    });
    next();
});
export default mongoose.model('Product', productSchema);
