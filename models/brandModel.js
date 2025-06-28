import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required."],
        unique: [true, "brand already exists."],
        trim: true,
        minlength: 3,
        maxlength: 32
    },
    slug: {
        type: String,
        lowercase: true
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        //required: [true, 'Brand must belong to a subCategory']
    }
},
    { timestamps: true }
);

// brandSchema.pre(/^find/, function(next) {
//     this.populate({
//         path: 'subCategory',
//         select: 'name -__id'
//     });
//     next();
// });

export default mongoose.model('Brand', brandSchema);
