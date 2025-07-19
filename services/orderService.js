import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import ApiFeatures from '../utils/apiFeatures.js';
import { sanitizeOrder } from '../utils/sanitizeData.js';
import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';
import globalShippingPrice from '../models/shippingPriceModel.js';
import Order from '../models/orderModel.js';

// @desc    Create direct order
// @route   POST /api/v1/orders/direct-order
// @access  Protected/User
export const createDirectOrder = asyncHandler(async (req, res, next) => {
    const { cartItems, shippingAddress } = req.body;

    if (!cartItems || cartItems.length === 0) {
        return next(new ApiError('No products provided', 400));
    }

    const productIds = cartItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== cartItems.length) {
        return next(new ApiError('Some products do not exist', 400));
    }

    let totalOrderPrice = 0;
    let updatedCartItems = [];

    for (const item of cartItems) {
        const product = products.find((p) => String(p._id) === String(item.product));
        if (!product) {
            return next(new ApiError(`Product not found: ${item.product}`, 404));
        }
        if (product.quantity < item.quantity) {
            return next(
                new ApiError(
                    `Insufficient stock for "${product.title}". Available: ${product.quantity}, Requested: ${item.quantity}`,
                    400
                )
            );
        }

        totalOrderPrice += product.price * item.quantity;

        updatedCartItems.push({
            product: item.product,
            quantity: item.quantity,
            color: item.color,
            price: product.price
        });
    }

    const newOrder = await Order.create({
        user: req.user._id,
        cartItems: updatedCartItems,
        shippingAddress,
        totalOrderPrice,
        isPaid: false
    });

    const bulkOption = cartItems.map((item) => ({
        updateOne: {
            filter: { _id: item.product },
            update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
        }
    }));

    if (bulkOption.length > 0) {
        await Product.bulkWrite(bulkOption, {});
    }

    await newOrder.populate({
        path: 'user',
        select: '_id name email'
    });

    res.status(201).json({
        status: 'success',
        data: sanitizeOrder(newOrder)
    });
});

// export const createDirectOrder = asyncHandler(async (req, res, next) => {
//     const { cartItems, shippingAddress } = req.body;
//     if (!cartItems || cartItems.length === 0) {
//         return next(new ApiError('No products provided', 400));
//     }

//     const productIds = cartItems.map((item) => item.product);
//     const products = await Product.find({ _id: { $in: productIds } });

//     if (products.length !== cartItems.length) {
//         return next(new ApiError('Some products do not exist', 400));
//     }

//     let totalOrderPrice = 0;
//     let updatedCartItems = [];

//     for (const item of cartItems) {
//         const product = products.find((p) => String(p._id) === String(item.product));
//         if (!product) {
//             return next(new ApiError(`Product not found: ${item.product}`, 404));
//         }
//         if (product.quantity < item.quantity) {
//             return next(
//                 new ApiError(
//                     `Insufficient stock for "${product.title}". Available: ${product.quantity}, Requested: ${item.quantity}`,
//                     400
//                 )
//             );
//         }

//         totalOrderPrice += product.price * item.quantity;

//         updatedCartItems.push({
//             product: item.product,
//             quantity: item.quantity,
//             color: item.color,
//             price: product.price
//         });
//     }

//     // let shippingPrice = 0;
//     // try {
//     //     const shPrice = await globalShippingPrice.findOne();
//     //     if (shPrice && shPrice.shippingPrice) {
//     //         shippingPrice = shPrice.shippingPrice;
//     //     }
//     // } catch (error) {
//     //     return next(new ApiError('Error fetching shipping price', 500));
//     // }

//     // totalOrderPrice += shippingPrice;

//     const newOrder = await Order.create({
//         user: req.user._id,
//         cartItems: updatedCartItems,
//         shippingAddress,
//         totalOrderPrice,
//         isPaid: false
//     });

//     const bulkOption = cartItems.map((item) => ({
//         updateOne: {
//             filter: { _id: item.product },
//             update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
//         }
//     }));

//     if (bulkOption.length > 0) {
//         await Product.bulkWrite(bulkOption, {});
//     }

//     await newOrder.populate({
//         path: 'user',
//         select: '_id name email'
//     });

//     res.status(201).json({
//         status: 'success',
//         data: sanitizeOrder(newOrder)
//     });
// });


const calculateTotalOrderPrice = (cart) => {
    return cart.totalPriceAfterDiscount || cart.totalCartPrice;
};

// @desc    Create cash order
// @route   POST /api/v1/orders/cartId
// @access  Protected/User
export const createCashOrder = asyncHandler(async (req, res, next) => {
    const shPrice = await globalShippingPrice.findOne();
    const shippingPrice = shPrice ? shPrice.shippingPrice : 0;
    const cart = await Cart.findById(req.params.cartId);

    if (!cart) {
        return next(
            new ApiError(`There is no such cart with id ${req.params.cart}`, 404)
        );
    }

    const totalOrderPrice = calculateTotalOrderPrice(cart) + shippingPrice;

    const order = await Order.create({
        user: req.user._id,
        cartItems: cart.cartItems,
        shippingAddress: req.body.shippingAddress,
        shippingPrice,
        totalOrderPrice,
        paymentMethodType: 'cash',
        isPaid: false
    });

    if (order) {
        const bulkOption = cart.cartItems.map((item) => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
            }
        }));

        await Product.bulkWrite(bulkOption, {});

        await Cart.findByIdAndDelete(req.params.cartId);
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
    const apiFeatures = new ApiFeatures(Order.find({ user: req.user._id }).populate('user', 'name email -_id').select('-_id -__v'), req.query).paginate(decumentsCounts);
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
        return res.status(200);
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
    return res.status(200);

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