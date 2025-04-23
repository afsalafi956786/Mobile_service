import express from 'express'
import { LoginUser,registerBranch } from '../controller/userController/user.js';
import  {  createDepartment,getAllDepartment,updateDepartment,deleteDepartment,createPosition,getAllPositions,updatePosition, deletePosition,getPositionByDepartment } from '../controller/employeeController/employeeCntrl.js'
import { VerifyToken } from '../middleware/jwt.js'
import { createBranch,getAllBranch,updateBranch,deleteBranch } from '../controller/branchController/branchCntrl.js';
import {  createBrand,getAllBrands,deleteBrand,updateBrand,createModel,getAllModels,updateModel,deleteModel,getModelByBrand } from '../controller/branchController/brand_modelCntrl.js'

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

//position
router.post('/position',VerifyToken,createPosition);
router.get('/position/:branchId',VerifyToken,getAllPositions);
router.put('/position',VerifyToken,updatePosition);
router.delete('/position',VerifyToken,deletePosition)
router.get('/position-dept/:departmentId',VerifyToken,getPositionByDepartment)


//brand
router.post('/brand',VerifyToken,createBrand);
router.get('/brand/:branchId',VerifyToken,getAllBrands);
router.put('/brand',VerifyToken,updateBrand);
router.delete('/brand',VerifyToken,deleteBrand);


//model
router.post('/model',VerifyToken,createModel);
router.get('/model/:branchId',VerifyToken,getAllModels);
router.put('/model',VerifyToken,updateModel);
router.delete('/model',VerifyToken,deleteModel);
router.get('/model-id/:brandId',VerifyToken,getModelByBrand)












export default router;