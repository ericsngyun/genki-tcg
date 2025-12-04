import { Search } from 'lucide-react';
import { RankedAvatar, mapRatingToTier, PlayerTier } from '../RankedAvatar';

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    balance?: number;
    memberships: Array<{
        role: string;
    }>;
    lifetimeRatings?: Array<{
        rating: number;
        category: string;
    }>;
}

interface UserListSectionProps {
    users: User[];
    search: string;
    setSearch: (value: string) => void;
    selectedUser: User | null;
    onUserSelect: (user: User) => void;
    loading: boolean;
}

export function UserListSection({
    users,
    search,
    setSearch,
    selectedUser,
    onUserSelect,
    loading,
}: UserListSectionProps) {
    // Helper to get highest tier
    const getHighestTier = (user: User): PlayerTier => {
        if (!user.lifetimeRatings || user.lifetimeRatings.length === 0) return 'UNRANKED';
        const highestRating = Math.max(...user.lifetimeRatings.map(r => r.rating));
        return mapRatingToTier(highestRating);
    };

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Search Header */}
            <div className="p-6 border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    {users.length} user{users.length !== 1 ? 's' : ''} found
                </p>
            </div>

            {/* User List */}
            <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="text-sm text-muted-foreground mt-3 animate-pulse">Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">👤</span>
                        </div>
                        <p className="text-muted-foreground font-medium">No users found</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search</p>
                    </div>
                ) : (
                    users.map((user, index) => (
                        <button
                            key={user.id}
                            onClick={() => onUserSelect(user)}
                            className={`w-full p-4 border-b border-border text-left hover:bg-muted/50 transition-all group animate-in fade-in slide-in-from-left-2 duration-300 ${selectedUser?.id === user.id
                                ? 'bg-primary/5 border-l-4 border-l-primary'
                                : 'border-l-4 border-l-transparent'
                                }`}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <RankedAvatar
                                    user={{ name: user.name, avatarUrl: user.avatarUrl }}
                                    tier={getHighestTier(user)}
                                    size="md"
                                    showTierBadge={true}
                                    className={`transition-all ${selectedUser?.id === user.id
                                        ? 'scale-110'
                                        : ''
                                        }`}
                                />

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <div
                                        className={`font-semibold truncate transition-colors ${selectedUser?.id === user.id
                                            ? 'text-foreground'
                                            : 'text-foreground/90 group-hover:text-foreground'
                                            }`}
                                    >
                                        {user.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                </div>

                                {/* Balance Display */}
                                <div className="flex flex-col items-end gap-0.5 mr-2">
                                    <div
                                        className={`text-lg font-bold tabular-nums ${(user.balance ?? 0) > 0
                                            ? 'text-green-400'
                                            : (user.balance ?? 0) < 0
                                                ? 'text-destructive'
                                                : 'text-muted-foreground'
                                            }`}
                                    >
                                        {(user.balance ?? 0).toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                        Credits
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="flex-shrink-0">
                                    <span className="text-xs px-2.5 py-1 bg-muted/80 text-muted-foreground rounded-md font-medium border border-border/50">
                                        {user.memberships[0]?.role || 'PLAYER'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
