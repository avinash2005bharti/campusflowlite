import ApiError from '../utils/ApiError.js';

/**
 * Role authorization middleware
 * Supports: 'STUDENT', 'TEACHER', 'TG', 'HOD', 'ADMIN'
 * Note: Admin has super-privileges to act as HOD per Section 3
 * @param  {...string} allowedRoles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthenticated());
    }

    const { role, isTG } = req.user;

    // Direct role match
    if (allowedRoles.includes(role)) {
      return next();
    }

    // Derived TG role check
    if (allowedRoles.includes('TG') && isTG) {
      return next();
    }

    // Admin acting as HOD
    if (role === 'ADMIN' && allowedRoles.includes('HOD')) {
      return next();
    }

    return next(ApiError.forbidden('You do not have permission to perform this action'));
  };
};

export default authorize;
