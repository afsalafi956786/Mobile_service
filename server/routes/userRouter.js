import express from 'express'
import { LoginUser,registerBranch } from '../controller/userController/user.js';
import  {  createDepartment,getAllDepartment,updateDepartment,deleteDepartment,createPosition,getAllPositions,updatePosition, deletePosition,getPositionByDepartment } from '../controller/employeeController/employeeCntrl.js'
import { VerifyToken } from '../middleware/jwt.js'
import { createBranch,getAllBranch,updateBranch,deleteBranch } from '../controller/branchController/branchCntrl.js';
import upload from '../middleware/multer.js';
import connectCloudinary from '../middleware/cloudinary.js'
const router = express.Router();




router.post('/login',LoginUser);
router.post('/register',registerBranch);

//branch
router.post('/branch',VerifyToken,upload.single('logo'),createBranch);
router.get('/branch',VerifyToken,getAllBranch);
router.put('/branch',VerifyToken,upload.single('logo'),updateBranch);
router.delete('/branch/:branchId',VerifyToken,deleteBranch)


//department
router.post('/department',VerifyToken,createDepartment);
router.get('/department/:branchId',VerifyToken,getAllDepartment);
router.put('/department',VerifyToken,updateDepartment);
router.delete('/department',VerifyToken,deleteDepartment);

router.post('/position',VerifyToken,createPosition);
router.get('/position/:branchId',VerifyToken,getAllPositions);
router.put('/position',VerifyToken,updatePosition);
router.delete('/position',VerifyToken,deletePosition)
router.get('/position-dept/:departmentId',VerifyToken,getPositionByDepartment)












export default router;