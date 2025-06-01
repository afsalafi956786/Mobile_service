import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    prodcutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true,
  },
  variantId:{
    type:String,
    default:null
  },
  quantity: {
    type: Number,
    required: true,
  },
  purchaseUnit: {
    type: String,
  },
//   baseUnit:{
//     type:String,
//   },
  conversionRate :{
    type:Number,
    required:true,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
});

const purchaseReturnSchema = new mongoose.Schema(
  {

    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },
    purchase_ref:{
      type:String,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
        required: true,
      },
    returnDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    items: [itemSchema],
    returnAmount: {
      type: Number,
      required: true,
    },
    noOfItems: {
      type: Number,
      required: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: String,
          isDeleted: { type: Boolean, default: false },
         deletedAt: { type: Date, default: null },
         deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
         deletedBy: { type: String, default: null }
  },
  { timestamps: true }
);

purchaseReturnSchema.index({ _id: 1, isDeleted: 1 });
purchaseReturnSchema.index({ branchId: 1, isDeleted: 1 });
purchaseReturnSchema.index({ purchaseId: 1, restaurantId: 1, isDeleted: 1 });
purchaseReturnSchema.index({ supplierId: 1, restaurantId: 1, isDeleted: 1 });
purchaseReturnSchema.index({ returnDate: 1, restaurantId: 1, isDeleted: 1 });



const purchaseReturnModel =  mongoose.model("PurchaseReturn", purchaseReturnSchema);
export default purchaseReturnModel;
