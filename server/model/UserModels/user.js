import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
     branchIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: []
     }],
    name: { type: String, },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String,default:null },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null,
      },
      positionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'position',
        default: null,
      },
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null,
      },
        createdById: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
               
          },
    role: { 
        type: String, 
        enum: ["User","BranchAdmin"], 

    },
    // permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    // createdBy : { type:String},
    // status: { type: Boolean, default: true },

    isDeleted: { type: Boolean, default: false,index: true },
    deletedAt: { type: Date, default: null },
    deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
    deletedBy: { type: String, default: null }
    

}, { timestamps: true });


const User = mongoose.model("User", userSchema);
export default User;