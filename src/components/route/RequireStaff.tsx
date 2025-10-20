import { useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

/**
 * A component to protect routes that require the user to have a 'STAFF' role.
 * It checks for authentication and the specific role.
 * If the user is not authenticated or doesn't have the role, it redirects them.
 */
const RequireStaff = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const location = useLocation();

    const hasStaffRole = user?.roles?.includes('STAFF') || user?.roles?.includes('ROLE_STAFF');

    if (!isAuthenticated || !hasStaffRole) {
        // Redirect them to the home page if they are not authenticated or not a staff member.
        // State is passed to allow returning to the original page after login, though not used in this flow.
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireStaff;