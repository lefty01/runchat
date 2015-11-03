var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    mongoose = require('mongoose'),
    favicon = require('serve-favicon'),
    users = {};


server.listen(30331);

mongoose.connect('mongodb://localhost/chat', function(err){
	if(err){
		console.log(err);
	} else{
		console.log('Connected to mongodb!');
	}
});

var chatSchema = mongoose.Schema({
	nick: String,
	msg: String,
	created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

app.use(express.static(__dirname + '/public'));

app.use(favicon(__dirname + '/public/favicon.ico'));

app.get('/', function(req, res){
        res.sendfile(__dirname + '/views/index.html');
});

io.sockets.on('connection', function(socket){
	var query = Chat.find({});
	query.sort('-created').limit(20).exec(function(err, docs){
		if(err) throw err;
		socket.emit('load old msgs', docs);
	});

	socket.on('new user', function(data, callback){
		if (data in users){
			callback(false);
		} else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});

	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message', function(data, callback){
		var msg = data.trim();
		console.log('after trimming message is: ' + msg);
		if (msg.substr(0,3) === '/w ') {
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
					console.log('message sent is: ' + msg);
					console.log('Whisper!');
				} else{
					callback('Error!  Enter a valid user.');
				}
			} else{
				callback('Error!  Please enter a message for your whisper.');
			}
		} else { // not a whisper
		    var newMsg = new Chat({msg: msg, nick: socket.nickname});
		    console.log("newMsg created: " + newMsg.created);
		    newMsg.save(function(err) {
			if (err) throw err;
			io.sockets.emit('new message', {msg: msg, nick: socket.nickname, created: newMsg.created });
		    });
		}
	});

	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});
});
