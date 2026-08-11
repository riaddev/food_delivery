import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const dashboardFor = (role) => {
  if (role === "restaurant") return "/restaurant/dashboard";
  if (role === "admin") return "/admin/dashboard";
  if (role === "customer") return "/customer/account";
  return "/";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f6f2ec]">
        <p className="text-[#6b6b6f] text-base">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardFor(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
