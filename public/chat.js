
var socket = io.connect();
var $nickForm = $('#setNick');
var $nickError = $('#nickError');
var $nickBox = $('#nickname');
var $users = $('#users');
var $messageForm = $('#send-message');
var $messageBox = $('#message');
var $chat = $('#chat');
var myNick;

$nickForm.submit(function(e) {
    e.preventDefault();
    socket.emit('new user', $nickBox.val(), function(data) {
	if (data) {
	    $('#nickWrap').hide();
	    $('#contentWrap').show();
	} else {
	    $nickError.html('That username is already taken!  Try again.');
	}
    });
    myNick = $nickBox.val();
    $nickBox.val('');
});

socket.on('usernames', function(data) {
    var html = '';
    for (var i=0; i < data.length; i++) {
	if (myNick === data[i]) {
	    html += '<b>' + data[i] + '</b><br/>';
	} else {
	    html += data[i] + '<br/>';
	}
    }
    $users.html(html);
});

$messageForm.submit(function(e) {
    e.preventDefault();
    socket.emit('send message', $messageBox.val(), function(data) {
	$chat.append('<span class="error">' + data + "</span><br/>");
    });
    $messageBox.val('');
});

socket.on('load old msgs', function(docs) {
    for (var i=docs.length-1; i >= 0; i--) {
	displayOldMsg(docs[i]);
    }
});

socket.on('new message', function(data) {
    displayMsg(data);
    $chat.scrollTop($chat.prop('scrollHeight'));
});


socket.on('whisper', function(data) {
    $chat.append('<span class="whisper"><b>' + data.nick +
		 ': </b>' + data.msg + "</span><br/>");
});

function displayMsg(data) {
    var timestamp = data.created ? data.created + ": " : "";
    $chat.append('<span class="msg"><i>' + timestamp +
		 '</i><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
}

function displayOldMsg(data) {
    $chat.append('<span class="oldmsg"><i>' + data.created +
		 ': </i><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
}
