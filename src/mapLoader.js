const tmx = require('tmx-parser');

async function loadMap() {
  const map = await new Promise((resolve, reject) => {
    tmx.parseFile('./src/were_map.tmx', function(err, loadedMap) {
      if (err) return reject(err);
      resolve(loadedMap);
    });
  })

  const layer = map.layers[0];
  const waterTiles = layer.tiles;
  const groundTiles = map.layers[1].tiles;
  const bridgeTiles = map.layers[2].tiles;
  const water2D = [];
  const ground2D = [];
  const bridge2D = [];


  for (let row = 0; row < map.height; row++) {
    const groundRow = [];
    const waterRow = [];
    const bridgeRow = [];
    for (let col = 0; col < map.width; col++) {
      const waterTile = waterTiles[row * map.height + col];
      waterRow.push({ id: waterTile.id, gid: waterTile.gid });

      const groundTile = groundTiles[row * map.height + col];
      if (groundTile) {
        groundRow.push({ id: groundTile.id, gid: groundTile.gid });
      } else {
        groundRow.push(undefined);
      }

      const bridgeTile = bridgeTiles[row * map.height + col];
      if (bridgeTile) {
        bridgeRow.push({ id: bridgeTile.id, gid: bridgeTile.gid });
      } else {
        bridgeRow.push(undefined);
      }
    }

    water2D.push(waterRow);
    ground2D.push(groundRow);
    bridge2D.push(bridgeRow);
  }

  return {
    ground2D,
    water2D,
    bridge2D
  };
}

module.exports = loadMap;
