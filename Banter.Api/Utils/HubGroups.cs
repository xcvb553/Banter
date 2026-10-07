namespace Banter.Utils
{
    public static class HubGroups
    {
        public static string Server(Guid serverId) => $"server:{serverId}";
        public static string FriendGroup(Guid groupId) => $"group:{groupId}";
    }
}
