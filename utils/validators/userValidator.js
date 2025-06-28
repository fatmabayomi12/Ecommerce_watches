import { check, body } from 'express-validator';
import validatorMiddleware from '../../middleware/validatorMiddleware.js';
import slugify from 'slugify';
import bcrypt from 'bcrypt';
import User from '../../models/userModel.js';

export const createUserValidator = [
    check('name')
        .notEmpty()
        .withMessage('User required')
        .isLength({ min: 3 })
        .withMessage('Too short user name')
        .custom((val, { req }) => {
            req.body.slug = slugify(val);
            return true;
        }),

    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage(`Invalid email address`)
        .custom(async (val) => {
            const user = await User.findOne({ email: val});
            if(user) {
                throw new Error('Email already in use')
            }
        }),

    check('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .custom((password, { req }) => {
            if (password !== req.body.passwordConfirm) {
                throw new Error('Password Confirmation incorrect');
            }
            return true;
        }),
    check('passwordConfirm')
        .notEmpty()
        .withMessage('Password confirmation is required'),
    validatorMiddleware
];

export const getUserValidator = [
    check('id').isMongoId().withMessage('Invalid user id format'),
    validatorMiddleware
];

export const updateUserValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    body('name')
        .optional()
        .custom((val, { req }) => {
            req.body.slug = slugify(val);
            return true;
        }),
    check('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email address')
        .custom(async (val) => {
            const user = await User.findOne({ email: val});
            if(user) {
                throw new Error('Email already in use')
            }
        }),
    validatorMiddleware,
];

export const changeUserPasswordValidator = [
    check('id').isMongoId().withMessage('Invalid User id format'),
    body('currentPassword')
        .notEmpty()
        .withMessage('You must enter your current password'),
    body('passwordConfirm')
        .notEmpty()
        .withMessage('You must enter the password confirm'),
    body('password')
        .notEmpty()
        .withMessage('You must enter new password')
        .custom(async (val, { req }) => {
            // 1) Verify current password
            const user = await User.findById(req.params.id);
            if (!user) {
                throw new Error('There is no user for this id');
            }
            const isCorrectPassword = await bcrypt.compare(
                req.body.currentPassword,
                user.password
            );
            if (!isCorrectPassword) {
                throw new Error('Incorrect current password');
            }

            // 2) Verify password confirm
            if (val !== req.body.passwordConfirm) {
                throw new Error('Password Confirmation incorrect');
            }
            return true;
        }),
    validatorMiddleware,
];

export const deleteUserValidator = [
    check('id').isMongoId().withMessage('Invalid user id format'),
    validatorMiddleware,
];