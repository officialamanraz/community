function RoomCard({ room, onClick }) {
    return (
        <div className="room-card" onClick={() => onClick(room.room_id)}>
            <h3>{room.name}</h3>
            <p>{room.description}</p>
        </div>
    );
}

export default RoomCard;
