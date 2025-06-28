import express from 'express';
import { getCategories, createCategory, getCategory, updateCategory, deleteCategory } from '../services/categoryService.js';
import { getCategoryValidator, createCategoryValidator, updateCategoryValidator, deleteCategoryValidator } from '../utils/validators/categoryValidator.js';
import { protect, allowedTo } from '../services/authService.js';
import subcategoriesRoute from './subCategoryRoute.js';

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(protect, allowedTo('admin'), createCategoryValidator, createCategory);

router.route('/:id')
    .get(getCategoryValidator, getCategory)
    .put(protect, allowedTo('admin'), updateCategoryValidator, updateCategory)
    .delete(protect, allowedTo('admin'), deleteCategoryValidator, deleteCategory);

export default router;