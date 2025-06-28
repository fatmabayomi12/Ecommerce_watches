import asyncHandler from 'express-async-handler'
import ApiFeatures from '../utils/apiFeatures.js';
import ApiError from '../utils/apiError.js';
import { sanitizeBrand } from '../utils/sanitizeData.js';
import Brand from '../models/brandModel.js';

// @desc    Get all brands
// @route   GET /api/v1/brands
// @access  Public
export const getBrands = asyncHandler(async (req, res) => {
    const totalBrand = await Brand.countDocuments();

    const features = new ApiFeatures(Brand.find(), req.query)
        .paginate(totalBrand)
        .filter()
        .search('Brans')
        .limitFields()
        .sort();

    const Brands = await features.mongooseQuery;
    res.status(200).json({
        results: Brands.length,
        pagination: features.paginationResult,
        data: Brands.map(sanitizeBrand)
    });
});

// @desc    Get a brand
// @route   GET /api/v1/brands/:id
// @access  Public
export const getBrand = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) {
        return next(new ApiError(`No brand for this id ${id}`, 404));
    }
    res.status(200).json({ data: sanitizeBrand(brand) });
});

// @desc    Create a brand
// @route   POST /api/v1/brands
// @access  Private
export const createBrand = asyncHandler(async (req, res) => {
    const brand = await Brand.create(req.body);
    res.status(201).json({
        data: sanitizeBrand(brand),
    });
});

// @desc    Update a brand
// @route   PUT /api/v1/brands/:id
// @access  Private
export const updateBrand = asyncHandler(async (req, res, next) => {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    if (!brand) {
        return next(
            new ApiError(`No brand for this id ${req.params.id}`, 404)
        );
    }
    res.status(200).json({ data: sanitizeBrand(brand) });
});

// @desc    Delete a brand
// @route   PUT /api/v1/brands/:id
// @access  Private
export const deleteBrand = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
        return next(new ApiError(`No brand for this id ${id}`, 404));
    }
    res.status(204).send();
});