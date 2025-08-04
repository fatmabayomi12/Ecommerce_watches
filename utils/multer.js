import multer from 'multer'; // Importing multer here

// Store files in memory buffer
const multerStorage = multer.memoryStorage();

// Filter the uploaded files to only allow images
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images'), false);
    }
};

// Set up multer with storage and filter options
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

// Export the middleware for handling multiple image uploads
export const uploadProductImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },  // One cover image
    { name: 'images', maxCount: 5 }       // Up to five additional images
]);
// في ملف upload.js أو imageUploadMiddleware.js

export const uploadInstapayImage = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only images are allowed'), false);
    },
  }).single('instapayImage'); 
  