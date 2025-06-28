import asyncHandler from 'express-async-handler';
import { sanitizeCoupon } from '../utils/sanitizeData.js';
import ApiFeatures from '../utils/apiFeatures.js';
import ApiError from '../utils/apiError.js';
import Coupon from '../models/couponModel.js';

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Private/Admin-Manger
export const getCoupons = asyncHandler(async (req, res) => {
    const totalCopons = await Coupon.countDocuments();

    const features = new ApiFeatures(Coupon.find(), req.query)
        .paginate(totalCopons)
        .filter()
        .search()
        .limitFields()
        .sort();

    const coupon = await features.mongooseQuery;

    res.status(200).json({
        results: coupon.length,
        pagination: features.paginationResult,
        data: coupon.map(sanitizeCoupon)
    });
});

// @desc    Get a coupon
// @route   GET /api/v1/coupons/:id
// @access  Private/Admin-Manger
export const getCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let query = Coupon.findById(id);
    const coupon = await query;
    if (!coupon) {
        return next(new ApiError(`No coupon found with the ID ${id}.`, 404));
    }
    res.status(200).json({
        data: sanitizeCoupon(coupon)
    });
});

// @desc    Create a coupon
// @route   POST /api/v1/coupons
// @access  Private/Admin-Manger
export const createCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({
        data: sanitizeCoupon(coupon),
    });
});

// @desc    Update a coupon
// @route   PUT /api/v1/coupons/:id
// @access  Private/Admin-Manger
export const updateCoupon = asyncHandler(async (req, res, next) => {
    const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    if (!coupon) {
        return next(new ApiError(`No coupon found with the ID ${id}.`, 404));
    }
    res.status(200).json({
        data: sanitizeCoupon(coupon)
    });
});

// @desc    Delete a coupon
// @route   PUT /api/v1/coupon/:id
// @access  Private/Admin-Manger
export const deleteCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const coupon = await Coupon.findOneAndDelete({ _id: id });
    if (!coupon) {
        return next(new ApiError(`No coupon found with the ID ${id}.`, 404));
    }
    res.status(204).send();
});