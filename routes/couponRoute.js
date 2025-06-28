import express from 'express';
import { getCoupons, createCoupon, getCoupon, updateCoupon, deleteCoupon } from '../services/couponService.js';
//import { getCouponValidator, createCouponValidator, updateCouponValidator, deleteCouponValidator } from '../utils/validators/CouponValidator.js';
import { protect, allowedTo } from '../services/authService.js';

const router = express.Router();

router.use(protect, allowedTo('admin'));

router.route('/')
    .get(getCoupons)
    .post(createCoupon);

router.route('/:id')
    .get(getCoupon)
    .put(updateCoupon)
    .delete(deleteCoupon);

export default router;