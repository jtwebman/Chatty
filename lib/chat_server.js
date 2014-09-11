var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
	io = require('socket.io')(server);

	io.on('connection', function (socket) {
		guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
		joinRoom(socket, 'Lobby');

		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket);

		io.on('rooms', function() {
			socket.emit('rooms', io.sockets.manager.rooms);
		});

		handleClientDisconnection(socket);
	});
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;

	socket.emit('nameResult', { success: true, name: name });

	namesUsed.push(name);
	return guestNumber + 1;
}

function joinRoom(socket, room) {
	socket.join(room);
	currentRoom[socket.id] = room;

	socket.emit('joinResult', { room: room });
	socket.to(room).emit('message', { texh: nickNames[socket.id] + ' has joined ' + room + '.' });

	var usersInRoom = io.sockets.adapter.rooms[room];

	if (usersInRoom.length > 1) {
		var usersInRoomSummary = 'Users currently in ' + room + ': ';
		for (var index in usersInRoom) {
			var userSocketId = usersInRoom[index].id;
			if (userSocketId != socket.id) {
				if (index > 0) {
					usersInRoomSummary += ', ';
				}
				usersInRoomSummary += nickNames[userSocketId];
			}
		}
		usersInRoomSummary += '.';
		socket.emit('message', { text: usersInRoomSummary });
	}
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
	socket.on('nameAttempt', function(name) {
		if (name.indexOf('Guest') == 0) {
			socket.emit('nameResult', { success: false, message: 'Names cannot begin with "Guest".' });
		} else {
			if (namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);
				
				namesUsed.push(name);
				nickNames[socket.io] = name;
				
				delete namesUsed[previousNameIndex];
				
				socket.emit('nameResult', { success: true, name: name });

				socket.broadcast.to(currentRoom[socket.id]).emit('message', { text: previousName + ' is now known as ' + name + '.' });
			} else {
				socket.emit('nameResult', { success: false, message: 'That name is already in use.' });
			}
		}
	});
}

function handleMessageBroadcasting(socket) {
	socket.on('message', function (message) {
		socket.broadcast.to(message.room).emit('message', { text: nickNames[socket.io] + ': ' + message.text });
	});
}

function handleRoomJoining(socket) {
	socket.on('join', function(room) {
		socket.leave(currentRoom[socket.io]);
		joinRoom(socket, room.newRoom);
	});
}

function handleClientDisconnection(socket) {
	io.on('disconnect', function() {
		var nameIndex = namesUsed.indexOf(nickNames[socket.io]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.io];
	});
}