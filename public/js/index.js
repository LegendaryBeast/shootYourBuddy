const canvas = document.querySelector('#playground')
const c = canvas.getContext('2d')
var roomCode = 0;
var gameRunning = false;
var gameClosed = false;
var userID = -1;

const socket = io()

var devicePixelRatio = window.devicePixelRatio || 1
canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio * 0.65

c.scale(devicePixelRatio, devicePixelRatio)

const clientSidePlayers = {}
const clientSideGulis = {}

//recieve updated data about gulis from server, check if they existed in this sides, make update in array
//render the gulis in canvas

//recieve updated data about players from server, check if they existed in this sides, make update in array
//sort them according to scores, place them in leaderboard and #whoJoined Div
//render the players



socket.on('closeGame', () => {

  document.getElementById('playerLabels2').innerHTML = document.getElementById('playerLabels').innerHTML;
  gameRunning = false;
  gameClosed = true;
  document.querySelector('#gameScreen').style.display = 'block';
  document.querySelector('#rotate').style.display = 'none';
  document.querySelector('#latencyDiv').style.display = 'none';
  $('#gameScreen').slideToggle(100, "swing");
  $('#endScreen').slideToggle(100, "swing");

  sleep(500).then(() => {
    gameRunning = false;
    document.querySelector('#endScreenDiv').style.zIndex = 10;
    document.querySelector('#endScreenDiv').style.display = 'flex';
    document.querySelector('#userDiv').style.display = 'none';
    document.querySelector('#gameScreen').style.display = 'none';
    document.querySelector('#endScreen').style.display = 'flex';;
  })

})

function animate() {
  let animationId = requestAnimationFrame(animate)
  c.clearRect(0, 0, canvas.width, canvas.height)

  for (const id in clientSidePlayers) {
    const clientSidePlayer = clientSidePlayers[id]

    if (clientSidePlayer.target) {
      clientSidePlayers[id].x +=
        (clientSidePlayers[id].target.x - clientSidePlayers[id].x) * 0.5
      clientSidePlayers[id].y +=
        (clientSidePlayers[id].target.y - clientSidePlayers[id].y) * 0.5
    }

    clientSidePlayer.draw()
  }

  for (const id in clientSideGulis) {
    const clientSideGuli = clientSideGulis[id]
    clientSideGuli.draw()
  }

}

animate()

const joystickData = {
  movement: {
    angle: 0,
    moving: false
  },
  shoot: {
    angle: 0,
    moving: false
  }
}

const SPEED = 1.5
const playerInputs = []
let sequenceNumber = 0
setInterval(() => {

  if (joystickData.movement.moving === true) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: SPEED * Math.cos(joystickData.movement.angle * Math.PI / 180), dy: SPEED * Math.sin(joystickData.movement.angle * Math.PI / 180) })
    socket.emit('move', { angle: joystickData.movement.angle, sequenceNumber })
  }

}, 15)

setInterval(
  () => {
    if (joystickData.shoot.moving === true) {
      socket.emit('shoot', {
        x: clientSidePlayers[socket.id].x,
        y: clientSidePlayers[socket.id].y,
        angle: joystickData.shoot.angle
      })
    }

  }, 200
)

var sendTime; var sendTimeID = 0;
var pongRecieved = false;
setInterval(() => {
  if (gameClosed == false) {
    if (pongRecieved == false) {
      document.querySelector("#latency").innerHTML = "Disconnected!";
    }
    pongRecieved = false;
    sendTime = Date.now();
    sendTimeID++;
    socket.emit("ping", { sendTimeID, roomCode, userID });
  }
}, 500);

socket.on("pong", (responseID) => {
  if (responseID != sendTimeID) {
    return;
  }
  pongRecieved = true;
  var delay = Date.now() - sendTime;
  document.querySelector("#latency").innerHTML = "Latency: " + delay + "ms";
})

socket.on("setUserID", (id) => {
  userID = id;
})

window.addEventListener("resize", () => {
  var devicePixelRatio = window.devicePixelRatio || 1
  canvas.width = innerWidth * devicePixelRatio
  canvas.height = innerHeight * devicePixelRatio * 0.65
  c.scale(devicePixelRatio, devicePixelRatio)
  if (gameRunning === true) {

    if (innerWidth < innerHeight) {
      document.querySelector('#gameScreen').style.display = 'none';
      document.querySelector('#rotate').style.display = 'flex';
      document.querySelector('#latencyDiv').style.display = 'none';

    }
    else {
      document.querySelector('#gameScreen').style.display = 'block';
      document.querySelector('#rotate').style.display = 'none';
      document.querySelector('#latencyDiv').style.display = 'block';
    }
  }
  socket.emit('changeFrame', {
    width: canvas.width,
    height: canvas.height,
    ratio: devicePixelRatio,
  })

  resize();

});

window.addEventListener("load", resize);

