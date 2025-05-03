import mongoose from 'mongoose';



const modelSchema  =new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    branchAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brannd",
        required: true,
    },
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
},{
    timestamps:true
})

modelSchema.index({ branchAdminId: 1, brandId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });


const modelModel = mongoose.model('Model',modelSchema);


export default modelModel;