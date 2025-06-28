import express from 'express';
import { getBrands, createBrand, getBrand, updateBrand, deleteBrand } from '../services/brandService.js';
import { getBrandValidator, createBrandValidator, updateBrandValidator, deleteBrandValidator } from '../utils/validators/brandValidator.js';
import { protect, allowedTo } from '../services/authService.js';
const router = express.Router();

router.route('/')
    .get(getBrands)
    .post(protect, allowedTo('admin'), createBrandValidator, createBrand);

router.route('/:id')
    .get(getBrandValidator, getBrand)
    .put(protect, allowedTo('admin'), updateBrandValidator, updateBrand)
    .delete(protect, allowedTo('admin'), deleteBrandValidator, deleteBrand);

export default router;