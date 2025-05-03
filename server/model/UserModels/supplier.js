import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNo: {
      type: String,
      required: true,

    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    wallet: {
      credit: { type: Number, default: 0 },     // Amount the restaurant still owes to vendor (credit to vendor)
      debit: { type: Number, default: 0 },  // Amount the vendor needs to return to restaurant
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

       isDeleted: { type: Boolean, default: false },
            deletedAt: { type: Date, default: null },
            deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
            deletedBy: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

supplierSchema.index(
    { name: 1, branchId: 1, isDeleted: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
  );

const supplierModel= mongoose.model("Supplier", supplierSchema);
export default supplierModel;