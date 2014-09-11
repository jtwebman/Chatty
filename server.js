var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var url = require('url');

var cache = {};

function send404(res) {
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.write('Error 404: resource not found.');
	res.end();
}

function sendFile(res, file, contents) {
	res.writeHead(200, {'Content-Type': mime.lookup(path.basename(file))});
	res.end(contents);
}

function serveStatic(res, cache, absPath) {
	if (cache[absPath]) {
		sendFile(res, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function (exists) {
			if (!exists) {
				send404(res);
			} else {
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(res);
					} else {
						cache[absPath] = data;
						sendFile(res, absPath, data);
					}
				});
			}
		});
	}
}

var server = http.createServer(function(req, res) {
	var filePath = false;
	var urlInfo = url.parse(req.url);

	if (urlInfo.pathname== '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + req.url;
	}

	var absPath = './' + filePath;
	serveStatic(res, cache, absPath);
});

server.listen(3000, function() {
	console.log("Chatty listening on port 3000.");
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);