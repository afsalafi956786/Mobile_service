import mongoose from 'mongoose';



const positionSchema  =new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    branchAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
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

positionSchema.index({ branchAdminId: 1, departmentId: 1, name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });


const positionModel = mongoose.model('position',positionSchema);


export default positionModel;