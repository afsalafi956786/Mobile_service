import mongoose  from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    employeeId : { type :Number, required:true} ,
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true },
    contactNo: { type:String, required: true },
    contactNo2: { type:String,default:null },
    contactNo3: { type:String,default:null },
    address: { type: String, required: true },
    gender: { type: String, required: true },
    nationality: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    position: { type: mongoose.Schema.Types.ObjectId, ref: "position" },
    joiningDate: { type: Date },
    salary: { type: Number },
    emiratesIdNo: { type: String },
    passportNo: { type: String },
    visaType: { type: String },
    visaExpiryDate: { type: Date },
    temporaryEmployee: { type: Boolean, default: false },
  documents: [
  {
    name: { type: String, default: null }, // Previously `description`
    file: { type: String, default: null }, // URL of the uploaded file
  },
],
  isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        deletedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" ,default:null },
        deletedBy: { type: String, default: null }
  },
  { timestamps: true }
);

employeeSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
employeeSchema.index({ contactNo: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
employeeSchema.index({ restaurantId: 1 });

const employeeModel = mongoose.model("Employee", employeeSchema);

export default employeeModel;
