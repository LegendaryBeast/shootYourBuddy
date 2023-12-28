const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server, { pingInterval: 2000, pingTimeout: 600000 })
const port = 3005
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

app.get('/auth', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(imagekit.getAuthenticationParameters()));
})

var uniqueRoom = 1000 + Math.round(Math.random() * 1000);
var uniqueUserID = 0;

var timeLimit = 120 * 1000;

const serverSidePlayers = {}
const serverSideGulis = {}
const runningRooms = {}
const roomStartTime = {}
const roomInitTime = {}
const maxH = {}
const maxW = {}
const userMap = {}
const roomUserIDs = {}

const RADIUS = 30
const GuliId = {}

io.on('connection', (socket) => {

  console.log("new connection: ", socket.id);

  var room = 0;

  var toldToRequest = false;

  socket.on("requestRoomCode", ({ username, width, height, ratio, imageURL, userID }) => {
    uniqueRoom += Math.round(Math.random() * 100) + 1;
    room = String(uniqueRoom);
    socket.join(room);
    roomUserIDs[room] = {};
    roomUserIDs[room][userID] = true;
    userMap[userID] = socket.id;
    runningRooms[room] = 1;
    roomInitTime[room] = Date.now();
    serverSidePlayers[room] = {}
    maxW[room] = width / ratio;
    maxH[room] = height / ratio;
    serverSidePlayers[room][socket.id] = {
      x: width / ratio * Math.random(),
      y: height / ratio * Math.random(),
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username,
      imageURL
    }

    serverSidePlayers[room][socket.id].canvas = {
      width: width / ratio,
      height: height / ratio
    }

    serverSidePlayers[room][socket.id].radius = RADIUS
    socket.emit('recieveRoomCode', room);
    console.log("room created: ", room);
  })

  socket.on("startRoom", () => {
    if (room == 0) return;
    roomStartTime[room] = Date.now();
    io.to(room).emit('initGame');
    GuliId[room] = 0;
    serverSideGulis[room] = {}
  })

  socket.on("joinRoom", ({ roomName, username, width, height, ratio, imageURL, userID }) => {
    console.log("request to join: ", roomName);
    if (!runningRooms[roomName]) {
      socket.emit('invalidRoom');
      return;
    }

    socket.join(roomName);
    runningRooms[roomName]++;
    room = roomName;
    if (roomUserIDs[room]) roomUserIDs[room][userID] = true;
    userMap[userID] = socket.id;
    if (maxW[room]) maxW[room] = Math.max(maxW[room], width / ratio);
    if (maxH[room]) maxH[room] = Math.max(maxH[room], height / ratio);
    serverSidePlayers[room][socket.id] = {
      x: width / ratio * Math.random(),
      y: height / ratio * Math.random(),
      color: `hsl(${360 * Math.random()}, 100%, 50%)`,
      sequenceNumber: 0,
      score: 0,
      username,
      imageURL

    }

    serverSidePlayers[room][socket.id].canvas = {
      width: width / ratio,
      height: height / ratio
    }

    serverSidePlayers[room][socket.id].radius = RADIUS

    socket.emit('roomJoinSuccess');

    if (roomStartTime[room]) {
      socket.emit('initGame');
    }




  })

  socket.on("rejoinRoom", ({ roomName, userID, width, height, ratio }) => {
    console.log("request to rejoin: ", roomName);
    if (!runningRooms[roomName] || !userMap[userID]) {
      socket.emit('invalidRoom');
      return;
    }

    socket.join(roomName);
    room = roomName;
    var previousId = userMap[userID];
    userMap[userID] = socket.id;

    if (maxW[room]) maxW[room] = Math.max(maxW[room], width / ratio);
    if (maxH[room]) maxH[room] = Math.max(maxH[room], height / ratio);
    serverSidePlayers[room][socket.id] = serverSidePlayers[room][previousId];
    delete serverSidePlayers[room][previousId];
    serverSidePlayers[room][socket.id].canvas = {
      width: width / ratio,
      height: height / ratio
    }


    if (roomStartTime[room]) {
      socket.emit('initGame');
    }



  })






  socket.on('shoot', ({ x, y, angle }) => {
    if (room === 0 || !serverSideGulis[room]) return;

    GuliId[room]++;

    const velocity = {
      x: Math.cos(angle * Math.PI / 180) * 5,
      y: Math.sin(angle * Math.PI / 180) * 5
    }

    serverSideGulis[room][GuliId[room]] = {
      x,
      y,
      velocity,
      playerId: socket.id
    }



  })


  socket.on('changeFrame', ({ width, height, ratio }) => {
    if (room === 0 || !serverSidePlayers[room]) return;
    if (serverSidePlayers[room][socket.id]) {
      serverSidePlayers[room][socket.id].x = width / ratio * Math.random();
      serverSidePlayers[room][socket.id].y = height / ratio * Math.random();


      serverSidePlayers[room][socket.id].canvas = {
        width: width / ratio,
        height: height / ratio
      }
    }
    if (maxW[room]) maxW[room] = Math.max(maxW[room], width / ratio);
    if (maxH[room]) maxH[room] = Math.max(maxH[room], height / ratio);

  })

  socket.on("ping", ({ sendTimeID, roomCode, userID }) => {
    if (userID == -1) {
      uniqueUserID++;
      socket.emit("setUserID", uniqueUserID);
      userID = uniqueUserID;
    }
    socket.emit("pong", sendTimeID);
    if (roomCode != 0 && room == 0) {
      if (toldToRequest == false) { socket.emit("requestAgain"); toldToRequest = true; }
    }



  })


  socket.on('disconnect', (reason) => {
    console.log(socket.id, reason);
    room = 0;
  })

  socket.on('move', ({ angle, sequenceNumber }) => {
    if (room == 0 || !serverSidePlayers[room] || !serverSidePlayers[room][socket.id]) return
    const serverSidePlayer = serverSidePlayers[room][socket.id]


    serverSidePlayers[room][socket.id].sequenceNumber = sequenceNumber

    serverSidePlayers[room][socket.id].x += 1.5 * Math.cos(angle * Math.PI / 180);
    serverSidePlayers[room][socket.id].y += 1.5 * Math.sin(angle * Math.PI / 180);



    const playerSides = {
      left: serverSidePlayer.x - serverSidePlayer.radius,
      right: serverSidePlayer.x + serverSidePlayer.radius,
      top: serverSidePlayer.y - serverSidePlayer.radius,
      bottom: serverSidePlayer.y + serverSidePlayer.radius
    }

    if (playerSides.left < 0) serverSidePlayers[room][socket.id].x = serverSidePlayer.radius

    if (playerSides.right > serverSidePlayers[room][socket.id].canvas.width)
      serverSidePlayers[room][socket.id].x = serverSidePlayers[room][socket.id].canvas.width - serverSidePlayer.radius

    if (playerSides.top < 0) serverSidePlayers[room][socket.id].y = serverSidePlayer.radius

    if (playerSides.bottom > serverSidePlayers[room][socket.id].canvas.height)
      serverSidePlayers[room][socket.id].y = serverSidePlayers[room][socket.id].canvas.height - serverSidePlayer.radius
  })




})


