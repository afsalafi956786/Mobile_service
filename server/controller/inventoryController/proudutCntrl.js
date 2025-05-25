import USER from '../../model/UserModels/user.js'
import BRANCH from '../../model/UserModels/branch.js'
import PRODUCT from '../../model/UserModels/product.js';
import UNIT from '../../model/UserModels/unit.js';
import BRAND from '../../model/UserModels/brand.js'
import MODEL from '../../model/UserModels/model.js'
import CATEGORY from '../../model/UserModels/category.js'




export const createProduct = async (req, res, next) => {
    try {
      const {
        name,
        branchIds,
        brandId,
        modelId,
        categoryId,
        variants,
        color,
        price,
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

      if(!name){
        return res.status(400).json({ message: "product name is required!" });
      }
      
      if (!purchaseUnit) {
        return res.status(400).json({ message: "Purchase unit is required!" });
      }
      
      if (!baseUnit) {
        return res.status(400).json({ message: "Base unit is required!" });
      }
      if(!categoryId){
        return res.status(400).json({ message: "Category Id is required!" });
      }
      if(!brandId){
        return res.status(400).json({ message: "Brand Id is required!" });
      }
      if(!modelId){
        return res.status(400).json({ message: "Model Id is required!" });
      }


      const brand  = await BRAND.findById(brandId);
      const model = await MODEL.findById(modelId);
      const category = await CATEGORY.findById(categoryId);
      if (!brand || !model) {
        return res.status(400).json({ message: 'Brand or model is not found!' });
      }
      if(!category){
        return res.status(400).json({ message:'Category not found!'})
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

      
      if (Array.isArray(variants)) {
        for (const p of variants) {
          if (!p.variantName || p.price === undefined || !p.color) {
            return res
              .status(400)
              .json({ message: "Each Variants must include a variant name,price and color" });
          }
        }
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
  
      // Check for duplicate model
      const existingProduct = await PRODUCT.findOne({
        modelId,
        branchId: { $in: branchIds },
        isDeleted: false, // if soft delete is implemented
      });
      
      if (existingProduct) {
        return res.status(400).json({
          message: `This Model already exists for the selected branch`,
        });
      }


  
      const productData = branchs.map((branch) => ({
        name,
        purchaseUnit,
        baseUnit,
        categoryId,
        price : variants && variants.length > 0 ? null : price,
        color: variants && variants.length > 0 ? null : color,
        variants: variants || [],
        brandId,
        modelId,
        conversionRate: Number(conversionRate),
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

      console.log(branchId,'b')
  
      // Permission check
      let filter = {};
      if (user.role === "BranchAdmin") {
          filter = { _id: branchId, branchAdminId: user._id };
          console.log(filter,'main')
      } else if (user.role === "User") {
          filter = { _id: branchId };
          conosle.log(filter,'fiuser')
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
      console.log(products,'prod')
  
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
      }).populate([
        { path: 'brandId', select: 'name' },
        { path: 'categoryId', select: 'name' },
        { path: 'modelId', select: 'name' },
      ])
      .sort({ createdAt: -1 });
  
      return res.status(200).json({
        data: product,
      });
    } catch (err) {
      next(err);
    }
  };


  


  export const updateProduct = async (req, res, next) => {
    try {
      const {
        name,
        productId,
        branchId,
        brandId,
        modelId,
        categoryId,
        variants,
        color,
        price,
        purchaseUnit,
        baseUnit,
        conversionRate,
        stockCount,
        minStockAlert,
      } = req.body;

      const userId = req.user;
  
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }

      if(!name){
        return res.status(400).json({ message: "Product name is required!" });
      }
  
      if (!branchId) {
        return res.status(400).json({ message: "Branch ID is required!" });
      }
  
      if (!purchaseUnit) {
        return res.status(400).json({ message: "Purchase unit is required!" });
      }
  
      if (!baseUnit) {
        return res.status(400).json({ message: "Base unit is required!" });
      }
  
      if (!categoryId) {
        return res.status(400).json({ message: "Category Id is required!" });
      }
  
      if (!brandId) {
        return res.status(400).json({ message: "Brand Id is required!" });
      }
  
      if (!modelId) {
        return res.status(400).json({ message: "Model Id is required!" });
      }
  
      const brand = await BRAND.findById(brandId);
      const model = await MODEL.findById(modelId);
      const category = await CATEGORY.findById(categoryId);
      if (!brand || !model) {
        return res.status(400).json({ message: "Brand or model is not found!" });
      }
      if (!category) {
        return res.status(400).json({ message: "Category not found!" });
      }
  
      if (
        conversionRate === undefined ||
        conversionRate === null ||
        isNaN(Number(conversionRate))
      ) {
        return res.status(400).json({ message: "Valid conversion rate is required!" });
      }
  
      if (Array.isArray(variants)) {
        for (const p of variants) {
          if (!p.variantName || p.price === undefined || !p.color) {
            return res
              .status(400)
              .json({ message: "Each variant must include variant name, price, and color!" });
          }
        }
      }
  
      // Check access permission for branch
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
  
      // Check product exists
      const existingProduct = await PRODUCT.findOne({ _id: productId, isDeleted: false });
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found!" });
      }
  
      // Check if the updated model already exists in same branch (for other product)
      const duplicateModel = await PRODUCT.findOne({
        _id: { $ne: productId },
        modelId,
        branchId,
        isDeleted: false,
      });
  
      if (duplicateModel) {
        return res.status(400).json({
          message: "This model already exists for the selected branch!",
        });
      }
  
      // Update product
      const updatedProduct = await PRODUCT.findByIdAndUpdate(
        productId,
        {
          name,
          purchaseUnit,
          baseUnit,
          categoryId,
          price: variants && variants.length > 0 ? null : price,
          color: variants && variants.length > 0 ? null : color,
          variants: variants || [],
          brandId,
          modelId,
          conversionRate: Number(conversionRate),
          stockCount: stockCount || 0,
          minStockAlert: minStockAlert || 0,
          branchId: branchId,
          updatedById: user._id,
          updatedBy: user.name,
          updatedAt: new Date(),
        },
        { new: true }
      );
  
      return res.status(200).json({
        message: "Product updated successfully!",
        data: updatedProduct,
      });
    } catch (err) {
      next(err);
    }
  };
  

  

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



  

  export const createCategory = async (req,res,next)=>{
    try{


        const { branchAdminId, categories  } = req.body;

        const userId = req.user;

         const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchAdminId) {
            return res.status(400).json({ message: "Branch Admin ID is required!" });
        }


        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ message: "Categories are required!" });
        }

      for(const category of categories){
        if(!category.name){
            return res.status(400).json({ message: "Category name is required!" });
        }
      }


      const branch = await BRANCH.findOne({ branchAdminId: branchAdminId, isDeleted: false });
        if (!branch) {
            return res.status(404).json({ message: "No branch found for the given Branch Admin!" });
        }

              // Collect all potential duplicates in one batch query
              const cateogryNames = categories.map((dept) => dept.name.trim().toLowerCase());
              const existingCategory = await CATEGORY.find({
                branchAdminId: branchAdminId,
                  name: { $in: cateogryNames },
                  isDeleted:false,
              }).collation({ locale: 'en', strength: 2 });
      
              if (existingCategory.length > 0) {
                  return res.status(400).json({
                      message: `The category already exists!`,
                  });
              }

          const categoryData = categories.map((dept) => ({
            name: dept.name,
            branchAdminId: branchAdminId,
            createdById: user._id,
            createdBy: user.name,
        }));

          const createdCateogries = await CATEGORY.insertMany(categoryData);
          

          return res.status(200).json({
            message: "Category added successfully!",
            data: createdCateogries,
        });

    }catch(err){
        next(err)
    }
}




