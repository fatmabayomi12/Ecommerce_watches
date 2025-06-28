import express from 'express';
import { createCashOrder, createDirectOrder, getAllOrders, getAllUserOrders, deleteOrder, updateShippingPrice, updateGlobalShippingPrice } from '../services/orderService.js';
import { protect, allowedTo } from '../services/authService.js';
import { createOrderValidator, deleteOrderValidator, updateShippingPriceValidator } from '../utils/validators/orderValidator.js';

const router = express.Router();

router.route('/')
    .get(protect, allowedTo('admin'), getAllOrders);

router.route('/my-orders')
    .get(protect, allowedTo('user'), getAllUserOrders);

router.route('/direct-order')
    .post(protect, allowedTo('user', 'admin'), createOrderValidator, createDirectOrder);

router.route('/:id')
    .delete(protect, allowedTo('user', 'admin'), deleteOrderValidator, deleteOrder);

router.route('/:id/shipping')
    .put(protect, allowedTo('admin'), updateShippingPriceValidator, updateShippingPrice);

router.route('/global-shipping')
    .put(protect, allowedTo('admin'), updateShippingPriceValidator, updateGlobalShippingPrice);


export default router;