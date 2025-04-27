import USER from '../../model/UserModels/user.js';
import BRANCH from '../../model/UserModels/branch.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'
import EMPLOYEE from '../../model/UserModels/employee.js'



export const LoginUser = async (req,res,next)=>{
    try{

        const {  email, password } = req.body;

        if(!email){
            return res.status(404).json({ message:'Email is required!'})
        }
        if(!password){
            return res.status(404).json({ message:'Password is required!'})
        }

        // const userAggregation = await USER.aggregate([
        //     { $match: { email } },
        //     {
        //         $lookup: {
        //             from: "permissions", // collection name (usually lowercase plural of model)
        //             localField: "permissions",
        //             foreignField: "_id",
        //             as: "permissions"
        //         }
        //     },
        //     { $limit: 1 }
        // ]);

        // if (!userAggregation || userAggregation.length === 0) {
        //     return res.status(400).json({ message: "User not found!" });
        // }

        // const user = userAggregation[0];

        const user = await USER.findOne({ email: email, isDeleted:false });
        if(!user){
             return res.status(400).json({ message:'User not found!'})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password!" });
        }

        const token = jwt.sign({id:user._id,role:user.role,email:user.email}
            ,process.env.JWT_SECRET_KEY , {expiresIn:'30d' }
        )

        return res.status(200).json({ message:'Login successful',token,user})

    }catch(err){
        next(err)
    }
}

export const registerBranch = async (req,res,next)=>{
    try{

        const {
            name,
            email,
            phone,
            password,
            companyName,
            companyPhone,
            country,
            state,
            city
          } = req.body;

          if(!name) return res.status(400).json({ message: "Name is required!" });
          if(!email)  return res.status(400).json({ message: "Email is required!" });
          if(!password)  return res.status(400).json({ message: "Password is required!" });
          if(!companyName)  return res.status(400).json({ message: "Company name is required!" });
          if(!companyPhone)  return res.status(400).json({ message: "Phone number is required!" });
          if(!country)  return res.status(400).json({ message: "Country is required!" });
          if(!state)  return res.status(400).json({ message: "State is required!" });
          if(!city)  return res.status(400).json({ message: "City is required!" })


          const existingEmail = await USER.findOne({ email ,isDeleted:false });
          if (existingEmail) {
            return res.status(409).json({ message: "Email already registered!" });
          }
         if(phone){
            const existingPhone = await USER.findOne({ phone , isDeleted:false });
          if (existingPhone) {
            return res.status(409).json({ message: "Phone number already registered!" });
          }
         }
          

          const existCompanyPhone = await BRANCH.findOne({ phone: companyPhone , isDeleted:false });

          if (existCompanyPhone) {
            return res.status(409).json({ message: "Company phone number already registered!" });
          }

          const hashPassword = await bcrypt.hash(password,10)

          const user = await USER.create({
            name,
            email,
            password: hashPassword,
            phone,
            role: 'BranchAdmin',
            branchIds: []
          })

          const branch = await BRANCH.create({
            branchAdminId: user._id,
            companyName,
            phone: companyPhone,
            country,
            state,
            city
          });

          user.branchIds.push(branch._id);
          await user.save();

          const token = jwt.sign({id:user._id,role:user.role,email:user.email}
            ,process.env.JWT_SECRET_KEY , {expiresIn:'30d' }
        )

          return res.status(201).json({ message: "Company registered successfully", token, user, branch })
          
    }catch(err){
        next(err)
    }
}


