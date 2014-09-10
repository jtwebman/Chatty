var Chat = function(socket) {
	this.socket = socket;
}

Chat.prototype.sendMessage = function(room, text) {
	this.socket.emit('message', { room: room, text: text });
}

Chat.prototype.changeRoom = function(room) {
	this.socket.emit('join', { newRoom: room });
}