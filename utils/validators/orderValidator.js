import { check } from 'express-validator';
import validatorMiddleware from '../../middleware/validatorMiddleware.js';

export const createOrderValidator = [
    // check('name')
    //     .notEmpty()
    //     .withMessage('Name is required')
    //     .isLength({ min: 3 })
    //     .withMessage('Too short user name'),

    // check('email')
    //     .notEmpty()
    //     .withMessage('Email is required')
    //     .isEmail()
    //     .withMessage(`Invalid email address`)
    //     .custom(async (val) => {
    //         const user = await User.findOne({ email: val });
    //         if (user) {
    //             return Promise.reject('Email already exists');
    //         }
    //     }),

    check('shippingAddress.address')
        .notEmpty()
        .withMessage('Address is required')
        .isLength({ min: 5 })
        .withMessage('Address must be at least 5 characters long'),

    check('shippingAddress.phone')
        .notEmpty()
        .withMessage('Phone is required')
        .isMobilePhone(["ar-EG"])
        .withMessage('Invalid phone number format for Egypt'),

    check('shippingAddress.city')
        .notEmpty()
        .withMessage('City is required'),

    check('cartItems')
        .isArray({ min: 1})
        .withMessage('At least one product is required'),

    check('cartItems.*.product')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid product ID format'),

    check('cartItems.*.quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt({ min: 1, max: 100})
        .withMessage('Quantity must be a positive number between 1 and 100'),

    validatorMiddleware
];

export const updateShippingPriceValidator = [
    check('shippingPrice')
        .notEmpty()
        .withMessage('Shipping Price is required')
        .isFloat({ min: 0 })
        .withMessage('Shipping price must be a positive number'),
    validatorMiddleware
];

// export const getOrderValidator = [
//     check('id')
//         .isMongoId()
//         .withMessage('Invalid order id format'),
//     validatorMiddleware
// ];

export const updateOrderValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid User id format'),
    validatorMiddleware,
];

export const deleteOrderValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid order id format'),
    validatorMiddleware,
];