export const createUser = async(req,res,next)=>{
  try {

    const { branchIds ,name, departmentId , positionId , email, password  } = req.body

    const userId = req.user;

    const user = await USER.findOne({_id:userId, isDeleted:false})
    if (!user) {
     return res.status(400).json({ message: "User not found!" });
    }

    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return res.status(400).json({ message: "Branch Ids are required!" });
  }
    if(!name){
      return res.status(400).json({ message:'Name is required!'})
    }
      if(!departmentId) {
        return res.status(400).json({ message:'Department Id not found!'})
      }
      if(!positionId) {
        return res.status(400).json({ message:'Position Id not found!'})
      }
      if(!email) {
        return res.status(400).json({ message:'Email  not found!'})
      }
      if(!password) {
        return res.status(400).json({ message:'Password  not found!'})
      }


      const existingUser = await USER.findOne({ email, isDeleted: false });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists!" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);


      const employee = await EMPLOYEE.create({
        branchId: branchIds[0],
        name:name,
        email:email,
        department:departmentId,
        position:positionId,
      })

      const newUser = new USER({
        name,
        branchIds,
        departmentId,
        employeeId: employee._id,
        positionId,
        email,
        password : hashedPassword,
        role:'User',
        // permissions: permissionIds || [],
        createdById : user._id,
        createdBy : user.name,
      });

      await newUser.save();


    return  res.status(200).json({ message: "User created successfully", data: newUser });
    
  } catch (err) {
    next(err)
  }
}



export const getAllUser = async(req,res,next)=>{
  try {

      const { branchId } = req.params;

      const userId = req.user;

       const user = await USER.findOne({_id:userId, isDeleted:false})
       if (!user) {
       return res.status(400).json({ message: "User not found!" });
       }

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

      const users = await USER.find({
        branchIds: { $in: [new mongoose.Types.ObjectId(branchId)] },
        isDeleted: false
    })
    .populate({ path: "departmentId", select: "name" })
    .populate({ path: "positionId", select: "name" });

      return res.status(200).json({ data: users })
      
  } catch (err) {
      next(err)
  }
}


export const getOneUser = async(req,res,next)=>{
  try {

      const { userId } = req.params;

      const userid = req.user;

      const user = await USER.findOne({_id:userid, isDeleted:false})
      if (!user) {
      return res.status(400).json({ message: "User not found!" });
      }

      const userData = await USER.findById(userId).populate({ path: "departmentId", select: "name" })
      .populate({ path: "positionId", select: "name" });
      if(!userData){
        return res.status(400).json({ message:'Not found!'})
      }

      return res.status(200).json({ data: userData })
      
  } catch (err) {
      next(err)
  }
}


export const updateUser = async (req, res, next) => {
  try {
    const {
      userId,
      name,
      branchIds,
      departmentId,
      positionId,
      email,
      password,
      // permissionIds
    } = req.body;

    const userid = req.user;

    const user = await USER.findOne({ _id: userid, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const userData = await USER.findById(userId);
    if (!userData) return res.status(404).json({ message: "No User found!" });

    // if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
    //   return res.status(400).json({ message: "Branch Ids are required!" });
    // }

    // Check for email uniqueness (excluding current user)
    const emailTaken = await USER.findOne({ email, _id: { $ne: userId }, isDeleted: false });
    if (emailTaken) return res.status(400).json({ message: "Email already in use!" });

    const emp = await EMPLOYEE.findOne({ _id: userData.employeeId });
    if (!emp) return res.status(404).json({ message: "Employee not found!" });

    const updateData = {
      name,
      branchIds,
      employeeId: userData.employeeId,
      departmentId,
      positionId,
      email,
      role: userData.role,
      // permissions: permissionIds || [],
      createdById: user._id,
      createdBy: user.name,
    };

    // If password is provided, hash and update
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await USER.findByIdAndUpdate(userId, updateData, { new: true });

    // Now also update the employee record
    await EMPLOYEE.findByIdAndUpdate(userData.employeeId, {
      branchId: branchIds[0],
      name,
      email,
      departmentId,
      positionId,
    });

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });

  } catch (err) {
    next(err);
  }
};



export const deleteUser = async(req,res,next)=>{
  try {

    const { branchId ,userId } = req.body;

    const userid = req.user;

    const user = await USER.findOne({_id:userid, isDeleted:false})
    if (!user) {
    return res.status(400).json({ message: "User not found!" });
    }

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        if (!userId) {
            return res.status(400).json({ message: "userId not found!" });
        }

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

        const userData = await USER.findById(userId);
        if (!userData) {
            return res.status(400).json({ message: "User data not found!" });
        }


        await USER.findByIdAndUpdate(userId, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: user._id,
          deletedBy: user.name
        });

        return res.status(200).json({
          message: "User deleted successfully!",
      });

  } catch (err) {
    next(err)
  }
}