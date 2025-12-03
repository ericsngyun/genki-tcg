// Reusable Avatar Component for user avatars (Discord or initials fallback)

interface UserAvatarProps {
    user: {
        name: string;
        avatarUrl?: string | null;
    };
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
};

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
    const initial = user.name?.charAt(0).toUpperCase() || '?';

    if (user.avatarUrl) {
        return (
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
                <img
                    src={user.avatarUrl}
                    alt={`${user.name}'s avatar`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.nextSibling) {
                            (target.nextSibling as HTMLElement).style.display = 'flex';
                        }
                    }}
                />
                {/* Fallback initials (hidden by default, shown on img error) */}
                <div
                    className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center"
                    style={{ display: 'none' }}
                >
                    {initial}
                </div>
            </div>
        );
    }

    // No avatar URL - show initials
    return (
        <div className={`${sizeClasses[size]} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center ${className}`}>
            {initial}
        </div>
    );
}
