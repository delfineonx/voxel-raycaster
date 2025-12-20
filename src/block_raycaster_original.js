// Copyright (c) 2025 delfineonx
// This product includes "Block Raycaster" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

{
  const _BR = {
    default: {
      directionType: 1,
      maxDistance: 6,
      startOffset: 0,
      cellSize: 1,

      normalType: 1,
      width: 1,
      height: 1,
      rotation: 0, // radians in [-pi, pi)
      rotationType: 2,
    },
    cast: null,
    convertDirection: null,
    offsetPosition: null,
    maxDistancePosition: null,
    intersect: null,
    makeRectangle: null,
  };

  const _default = _BR.default;

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
    let offsetDist = startOffset; // distance (or time) along ray from startPosition
    if (offsetDist == null) {
      offsetDist = _default.startOffset;
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

    // local copies of shared registers
    const dirX = _dirX;
    const dirY = _dirY;
    const dirZ = _dirZ;

    // ray starting point (offset included)
    const startX = startPosition[0] + dirX * offsetDist;
    const startY = startPosition[1] + dirY * offsetDist;
    const startZ = startPosition[2] + dirZ * offsetDist;

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
      distance: timeHit + offsetDist, // from original startPosition
      offset: timeHit, // from offset position
      steps: stepCount,
      inRange: inRange,
    };
  };

  _BR.offsetPosition = (startPosition, direction, directionType, startOffset) => {
    let fromDirType = directionType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    let offsetDist = startOffset;
    if (offsetDist == null) {
      offsetDist = _default.startOffset;
    }

    _dirX = direction[0];
    _dirY = direction[1];
    _dirZ = direction[2];

    _Converter[fromDirType + "1"];

    return [
      startPosition[0] + _dirX * offsetDist,
      startPosition[1] + _dirY * offsetDist,
      startPosition[2] + _dirZ * offsetDist,
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
    let offsetDist = startOffset;
    if (offsetDist == null) {
      offsetDist = _default.startOffset;
    }

    _dirX = direction[0];
    _dirY = direction[1];
    _dirZ = direction[2];

    _Converter[fromDirType + "1"];

    const maxTime = maxDist + offsetDist;

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

  _BR.intersect = (startPosition, targetRectangle, direction, directionType, maxDistance, startOffset) => {
    // resolve arguments (defaults)
    let fromDirType = directionType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    let maxDist = maxDistance;
    if (!(maxDist > 0)) {
      maxDist = _default.maxDistance;
    }
    let offsetDist = startOffset;
    if (offsetDist == null) {
      offsetDist = _default.startOffset;
    }

    // load into shared registers
    _dirX = direction[0];
    _dirY = direction[1];
    _dirZ = direction[2];

    // convert input direction
    _Converter[fromDirType + "1"];

    // local copies of shared registers
    const dirX = _dirX;
    const dirY = _dirY;
    const dirZ = _dirZ;

    // ray starting point (offset included)
    const startX = startPosition[0] + dirX * offsetDist;
    const startY = startPosition[1] + dirY * offsetDist;
    const startZ = startPosition[2] + dirZ * offsetDist;

    // partially unpack rectangle 
    const originX = targetRectangle[0];
    const originY = targetRectangle[1];
    const originZ = targetRectangle[2];

    // cached unit normal
    let normalX = targetRectangle[9];
    let normalY = targetRectangle[10];
    let normalZ = targetRectangle[11];

    // denom = dot(direction, planeNormal)
    const denom = dirX * normalX + dirY * normalY + dirZ * normalZ;

    // "almost parallel" check
    // since normal is unit, denom is cos(angle)
    if (denom * denom <= 1e-24) {
      return {
        hit: false,
        inRange: false,
        point: null,
        normal: null,
        uv: null,
        distance: INFINITY,
        offset: INFINITY,
      };
    }

    // planeTime = dot(origin - start, normal) / denom
    const planeTime = ((originX - startX) * normalX + (originY - startY) * normalY + (originZ - startZ) * normalZ) / denom;

    // for ray-distance units
    const timeEpsilon = maxDist * 1e-9 + 1e-9;

    // behind the ray start
    if (planeTime < -timeEpsilon) {
      return {
        hit: false,
        inRange: false,
        point: null,
        normal: null,
        uv: null,
        distance: INFINITY,
        offset: planeTime,
      };
    }

    // beyond max distance
    if (planeTime > (maxDist + timeEpsilon)) {
      return {
        hit: false,
        inRange: false,
        point: null,
        normal: null,
        uv: null,
        distance: planeTime + offsetDist,
        offset: planeTime,
      };
    }

    // hit point on the plane
    const pointX = startX + dirX * planeTime;
    const pointY = startY + dirY * planeTime;
    const pointZ = startZ + dirZ * planeTime;

    // w = point - origin
    const wX = pointX - originX;
    const wY = pointY - originY;
    const wZ = pointZ - originZ;

    // rectangle was built by `BR.makeRect()`: U ⟂ V
    // u = dot(w, U) / dot(U,U)
    // v = dot(w, V) / dot(V,V)
    const rectU = (wX * targetRectangle[3] + wY * targetRectangle[4] + wZ * targetRectangle[5]) * targetRectangle[12];
    const rectV = (wX * targetRectangle[6] + wY * targetRectangle[7] + wZ * targetRectangle[8]) * targetRectangle[13];

    // for UV bounds
    const uvEpsilon = 1e-9;

    const isInRect = (rectU >= -uvEpsilon) && (rectU <= (1 + uvEpsilon)) && (rectV >= -uvEpsilon) && (rectV <= (1 + uvEpsilon));

    if (!isInRect) {
      return {
        hit: false,
        inRange: true,
        point: [pointX, pointY, pointZ],
        normal: null,
        uv: [rectU, rectV],
        distance: planeTime + offsetDist,
        offset: planeTime,
      };
    }

    // flip normal to face against the ray direction
    if (denom > 0) {
      normalX = -normalX;
      normalY = -normalY;
      normalZ = -normalZ;
    }

    return {
      hit: true,
      inRange: true,
      point: [pointX, pointY, pointZ],
      normal: [normalX, normalY, normalZ],
      uv: [rectU, rectV], // u,v in [0..1]
      distance: planeTime + offsetDist, // from original startPosition
      offset: planeTime, // from offset position
    };
  };

  _BR.makeRectangle = (centerPosition, normal, normalType, width, height, rotation, rotationType) => {
    // resolve arguments (defaults)
    let fromNormalType = normalType | 0;
    if ((fromNormalType < 1) | (fromNormalType > 3)) {
      fromNormalType = _default.normalType;
    }
    let rectWidth = width;
    if (!(rectWidth > 0)) {
      rectWidth = _default.width;
    }
    let rectHeight = height;
    if (!(rectHeight > 0)) {
      rectHeight = _default.height;
    }
    let fromRotationType = rotationType | 0;
    if ((fromRotationType !== 2) & (fromRotationType !== 3)) {
      fromRotationType = _default.rotationType;
    }

    // normalize rotation into a stable range to avoid huge angles
    let rectRotation = rotation;
    if (rectRotation == null) {
      rectRotation = _default.rotation;
    } else if (fromRotationType === 3) {
      // degrees -> normalize to [-180, 180) then convert to radians
      rectRotation = (rectRotation + 180) % 360;
      if (rectRotation < 0) { rectRotation += 360; }
      rectRotation = (rectRotation - 180) * DEG_TO_RAD;
    } else {
      // radians -> normalize to [-pi, pi)
      rectRotation = (rectRotation + PI) % TWO_PI;
      if (rectRotation < 0) { rectRotation += TWO_PI; }
      rectRotation = rectRotation - PI;
    }

    // load into shared registers
    _dirX = normal[0];
    _dirY = normal[1];
    _dirZ = normal[2];

    // convert input normal direction
    _Converter[fromNormalType + "1"];

    // local copies of shared registers
    const normalX = _dirX;
    const normalY = _dirY;
    const normalZ = _dirZ;

    const cosRotation = Math.cos(rectRotation);
    const sinRotation = Math.sin(rectRotation);

    // helper axes keep cross products from going near-zero
    let axisX = 0, axisY = 0, axisZ = 0;
    if ((normalX < 0.9) & (normalX > -0.9)) {
      axisX = 1;
    } else {
      axisY = 1;
    }

    // basisU = normalize(axis x normal)
    let basisUX = axisY * normalZ - axisZ * normalY;
    let basisUY = axisZ * normalX - axisX * normalZ;
    let basisUZ = axisX * normalY - axisY * normalX;

    const inverseBasisUNorm = 1 / (Math.sqrt(basisUX * basisUX + basisUY * basisUY + basisUZ * basisUZ) || 1);
    basisUX *= inverseBasisUNorm;
    basisUY *= inverseBasisUNorm;
    basisUZ *= inverseBasisUNorm;

    // basisV = (unitNormal x basisU)
    // (right-handed)
    const basisVX = normalY * basisUZ - normalZ * basisUY;
    const basisVY = normalZ * basisUX - normalX * basisUZ;
    const basisVZ = normalX * basisUY - normalY * basisUX;

    // edge vectors
    const edgeUX = (basisUX * cosRotation + basisVX * sinRotation) * rectWidth;
    const edgeUY = (basisUY * cosRotation + basisVY * sinRotation) * rectWidth;
    const edgeUZ = (basisUZ * cosRotation + basisVZ * sinRotation) * rectWidth;

    const edgeVX = (-basisUX * sinRotation + basisVX * cosRotation) * rectHeight;
    const edgeVY = (-basisUY * sinRotation + basisVY * cosRotation) * rectHeight;
    const edgeVZ = (-basisUZ * sinRotation + basisVZ * cosRotation) * rectHeight;

    return [
      centerPosition[0] - 0.5 * edgeUX - 0.5 * edgeVX, 
      centerPosition[1] - 0.5 * edgeUY - 0.5 * edgeVY, 
      centerPosition[2] - 0.5 * edgeUZ - 0.5 * edgeVZ,
      edgeUX, edgeUY, edgeUZ,
      edgeVX, edgeVY, edgeVZ,
      normalX, normalY, normalZ,
      1 / (rectWidth * rectWidth), 1 / (rectHeight * rectHeight),
    ];
  };

  Object.seal(_BR);
  globalThis.BR = _BR;

  void 0;
}
