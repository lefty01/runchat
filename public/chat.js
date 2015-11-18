
var socket = io.connect();
var $nickForm = $('#setNick');
var $nickError = $('#nickError');
var $nickBox = $('#nickname');
var $users = $('#users');
var $messageForm = $('#send-message');
var $messageBox = $('#message');
var $chat = $('#chat');
var myNick;// = "mr. X"; // get prev nick from cookie?
var updateTitleNotifier = false;

var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

$nickForm.submit(function(e) {
    e.preventDefault();

    if (! socket.connected) {
	alert("Lost connection to chat server! Try again later.");
    }

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
	var nick = data[i];
	//  .css('color', getUsernameColor(data[i]));
	if (myNick === data[i]) {
	    html += '<b>' + nick + '</b><br/>';
	} else {
	    html += nick + '<br/>';
	}
    }
    $users.html(html);
});

$messageForm.submit(function(e) {
    e.preventDefault();

    if (! socket.connected) {
	alert("Lost connection to chat server! Try again later.");
    }

    socket.emit('send message', $messageBox.val(), function(data) {
	$chat.append('<span class="error">' + data + "</span><br/>");
	$chat.scrollTop($chat.prop('scrollHeight'));
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


// Gets the color of a username through our hash function
function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
	hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
}

function displayMsg(data) {
    var ts = new Date(data.created); // only display time string (w/o date)
    $chat.append('<span class="msg"><i>' + ts.toLocaleTimeString() + ": " +
		 '</i><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
}

function displayOldMsg(data) {
    var ts = new Date(data.created);
    $chat.append('<span class="oldmsg"><i>' + ts.toLocaleDateString() + " " +
		 ts.toLocaleTimeString() + ": " +
		 ': </i><b>' + data.nick + ': </b>' + data.msg + "</span><br/>");
}
