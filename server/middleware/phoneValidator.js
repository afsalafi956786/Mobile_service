import BRANCH from '../model/UserModels/branch.js'
import EMPLOYEE from '../model/UserModels/employee.js'

const validatePhoneNumbers = async (phoneNumbers, excludeId = null, isEmployee = false) => {
    if (!phoneNumbers.length) return false; // No phone numbers to check

    let existInBranch = null;
    let existInEmployee = null;

    if (!isEmployee) {
        // If checking for a restaurant, exclude the current restaurant's ID when updating
        existInBranch = await BRANCH.findOne({
            ...(excludeId && { _id: { $ne: excludeId } }), 
            isDeleted: false,
            $or: [
                { phone: { $in: phoneNumbers } },
                { phone2: { $in: phoneNumbers } },
            ],
        });
    }

    if (isEmployee) {
        // If checking for an employee, exclude the current employee's ID when updating
        existInEmployee = await EMPLOYEE.findOne({
            ...(excludeId && { _id: { $ne: excludeId } }), 
            isDeleted: false,
            $or: [
                { contactNo: { $in: phoneNumbers } },
                { contactNo2: { $in: phoneNumbers } },
            ],
        });
    }

    return existInBranch || existInEmployee; // Returns true if a conflict exists
};

export default validatePhoneNumbers;
