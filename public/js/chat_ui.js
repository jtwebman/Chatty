function divEscapedContentElement(message) {
	return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
	return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
	var message = $('#send-message').val();
	var systemMessage;

	if (message.charAt(0) == '/') {
		try
		{
			systemMessage = chatApp.processCommand(message);
			if (systemMessage) {
				$('#messages').append(divSystemContentElement(systemMessage));
			}
		}
		catch (ex) 
		{
			$('#messages').append(divSystemContentElement(JSON.stringify(ex)));
		}
	} else {
		chatApp.sendMessage($('#room').text(), message);
		$('#messages').append(divEscapedContentElement(message));
		$('#messages').scrollTop($('#messages').prop('scrollHeight'));
	}
	$('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
	var chatApp = new Chat(socket);

	socket.on('nameresult', function(result) {
		var message;

		if (result.success) {
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}
		$('messages').append(divSystemContentElement(message.text));
	});

	socket.on('joinResult', function(result) {
		$('#room').text(result.room);
		$('#messages').append(divSystemContentElement('You successfully joined ' + result.room + ' and are known as ' + result.nickname));
	});

	socket.on('message', function(message) {
		$('#messages').append(divEscapedContentElement(message.text));
	});

	socket.on('rooms', function(rooms) {
		$('#room-list').empty();

		for (var room in rooms) {
			room = room.substring(1, room.length);
			if (room != '') {
				$('room-list').append(divEscapedContentElement(room));
			}
		}

		$('#room-list div').click(function() {
			processCommand('/join ' + $(this).text());
			$('#room-list').focus();
		});
	});

	setInterval(function() {
		socket.emit('rooms');
	}, 1000);

	$('#send-message').focus();

	$('#send-form').submit(function(event) {
		processUserInput(chatApp, socket);
		event.preventDefault();
	});
});