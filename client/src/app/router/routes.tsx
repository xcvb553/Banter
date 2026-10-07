import { createBrowserRouter } from "react-router";
import App from "../layout/App";
import LandingPage from "../layout/LandingPage";
import NotFound from "../layout/NotFound";
import RequireAuth from "./RequireAuth";
import AppShell from "../layout/AppShell";
import LoginPage from "../../features/auth/LoginPage";
import HomeLayout from "../../features/home/HomeLayout";
import FriendsPage from "../../features/home/FriendsPage";
import PrivateChat from "../../features/home/PrivateChat";
import GroupChat from "../../features/home/GroupChat";
import ServerLayout from "../../features/server/ServerLayout";
import ServerIndex from "../../features/server/ServerIndex";
import ChannelView from "../../features/server/ChannelView";
import SettingsPage from "../../features/settings/SettingsPage";
import AdminPanel from "../../features/admin/AdminPanel";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: <LandingPage /> },
            { path: "login", element: <LoginPage /> },
            {
                element: <RequireAuth />,
                children: [
                    {
                        element: <AppShell />,
                        children: [
                            {
                                path: "home",
                                element: <HomeLayout />,
                                children: [
                                    { index: true, element: <FriendsPage /> },
                                    { path: "dm/:friendId", element: <PrivateChat /> },
                                    { path: "group/:groupId", element: <GroupChat /> },
                                ],
                            },
                            {
                                path: "server/:serverId",
                                element: <ServerLayout />,
                                children: [
                                    { index: true, element: <ServerIndex /> },
                                    { path: ":channelId", element: <ChannelView /> },
                                ],
                            },
                            { path: "admin", element: <RequireAuth adminOnly><AdminPanel /></RequireAuth> },
                        ],
                    },
                    { path: "settings", element: <SettingsPage /> },
                ],
            },
            { path: "*", element: <NotFound /> },
        ],
    },
]);
