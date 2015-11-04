
var socket = io.connect();
var $nickForm = $('#setNick');
var $nickError = $('#nickError');
var $nickBox = $('#nickname');
var $users = $('#users');
var $messageForm = $('#send-message');
var $messageBox = $('#message');
var $chat = $('#chat');
var myNick;
var updateTitleNotifier = false;

$nickForm.submit(function(e) {
    e.preventDefault();
    socket.emit('new user', $nickBox.val(), function(data) {
	if (data) {
	    $('#nickWrap').hide();
	    $('#contentWrap').show();
	} else {
	    $nickError.html('Username already taken or invalid!  Try again.');
	    $nickError.show();
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
    if (updateTitleNotifier) {
	titlenotifier.add();
    }
    $chat.scrollTop($chat.prop('scrollHeight'));
});


socket.on('whisper', function(data) {
    $chat.append('<span class="whisper"><b>' + data.nick +
		 ': </b>' + data.msg + "</span><br/>");
});


$(window).on("blur focus", function(e) {
    var prevType = $(this).data("prevType");

    if (prevType != e.type) {   //  reduce double fire issues
        switch (e.type) {
        case "blur":
            // do work
	    updateTitleNotifier = true;
            break;
        case "focus":
	    updateTitleNotifier = false;
            titlenotifier.reset();
            break;
        }
    }
    $(this).data("prevType", e.type);
});

function displayMsg(data) {
    var ts = new Date(data.created);
    $chat.append('<span class="msg"><i>' + ts.toLocaleTimeString() + ": " +
		 '</i><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
}

function displayOldMsg(data) {
    var ts = new Date(data.created);
    $chat.append('<span class="oldmsg"><i>' + ts.toLocaleDateString() + " " +
		 ts.toLocaleTimeString() + ": " +
		 ': </i><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
}
