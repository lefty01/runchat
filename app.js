var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server),
    mongoose = require('mongoose'),
//    moment = require('moment'),
    favicon = require('serve-favicon');

var users = {};
var numUsers = 0;


function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
	return val;
    }
    if (port >= 0) {
	return port;
    }
    return false;
}

var port = normalizePort(process.env.PORT || '30331');
server.listen(port);

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


io.on('connection', function(socket) {
    var yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 12);

    var query = Chat.find({ created: {$gte: yesterday }});

    query.sort('-created').limit(30).exec(function(err, docs) {
	if(err) throw err;
	socket.emit('load old msgs', docs);
    });

    socket.on('new user', function(data, callback){
	var nick = data.trim();
	if (!nick || (nick in users)){
	    callback(false);
	} else {
	    callback(true);
	    socket.nickname = nick;
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
	var newMsg = new Chat({msg: msg, nick: socket.nickname});
	newMsg.save(function(err) {
	    if (err) throw err;
	    io.sockets.emit('new message',
			    {msg: msg, nick: socket.nickname, created: newMsg.created });
	});
    });

    socket.on('disconnect', function(data){
	if(!socket.nickname) return;
	delete users[socket.nickname];
	updateNicknames();
    });
});
