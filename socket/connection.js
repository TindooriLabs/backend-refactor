export function connect(socket) {
  const { userId } = socket.user;
  const room = userId.toString();

  //Add user to room identified by user ID. Room will contain all of a user's devices
  socket.join(room);

  console.log(`User connected to room ${room}.`);
}

export function disconnect() {
  console.log("User disconnected."); //User is automaticaly removed from all rooms
}
