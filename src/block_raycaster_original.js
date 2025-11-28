// Copyright (c) 2025 delfineonx
// This product includes "Block Raycaster" created by delfineonx.
// Licensed under the Apache License, Version 2.0 (the "License").

{
  const _default = {
    // 1: [dirX, dirY, dirZ]
    // 2: [yawRad, pitchRad]
    // 3: [yawDeg, pitchDeg]
    directionType: 1,
    maxDistance: 6,
    startOffset: 0,
    cellSize: 1,
  };

  // shared direction registers
  // 1: [dirX, dirY, dirZ]
  // 2: [yawRad, pitchRad, undefined]
  // 3: [yawDeg, pitchDeg, undefined]
  let dirX = null;
  let dirY = null;
  let dirZ = null;

  let Converter = null;
  {
    // constants
    const PI          = 3.141592653589793;        // pi
    const TWO_PI      = 6.283185307179586;        // 2*pi
    const DEG_TO_RAD  = 0.017453292519943295;     // pi/180
    const RAD_TO_DEG  = 57.29577951308232;        // 180/pi

    Converter = {
      // [dirX, dirY, dirZ] -> normalized (unit vector)
      get 11() {
        // NOTE: assumes non-zero vector
        const inverseVecNorm = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ); // 1 / sqrt(vecNormSquared)
        dirX *= inverseVecNorm;
        dirY *= inverseVecNorm;
        dirZ *= inverseVecNorm;
      },

      // [dirX, dirY, dirZ] -> [yawRad, pitchRad]
      get 12() {
        // pitchRad = atan2(dirY, horizontalNorm)
        dirY = Math.atan2(dirY, Math.sqrt(dirX * dirX + dirZ * dirZ));
        // yawRad = atan2(-dirX, -dirZ)
        dirX = Math.atan2(-dirX, -dirZ);
      },

      // [dirX, dirY, dirZ] -> [yawDeg, pitchDeg]
      get 13() {
        // pitchDeg = pitchRad * RAD_TO_DEG
        dirY = Math.atan2(dirY, Math.sqrt(dirX * dirX + dirZ * dirZ)) * RAD_TO_DEG;
        // yawDeg = yawRad * RAD_TO_DEG
        dirX = Math.atan2(-dirX, -dirZ) * RAD_TO_DEG;
      },

      // [yawRad, pitchRad] -> [dirX, dirY, dirZ]
      get 21() {
        // yawRad to [-pi, +pi)
        dirX = (dirX + PI) % TWO_PI;       // (-2*pi, 2*pi)
        if (dirX < 0) { dirX += TWO_PI; }  // [0, 2*pi)
        dirX = dirX - PI;                  // [-pi, pi)
        const cosYaw   = Math.cos(dirX);
        const cosPitch = Math.cos(dirY);
        // direction = (-cosPitch * sinYaw, sinPitch, -cosPitch * cosYaw)
        dirX = -cosPitch * Math.sin(dirX);
        dirY =  Math.sin(dirY);
        dirZ = -cosPitch * cosYaw;
      },

      // [yawRad, pitchRad] -> normalized
      get 22() {
        // yawRad to [-pi, +pi)
        dirX = (dirX + PI) % TWO_PI;       // (-2*pi, 2*pi)
        if (dirX < 0) { dirX += TWO_PI; }  // [0, 2*pi)
        dirX = dirX - PI;                  // [-pi, pi)
      },

      // [yawRad, pitchRad] -> [yawDeg, pitchDeg]
      get 23() {
        // yawRad to [-pi, +pi)
        dirX = (dirX + PI) % TWO_PI;       // (-2*pi, 2*pi)
        if (dirX < 0) { dirX += TWO_PI; }  // [0, 2*pi)
        dirX = dirX - PI;                  // [-pi, pi)
        dirX *= RAD_TO_DEG;
        dirY *= RAD_TO_DEG;
      },

      // [yawDeg, pitchDeg] -> [dirX, dirY, dirZ]
      get 31() {
        // yawDeg to [-180, +180)
        dirX = (dirX + 180) % 360;     // (-360, 360)
        if (dirX < 0) { dirX += 360; } // [0, 360)
        dirX -= 180;                   // [-180, 180)
        dirX *= DEG_TO_RAD;
        dirY *= DEG_TO_RAD;
        const cosYaw   = Math.cos(dirX);
        const cosPitch = Math.cos(dirY);
        // direction = (-cosPitch * sinYaw, sinPitch, -cosPitch * cosYaw)
        dirX = -cosPitch * Math.sin(dirX);
        dirY =  Math.sin(dirY);
        dirZ = -cosPitch * cosYaw;
      },

      // [yawDeg, pitchDeg] -> [yawRad, pitchRad]
      get 32() {
        // yawDeg to [-180, +180)
        dirX = (dirX + 180) % 360;     // (-360, 360)
        if (dirX < 0) { dirX += 360; } // [0, 360)
        dirX -= 180;                   // [-180, 180)
        dirX *= DEG_TO_RAD;
        dirY *= DEG_TO_RAD;
      },

      // [yawDeg, pitchDeg] -> normalized
      get 33() {
        // yawDeg to [-180, +180)
        dirX = (dirX + 180) % 360;     // (-360, 360)
        if (dirX < 0) { dirX += 360; } // [0, 360)
        dirX -= 180;                   // [-180, 180)
      },
    };
  }

  const convertDirection = (direction, fromType, toType) => {
    let fromDirType = fromType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    let toDirType = toType | 0;
    if ((toDirType < 1) | (toDirType > 3)) {
      toDirType = _default.directionType;
    }

    // load into shared registers
    dirX = direction[0];
    dirY = direction[1];
    dirZ = direction[2];
    Converter["" + fromDirType + toDirType];

    if (toDirType === 1) {
      return [dirX, dirY, dirZ];
    } else {
      // [yawRad, pitchRad] or [yawDeg, pitchDeg]
      return [dirX, dirY];
    }
  };

  let cast = null;
  {
    const INFINITY = 1e9;

    // persistent state for interrupted casts
    let _state = 0;
    let _stepCount = 0;
    let _wasInterrupted = 0;

    let _dirX = 0;
    let _dirY = 0;
    let _dirZ = 0;
    let _offsetDistance = 0;
    let _startX = 0;
    let _startY = 0;
    let _startZ = 0;

    let _stepXSign = 0;
    let _stepYSign = 0;
    let _stepZSign = 0;
    let _timeStrideX = 0;
    let _timeStrideY = 0;
    let _timeStrideZ = 0;
    let _voxelX = 0;
    let _voxelY = 0;
    let _voxelZ = 0;
    let _timeNextX = 0;
    let _timeNextY = 0;
    let _timeNextZ = 0;
    let _maxTime = 0;

    cast = (startPosition, direction, directionType, maxDistance, startOffset, cellSize, isIdempotent) => {
      // clear state
      _state >>= (isIdempotent === true);
      // undo stepCount
      _stepCount -= _wasInterrupted;

      // ---------- INIT PHASE ----------
      if (_state === 0) {
        // 1) convert to normalized vector
        dirX = direction[0];
        dirY = direction[1];
        dirZ = direction[2];
        let fromDirType = directionType | 0;
        if ((fromDirType < 1) | (fromDirType > 3)) {
          fromDirType = _default.directionType;
        }
        Converter[fromDirType + "1"];
        _dirX = dirX;
        _dirY = dirY;
        _dirZ = dirZ;

        // 2) resolve defaults
        let maxDist = maxDistance;
        if (!(maxDist > 0)) {
          maxDist = _default.maxDistance;
        }
        let offset = startOffset;
        if ((offset === undefined) | (offset === null)) {
          offset = _default.startOffset;
        }
        let cell = cellSize;
        if (!(cell > 0)) {
          cell = _default.cellSize;
        }

        _offsetDistance = offset;

        // starting point on ray (offset included)
        _startX = startPosition[0] + _dirX * offset; // ... + _dirX * offsetTime
        _startY = startPosition[1] + _dirY * offset; // ... + _dirY * offsetTime
        _startZ = startPosition[2] + _dirZ * offset; // ... + _dirZ * offsetTime

        // ---------- DDA setup ----------
        _stepXSign = (_dirX > 0) - (_dirX < 0);
        _stepYSign = (_dirY > 0) - (_dirY < 0);
        _stepZSign = (_dirZ > 0) - (_dirZ < 0);

        const absDirX = _dirX * _stepXSign;
        const absDirY = _dirY * _stepYSign;
        const absDirZ = _dirZ * _stepZSign;

        const isZeroDirX = +(absDirX === 0);
        const isZeroDirY = +(absDirY === 0);
        const isZeroDirZ = +(absDirZ === 0);

        // time to cross one voxel along each axis (in "ray distance" units)
        _timeStrideX = cell / (absDirX + isZeroDirX);
        _timeStrideY = cell / (absDirY + isZeroDirY);
        _timeStrideZ = cell / (absDirZ + isZeroDirZ);

        // starting voxel indexes
        _voxelX = Math.floor(_startX / cell);
        _voxelY = Math.floor(_startY / cell);
        _voxelZ = Math.floor(_startZ / cell);

        // initial time to hit first voxel boundary
        if (isZeroDirX) {
          _timeNextX = INFINITY;
        } else {
          _timeNextX = ((_voxelX + ((_stepXSign + 1) >> 1)) * cell - _startX) / _dirX;
        }
        if (isZeroDirY) {
          _timeNextY = INFINITY;
        } else {
          _timeNextY = ((_voxelY + ((_stepYSign + 1) >> 1)) * cell - _startY) / _dirY;
        }
        if (isZeroDirZ) {
          _timeNextZ = INFINITY;
        } else {
          _timeNextZ = ((_voxelZ + ((_stepZSign + 1) >> 1)) * cell - _startZ) / _dirZ;
        }

        // avoid exact-zero comparisons
        const timeEpsilon = cell * 1e-9;
        if (_timeNextX === 0) { _timeNextX += timeEpsilon; }
        if (_timeNextY === 0) { _timeNextY += timeEpsilon; }
        if (_timeNextZ === 0) { _timeNextZ += timeEpsilon; }

        _maxTime = maxDist + timeEpsilon;
        _stepCount = 0;

        _state = 1;
      }

      // ---------- STEP PHASE ----------
      if (_state === 1) {
        _wasInterrupted = 1;
        
        const stepXSign = _stepXSign;
        const stepYSign = _stepYSign;
        const stepZSign = _stepZSign;
        const timeStrideX = _timeStrideX;
        const timeStrideY = _timeStrideY;
        const timeStrideZ = _timeStrideZ;

        let voxelX = _voxelX;
        let voxelY = _voxelY;
        let voxelZ = _voxelZ;
        let timeNextX = _timeNextX;
        let timeNextY = _timeNextY;
        let timeNextZ = _timeNextZ;

        const maxTime = _maxTime;

        let pickX, pickY, pickZ;
        let timeHit;
        let blockId;
        let inRange;

        do {
          _stepCount++;

          // persist state for possible interruption
          _voxelX = voxelX;
          _voxelY = voxelY;
          _voxelZ = voxelZ;
          _timeNextX = timeNextX;
          _timeNextY = timeNextY;
          _timeNextZ = timeNextZ;

          // choose axis with smallest next hit time
          pickX = (timeNextX < timeNextY) & (timeNextX < timeNextZ);
          pickY = (timeNextY <= timeNextZ) & (1 - pickX);
          pickZ = 1 - pickX - pickY;

          // distance along ray where this voxel boundary is hit
          timeHit = timeNextX * pickX + timeNextY * pickY + timeNextZ * pickZ;

          // step voxel coordinate along selected
          voxelX += stepXSign * pickX;
          voxelY += stepYSign * pickY;
          voxelZ += stepZSign * pickZ;

          // advance only on chosen axis
          timeNextX += timeStrideX * pickX;
          timeNextY += timeStrideY * pickY;
          timeNextZ += timeStrideZ * pickZ;

          blockId = api.getBlockId(voxelX, voxelY, voxelZ);
          inRange = (timeHit <= maxTime);
        } while (!blockId & inRange);

        const normalX = -stepXSign * pickX;
        const normalY = -stepYSign * pickY;
        const normalZ = -stepZSign * pickZ;

        _wasInterrupted = 0;
        _state = 0;

        return {
          blockId: blockId,
          position: [voxelX, voxelY, voxelZ],
          normal: [normalX, normalY, normalZ],
          adjacent: [voxelX + normalX, voxelY + normalY, voxelZ + normalZ],
          point: [
            _startX + _dirX * timeHit,
            _startY + _dirY * timeHit,
            _startZ + _dirZ * timeHit,
          ],
          distance: timeHit + _offsetDistance,
          offsetDistance: timeHit,
          steps: _stepCount,
          inRange: inRange,
        };
      }
    };
  }

  const offsetPosition = (startPosition, direction, directionType, startOffset) => {
    let fromDirType = directionType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    dirX = direction[0];
    dirY = direction[1];
    dirZ = direction[2];
    Converter[fromDirType + "1"];

    let offset = startOffset;
    if (offset === undefined || offset === null) {
      offset = _default.startOffset;
    }

    return [
      startPosition[0] + dirX * offset,
      startPosition[1] + dirY * offset,
      startPosition[2] + dirZ * offset,
    ];
  };

  const maxDistancePosition = (startPosition, direction, directionType, maxDistance, startOffset) => {
    let fromDirType = directionType | 0;
    if ((fromDirType < 1) | (fromDirType > 3)) {
      fromDirType = _default.directionType;
    }
    dirX = direction[0];
    dirY = direction[1];
    dirZ = direction[2];
    Converter[fromDirType + "1"];

    let maxDist = maxDistance;
    if (!(maxDist > 0)) {
      maxDist = _default.maxDistance;
    }
    let offset = startOffset;
    if (offset === undefined || offset === null) {
      offset = _default.startOffset;
    }

    const maxTime = maxDist + offset;

    return [
      startPosition[0] + dirX * maxTime,
      startPosition[1] + dirY * maxTime,
      startPosition[2] + dirZ * maxTime,
    ];
  };

  globalThis.BR = Object.seal({
    default: _default,
    cast,
    convertDirection,
    offsetPosition,
    maxDistancePosition,
  });

  void 0;
}

