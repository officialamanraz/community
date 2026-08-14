import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORTED createHomeBanner here
import { createRoom, getAllRooms, createHomeBanner, updateHomeBanner, updateRoomBanner } from '../api';
import './AdminPage.css';

function AdminPage() {
    const [rooms, setRooms] = useState([]);
    
    // Create Room State
    const [roomName, setRoomName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    
    // Home Banner State
    const [homeBannerFile, setHomeBannerFile] = useState(null);

    // Room Banner State
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [roomBannerFile, setRoomBannerFile] = useState(null);

    // Status States
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await getAllRooms();
                setRooms(data);
            } catch (err) {
                console.error("Failed to load rooms", err);
            }
        };
        fetchRooms();
    }, []);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!roomName || !imageFile) return setError("Room name and Image are required!");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('room_name', roomName);
            formData.append('image', imageFile);

            await createRoom(formData);
            setSuccess('Room created successfully!');
            setRoomName(''); setImageFile(null);
            document.getElementById('room-image-input').value = '';
        } catch (err) {
            setError(err.message || 'Failed to create room');
        } finally {
            setIsSubmitting(false);
        }
    };

    // NEW FUNCTION: Calls POST to create the banner
    const handleCreateHomeBanner = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!homeBannerFile) return setError("Please select a file to upload");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('banner_image', homeBannerFile);
            await createHomeBanner(formData);
            setSuccess('Home banner created successfully!');
            setHomeBannerFile(null);
            document.getElementById('home-banner-input').value = '';
        } catch (err) {
            setError(err.message || 'Failed to create home banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calls PUT to update the banner
    const handleUpdateHomeBanner = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!homeBannerFile) return setError("Please select a file to update");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('banner_image', homeBannerFile);
            await updateHomeBanner(formData);
            setSuccess('Home banner updated successfully!');
            setHomeBannerFile(null);
            document.getElementById('home-banner-input').value = '';
        } catch (err) {
            setError(err.message || 'Failed to update home banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRoomBanner = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!selectedRoomId || !roomBannerFile) return setError("Please select a room and a file");

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('banner_image', roomBannerFile);
            await updateRoomBanner(selectedRoomId, formData);
            setSuccess('Room banner updated successfully!');
            setRoomBannerFile(null);
            setSelectedRoomId('');
            document.getElementById('room-banner-input').value = '';
        } catch (err) {
            setError(err.message || 'Failed to update room banner');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="admin-container">
            <h2>Admin Dashboard</h2>
            <hr className="admin-divider" />

            {error && <p className="admin-message error">{error}</p>}
            {success && <p className="admin-message success">{success}</p>}

            {/* FORM 1: CREATE ROOM */}
            <h3>Create a New Community Room</h3>
            <form onSubmit={handleCreateRoom} className="admin-form">
                <div className="form-group">
                    <label>Room Name</label>
                    <input type="text" value={roomName} placeholder="Enter room name..." onChange={(e) => setRoomName(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                    <label>Room Cover Image</label>
                    <input id="room-image-input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="form-input" />
                </div>
                <button type="submit" disabled={isSubmitting} className={`submit-btn ${isSubmitting ? 'disabled' : 'active'}`}>
                    {isSubmitting ? 'Creating...' : 'Create Room'}
                </button>
            </form>

    
            <h3>Manage Home Page Banner</h3>
            <div className="admin-form">
                <div className="form-group">
                    <label>Upload Banner Image</label>
                    <input id="home-banner-input" type="file" accept="image/*" onChange={(e) => setHomeBannerFile(e.target.files[0])} className="form-input" />
                </div>
                
                {/* Cleaned up: Replaced inline styles with className="btn-group" */}
                <div className="btn-group">
                    
                    {/* Cleaned up: Added btn-create class */}
                    <button type="button" onClick={handleCreateHomeBanner} disabled={isSubmitting} className={`submit-btn btn-create ${isSubmitting ? 'disabled' : 'active'}`}>
                        {isSubmitting ? 'Processing...' : 'Upload as New (POST)'}
                    </button>
                    
                    {/* Cleaned up: Removed inline flex style, the CSS handles it now */}
                    <button type="button" onClick={handleUpdateHomeBanner} disabled={isSubmitting} className={`submit-btn ${isSubmitting ? 'disabled' : 'active'}`}>
                        {isSubmitting ? 'Processing...' : 'Update Existing (PUT)'}
                    </button>
                    
                </div>
            </div>

            {/* FORM 3: UPDATE ROOM BANNER */}
            <h3>Update Room Banner</h3>
            <form onSubmit={handleUpdateRoomBanner} className="admin-form">
                <div className="form-group">
                    <label>Select Room</label>
                    <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} className="form-input">
                        <option value="">-- Choose a Room --</option>
                        {rooms.map(room => (
                            <option key={room.room_id} value={room.room_id}>{room.room_name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Upload New Room Banner</label>
                    <input id="room-banner-input" type="file" accept="image/*" onChange={(e) => setRoomBannerFile(e.target.files[0])} className="form-input" />
                </div>
                <button type="submit" disabled={isSubmitting} className={`submit-btn ${isSubmitting ? 'disabled' : 'active'}`}>
                    {isSubmitting ? 'Updating...' : 'Update Room Banner'}
                </button>
            </form>

            <div style={{ marginTop: '30px' }}>
                <button onClick={() => navigate('/')} className="back-btn">Back to Home</button>
            </div>
        </div>
    );
}

export default AdminPage;