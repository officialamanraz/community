import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importing components
import HomePage from '../components/HomePage';
import Signup from '../components/Signup';
import Login from '../components/Login';
import RoomPage from '../components/RoomPage';
import AdminPage from '../components/AdminPage';
import ProfilePage from '../components/ProfilePage'; 
import PostPage from '../components/Postpage';
import ForgotPassword from '../components/ForgotPassword';
import ResetPassword from '../components/ResetPassword';// path check kar lenaimport PostPage from './pages/PostPage';
// ...

// ...


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/room/:room_id" element={<RoomPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route  path="/profile/:user_id?"element={<ProfilePage />}/>
        <Route path="/post/:post_id" element={<PostPage />} />
        <Route path="/ForgotPassword" element={<ForgotPassword/>}/>
        <Route path="/ResetPassword" element={<ResetPassword/>}/>
      </Routes>
    </Router>
  );
}

export default App;