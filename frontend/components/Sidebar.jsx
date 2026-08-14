import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../api';
import './Sidebar.css';

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10v9.5a1 1 0 0 0 1 1H17.5a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const RoomsIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="4.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="4.5" width="7" height="7" rx="1.2" />
        <rect x="3.5" y="14.5" width="7" height="7" rx="1.2" />
        <rect x="13.5" y="14.5" width="7" height="7" rx="1.2" />
    </svg>
);
const ProfileIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8.2" r="3.7" />
        <path d="M4.5 20c1.4-3.6 4.5-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
    </svg>
);
const AdminIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3.5 4.5 6.7v5.3c0 4.6 3.2 7.9 7.5 8.9 4.3-1 7.5-4.3 7.5-8.9V6.7L12 3.5Z" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 4H5.5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1H9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 8.5 17.5 12 13 15.5M17.2 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function Sidebar({ rooms = [] }) {
    const location = useLocation();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="sb-root">
            <div className="sb-brand">
                <span className="sb-brand-mark">◆</span>
            </div>

            <nav className="sb-nav">
                <Link to="/" className={`sb-item ${isActive('/') ? 'sb-item-active' : ''}`}>
                    <HomeIcon /> 
                </Link>
                <Link to="/profile" className={`sb-item ${isActive('/profile') ? 'sb-item-active' : ''}`}>
                    <ProfileIcon /> 
                </Link>
                {currentUser?.role === 'admin' && (
                    <Link to="/admin" className={`sb-item ${isActive('/admin') ? 'sb-item-active' : ''}`}>
                        <AdminIcon />
                    </Link>
                )}
            </nav>

            {rooms.length > 0 && (
                <div className="sb-rooms">
                    <div className="sb-rooms-label"><RoomsIcon /></div>
                    <div className="sb-rooms-list">
                        {rooms.map((room) => (
                            <Link
                                key={room.room_id}
                                to={`/room/${room.room_id}`}
                                className={`sb-room-chip ${isActive(`/room/${room.room_id}`) ? 'sb-room-chip-active' : ''}`}
                            >
                                # {room.room_name || room.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="sb-footer">
                {currentUser ? (
                    <button className="sb-item sb-logout" onClick={handleLogout}>
                        <LogoutIcon />
                    </button>
                ) : (
                    <Link to="/login" className="sb-item">
                        <LogoutIcon />
                    </Link>
                )}
            </div>
        </aside>
    );
}