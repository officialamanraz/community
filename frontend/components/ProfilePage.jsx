import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProfilePage.css';
import { getUserProfile, updateProfile, toggleFollow, getCurrentUser, getUserPosts } from '../api';
const API_URL = import.meta.env.VITE_API_URL;

export default function ProfilePage() {
    const { user_id } = useParams();
    const currentUser = getCurrentUser();

    const targetUserId = user_id || currentUser?.user_id;

    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const [userPosts, setUserPosts] = useState([]);
    
    // NEW: States for tab switching and handling comments
    const [activeTab, setActiveTab] = useState('posts'); 
    const [userComments, setUserComments] = useState([]); 

    const [editUsername, setEditUsername] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editImage, setEditImage] = useState(null);
    const [editBanner, setEditBanner] = useState(null);

    const loadProfile = useCallback(async () => {
        try {
            const data = await getUserProfile(targetUserId);
            setProfile(data);
            setEditUsername(data.username || "");
            setEditBio(data.bio || "");

            const postsData = await getUserPosts(targetUserId);
            setUserPosts(postsData);

            // TODO: If you create an API for comments, fetch them here like this:
            // const commentsData = await getUserComments(targetUserId);
            // setUserComments(commentsData);

        } catch (err) {
            console.error("Failed to load profile", err);
            setError(err.message || "Could not load profile data.");
        }
    }, [targetUserId]);

    useEffect(() => {
        if (targetUserId) {
            loadProfile();
        } else {
            setError("No user to show - are you logged in?");
        }
    }, [targetUserId, loadProfile]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('username', editUsername);
        formData.append('bio', editBio);

        if (editImage) {
            formData.append('profile_image', editImage);
        }

        if (editBanner) {
            formData.append('banner_image', editBanner);
        }

        try {
            await updateProfile(formData);
            setIsEditing(false);
            setEditImage(null);
            setEditBanner(null);
            await loadProfile();
        } catch (err) {
            console.error("Failed to update", err);
            setError("Failed to update profile.");
        }
    };

    const handleFollow = async () => {
        try {
            await toggleFollow(targetUserId);
            await loadProfile();
        } catch (err) {
            console.error("Failed to follow", err);
        }
    };

    if (error) {
        return (
            <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '50px', backgroundColor: '#000', minHeight: '100vh' }}>
                {error}
            </div>
        );
    }
    
    if (!profile) return <div style={{ color: '#b026ff', textAlign: 'center', padding: '50px', backgroundColor: '#000', minHeight: '100vh' }}>Loading Profile...</div>;

    const isOwnProfile = currentUser?.user_id === targetUserId;

    return (
        <div className="pp-shell">
            <div className="pp-sidebar">
                <Link to="/" className="pp-nav-link" title="Home">🏠</Link>
                <Link to="/Admin" className="pp-nav-link" title="Admin">A</Link>
            </div>

            <div className="pp-main">
                <div
                    className="pp-banner"
                    style={{ backgroundImage: profile.banner_image ? `url${profile.banner_image})` : 'none' }}>
                </div>

                <div className="pp-content">
                    <div className="pp-avatar-container">
                        {profile.profile_image ? (
                            <img src={`${profile.profile_image}`} alt="Profile" className="pp-avatar-img" />
                        ) : (
                            <span className="pp-avatar-placeholder">{profile.name.charAt(0)}</span>
                        )}
                    </div>

                    <div className="pp-actions">
                        {isOwnProfile ? (
                            <button onClick={() => setIsEditing(!isEditing)} className="pp-btn-outline">
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                            </button>
                        ) : (
                            <button
                                onClick={handleFollow}
                                className={profile.is_following ? 'pp-btn-outline' : 'pp-btn-primary'}
                            >
                                {profile.is_following ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                    </div>

                    <div className="pp-info">
                        <h1 className="pp-name">{profile.name}</h1>
                        <p className="pp-username">@{profile.username || `user${profile.user_id}`}</p>
                        <p className="pp-bio">{profile.bio || "This user hasn't written a bio yet."}</p>

                        <div className="pp-stats">
                            <span><strong>{profile.following}</strong> Following</span>
                            <span><strong>{profile.followers}</strong> Followers</span>
                        </div>
                    </div>

                    {isEditing && (
                        <form onSubmit={handleUpdateProfile} className="pp-edit-form" style={{ marginTop: '30px' }}>
                            <h3>Update Profile</h3>

                            <label>Username (without @)</label>
                            <input
                                type="text"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                placeholder="Enter unique username"
                            />

                            <label>Bio</label>
                            <textarea
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder="Tell the world about yourself..."
                            />

                            <label>Profile Picture</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditImage(e.target.files[0])}
                            />

                            <label>Profile Banner</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setEditBanner(e.target.files[0])}
                            />

                            <button type="submit" className="pp-btn-primary">
                                Save Changes
                            </button>
                        </form>
                    )}

                    {/* NEW: Toggle Tabs for Posts vs Comments */}
                    <div className="pp-tabs">
                        <button 
                            className={`pp-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('posts')}
                        >
                            Posts
                        </button>
                        <button 
                            className={`pp-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('comments')}
                        >
                            Comments
                        </button>
                    </div>

                    {/* Conditional Rendering based on selected tab */}
                    {activeTab === 'posts' ? (
                        <div className="pp-grid">
                            {userPosts.length > 0 ? userPosts.map((post) => (
                                <div key={`post-${post.post_id}`} className="pp-grid-item">
                                    {post.image_url ? (
                                        <img
                                            src={`${post.image_url}`}
                                            alt="post"
                                            className="pp-grid-img"
                                        />
                                    ) : (
                                        <div className="pp-grid-text">
                                            <h4>{post.title}</h4>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <p className="pp-empty">
                                    {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="pp-comments-list">
                            {userComments.length > 0 ? (
                                userComments.map((comment) => (
                                    <div key={`comment-${comment.id}`}>
                                        {/* Render comment mapping here when API is ready */}
                                    </div>
                                ))
                            ) : (
                                <p className="pp-empty">
                                    {isOwnProfile ? "You haven't made any comments yet." : "This user hasn't made any comments yet."}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}