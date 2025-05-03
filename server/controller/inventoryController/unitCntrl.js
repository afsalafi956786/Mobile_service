import USER from '../../model/UserModels/user.js';
import BRANCH from '../../model/UserModels/branch.js'
import UNIT from '../../model/UserModels/unit.js'





export const createUnitMeasurement = async (req, res, next) => {
    try {
      let { unitName, shortTag } = req.body;
      
      unitName = unitName?.trim();
      shortTag = shortTag?.trim();
  
      const userId = req.user;
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      if (!unitName || !shortTag) {
        return res.status(400).json({ message: "Unit name and short tag are required!" });
      }
  
      if (user.role !== "BranchAdmin") {
        return res.status(403).json({ message: "Only BranchAdmin can create units" });
      }
  
      const existingUnit = await UNIT.find({
        userId: user._id,
        unitName: { $regex: `^${unitName}$`, $options: "i" },
      }).collation({ locale: "en", strength: 2 });
  
      if (existingUnit.length > 0) {
        return res.status(400).json({
          message: `The Unit name '${unitName}' already exists!`,
        });
      }
  
      const existingShortTags = await UNIT.find({
        userId: user._id,
        shortTag: { $regex: `^${shortTag}$`, $options: "i" },
      }).collation({ locale: "en", strength: 2 });
  
      if (existingShortTags.length > 0) {
        return res.status(400).json({
          message: `The Short tag '${shortTag}' already exists!`,
        });
      }
  
      const unit = await UNIT.create({
        unitName,
        shortTag,
        userId: user._id,
        createdById: user._id,
        createdBy: user.name,
      });
  
      return res.status(201).json({
        message: "Unit added successfully!",
        data: unit,
      });
    } catch (err) {
      next(err);
    }
  };


  

  export const updateUnitMeasurement = async (req, res, next) => {
    try {
      const { unitId, unitName, shortTag } = req.body;
      const userId = req.user;
  
      if (!unitId) {
        return res.status(400).json({ message: "Unit ID is required!" });
      }
  
      if (!unitName && !shortTag) {
        return res.status(400).json({ message: "At least one of unitName or shortTag is required!" });
      }
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      if (user.role !== "BranchAdmin") {
        return res.status(403).json({ message: "Only BranchAdmin can update units" });
      }
  
      const unit = await UNIT.findOne({
        _id: unitId,
        userId: user._id,
      });
  
      if (!unit) {
        return res.status(404).json({ message: "Unit not found or access denied!" });
      }
  
      // Check for duplicate unitName
      if (unitName) {
        const duplicateName = await UNIT.findOne({
          _id: { $ne: unitId },
          userId: user._id,
          unitName: { $regex: `^${unitName}$`, $options: "i" },
        }).collation({ locale: "en", strength: 2 });
  
        if (duplicateName) {
          return res.status(400).json({
            message: `The unit name '${unitName}' already exists!`,
          });
        }
      }
  
      // Check for duplicate shortTag
      if (shortTag) {
        const duplicateTag = await UNIT.findOne({
          _id: { $ne: unitId },
          userId: user._id,
          shortTag: { $regex: `^${shortTag}$`, $options: "i" },
        }).collation({ locale: "en", strength: 2 });
  
        if (duplicateTag) {
          return res.status(400).json({
            message: `The short tag '${shortTag}' already exists!`,
          });
        }
      }
  
      if (unitName) unit.unitName = unitName.trim();
      if (shortTag) unit.shortTag = shortTag.trim();
  
      await unit.save();
  
      return res.status(200).json({
        message: "Unit updated successfully!",
        data: unit,
      });
    } catch (err) {
      next(err);
    }
  };


  export const getAllUnits = async (req, res, next) => {
    try {
  
      const { branchAdminId } = req.params
      const userId = req.user;
  
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      if(!branchAdminId){
        return res.status(400).json({message:'Branch admin not found!'})
      }
  
      const units = await UNIT.find({ userId: branchAdminId }).sort({ createdAt: -1 });
  
      return res.status(200).json({ data: units });
    } catch (err) {
      next(err);
    }
  };


  export const deleteUnits = async (req, res, next) => {
    try {
      const { unitId } = req.params;
      const userId = req.user;
  
      // Validate user
      const user = await USER.findOne({ _id: userId, isDeleted: false });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      if (user.role !== "BranchAdmin") {
        return res.status(403).json({ message: "Only BranchAdmin can delete units!" });
      }
  
      // Validate unitId
      if (!unitId) {
        return res.status(400).json({ message: "unitId is required!" });
      }
  
      // Check if unit exists and was created by this user
      const existingUnit = await UNIT.findOne({ _id: unitId, userId: user._id });
      if (!existingUnit) {
        return res.status(404).json({ message: "Unit not found or access denied!" });
      }
  
      // Hard delete
      await UNIT.deleteOne({ _id: unitId });
  
      return res.status(200).json({ message: "Unit deleted successfully!" });
    } catch (err) {
      next(err);
    }
  };