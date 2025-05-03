import express from 'express'
import { LoginUser,registerBranch,createUser,getAllUser,getOneUser,updateUser,deleteUser } from '../controller/userController/user.js';
import  {  createDepartment,getAllDepartment,updateDepartment,deleteDepartment,createPosition,getAllPositions,updatePosition, deletePosition,getPositionByDepartment } from '../controller/employeeController/employeeCntrl.js'
import { VerifyToken } from '../middleware/jwt.js'
import { createBranch,getAllBranch,updateBranch,deleteBranch } from '../controller/branchController/branchCntrl.js';
import {  createBrand,getAllBrands,deleteBrand,updateBrand,createModel,getAllModels,updateModel,deleteModel,getModelByBrand } from '../controller/branchController/brand_modelCntrl.js'
import { createSupplier,updateSupplier,getAllSuppliers,deleteSupplier } from '../controller/inventoryController/supplierCntrls.js';
import { createUnitMeasurement,updateUnitMeasurement,getAllUnits,deleteUnits } from '../controller/inventoryController/unitCntrl.js';
import { createPurchase } from '../controller/inventoryController/purchaseCntrl.js'
import { createProduct,getAllProducts,getOneProduct,updateProduct,deleteProduct } from '../controller/inventoryController/proudutCntrl.js'

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
router.get('/department/:branchAdminId',VerifyToken,getAllDepartment);
router.put('/department',VerifyToken,updateDepartment);
router.delete('/department',VerifyToken,deleteDepartment);

//position
router.post('/position',VerifyToken,createPosition);
router.get('/position/:branchAdminId',VerifyToken,getAllPositions);
router.put('/position',VerifyToken,updatePosition);
router.delete('/position',VerifyToken,deletePosition)
router.get('/position-dept/:departmentId',VerifyToken,getPositionByDepartment)


//brand
router.post('/brand',VerifyToken,createBrand);
router.get('/brand/:branchAdminId',VerifyToken,getAllBrands);
router.put('/brand',VerifyToken,updateBrand);
router.delete('/brand',VerifyToken,deleteBrand);


//model
router.post('/model',VerifyToken,createModel);
router.get('/model/:branchAdminId',VerifyToken,getAllModels);
router.put('/model',VerifyToken,updateModel);
router.delete('/model',VerifyToken,deleteModel);
router.get('/model-id/:brandId',VerifyToken,getModelByBrand)


//user creation
router.post('/user',VerifyToken,createUser);
router.get('/user/:branchId',VerifyToken,getAllUser);
router.get('/user-data/:userId',VerifyToken,getOneUser);
router.put('/user',VerifyToken,updateUser);
router.delete('/user',VerifyToken,deleteUser);


//employee



//supplier
router.post('/supplier',VerifyToken,createSupplier);
router.get('/supplier/:branchId',VerifyToken,getAllSuppliers)
router.put('/supplier',VerifyToken,updateSupplier);
router.delete('/supplier/:supplierId',VerifyToken,deleteSupplier);

//unit 
router.post('/unit',VerifyToken,createUnitMeasurement);
router.put('/unit',VerifyToken,updateUnitMeasurement);
router.get('/unit/:branchAdminId',VerifyToken,getAllUnits);
router.delete('/unit/:unitId',VerifyToken,deleteUnits);


//procut
router.post('/product',VerifyToken,createProduct)
router.get('/products/:branchId',VerifyToken,getAllProducts);
router.get('/product/:productId',VerifyToken,getOneProduct);
router.put('/product',VerifyToken,updateProduct);
router.delete('/product/:productId',VerifyToken,deleteProduct)

//purchase
router.post('/purchase',VerifyToken,createPurchase);


















export default router;