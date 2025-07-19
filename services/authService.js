import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/apiError.js';
import 'dotenv/config';
import { sanitizeUser } from '../utils/sanitizeData.js';
import User from '../models/userModel.js';

const createToken = (payload) =>
    jwt.sign({ userId: payload }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE_TIME
    });

// @desc    Signup
// @route   GET /api/v1/auth/signup
// @access  Public
export const signup = asyncHandler(async (req, res, next) => {

    const user = await User.create({
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        password: req.body.password,
    });

    const token = createToken(user._id);

    res.status(201).json({ data: sanitizeUser(user), token });
});

// @desc    Login
// @route   GET /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email });

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return next(new ApiError('Incorrect email or password', 401));
    }
    const token = createToken(user._id);

    delete user._doc.password;

    res.status(200).json({ data: sanitizeUser(user), token });
});

// @desc   make sure the user is logged in
export const protect = asyncHandler(async (req, res, next) => {
    // 1) Check if token exist, if exist get
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(
            new ApiError(
                'You are not login, Please login to get access this route',
                401
            )
        );
    }

    // 2) Verify token (no change happens, expired token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 3) Check if user exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
        return next(
            new ApiError(
                'The user that belong to this token does no longer exist',
                401
            )
        );
    }

    // 4) Check if user change his password after token created
    if (currentUser.passwordChangedAt) {
        const passChangedTimestamp = parseInt(
            currentUser.passwordChangedAt.getTime() / 1000,
            10
        );
        // Password changed after token created (Error)
        if (passChangedTimestamp > decoded.iat) {
            return next(
                new ApiError(
                    'User recently changed his password. please login again..',
                    401
                )
            );
        }
    }

    req.user = currentUser;
    next();
});

export const allowedTo = (...roles) =>
    asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError('You are not allowed to access this route', 403)
            );
        }
        next();
    });
