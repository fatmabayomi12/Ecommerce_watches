import express from "express";
import { createUser, getUsers, getUser, updateUser, deleteUser, changePassword, getLoggedUserData } from '../services/userService.js';
import { createUserValidator, getUserValidator, updateUserValidator, deleteUserValidator, changeUserPasswordValidator  } from '../utils/validators/userValidator.js';
import { protect, allowedTo } from "../services/authService.js";
//import { verifyTokenAndAdmin, verifyTokenAndAuthorized } from '../middleware/verifyToken.js';
const router = express.Router();

router.get('/getMe', protect, getLoggedUserData, getUser);

//router.use(protect, allowedTo('admin'))

router
    .route('/')
    .get(protect, allowedTo('admin'), getUsers)
    .post(createUserValidator, createUser);
router
    .route('/:id')
    .get(protect, allowedTo('admin'), getUserValidator, getUser)
    .delete(protect, allowedTo('admin'), deleteUserValidator, deleteUser);
router
    .route('/changePassword/:id')
    .put(protect, allowedTo('user'), changeUserPasswordValidator, changePassword);

router.put('/updateUser/:id', protect, allowedTo('user'), updateUserValidator, updateUser)

export default router;