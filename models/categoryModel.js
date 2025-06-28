import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required."],
        unique: [true, "Category already exists."],
        trim: true,
        minlength: [3, 'Too short category name'],
        maxlength: [32, 'Too long category name']
    },
    slug: {
        type: String,
        lowercase: true
    }
},
    { timestamps: true }
);

// const setImageURL = (doc) => {
//     if (doc.image) {
//         const imageUrl = `${process.env.BASE_URL}/categories/${doc.image}`;
//         doc.image = imageUrl;
//     }
// }

// categorySchema.post('init', (doc) => {
//     setImageURL(doc);
// });

// categorySchema.post('save', (doc) => {
//     setImageURL(doc);
// });

export default mongoose.model('Category', categorySchema);