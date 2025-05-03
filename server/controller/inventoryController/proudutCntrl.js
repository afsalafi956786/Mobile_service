import USER from '../../model/UserModels/user.js'
import BRANCH from '../../model/UserModels/branch.js'
import PRODUCT from '../../model/UserModels/product.js';
import UNIT from '../../model/UserModels/unit.js';
import BRAND from '../../model/UserModels/brand.js'
import MODEL from '../../model/UserModels/model.js'




export const createProduct = async (req, res, next) => {
    try {
      const {
        branchIds,
        name,
        brandId,
        modelId,
        purchaseUnit,
        baseUnit,
        conversionRate,
        stockCount,
        minStockAlert,
      } = req.body;
  
      const userId = req.user;
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      if (
        !branchIds ||
        branchIds.length < 0) {
        return res
          .status(400)
          .json({ message: "Restaurant IDs are required!" });
      }
  
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "product name is required!" });
      }
      
      if (!purchaseUnit) {
        return res.status(400).json({ message: "Purchase unit is required!" });
      }
      
      if (!baseUnit) {
        return res.status(400).json({ message: "Base unit is required!" });
      }
      if(!brandId){
        return res.status(400).json({ message: "Brand Id is required!" });
      }
      if(!modelId){
        return res.status(400).json({ message: "Model Id is required!" });
      }


      const brand  = await BRAND.findById(brandId);
      const model = await MODEL.findById(modelId);
      if (!brand || !model) {
        return res.status(400).json({ message: 'Brand or model is not found!' });
      }


      
      if (
        conversionRate === undefined ||
        conversionRate === null ||
        isNaN(Number(conversionRate))
      ) {
        return res
          .status(400)
          .json({ message: "Valid conversion rate is required!" });
      }
      
  
      let filter = {};
      if (user.role === "BranchAdmin") {
        filter = { _id: { $in: branchIds }, branchAdminId: user._id };
      } else if (user.role === "User") {
        filter = { _id: { $in: branchIds } };
      } else {
        return res.status(403).json({ message: "Unauthorized!" });
      }
  
      const branchs = await BRANCH.find(filter);
      if (!branchs || branchs.length === 0) {
        return res
          .status(404)
          .json({ message: "No matching branch found!" });
      }
  
      // Check for duplicate ingredient names
      const existingProduct = await PRODUCT.find({
        branchId: { $in: branchIds },
        name: { $regex: `^${name}$`, $options: "i" },
      }).collation({ locale: "en", strength: 2 });
  
      if (existingProduct.length > 0) {
        return res.status(400).json({
          message: `The product '${name}' already exists in the selected branch!`,
        });
      }
  
      const productData = branchs.map((branch) => ({
        name: name.trim(),
        purchaseUnit,
        baseUnit,
        brandId,
        modelId,
        conversionRate,
        stockCount: stockCount || 0,
        minStockAlert: minStockAlert || 0,
        branchId: branch._id,
        createdById: user._id,
        createdBy: user.name,
      }));
  
      const created = await PRODUCT.insertMany(productData);
  
      return res.status(200).json({
        message: "Products added successfully!",
        data: created,
      });
    } catch (err) {
      next(err);
    }
  };



  

  export const getAllProducts = async (req, res, next) => {
    try {
      const { branchId } = req.params;
      const userId = req.user;
  
      if (!branchId) {
        return res.status(400).json({ message: "Branch is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      // Permission check
      let filter = {};
      if (user.role === "BranchAdmin") {
          filter = { _id: branchId, branchAdminId: user._id };
      } else if (user.role === "User") {
          filter = { _id: branchId };
      } else {
          return res.status(403).json({ message: "Unauthorized!" });
      }

      const branchData = await BRANCH.findOne(filter);
      if (!branchData) {
          return res.status(404).json({ message: "No matching branch found!" });
      }
  
      const products = await PRODUCT.find({
        branchId,
        isDeleted: false,
      }).sort({ createdAt: -1 });
  
      return res.status(200).json({
        data: products,
      });
    } catch (err) {
      next(err);
    }
  };

  


  export const getOneProduct = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const userId = req.user;
  
      if (!productId) {
        return res.status(400).json({ message: "Product Id is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      const product = await PRODUCT.findOne({
        _id:productId,
        isDeleted: false,
      }).sort({ createdAt: -1 });
  
      return res.status(200).json({
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };


  


  export const updateProduct = async (req,res,next)=>{
    try {
      const {
        productId,
        name,
        purchaseUnit,
        baseUnit,
        brandId,
        modelId,
        conversionRate,
        stockCount,
        minStockAlert,
      } = req.body;

      const userId = req.user;

      if(!productId){
        return res.status(400).json({ message:'Product Id is required!'})
      };

      const user = await USER.findOne({ _id: userId , isDeleted:false})
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }

      const existing = await PRODUCT.findOne({
        _id: productId,
        isDeleted: false,
      });

      if (!existing) {
        return res.status(404).json({ message: "Product not found!" });
      }

      let filter = {};
      if (user.role === "BranchAdmin") {
          filter = { _id: existing.branchId, branchAdminId: user._id };
      } else if (user.role === "User") {
          filter = { _id:existing.branchId };
      } else {
          return res.status(403).json({ message: "Unauthorized!" });
      }

      const branchData = await BRANCH.findOne(filter);
      if (!branchData) {
          return res.status(404).json({ message: "No matching branch found!" });
      }

    if (name && name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await PRODUCT.findOne({
        _id: { $ne: productId },
        branchId: existing.productId,
        name: { $regex: `^${name}$`, $options: "i" },
      }).collation({ locale: "en", strength: 2 });

      if (duplicate) {
        return res.status(400).json({
          message: `The product '${name}' already exists in this branch!`,
        });
      }
    }

    if (name) existing.name = name.trim();
    if (purchaseUnit) existing.purchaseUnit = purchaseUnit;
    if(brandId) existing.brandId = brandId;
    if(modelId) existing.modelId = modelId;
    if (baseUnit) existing.baseUnit = baseUnit;
    if (conversionRate !== undefined && !isNaN(Number(conversionRate)))
      existing.conversionRate = Number(conversionRate);
    if (stockCount !== undefined) existing.stockCount = stockCount;
    if (minStockAlert !== undefined) existing.minStockAlert = minStockAlert;


    await existing.save();

    return res.status(200).json({ message:'Product updated successfully!',data:existing})

      
    } catch (err) {
      next(err)
      
    }

  }

  

  export const deleteProduct = async (req, res, next) => {
    try {
      const { productId } = req.params;
      const userId = req.user;
  
      if (!productId) {
        return res.status(400).json({ message: "Product Id is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      const product = await PRODUCT.findById(productId);
      if (!product || product.isDeleted) {
        return res.status(404).json({ message: "Product not found!" });
      }
  
      await PRODUCT.findByIdAndUpdate(productId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: user._id,
        deletedBy: user.name,
      });
  
      return res.status(200).json({ message: "Product deleted successfully!" });
    } catch (err) {
      next(err);
    }
  };