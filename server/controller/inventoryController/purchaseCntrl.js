import USER from '../../model/UserModels/user.js';
import BRANCH from '../../model/UserModels/branch.js'
import UNIT from '../../model/UserModels/unit.js'
import { v2 as cloudinary } from 'cloudinary';
import SUPPLIER from '../../model/UserModels/supplier.js';
import PURCHASE from '../../model/UserModels/purhcase.js'
import SUPPLIERWALLET from '../../model/UserModels/supplierWallet.js';
import PRODUCT from '../../model/UserModels/product.js';
import CATEGORY from '../../model/UserModels/category.js'







export const generatePurchaseId = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 characters
    const timestampPart = Date.now().toString().slice(-4); // last 4 digits of timestamp
    return `PR${randomPart}${timestampPart}`;
  };
  
  
  export const createPurchase = async(req,res,next)=>{
      try {

        
    let { branchId,purchaseDate,invoiceNo,supplierId,paymentType, items,paidAmount, subTotal, shippingCost, noOfItems, due, grandTotal } = req.body;
    // let isFree = req.body.isFree || false;
    const userId = req.user;

  if (typeof items === "string") items = JSON.parse(items);
    paidAmount = parseFloat(paidAmount);
    grandTotal = parseFloat(grandTotal);
    due = parseFloat(due);

    console.log(items,'items')

    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // Check restaurant access
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "At least one item is required!" });
    }

    const supplier = await SUPPLIER.findById(supplierId);
    if (!supplier) {
      return res.status(400).json({ message: "Supplier not found!" });
    }

    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({ message: "Ingredient ID is required for each item!" });
      }
      if (item.price == null) {
        return res.status(400).json({ message: "Price is required for each item!" });
      }
      if (!item.purchaseUnit) {
        return res.status(400).json({ message: "Purchase unit is required for each item!" });
      }
      if (!item.baseUnit) {
          return res.status(400).json({ message: "Base unit is required for each item!" });
        }
      if (!item.conversionRate) {
          return res.status(400).json({ message: "Conversion rate is required for each item!" });
        }
      if (item.quantity == null) {
        return res.status(400).json({ message: "Quantity is required for each item!" });
      }
      if (item.total == null) {
        return res.status(400).json({ message: "Total is required for each item!" });
      }
    }

    let paymentStatus;
    if (paidAmount == 0) {
      paymentStatus = "Pending";
    } else if (paidAmount > 0 && paidAmount < grandTotal) {
      paymentStatus = "Partially Paid";
    } else if (paidAmount >= grandTotal) {
      paymentStatus = "Paid";
    }



    let documentURL = null;  // Default to current image

        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "image",
                        folder: "purchase",
                    },
                    (error, result) => {
                        if (error) {
                            console.error("Cloudinary upload error:", error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                uploadStream.end(req.file.buffer);
            });

            documentURL = uploadResult.secure_url;
        }

        let purchaseId ;
        let isUnique  = false;

        while (!isUnique) {
          purchaseId = generatePurchaseId();
          const existing = await PURCHASE.findOne({ purchaseId });
          if (!existing) isUnique = true;
        }


        
        const purchase = await PURCHASE.create({
          purchaseId,
          branchId,
          purchaseDate,
          supplierId,
          paymentType,
          paymentStatus,
          purchaseStatus: "Recieved",
          invoiceNo: invoiceNo || null,
          items,
          attachFile:documentURL ||null,
          subTotal,
          shippingCost: shippingCost != null ? shippingCost : 0,
          noOfItems,
          paidAmount,
          due: due != null ? due : 0,
          createdById:user._id,
          createdBy:user.name,
          grandTotal,
       
        })

    
    const existingCredit = suplier.wallet?.credit || 0;
    const existingDebit  = suplier.wallet?.debit  || 0;
    
    if (grandTotal > paidAmount) {
      // Vendor gave goods on credit
      const creditIncrease = grandTotal - paidAmount;
      suplier.wallet.credit = existingCredit + creditIncrease;

      await SUPPLIERWALLET.create({
        supplierId,
        branchId,
        purchaseId,
        purchaseRef:purchase.purchaseId,
        type: "credit",
        amount: creditIncrease,
        description: "Purchase received with credit balance",
        createdById: userId,
        createdBy:user.name
      });

    } else if (paidAmount > grandTotal) {
      console.log('debit pad andi')
      // Restaurant overpaid
      const debitIncrease = paidAmount - grandTotal;
      supplier.wallet.debit  = existingDebit  + debitIncrease;

      await SUPPLIERWALLET.create({
        supplierId,
        branchId,
        purchaseId,
        purchaseRef:purchase.purchaseId,
        type: "debit",
        amount: debitIncrease,
        description: "Overpayment received; refund added",
        createdById: userId,
        createdBy:user.name
      });
    }
    
    await supplier.save();


    // Update stock
    for (const item of items) {

      item.quantity = Number(item.quantity);       // Better for APIs
      item.conversionRate = Number(item.conversionRate)

      const product = await PRODUCT.findOne({
        _id: item.productId,
        branchId: branchId,
        isDeleted: false,
      });

      if (product) {
        const quantityInBaseUnit = item.quantity * item.conversionRate;
        ingredient.stockCount += quantityInBaseUnit;
        await product.save();
      }else{                                                    
        return res.status(400).json({ message:'Somthing went wrong!'})
      }
    }

    return res.status(200).json({
      message: "Purchase Added successfully!",
      data: purchase,
    });

  } catch (err) {
    next(err);
  }
};



export const getPendingPurchase = async (req, res, next) => {
  try {
   
    const { restaurantId } = req.params;

    
     const userId = req.user;
    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant Id is required!" });
    }

    let dataFilter = { restaurantId, purchaseStatus: "Pending", isDeleted: false };

    let filter = {};
    if (user.role === "CompanyAdmin") {
      filter = { _id: restaurantId, companyAdmin: user._id };
    } else if (user.role === "User") {
      filter = { _id: restaurantId };
    } else {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    const restaurant = await RESTAURANT.findOne(filter);
    if (!restaurant)   return res.status(404).json({ message: "No matching restaurants found!" });

    const purchases = await PURCHASE.find(dataFilter)
      .sort({ createdAt: -1 })
      .populate("vendorId", "vendorName")


    return res.status(200).json({
      data: purchases,
    });
  
      
          
      } catch (err) {
          next(err)
      }
  }