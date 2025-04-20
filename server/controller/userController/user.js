import USER from '../../model/UserModels/user.js';
import BRANCH from '../../model/UserModels/branch.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'



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
