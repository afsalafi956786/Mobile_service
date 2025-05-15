// models/VendorWalletHistory.js

import mongoose from "mongoose";

const supplierWalletHistorySchema = new mongoose.Schema(
  {
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    purchaseRef: { type:String},

    type: {
      type: String,
      enum: ["credit", "debit","Credit Adjustment"],
      required: true,
    },

    amount: { type: Number, required: true },

    description: { type: String }, // optional field to add more context

    createdById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy:{ type:String },
  },
  {
    timestamps: true,
  }
);

const supplieralletModel =  mongoose.model("SupplierWalletHistory", supplierWalletHistorySchema);
 export default supplieralletModel;

