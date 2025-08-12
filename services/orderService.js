import asyncHandler from 'express-async-handler';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '../utils/apiError.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { sanitizeOrder } from '../utils/sanitizeData.js';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import globalShippingPrice from '../models/shippingPriceModel.js';
import Order from '../models/orderModel.js';
import cloudinary from '../utils/cloudinary.js';


export const uploadToCloudinary = (buffer, filename, folder) => {
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


export const resizeInstaPayImage = async (req, res, next) => {
    try {
      if (!req.file) return next();
  
      const filename = `product-${uuidv4()}`;
  
      const buffer = await sharp(req.file.buffer)
        .resize(800, 800, {
          fit: sharp.fit.cover,
          position: sharp.strategy.center,
        })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer();
  
      const result = await uploadToCloudinary(buffer, filename, 'products');
  
      if (!req.body.shippingAddress) {
        req.body.shippingAddress = {};
      }
  
      req.body.shippingAddress.image = result.secure_url;
  
      next();
    } catch (error) {
      console.error(error);
      next(new ApiError('Failed to process InstaPay image', 500));
    }
  };
  
// @desc    Create direct order
// @route   POST /api/v1/orders/direct-order
// @access  Protected/User
export const createDirectOrder = asyncHandler(async (req, res, next) => {
    const shippingPriceData = await globalShippingPrice.findOne();
    const shippingPrice = shippingPriceData ? shippingPriceData.shippingPrice : 0;

    const { cartItems, shippingAddress, paymentMethodType } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return next(new ApiError('Cart items are required', 400));
    }

    let totalOrderPrice = 0;
    for (const item of cartItems) {
        const product = await Product.findById(item.product);
        if (!product) {
            return next(new ApiError(`Product not found: ${item.product}`, 404));
        }

        if (item.quantity > product.quantity) {
            return next(new ApiError(`Not enough quantity for product: ${product.name}`, 400));
        }

        totalOrderPrice += product.price * item.quantity;
    }

    totalOrderPrice += shippingPrice;

    // ✅ رفع صورة InstaPay لو الدفع instapay
    let instapayImageUrl = null;
    if (paymentMethodType === 'instapay' && req.file) {
        const imageName = `instapay-${uuidv4()}`;
        const buffer = await sharp(req.file.buffer)
            .resize(800, 800, {
                fit: sharp.fit.contain,
                background: { r: 255, g: 255, b: 255 }
            })
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer();

        const result = await uploadToCloudinary(buffer, imageName, 'payments');
        instapayImageUrl = result.secure_url;
    }

    const order = await Order.create({
        user: req.user._id,
        cartItems,
        shippingAddress,
        shippingPrice,
        totalOrderPrice,
        paymentMethodType: paymentMethodType || 'cash',
        isPaid: paymentMethodType === 'instapay', // بيعتبره مدفوع لو انستا باي
        instapayScreenshot: instapayImageUrl
    });

    if (order) {
        const bulkOption = cartItems.map((item) => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
            }
        }));
        await Product.bulkWrite(bulkOption, {});
    }

    await order.populate({
        path: 'user',
        select: '_id name email'
    });

    res.status(201).json({
        status: 'success',
        data: sanitizeOrder(order)
    });
});


const calculateTotalOrderPrice = (cart) => {
    return cart.totalPriceAfterDiscount || cart.totalCartPrice;
};

// @desc    Create cash order
// @route   POST /api/v1/orders
// @access  Protected/User
export const createCashOrder = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id }); 
  
    if (!cart) {
      return next(new ApiError(`Cart not found`, 404));
    }

    for (const item of cart.cartItems) {
        const product = await Product.findById(item.product);
        if (!product || product.quantity < item.quantity) {
          return next(new ApiError(`الكمية المطلوبة غير متوفرة لمنتج ${product?.name}`, 400));
        }
      }
      
  
    const taxPrice = 0;
    const shippingPrice = 0;
  
    const cartPrice = cart.totalPriceAfterDiscount || cart.totalCartPrice;
    const totalOrderPrice = cartPrice + taxPrice + shippingPrice;
  
    const orderData = {
        user: req.user._id,
        cartItems: cart.cartItems,
        shippingAddress: {
        address: req.body.address,
        phone: req.body.phone,
        city: req.body.city,
        paymentMethodType: req.body.paymentMethodType || 'cash'
      },
      totalOrderPrice
    };
  
    if (
      req.body.paymentMethodType === 'InstaPay' &&
      req.file &&
      req.file.buffer
    ) {
      const imageBuffer = await sharp(req.file.buffer)
        .resize(600, 800)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer();
  
      const filename = `instapay-${uuidv4()}`;
      const result = await uploadToCloudinary(imageBuffer, filename, 'orders');
  
      orderData.shippingAddress.image = result.secure_url;
    }
  
    const order = await Order.create(orderData);
    for (const item of cart.cartItems) {
        await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity, sold: +item.quantity }
        });
    }
  
    // Clear cart
    await Cart.findOneAndDelete({ user: req.user._id }); // ✅
  
    res.status(201).json({ status: 'success', data: order });
  });
  
  

export const getAllOrders = asyncHandler(async (req, res, next) => {
    const decumentsCounts = await Order.countDocuments();
    const apiFeatures = new ApiFeatures(Order.find().populate('user', 'name email -_id'), req.query).paginate(decumentsCounts);

    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;

    res.status(200).json({
        results: documents.length,
        paginationResult,
        data: documents
    });
});

export const getAllUserOrders = asyncHandler(async (req, res, next) => {
    const decumentsCounts = await Order.countDocuments();
    const apiFeatures = new ApiFeatures(Order.find({ user: req.user._id }).populate('user', 'name email -_id').select('-__v'), req.query).paginate(decumentsCounts)
        .sort({ createdAt: -1 });
    const { mongooseQuery, paginationResult } = apiFeatures;
    const orders = await mongooseQuery;

    res.status(200).json({
        results: orders.length,
        paginationResult,
        data: orders
    });
});

export const deleteOrder = asyncHandler(async (req, res, next) => {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
        return next(
            new ApiError(`There is no such order with id ${orderId}`, 404)
        );
    }

    if (req.user.role !== 'admin' && String(order.user) !== req.user.id) {
        return next(new ApiError('Unauthorized to delete this order', 403));
    }

    if (req.user.role === 'admin') {
        await Order.findByIdAndDelete(orderId);
        return res.status(200).json([]);
    }

    const orderTime = new Date(order.createdAt);
    const currentTime = new Date();

    const timeDifference = (currentTime - orderTime) / (1000 * 60 * 60);

    if (timeDifference > 1) {
        return next(
            new ApiError('You can only delete orders within 1 hour', 400)
        );
    }

    await Order.findByIdAndDelete(orderId);
    return res.status(200).json([]);

});

export const updateGlobalShippingPrice = asyncHandler(async (req, res, next) => {
    const { shippingPrice } = req.body;

    let price = await globalShippingPrice.findOne();
    if (!price) {
        price = new globalShippingPrice({ shippingPrice });
    }
    else {
        price.shippingPrice = shippingPrice;
    }

    await price.save();

    res.status(200).json({
        status: 'success',
        data: price
    });
});

export const updateShippingPrice = asyncHandler(async (req, res, next) => {
    const { shippingPrice } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ApiError('Order not found', 404));
    }

    const updatedTotalOrderPrice = order.totalOrderPrice + (shippingPrice - order.shippingPrice);

    order.shippingPrice = shippingPrice;
    order.totalOrderPrice = updatedTotalOrderPrice;
    await order.save();

    res.status(200).json({
        status: 'success',
        data: order
    });
});