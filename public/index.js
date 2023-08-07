const waterMapImage = new Image();
waterMapImage.src = "./assets/Water.png";

const grassMapImage = new Image();
grassMapImage.src = "./assets/Grass.png";

const bridgeMapImage = new Image();
bridgeMapImage.src = "./assets/Wood Bridge.png";

const walkSnow = new Audio("./assets/walk-snow.mp3");

// const mapImage = new Image();
// mapImage.src = "./assets/snowy-sheet.png";

const farmerImage = new Image();
farmerImage.src = "./assets/charac_01.png";

const speakerImage = new Image();
speakerImage.src = "./assets/speaker.png";

const canvasEl = document.getElementById('canvas');
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;

const canvas = canvasEl.getContext("2d");


const socket = io(`ws://localhost:9400`);

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const localTracks = {
  audioTrack: null,
};

let isPlaying = true;

const remoteUsers = {};
window.remoteUsers = remoteUsers;

const muteButton = document.getElementById("mute");
const uid = Math.floor(Math.random() * 1000000);

muteButton.addEventListener("click", () => {
  if (isPlaying) {
    localTracks.audioTrack.setEnabled(false);
    muteButton.innerText = "unmute";
    socket.emit("mute", true);
  } else {
    localTracks.audioTrack.setEnabled(true);
    muteButton.innerText = "mute";
    socket.emit("mute", false);
  }
  isPlaying = !isPlaying;
});

const options = {
  appid: "efc1e45b55a24025a5547e1d541ae551",
  channel: "game",
  uid,
  token: null,
};

async function subscribe(user, mediaType) {
  await client.subscribe(user, mediaType);
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  delete remoteUsers[id];
}

async function join() {
  socket.emit("voiceId", uid);

  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  await client.join(options.appid, options.channel, options.token || null, uid);
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

  await client.publish(Object.values(localTracks));
}

join();

let groundMap = [[]];
let waterMap = [[]];
let bridgeMap = [[]];
let players = [];
let snowballs = [];

const TILE_SIZE = 16;
// const TILE_SIZE = 32;
const SHOWBALL_RADIUS = 2;

socket.on("connect", () => {

});

socket.on("map", (loadedMap) => {
  waterMap = loadedMap.water;
  groundMap = loadedMap.ground;
  bridgeMap = loadedMap.bridge;
});

socket.on("players", (serverPlayers) => {
  players = serverPlayers;
});

socket.on("snowballs", (serverSnowballs) => {
  snowballs = serverSnowballs;
});

const inputs = {
  up: false,
  down: false,
  left: false,
  right: false
};

window.addEventListener('keydown', (event) => {
  if(event.key === "w") {
    inputs["up"] = true;
  } else if(event.key === "s") {
    inputs["down"] = true;
  } else if(event.key === "d") {
    inputs["right"] = true;
  } else if(event.key === "a") {
    inputs["left"] = true;
  }
  if (['a', 's', 'w', 'd'].includes(event.key) && walkSnow.paused) {
    // walkSnow.play();
  }
  socket.emit('inputs', inputs);
})

window.addEventListener('keyup', (event) => {
  if(event.key === "w") {
    inputs["up"] = false;
  } else if(event.key === "s") {
    inputs["down"] = false;
  } else if(event.key === "d") {
    inputs["right"] = false;
  } else if(event.key === "a") {
    inputs["left"] = false;
  }
  if (['a', 's', 'w', 'd'].includes(event.key)) {
    walkSnow.pause();
    walkSnow.currentTime = 0;
  }
  socket.emit('inputs', inputs);
})

window.addEventListener('click', (event) => {
  const angle = Math.atan2(event.clientY - canvasEl.height / 2, event.clientX- canvasEl.width / 2)
  socket.emit("snowball", angle)
})

function loop() {
  canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const myPlayer = players.find((player) => player.id === socket.id);
  let cameraX = 0;
  let cameraY = 0;
  if (myPlayer) {
    cameraX = parseInt(myPlayer.x - canvasEl.width / 2);
    cameraY = parseInt(myPlayer.y - canvasEl.height / 2);
  }

  for (let row = 0; row < waterMap.length; row++) {
    for (let col = 0; col < waterMap[0].length; col++) {
      let { id } = waterMap[row][col];
      const imageRow = parseInt(id / 4);
      const imageCol = id % 1;
      // const imageRow = parseInt(id / 8);
      // const imageCol = id % 8;

      canvas.drawImage(
        waterMapImage,
        // mapImage,
        imageCol * TILE_SIZE,
        imageRow * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        col * TILE_SIZE - cameraX,
        row * TILE_SIZE - cameraY,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  for (let row = 0; row < groundMap.length; row++) {
    for (let col = 0; col < groundMap[0].length; col++) {
      let { id } = groundMap[row][col] ?? { id: undefined };
      const imageRow = parseInt(id / 10);
      const imageCol = id % 8;
      // const imageRow = parseInt(id / 8);
      // const imageCol = id % 8;
      canvas.drawImage(
        grassMapImage,
        // mapImage,
        imageCol * TILE_SIZE,
        imageRow * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        col * TILE_SIZE - cameraX,
        row * TILE_SIZE - cameraY,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  for (let row = 0; row < bridgeMap.length; row++) {
    for (let col = 0; col < bridgeMap[0].length; col++) {
      let { id } = bridgeMap[row][col] ?? { id: undefined };
      const imageRow = parseInt(id / 5);
      const imageCol = id % 3;
      // const imageRow = parseInt(id / 24);
      // const imageCol = id % 24;
      canvas.drawImage(
        bridgeMapImage,
        // mapImage,
        imageCol * TILE_SIZE,
        imageRow * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
        col * TILE_SIZE - cameraX,
        row * TILE_SIZE - cameraY,
        TILE_SIZE,
        TILE_SIZE
      );
    }
  }

  for(const player of players) {
    canvas.drawImage(farmerImage, player.x - cameraX, player.y - cameraY);
    if (!player.isMuted) {
      canvas.drawImage(speakerImage, player.x - cameraX + 5, player.y - cameraY - 28);
    }

    if (player !== myPlayer) {
      if (
        remoteUsers[player.voiceId] &&
        remoteUsers[player.voiceId].audioTrack
      ) {
        const distance = Math.sqrt(
          (player.x - myPlayer.x) ** 2 + (player.y - myPlayer.y) ** 2
        );
        const ratio = 1.0 - Math.min(distance / 700, 1);
        remoteUsers[player.voiceId].audioTrack.setVolume(
          Math.floor(ratio * 100)
        );
      }
    }
  }

  for(const snowball of snowballs) {
    canvas.fillStyle = "#FFFFFF";
    canvas.beginPath();
    canvas.arc(snowball.x - cameraX, snowball.y - cameraY, SHOWBALL_RADIUS, 0, 2 * Math.PI);
    canvas.fill();
  }

  window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);