// Copyright (c) 2025 delfineonx
// This product includes "Voxel Raycaster" created by delfineonx.
// This product includes "Player Tracker" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

// Voxel Raycaster [block / mesh] (basic)
{
  const _VR = {
    defaults: {
      convert: {
        fromType: 1,
        toType: 1,
      },
      offset: {
        dtype: 1,
        offset: 6,
      },
      block: {
        dtype: 1,
        distance: 6,
        offset: 0,
        cell: 1,
      },
      rect: {
        ntype: 1,
        width: 1,
        height: 1,
        rotation: 0, // [0, 0, 0]
        rtype: 2,

        dtype: 1,
        distance: 6,
        offset: 0,
      },
      box: {
        ntype: 1,
        width: 1,
        height: 1,
        depth: 1,
        rotation: 0, // [0, 0, 0]
        rtype: 2,

        dtype: 1,
        distance: 6,
        offset: 0,
      },
    },

    convert: null,
    offsetPosition: null,

    castBlock: null,

    makeRect: null,
    castRect: null,

    makeBox: null,
    castBox: null,
  };

  const INFINITY = 1e9;
  const PI = 3.141592653589793;            // pi
  const TWO_PI = 6.283185307179586;        // 2*pi
  const DEG_TO_RAD = 0.017453292519943295; // pi/180
  const RAD_TO_DEG = 57.29577951308232;    // 180/pi
  const UV_EPSILON = 1e-9;

  // shared direction registers
  // 1: [dirX, dirY, dirZ]
  // 2: [yawRad, pitchRad, undefined]
  // 3: [yawDeg, pitchDeg, undefined]
  let _dirX = 0;
  let _dirY = 0;
  let _dirZ = 0;

  const _defaults = _VR.defaults;
  const _convert = _defaults.convert;
  const _offset = _defaults.offset;
  const _block = _defaults.block;
  const _rect = _defaults.rect;
  const _box = _defaults.box;

  const _getBlockId = api.getBlockId;

  const _toUnitDirVec = (direction, dtype) => {
    if (dtype === 1) {
      _dirX = direction[0];
      _dirY = direction[1];
      _dirZ = direction[2];

      const normSquared = _dirX * _dirX + _dirY * _dirY + _dirZ * _dirZ;
  
      if ((normSquared > 0.999999) && (normSquared < 1.000001)) { return; }

      const inverseNorm = 1 / Math.sqrt(normSquared);
      _dirX *= inverseNorm;
      _dirY *= inverseNorm;
      _dirZ *= inverseNorm;
      return;
    }

    let dirYaw = direction[0];
    let dirPitch = direction[1];

    if (dtype === 3) {
      dirYaw *= DEG_TO_RAD;
      dirPitch *= DEG_TO_RAD;
    }

    const cosPitch = Math.cos(dirPitch);
    _dirX = -cosPitch * Math.sin(dirYaw);
    _dirY = Math.sin(dirPitch);
    _dirZ = -cosPitch * Math.cos(dirYaw);
  };

  _VR.convert = (direction, fromType, toType) => {
    let fromDirType = fromType | 0;
    if ((fromDirType < 1) || (fromDirType > 3)) { fromDirType = _convert.fromType; }
    let toDirType = toType | 0;
    if ((toDirType < 1) || (toDirType > 3)) { toDirType = _convert.toType; }

    let dirX = direction[0];
    let dirY = direction[1];
    let dirZ = direction[2];

    switch (fromDirType * 10 + toDirType) {
      // [dirX, dirY, dirZ] -> normalized (unit vector)
      case 11: {
        const normSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
        if ((normSquared > 0.999999) && (normSquared < 1.000001)) { return [dirX, dirY, dirZ]; }
        const inverseNorm = 1 / Math.sqrt(normSquared);
        return [dirX * inverseNorm, dirY * inverseNorm, dirZ * inverseNorm];
      }

      // [dirX, dirY, dirZ] -> [yawRad, pitchRad]
      case 12: {
        // pitchRad = atan2(dirY, horizontalNorm)
        dirY = Math.atan2(dirY, Math.sqrt(dirX * dirX + dirZ * dirZ));
        // yawRad = atan2(-dirX, -dirZ)
        dirX = Math.atan2(-dirX, -dirZ);
        return [dirX, dirY];
      }

      // [dirX, dirY, dirZ] -> [yawDeg, pitchDeg]
      case 13: {
        // pitchDeg = pitchRad * RAD_TO_DEG
        dirY = Math.atan2(dirY, Math.sqrt(dirX * dirX + dirZ * dirZ)) * RAD_TO_DEG;
        // yawDeg = yawRad * RAD_TO_DEG
        dirX = Math.atan2(-dirX, -dirZ) * RAD_TO_DEG;
        return [dirX, dirY];
      }

      // [yawRad, pitchRad] -> [dirX, dirY, dirZ]
      case 21: {
        const cosPitch = Math.cos(dirY);
        return [-cosPitch * Math.sin(dirX), Math.sin(dirY), -cosPitch * Math.cos(dirX)];
      }

      // [yawRad, pitchRad] -> normalized
      case 22: {
        // yawRad to [-pi, +pi)
        if ((dirX >= PI) || (dirX < -PI)) {
          dirX = (dirX + PI) % TWO_PI;
          if (dirX < 0) { dirX += TWO_PI; }
          dirX -= PI;
        }
        return [dirX, dirY];
      }

      // [yawRad, pitchRad] -> [yawDeg, pitchDeg]
      case 23: {
        // yawRad to [-pi, +pi)
        if ((dirX >= PI) || (dirX < -PI)) {
          dirX = (dirX + PI) % TWO_PI;
          if (dirX < 0) { dirX += TWO_PI; }
          dirX -= PI;
        }
        return [dirX * RAD_TO_DEG, dirY * RAD_TO_DEG];
      }

      // [yawDeg, pitchDeg] -> [dirX, dirY, dirZ]
      case 31: {
        dirX *= DEG_TO_RAD;
        dirY *= DEG_TO_RAD;
        const cosPitch = Math.cos(dirY);
        return [-cosPitch * Math.sin(dirX), Math.sin(dirY), -cosPitch * Math.cos(dirX)];
      }

      // [yawDeg, pitchDeg] -> [yawRad, pitchRad]
      case 32: {
        if ((dirX >= 180) || (dirX < -180)) {
          // yawDeg to [-180, +180)
          dirX = (dirX + 180) % 360;
          if (dirX < 0) { dirX += 360; }
          dirX -= 180;
        }
        return [dirX * DEG_TO_RAD, dirY * DEG_TO_RAD];
      }

      // [yawDeg, pitchDeg] -> normalized
      case 33: {
        if ((dirX >= 180) || (dirX < -180)) {
          // yawDeg to [-180, +180)
          dirX = (dirX + 180) % 360;
          if (dirX < 0) { dirX += 360; }
          dirX -= 180;
        }
        return [dirX, dirY];
      }

      default: {
        return null;
      }
    }
  };

  _VR.offsetPosition = (start, direction, dtype, offset) => {
    let dirType = dtype | 0;
    if ((dirType < 1) || (dirType > 3)) { dirType = _offset.dtype; }
    let startOffset = offset;
    if (startOffset == null) { startOffset = _offset.offset; }

    _toUnitDirVec(direction, dirType);

    return [
      start[0] + _dirX * startOffset,
      start[1] + _dirY * startOffset,
      start[2] + _dirZ * startOffset,
    ];
  };

  _VR.castBlock = (start, direction, dtype, distance, offset, cell) => {
    // resolve arguments (defaults)
    let dirType = dtype | 0;
    if ((dirType < 1) || (dirType > 3)) { dirType = _block.dtype; }
    let maxDistance = distance;
    if (!(maxDistance > 0)) { maxDistance = _block.distance; }
    let startOffset = offset;
    if (startOffset == null) { startOffset = _block.offset; }
    let cellSize = cell;
    if (!(cellSize > 0)) { cellSize = _block.cell; }

    _toUnitDirVec(direction, dirType);

    // load from shared registers
    const dirX = _dirX;
    const dirY = _dirY;
    const dirZ = _dirZ;

    // ray starting point (offset included)
    const startX = start[0] + dirX * startOffset;
    const startY = start[1] + dirY * startOffset;
    const startZ = start[2] + dirZ * startOffset;

    // starting voxel indexes
    let temp = startX / cellSize;
    let voxelX = temp | 0;
    voxelX -= (temp < voxelX);
    temp = startY / cellSize;
    let voxelY = temp | 0;
    voxelY -= (temp < voxelY);
    temp = startZ / cellSize;
    let voxelZ = temp | 0;
    voxelZ -= (temp < voxelZ);

    // test starting voxel
    let blockId = _getBlockId(voxelX, voxelY, voxelZ);
    if (blockId) {
      return {
        blockId: blockId,
        inRange: true,
        distance: 0,
        point: [startX, startY, startZ],
        position: [voxelX, voxelY, voxelZ],
        normal: [0, 0, 0],
        adjacent: [voxelX, voxelY, voxelZ],
        steps: 0,
      };
    }

    // step directions per axis
    const stepSignX = (dirX > 0) - (dirX < 0);
    const stepSignY = (dirY > 0) - (dirY < 0);
    const stepSignZ = (dirZ > 0) - (dirZ < 0);

    const absDirX = dirX * stepSignX;
    const absDirY = dirY * stepSignY;
    const absDirZ = dirZ * stepSignZ;

    // tiny epsilon to avoid exact-zero comparisons
    const timeEpsilon = cellSize * 1e-9;

    // time to cross one voxel along each axis (in ray-distance units)
    let timeStrideX = INFINITY;
    let timeStrideY = INFINITY;
    let timeStrideZ = INFINITY;

    // initial time to hit first voxel boundary on each axis
    let timeNextX = INFINITY;
    let timeNextY = INFINITY;
    let timeNextZ = INFINITY;

    if (absDirX !== 0) {
      timeStrideX = cellSize / absDirX;
      timeNextX = (((voxelX + ((stepSignX + 1) >> 1)) * cellSize - startX) / dirX) + timeEpsilon;
    }
    if (absDirY !== 0) {
      timeStrideY = cellSize / absDirY;
      timeNextY = (((voxelY + ((stepSignY + 1) >> 1)) * cellSize - startY) / dirY) + timeEpsilon;
    }
    if (absDirZ !== 0) {
      timeStrideZ = cellSize / absDirZ;
      timeNextZ = (((voxelZ + ((stepSignZ + 1) >> 1)) * cellSize - startZ) / dirZ) + timeEpsilon;
    }

    const maxTime = maxDistance + timeEpsilon;

    let timeHit = 0;
    let axisIndex = 0; // 0=X, 1=Y, 2=Z
    let inRange = true;
    let stepCount = 0;

    while (!blockId && inRange) {
      stepCount++;

      // choose axis with smallest next hit time
      if (timeNextX < timeNextY) {
        if (timeNextX < timeNextZ) {
          timeHit = timeNextX;
          voxelX += stepSignX;
          timeNextX += timeStrideX;
          axisIndex = 0;
        } else {
          timeHit = timeNextZ;
          voxelZ += stepSignZ;
          timeNextZ += timeStrideZ;
          axisIndex = 2;
        }
      } else {
        if (timeNextY <= timeNextZ) {
          timeHit = timeNextY;
          voxelY += stepSignY;
          timeNextY += timeStrideY;
          axisIndex = 1;
        } else {
          timeHit = timeNextZ;
          voxelZ += stepSignZ;
          timeNextZ += timeStrideZ;
          axisIndex = 2;
        }
      }

      inRange = (timeHit <= maxTime);
      blockId = _getBlockId(voxelX, voxelY, voxelZ);
    }

    let normalX = 0, normalY = 0, normalZ = 0;
    if (axisIndex === 0) {
      normalX = -stepSignX;
    } else if (axisIndex === 1) {
      normalY = -stepSignY;
    } else {
      normalZ = -stepSignZ;
    }

    return {
      blockId: blockId,
      inRange: inRange,
      distance: timeHit, // from offset position
      point: [startX + dirX * timeHit, startY + dirY * timeHit, startZ + dirZ * timeHit],
      position: [voxelX, voxelY, voxelZ],
      normal: [normalX, normalY, normalZ],
      adjacent: [voxelX + normalX, voxelY + normalY, voxelZ + normalZ],
      steps: stepCount,
    };
  };

  _VR.makeRect = (center, normal, ntype, width, height, rotation, rtype) => {
    // resolve arguments (defaults)
    let normalType = ntype | 0;
    if ((normalType < 1) || (normalType > 3)) { normalType = _rect.ntype; }
    let rectWidth = width;
    if (!(rectWidth > 0)) { rectWidth = _rect.width; }
    let rectHeight = height;
    if (!(rectHeight > 0)) { rectHeight = _rect.height; }
    let rectRotation = rotation;
    if (rectRotation == null) { rectRotation = _rect.rotation; }
    let rotationType = rtype | 0;
    if ((rotationType !== 2) && (rotationType !== 3)) { rotationType = _rect.rtype; }

    let rotU = 0, rotV = 0, rotN = 0;
    if (typeof rectRotation === "number") {
      rotN = rectRotation;
    } else {
      rotU = rectRotation[0] || 0;
      rotV = rectRotation[1] || 0;
      rotN = rectRotation[2] || 0;
    }

    if (rotationType === 3) {
      rotU *= DEG_TO_RAD;
      rotV *= DEG_TO_RAD;
      rotN *= DEG_TO_RAD;
    }

    _toUnitDirVec(normal, normalType);

    // load from shared registers
    let normalX = _dirX;
    let normalY = _dirY;
    let normalZ = _dirZ;

    // helper axis to avoid near-zero cross products 
    let axisX = 0, axisY = 0, axisZ = 0;
    if ((normalX < 0.9) && (normalX > -0.9)) {
      axisX = 1;
    } else {
      axisY = 1;
    }

    // basisU = normalize(axis x normal)
    let basisUX = axisY * normalZ - axisZ * normalY;
    let basisUY = axisZ * normalX - axisX * normalZ;
    let basisUZ = axisX * normalY - axisY * normalX;

    const inverseNormBasisU = 1 / (Math.sqrt(basisUX * basisUX + basisUY * basisUY + basisUZ * basisUZ) || 1);
    basisUX *= inverseNormBasisU;
    basisUY *= inverseNormBasisU;
    basisUZ *= inverseNormBasisU;

    // basisV = (normal x basis)
    let basisVX = normalY * basisUZ - normalZ * basisUY;
    let basisVY = normalZ * basisUX - normalX * basisUZ;
    let basisVZ = normalX * basisUY - normalY * basisUX;

    // rotate the local frame (U, V, N)
    // right-handed: V = N x U
    let cosAngle, sinAngle, rotatedX, rotatedY, rotatedZ;

    // rotate around U: mixes (V, N)
    if (rotU) {
      cosAngle = Math.cos(rotU);
      sinAngle = Math.sin(rotU);

      // rotatedV = V*cos + N*sin
      rotatedX = basisVX * cosAngle + normalX * sinAngle;
      rotatedY = basisVY * cosAngle + normalY * sinAngle;
      rotatedZ = basisVZ * cosAngle + normalZ * sinAngle;

      // rotatedN = N*cos - V*sin
      normalX = normalX * cosAngle - basisVX * sinAngle;
      normalY = normalY * cosAngle - basisVY * sinAngle;
      normalZ = normalZ * cosAngle - basisVZ * sinAngle;

      basisVX = rotatedX;
      basisVY = rotatedY;
      basisVZ = rotatedZ;
    }

    // rotate around V: mixes (U, N)
    if (rotV) {
      cosAngle = Math.cos(rotV);
      sinAngle = Math.sin(rotV);

      // rotatedU = U*cos - N*sin
      rotatedX = basisUX * cosAngle - normalX * sinAngle;
      rotatedY = basisUY * cosAngle - normalY * sinAngle;
      rotatedZ = basisUZ * cosAngle - normalZ * sinAngle;

      // rotatedN = N*cos + U*sin
      normalX = normalX * cosAngle + basisUX * sinAngle;
      normalY = normalY * cosAngle + basisUY * sinAngle;
      normalZ = normalZ * cosAngle + basisUZ * sinAngle;

      basisUX = rotatedX;
      basisUY = rotatedY;
      basisUZ = rotatedZ;
    }

    // rotate around N: mixes (U, V)
    if (rotN) {
      cosAngle = Math.cos(rotN);
      sinAngle = Math.sin(rotN);

      // rotatedU = U*cos + V*sin
      rotatedX = basisUX * cosAngle + basisVX * sinAngle;
      rotatedY = basisUY * cosAngle + basisVY * sinAngle;
      rotatedZ = basisUZ * cosAngle + basisVZ * sinAngle;

      // rotatedV = V*cos - U*sin
      basisVX = basisVX * cosAngle - basisUX * sinAngle;
      basisVY = basisVY * cosAngle - basisUY * sinAngle;
      basisVZ = basisVZ * cosAngle - basisUZ * sinAngle;

      basisUX = rotatedX;
      basisUY = rotatedY;
      basisUZ = rotatedZ;
    }

    // edge vectors
    const edgeUX = basisUX * rectWidth;
    const edgeUY = basisUY * rectWidth;
    const edgeUZ = basisUZ * rectWidth;

    const edgeVX = basisVX * rectHeight;
    const edgeVY = basisVY * rectHeight;
    const edgeVZ = basisVZ * rectHeight;

    return [
      center[0] - 0.5 * edgeUX - 0.5 * edgeVX,
      center[1] - 0.5 * edgeUY - 0.5 * edgeVY,
      center[2] - 0.5 * edgeUZ - 0.5 * edgeVZ,
      edgeUX, edgeUY, edgeUZ,
      edgeVX, edgeVY, edgeVZ,
      normalX, normalY, normalZ,
      1 / (rectWidth * rectWidth), 1 / (rectHeight * rectHeight),
    ];
  };

  _VR.castRect = (rectangle, start, direction, dtype, distance, offset) => {
    // resolve arguments (defaults)
    let dirType = dtype | 0;
    if ((dirType < 1) || (dirType > 3)) { dirType = _rect.dtype; }
    let maxDistance = distance;
    if (!(maxDistance > 0)) { maxDistance = _rect.distance; }
    let startOffset = offset;
    if (startOffset == null) { startOffset = _rect.offset; }

    _toUnitDirVec(direction, dirType);

    // load from shared registers
    const dirX = _dirX;
    const dirY = _dirY;
    const dirZ = _dirZ;

    // ray starting point (offset included)
    const startX = start[0] + dirX * startOffset;
    const startY = start[1] + dirY * startOffset;
    const startZ = start[2] + dirZ * startOffset;

    // partially unpack rectangle 
    const originX = rectangle[0];
    const originY = rectangle[1];
    const originZ = rectangle[2];

    // cached unit normal
    let normalX = rectangle[9];
    let normalY = rectangle[10];
    let normalZ = rectangle[11];

    // denominator = dot(direction, planeNormal)
    const denominator = dirX * normalX + dirY * normalY + dirZ * normalZ;

    // parallel check
    if (denominator * denominator <= 1e-18) {
      return {
        hit: false,
        inRange: false,
        distance: INFINITY,
        point: null,
        normal: null,
        uv: null,
      };
    }

    // dot(origin - start, normal) / denominator
    const hitTime = ((originX - startX) * normalX + (originY - startY) * normalY + (originZ - startZ) * normalZ) / denominator;

    // for ray-distance units
    const timeEpsilon = maxDistance * 1e-9;

    // behind the ray start or beyond max distance
    if ((hitTime < -timeEpsilon) || (hitTime > (maxDistance + timeEpsilon))) {
      return {
        hit: false,
        inRange: false,
        distance: hitTime,
        point: null,
        normal: null,
        uv: null,
      };
    }

    // hit point on the plane
    const pointX = startX + dirX * hitTime;
    const pointY = startY + dirY * hitTime;
    const pointZ = startZ + dirZ * hitTime;

    // delta = point - origin
    const deltaX = pointX - originX;
    const deltaY = pointY - originY;
    const deltaZ = pointZ - originZ;

    // rectangle was built by `BR.makeRect()`: U ⟂ V
    // u = dot(delta, U) / dot(U, U)
    // v = dot(delta, V) / dot(V, V)
    const rectU = (deltaX * rectangle[3] + deltaY * rectangle[4] + deltaZ * rectangle[5]) * rectangle[12];
    const rectV = (deltaX * rectangle[6] + deltaY * rectangle[7] + deltaZ * rectangle[8]) * rectangle[13];

    const isInRect = (rectU >= -UV_EPSILON) && (rectU <= (1 + UV_EPSILON)) && (rectV >= -UV_EPSILON) && (rectV <= (1 + UV_EPSILON));

    if (!isInRect) {
      return {
        hit: false,
        inRange: true,
        distance: hitTime,
        point: [pointX, pointY, pointZ],
        normal: null,
        uv: [rectU, rectV],
      };
    }

    // flip normal to face against the ray direction
    if (denominator > 0) {
      normalX = -normalX;
      normalY = -normalY;
      normalZ = -normalZ;
    }

    return {
      hit: true,
      inRange: true,
      distance: hitTime,
      point: [pointX, pointY, pointZ],
      normal: [normalX, normalY, normalZ],
      uv: [rectU, rectV], // u,v in [0..1]
    };
  };

  _VR.makeBox = (center, normal, ntype, width, height, depth, rotation, rtype) => {
    // resolve arguments (defaults)
    let normalType = ntype | 0;
    if ((normalType < 1) || (normalType > 3)) { normalType = _box.ntype; }
    let boxWidth = width;
    if (!(boxWidth > 0)) { boxWidth = _box.width; }
    let boxHeight = height;
    if (!(boxHeight > 0)) { boxHeight = _box.height; }
    let boxDepth = depth;
    if (!(boxDepth > 0)) { boxDepth = _box.depth; }
    let boxRotation = rotation;
    if (boxRotation == null) { boxRotation = _box.rotation; }
    let rotationType = rtype | 0;
    if ((rotationType !== 2) && (rotationType !== 3)) { rotationType = _box.rtype; }

    let rotU = 0, rotV = 0, rotN = 0;
    if (typeof boxRotation === "number") {
      rotN = boxRotation;
    } else {
      rotU = boxRotation[0] || 0;
      rotV = boxRotation[1] || 0;
      rotN = boxRotation[2] || 0;
    }

    if (rotationType === 3) {
      rotU *= DEG_TO_RAD;
      rotV *= DEG_TO_RAD;
      rotN *= DEG_TO_RAD;
    }

    _toUnitDirVec(normal, normalType);

    // load from shared registers
    let normalX = _dirX;
    let normalY = _dirY;
    let normalZ = _dirZ;

    // helper axis to avoid near-zero cross products 
    let axisX = 0, axisY = 0, axisZ = 0;
    if ((normalX < 0.9) && (normalX > -0.9)) {
      axisX = 1;
    } else {
      axisY = 1;
    }

    // basisU = normalize(axis x normal)
    let basisUX = axisY * normalZ - axisZ * normalY;
    let basisUY = axisZ * normalX - axisX * normalZ;
    let basisUZ = axisX * normalY - axisY * normalX;

    const inverseNormBasisU = 1 / (Math.sqrt(basisUX * basisUX + basisUY * basisUY + basisUZ * basisUZ) || 1);
    basisUX *= inverseNormBasisU;
    basisUY *= inverseNormBasisU;
    basisUZ *= inverseNormBasisU;

    // basisV = (normal x basis)
    let basisVX = normalY * basisUZ - normalZ * basisUY;
    let basisVY = normalZ * basisUX - normalX * basisUZ;
    let basisVZ = normalX * basisUY - normalY * basisUX;

    // intrinsic local 3D rotation: rotate the local frame (U, V, W)
    // right-handed: V = W x U
    let cosAngle, sinAngle, rotatedX, rotatedY, rotatedZ;

    // rotate around U: mixes (V, N)
    if (rotU) {
      cosAngle = Math.cos(rotU);
      sinAngle = Math.sin(rotU);

      // rotatedV = V*cos + W*sin
      rotatedX = basisVX * cosAngle + normalX * sinAngle;
      rotatedY = basisVY * cosAngle + normalY * sinAngle;
      rotatedZ = basisVZ * cosAngle + normalZ * sinAngle;

      // rotatedW = W*cos - V*sin
      normalX = normalX * cosAngle - basisVX * sinAngle;
      normalY = normalY * cosAngle - basisVY * sinAngle;
      normalZ = normalZ * cosAngle - basisVZ * sinAngle;

      basisVX = rotatedX;
      basisVY = rotatedY;
      basisVZ = rotatedZ;
    }

    // rotate around V: mixes (U, N)
    if (rotV) {
      cosAngle = Math.cos(rotV);
      sinAngle = Math.sin(rotV);

      // rotatedU = U*cos - W*sin
      rotatedX = basisUX * cosAngle - normalX * sinAngle;
      rotatedY = basisUY * cosAngle - normalY * sinAngle;
      rotatedZ = basisUZ * cosAngle - normalZ * sinAngle;

      // rotatedW = W*cos + U*sin
      normalX = normalX * cosAngle + basisUX * sinAngle;
      normalY = normalY * cosAngle + basisUY * sinAngle;
      normalZ = normalZ * cosAngle + basisUZ * sinAngle;

      basisUX = rotatedX;
      basisUY = rotatedY;
      basisUZ = rotatedZ;
    }

    // rotate around N: mixes (U, V)
    if (rotN) {
      cosAngle = Math.cos(rotN);
      sinAngle = Math.sin(rotN);

      // rotatedU = U*cos + V*sin
      rotatedX = basisUX * cosAngle + basisVX * sinAngle;
      rotatedY = basisUY * cosAngle + basisVY * sinAngle;
      rotatedZ = basisUZ * cosAngle + basisVZ * sinAngle;

      // rotatedV = V*cos - U*sin
      basisVX = basisVX * cosAngle - basisUX * sinAngle;
      basisVY = basisVY * cosAngle - basisUY * sinAngle;
      basisVZ = basisVZ * cosAngle - basisUZ * sinAngle;

      basisUX = rotatedX;
      basisUY = rotatedY;
      basisUZ = rotatedZ;
    }

    const edgeUX = basisUX * boxWidth;
    const edgeUY = basisUY * boxWidth;
    const edgeUZ = basisUZ * boxWidth;

    const edgeVX = basisVX * boxHeight;
    const edgeVY = basisVY * boxHeight;
    const edgeVZ = basisVZ * boxHeight;

    const edgeWX = normalX * boxDepth;
    const edgeWY = normalY * boxDepth;
    const edgeWZ = normalZ * boxDepth;

    return [
      center[0] - 0.5 * edgeUX - 0.5 * edgeVX - 0.5 * edgeWX,
      center[1] - 0.5 * edgeUY - 0.5 * edgeVY - 0.5 * edgeWY,
      center[2] - 0.5 * edgeUZ - 0.5 * edgeVZ - 0.5 * edgeWZ,
      edgeUX, edgeUY, edgeUZ,
      edgeVX, edgeVY, edgeVZ,
      edgeWX, edgeWY, edgeWZ,
      basisUX, basisUY, basisUZ,
      basisVX, basisVY, basisVZ,
      normalX, normalY, normalZ,
      1 / (boxWidth * boxWidth), 1 / (boxHeight * boxHeight), 1 / (boxDepth * boxDepth),
    ];
  };

  _VR.castBox = (box, start, direction, dtype, distance, offset) => {
    // resolve arguments (defaults)
    let dirType = dtype | 0;
    if ((dirType < 1) || (dirType > 3)) { dirType = _box.dtype; }
    let maxDistance = distance;
    if (!(maxDistance > 0)) { maxDistance = _box.distance; }
    let startOffset = offset;
    if (startOffset == null) { startOffset = _box.offset; }

    _toUnitDirVec(direction, dirType);

    // load from shared registers
    const dirX = _dirX;
    const dirY = _dirY;
    const dirZ = _dirZ;

    // ray starting point (offset included)
    const startX = start[0] + dirX * startOffset;
    const startY = start[1] + dirY * startOffset;
    const startZ = start[2] + dirZ * startOffset;

    // vector from box origin to ray start
    const deltaX = startX - box[0];
    const deltaY = startY - box[1];
    const deltaZ = startZ - box[2];

    // local coordinates at start: [u,v,w] where box spans [0..1]^3
    const uStart = (deltaX * box[3] + deltaY * box[4] + deltaZ * box[5]) * box[21];
    const vStart = (deltaX * box[6] + deltaY * box[7] + deltaZ * box[8]) * box[22];
    const wStart = (deltaX * box[9] + deltaY * box[10] + deltaZ * box[11]) * box[23];

    // local direction (rate of change of [u,v,w] per world ray distance)
    const uRate = (dirX * box[3] + dirY * box[4] + dirZ * box[5]) * box[21];
    const vRate = (dirX * box[6] + dirY * box[7] + dirZ * box[8]) * box[22];
    const wRate = (dirX * box[9] + dirY * box[10] + dirZ * box[11]) * box[23];

    // slab intersection in local space
    let enterTime = -INFINITY;
    let exitTime = INFINITY;

    let enterAxisIndex = -1;
    let exitAxisIndex = -1;

    let enterFaceSign = 0;
    let exitFaceSign = 0;

    let axisEnterTime, axisExitTime, axisEnterSign, axisExitSign, temp;

    // axis U (local x)
    if (uRate * uRate <= 1e-18) {
      if ((uStart < 0) || (uStart > 1)) {
        return {
          hit: false,
          inRange: false,
          distance: INFINITY,
          point: null,
          normal: null,
          uvw: null,
        };
      }
    } else {
      axisEnterTime = (-uStart) / uRate;
      axisExitTime = (1 - uStart) / uRate;
      axisEnterSign = -1;
      axisExitSign = 1;
      if (axisEnterTime > axisExitTime) {
        temp = axisEnterTime;
        axisEnterTime = axisExitTime;
        axisExitTime = temp;
        axisEnterSign = 1;
        axisExitSign = -1;
      }
      if (axisEnterTime > enterTime) {
        enterTime = axisEnterTime;
        enterAxisIndex = 0;
        enterFaceSign = axisEnterSign;
      }
      if (axisExitTime < exitTime) {
        exitTime = axisExitTime;
        exitAxisIndex = 0;
        exitFaceSign = axisExitSign;
      }
      if (enterTime > exitTime) {
        return {
          hit: false,
          inRange: false,
          distance: INFINITY,
          point: null,
          normal: null,
          uvw: null,
        };
      }
    }

    // axis V (local y)
    if (vRate * vRate <= 1e-18) {
      if ((vStart < 0) || (vStart > 1)) {
        return {
          hit: false,
          inRange: false,
          distance: INFINITY,
          point: null,
          normal: null,
          uvw: null,
        };
      }
    } else {
      axisEnterTime = (-vStart) / vRate;
      axisExitTime = (1 - vStart) / vRate;
      axisEnterSign = -1;
      axisExitSign = 1;
      if (axisEnterTime > axisExitTime) {
        temp = axisEnterTime;
        axisEnterTime = axisExitTime;
        axisExitTime = temp;
        axisEnterSign = 1;
        axisExitSign = -1;
      }
      if (axisEnterTime > enterTime) {
        enterTime = axisEnterTime;
        enterAxisIndex = 1;
        enterFaceSign = axisEnterSign;
      }
      if (axisExitTime < exitTime) {
        exitTime = axisExitTime;
        exitAxisIndex = 1;
        exitFaceSign = axisExitSign; }
      if (enterTime > exitTime) {
        return {
          hit: false,
          inRange: false,
          distance: INFINITY,
          point: null,
          normal: null,
          uvw: null,
        };
      }
    }

    // axis W (local z)
    if (wRate * wRate <= 1e-18) {
      if ((wStart < 0) || (wStart > 1)) {
        return {
          hit: false,
          inRange: false,
          distance: INFINITY,
          point: null,
          normal: null,
          uvw: null,
        };
      }
    } else {
      axisEnterTime = (-wStart) / wRate;
      axisExitTime = (1 - wStart) / wRate;
      axisEnterSign = -1;
      axisExitSign = 1;
      if (axisEnterTime > axisExitTime) {
        temp = axisEnterTime;
        axisEnterTime = axisExitTime;
        axisExitTime = temp;
        axisEnterSign = 1;
        axisExitSign = -1;
      }
      if (axisEnterTime > enterTime) {
        enterTime = axisEnterTime;
        enterAxisIndex = 2;
        enterFaceSign = axisEnterSign;
      }
      if (axisExitTime < exitTime) {
        exitTime = axisExitTime;
        exitAxisIndex = 2;
        exitFaceSign = axisExitSign;
      }
      if (enterTime > exitTime) {
        return {
          hit: false,
          inRange: false,
          distance: INFINITY,
          point: null,
          normal: null,
          uvw: null,
        };
      }
    }

    const timeEpsilon = maxDistance * 1e-9;

    // pick enter unless starting inside
    let hitTime = enterTime;
    let hitAxisIndex = enterAxisIndex;
    let hitFaceSign = enterFaceSign;

    if (hitTime < -timeEpsilon) {
      hitTime = exitTime;
      hitAxisIndex = exitAxisIndex;
      hitFaceSign = exitFaceSign;
    }

    if ((hitTime < -timeEpsilon) || (hitTime > (maxDistance + timeEpsilon))) {
      return {
        hit: false,
        inRange: false,
        distance: hitTime,
        point: null,
        normal: null,
        uvw: null,
      };
    }

    let hitNormalX = 0, hitNormalY = 0, hitNormalZ = 0;
    if (hitAxisIndex === 0) {
      hitNormalX = box[12] * hitFaceSign;
      hitNormalY = box[13] * hitFaceSign;
      hitNormalZ = box[14] * hitFaceSign;
    } else if (hitAxisIndex === 1) {
      hitNormalX = box[15] * hitFaceSign;
      hitNormalY = box[16] * hitFaceSign;
      hitNormalZ = box[17] * hitFaceSign;
    } else {
      hitNormalX = box[18] * hitFaceSign;
      hitNormalY = box[19] * hitFaceSign;
      hitNormalZ = box[20] * hitFaceSign;
    }

    return {
      hit: true,
      inRange: true,
      distance: hitTime,
      point: [startX + dirX * hitTime, startY + dirY * hitTime, startZ + dirZ * hitTime],
      normal: [hitNormalX, hitNormalY, hitNormalZ],
      uvw: [uStart + uRate * hitTime, vStart + vRate * hitTime, wStart + wRate * hitTime],
    };
  };

  globalThis.VR = _VR;
  void 0;
}

