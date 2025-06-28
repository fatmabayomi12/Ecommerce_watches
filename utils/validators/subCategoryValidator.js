import { check, body } from 'express-validator';
import validatorMiddleware from '../../middleware/validatorMiddleware.js';
import slugify from 'slugify';

export const getSubCategoryValidator = [
  check('id').isMongoId().withMessage('Invalid category id format'),
  validatorMiddleware
];

export const createSubCategoryValidator = [
  check('name')
    .notEmpty()
    .withMessage('SubCategory required')
    .isLength({ min: 2 })
    .withMessage('Too short subcategory name')
    .isLength({ max: 32 })
    .withMessage('Too long subcategory name')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('category')
    .optional()
    .isMongoId().withMessage('Invalid category id format'),
  validatorMiddleware,
];

export const updateSubCategoryValidator = [
  check('id')
    .notEmpty().withMessage('SubCategory id is required')
    .isMongoId().withMessage('Invalid subcategory id format'),
  body('name').custom((val, { req }) => {
    req.body.slug = slugify(val);
    return true;
  }),
  validatorMiddleware,
];

export const deleteSubCategoryValidator = [
  check('id')
    .notEmpty().withMessage('SubCategory id is required')
    .isMongoId().withMessage('Invalid subcategory id format'),
  validatorMiddleware,
];