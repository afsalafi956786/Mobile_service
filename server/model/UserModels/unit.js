import mongoose from 'mongoose';



const UnitSchema =new mongoose.Schema({
    unitName: {
        type: String,
        required: true, // Example: "Manager", "Chef", "Waiter"
    },
    shortTag:{
        type:String,
        required:true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

    // isDeleted: { type: Boolean, default: false },
    //     deletedAt: { type: Date, default: null },
    //     deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
    //     deletedBy: { type: String, default: null }
},{
    timestamps:true
})

UnitSchema.index({ unitName: 1, branchId: 1 },);

const UnitModel = mongoose.model('Unit',UnitSchema);


export default UnitModel;