// Player Tracker
{
  const _PT = {
    join: () => { },
    leave: () => { },

    ids: null, // safe (copy)
    checkValid: Object.create(null),
    _playerIds: [], // unsafe (reference)

    id_to_name: Object.create(null), // "id" -> "Name"
    name_to_id: Object.create(null), // "Name" -> "id"
    id_to_dbid: Object.create(null), // "id" -> "DbId"
    dbid_to_id: Object.create(null), // "DbId" -> "id"

    positions: null,
    crouching: null,

    update: 0xffffffff,

    onPlayerJoin: null,
    onPlayerLeave: null,
    tick: null,
  };

  const _stateById = Object.create(null);  // "id" -> (32-2: seenGenerationId)(1-1: leaveStatus)(0-0: joinStatus)
  const _presentIds = _PT._playerIds; // ["id1", "id2", ...]
  const _presentById = _PT.checkValid; // "id" -> presentGeneration (integer > 0)
  const _positions = Object.create(null); // "id" -> [x, y, z]
  const _crouching = Object.create(null); // "id" -> false/true

  let _presentGeneration = 1;
  let _positionsUpdate = 1;
  let _crouchingUpdate = 1;

  const _IdToName = _PT.id_to_name;
  const _NameToId = _PT.name_to_id;
  const _IdToDbId = _PT.id_to_dbid;
  const _DbIdToId = _PT.dbid_to_id;

  const _getPlayerIds = api.getPlayerIds;
  const _getPosition = api.getPosition;
  const _isPlayerCrouching = api.isPlayerCrouching;

  _PT.ids = () => _presentIds.slice();

  _PT.positions = () => {
    if (_positionsUpdate) {
      let index = 0;
      const count = _presentIds.length;
      let playerId;
      while (index < count) {
        playerId = _presentIds[index];
        _positions[playerId] = _getPosition(playerId);
        index++;
      }
      _positionsUpdate = 0;
    }
    return _positions;
  };

  _PT.crouching = () => {
    if (_crouchingUpdate) {
      let index = 0;
      const count = _presentIds.length;
      let playerId;
      while (index < count) {
        playerId = _presentIds[index];
        _crouching[playerId] = _isPlayerCrouching(playerId);
        index++;
      }
      _crouchingUpdate = 0;
    }
    return _crouching;
  };

  _PT.onPlayerJoin = (playerId) => {
    let state = _stateById[playerId];
    if (state === undefined) { state = _stateById[playerId] = (3 >> 0); }
    if (state & 1) {
      try {
        const name = api.getEntityName(playerId);
        const dbid = api.getPlayerDbId(playerId);
        if (!_presentById[playerId]) {
          const index = _presentIds.length;
          _presentIds[index] = playerId;
          _presentById[playerId] = index + 1;
        }
        _IdToName[playerId] = name;
        _NameToId[name] = playerId;
        _IdToDbId[playerId] = dbid;
        _DbIdToId[dbid] = playerId;
        _positionsUpdate = 1;
        _crouchingUpdate = 1;
        _PT.update = 0xffffffff;
        _PT.join(playerId);
        _stateById[playerId] = state &= ~1;
      } catch (error) {
        _stateById[playerId] = state &= ~1;
        api.broadcastMessage("Player Tracker: Join handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
      }
    }
  };

  _PT.onPlayerLeave = (playerId) => {
    const mapIndex = _presentById[playerId];
    if (!mapIndex) {
      delete _stateById[playerId];
      return;
    }
    let state = (_stateById[playerId] >>> 0);
    if (state & 2) {
      try {
        _PT.leave(playerId);
        _stateById[playerId] = state &= ~2;
      } catch (error) {
        _stateById[playerId] = state &= ~2;
        api.broadcastMessage("Player Tracker: Leave handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
      }
    }
    const lastIndex = _presentIds.length - 1;
    const lastPlayerId = _presentIds[lastIndex];
    if (lastPlayerId !== playerId) {
      _presentIds[mapIndex - 1] = lastPlayerId;
      _presentById[lastPlayerId] = mapIndex;
    }
    _presentIds.length = lastIndex;
    delete _presentById[playerId];
    delete _stateById[playerId];
    const name = _IdToName[playerId];
    const dbid = _IdToDbId[playerId];
    delete _IdToName[playerId];
    delete _NameToId[name];
    delete _IdToDbId[playerId];
    delete _DbIdToId[dbid];
    delete _positions[playerId];
    delete _crouching[playerId];
    _positionsUpdate = 1;
    _crouchingUpdate = 1;
    _PT.update = 0xffffffff;
  };

  _PT.tick = () => {
    const newPlayerIds = _getPlayerIds();
    const scanLength = newPlayerIds.length;
    const nextPresentGen = _presentGeneration + 1;
    let scanIndex = 0, presentIndex = 0;
    let playerId, state;
    while (scanIndex < scanLength) {
      playerId = newPlayerIds[scanIndex];
      state = _stateById[playerId] ?? 3;
      if (!_presentById[playerId]) {
        const index = _presentIds.length;
        _presentIds[index] = playerId;
        _presentById[playerId] = index + 1;
      }
      if (!(state & 2)) { state = 3; }
      _stateById[playerId] = state = ((nextPresentGen << 2) | (state & 3));
      scanIndex++;
    }
    while (presentIndex < _presentIds.length) {
      playerId = _presentIds[presentIndex];
      state = _stateById[playerId];
      if ((state >>> 2) === nextPresentGen) {
        if (state & 1) {
          try {
            const name = api.getEntityName(playerId);
            const dbid = api.getPlayerDbId(playerId);
            _IdToName[playerId] = name;
            _NameToId[name] = playerId;
            _IdToDbId[playerId] = dbid;
            _DbIdToId[dbid] = playerId;
            _PT.join(playerId);
            _stateById[playerId] = state &= ~1;
          } catch (error) {
            _stateById[playerId] = state &= ~1;
            api.broadcastMessage("Player Tracker: Join handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
          }
        }
        presentIndex++;
        continue;
      }
      if (state & 2) {
        try {
          _PT.leave(playerId);
          _stateById[playerId] = state &= ~2;
        } catch (error) {
          _stateById[playerId] = state &= ~2;
          api.broadcastMessage("Player Tracker: Leave handler error: " + error.name + ": " + error.message, { color: "#ff9d87" });
        }
      }
      const lastIndex = _presentIds.length - 1;
      const lastPlayerId = _presentIds[lastIndex];
      if (lastIndex !== presentIndex) {
        _presentIds[presentIndex] = lastPlayerId;
        _presentById[lastPlayerId] = presentIndex + 1;
      }
      _presentIds.length = lastIndex;
      delete _presentById[playerId];
      delete _stateById[playerId];
      const name = _IdToName[playerId];
      const dbid = _IdToDbId[playerId];
      delete _IdToName[playerId];
      delete _NameToId[name];
      delete _IdToDbId[playerId];
      delete _DbIdToId[dbid];
      delete _positions[playerId];
      delete _crouching[playerId];
    }
    _positionsUpdate = 1;
    _crouchingUpdate = 1;
    _PT.update = 0xffffffff;
    _presentGeneration = nextPresentGen;
  };

  Object.seal(_PT);
  globalThis.PT = _PT;
  void 0
}

// Voxel Raycaster [player] (extended)
{
  const _VR = globalThis.VR;
  const _PT = globalThis.PT;

  const INFINITY = 1e9;
  const DEG_TO_RAD = 0.017453292519943295; // pi/180
  const DIR_EPSILON_SQUARED = 1e-18;
  const _crouchLeanRad = Math.atan2(0.26, 0.64);
  const _crouchLeanCos = Math.cos(_crouchLeanRad);
  const _crouchLeanSin = Math.sin(_crouchLeanRad);
  
  const _AABB = Object.create(null); // broad cache: "id" -> [minX, minY, minZ, maxX, maxY, maxZ]
  const _ignoreMap = Object.create(null);
  let _ignoreGeneration = 1;

  // shared intersection registers
  let _hitAxisIndex = 0;
  let _hitFaceSign = 0;

  // shared normal registers
  let _normalX = 0;
  let _normalY = 0;
  let _normalZ = 0;
  
  let _playerPositions = null;
  let _playerCrouching = null;
  
  const _player = _VR.defaults.player = { dtype: 1, distance: 6, offset: 0 };
  
  const _playerIds = _PT._playerIds;
  const _checkValid = _PT.checkValid;
  const _getPlayerFacingInfo = api.getPlayerFacingInfo;

  const _setNormalFromYaw = (axisIndex, faceSign, bodyX, bodyZ) => {
    // right
    if (axisIndex === 0) {
      _normalX = bodyZ * faceSign;
      _normalY = 0;
      _normalZ = -bodyX * faceSign;
      return;
    }
    // up
    if (axisIndex === 1) {
      _normalX = 0;
      _normalY = faceSign;
      _normalZ = 0;
      return;
    }
    // forward
    _normalX = bodyX * faceSign;
    _normalY = 0;
    _normalZ = bodyZ * faceSign;
  };

  const _setNormalFromAxes = (
    axisIndex, faceSign,
    axis0X, axis0Y, axis0Z,
    axis1X, axis1Y, axis1Z,
    axis2X, axis2Y, axis2Z,
    bodyX, bodyZ
  ) => {
    let bodyNormalX, bodyNormalY, bodyNormalZ;

    if (axisIndex === 0) {
      bodyNormalX = axis0X;
      bodyNormalY = axis0Y;
      bodyNormalZ = axis0Z;
    } else if (axisIndex === 1) {
      bodyNormalX = axis1X;
      bodyNormalY = axis1Y;
      bodyNormalZ = axis1Z;
    } else {
      bodyNormalX = axis2X;
      bodyNormalY = axis2Y;
      bodyNormalZ = axis2Z;
    }

    bodyNormalX *= faceSign;
    bodyNormalY *= faceSign;
    bodyNormalZ *= faceSign;

    _normalX = bodyZ * bodyNormalX + bodyX * bodyNormalZ;
    _normalY = bodyNormalY;
    _normalZ = -bodyX * bodyNormalX + bodyZ * bodyNormalZ;
  };

  const _intersectAABB = (
    minX, minY, minZ,
    maxX, maxY, maxZ,
    startX, startY, startZ,
    dirX, dirY, dirZ
  ) => {
    let enterTime = -INFINITY;
    let exitTime = INFINITY;

    let enterAxisIndex = -1;
    let exitAxisIndex = -1;
    let enterFaceSign = 0;
    let exitFaceSign = 0;

    let axisEnterTime, axisExitTime, axisEnterFaceSign, axisExitFaceSign, temp;

    if (dirX * dirX <= DIR_EPSILON_SQUARED) {
      if ((startX < minX) || (startX > maxX)) { return INFINITY; }
    } else {
      axisEnterTime = (minX - startX) / dirX;
      axisExitTime = (maxX - startX) / dirX;
      axisEnterFaceSign = -1;
      axisExitFaceSign = 1;
      if (axisEnterTime > axisExitTime) {
        temp = axisEnterTime;
        axisEnterTime = axisExitTime;
        axisExitTime = temp;
        axisEnterFaceSign = 1;
        axisExitFaceSign = -1;
      }
      if (axisEnterTime > enterTime) {
        enterTime = axisEnterTime;
        enterAxisIndex = 0;
        enterFaceSign = axisEnterFaceSign;
      }
      if (axisExitTime < exitTime) {
        exitTime = axisExitTime;
        exitAxisIndex = 0;
        exitFaceSign = axisExitFaceSign;
      }
      if (enterTime > exitTime) { return INFINITY; }
    }

    if (dirY * dirY <= DIR_EPSILON_SQUARED) {
      if ((startY < minY) || (startY > maxY)) { return INFINITY; }
    } else {
      axisEnterTime = (minY - startY) / dirY;
      axisExitTime = (maxY - startY) / dirY;
      axisEnterFaceSign = -1;
      axisExitFaceSign = 1;
      if (axisEnterTime > axisExitTime) {
        temp = axisEnterTime;
        axisEnterTime = axisExitTime;
        axisExitTime = temp;
        axisEnterFaceSign = 1;
        axisExitFaceSign = -1;
      }
      if (axisEnterTime > enterTime) {
        enterTime = axisEnterTime;
        enterAxisIndex = 1;
        enterFaceSign = axisEnterFaceSign;
      }
      if (axisExitTime < exitTime) {
        exitTime = axisExitTime;
        exitAxisIndex = 1;
        exitFaceSign = axisExitFaceSign;
      }
      if (enterTime > exitTime) { return INFINITY; }
    }

    if (dirZ * dirZ <= DIR_EPSILON_SQUARED) {
      if ((startZ < minZ) || (startZ > maxZ)) { return INFINITY; }
    } else {
      axisEnterTime = (minZ - startZ) / dirZ;
      axisExitTime = (maxZ - startZ) / dirZ;
      axisEnterFaceSign = -1;
      axisExitFaceSign = 1;
      if (axisEnterTime > axisExitTime) {
        temp = axisEnterTime;
        axisEnterTime = axisExitTime;
        axisExitTime = temp;
        axisEnterFaceSign = 1;
        axisExitFaceSign = -1;
      }
      if (axisEnterTime > enterTime) {
        enterTime = axisEnterTime;
        enterAxisIndex = 2;
        enterFaceSign = axisEnterFaceSign;
      }
      if (axisExitTime < exitTime) {
        exitTime = axisExitTime;
        exitAxisIndex = 2;
        exitFaceSign = axisExitFaceSign;
      }
      if (enterTime > exitTime) { return INFINITY; }
    }

    let hitTime = enterTime;
    let axisIndex = enterAxisIndex;
    let faceSign = enterFaceSign;

    if (hitTime < 0) {
      hitTime = exitTime;
      axisIndex = exitAxisIndex;
      faceSign = exitFaceSign;
    }

    if (axisIndex < 0) { return INFINITY; }

    _hitAxisIndex = axisIndex;
    _hitFaceSign = faceSign;
    return hitTime;
  };

  _VR.castPlayer = (ignore, start, direction, dtype, distance, offset) => {
    let dirType = dtype | 0;
    if ((dirType < 1) || (dirType > 3)) { dirType = _player.dtype; }
    let maxDistance = distance;
    if (!(maxDistance > 0)) { maxDistance = _player.distance; }
    let startOffset = offset;
    if (startOffset == null) { startOffset = _player.offset; }

    let playerIndex = 0;
    const playerCount = _playerIds.length;

    _playerPositions = _PT.positions();
    _playerCrouching = _PT.crouching();

    if (_PT.update & 1) {
      let playerId, position, isCrouching, x, y, z, aabb;

      playerIndex = 0;
      while (playerIndex < playerCount) {
        playerId = _playerIds[playerIndex];

        position = _playerPositions[playerId];
        isCrouching = _playerCrouching[playerId];

        x = position[0];
        y = position[1];
        z = position[2];

        aabb = _AABB[playerId];
        if (!aabb) {
          aabb = _AABB[playerId] = [0, 0, 0, 0, 0, 0];
        }

        if (isCrouching) {
          aabb[0] = x - 0.94;
          aabb[1] = y;
          aabb[2] = z - 0.94;

          aabb[3] = x + 0.94;
          aabb[4] = y + 2.01;
          aabb[5] = z + 0.94;
        } else {
          aabb[0] = x - 0.50;
          aabb[1] = y;
          aabb[2] = z - 0.50;

          aabb[3] = x + 0.50;
          aabb[4] = y + 2.06;
          aabb[5] = z + 0.50;
        }

        playerIndex++;
      }

      _PT.update &= ~1;
    }

    _ignoreGeneration += 1;
    if (ignore && (ignore.length > 0)) {
      let ignoreIndex = 0;
      const ignoreCount = ignore.length;
      let playerId;
      while (ignoreIndex < ignoreCount) {
        playerId = ignore[ignoreIndex];
        if (_checkValid[playerId]) {
          _ignoreMap[playerId] = _ignoreGeneration;
        }
        ignoreIndex++;
      }
    }

    let dirX, dirY, dirZ;
    if (dirType === 1) {
      dirX = direction[0];
      dirY = direction[1];
      dirZ = direction[2];

      const normSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
  
      if ((normSquared < 0.999999) || (normSquared > 1.000001)) {
        const inverseNorm = 1 / Math.sqrt(normSquared);
        dirX *= inverseNorm;
        dirY *= inverseNorm;
        dirZ *= inverseNorm;
      }
    } else {
      let dirYaw = direction[0];
      let dirPitch = direction[1];
  
      if (dirType === 3) {
        dirYaw *= DEG_TO_RAD;
        dirPitch *= DEG_TO_RAD;
      }
  
      const cosPitch = Math.cos(dirPitch);
      dirX = -cosPitch * Math.sin(dirYaw);
      dirY = Math.sin(dirPitch);
      dirZ = -cosPitch * Math.cos(dirYaw);
    }

    const startX = start[0] + dirX * startOffset;
    const startY = start[1] + dirY * startOffset;
    const startZ = start[2] + dirZ * startOffset;

    const timeEpsilon = maxDistance * 1e-9;
    const maxTime = maxDistance + timeEpsilon;

    let bestHitPlayerId = null;
    let bestHitPartName = null;
    let bestHitTime = INFINITY;

    let bestHitNormalX = 0;
    let bestHitNormalY = 0;
    let bestHitNormalZ = 0;

    let playerId, aabb, enterTime, exitTime, axisEnterTime, axisExitTime, temp, broadHitTime;

    playerIndex = 0;
    while (playerIndex < playerCount) {
      playerId = _playerIds[playerIndex];
      playerIndex++;

      if (_ignoreMap[playerId] === _ignoreGeneration) { continue; }

      aabb = _AABB[playerId];

      enterTime = -INFINITY;
      exitTime = INFINITY;

      if (dirX * dirX <= DIR_EPSILON_SQUARED) {
        if ((startX < aabb[0]) || (startX > aabb[3])) { continue; }
      } else {
        axisEnterTime = (aabb[0] - startX) / dirX;
        axisExitTime = (aabb[3] - startX) / dirX;
        if (axisEnterTime > axisExitTime) {
          temp = axisEnterTime;
          axisEnterTime = axisExitTime;
          axisExitTime = temp;
        }
        if (axisEnterTime > enterTime) { enterTime = axisEnterTime; }
        if (axisExitTime < exitTime) { exitTime = axisExitTime; }
        if (enterTime > exitTime) { continue; }
      }

      if (dirY * dirY <= DIR_EPSILON_SQUARED) {
        if ((startY < aabb[1]) || (startY > aabb[4])) { continue; }
      } else {
        axisEnterTime = (aabb[1] - startY) / dirY;
        axisExitTime = (aabb[4] - startY) / dirY;
        if (axisEnterTime > axisExitTime) {
          temp = axisEnterTime;
          axisEnterTime = axisExitTime;
          axisExitTime = temp;
        }
        if (axisEnterTime > enterTime) { enterTime = axisEnterTime; }
        if (axisExitTime < exitTime) { exitTime = axisExitTime; }
        if (enterTime > exitTime) { continue; }
      }

      if (dirZ * dirZ <= DIR_EPSILON_SQUARED) {
        if ((startZ < aabb[2]) || (startZ > aabb[5])) { continue; }
      } else {
        axisEnterTime = (aabb[2] - startZ) / dirZ;
        axisExitTime = (aabb[5] - startZ) / dirZ;
        if (axisEnterTime > axisExitTime) {
          temp = axisEnterTime;
          axisEnterTime = axisExitTime;
          axisExitTime = temp;
        }
        if (axisEnterTime > enterTime) { enterTime = axisEnterTime; }
        if (axisExitTime < exitTime) { exitTime = axisExitTime; }
        if (enterTime > exitTime) { continue; }
      }

      if (exitTime < 0) { continue; }
      broadHitTime = (enterTime > 0) ? enterTime : 0;
      if ((broadHitTime > maxTime) || (broadHitTime > bestHitTime)) { continue; }

      const position = _playerPositions[playerId];
      const isCrouching = _playerCrouching[playerId];
      const facingDirection = _getPlayerFacingInfo(playerId).dir;

      const facingDirX = facingDirection[0];
      const facingDirY = facingDirection[1];
      const facingDirZ = facingDirection[2];

      const cosPitch = Math.sqrt(facingDirX * facingDirX + facingDirZ * facingDirZ);
      const sinPitch = facingDirY;

      const bodyX = facingDirX / cosPitch;
      const bodyZ = facingDirZ / cosPitch;

      const deltaX = startX - position[0];
      const deltaY = startY - position[1];
      const deltaZ = startZ - position[2];

      const bodyDirX = dirX * bodyZ + dirZ * -bodyX;
      const bodyDirY = dirY;
      const bodyDirZ = dirX * bodyX + dirZ * bodyZ;

      const bodyStartX = deltaX * bodyZ + deltaZ * -bodyX;
      const bodyStartY = deltaY;
      const bodyStartZ = deltaX * bodyX + deltaZ * bodyZ;

      let hitTime, axisIndex, faceSign;

      if (!isCrouching) {
        // standing torso
        hitTime = _intersectAABB(
          -0.25, 0.75, -0.125,
          0.25, 1.44,  0.125,
          bodyStartX, bodyStartY, bodyStartZ,
          bodyDirX, bodyDirY, bodyDirZ
        );
        if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
          axisIndex = _hitAxisIndex;
          faceSign = _hitFaceSign;

          _setNormalFromYaw(axisIndex, faceSign, bodyX, bodyZ);

          bestHitTime = hitTime;
          bestHitPlayerId = playerId;
          bestHitPartName = "Torso";
          bestHitNormalX = _normalX;
          bestHitNormalY = _normalY;
          bestHitNormalZ = _normalZ;
        }

        // standing right arm
        hitTime = _intersectAABB(
          0.25, 0.62, -0.125,
          0.50, 1.44,  0.125,
          bodyStartX, bodyStartY, bodyStartZ,
          bodyDirX, bodyDirY, bodyDirZ
        );
        if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
          axisIndex = _hitAxisIndex;
          faceSign = _hitFaceSign;

          _setNormalFromYaw(axisIndex, faceSign, bodyX, bodyZ);

          bestHitTime = hitTime;
          bestHitPlayerId = playerId;
          bestHitPartName = "ArmRight";
          bestHitNormalX = _normalX;
          bestHitNormalY = _normalY;
          bestHitNormalZ = _normalZ;
        }

        // standing left arm
        hitTime = _intersectAABB(
          -0.50, 0.62, -0.125,
          -0.25, 1.44,  0.125,
          bodyStartX, bodyStartY, bodyStartZ,
          bodyDirX, bodyDirY, bodyDirZ
        );
        if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
          axisIndex = _hitAxisIndex;
          faceSign = _hitFaceSign;

          _setNormalFromYaw(axisIndex, faceSign, bodyX, bodyZ);

          bestHitTime = hitTime;
          bestHitPlayerId = playerId;
          bestHitPartName = "ArmLeft";
          bestHitNormalX = _normalX;
          bestHitNormalY = _normalY;
          bestHitNormalZ = _normalZ;
        }
      } else {
        let relativeX, relativeY, relativeZ;
        let partStartX, partStartY, partStartZ;
        let partDirX, partDirY, partDirZ;

        // crouching torso
        relativeX = bodyStartX;
        relativeY = bodyStartY - 1.07;
        relativeZ = bodyStartZ - 0.13;

        partStartX = relativeX;
        partStartY = relativeY * _crouchLeanCos + relativeZ * _crouchLeanSin;
        partStartZ = -relativeY * _crouchLeanSin + relativeZ * _crouchLeanCos;

        partDirX = bodyDirX;
        partDirY =  bodyDirY * _crouchLeanCos + bodyDirZ * _crouchLeanSin;
        partDirZ = -bodyDirY * _crouchLeanSin + bodyDirZ * _crouchLeanCos;

        hitTime = _intersectAABB(
          -0.25, -0.37, -0.125,
          0.25,  0.37,  0.125,
          partStartX, partStartY, partStartZ,
          partDirX, partDirY, partDirZ
        );
        if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
          axisIndex = _hitAxisIndex;
          faceSign = _hitFaceSign;

          _setNormalFromAxes(
            axisIndex, faceSign,
            1, 0, 0,
            0, _crouchLeanCos, _crouchLeanSin,
            0, -_crouchLeanSin, _crouchLeanCos,
            bodyX, bodyZ
          );

          bestHitTime = hitTime;
          bestHitPlayerId = playerId;
          bestHitPartName = "Torso";
          bestHitNormalX = _normalX;
          bestHitNormalY = _normalY;
          bestHitNormalZ = _normalZ;
        }

        // crouching right arm
        relativeX = bodyStartX - 0.375;
        relativeY = bodyStartY - 1.035;
        relativeZ = bodyStartZ - 0.105;

        partStartX = relativeX;
        partStartY =  relativeY * _crouchLeanCos + relativeZ * _crouchLeanSin;
        partStartZ = -relativeY * _crouchLeanSin + relativeZ * _crouchLeanCos;

        partDirX = bodyDirX;
        partDirY =  bodyDirY * _crouchLeanCos + bodyDirZ * _crouchLeanSin;
        partDirZ = -bodyDirY * _crouchLeanSin + bodyDirZ * _crouchLeanCos;

        hitTime = _intersectAABB(
          -0.125, -0.405, -0.125,
          0.125,   0.405,  0.125,
          partStartX, partStartY, partStartZ,
          partDirX, partDirY, partDirZ
        );
        if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
          axisIndex = _hitAxisIndex;
          faceSign = _hitFaceSign;

          _setNormalFromAxes(
            axisIndex, faceSign,
            1, 0, 0,
            0, _crouchLeanCos, _crouchLeanSin,
            0, -_crouchLeanSin, _crouchLeanCos,
            bodyX, bodyZ
          );

          bestHitTime = hitTime;
          bestHitPlayerId = playerId;
          bestHitPartName = "ArmRight";
          bestHitNormalX = _normalX;
          bestHitNormalY = _normalY;
          bestHitNormalZ = _normalZ;
        }

        // crouching left arm
        relativeX = bodyStartX + 0.375;
        relativeY = bodyStartY - 1.035;
        relativeZ = bodyStartZ - 0.105;

        partStartX = relativeX;
        partStartY =  relativeY * _crouchLeanCos + relativeZ * _crouchLeanSin;
        partStartZ = -relativeY * _crouchLeanSin + relativeZ * _crouchLeanCos;

        partDirX = bodyDirX;
        partDirY =  bodyDirY * _crouchLeanCos + bodyDirZ * _crouchLeanSin;
        partDirZ = -bodyDirY * _crouchLeanSin + bodyDirZ * _crouchLeanCos;

        hitTime = _intersectAABB(
          -0.125, -0.405, -0.125,
          0.125,   0.405,  0.125,
          partStartX, partStartY, partStartZ,
          partDirX, partDirY, partDirZ
        );
        if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
          axisIndex = _hitAxisIndex;
          faceSign = _hitFaceSign;

          _setNormalFromAxes(
            axisIndex, faceSign,
            1, 0, 0,
            0, _crouchLeanCos, _crouchLeanSin,
            0, -_crouchLeanSin, _crouchLeanCos,
            bodyX, bodyZ
          );

          bestHitTime = hitTime;
          bestHitPlayerId = playerId;
          bestHitPartName = "ArmLeft";
          bestHitNormalX = _normalX;
          bestHitNormalY = _normalY;
          bestHitNormalZ = _normalZ;
        }
      }

      // right leg
      hitTime = _intersectAABB(
        0.00, 0.00, -0.125,
        0.25, 0.75,  0.125,
        bodyStartX, bodyStartY, bodyStartZ,
        bodyDirX, bodyDirY, bodyDirZ
      );
      if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
        axisIndex = _hitAxisIndex;
        faceSign = _hitFaceSign;

        _setNormalFromYaw(axisIndex, faceSign, bodyX, bodyZ);

        bestHitTime = hitTime;
        bestHitPlayerId = playerId;
        bestHitPartName = "LegRight";
        bestHitNormalX = _normalX;
        bestHitNormalY = _normalY;
        bestHitNormalZ = _normalZ;
      }

      // left leg
      hitTime = _intersectAABB(
        -0.25, 0.00, -0.125,
        0.00,  0.75,  0.125,
        bodyStartX, bodyStartY, bodyStartZ,
        bodyDirX, bodyDirY, bodyDirZ
      );
      if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
        axisIndex = _hitAxisIndex;
        faceSign = _hitFaceSign;

        _setNormalFromYaw(axisIndex, faceSign, bodyX, bodyZ);

        bestHitTime = hitTime;
        bestHitPlayerId = playerId;
        bestHitPartName = "LegLeft";
        bestHitNormalX = _normalX;
        bestHitNormalY = _normalY;
        bestHitNormalZ = _normalZ;
      }

      // head
      const headBottomY = isCrouching ? 1.390 : 1.440;
      const headAnchorZ = isCrouching ? 0.260 : 0.000;

      const relativeX = bodyStartX;
      const relativeY = bodyStartY - (headBottomY + 0.28);
      const relativeZ = bodyStartZ - headAnchorZ;

      const headStartX = relativeX;
      const headStartY =  relativeY * cosPitch + relativeZ * sinPitch;
      const headStartZ = -relativeY * sinPitch + relativeZ * cosPitch;

      const headDirX = bodyDirX;
      const headDirY =  bodyDirY * cosPitch + bodyDirZ * sinPitch;
      const headDirZ = -bodyDirY * sinPitch + bodyDirZ * cosPitch;

      hitTime = _intersectAABB(
        -0.28, -0.28, -0.28,
        0.28,  0.28,  0.28,
        headStartX, headStartY, headStartZ,
        headDirX, headDirY, headDirZ
      );
      if ((hitTime >= -timeEpsilon) && (hitTime <= maxTime) && (hitTime < bestHitTime)) {
        axisIndex = _hitAxisIndex;
        faceSign = _hitFaceSign;

        _setNormalFromAxes(
          axisIndex, faceSign,
          1, 0, 0,
          0, cosPitch, sinPitch,
          0, -sinPitch, cosPitch,
          bodyX, bodyZ
        );

        bestHitTime = hitTime;
        bestHitPlayerId = playerId;
        bestHitPartName = "Head";
        bestHitNormalX = _normalX;
        bestHitNormalY = _normalY;
        bestHitNormalZ = _normalZ;
      }
    }

    if (!bestHitPlayerId) {
      return {
        playerId: null,
        inRange: false,
        distance: INFINITY,
        point: null,
        normal: null,
        part: null,
      };
    }

    return {
      playerId: bestHitPlayerId,
      inRange: true,
      distance: bestHitTime,
      point: [
        startX + dirX * bestHitTime,
        startY + dirY * bestHitTime,
        startZ + dirZ * bestHitTime
      ],
      normal: [bestHitNormalX, bestHitNormalY, bestHitNormalZ],
      part: bestHitPartName,
    };
  };

  _VR.onPlayerJoin = (playerId) => {
    _AABB[playerId] = [0, 0, 0, 0, 0, 0];
    _ignoreMap[playerId] = 1;
  };

  _VR.onPlayerLeave = (playerId) => {
    delete _AABB[playerId];
    delete _ignoreMap[playerId];
  };

  void 0;
}

Object.seal(globalThis.VR);
void 0;


// ---------- Installation ----------
// required for "Voxel Raycaster [player]" only

PT.join = (playerId) => { VR.onPlayerJoin(playerId); };
onPlayerJoin = (playerId) => { PT.onPlayerJoin(playerId); };

PT.leave = (playerId) => { RC.onPlayerLeave(playerId); };
onPlayerLeave = (playerId) => { VR.onPlayerLeave(playerId); };

tick = () => {
  PT.tick();
  // other logic
};

