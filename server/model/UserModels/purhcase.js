import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    prodcutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    purchaseUnit: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    conversionRate :{
      type:Number,
      required:true,
    },
    total: {
      type: Number,
      required: true,
    }
  },
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseId: {
      type:String,
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
    },
    purchaseStatus: {
        type: String,
        default: "Received"
      },
    invoiceNo: {
      type: String,
      default: null,
    },
    attachFile: {
      type: String,
      default: null,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    noOfItems: {
      type: Number,
      required: true,
    },
    paidAmount:{
      type:Number,
      default:0
    },
    due: {
      type: Number,
      default: 0,
    },
    refundDue: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    cancelledAt:{ type: Date, default: null },
    cancelledBy : { type:String, default:null},
    items: [purchaseItemSchema],
        createdById: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true, // CompanyAdmin or BranchAdmin who created it
        },
        createdBy:{
            type:String,
        },
          isDeleted: { type: Boolean, default: false },
          deletedAt: { type: Date, default: null },
          deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
          deletedBy: { type: String, default: null }
  },
  { timestamps: true }
);

purchaseSchema.index(
  { purchaseId: 1, branchId: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
purchaseSchema.index({ _id: 1, isDeleted: 1 });
purchaseSchema.index({ barnchId: 1, isDeleted: 1 });
purchaseSchema.index({ supplierId: 1, barnchId: 1, isDeleted: 1 });
purchaseSchema.index({ purchaseDate: 1, barnchId: 1, isDeleted: 1 });

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;