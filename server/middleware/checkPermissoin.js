import USER from '../models/User/userModel.js'



const checkPermission = (panel, module, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user;
      const user = await USER.findOne({_id:userId, isDeleted:false}).populate("permissions");
      if (!user) {
        return res.status(401).json({ message: "User not found!" });
      }

      if (user.role === "CompanyAdmin") {
        return next(); // CompanyAdmins have full access
      }

      const allPermissions = user.permissions.flatMap(p => p.permissions || []);

      // Panel-wide access check
      const hasPanelWideAccess = user.permissions.some((perm) => {
        if (panel === "admin" && perm.fullAdminAccess) return true;
        if (panel === "kitchen" && perm.fullKitchenAccess) return true;
        if (panel === "waiter" && perm.fullWaiterAccess) return true;
        return false;
      });

      if (hasPanelWideAccess) {
        return next(); // Full access granted for panel
      }

      const hasPermission = allPermissions.some((perm) => {
        if (perm.module !== module) return false;

        if (perm.moduleFullAccess) return true;

        if (action === "can_read") {
          return perm.actions?.can_read || perm.actions?.can_create || perm.actions?.can_update || perm.actions?.can_delete;
        }

        return perm.actions?.[action] === true;
      });

      if (!hasPermission) {
        return res.status(403).json({ message: "Permission denied!" });
      }

      next(); // All checks passed
    } catch (err) {
      next(err);
    }
  };
};


export default checkPermission;
