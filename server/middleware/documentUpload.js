import multer from "multer";

const documentStorage = multer.memoryStorage(); // Store files in memory for Cloudinary uploads

const uploadDocuments = multer({
    storage: documentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
}).fields([
    { name: "documents", maxCount: 10 }, // Allow up to 10 files for 'documents'
]);

export default uploadDocuments;