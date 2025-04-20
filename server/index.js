import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import userRouter from './routes/userRouter.js'
import connectCloudinary from './middleware/cloudinary.js'
import dotenv from 'dotenv';




dotenv.config()
const app = express();


const port = process.env.PORT || 5000;
console.log(port,'port ')


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routers
app.use('/api/user',userRouter)


// Global error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
});


// Async startup logic
(async () => {
  try {
    await connectDB();
    await connectCloudinary();

    app.listen(port, "0.0.0.0", () => {
      console.log(` Server running on port ${port}`);
    });
  } catch (error) {
    console.error(" App failed to start:", error);
  }
})();