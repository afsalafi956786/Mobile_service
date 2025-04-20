import USER from '../../model/UserModels/user.js'
import DEPARTMENT from '../../model/UserModels/department.js'
import BRANCH from '../../model/UserModels/branch.js';
import POSITION from '../../model/UserModels/positions.js'
import mongoose from 'mongoose'



export const createDepartment = async (req,res,next)=>{
    try{


        const { branchIds , departments  } = req.body;

        const userId = req.user;

         const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({ message: "Branch IDs are required!" });
        }

        if (!departments || !Array.isArray(departments) || departments.length === 0) {
            return res.status(400).json({ message: "Departments are required!" });
        }

      for(const department of departments){
        if(!department.name){
            return res.status(400).json({ message: "Department name is required!" });
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
              const departmentNames = departments.map((dept) => dept.name.trim().toLowerCase());
              const existingDepartments = await DEPARTMENT.find({
                  restaurantId: { $in: branchIds },
                  name: { $in: departmentNames },
                  isDeleted:false,
              }).collation({ locale: 'en', strength: 2 });
      
              if (existingDepartments.length > 0) {
                  return res.status(400).json({
                      message: `The department already exists in the specified branch!`,
                  });
              }

    

          // Prepare department data for bulk insertion 
          const departmenetData = [];

          for (const branch of branches) {
             for(const dept of departments){
                departmenetData.push({
                    name:dept.name,
                    branchId :branch._id,
                    createdById : user._id,
                    createdBy: user.name,
                })
             }
          }

          const createdDepartments = await DEPARTMENT.insertMany(departmenetData);
          

          return res.status(200).json({
            message: "Departments added successfully!",
            data: createdDepartments,
        });

    }catch(err){
        next(err)
    }
}



export const getAllDepartment = async (req,res,next)=>{
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

          const departments = await DEPARTMENT.find({  branchId,  isDeleted: false,  }).sort({ createdAt: -1 });
         
          return res.status(200).json({ data: departments })

    }catch(err){
        next(err)
    }
}

