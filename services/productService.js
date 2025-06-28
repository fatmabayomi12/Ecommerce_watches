import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import cloudinary from '../utils/cloudinary.js';
import Product from '../models/productModel.js';
import ApiError from '../utils/apiError.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { sanitizeProduct } from '../utils/sanitizeData.js';

const uploadToCloudinary = (buffer, filename, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder, // Folder in Cloudinary
                public_id: filename, // File name in Cloudinary
                resource_type: 'image', // Force image type
                format: 'jpeg',
                quality: 'auto', // Optimize quality dynamically
            },
            (error, result) => (error ? reject(error) : resolve(result))
        ).end(buffer);
    });
};


export const resizeProductImages = asyncHandler(async (req, res, next) => {
    try {
        // Handle Cover Image
        if (req.files?.imageCover) {
            const imageCoverFileName = `product-${uuidv4()}-cover`;

            // Resize image
            const buffer = await sharp(req.files.imageCover[0].buffer)
                .resize(1200, 1600, {
                    fit: sharp.fit.cover,
                    position: sharp.strategy.center
                })
                .toFormat('jpeg')
                .jpeg({ quality: 95 })
                .toBuffer();

            // Upload to Cloudinary
            const result = await uploadToCloudinary(buffer, imageCoverFileName, 'products');

            req.body.imageCover = result.secure_url; // Save URL
        }

        // Handle Other Images
        if (req.files?.images) {
            req.body.images = await Promise.all(
                req.files.images.map(async (img, index) => {
                    const imageName = `product-${uuidv4()}-${index + 1}`;

                    // Resize image
                    const buffer = await sharp(img.buffer)
                        .resize(1200, 1600, {
                            fit: sharp.fit.cover,
                            position: sharp.strategy.center
                        })
                        .toFormat('jpeg')
                        .jpeg({ quality: 95 })
                        .toBuffer();

                    // Upload to Cloudinary
                    const result = await uploadToCloudinary(buffer, imageName, 'products');

                    return result.secure_url; // Store URL
                })
            );
        }

        next();
    } catch (error) {
        next(new ApiError('Error processing images', 500));
    }
});

// @desc    Get all Products
// @route   GET /api/v1/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
    const totalProducts = await Product.countDocuments();
    const features = new ApiFeatures(Product.find().populate({
        path: 'reviews',
        select: 'title ratings user',
    }), req.query)
        .paginate(totalProducts)
        .filter()
        .search('Products')
        .limitFields()
        .sort();

    const products = await features.mongooseQuery;

    res.status(200).json({
        results: products.length,
        pagination: features.paginationResult,
        data: products.map(sanitizeProduct)
    });
});

// @desc    Get a product
// @route   GET /api/v1/products/:id
// @access  Public
export const getProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let query = Product.findById(id).populate({
        path: 'reviews',
        select: 'content ratings user',
    });
    const product = await query;
    if (!product) {
        return next(new ApiError(`No product found with the ID ${id}.`, 404));
    }
    res.status(200).json({
        data: sanitizeProduct(product)
    });
});

// @desc    Create a product
// @route   POST /api/v1/products
// @access  Private
export const createProduct = asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json({
        data: sanitizeProduct(product),
    });
});

// @desc    Update a product
// @route   PUT /api/v1/products/:id
// @access  Private
export const updateProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
    );
    if (!product) {
        return next(new ApiError(`No product found with the ID ${id}`, 404));
    }

    product.save();
    
    res.status(200).json({
        data: sanitizeProduct(product)
    });
});

// @desc    Delete a product
// @route   PUT /api/v1/products/:id
// @access  Private
export const deleteProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id });

    if (!product) {
        return next(new ApiError(`No product found with the ID ${id}.`, 404));
    }
    res.status(204).send();
});