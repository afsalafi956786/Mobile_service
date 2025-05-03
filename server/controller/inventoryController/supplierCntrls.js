import USER from '../../model/UserModels/user.js';
import BRANCH from '../../model/UserModels/branch.js'
import SUPPLIER from '../../model/UserModels/supplier.js'



export const createSupplier = async (req, res, next) => {
    try {
      const { branchIds, name, mobileNo, address } = req.body;
      const userId = req.user;
  
      if (!Array.isArray(branchIds) || branchIds.length === 0) {
        return res
          .status(400)
          .json({ message: "BranchIds array is required!" });
      }
  
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Supplier name is required!" });
      }
  
      if (!mobileNo || typeof mobileNo !== "string" || !mobileNo.trim()) {
        return res.status(400).json({ message: "Mobile number is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      const createdVendors = [];
  
      for (const branchId of branchIds) {
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
  
        const existSupplier = await SUPPLIER.findOne({
          branchId,
          name: { $regex: `^${name}$`, $options: "i" },
          isDeleted: false,
        }).collation({ locale: "en", strength: 2 });
  
        if (existSupplier) {
          return res.status(400).json({
            message: `Supplier '${name}' already exists in one of the selected branch.`,
          });
        }
  
        const supplier = await SUPPLIER.create({
          branchId,
          name: name.trim(),
          mobileNo: mobileNo.trim(),
          address: address?.trim() || "",
          createdById: user._id,
          createdBy: user.name,
        });
  
        createdVendors.push(supplier);
      }
  
      return res.status(201).json({
        message: "Supplier created successfully!",
        data: createdVendors,
      });
    } catch (err) {
      next(err);
    }
  };


  

  export const updateSupplier = async (req, res, next) => {
    try {
      // vendorId will come from URL params
      const { supplierId, branchId, name, mobileNo, address } = req.body;
      const userId = req.user;
  
      if (!supplierId) {
        return res.status(400).json({ message: "Supplier Id is required!" });
      }
  
      if (!branchId) {
        return res.status(400).json({ message: "Branch Id is required!" });
      }
  
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Vendor name is required!" });
      }
  
      if (!mobileNo || typeof mobileNo !== "string" || !mobileNo.trim()) {
        return res.status(400).json({ message: "Mobile number is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
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
  
      const supplier = await SUPPLIER.findOne({
        _id: supplierId,
        branchId,
        isDeleted: false,
      });
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found!" });
      }
  
      const duplicateVendor = await SUPPLIER.findOne({
        _id: { $ne: supplierId }, // _id not equal to current vendorId
        branchId,
        name: { $regex: `^${name}$`, $options: "i" },
        isDeleted: false,
      }).collation({ locale: "en", strength: 2 });
  
      if (duplicateVendor) {
        return res
          .status(400)
          .json({ message: "Another Supplier with this name already exists!" });
      }
  
      // Update vendor
      supplier.name = name.trim();
      supplier.mobileNo = mobileNo.trim();
      supplier.address = address?.trim() || "";
  
      await supplier.save();
  
      return res.status(200).json({
        message: "Supplier updated successfully!",
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  };


  

  export const getAllSuppliers = async (req, res, next) => {
    try {
      const { branchId } = req.params; // getting from query params
  
      if (!branchId) {
        return res.status(400).json({ message: "BranchId is required!" });
      }
  
      const userId = req.user;
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
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
  
      const suppliers = await SUPPLIER.find({ branchId, isDeleted: false }).sort({
        createdAt: -1,
      });
  
      return res.status(200).json({
        data: suppliers,
      });
    } catch (err) {
      next(err);
    }
  };



  

  export const deleteSupplier = async (req, res, next) => {
    try {
      const { supplierId } = req.params;
      const userId = req.user;
  
      if (!supplierId) {
        return res.status(400).json({ message: "Supplier Id is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      const supplier = await SUPPLIER.findById(supplierId);
      if (!supplier || supplier.isDeleted) {
        return res.status(404).json({ message: "Supplier not found!" });
      }
  
      await SUPPLIER.findByIdAndUpdate(supplierId, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: user._id,
        deletedBy: user.name,
      });
  
      return res
        .status(200)
        .json({ message: "Supplier deleted successfully!" });
    } catch (err) {
      next(err);
    }
  };