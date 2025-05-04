import mongoose from 'mongoose';



const categorySchema =new mongoose.Schema({
    name: {
        type: String,
        required: true, // Example: "Manager", "Chef", "Waiter"
    },
    branchAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
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

categorySchema.index({ name: 1, branchAdminId: 1, isDeleted: 1 }, { unique: true ,partialFilterExpression: { isDeleted: false }});

const categoryModel = mongoose.model('Category',categorySchema);


export default categoryModel;