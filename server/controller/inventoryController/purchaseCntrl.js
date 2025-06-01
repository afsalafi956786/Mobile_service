import USER from '../../model/UserModels/user.js';
import BRANCH from '../../model/UserModels/branch.js'
import UNIT from '../../model/UserModels/unit.js'
import { v2 as cloudinary } from 'cloudinary';
import SUPPLIER from '../../model/UserModels/supplier.js';
import PURCHASE from '../../model/UserModels/purhcase.js'
import SUPPLIERWALLET from '../../model/UserModels/supplierWallet.js';
import PRODUCT from '../../model/UserModels/product.js';
import CATEGORY from '../../model/UserModels/category.js';
import STOCK_LEDGER from '../../model/UserModels/stockLedger.js';
import PURCHASERETURN from '../../model/UserModels/purchaseReturn.js'







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
        return res.status(400).json({ message: "Product ID is required for each item!" });
      }
      if (item.price == null) {
        return res.status(400).json({ message: "Price is required for each item!" });
      }
      if (!item.purchaseUnit) {
        return res.status(400).json({ message: "Purchase unit is required for each item!" });
      }
      // if (!item.baseUnit) {
      //     return res.status(400).json({ message: "Base unit is required for each item!" });
      //   }
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
          purchaseStatus:"Recieved",
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

        let supplierCredit = supplier.wallet?.credit || 0;
        let supplierDebit = supplier.wallet?.debit || 0;
        const balanceDue = grandTotal - paidAmount;
    
        if (balanceDue > 0) {
          if (supplierDebit >= balanceDue) {
            // Entire balance covered by debit
            supplier.wallet.debit = supplierDebit - balanceDue;
    
            await SUPPLIERWALLET.create({
              supplierId,
              branchId,
              purchaseId,
              purchaseRef: purchase.purchaseId,
              type: "debit_adjusted",
              amount: balanceDue,
              description: "Purchase adjusted using supplier debit (supplier owed branch)",
              createdById: userId,
              createdBy: user.name
            });
          } else {
            // Partially covered, rest goes to credit
            if (supplierDebit > 0) {
              await SUPPLIERWALLET.create({
                supplierId,
                branchId,
                purchaseId,
                purchaseRef: purchase.purchaseId,
                type: "debit_adjusted",
                amount: supplierDebit,
                description: "Partial purchase adjusted using supplier debit",
                createdById: userId,
                createdBy: user.name
              });
            }
            const creditToAdd = balanceDue - supplierDebit;
            supplier.wallet.debit = 0;
            supplier.wallet.credit = supplierCredit + creditToAdd;
    
            await SUPPLIERWALLET.create({
              supplierId,
              branchId,
              purchaseId,
              purchaseRef: purchase.purchaseId,
              type: "credit",
              amount: creditToAdd,
              description: "Remaining purchase added to supplier credit",
              createdById: userId,
              createdBy: user.name
            });
          }
    
        } else if (paidAmount > grandTotal) {
          const overPaid = paidAmount - grandTotal;
          if (supplierCredit >= overPaid) {
            supplier.wallet.credit = supplierCredit - overPaid;
            await SUPPLIERWALLET.create({
              supplierId,
               branchId, 
               purchaseId, 
               purchaseRef: purchase.purchaseId,
              type: "credit_adjusted",
               amount: overPaid,
              description: "Overpayment adjusted from supplier credit (branch owed supplier)",
              createdById: userId,
               createdBy: user.name
            });
          } else {
            if (supplierCredit > 0) {
              await SUPPLIERWALLET.create({
                supplierId,
                branchId,
                purchaseId,
                purchaseRef: purchase.purchaseId,
                type: "credit_adjusted",
                amount: supplierCredit,
                description: "Partial overpayment adjusted from supplier credit",
                createdById: userId,
                createdBy: user.name
              });
            }
            const remainingOverPaid = overPaid - supplierCredit;
            supplier.wallet.credit = 0;
            supplier.wallet.debit = supplierDebit + remainingOverPaid;
            await SUPPLIERWALLET.create({
              supplierId, branchId,
              purchaseId,
               purchaseRef: purchase.purchaseId,
              type: "debit",
               amount: remainingOverPaid,
              description: "Overpayment received; added to supplier debit",
              createdById: userId,
               createdBy: user.name
            });
          }
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

      if (!product) {
        return res.status(400).json({ message: "Product not found!" });
      }

      const quantityInBaseUnit = item.quantity * item.conversionRate;

      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
          return res.status(400).json({ message: "Variant not found for this product!" });
        }
        variant.stockCount = (variant.stockCount || 0) + quantityInBaseUnit;
      } else {
        product.stockCount = (product.stockCount || 0) + quantityInBaseUnit;
      }

      await product.save();


      await STOCK_LEDGER.create({
        productId: item.productId,
        variantName: item.variantName || null,
        branchId: branchId,
        type: "purchase",
        quantity: quantityInBaseUnit,
        remainingQty: quantityInBaseUnit,
        costPrice: item.price,
        purchaseUnit: item.purchaseUnit,
        purchaseDate: purchaseDate || new Date(),
        createdById: userId,
        createdBy: user.name,
      })


    }

    return res.status(200).json({
      message: "Purchase Added successfully!",
      data: purchase,
    });

  } catch (err) {
    next(err);
  }
};


