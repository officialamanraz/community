import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api';

function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    
    // Naya state profile image aur uske preview ke liye
    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Normal text inputs handle karne ke liye
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // File (Image) select handle karne ke liye
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            // Image select karte hi uska ek preview URL banayenge
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        console.log('[signup] registering user with data:', formData);

        try {
            // JSON ki jagah FormData use kar rahe hain taaki image server tak ja sake
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('password', formData.password);
            
            // Agar user ne image select ki hai, toh usey FormData mein daalein
            if (profileImage) {
                submitData.append('profile_image', profileImage);
            }

            // backend API ko FormData bhejein
            const data = await signup(submitData);
            
            console.log('[signup] server response:', data);
            alert('Account created successfully!');
            navigate('/'); // Login ya Home page par redirect karein
            
        } catch (err) {
            console.error("[signup] request error:", err);
            setError(err.message || 'Failed to sign up');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ textAlign: 'center', color: '#fff' }}>Create an Account</h2>
            {error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Profile Image Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    {previewUrl ? (
                        <img 
                            src={previewUrl} 
                            alt="Profile Preview" 
                            style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #b026ff' }} 
                        />
                    ) : (
                        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px solid #444' }}>
                            Upload Photo
                        </div>
                    )}
                    <input 
                        type="file" 
                        name="profile_image" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        style={{ fontSize: '13px', color: '#ccc', marginLeft: '60px' }}
                    />
                </div>

                {/* Text Inputs */}
                <input style={inputStyle} type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                <input style={inputStyle} type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
                <input style={inputStyle} type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
                <input style={inputStyle} type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                
                <button type="submit" disabled={isSubmitting} style={{ padding: '12px', cursor: isSubmitting ? 'not-allowed' : 'pointer', background: '#b026ff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' }}>
                    {isSubmitting ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
            
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#aaa' }}>
                Already have an account? <Link to="/login" style={{ color: '#b026ff', textDecoration: 'none', fontWeight: 'bold' }}>Login here</Link>
            </p>
        </div>
    );
}

// Chhota sa style object inputs ke liye taaki code clean lage
const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#111',
    color: '#fff',
    outline: 'none',
    fontSize: '14px'
};

export default Signup;