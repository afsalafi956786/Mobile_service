import USER from '../../model/UserModels/user.js'
import EMPLOYEEE from '../../model/UserModels/employee.js'
import validatePhoneNumbers from '../../middleware/phoneValidator.js'
import { v2 as cloudinary } from 'cloudinary'
import BRANCH from '../../model/UserModels/branch.js'


export const  createBranch = async (req,res,next)=>{
    try{

        const {
            companyName, address,country, state, city, email,phone,phone2,
            logo,currency, currencySymbol,
        } = req.body;

  
        // Validate required fields
        if (!companyName) return res.status(400).json({ message: 'Company name is required!' });
        if (!address) return res.status(400).json({ message: 'Company address is required!' });
        if (!country) return res.status(400).json({ message: 'Country is required!' });
        if (!state) return res.status(400).json({ message: 'State is required!' });
        if (!city) return res.status(400).json({ message: 'City is required!' });
        if (!phone) return res.status(400).json({ message: 'Phone is required!' });

       

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format!" });
        }

        const existEmailEmp = await EMPLOYEEE.findOne({ email,  isDeleted: false, });
        if( existEmailEmp){
            return res.status(400).json({ message:'Email already exists!'})
        }
        
        const phoneNumbers = [phone, phone2].filter(Boolean); // Remove null/undefined values

        const isPhoneNumberExists = await validatePhoneNumbers(phoneNumbers,null,false);

        if (isPhoneNumberExists) {
            return res.status(400).json({ message: 'Phone number already exists!' });
        }
 


        const userId = req.user;
        const user = await USER.findOne({_id:userId, isDeleted:false})
     
        if (!user) return res.status(400).json({ message: "User not found!" });
        if (user.role !== "BranchAdmin") {
            return res.status(403).json({ message: "Only Branch Admin can create branch!" });
        }

           let branchAdminid = user._id;
              let logoPath = null;


            if (req.file) {
                //  Use upload_stream to handle memory storage
                try {
                    const logoUpload = await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                resource_type: "image",
                                folder: "Logos",
                              },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        uploadStream.end(req.file.buffer); // Send the file buffer
                    });
                    logoPath = logoUpload.secure_url;
                } catch (error) {
                    return res.status(500).json({ message: "Cloudinary upload failed!", error });
                }
            }

        const branch = await BRANCH.create({
            companyName,
            address,
            country,
            state,
            city,
            phone,
            phone2,
            email,
            logo :logoPath || null,
            currency,
            currencySymbol,
            branchAdminId: branchAdminid
        });
    

        return res.status(201).json({ message: "Branch created successfully",data: branch });


    }catch(err){
        next(err)
    }
}



export const getAllBranch = async(req,res,next)=>{
    try{

        const userId = req.user;

        // Check if user exists
        const user = await USER.findOne({_id:userId, isDeleted:false})
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }

 

        let branches = [];

        if (user.role === "BranchAdmin") {
          // Use isDeleted in query — uses compound index { companyAdmin: 1, isDeleted: 1 }
          branches = await BRANCH.find({
            branchAdminId: user._id,
            isDeleted: false,
          });
        } else if (user.role === "User") {
            // User: Fetch all branches from branchIds array
            if (user.branchIds.length === 0) {
              return res.status(200).json({ branches: [] }); // No branches assigned
            }
      
            branches = await BRANCH.find({
              _id: { $in: user.branchIds },
              isDeleted: false,
            });
          }

        return res.status(200).json({ data:  branches });

    }catch(err){
        next(err) 
    }
}



export const updateBranch = async (req, res, next) => {
    try {
       
        const {
            branchId, companyName, address, country, state, city,
            email, phone, phone2,
            currency, currencySymbol,
        } = req.body;
       

        const userId = req.user;
        const user = await USER.findOne({_id:userId, isDeleted:false})
     
        if (!user) return res.status(400).json({ message: "User not found!" });

        if (!branchId) {
            return res.status(400).json({ message: "Branch Id is required!" });
        }

        if (user.role !== "BranchAdmin") {
            return res.status(403).json({ message: "Only Branch Admin can Update branch!" });
        }

        // Validate required fields
        if (!companyName) return res.status(400).json({ message: 'Company name is required!' });
        if (!address) return res.status(400).json({ message: 'Company address is required!' });
        if (!country) return res.status(400).json({ message: 'Country is required!' });
        if (!state) return res.status(400).json({ message: 'State is required!' });
        if (!city) return res.status(400).json({ message: 'City is required!' });
        if (!phone) return res.status(400).json({ message: 'Phone is required!' });

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format!" });
        }

        const branch = await BRANCH.findOne({ _id: branchId, isDeleted: false });
        if (!branch) return res.status(404).json({ message: "Branch not found!" });

        // Check if email changed and is unique
        if (email !== branch.email) {
            const existingEmail = await EMPLOYEEE.findOne({ email, isDeleted: false });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already exists!' });
            }
        }

        // Check if phone numbers are changed and unique
        const phoneNumbers = [phone, phone2].filter(Boolean);
        const isPhoneNumberExists = await validatePhoneNumbers(phoneNumbers, branchId, false); // true for update
        if (isPhoneNumberExists) {
            return res.status(400).json({ message: 'Phone number already exists!' });
        }

        let logoPath = branch.logo;

        // Upload new logo if provided
        if (req.file) {
            try {
                const logoUpload = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            resource_type: "image",
                            folder: "Logos",
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(req.file.buffer);
                });
                logoPath = logoUpload.secure_url;
            } catch (error) {
                return res.status(500).json({ message: "Cloudinary upload failed!", error });
            }
        }

        // Update the branch
        branch.companyName = companyName;
        branch.address = address;
        branch.country = country;
        branch.state = state;
        branch.city = city;
        branch.phone = phone;
        branch.phone2 = phone2;
        branch.email = email;
        branch.logo = logoPath;
        branch.currency = currency;
        branch.currencySymbol = currencySymbol;

        await branch.save();

        return res.status(200).json({ message: "Branch updated successfully",data: branch });

    } catch (err) {
        next(err);
    }
};


export const deleteBranch = async (req,res,next)=>{
    try{

        const { branchId } = req.params;

        const userId = req.user;
        const user = await USER.findOne({_id:userId, isDeleted:false})
     
        if (!user) return res.status(400).json({ message: "User not found!" });

        if (user.role !== "BranchAdmin") {
            return res.status(403).json({ message: "Only Branch Admin can delete a branch!" });
        }

        const branch = await BRANCH.findById(branchId);

        if (!branch) {
            return res.status(404).json({ message: "Brnach not found!" });
        }

        branch.isDeleted = true;
        branch.deletedAt = new Date();
        branch.deletedById= user._id;
        branch.deletedBy = user.name;
        await branch.save();
        
        return res.status(200).json({ message: "Branch deleted successfully!" });
        
    
    }catch(err){
        next(err)
    }

}