export const getAllPurchases = async (req, res, next) => {
  try {
   
    const { branchId } = req.params;

    
     const userId = req.user;
    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
    }

    let dataFilter = { branchId, purchaseStatus: "Received", isDeleted: false };

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

    const purchases = await PURCHASE.find(dataFilter)
      .sort({ createdAt: -1 })
      .populate("supplierId", "name")
      .populate('brandId',"name")
      .populate('modelId',"name")

  
    return res.status(200).json({
      data: purchases,
    });

  } catch (err) {
    next(err);
  }
};


export const getOnePurchase = async (req, res, next) => {
  try {
   
    const { purchaseId } = req.params;

    
     const userId = req.user;
    // Validate user
    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!purchaseId) {
      return res.status(400).json({ message: "Purchase Id is required!" });
    }


    const purchases = await PURCHASE.findById(purchaseId)
      .sort({ createdAt: -1 })
      .populate("supplierId", "name")
      .populate("branchId","companyName")
      .populate('brandId',"name")
      .populate('modelId',"name")

  
    return res.status(200).json({
      data: purchases,
    });

  } catch (err) {
    next(err);
  }
};






export const getAllStocks = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const userId = req.user;

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
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

    const allProducts = await PRODUCT.find({
      branchId,
      isDeleted: false
    }).sort({ createdAt: -1 });

    // Filter products that either have stockCount > 0 or any variant with stockCount > 0
    const filteredProducts = allProducts.filter(product => {
      if (product.stockCount > 0) return true;

      if (product.variants && product.variants.length > 0) {
        return product.variants.some(variant => variant.stockCount > 0);
      }

      return false;
    });

    return res.status(200).json({
      data: filteredProducts,
    });
  } catch (err) {
    next(err);
  }
};



export const getAllOutofStock = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const userId = req.user;

    if (!branchId) {
      return res.status(400).json({ message: "Branch Id is required!" });
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
    // Fetch out-of-stock items (stockCount ≤ 0) with only required fields
    const allProducts = await PRODUCT.find({
      branchId,
      isDeleted: false
    })
      .select('_id name stockCount variants modelId brandId categoryId')
      .sort({ createdAt: -1 })
      .populate([
        { path: 'modelId', select: 'name' },
        { path: 'brandId', select: 'name' },
        { path: 'categoryId', select: 'name' }
      ]);

    // Step 2: Filter products where:
    // - product.stockCount <= 0
    // - and all variants (if exist) have stockCount <= 0
    const outOfStockItems = allProducts.filter(product => {
      const productLevelOutOfStock = product.stockCount <= 0;

      const allVariantsOutOfStock = product.variants?.length
        ? product.variants.every(variant => variant.stockCount <= 0)
        : true;

      return productLevelOutOfStock && allVariantsOutOfStock;
    });
``
    return res.status(200).json({
      data: outOfStockItems
    });
  } catch (err) {
    next(err);
  }
};


