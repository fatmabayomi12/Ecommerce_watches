import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import { sanitizeCart } from '../utils/sanitizeData.js';
import Product from '../models/productModel.js';
import Coupon from '../models/couponModel.js';
import Cart from '../models/cartModel.js';

// @desc    Add product to  cart
// @route   POST /api/v1/cart
// @access  Private/User
const calcTotalCartPrice = (cart) => {
    let totalPrice = 0;
    cart.cartItems.forEach((item) => {
        totalPrice += item.quantity * item.price;
    });
    cart.totalCartPrice = totalPrice;
    cart.totalPriceAfterDiscount = undefined;
    return totalPrice;
};

export const addProductToCart = asyncHandler(async (req, res, next) => {
    const { productId, color } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
        return next(new ApiError('Product not found', 404));
    }

    // 1) Get Cart for logged user
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        // create cart fot logged user with product
        cart = await Cart.create({
            user: req.user._id,
            cartItems: [{ product: productId, color, price: product.price }],
        });
    } else {
        // product exist in cart, update product quantity
        const productIndex = cart.cartItems.findIndex(
            (item) => item.product.toString() === productId && item.color === color
        );

        if (productIndex > -1) {
            const cartItem = cart.cartItems[productIndex];
            cartItem.quantity += 1;

            cart.cartItems[productIndex] = cartItem;
        } else {
            // product not exist in cart,  push product to cartItems array
            cart.cartItems.push({ product: productId, color, price: product.price });
        }
    }

    // Calculate total cart price
    calcTotalCartPrice(cart);
    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'Product added to cart successfully',
        numOfCartItems: cart.cartItems.length,
        data: sanitizeCart(cart)
    });
});

// @desc    Get logged user cart
// @route   GET /api/v1/cart
// @access  Private/User
export const getLoggedUserCart = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return next(
            new ApiError(`There is no cart for this user id : ${req.user._id}`, 404)
        );
    }

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: sanitizeCart(cart),
    });
});

// @desc    Remove specific cart item
// @route   DELETE /api/v1/cart/:itemId
// @access  Private/User
export const removeSpecificCartItem = asyncHandler(async (req, res, next) => {
    const cart = await Cart.findOneAndUpdate(
        { user: req.user._id },
        {
            $pull: { cartItems: { _id: req.params.itemId } },
        },
        { new: true }
    );

    calcTotalCartPrice(cart);
    cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: sanitizeCart(cart),
    });
});

// @desc    clear logged user cart
// @route   DELETE /api/v1/cart
// @access  Private/User
export const clearCart = asyncHandler(async (req, res, next) => {
    await Cart.findOneAndDelete({ user: req.user._id });
    res.status(204).send();
    next();
});

// @desc    Update specific cart item quantity
// @route   PUT /api/v1/cart/:itemId
// @access  Private/User
export const updateCartItemQuantity = asyncHandler(async (req, res, next) => {
    const { quantity } = req.body;

    if (quantity < 1) {
        return next(new ApiError('Quantity must be at least 1', 400));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        return next(new ApiError(`there is no cart for user ${req.user._id}`, 404));
    }

    const itemIndex = cart.cartItems.findIndex(
        (item) => item._id.toString() === req.params.itemId
    );
    if (itemIndex > -1) {
        const cartItem = cart.cartItems[itemIndex];
        cartItem.quantity = quantity;
        cart.cartItems[itemIndex] = cartItem;
    } else {
        return next(
            new ApiError(`there is no item for this id :${req.params.itemId}`, 404)
        );
    }

    calcTotalCartPrice(cart);

    await cart.save();

    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: sanitizeCart(cart),
    });
});

// @desc    Apply coupon on logged user cart
// @route   PUT /api/v1/cart/applyCoupon
// @access  Private/User
export const applyCoupon = asyncHandler(async (req, res, next) => {
    // 1) Get coupon based on coupon name
    const coupon = await Coupon.findOne({
        name: req.body.coupon,
        expire: { $gt: Date.now() },
    });

    if (!coupon) {
        return next(new ApiError(`Coupon is invalid or expired`, 400));
    }

    // 2) Get logged user cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        return next(new ApiError('Cart not found', 404));
    }

    // 6) Apply discount to totalCartPrice
    cart.totalPriceAfterDiscount = (cart.totalCartPrice * (1 - coupon.discount / 100)).toFixed(2);

    // 7) Save the cart
    await cart.save();

    // 8) Send response
    res.status(200).json({
        status: 'success',
        numOfCartItems: cart.cartItems.length,
        data: sanitizeCart(cart),
    });
});
