import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
    branchAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  logo: { type: String ,default:null },
  companyName: { type: String, required: true },
  phone: { type: String, required: true },
  phone2: { type: String, default:null },
  country: { type: String,required: true },
  state: { type: String ,required: true },
  city: { type: String,required: true },
  address: { type: String, default:null },
  currency: { type: String ,default:null },
  currencySymbol: { type: String,default:null },

  isDeleted: { type: Boolean, default: false,index: true },
    deletedAt: { type: Date, default: null },
    deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
    deletedBy: { type: String, default: null }
}, 
{ timestamps: true }
);

const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