export const purchaseReturn = async (req, res, next) => {
  try {
    let {
      branchId,
      supplierId,
      returnDate,
      reason,
      items,
      returnAmount,
      noOfItems,
      purchaseId,
    } = req.body;

    const userId = req.user;
    if (typeof items === "string") items = JSON.parse(items);
 

    const user = await USER.findOne({ _id: userId, isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found!" });

    if (!branchId) return res.status(400).json({ message: "Branch Id is required!" });
    if (!purchaseId) return res.status(400).json({ message: "Purchase Id is required!" });
    if (!supplierId) return res.status(400).json({ message: "Supplier Id is required!" });
    if (!returnDate) return res.status(400).json({ message: "Return Date is required!" });
    if (!reason) return res.status(400).json({ message: "Reason for return is required!" });
    if (!noOfItems && noOfItems !== 0) return res.status(400).json({ message: "Total returned items count is required!" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "At least one returned item is required!" });

    const supplier = await SUPPLIER.findById(supplierId);
    if (!vendor) return res.status(400).json({ message: "Vendor not found!" });

    const purchase = await PURCHASE.findOne({ _id: purchaseId });
    if (!purchase) return res.status(404).json({ message: "Purchase not found!" });

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
    for (const item of items) {
      if (!item.productId) return res.status(400).json({ message: "Product ID is required for each item!" });
      if (item.quantity == null) return res.status(400).json({ message: "Return quantity is required for each returned item!" });
      if (item.price == null) return res.status(400).json({ message: "Return price is required for each returned item!" });
      if (item.total == null) return res.status(400).json({ message: "Return total is required for each returned item!" });
      if (item.conversionRate == null) return res.status(400).json({ message: "Conversion rate required for each returned item!" });

      const purchasedItem = purchase.items.find(p => String(p.prodcutId) === String(item.prodcutId));
      if (!purchasedItem) return res.status(400).json({ message: "Product not found in original purchase!" });

      const originalQty = purchasedItem.quantity;

      const totalReturned = await PURCHASERETURN.aggregate([
        { $match: { purchaseId: purchaseId } },
        { $unwind: "$items" },
        { $match: { "items.purchaseId": item.ingredientId } },
        {
          $group: {
            _id: "$items.productId",
            totalQty: { $sum: "$items.quantity" },
          },
        },
      ]);

      const alreadyReturned = totalReturned.length > 0 ? totalReturned[0].totalQty : 0;

      if (item.quantity + alreadyReturned > originalQty) {
        const productData = await PRODUCT.findById(item.productId).select("name");
        return res.status(400).json({
          message: `Return quantity for product (${productData.name}) exceeds original purchased quantity!`,
        });
      }
    }

    const purchaseReturn = await PURCHASERETURN.create({
      purchaseId,
      purchase_ref: purchase.purchaseId,
      branchId,
      supplierId,
      returnDate,
      reason,
      items,
      returnAmount,
      noOfItems,
      createdById: user._id,
      createdBy: user.name,
    });

    for (const returnedItem of items) {
      // Find the corresponding item in the purchase document
      const purchaseItemIndex = purchase.items.findIndex(
        p => String(p.productId) === String(returnedItem.productId)
      );
      
      if (purchaseItemIndex >= 0) {
        // Reduce the quantity in the original purchase
        purchase.items[purchaseItemIndex].quantity -= returnedItem.quantity;
        
        // If quantity is zero or negative, remove the item from the array
        if (purchase.items[purchaseItemIndex].quantity <= 0) {
          purchase.items.splice(purchaseItemIndex, 1);
        }
      }
    }

    if (purchase.items.length === 0) {
      purchase.returned = true;
    }  

    console.log(purchase.grandTotal,'grand before')
    purchase.grandTotal -= returnAmount;
    console.log(purchase.grandTotal,'grand after');
    console.log(purchase.due,'due')
    purchase.due = Math.max(0, purchase.due - returnAmount);
     console.log(purchase.due , returnAmount,' bothy are')
    console.log(purchase.due,'after')

    const overPaid = purchase.paidAmount - purchase.grandTotal;
    purchase.refundDue = overPaid > 0 ? overPaid : 0;

    if (purchase.paidAmount >= purchase.grandTotal) {
      purchase.paymentStatus = 'Paid';
      purchase.due = 0;
    } else if (purchase.paidAmount == 0) {
      purchase.paymentStatus = 'Pending';
    } else {
      purchase.paymentStatus = 'Partially Paid';
    }

    await purchase.save();

    for (const item of items) {

      item.quantity = Number(item.quantity);     
      item.conversionRate = Number(item.conversionRate)

      const product = await PRODUCT.findOne({
        _id: item.productId,
        branchId,
        isDeleted: false,
      });

      if (!product) return res.status(400).json({ message: 'Product not found!' });

      const returnedQtyInBase = item.quantity * item.conversionRate;

        // Handle variant stock if variantId exists
  if (item.variantId) {
    const variant = product.variants.id(item.variantId);
    if (!variant) {
      return res.status(400).json({ message: "Variant not found for this product!" });
    }
    variant.stockCount = Math.max(0, (variant.stockCount || 0) - returnedQtyInBase);
  } else {
    product.stockCount = Math.max(0, (product.stockCount || 0) - returnedQtyInBase);
  }

  await product.save();

  //  // Add to stock ledger for return
  //  await STOCK_LEDGER.create({
  //   productId: item.productId,
  //   variantName: item.variantName || null,
  //   branchId: branchId,
  //   type: "purchase_return",  // Changed from "purchase" to "purchase_return"
  //   quantity: -returnedQtyInBase,  // Negative quantity for return
  //   remainingQty: -returnedQtyInBase,  // Negative remaining quantity
  //   costPrice: item.price,
  //   purchaseUnit: item.purchaseUnit,
  //   purchaseDate: returnDate || new Date(),  // Use returnDate instead of purchaseDate
  //   createdById: userId,
  //   createdBy: user.name,
  //   referenceId: purchaseReturn._id,  // Reference to the return document
  //   referenceType: "PurchaseReturn"
  // });


    }

        //  Wallet Logic
             // Calculate returnAmount at the beginning
    returnAmount = parseFloat(
    items.reduce((sum, item) => sum + (Number(item.total) || 0), 0).toFixed(2)
    );

// Later in the wallet logic (avoid redundant returnAmount calculation)
   const existingCredit = supplier.wallet?.credit || 0;
  const existingDebit = supplier.wallet?.debit || 0;



      if (existingCredit >= returnAmount) {
  // Reduce credit
  supplier.wallet.credit = existingCredit - returnAmount;

  // Create credit adjustment log
  await SUPPLIERWALLET.create({
    supplierId,
    branchId,
    purchaseId,
    purchaseRef: purchase.purchaseId,
    type: "credit_adjusted",
    amount: returnAmount,
    description: "Purchase return adjusted from supplier credit",
    createdById: user._id,
    createdBy: user.name,
  });

} else {
  // Use credit, then debit for remaining
  const creditUsed = existingCredit;
  const remaining = returnAmount - existingCredit;

  supplier.wallet.credit = 0;
  supplier.wallet.debit = existingDebit + remaining;

  // Credit Adjustment log if any credit is used
  if (creditUsed > 0) {
    await SUPPLIERWALLET.create({
      supplierId,
      branchId,
      purchaseId,
      purchaseRef: purchase.purchaseId,
      type: "credit_adjusted",
      amount: creditUsed,
      description: "Partial return adjusted from supplier credit",
      createdById: user._id,
      createdBy: user.name,
    });
  }

  // Debit Adjustment log
  await SUPPLIERWALLET.create({
    supplierId,
    branchId,
    purchaseId,
    purchaseRef: purchase.purchaseId,
    type: "debit",
    amount: remaining,
    description: "Remaining return amount added to supplier debit",
    createdById: user._id,
    createdBy: user.name,
  });
}

await supplier.save();

    return res.status(201).json({
      message: "Purchase return recorded successfully!",
      data: purchaseReturn,
    });
  } catch (err) {
    next(err);
  }
};