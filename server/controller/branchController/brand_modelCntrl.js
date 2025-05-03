import MODEL from '../../model/UserModels/model.js';
import BRAND from '../../model/UserModels/brand.js';
import USER from '../../model/UserModels/user.js'
import BRANCH from '../../model/UserModels/branch.js';
import mongoose from 'mongoose'



export const createBrand = async(req,res,next)=>{
    try {

        const { branchAdminId , brands  } = req.body;

        const userId = req.user;

         const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchAdminId) {
            return res.status(400).json({ message: "Branch Admin ID is required!" });
        }

        if (!brands || !Array.isArray(brands) || brands.length === 0) {
            return res.status(400).json({ message: "Brands are required!" });
        }

      for(const brand of brands){
        if(!brand.name){
            return res.status(400).json({ message: "Brand name is required!" });
        }
      }

              // Collect all potential duplicates in one batch query
              const brandNames = brands.map((brnd) => brnd.name.trim().toLowerCase());
              const existingBrand = await BRAND.find({
                branchAdminId: branchAdminId,
                  name: { $in: brandNames },
                  isDeleted:false,
              }).collation({ locale: 'en', strength: 2 });
      
              if (existingBrand.length > 0) {
                  return res.status(400).json({
                      message: `The brand already exists!`,
                  });
              }

             
          const brandData = brands.map((brd) => ({
            name: brd.name,
            branchAdminId: branchAdminId,
            createdById: user._id,
            createdBy: user.name,
        }));
  

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

          const brands = await BRAND.find({  branchAdminId,  isDeleted: false,  }).sort({ createdAt: -1 });
         
          return res.status(200).json({ data: brands })

    }catch(err){
        next(err)
    }
}



export const updateBrand = async (req,res,next)=>{
    try{

       
        const { branchAdminId ,brandId , name } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchAdminId) {
            return res.status(400).json({ message: "Branch Admin ID is required!" });
        }

        if (!brandId) {
            return res.status(400).json({ message: "Brand Id is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "New brand name is required!" });
        }

        const branch = await BRANCH.findOne({ branchAdminId: branchAdminId, isDeleted: false });
        if (!branch) {
            return res.status(404).json({ message: "No branch found for the given Branch Admin!" });
        }

         // Verify if the department exists in the restaurant
         const brand = await BRAND.findOne({ _id: brandId, branchAdminId });
         if (!brand) {
             return res.status(404).json({ message: "Brand not found!" });
         }

         const existBrand = await BRAND.findOne({
            branchAdminId,
            name: name.trim(),
            isDeleted: false,
            _id: { $ne: brandId }, // Exclude the current department
        });

         if(existBrand){
            return res.status(400).json({
                message: `The brand already exists!`,
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

       
        const { branchAdminId ,brandId } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!branchAdminId) {
            return res.status(400).json({ message: "Branch Admin ID is required!" });
        }

        if (!brandId) {
            return res.status(400).json({ message: "Brand Id is required!" });
        }
       
         // Verify if the department exists in the restaurant
         const brand = await BRAND.findOne({ _id: brandId, branchAdminId });
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

        const { branchAdminId, brandId, models } = req.body;
        const userId = req.user;

        // Validate user
             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchAdminId) {
            return res.status(400).json({ message: "Branch Admin ID is required!" });
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

        const branch = await BRANCH.findOne({ branchAdminId: branchAdminId, isDeleted: false });
        if (!branch) {
            return res.status(404).json({ message: "No branch found for the given Branch Admin!" });
        }

        const brand = await BRAND.findOne({ _id : brandId , branchAdminId })
        if(!brand){
            return res.status(404).json({ message: "Brand not found in the specified branch!" });
        }
        

        // Collect position names (case-insensitive) and check for duplicates
        const modelNames = models.map((model) => model.name.trim().toLowerCase());
        const existingModel = await MODEL.find({
            brandId,
            branchAdminId,
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
            branchAdminId,
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
        const { branchAdminId } = req.params;

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



        // Aggregate to fetch positions with their departments in a flat structure
        const modelWithBrand = await MODEL.aggregate([
            {
                $match: { branchAdminId: new mongoose.Types.ObjectId(branchAdminId),  isDeleted: false },
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

        const { branchAdminId ,modelId , name } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchAdminId) {
            return res.status(400).json({ message: "Branch Admin ID is required!" });
        }

        if (!modelId) {
            return res.status(400).json({ message: "Model Id is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "New Model name is required!" });
        }

        const branch = await BRANCH.findOne({ branchAdminId: branchAdminId, isDeleted: false });
        if (!branch) {
            return res.status(404).json({ message: "No branch found for the given Branch Admin!" });
        }

     
        const model = await MODEL.findOne({ _id: modelId, branchAdminId });
        if(!model){
            return res.status(404).json({ message: "Model not found!" });
        }

        const existModel = await MODEL.findOne({
            branchAdminId,
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

       
        const { branchAdminId ,modelId } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchAdminId) {
            return res.status(400).json({ message: "Branch Admin ID is required!" });
        }


        if (!modelId) {
            return res.status(400).json({ message: "Model Id is required!" });
        }
       

        const branch = await BRANCH.findOne({ branchAdminId: branchAdminId, isDeleted: false });
        if (!branch) {
            return res.status(404).json({ message: "No branch found for the given Branch Admin!" });
        }

        const model = await MODEL.findOne({ _id: modelId, branchAdminId });
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