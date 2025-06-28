import express from 'express';
import { createSubCategory, getSubCategories, getSubCategory, updateSubCategory, deleteSubCategory } from '../services/subCategoryService.js';
import { createSubCategoryValidator, getSubCategoryValidator, updateSubCategoryValidator, deleteSubCategoryValidator } from '../utils/validators/subCategoryValidator.js';
import { protect, allowedTo } from '../services/authService.js';
const router = express.Router({
    mergeParams: true
});

router.route('/')
    .get(getSubCategories)
    .post(protect, allowedTo('admin'), createSubCategoryValidator, createSubCategory);

router.route('/:id')
    .get(getSubCategoryValidator, getSubCategory)
    .put(protect, allowedTo('admin'), updateSubCategoryValidator, updateSubCategory)
    .delete(protect, allowedTo('admin'), deleteSubCategoryValidator, deleteSubCategory)    

export default router;