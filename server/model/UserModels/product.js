import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {

    purchaseUnit: {
      type:String,
    },
    baseUnit: {
      type:String,
    },
    conversionRate: {
      type: Number,
    },
    stockCount: {
      type: Number,
      default: 0,
    },
    minStockAlert: {
      type: Number,
      default: 0,
    },
    brandId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
    },
    categoryId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    modelId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Model",
        required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    variants: [
      {
        variantName: { type: String },
        price: { type: Number },
        color: { type: String },
      }
    ],
    price: {
      type:Number,
      default:null
    },
    color: {
      type:String,
      default:null
    },
  
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    createdBy: {
      type: String,
    },

        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
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