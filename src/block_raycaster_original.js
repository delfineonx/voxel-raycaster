// Copyright (c) 2025 delfineonx
// This product includes "Block Raycaster" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

{
  const _BR = {
    default: null,
    cast: null,
    convertDirection: null,
    offsetPosition: null,
    maxDistancePosition: null,
  };

  // shared direction registers
  // 1: [dirX, dirY, dirZ]
  // 2: [yawRad, pitchRad, undefined]
  // 3: [yawDeg, pitchDeg, undefined]
  let _dirX = null;
  let _dirY = null;
  let _dirZ = null;

  const INFINITY = 1e9;

  const PI = 3.141592653589793;            // pi
  const TWO_PI = 6.283185307179586;        // 2*pi
  const DEG_TO_RAD = 0.017453292519943295; // pi/180
  const RAD_TO_DEG = 57.29577951308232;    // 180/pi

  const _default = _BR.default = {
    directionType: 1,
    maxDistance: 6,
    startOffset: 0,
    cellSize: 1,
  };

  const _Converter = {
    // [dirX, dirY, dirZ] -> normalized (unit vector)
    get 11() {
      // NOTE: assumes non-zero vector
      const inverseVecNorm = 1 / Math.sqrt(_dirX * _dirX + _dirY * _dirY + _dirZ * _dirZ); // 1 / sqrt(vecNormSquared)
      _dirX *= inverseVecNorm;
      _dirY *= inverseVecNorm;
      _dirZ *= inverseVecNorm;
    },

    // [dirX, dirY, dirZ] -> [yawRad, pitchRad]
    get 12() {
      // pitchRad = atan2(dirY, horizontalNorm)
      _dirY = Math.atan2(_dirY, Math.sqrt(_dirX * _dirX + _dirZ * _dirZ));
      // yawRad = atan2(-dirX, -dirZ)
      _dirX = Math.atan2(-_dirX, -_dirZ);
    },

    // [dirX, dirY, dirZ] -> [yawDeg, pitchDeg]
    get 13() {
      // pitchDeg = pitchRad * RAD_TO_DEG
      _dirY = Math.atan2(_dirY, Math.sqrt(_dirX * _dirX + _dirZ * _dirZ)) * RAD_TO_DEG;
      // yawDeg = yawRad * RAD_TO_DEG
      _dirX = Math.atan2(-_dirX, -_dirZ) * RAD_TO_DEG;
    },

    // [yawRad, pitchRad] -> [dirX, dirY, dirZ]
    get 21() {
      // yawRad to [-pi, +pi)
      _dirX = (_dirX + PI) % TWO_PI;
      if (_dirX < 0) { _dirX += TWO_PI; }
      _dirX = _dirX - PI;
      const cosYaw   = Math.cos(_dirX);
      const cosPitch = Math.cos(_dirY);
      // direction = (-cosPitch * sinYaw, sinPitch, -cosPitch * cosYaw)
      _dirX = -cosPitch * Math.sin(_dirX);
      _dirY =  Math.sin(_dirY);
      _dirZ = -cosPitch * cosYaw;
    },

    // [yawRad, pitchRad] -> normalized
    get 22() {
      // yawRad to [-pi, +pi)
      _dirX = (_dirX + PI) % TWO_PI;      // (-2*pi, 2*pi)
      if (_dirX < 0) { _dirX += TWO_PI; } // [0, 2*pi)
      _dirX = _dirX - PI;                 // [-pi, pi)
    },

    // [yawRad, pitchRad] -> [yawDeg, pitchDeg]
    get 23() {
      // yawRad to [-pi, +pi)
      _dirX = (_dirX + PI) % TWO_PI;
      if (_dirX < 0) { _dirX += TWO_PI; }
      _dirX = _dirX - PI;
      _dirX *= RAD_TO_DEG;
      _dirY *= RAD_TO_DEG;
    },

    // [yawDeg, pitchDeg] -> [dirX, dirY, dirZ]
    get 31() {
      // yawDeg to [-180, +180)
      _dirX = (_dirX + 180) % 360;
      if (_dirX < 0) { _dirX += 360; }
      _dirX -= 180;
      _dirX *= DEG_TO_RAD;
      _dirY *= DEG_TO_RAD;
      const cosYaw   = Math.cos(_dirX);
      const cosPitch = Math.cos(_dirY);
      // direction = (-cosPitch * sinYaw, sinPitch, -cosPitch * cosYaw)
      _dirX = -cosPitch * Math.sin(_dirX);
      _dirY =  Math.sin(_dirY);
      _dirZ = -cosPitch * cosYaw;
    },

    // [yawDeg, pitchDeg] -> [yawRad, pitchRad]
    get 32() {
      // yawDeg to [-180, +180)
      _dirX = (_dirX + 180) % 360;
      if (_dirX < 0) { _dirX += 360; }
      _dirX -= 180;
      _dirX *= DEG_TO_RAD;
      _dirY *= DEG_TO_RAD;
    },

    // [yawDeg, pitchDeg] -> normalized
    get 33() {
      // yawDeg to [-180, +180)
      _dirX = (_dirX + 180) % 360;     // (-360, 360)
      if (_dirX < 0) { _dirX += 360; } // [0, 360)
      _dirX -= 180;                    // [-180, 180)
    },
  };

  _BR.cast = (startPosition, direction, directionType, maxDistance, startOffset, cellSize) => {
    // resolve arguments (defaults)
    let fromDirType = directionType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    let maxDist = maxDistance;
    if (!(maxDist > 0)) {
      maxDist = _default.maxDistance;
    }
    let offsetDistance = startOffset; // distance (or time) along ray from startPosition
    if ((offsetDistance === undefined) | (offsetDistance === null)) {
      offsetDistance = _default.startOffset;
    }
    let cell = cellSize;
    if (!(cell > 0)) {
      cell = _default.cellSize;
    }

    // load into shared registers
    _dirX = direction[0];
    _dirY = direction[1];
    _dirZ = direction[2];

    // convert input direction
    _Converter[fromDirType + "1"];

    // local copies of shared registers (normalized direction vector)
    const dirX = _dirX;
    const dirY = _dirY;
    const dirZ = _dirZ;

    // starting point on ray (offset included)
    const startX = startPosition[0] + dirX * offsetDistance;
    const startY = startPosition[1] + dirY * offsetDistance;
    const startZ = startPosition[2] + dirZ * offsetDistance;

    // step directions per axis
    const stepXSign = (dirX > 0) - (dirX < 0);
    const stepYSign = (dirY > 0) - (dirY < 0);
    const stepZSign = (dirZ > 0) - (dirZ < 0);

    const absDirX = dirX * stepXSign;
    const absDirY = dirY * stepYSign;
    const absDirZ = dirZ * stepZSign;

    // time to cross one voxel along each axis (in ray-distance units)
    const timeStrideX = cell / (absDirX + (absDirX === 0));
    const timeStrideY = cell / (absDirY + (absDirY === 0));
    const timeStrideZ = cell / (absDirZ + (absDirZ === 0));

    // starting voxel indexes
    let voxelX = startX / cell;
    voxelX = (voxelX | 0) - (voxelX < (voxelX | 0)); // Math.floor(voxelX)
    let voxelY = startY / cell;
    voxelY = (voxelY | 0) - (voxelY < (voxelY | 0)); // Math.floor(voxelY)
    let voxelZ = startZ / cell;
    voxelZ = (voxelZ | 0) - (voxelZ < (voxelZ | 0)); // Math.floor(voxelZ)

    // initial time to hit first voxel boundary on each axis
    let timeNextX = INFINITY;
    if (absDirX !== 0) {
      timeNextX = ((voxelX + ((stepXSign + 1) >> 1)) * cell - startX) / dirX;
    }
    let timeNextY = INFINITY;
    if (absDirY !== 0) {
      timeNextY = ((voxelY + ((stepYSign + 1) >> 1)) * cell - startY) / dirY;
    }
    let timeNextZ = INFINITY;
    if (absDirZ !== 0) {
      timeNextZ = ((voxelZ + ((stepZSign + 1) >> 1)) * cell - startZ) / dirZ;
    }

    // tiny epsilon to avoid exact-zero comparisons
    const timeEpsilon = cell * 1e-9;
    if (timeNextX === 0) { timeNextX += timeEpsilon; }
    if (timeNextY === 0) { timeNextY += timeEpsilon; }
    if (timeNextZ === 0) { timeNextZ += timeEpsilon; }

    const maxTime = maxDist + timeEpsilon;
    
    let stepCount = 0;
    let pickX, pickY, pickZ, timeHit, blockId, inRange;

    do {
      stepCount++;

      // choose axis with smallest next hit time
      pickX = (timeNextX < timeNextY) & (timeNextX < timeNextZ);
      pickY = (timeNextY <= timeNextZ) & (1 - pickX);
      pickZ = 1 - pickX - pickY;

      // distance along ray where this voxel boundary is hit
      timeHit = timeNextX * pickX + timeNextY * pickY + timeNextZ * pickZ;

      // step voxel coordinate along selected axis
      voxelX += stepXSign * pickX;
      voxelY += stepYSign * pickY;
      voxelZ += stepZSign * pickZ;

      // advance only along chosen axis
      timeNextX += timeStrideX * pickX;
      timeNextY += timeStrideY * pickY;
      timeNextZ += timeStrideZ * pickZ;

      blockId = api.getBlockId(voxelX, voxelY, voxelZ);
      inRange = (timeHit <= maxTime);
    } while (!blockId & inRange);

    const normalX = -stepXSign * pickX;
    const normalY = -stepYSign * pickY;
    const normalZ = -stepZSign * pickZ;

    return {
      blockId: blockId,
      position: [voxelX, voxelY, voxelZ],
      normal: [normalX, normalY, normalZ],
      adjacent: [voxelX + normalX, voxelY + normalY, voxelZ + normalZ],
      point: [startX + dirX * timeHit, startY + dirY * timeHit, startZ + dirZ * timeHit],
      distance: timeHit + offsetDistance, // distance from original startPosition
      offset: timeHit, // distance from offset position
      steps: stepCount,
      inRange: inRange,
    };
  };

  _BR.offsetPosition = (startPosition, direction, directionType, startOffset) => {
    let fromDirType = directionType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    let offsetDistance = startOffset;
    if ((offsetDistance === undefined) | (offsetDistance === null)) {
      offsetDistance = _default.startOffset;
    }

    _dirX = direction[0];
    _dirY = direction[1];
    _dirZ = direction[2];

    _Converter[fromDirType + "1"];

    return [
      startPosition[0] + _dirX * offsetDistance,
      startPosition[1] + _dirY * offsetDistance,
      startPosition[2] + _dirZ * offsetDistance,
    ];
  };

  _BR.maxDistancePosition = (startPosition, direction, directionType, maxDistance, startOffset) => {
    let fromDirType = directionType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    let maxDist = maxDistance;
    if (!(maxDist > 0)) {
      maxDist = _default.maxDistance;
    }
    let offsetDistance = startOffset;
    if ((offsetDistance === undefined) | (offsetDistance === null)) {
      offsetDistance = _default.startOffset;
    }

    _dirX = direction[0];
    _dirY = direction[1];
    _dirZ = direction[2];

    _Converter[fromDirType + "1"];

    const maxTime = maxDist + offsetDistance;

    return [
      startPosition[0] + _dirX * maxTime,
      startPosition[1] + _dirY * maxTime,
      startPosition[2] + _dirZ * maxTime,
    ];
  };

  _BR.convertDirection = (direction, fromType, toType) => {
    let fromDirType = fromType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    let toDirType = toType | 0;
    if ((toDirType < 1) | (toDirType > 3)) {
      toDirType = _default.directionType;
    }

    _dirX = direction[0];
    _dirY = direction[1];
    _dirZ = direction[2];

    _Converter["" + fromDirType + toDirType];

    if (toDirType === 1) {
      return [_dirX, _dirY, _dirZ];
    } else {
      // [yawRad, pitchRad] or [yawDeg, pitchDeg]
      return [_dirX, _dirY];
    }
  };

  Object.seal(_BR);
  globalThis.BR = _BR;

  void 0;
}

