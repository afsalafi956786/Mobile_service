import MODEL from '../../model/UserModels/model.js';
import BRAND from '../../model/UserModels/brand.js';
import USER from '../../model/UserModels/user.js'
import BRANCH from '../../model/UserModels/branch.js';
import mongoose from 'mongoose'



export const createBrand = async(req,res,next)=>{
    try {

        const { branchIds , brands  } = req.body;

        const userId = req.user;

         const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({ message: "Branch IDs are required!" });
        }

        if (!brands || !Array.isArray(brands) || brands.length === 0) {
            return res.status(400).json({ message: "Brands are required!" });
        }

      for(const brand of brands){
        if(!brand.name){
            return res.status(400).json({ message: "Brand name is required!" });
        }
      }


      let filter = {};

      if(user.role === "BranchAdmin"){
        filter = { _id: { $in: branchIds }, branchAdminId: user._id };
      }else if( user.role === 'User'){
        filter = { _id: { $in: branchIds }};
      }else{
        return res.status(403).json({ message: "Unauthorized!" });
      }

      const branches = await BRANCH.find(filter);
        if (!branches || branches.length === 0) {
            return res.status(404).json({ message: "No matching branches found!" });
        }

              // Collect all potential duplicates in one batch query
              const brandNames = brands.map((brnd) => brnd.name.trim().toLowerCase());
              const existingBrand = await BRAND.find({
                branchId: { $in: branchIds },
                  name: { $in: brandNames },
                  isDeleted:false,
              }).collation({ locale: 'en', strength: 2 });
      
              if (existingBrand.length > 0) {
                  return res.status(400).json({
                      message: `The brand already exists in the specified branch!`,
                  });
              }

    

          // Prepare department data for bulk insertion 
          const brandData = [];

          for (const branch of branches) {
             for(const brnd of brands){
                brandData.push({
                    name:brnd.name,
                    branchId :branch._id,
                    createdById : user._id,
                    createdBy: user.name,
                })
             }
          }

          const createdBrands = await BRAND.insertMany(brandData);
          

          return res.status(200).json({
            message: "Brand added successfully!",
            data: createdBrands,
        });
        
    } catch (err) {
        next(err)
    }
}


export const getAllBrands = async (req,res,next)=>{
    try{


        const { branchId  } = req.params;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }


        let filter = {};

        if(user.role === "BranchAdmin"){
          filter = { _id: branchId , branchAdminId: user._id };
        }else if( user.role === 'User'){
          filter = { _id: branchId };
        }else{
          return res.status(403).json({ message: "Unauthorized!" });
        }

        // const cacheKey = `departments:restaurant:${restaurantId}`;

  
        const branch = await BRANCH.findOne(filter);
          if (!branch) {
              return res.status(404).json({ message: "No matching branch found!" });
          }

          const brands = await BRAND.find({  branchId,  isDeleted: false,  }).sort({ createdAt: -1 });
         
          return res.status(200).json({ data: brands })

    }catch(err){
        next(err)
    }
}



