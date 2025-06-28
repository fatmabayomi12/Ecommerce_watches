import express from 'express';
import { getReviews, getReview, createReview, updateReview, deleteReview, createFilterObj, setProductIdAndUserIdToBody } from '../services/reviewService.js';
import { createReviewValidator, updateReviewValidator, getReviewValidator, deleteReviewValidator } from '../utils/validators/reviewValidator.js';
import { protect, allowedTo } from '../services/authService.js';

const router = express.Router({ mergeParams: true });

router.route('/')
    .get(getReviews)
    .post(protect, allowedTo('user'), setProductIdAndUserIdToBody, createReviewValidator, createReview)

router.route('/:id')
    .get(getReviewValidator, getReview)
    .put(protect, allowedTo('user'), updateReviewValidator, updateReview)
    .delete(protect, allowedTo('admin', 'user'), deleteReviewValidator, deleteReview);

export default router;