export const updateDepartment = async (req,res,next)=>{
    try{

       
        const { branchId ,departmentId , name } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Brnach Id is required!" });
        }

        if (!departmentId) {
            return res.status(400).json({ message: "Department ID is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "New department name is required!" });
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
         const department = await DEPARTMENT.findOne({ _id: departmentId, branchId });
         if (!department) {
             return res.status(404).json({ message: "Department not found!" });
         }

         const existDepartment = await DEPARTMENT.findOne({
            branchId,
            name: name.trim(),
            isDeleted: false,
            _id: { $ne: departmentId }, // Exclude the current department
        });

         if(existDepartment){
            return res.status(400).json({
                message: `The department already exists in the specified branch!`,
            });
         }

         if (department.name === name.trim()) {
            return res.status(400).json({ message: "New department name is the same as the current name!" });
        }

         department.name = name.trim();
         await department.save();

          // Redis Invalidate: Use pipeline for efficiency
        //   const departmentKey = `departments:restaurant:${restaurant._id}`;
        //   await redisClient.del(departmentKey);

         return res.status(200).json({
            message: "Department updated successfully!",
            data: department,
        });
 
    }catch(err){
        next(err)
    }
}



export const deleteDepartment = async (req,res,next)=>{
    try{

       
        const { branchId ,departmentId } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        if (!departmentId) {
            return res.status(400).json({ message: "Department ID is required!" });
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
         const department = await DEPARTMENT.findOne({ _id: departmentId, branchId });
         if (!department) {
             return res.status(404).json({ message: "Department not found!" });
         }

           // Check for associated positions and unlink them
        const associatedPositions = await POSITION.find({ departmentId });
        if (associatedPositions.length > 0) {
            await POSITION.updateMany({ departmentId }, { $set: { departmentId: null } });
        }

            await DEPARTMENT.findByIdAndUpdate(departmentId, {
                isDeleted: true,
                deletedAt: new Date(),
                deletedById: user._id,
                deletedBy: user.name,
              });

         return res.status(200).json({
            message: "Department deleted successfully!",
        });
 
    }catch(err){
        next(err)
    }
}





export const createPosition = async (req,res,next)=>{
    try{

        const { branchId, departmentId, positions } = req.body;
        const userId = req.user;

        // Validate user
             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Restaurant ID is required!" });
        }
        if (!departmentId) {
            return res.status(400).json({ message: "Department ID is required!" });
        }
        if (!positions || !Array.isArray(positions) || positions.length === 0) {
            return res.status(400).json({ message: "Positions are required!" });
        }

        for (const position of positions) {
            if (!position.name || typeof position.name !== "string" || position.name.trim().length === 0) {
                return res.status(400).json({ message: "Position name is required for each position!" });
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

        const department = await DEPARTMENT.findOne({ _id : departmentId , branchId })
        if(!department){
            return res.status(404).json({ message: "Department not found in the specified branch!" });
        }
        

        // Collect position names (case-insensitive) and check for duplicates
        const positionNames = positions.map((position) => position.name.trim().toLowerCase());
        const existingPositions = await POSITION.find({
            departmentId,
            branchId,
            isDeleted:false,
            name: { $in: positionNames }, // Case-insensitive match
        }).collation({ locale: 'en', strength: 2 });

        if (existingPositions.length > 0) {
            const duplicateNames = existingPositions.map((position) => position.name);
            return res.status(400).json({
                message: `position already exist in this department!`,
            });
        }


        // Prepare position data for bulk insertion 
        const positionData = positions.map((position) => ({
            name: position.name.trim(),
            departmentId,
            branchId,
            createdById: user._id,
            createdBy: user.name,
        }));


                const createdPositions  = await POSITION.insertMany(positionData);



        return res.status(201).json({
            message: "Positions added successfully!",
            data: createdPositions,
        });
    }catch(err){
        next(err)
    }
}




export const getAllPositions = async (req, res, next) => {
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
        const positionsWithDepartments = await POSITION.aggregate([
            {
                $match: { branchId: new mongoose.Types.ObjectId(branchId),  isDeleted: false },
            },
            {
                $lookup: {
                    from: "departments", // Collection to join with
                    localField: "departmentId", // Field in the position collection
                    foreignField: "_id", // Field in the department collection
                    as: "department", // Alias for the resulting joined data
                },
            },
            {
                $unwind: {
                    path: "$department",
                    preserveNullAndEmptyArrays: true, // Include positions without a department
                },
            },
            {
                $project: {
                    _id: 1,
                    positionName: "$name",
                    departmentName: { $ifNull: ["$department.name", "No Department"] },
                    createdAt: 1,
                    updatedAt: 1,
                    createdBy:1,
                },
            },
            {
                $sort: { createdAt: -1 }, // Sort by createdAt in descending order (latest first)
            },
        ]);;

        return res.status(200).json({ data: positionsWithDepartments });
    } catch (err) {
        next(err);
    }
};




export const updatePosition = async (req,res,next)=>{
    try{

        const { branchId ,positionId , name } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        if (!positionId) {
            return res.status(400).json({ message: "Position ID is required!" });
        }
        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ message: "New Position name is required!" });
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

        const position = await POSITION.findOne({ _id: positionId, branchId });
        if(!position){
            return res.status(404).json({ message: "Position not found!" });
        }

        const existPosition = await POSITION.findOne({
            branchId,
            name: name.trim(),
            isDeleted: false,
            _id: { $ne: positionId }, 
        });

         if(existPosition){
            return res.status(400).json({
                message: `The position already exists in the specified branch!`,
            });
         }

         
         if (position.name === name.trim()) {
            return res.status(400).json({ message: "New position name is the same as the current name!" });
        }


        position.name = name.trim();
        await position.save();

        return res.status(200).json({
            message: "Position updated successfully!",
            data: position,
        })

    }catch(err){
        next(err);
    }
}



export const deletePosition = async (req,res,next)=>{
    try{

       
        const { branchId ,positionId } = req.body;

        const userId = req.user;

             const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

        if (!branchId) {
            return res.status(400).json({ message: "Branch ID is required!" });
        }

        if (!positionId) {
            return res.status(400).json({ message: "Position ID is required!" });
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

        const position = await POSITION.findOne({ _id: positionId, branchId });
        if(!position){
            return res.status(404).json({ message: "Position not found!" });
        }

        await POSITION.findByIdAndUpdate(positionId, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedById: user._id,
            deletedBy: user.name,
          });
      
         return res.status(200).json({
            message: "Position deleted successfully!",
        });
 
    }catch(err){
        next(err)
    }
}


export const getPositionByDepartment = async(req,res,next)=>{
    try{

        const {  departmentId   } = req.params;

        const userId = req.user;

        const user = await USER.findOne({_id:userId, isDeleted:false})
   if (!user) {
       return res.status(400).json({ message: "User not found!" });
   }

        if (!departmentId) {
            return res.status(400).json({ message: "Department ID is required!" });
        }

        const department = await DEPARTMENT.findById(departmentId);
        if(!department){
            return res.status(400).json({ message:'Department not found!'})
        }

        const position = await POSITION.find({ departmentId });
        return res.status(200).json({ data: position})

    }catch(err){
        next(err);
    }

}