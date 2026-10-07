namespace Banter.Utils
{
    public class ConnectionTracker
    {
        private readonly Dictionary<Guid, HashSet<string>> _connections = new();
        private readonly object _lock = new();

        public bool Add(Guid userId, string connectionId)
        {
            lock (_lock)
            {
                if (!_connections.TryGetValue(userId, out var set))
                {
                    set = new HashSet<string>();
                    _connections[userId] = set;
                }
                set.Add(connectionId);
                return set.Count == 1;
            }
        }

        public bool Remove(Guid userId, string connectionId)
        {
            lock (_lock)
            {
                if (!_connections.TryGetValue(userId, out var set))
                    return false;

                set.Remove(connectionId);
                if (set.Count == 0)
                {
                    _connections.Remove(userId);
                    return true;
                }
                return false;
            }
        }

        public bool IsOnline(Guid userId)
        {
            lock (_lock)
            {
                return _connections.ContainsKey(userId);
            }
        }

        public List<string> GetConnections(Guid userId)
        {
            lock (_lock)
            {
                return _connections.TryGetValue(userId, out var set) ? set.ToList() : new List<string>();
            }
        }

        public int OnlineCount()
        {
            lock (_lock)
            {
                return _connections.Count;
            }
        }
    }
}