export const getAllCategories = async (req,res,next)=>{
  try{

      const { branchAdminId  } = req.params;

      const userId = req.user;

           const user = await USER.findOne({_id:userId, isDeleted:false})
      if (!user) {
          return res.status(400).json({ message: "User not found!" });
      }

      if (!branchAdminId) {
          return res.status(400).json({ message: "Branch Admin ID is required!" });
      }

      const branch = await BRANCH.findOne({ branchAdminId: branchAdminId, isDeleted: false });
      if (!branch) {
          return res.status(404).json({ message: "No branch found for the given Branch Admin!" });
      }

        const category = await CATEGORY.find({  branchAdminId,  isDeleted: false,  }).sort({ createdAt: -1 });
       
        return res.status(200).json({ data: category })

  }catch(err){
      next(err)
  }
}




export const updateCategory = async (req,res,next)=>{
  try{

     
      const { branchAdminId ,categoryId , name } = req.body;

      const userId = req.user;

           const user = await USER.findOne({_id:userId, isDeleted:false})
      if (!user) {
          return res.status(400).json({ message: "User not found!" });
      }

      if (!branchAdminId) {
          return res.status(400).json({ message: "Branch Admin ID is required!" });
      }

      if (!categoryId) {
          return res.status(400).json({ message: "Category Id is required!" });
      }
      if (!name || typeof name !== "string" || name.trim().length === 0) {
          return res.status(400).json({ message: "New category name is required!" });
      }

      
      const branch = await BRANCH.findOne({ branchAdminId: branchAdminId, isDeleted: false });
      if (!branch) {
          return res.status(404).json({ message: "No branch found for the given Branch Admin!" });
      }

       // Verify if the department exists in the restaurant
       const category = await CATEGORY.findOne({ _id: categoryId, branchAdminId  });
       if (!category) {
           return res.status(404).json({ message: "Category not found!" });
       }

       const existCategory = await CATEGORY.findOne({
          branchAdminId,
          name: name.trim(),
          isDeleted: false,
          _id: { $ne: categoryId }, // Exclude the current department
      });

       if(existCategory){
          return res.status(400).json({
              message: `The category already exists!`,
          });
       }

       if (category.name === name.trim()) {
          return res.status(400).json({ message: "New category name is the same as the current name!" });
      }

       category.name = name.trim();
       await category.save();

        // Redis Invalidate: Use pipeline for efficiency
      //   const departmentKey = `departments:restaurant:${restaurant._id}`;
      //   await redisClient.del(departmentKey);

       return res.status(200).json({
          message: "Category updated successfully!",
          data: category,
      });

  }catch(err){
      next(err)
  }
}




export const deleteCategory = async (req,res,next)=>{
  try{

     
      const { branchAdminId ,categoryId } = req.body;

      const userId = req.user;

           const user = await USER.findOne({_id:userId, isDeleted:false})
      if (!user) {
          return res.status(400).json({ message: "User not found!" });
      }

      if (!branchAdminId) {
          return res.status(400).json({ message: "Branch Admin ID is required!" });
      }

     
       // Verify if the department exists in the restaurant
       const category = await CATEGORY.findOne({ _id: categoryId, branchAdminId });
       if (!category) {
           return res.status(404).json({ message: "Category not found!" });
       }

         // Check for associated positions and unlink them
      const associatedProduct = await PRODUCT.find({ categoryId });
      if (associatedProduct.length > 0) {
          await PRODUCT.updateMany({ categoryId }, { $set: { categoryId: null } });
      }

          await CATEGORY.findByIdAndUpdate(categoryId, {
              isDeleted: true,
              deletedAt: new Date(),
              deletedById: user._id,
              deletedBy: user.name,
            });

       return res.status(200).json({
          message: "Category deleted successfully!",
      });

  }catch(err){
      next(err)
  }
}
