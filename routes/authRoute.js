import express from "express";
import { signup, login } from '../services/authService.js';
import { signupValidator, loginValidator } from "../utils/validators/authValidator.js";
//import { verifyTokenAdmin, verifyTokenAndAuthorized } from '../middleware/adminMiddleware';

const router = express.Router();

router.route('/signup')
    .post(signupValidator, signup);

router.route('/login')
    .post(loginValidator, login);

export default router;