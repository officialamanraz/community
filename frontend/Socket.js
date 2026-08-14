import { io } from 'socket.io-client';

// One shared connection for the whole app - both RoomPage (room-level chat) and
// PostPage (post-level chat) import this same socket instance and just join
// different "rooms" on it (the backend's join_room/send_message/receive_message
// handlers are generic - they don't care whether the room id represents a DB
// room or a post, it's just a bucket to broadcast within).
const socket = io(import.meta.env.VITE_API_URL, {
    autoConnect: true,
});

export default socket;