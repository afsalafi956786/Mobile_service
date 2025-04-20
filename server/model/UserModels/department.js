import mongoose from 'mongoose';



const departmentSchema =new mongoose.Schema({
    name: {
        type: String,
        required: true, // Example: "Manager", "Chef", "Waiter"
    },
    branchId: {
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

departmentSchema.index({ name: 1, branchId: 1, isDeleted: 1 }, { unique: true ,partialFilterExpression: { isDeleted: false }});

const departmentModel = mongoose.model('Department',departmentSchema);


export default departmentModel;