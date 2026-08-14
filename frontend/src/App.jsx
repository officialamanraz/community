import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importing components
import HomePage from '../components/HomePage';
import Signup from '../components/Signup';
import Login from '../components/Login';
import RoomPage from '../components/RoomPage';
import AdminPage from '../components/AdminPage';
import ProfilePage from '../components/ProfilePage'; 
import PostPage from '../components/Postpage';// path check kar lenaimport PostPage from './pages/PostPage';
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
      </Routes>
    </Router>
  );
}

export default App;