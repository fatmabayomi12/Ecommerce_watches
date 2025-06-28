import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import ApiError from '../utils/apiError.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { sanitizeUser } from '../utils/sanitizeData.js';
import User from '../models/userModel.js';


// @desc    Get all Users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments( { role: { $ne: 'admin' } } );

    const features = new ApiFeatures(User.find( { role: { $ne: 'admin' } } ), req.query)
        .paginate(totalUsers)
        .filter()
        .search('Users')
        .limitFields()
        .sort();

    const users = await features.mongooseQuery;
    res.status(200).json({
        results: users.length,
        pagination: features.paginationResult,
        data: users.map(sanitizeUser)
    });
});

// @desc    Get a users
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        return next(new ApiError(`No user for this id ${id}`, 404));
    }
    res.status(200).json({ data: sanitizeUser(user) });
});

// @desc    Create a user
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json({
        data: sanitizeUser(user),
    });
});


export const changePassword = asyncHandler(async (req, res, next) => {

    if (!req.body.password) {
        return next(new ApiError(`Password is required`, 404));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            password: hashedPassword,
            passwordChangedAt: Date.now()
        },
        {
            new: true
        }
    );

    if (!user) {
        return next(new ApiError(`No user found with the ID ${req.params.id}`, 404));
    }

    res.status(200).json({
        data: sanitizeUser(user)
    });
});

// @desc    Update a user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            slug: req.body.slug,
            email: req.body.email,
            role: req.body.role,
        },
        { new: true }
    );
    if (!user) {
        return next(new ApiError(`No user found with the ID ${req.params.id}`, 404));
    }
    res.status(200).json({
        data: sanitizeUser(user)
    });
});

// @desc    Delete a user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
        return next(new ApiError(`No user for this id ${id}`, 404));
    }
    res.status(204).send();
});

// @desc    Get logged user 
// @route   PUT /api/v1/users/:id
// @access  Private/Admin

export const getLoggedUserData = asyncHandler(async (req, res, next) => {
    req.params.id = req.user._id;
    const userId = req.params.id
    const user = await User.findById(userId)

    res.status(200).json({
        data: sanitizeUser(user)
    });
    next();
});
