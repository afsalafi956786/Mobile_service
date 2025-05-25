import  mongoose  from 'mongoose'


const stockLedgerSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantName: {
    type: String, // Optional if product has variants
    default: null,
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },
  type: {
    type: String,
    enum: ['purchase', 'adjustment', 'opening'],
    default: 'opening',
  },
  quantity: {
    type: Number,
    required: true,
  },
  remainingQty: {
    type: Number,
    required: true,
  },
  costPrice: {
    type: Number,
    required: true,
  },
  purchaseUnit: {
    type: String,
  },
  purchaseDate: {
    type: Date,
    default :null,
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdBy: {
    type: String,
  },
},{
    timestamps:true
});

const stockLedgerModel = mongoose.model('StockLedger', stockLedgerSchema);
export default stockLedgerModel;
