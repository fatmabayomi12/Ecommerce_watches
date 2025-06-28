import ApiError from "../utils/apiError.js";

const sendErrorForDev = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorForProd = (err, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};

const handleJwtInvalidSignnature = () => 
    new ApiError('Invalid token, please log in again..');

const handleJwtExpired = () => 
    new ApiError('Expired token, please log in again..')

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if(process.env.NODE_ENV === "development") {
        sendErrorForDev(err, res);
    }
    else {
        if(err.name === 'JsonWebTokenError') err = handleJwtInvalidSignnature();
        if(err.name === 'TokenExpiredError') err = handleJwtExpired();
        sendErrorForProd(err, res);
    }
}

export default errorHandler;  