export const updateBrand = async (req,res,next)=>{
    try{

       
        const { branchId ,brandId , name } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Brnach Id is required!" });
        }

        if (!brandId) {
            return res.status(400).json({ message: "Brand Id is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "New brand name is required!" });
        }

        let filter = {};

        // Access control based on user role
        if (user.role === "BranchAdmin") {
            filter = { _id: branchId , branchAdminId: user._id };
        } else if (user.role === "User") {
            filter = { _id: branchId };
        } else {
            return res.status(403).json({ message: "Unauthorized access!" });
        }

        const branch = await BRANCH.findOne(filter);
        if (!branch) {
            return res.status(404).json({ message: "No matching branch found!" });
        }

         // Verify if the department exists in the restaurant
         const brand = await BRAND.findOne({ _id: brandId, branchId });
         if (!brand) {
             return res.status(404).json({ message: "Brand not found!" });
         }

         const existBrand = await BRAND.findOne({
            branchId,
            name: name.trim(),
            isDeleted: false,
            _id: { $ne: brandId }, // Exclude the current department
        });

         if(existBrand){
            return res.status(400).json({
                message: `The brand already exists in the specified branch!`,
            });
         }

         if (brand.name === name.trim()) {
            return res.status(400).json({ message: "New brand name is the same as the current name!" });
        }

         brand.name = name.trim();
         await brand.save();

          // Redis Invalidate: Use pipeline for efficiency
        //   const departmentKey = `departments:restaurant:${restaurant._id}`;
        //   await redisClient.del(departmentKey);

         return res.status(200).json({
            message: "Brand updated successfully!",
            data: brand,
        });
 
    }catch(err){
        next(err)
    }
}



export const deleteBrand = async (req,res,next)=>{
    try{

       
        const { branchId ,brandId } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        if (!brandId) {
            return res.status(400).json({ message: "Brand Id is required!" });
        }
       

        let filter = {};

        // Access control based on user role
        if (user.role === "BranchAdmin") {
            filter = { _id: branchId, branchAdminId: user._id };
        } else if (user.role === "User") {
            filter = { _id: branchId };
        } else {
            return res.status(403).json({ message: "Unauthorized access!" });
        }

        const branch = await BRANCH.findOne(filter);
        if (!branch) {
            return res.status(404).json({ message: "No matching branch found!" });
        }

         // Verify if the department exists in the restaurant
         const brand = await BRAND.findOne({ _id: brandId, branchId });
         if (!brand) {
             return res.status(404).json({ message: "Brand not found!" });
         }

           // Check for associated positions and unlink them
        const associatedModel = await MODEL.find({ brandId });
        if (associatedModel.length > 0) {
            await MODEL.updateMany({ brandId }, { $set: { brandId: null } });
        }

            await BRAND.findByIdAndUpdate(brandId, {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user._id,
                deletedBy: user.name,
              });

         return res.status(200).json({
            message: "Brand deleted successfully!",
        });
 
    }catch(err){
        next(err)
    }
}



export const createModel = async (req,res,next)=>{
    try{

        const { branchId, brandId, models } = req.body;
        const userId = req.user;

        // Validate user
             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Restaurant ID is required!" });
        }
        if (!brandId) {
            return res.status(400).json({ message: "Brand Id is required!" });
        }
        if (!models || !Array.isArray(models) || models.length === 0) {
            return res.status(400).json({ message: "Models are required!" });
        }

        for (const model of models) {
            if (!model.name || typeof model.name !== "string" || model.name.trim().length === 0) {
                return res.status(400).json({ message: "Model name is required for each model!" });
            }
        }

        // Access control based on user role
        let filter = {};
        if (user.role === "BranchAdmin") {
            filter = { _id: branchId, branchAdminId: user._id };
        } else if (user.role === "User") {
            filter = { _id: branchId };
        } else {
            return res.status(403).json({ message: "Unauthorized access!" });
        }

        // Validate restaurant ownership
        const branch = await BRANCH.findOne(filter);
        if (!branch) {
            return res.status(404).json({ message: "No matching branch found!" });
        }

        const brand = await BRAND.findOne({ _id : brandId , branchId })
        if(!brand){
            return res.status(404).json({ message: "Brand not found in the specified branch!" });
        }
        

        // Collect position names (case-insensitive) and check for duplicates
        const modelNames = models.map((model) => model.name.trim().toLowerCase());
        const existingModel = await MODEL.find({
            brandId,
            branchId,
            isDeleted:false,
            name: { $in: modelNames }, // Case-insensitive match
        }).collation({ locale: 'en', strength: 2 });

        if (existingModel.length > 0) {
            const duplicateNames = existingModel.map((model) => model.name);
            return res.status(400).json({
                message: `Model already exist in this brand!`,
            });
        }


        // Prepare position data for bulk insertion 
        const modelData = models.map((model) => ({
            name: model.name.trim(),
            brandId,
            branchId,
            createdById: user._id,
            createdBy: user.name,
        }));


                const createdModel  = await MODEL.insertMany(modelData);



        return res.status(201).json({
            message: "Models added successfully!",
            data: createdModel,
        });
    }catch(err){
        next(err)
    }
}




