import mongoose from "mongoose";
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: [true, "Name already exists."],
            required: [true, "Name is required."],
            trim: true,
        },
        slug: {
            type: String,
            lowercase: true
        },
        email: {
            type: String,
            required: [true, "Email is required."],
            trim: true,
            unique: [true, "Email already exists."],
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            minlength: [6, "Password must be at least 6 characters long."],
            maxlength: 100
        },
        passwordChangedAt: Date,
        passwordResetCode: String,
        passwordResetExpires: Date,
        passwordResetVerified: Boolean,
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        active: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true },
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);

    next();
});

export default mongoose.model('User', userSchema);
