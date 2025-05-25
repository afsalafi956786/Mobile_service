import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    //  Optional variant array
    variants: [
      {
        variantName: { type: String },
        price: { type: Number, required: true },
        color: { type: String },
        stockCount: { type: Number, default: 0 },
        purchaseUnit: { type: String },
        baseUnit: { type: String },
        conversionRate: { type: Number, default: 1 },
        minStockAlert: { type: Number, default: 0 },
      },
    ],

    //  Fields for non-variant (simple) products
    price: { type: Number, default: null },
    color: { type: String, default: null },
    stockCount: { type: Number, default: 0 },
    purchaseUnit: { type: String, default: null },
    baseUnit: { type: String, default: null },
    conversionRate: { type: Number, default: 1 },
    minStockAlert: { type: Number, default: 0 },

    //  Audit info
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    createdBy: { type: String },

    //  Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true }
);

productSchema.index(
    { brandId: 1, modelId: 1,categoryId: 1, branchId: 1, isDeleted: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
  );

const productModel= mongoose.model("Product", productSchema);
export default productModel;