export const getAllModels = async (req, res, next) => {
    try {
        const { branchId } = req.params;

        const userId = req.user;
             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        let filter = {};

        if (user.role === "BranchAdmin") {
            filter = { _id: branchId, branchAdminId: user._id };
        } else if (user.role === "User") {
            filter = { _id: branchId};
        } else {
            return res.status(403).json({ message: "Unauthorized!" });
        }

        const branch = await BRANCH.findOne(filter);
        if (!branch) {
            return res.status(404).json({ message: "No matching branch found!" });
        }


        // Aggregate to fetch positions with their departments in a flat structure
        const modelWithBrand = await MODEL.aggregate([
            {
                $match: { branchId: new mongoose.Types.ObjectId(branchId),  isDeleted: false },
            },
            {
                $lookup: {
                    from: "brands", // Collection to join with
                    localField: "brandId", // Field in the position collection
                    foreignField: "_id", // Field in the department collection
                    as: "brand", // Alias for the resulting joined data
                },
            },
            {
                $unwind: {
                    path: "$brand",
                    preserveNullAndEmptyArrays: true, // Include positions without a department
                },
            },
            {
                $project: {
                    _id: 1,
                    modelName: "$name",
                    brandName: { $ifNull: ["$brand.name", "No Brand"] },
                    createdAt: 1,
                    updatedAt: 1,
                    createdBy:1,
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by createdAt in descending order (latest first)
            },
        ]);;

        return res.status(200).json({ data: modelWithBrand });
    } catch (err) {
        next(err);
    }
};






export const updateModel = async (req,res,next)=>{
    try{

        const { branchId ,modelId , name } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        if (!modelId) {
            return res.status(400).json({ message: "Model Id is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "New Model name is required!" });
        }


        let filter = {};
        
        // Access control based on user role
        if (user.role === "BranchAdmin") {
            filter = { _id: branchId, branchAdminId: user._id };
        } else if (user.role === "User") {
            filter = { _id: branchId };
        } else {
            return res.status(403).json({ message: "Unauthorized access!" });
        }

        const branch = await BRANCH.findOne(filter);
        if (!branch) {
            return res.status(404).json({ message: "No matching branch found!" });
        }

        const model = await MODEL.findOne({ _id: modelId, branchId });
        if(!model){
            return res.status(404).json({ message: "Model not found!" });
        }

        const existModel = await MODEL.findOne({
            branchId,
            name: name.trim(),
            isDeleted: false,
            _id: { $ne: modelId }, 
        });

         if(existModel){
            return res.status(400).json({
                message: `The Model already exists in the specified branch!`,
            });
         }

         
         if (model.name === name.trim()) {
            return res.status(400).json({ message: "New model name is the same as the current name!" });
        }


        model.name = name.trim();
        await model.save();

        return res.status(200).json({
            message: "Model updated successfully!",
            data: model,
        })

    }catch(err){
        next(err);
    }
}


export const deleteModel = async (req,res,next)=>{
    try{

       
        const { branchId ,modelId } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        if (!modelId) {
            return res.status(400).json({ message: "Model Id is required!" });
        }
       

        let filter = {};

        // Access control based on user role
        if (user.role === "BranchAdmin") {
            filter = { _id: branchId, branchAdminId: user._id };
        } else if (user.role === "User") {
            filter = { _id: branchId };
        } else {
            return res.status(403).json({ message: "Unauthorized access!" });
        }

        const branch = await BRANCH.findOne(filter);
        if (!branch) {
            return res.status(404).json({ message: "No matching branch found!" });
        }

        const model = await MODEL.findOne({ _id: modelId, branchId });
        if(!model){
            return res.status(404).json({ message: "Model not found!" });
        }

        await MODEL.findByIdAndUpdate(modelId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            deletedBy: user.name,
          });
      
         return res.status(200).json({
            message: "Model deleted successfully!",
        });
 
    }catch(err){
        next(err)
    }
}


export const getModelByBrand = async(req,res,next)=>{
    try{

        const {  brandId   } = req.params;

        const userId = req.user;

        const user = await USER.findOne({_id:userId, isDeleted:false})
   if (!user) {
       return res.status(400).json({ message: "User not found!" });
   }

        if (!brandId) {
            return res.status(400).json({ message: "Brand Id is required!" });
        }

        const brand = await BRAND.findById(brandId);
        if(!brand){
            return res.status(400).json({ message:'Brand not found!'})
        }

        const model = await MODEL.find({ brandId });
        return res.status(200).json({ data: model})

    }catch(err){
        next(err);
    }

}