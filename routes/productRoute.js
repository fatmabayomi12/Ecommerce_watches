import express from 'express';
import { getProducts, createProduct, getProduct, updateProduct, deleteProduct, resizeProductImages } from '../services/productService.js';
import { getProductValidator, createProductValidator, updateProductValidator, deleteProductValidator } from '../utils/validators/productValidator.js';
import { protect, allowedTo } from '../services/authService.js';
import { uploadProductImages } from '../utils/multer.js';
import reviewRoute from '../routes/reviewRoute.js';
const router = express.Router();

router.use('/:productId/reviews', reviewRoute)

router.route('/')
    .get(getProducts)
    .post(
        protect,
        allowedTo('admin'),
        uploadProductImages,
        resizeProductImages,
        createProductValidator,
        createProduct
    );

router.route('/:id')
    .get(getProductValidator, getProduct)
    .put(
        protect,
        allowedTo('admin'),
        uploadProductImages,
        resizeProductImages,
        updateProductValidator,
        updateProduct
    )
    .delete(
        protect,
        allowedTo('admin'),
        deleteProductValidator,
        deleteProduct
    );

export default router;
