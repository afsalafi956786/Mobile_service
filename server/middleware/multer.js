import multer from 'multer';

// Configure Multer for file upload
const storage = multer.memoryStorage(); // Stores file in memory (useful for Cloudinary)
 const upload = multer({ storage });

 export default upload;



