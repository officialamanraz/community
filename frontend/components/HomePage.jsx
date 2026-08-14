import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllRooms, getCurrentUser, logout, getHomeBanner } from '../api';
import './HomePage.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function HomePage() {
    const [rooms, setRooms] = useState([]);
    const [bannerUrl, setBannerUrl] = useState('');
    const [error, setError] = useState("");
    const currentUser = getCurrentUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

 useEffect(() => {
        const fetchInitialData = async () => {
            // Try fetching rooms first
            try {
                const roomsData = await getAllRooms();
                setRooms(roomsData || []);
                const currentUser = getCurrentUser();
console.log("Current Logged-In User:", currentUser);
            } catch (err) {
                console.error("Failed to fetch rooms:", err);
                setError("Could not load data. Is the backend server running?");
            }

            // Fetch dynamic home banner safely
            try {
                const bannerData = await getHomeBanner();
                const imageUrl = bannerData?.data?.image_url || bannerData?.image_url;

                if (imageUrl) {
                    // Safe fallback for API_URL so it never crashes with a white screen
                    const baseApiUrl = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000';
                    const cleanApiUrl = baseApiUrl.endsWith('/') ? baseApiUrl.slice(0, -1) : baseApiUrl;
                    const finalUrl = `${cleanApiUrl}/uploads/${imageUrl}`;
                    
                    setBannerUrl(finalUrl);
                }
            } catch (err) {
                console.warn("Banner load skipped or failed:", err);
            }
        };
        
        fetchInitialData();
    }, []);
    return (
        <div className="home-page-wrapper">
            
            {/* YAHAN CHANGES KIYE HAIN: Single quotes aur Debug Text */}
            <div 
                className="home-banner" 
                style={profile.banner_iamge ? { backgroundImage: `url('${profile.banner_iamge}')` } : {}}
            >
                {!bannerUrl && (
                    <p className="banner-debug-text">
                        No banner URL found. Waiting for API...
                    </p>
                )}
            </div>
            <div className="home-content-container">
                <div className="home-header">
                    <div className="home-nav-links">
                        <h2 className="home-header-title">Community Rooms</h2>
                    </div>
                    
                    <div className="home-nav-links">
                       {currentUser && (currentUser.role === 'admin' || currentUser.is_admin === 1 || currentUser.is_admin === true) && (
    <Link to="/admin" className="btn-secondary">Admin Panel</Link>
)}
                        {currentUser ? (
                            <>
                                <Link to="/profile" style={{ fontWeight: '500', color: '#f1f1f1', textDecoration: 'none' }}>
                                    Hi, {currentUser.name}
                                </Link>
                                <button onClick={handleLogout} className="btn-primary">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
                                <Link to="/signup" className="btn-primary">Sign Up</Link>
                            </>
                        )}
                    </div>
                </div>

                <hr className="home-divider" />

                {error && <p className="error-msg">{error}</p>}

                <div className="rooms-grid">
                    {rooms.length > 0 ? (
                        rooms.map((room) => (
                            <div key={room.room_id} className="room-card">
                                {room.room_image_url ? (
                                    <img src={`${room.room_image_url}`} alt="Room cover" className="room-card-image" />
                                ) : (
                                    <div className="room-card-placeholder">No Image</div>
                                )}
                                <h3 className="room-card-title">{room.room_name || room.name}</h3>
                                <Link to={`/room/${room.room_id}`} className="room-card-link">Enter Room</Link>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#555' }}>No rooms available yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}