import asyncHandler from 'express-async-handler';
import ApiFeatures from '../utils/apiFeatures.js';
import ApiError from '../utils/apiError.js';
import { sanitizeReview } from '../utils/sanitizeData.js';
import Order from '../models/orderModel.js';
import Review from '../models/reviewModel.js';

// Nested route
// GET /api/v1/products/:productId/reviews
export const createFilterObj = (req, res, next) => {
    let filterObject = {};
    if (req.params.productId) filterObject = { product: req.params.productId };
    req.filterObj = filterObject;
    next();
};

// Nested route (Create)
export const setProductIdAndUserIdToBody = (req, res, next) => {
    if (!req.body.product) req.body.product = req.params.productId;
    if (!req.body.user) req.body.user = req.user._id;
    next();
};

// @desc    Get list of reviews
// @route   GET /api/v1/reviews
// @access  Public
export const getReviews = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const totalReviews = await Review.countDocuments({ product: productId });
    const apiFeatures = new ApiFeatures(Review.find({ product: productId }), req.query)
        .paginate(totalReviews)
        .filter()
        .search('Reviews')
        .limitFields()
        .sort();

    const { mongooseQuery, paginationResult } = apiFeatures;
    const reviews = await mongooseQuery;

    res.status(200).json({
        results: reviews.length,
        paginationResult,
        data: reviews.map(sanitizeReview),
    });
});

// @desc    Get specific review by ID
// @route   GET /api/v1/reviews/:id
// @access  Public
export const getReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
        return next(new ApiError(`No review found with the ID ${id}.`, 404));
    }

    res.status(200).json({
        data: sanitizeReview(review)
    });
});

// @desc    Create review
// @route   POST  /api/v1/reviews
// @access  Private/Protect/User
export const createReview = asyncHandler(async (req, res, next) => {
    const { ratings, content } = req.body;
    const { productId } = req.params;

    const order = await Order.findOne({
        user: req.user._id,
        'cartItems.product': productId
    });

    if (!order) {
        return next(new ApiError('You must have purchased this product to leave a review', 403));
    }

    const review = await Review.create({
        content,
        ratings,
        user: req.user._id,
        product: productId
    });

    res.status(201).json({
        data: sanitizeReview(review),
    });
});

// @desc    Update specific review
// @route   PUT /api/v1/reviews/:id
// @access  Private/Protect/User
export const updateReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!review) {
        return next(new ApiError(`No review found with the ID ${id}.`, 404));
    }

    res.status(200).json({
        data: sanitizeReview(review),
    });
});

// @desc    Delete specific review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Protect/User-Admin
export const deleteReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);

    if (!review) {
        return next(new ApiError(`No review found with the ID ${id}.`, 404));
    }

    res.status(204).send();
});
