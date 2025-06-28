import asyncHandler from 'express-async-handler';
import ApiFeatures from '../utils/apiFeatures.js';
import ApiError from '../utils/apiError.js';
import { sanitizeCategory } from '../utils/sanitizeData.js';
import Category from '../models/categoryModel.js';

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
    const totalCategories = await Category.countDocuments();

    const features = new ApiFeatures(Category.find(), req.query)
        .paginate(totalCategories)
        .filter()
        .search('Categories')
        .limitFields()
        .sort();

    const categories = await features.mongooseQuery;
    res.status(200).json({
        results: categories.length,
        pagination: features.paginationResult,
        data: categories.map(sanitizeCategory)
    });
});

// @desc    Get a category
// @route   GET @access  Public
// route    /api/v1/categories/:id
export const getCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
        return next(new ApiError(`No category for this id ${id}`, 404));
    }
    res.status(200).json({ data: sanitizeCategory(category) });
});

// @desc    Create a category 
// @route   POST /api/v1/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);
    res.status(201).json({
        data: sanitizeCategory(category),
    });
});

// @desc    Update a category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res, next) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    if (!category) {
        return next(
            new ApiError(`No category for this id ${req.params.id}`, 404)
        );
    }
    res.status(200).json({ data: sanitizeCategory(category) });
});

// @desc    Delete a category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
        return next(new ApiError(`No category for this id ${id}`, 404));
    }
    res.status(204).send();
});