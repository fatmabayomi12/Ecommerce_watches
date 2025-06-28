import { check, body } from 'express-validator';
import validatorMiddleware from '../../middleware/validatorMiddleware.js';
import slugify from 'slugify';
import Category from '../../models/categoryModel.js';
import SubCategory from '../../models/subCategoryModel.js';

export const createProductValidator = [
  check('title')
    .isLength({ min: 3 })
    .withMessage('Product title must be at least 3 characters')
    .notEmpty()
    .withMessage('Product title is required')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('description')
    .isLength({ max: 2000 })
    .withMessage('Too long description'),
  check('quantity')
    .notEmpty()
    .withMessage('Product quantity is required')
    .isNumeric()
    .withMessage('Product quantity must be a number'),
  check('sold')
    .optional()
    .isNumeric()
    .withMessage('Product sold quantity must be a number'),
  check('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isNumeric()
    .withMessage('Product price must be a number')
    .isLength({ max: 32 })
    .withMessage('Too long price.'),
  check('priceAfterDiscount')
    .optional()
    .isNumeric()
    .withMessage('Product priceAfterDiscount must be a number.')
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error('priceAfterDiscount must be lower than price.');
      }
      return true;
    }),
  check('colors')
    .optional()
    .isArray()
    .withMessage('Colors should be array of string.'),
  check('imageCover')
    .notEmpty()
    .withMessage('product imageCover is required.'),
  check('images')
    .optional()
    .isArray()
    .withMessage('Images should be array of string.'),
  check('category')
    .notEmpty()
    .withMessage('Product must belong to a category.')
    .isMongoId()
    .withMessage('Invalid ID format.')
    .custom(async (categoryId) => {
      const category = await Category.findById(categoryId);
      if (!category) {
        return Promise.reject(
          new Error(`No category for this id: ${categoryId}`)
        );
      }
    }),
  check('subcategory')
    .optional()
    .isMongoId()
    .withMessage('Invalid ID format.')
    .custom(async (subCategoriesIds, { req }) => {
      const subcategories = await SubCategory.find({ _id: { $in: subCategoriesIds } });
      const validSubcategories = subcategories.map(sub => sub._id.toString());

      const categorySubcategories = await SubCategory.find({ category: req.body.category });
      const validCategorySubcategories = categorySubcategories.map(sub => sub._id.toString());

      const invalidSubcategories = subCategoriesIds.filter(subId => !validCategorySubcategories.includes(subId));
      if (invalidSubcategories.length > 0) {
        throw new Error('Some subcategories do not belong to this category.');
      }

      if (subcategories.length < subCategoriesIds.length) {
        throw new Error(`Invalid subcategories IDs`);
      }
    }),
  check('brand')
    .optional()
    .isMongoId()
    .withMessage('Invalid ID format.'),
  check('ratingsAverage')
    .optional()
    .isNumeric()
    .withMessage('ratingsAverage must be a number.')
    .isLength({ min: 1 })
    .withMessage('Rating must be above or equal 1.0.')
    .isLength({ max: 5 })
    .withMessage('Rating must be below or equal 5.0.'),
  check('ratingsQuantity')
    .optional()
    .isNumeric()
    .withMessage('ratingsQuantity must be a number.'),
  validatorMiddleware
];

export const getProductValidator = [
  check('id').isMongoId().withMessage('Invalid Product id format'),
  validatorMiddleware
]

export const updateProductValidator = [
  check('id').isMongoId().withMessage('Invalid product id format'),
  body('title')
    .optional()
    .custom((val, { req }) => {
      if(val) {
        req.body.slug = slugify(val, {lower: true });
      }
      return true;
    }),
  validatorMiddleware,
];

export const deleteProductValidator = [
  check('id').isMongoId().withMessage('Invalid product id format'),
  validatorMiddleware,
];