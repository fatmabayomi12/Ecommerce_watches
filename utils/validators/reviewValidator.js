import { check } from 'express-validator';
import validatorMiddleware from '../../middleware/validatorMiddleware.js';
import Review from '../../models/reviewModel.js';

export const createReviewValidator = [
    check('content')
        .optional(),

    check('ratings')
        .notEmpty()
        .withMessage('ratings value required')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Ratings value must be between 1 to 5'),

    check('user').isMongoId().withMessage('Invalid User id format'),

    check('product')
        .isMongoId()
        .withMessage('Invalid Product id format')
        .custom(async (val, { req }) => {
            const review = await Review.findOne({ user: req.user._id, product: req.body.product });
            if (review) {
                throw new Error('You already create a review before');
            }
        }),
    validatorMiddleware,
];

export const getReviewValidator = [
    check('id').isMongoId().withMessage('Invalid Review id format'),
    validatorMiddleware,
];

export const updateReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid Review id format')
        .custom(async (val, { req }) => {
            const review = await Review.findById(val);

            if (!review) {
                throw new Error(`There is no review with id ${val}`);
            }

            if (review.user._id.toString() !== req.user._id.toString()) {
                throw new Error(`You are not allowed to perform this action`);
            }
        }),
    validatorMiddleware,
];

export const deleteReviewValidator = [
    check('id')
        .isMongoId()
        .withMessage('Invalid Review id format')
        .custom((val, { req }) => {
            // Check review ownership before update
            if (req.user.role === 'user') {
                return Review.findById(val).then((review) => {
                    if (!review) {
                        return Promise.reject(
                            new Error(`There is no review with id ${val}`)
                        );
                    }
                    if (review.user._id.toString() !== req.user._id.toString()) {
                        return Promise.reject(
                            new Error(`Your are not allowed to perform this action`)
                        );
                    }
                });
            }
            return true;
        }),
    validatorMiddleware,
];
