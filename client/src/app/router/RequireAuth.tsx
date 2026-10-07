import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useStore } from "../stores/store";

interface Props {
    adminOnly?: boolean;
    children?: ReactNode;
}

export default observer(function RequireAuth({ adminOnly, children }: Props) {
    const { userStore } = useStore();
    const location = useLocation();

    if (!userStore.isLoggedIn) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (adminOnly && !userStore.isAdmin) {
        return <Navigate to="/home" replace />;
    }

    return children ?? <Outlet />;
});