setInterval(() => {

  for (const room in runningRooms) {

    if ((roomStartTime[room] && Date.now() - roomStartTime[room] - 1500 >= timeLimit) || (Date.now() - roomInitTime[room] >= 3600000 && !roomStartTime[room])) {
      io.to(room).emit('closeGame');
      delete serverSidePlayers[room];
      delete serverSideGulis[room];
      delete roomStartTime[room];
      delete runningRooms[room];
      delete maxW[room];
      delete maxH[room];
      delete roomInitTime[room];
      for (const userID in roomUserIDs[room]) {
        delete userMap[userID];
      }
      delete roomUserIDs[room];

    }


  }

  for (const room in runningRooms) {

    for (const id in serverSideGulis[room]) {
      serverSideGulis[room][id].x += serverSideGulis[room][id].velocity.x
      serverSideGulis[room][id].y += serverSideGulis[room][id].velocity.y

      const Guli_RADIUS = 5
      if (
        serverSideGulis[room][id].x - Guli_RADIUS >=
        maxW[room] ||
        serverSideGulis[room][id].x + Guli_RADIUS <= 0 ||
        serverSideGulis[room][id].y - Guli_RADIUS >=
        maxH[room] ||
        serverSideGulis[room][id].y + Guli_RADIUS <= 0
      ) {
        delete serverSideGulis[room][id]
        continue
      }

      for (const playerId in serverSidePlayers[room]) {
        const serverSidePlayer = serverSidePlayers[room][playerId]

        const DISTANCE = Math.hypot(
          serverSideGulis[room][id].x - serverSidePlayer.x,
          serverSideGulis[room][id].y - serverSidePlayer.y
        )


        // collision detection
        if (
          DISTANCE < Guli_RADIUS + serverSidePlayer.radius &&
          serverSideGulis[room][id].playerId !== playerId
        ) {
          if (serverSidePlayers[room][serverSideGulis[room][id].playerId])
            serverSidePlayers[room][serverSideGulis[room][id].playerId].score++

          delete serverSideGulis[room][id]
          break
        }
      }
    }

    io.to(room).emit('updateGulis', serverSideGulis[room])
    io.to(room).emit('updatePlayers', serverSidePlayers[room])
  }
}, 15)



setInterval(() => {

  for (const room in runningRooms) {
    if (!roomStartTime[room] || (Date.now() - roomStartTime[room] - 1500) >= timeLimit) {
      continue;
    }

    var elapsed = Date.now() - roomStartTime[room] - 1500;
    var rem = Math.max(timeLimit - elapsed, 0);

    var second = Math.floor(rem / 1000);
    var min = Math.floor(second / 60);
    second -= min * 60;


    io.to(room).emit('remainingTime', { min, second });

  }
}, 500)








server.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

console.log('server did load')


var ImageKit = require("imagekit");


var imagekit = new ImageKit({
  publicKey : "public_cLDZkbvBc5vSShaos83kdl6rLF4=",
  privateKey : "private_SUKYsLN9rLisa8RcG7Qg6keRQf8=",
  urlEndpoint : "https://ik.imagekit.io/shootyourbuddy/"
});