function resize() {
  document.body.style.zoom = 1.0;
  document.body.style.transform = 'scale(1.0)';
  document.body.style['-o-transform'] = 'scale(1.0)';
  document.body.style['-webkit-transform'] = 'scale(1.0)';
  document.body.style['-moz-transform'] = 'scale(1.0)';

  var ratio = innerWidth / innerHeight;
  if (ratio > 1.5) {
    document.getElementById('usernameForm').style.transform = 'scale(0.5)';
    document.getElementById('enterRoomCode').style.transform = 'scale(1)';
    document.getElementById('waitingScreenCreate').style.transform = 'scale(0.75)';
    document.getElementById('latency').style.fontSize = 'medium';
  }
  else {
    document.getElementById('usernameForm').style.transform = 'scale(1)';
    document.getElementById('enterRoomCode').style.transform = 'scale(2)';
    document.getElementById('waitingScreenCreate').style.transform = 'scale(1.2)';
    document.getElementById('latency').style.fontSize = 'x-large';
  }
}

function handleFileSelect(evt) {
  let files = evt.target.files;

  let f = files[0];

  let reader = new FileReader();

  reader.onload = (function (theFile) {
    return function (e) {
      document.getElementById("avatarImage").src = e.target.result;
    };
  })(f);

  reader.readAsDataURL(f);
}

document.getElementById('file-input').addEventListener('change', handleFileSelect, false);

document.getElementById('createButton').addEventListener('click', () => {

  var v = document.querySelector('#usernameInput').value;
  if (v === "") {
    alert("Oops! Username is empty.");
    return;
  }

  $('#waitingScreenCreate').slideToggle(900, "swing");

  $('#usernameForm').slideToggle(900, "swing");
  sleep(2000).then(() => {
    document.querySelector('#waitingScreenCreate').style.display = 'block';
    document.querySelector('#usernameForm').style.display = 'none';
  })

  socket.emit('requestRoomCode', {
    width: canvas.width,
    height: canvas.height,
    ratio: devicePixelRatio,
    username: document.querySelector('#usernameInput').value,
    imageURL: "",
    userID: userID
  })

});

socket.on('recieveRoomCode', (code) => {
  roomCode = code;
  $('#roomCode').text(`Room Code: ${roomCode}`);

})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById('startButton').addEventListener('click', () => {
  if (roomCode == 0) return;

  socket.emit('startRoom');

})

function initFromStart() {
  sleep(1000).then(() => {
    show();
    gameRunning = true;
    if (innerWidth < innerHeight) {
      document.querySelector('#gameScreen').style.display = 'none';
      document.querySelector('#rotate').style.display = 'flex';
      document.querySelector('#latencyDiv').style.display = 'none';
    }
    else {
      document.querySelector('#gameScreen').style.display = 'block';
      document.querySelector('#rotate').style.display = 'none';
      document.querySelector('#latencyDiv').style.display = 'block';
    }
    $('#userDiv').slideToggle(300, "linear");
    sleep(1000).then(() => {
      document.querySelector('#userDiv').style.display = 'none';

    })

  });
}

socket.on('initGame', () => {
  if (gameRunning == false) initFromStart();
})

socket.on('remainingTime', ({ min, second }) => {
  min = (min < 10 ? "0" + String(min) : String(min));
  second = (second < 10 ? "0" + String(second) : String(second));
  timeString = min + ":" + second;
  document.querySelector('#time').innerHTML = timeString;
  if (min == 0 && second < 10) {
    if (document.querySelector('#time').style.color != 'rgb(255, 49, 49)') {
      document.querySelector('#time').style.color = 'rgb(255, 49, 49)';
    }
    else {
      document.querySelector('#time').style.color = 'white';
    }
  }

})

document.getElementById('joinButton').addEventListener('click', () => {

  var v = document.querySelector('#usernameInput').value;
  if (v === "") {
    alert("Oops! Username is empty.");
    return;
  }

  $('#enterRoomCode').slideToggle(900, "swing");

  $('#usernameForm').slideToggle(900, "swing");
  sleep(2000).then(() => {
    document.querySelector('#enterRoomCode').style.display = 'block';
    document.querySelector('#usernameForm').style.display = 'none';
  })

});

document.getElementById('roomCodeButton').addEventListener('click', () => {

  var v = document.querySelector('#roomCodeInput').value;
  if (v === "") {
    alert("Oops! Room Code is empty.");
    return;
  }

  socket.emit('joinRoom', {
    roomName: v,
    width: canvas.width,
    height: canvas.height,
    ratio: devicePixelRatio,
    username: document.querySelector('#usernameInput').value,
    imageURL: "",
    userID: userID
  })

});

socket.on('roomJoinSuccess', () => {

  document.querySelector('#waitTitle').innerHTML = "Waiting for your buddy to start the game!";
  document.querySelector('#startButton').style.display = 'none';
  roomCode = document.querySelector('#roomCodeInput').value;
  $('#roomCode').text(`Room Code: ${roomCode}`);

  $('#waitingScreenCreate').slideToggle(900, "swing");

  $('#enterRoomCode').slideToggle(900, "swing");
  sleep(2000).then(() => {
    document.querySelector('#waitingScreenCreate').style.display = 'block';
    document.querySelector('#enterRoomCode').style.display = 'none';
  })

})

socket.on('invalidRoom', () => {

  if (roomCode == 0) { alert("Invalid Room Code! No such rooms running."); }
  else if (gameClosed == false) { alert("Your room was expired!"); gameClosed = true; }
})

socket.on("requestAgain", () => {
  socket.emit('rejoinRoom', {
    roomName: roomCode,
    userID: userID,
    width: canvas.width,
    height: canvas.height,
    ratio: devicePixelRatio

  });
})