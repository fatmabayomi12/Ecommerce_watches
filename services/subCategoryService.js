import asyncHandler from 'express-async-handler'
import ApiFeatures from '../utils/apiFeatures.js';
import ApiError from '../utils/apiError.js';
import { sanitizeSubCategory } from '../utils/sanitizeData.js';
import slugify from 'slugify';
import SubCategory from '../models/subCategoryModel.js';

// @desc    Get all subcategories
// @route   GET /api/v1/supcategories
// @access  Public
export const getSubCategories = asyncHandler(async (req, res) => {
    const totalSubCategories = await SubCategory.countDocuments();

    const features = new ApiFeatures(SubCategory.find(), req.query)
        .paginate(totalSubCategories)
        .filter()
        .search('SubCategories')
        .limitFields()
        .sort();

    const subCategories = await features.mongooseQuery;
    res.status(200).json({
        results: subCategories.length,
        pagination: features.paginationResult,
        data: subCategories.map(sanitizeSubCategory)
    });
});

// @desc    Get a subcategory
// @route   GET /api/v1/subcategories/:id
// @access  Public
export const getSubCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const subCategory = await SubCategory.findById(id);

    if (!subCategory) {
        return next(new ApiError(`No subcategory for this id ${id}`, 404));
    }
    res.status(200).json({ data: sanitizeSubCategory(subCategory) });
});

// @desc    Create subCategories
// @route   POST /api/v1/subcategories
// @access  Private
export const createSubCategory = asyncHandler(async (req, res) => {
    const subCategory = await SubCategory.create(req.body);
    res.status(201).json({
        data: sanitizeSubCategory(subCategory),
    });
});

// @desc    Update a subcategory
// @route   PUT /api/v1/subcategories/:id
// @access  Private
export const updateSubCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, category } = req.body;

    const subCategory = await SubCategory.findOneAndUpdate(
        { _id: id },
        { name, slug: slugify(name), category },
        { new: true }
    );

    if (!subCategory) {
        return next(new ApiError(`No  subcategory for this id ${id}`, 404));
    }
    res.status(200).json({ data: sanitizeSubCategory(subCategory) });
});

// @desc    Delete a subcategory
// @route   PUT /api/v1/subcategories/:id
// @access  Private
export const deleteSubCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const subCategory = await SubCategory.findByIdAndDelete(id);

    if (!subCategory) {
        return next(new ApiError(`No subcategory for this id ${id}`, 404));
    }
    res.status(204).send();
});