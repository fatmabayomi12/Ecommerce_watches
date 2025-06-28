import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            unique: [true, 'subCategory already exists'],
            minlength: [2, 'Too short subCategory name'],
            maxlength: [32, 'Too long subCategory name']
        },
        slug: {
            type: String,
            lowercase: true
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            //required: [true, 'SubCategory must belong to parent Category']
        }
    },
    { timestamps: true }
);

// subCategorySchema.pre(/^find/, (next) => {
//     this.populate({
//         path: 'Category',
//         select: 'name -__id'
//     });
//     next();
// });

export default mongoose.model('SubCategory', subCategorySchema);