import USER from '../../model/UserModels/user.js';
import BRANCH from '../../model/UserModels/branch.js'
import UNIT from '../../model/UserModels/unit.js'
import { v2 as cloudinary } from 'cloudinary';
import SUPPLIER from '../../model/UserModels/supplier.js';
import PURCHASE from '../../model/UserModels/purhcase.js'







export const generatePurchaseId = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 characters
    const timestampPart = Date.now().toString().slice(-4); // last 4 digits of timestamp
    return `PR${randomPart}${timestampPart}`;
  };
  
  
  export const createPurchase = async(req,res,next)=>{
      try {
  
        //   let {
        //       restaurantId,
        //       purchaseDate,
        //       vendorId,
        //       paymentType,
        //       invoiceNo,
        //       items,
        //       subTotal,
        //       noOfItems,
        //       shippingCost,
        //       paidAmount,
        //       due,
        //       grandTotal
        //     } = req.body;
  
        //     // let isFree = req.body.isFree || false;
  
        //     const userId = req.user;
  
        //     if (typeof items === "string")  items = JSON.parse(items);
  
        //     // Validate user
        //     const user = await USER.findOne({ _id: userId, isDeleted: false });
        //     if (!user) {
        //       return res.status(400).json({ message: "User not found!" });
        //     }
  
        //     if (!restaurantId) return res.status(400).json({ message: "Restaurant Id is required!" });
        //     if (!purchaseDate) return res.status(400).json({ message: "Purchase Date is required!" });
        //     if (!vendorId) return res.status(400).json({ message: "Vendor is required!" });
        //     if (!paymentType) return res.status(400).json({ message: "Payment Type is required!" });
  
  
  
        //     if (!items || !Array.isArray(items) || items.length === 0) {
        //       return res.status(400).json({ message: "At least one item is required!" });
        //     }
  
        //     if (subTotal == null || noOfItems == null) {
        //       return res.status(400).json({ message: "subTotal and noOfItems are required!" });
        //     }
  
        //     let filter = {};
        //     if (user.role === "CompanyAdmin") {
        //       filter = { _id:  restaurantId, companyAdmin: user._id };
        //     } else if (user.role === "User") {
        //       filter = { _id:restaurantId };
        //     } else {
        //       return res.status(403).json({ message: "Unauthorized!" });
        //     }
  
        //     const vendor = await VENDOR.findById(vendorId);
        //     if(!vendor){
        //       return res.status(400).json({ message:'Vendor not found!'})
        //     }
        
        //     const restaurants = await RESTAURANT.findOne(filter);
        //     if (!restaurants || restaurants.length === 0) {
        //       return res.status(404).json({ message: "No matching restaurants found!" });
        //     }
             
        //     let paymentStatus;
        //    console.log(paidAmount,'paid amount')
        //     if (paidAmount == 0) {
        //       paymentStatus = "Pending";
        //     } else if (paidAmount > 0 && paidAmount < grandTotal) {
        //       paymentStatus = "Partially Paid";
        //     } else if (paidAmount >= grandTotal) {
        //       paymentStatus = "Paid";
        //     }
            
  
        //     let documentURL = null;
        //     if (req.file) {
        //       const uploadResult = await new Promise((resolve, reject) => {
        //         const uploadStream = cloudinary.uploader.upload_stream(
        //           {
        //             resource_type: "image",
        //             folder: "purchase",
        //           },
        //           (error, result) => {
        //             if (error) {
        //               console.error("Cloudinary upload error:", error);
        //               reject(error);
        //             } else {
        //               resolve(result);
        //             }
        //           }
        //         );
        
        //         uploadStream.end(req.file.buffer);
        //       });
        
        //       documentURL = uploadResult.secure_url;
        //     }    
            
        //     let purchaseId ;
        //     let isUnique  = false;
  
        //     while (!isUnique) {
        //       purchaseId = generatePurchaseId();
        //       const existing = await PURCHASE.findOne({ purchaseId });
        //       if (!existing) isUnique = true;
        //     }
  
  
        //     const purchase = await PURCHASE.create({
        //       purchaseId,
        //       restaurantId,
        //       purchaseDate,
        //       vendorId,
        //       paymentType,
        //       paymentStatus,
        //       purchaseStatus: "Pending",
        //       invoiceNo: invoiceNo || null,
        //       items,
        //       attachFile:documentURL ||null,
        //       subTotal,
        //       shippingCost: shippingCost != null ? shippingCost : 0,
        //       noOfItems,
        //       paidAmount,
        //       due: due != null ? due : 0,
        //       createdById:user._id,
        //       createdBy:user.name,
        //       grandTotal,
           
        //     })
  
  
        //     return res.status(201).json({
        //       message: "Purchase created successfully!",
        //       data: purchase,
        //     });
          
      } catch (err) {
          next(err)
      }
  }