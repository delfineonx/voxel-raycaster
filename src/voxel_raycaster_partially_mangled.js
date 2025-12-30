// Copyright (c) 2025 delfineonx
// This product includes "Voxel Raycaster" created by delfineonx.
// This product includes "Player Tracker" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

// Voxel Raycaster [block / mesh] (basic)
{
  let _VR={
    defaults:{
      convert:{
        fromType:1,
        toType:1
      },
      offset:{
        dtype:1,
        offset:6
      },
      block:{
        dtype:1,
        distance:6,
        offset:0,
        cell:1
      },
      rect:{
        ntype:1,
        width:1,
        height:1,
        rotation:0,
        rtype:2,
        dtype:1,
        distance:6,
        offset:0
      },
      box:{
        ntype:1,
        width:1,
        height:1,
        depth:1,
        rotation:0,
        rtype:2,
        dtype:1,
        distance:6,
        offset:0
      }
    },
    convert:null,
    offsetPosition:null,
    castBlock:null,
    makeRect:null,
    castRect:null,
    makeBox:null,
    castBox:null
  };
  let INFINITY=1e9,
  PI=3.141592653589793,
  TWO_PI=6.283185307179586,
  DEG_TO_RAD=.017453292519943295,
  RAD_TO_DEG=57.29577951308232,
  UV_EPSILON=1e-9,
  _dirX=0,
  _dirY=0,
  _dirZ=0,
  _defaults=_VR.defaults,
  _convert=_defaults.convert,
  _offset=_defaults.offset,
  _block=_defaults.block,
  _rect=_defaults.rect,
  _box=_defaults.box,
  _getBlockId=api.getBlockId;
  let _toUnitDirVec=(direction,dtype)=>{
    if(dtype===1){
      _dirX=direction[0];
      _dirY=direction[1];
      _dirZ=direction[2];
      let normSquared=_dirX*_dirX+_dirY*_dirY+_dirZ*_dirZ;
      if(normSquared>.999999&&normSquared<1.000001){return}
      let inverseNorm=1/Math.sqrt(normSquared);
      _dirX*=inverseNorm;
      _dirY*=inverseNorm;
      _dirZ*=inverseNorm;
      return
    }
    let dirYaw=direction[0],
    dirPitch=direction[1];
    if(dtype===3){
      dirYaw*=DEG_TO_RAD;
      dirPitch*=DEG_TO_RAD
    }
    let cosPitch=Math.cos(dirPitch);
    _dirX=-cosPitch*Math.sin(dirYaw);
    _dirY=Math.sin(dirPitch);
    _dirZ=-cosPitch*Math.cos(dirYaw)
  };
  _VR.convert=(direction,fromType,toType)=>{
    let fromDirType=fromType|0;
    if(fromDirType<1||fromDirType>3){fromDirType=_convert.fromType}
    let toDirType=toType|0;
    if(toDirType<1||toDirType>3){toDirType=_convert.toType}
    let dirX=direction[0],
    dirY=direction[1],
    dirZ=direction[2];
    switch(fromDirType*10+toDirType){
      case 11:{
        let normSquared=dirX*dirX+dirY*dirY+dirZ*dirZ;
        if(normSquared>.999999&&normSquared<1.000001){return[dirX,dirY,dirZ]}
        let inverseNorm=1/Math.sqrt(normSquared);
        return[dirX*inverseNorm,dirY*inverseNorm,dirZ*inverseNorm]
      }
      case 12:{
        dirY=Math.atan2(dirY,Math.sqrt(dirX*dirX+dirZ*dirZ));
        dirX=Math.atan2(-dirX,-dirZ);
        return[dirX,dirY]
      }
      case 13:{
        dirY=Math.atan2(dirY,Math.sqrt(dirX*dirX+dirZ*dirZ))*RAD_TO_DEG;
        dirX=Math.atan2(-dirX,-dirZ)*RAD_TO_DEG;
        return[dirX,dirY]
      }
      case 21:{
        let cosPitch=Math.cos(dirY);
        return[-cosPitch*Math.sin(dirX),Math.sin(dirY),-cosPitch*Math.cos(dirX)]
      }
      case 22:{
        if(dirX>=PI||dirX<-PI){
          dirX=(dirX+PI)%TWO_PI;
          if(dirX<0){dirX+=TWO_PI}
          dirX-=PI
        }
        return[dirX,dirY]
      }
      case 23:{
        if(dirX>=PI||dirX<-PI){
          dirX=(dirX+PI)%TWO_PI;
          if(dirX<0){dirX+=TWO_PI}
          dirX-=PI
        }
        return[dirX*RAD_TO_DEG,dirY*RAD_TO_DEG]
      }
      case 31:{
        dirX*=DEG_TO_RAD;
        dirY*=DEG_TO_RAD;
        let cosPitch=Math.cos(dirY);
        return[-cosPitch*Math.sin(dirX),Math.sin(dirY),-cosPitch*Math.cos(dirX)]
      }
      case 32:{
        if(dirX>=180||dirX<-180){
          dirX=(dirX+180)%360;
          if(dirX<0){dirX+=360}
          dirX-=180
        }
        return[dirX*DEG_TO_RAD,dirY*DEG_TO_RAD]
      }
      case 33:{
        if(dirX>=180||dirX<-180){
          dirX=(dirX+180)%360;
          if(dirX<0){dirX+=360}
          dirX-=180
        }
        return[dirX,dirY]
      }
      default:{
        return null
      }
    }
  };
  _VR.offsetPosition=(start,direction,dtype,offset)=>{
    let dirType=dtype|0;
    if(dirType<1||dirType>3){dirType=_offset.dtype}
    let startOffset=offset;
    if(startOffset==null){startOffset=_offset.offset}
    _toUnitDirVec(direction,dirType);
    return[start[0]+_dirX*startOffset,start[1]+_dirY*startOffset,start[2]+_dirZ*startOffset]
  };
  _VR.castBlock=(start,direction,dtype,distance,offset,cell)=>{
    let dirType=dtype|0;
    if(dirType<1||dirType>3){dirType=_block.dtype}
    let maxDistance=distance;
    if(!(maxDistance>0)){maxDistance=_block.distance}
    let startOffset=offset;
    if(startOffset==null){startOffset=_block.offset}
    let cellSize=cell;
    if(!(cellSize>0)){cellSize=_block.cell}
    _toUnitDirVec(direction,dirType);
    let dirX=_dirX,
    dirY=_dirY,
    dirZ=_dirZ,
    startX=start[0]+dirX*startOffset,
    startY=start[1]+dirY*startOffset,
    startZ=start[2]+dirZ*startOffset,
    temp=startX/cellSize,
    voxelX=temp|0;
    voxelX-=temp<voxelX;
    temp=startY/cellSize;
    let voxelY=temp|0;
    voxelY-=temp<voxelY;
    temp=startZ/cellSize;
    let voxelZ=temp|0;
    voxelZ-=temp<voxelZ;
    let blockId=_getBlockId(voxelX,voxelY,voxelZ);
    if(blockId){
      return{
        blockId:blockId,
        inRange:!0,
        distance:0,
        point:[startX,startY,startZ],
        position:[voxelX,voxelY,voxelZ],
        normal:[0,0,0],
        adjacent:[voxelX,voxelY,voxelZ],
        steps:0
      }
    }
    let stepSignX=(dirX>0)-(dirX<0),
    stepSignY=(dirY>0)-(dirY<0),
    stepSignZ=(dirZ>0)-(dirZ<0),
    absDirX=dirX*stepSignX,
    absDirY=dirY*stepSignY,
    absDirZ=dirZ*stepSignZ,
    timeEpsilon=cellSize*1e-9,
    timeStrideX=INFINITY,
    timeStrideY=INFINITY,
    timeStrideZ=INFINITY,
    timeNextX=INFINITY,
    timeNextY=INFINITY,
    timeNextZ=INFINITY;
    if(absDirX!==0){
      timeStrideX=cellSize/absDirX;
      timeNextX=((voxelX+(stepSignX+1>>1))*cellSize-startX)/dirX+timeEpsilon
    }
    if(absDirY!==0){
      timeStrideY=cellSize/absDirY;
      timeNextY=((voxelY+(stepSignY+1>>1))*cellSize-startY)/dirY+timeEpsilon
    }
    if(absDirZ!==0){
      timeStrideZ=cellSize/absDirZ;
      timeNextZ=((voxelZ+(stepSignZ+1>>1))*cellSize-startZ)/dirZ+timeEpsilon
    }
    let maxTime=maxDistance+timeEpsilon,
    timeHit=0,
    axisIndex=0,
    inRange=!0,
    stepCount=0;
    while(!blockId&&inRange){
      stepCount++;
      if(timeNextX<timeNextY){
        if(timeNextX<timeNextZ){
          timeHit=timeNextX;
          voxelX+=stepSignX;
          timeNextX+=timeStrideX;
          axisIndex=0
        }else{
          timeHit=timeNextZ;
          voxelZ+=stepSignZ;
          timeNextZ+=timeStrideZ;
          axisIndex=2
        }
      }else{
        if(timeNextY<=timeNextZ){
          timeHit=timeNextY;
          voxelY+=stepSignY;
          timeNextY+=timeStrideY;
          axisIndex=1
        }else{
          timeHit=timeNextZ;
          voxelZ+=stepSignZ;
          timeNextZ+=timeStrideZ;
          axisIndex=2
        }
      }
      inRange=timeHit<=maxTime;
      blockId=_getBlockId(voxelX,voxelY,voxelZ)
    }
    let normalX=0,normalY=0,normalZ=0;
    if(axisIndex===0){
      normalX=-stepSignX
    }else if(axisIndex===1){
      normalY=-stepSignY
    }else{
      normalZ=-stepSignZ
    }
    return{
      blockId:blockId,
      inRange:inRange,
      distance:timeHit,
      point:[startX+dirX*timeHit,startY+dirY*timeHit,startZ+dirZ*timeHit],
      position:[voxelX,voxelY,voxelZ],
      normal:[normalX,normalY,normalZ],
      adjacent:[voxelX+normalX,voxelY+normalY,voxelZ+normalZ],
      steps:stepCount
    }
  };
  _VR.makeRect=(center,normal,ntype,width,height,rotation,rtype)=>{
    let normalType=ntype|0;
    if(normalType<1||normalType>3){normalType=_rect.ntype}
    let rectWidth=width;
    if(!(rectWidth>0)){rectWidth=_rect.width}
    let rectHeight=height;
    if(!(rectHeight>0)){rectHeight=_rect.height}
    let rectRotation=rotation;
    if(rectRotation==null){rectRotation=_rect.rotation}
    let rotationType=rtype|0;
    if(rotationType!==2&&rotationType!==3){rotationType=_rect.rtype}
    let rotU=0,rotV=0,rotN=0;
    if(typeof rectRotation==="number"){
      rotN=rectRotation
    }else{
      rotU=rectRotation[0]||0;
      rotV=rectRotation[1]||0;
      rotN=rectRotation[2]||0
    }
    if(rotationType===3){
      rotU*=DEG_TO_RAD;
      rotV*=DEG_TO_RAD;
      rotN*=DEG_TO_RAD
    }
    _toUnitDirVec(normal,normalType);
    let normalX=_dirX,
    normalY=_dirY,
    normalZ=_dirZ,
    axisX=0,axisY=0,axisZ=0;
    if(normalX<.9&&normalX>-.9){
      axisX=1
    }else{
      axisY=1
    }
    let basisUX=axisY*normalZ-axisZ*normalY,
    basisUY=axisZ*normalX-axisX*normalZ,
    basisUZ=axisX*normalY-axisY*normalX,
    inverseNormBasisU=1/(Math.sqrt(basisUX*basisUX+basisUY*basisUY+basisUZ*basisUZ)||1);
    basisUX*=inverseNormBasisU;
    basisUY*=inverseNormBasisU;
    basisUZ*=inverseNormBasisU;
    let basisVX=normalY*basisUZ-normalZ*basisUY,
    basisVY=normalZ*basisUX-normalX*basisUZ,
    basisVZ=normalX*basisUY-normalY*basisUX,
    cosAngle,sinAngle,rotatedX,rotatedY,rotatedZ;
    if(rotU){
      cosAngle=Math.cos(rotU);
      sinAngle=Math.sin(rotU);
      rotatedX=basisVX*cosAngle+normalX*sinAngle;
      rotatedY=basisVY*cosAngle+normalY*sinAngle;
      rotatedZ=basisVZ*cosAngle+normalZ*sinAngle;
      normalX=normalX*cosAngle-basisVX*sinAngle;
      normalY=normalY*cosAngle-basisVY*sinAngle;
      normalZ=normalZ*cosAngle-basisVZ*sinAngle;
      basisVX=rotatedX;
      basisVY=rotatedY;
      basisVZ=rotatedZ
    }
    if(rotV){
      cosAngle=Math.cos(rotV);
      sinAngle=Math.sin(rotV);
      rotatedX=basisUX*cosAngle-normalX*sinAngle;
      rotatedY=basisUY*cosAngle-normalY*sinAngle;
      rotatedZ=basisUZ*cosAngle-normalZ*sinAngle;
      normalX=normalX*cosAngle+basisUX*sinAngle;
      normalY=normalY*cosAngle+basisUY*sinAngle;
      normalZ=normalZ*cosAngle+basisUZ*sinAngle;
      basisUX=rotatedX;
      basisUY=rotatedY;
      basisUZ=rotatedZ
    }
    if(rotN){
      cosAngle=Math.cos(rotN);
      sinAngle=Math.sin(rotN);
      rotatedX=basisUX*cosAngle+basisVX*sinAngle;
      rotatedY=basisUY*cosAngle+basisVY*sinAngle;
      rotatedZ=basisUZ*cosAngle+basisVZ*sinAngle;
      basisVX=basisVX*cosAngle-basisUX*sinAngle;
      basisVY=basisVY*cosAngle-basisUY*sinAngle;
      basisVZ=basisVZ*cosAngle-basisUZ*sinAngle;
      basisUX=rotatedX;
      basisUY=rotatedY;
      basisUZ=rotatedZ
    }
    let edgeUX=basisUX*rectWidth,
    edgeUY=basisUY*rectWidth,
    edgeUZ=basisUZ*rectWidth,
    edgeVX=basisVX*rectHeight,
    edgeVY=basisVY*rectHeight,
    edgeVZ=basisVZ*rectHeight;
    return[
      center[0]-.5*edgeUX-.5*edgeVX,
      center[1]-.5*edgeUY-.5*edgeVY,
      center[2]-.5*edgeUZ-.5*edgeVZ,
      edgeUX,edgeUY,edgeUZ,
      edgeVX,edgeVY,edgeVZ,
      normalX,normalY,normalZ,
      1/(rectWidth*rectWidth),1/(rectHeight*rectHeight)
    ]
  };
  _VR.castRect=(rectangle,start,direction,dtype,distance,offset)=>{
    let dirType=dtype|0;
    if(dirType<1||dirType>3){dirType=_rect.dtype}
    let maxDistance=distance;
    if(!(maxDistance>0)){maxDistance=_rect.distance}
    let startOffset=offset;
    if(startOffset==null){startOffset=_rect.offset}
    _toUnitDirVec(direction,dirType);
    let dirX=_dirX,
    dirY=_dirY,
    dirZ=_dirZ,
    startX=start[0]+dirX*startOffset,
    startY=start[1]+dirY*startOffset,
    startZ=start[2]+dirZ*startOffset,
    originX=rectangle[0],
    originY=rectangle[1],
    originZ=rectangle[2],
    normalX=rectangle[9],
    normalY=rectangle[10],
    normalZ=rectangle[11],
    denominator=dirX*normalX+dirY*normalY+dirZ*normalZ;
    if(denominator*denominator<=1e-18){
      return{
        hit:!1,
        inRange:!1,
        distance:INFINITY,
        point:null,
        normal:null,
        uv:null
      }
    }
    let hitTime=((originX-startX)*normalX+(originY-startY)*normalY+(originZ-startZ)*normalZ)/denominator,
    timeEpsilon=maxDistance*1e-9;
    if(hitTime<-timeEpsilon||hitTime>maxDistance+timeEpsilon) {
      return{
        hit:!1,
        inRange:!1,
        distance:hitTime,
        point:null,
        normal:null,
        uv:null
      }
    }
    let pointX=startX+dirX*hitTime,
    pointY=startY+dirY*hitTime,
    pointZ=startZ+dirZ*hitTime,
    deltaX=pointX-originX,
    deltaY=pointY-originY,
    deltaZ=pointZ-originZ,
    rectU=(deltaX*rectangle[3]+deltaY*rectangle[4]+deltaZ*rectangle[5])*rectangle[12],
    rectV=(deltaX*rectangle[6]+deltaY*rectangle[7]+deltaZ*rectangle[8])*rectangle[13],
    isInRect=rectU>=-UV_EPSILON&&rectU<=1+UV_EPSILON&&rectV>=-UV_EPSILON&&rectV<=1+UV_EPSILON;
    if(!isInRect){
      return{
        hit:!1,
        inRange:!0,
        distance:hitTime,
        point:[pointX,pointY,pointZ],
        normal:null,
        uv:[rectU,rectV]
      }
    }
    if(denominator>0){
      normalX=-normalX;
      normalY=-normalY;
      normalZ=-normalZ
    }
    return{
      hit:!0,
      inRange:!0,
      distance:hitTime,
      point:[pointX,pointY,pointZ],
      normal:[normalX,normalY,normalZ],
      uv:[rectU,rectV]
    }
  };
  _VR.makeBox=(center,normal,ntype,width,height,depth,rotation,rtype)=>{
    let normalType=ntype|0;
    if(normalType<1||normalType>3){normalType=_box.ntype}
    let boxWidth=width;
    if(!(boxWidth>0)){boxWidth=_box.width}
    let boxHeight=height;
    if(!(boxHeight>0)){boxHeight=_box.height}
    let boxDepth=depth;
    if(!(boxDepth>0)){boxDepth=_box.depth}
    let boxRotation=rotation;
    if(boxRotation==null){boxRotation=_box.rotation}
    let rotationType=rtype|0;
    if(rotationType!==2&&rotationType!==3){rotationType=_box.rtype}
    let rotU=0,rotV=0,rotN=0;
    if(typeof boxRotation==="number"){
      rotN=boxRotation
    }else{
      rotU=boxRotation[0]||0;
      rotV=boxRotation[1]||0;
      rotN=boxRotation[2]||0
    }
    if(rotationType===3){
      rotU*=DEG_TO_RAD;
      rotV*=DEG_TO_RAD;
      rotN*=DEG_TO_RAD
    }
    _toUnitDirVec(normal,normalType);
    let normalX=_dirX,
    normalY=_dirY,
    normalZ=_dirZ,
    axisX=0,axisY=0,axisZ=0;
    if(normalX<.9&&normalX>-.9){
      axisX=1
    }else{
      axisY=1
    }
    let basisUX=axisY*normalZ-axisZ*normalY,
    basisUY=axisZ*normalX-axisX*normalZ,
    basisUZ=axisX*normalY-axisY*normalX,
    inverseNormBasisU=1/(Math.sqrt(basisUX*basisUX+basisUY*basisUY+basisUZ*basisUZ)||1);
    basisUX*=inverseNormBasisU;
    basisUY*=inverseNormBasisU;
    basisUZ*=inverseNormBasisU;
    let basisVX=normalY*basisUZ-normalZ*basisUY,
    basisVY=normalZ*basisUX-normalX*basisUZ,
    basisVZ=normalX*basisUY-normalY*basisUX,
    cosAngle,sinAngle,rotatedX,rotatedY,rotatedZ;
    if(rotU){
      cosAngle=Math.cos(rotU);
      sinAngle=Math.sin(rotU);
      rotatedX=basisVX*cosAngle+normalX*sinAngle;
      rotatedY=basisVY*cosAngle+normalY*sinAngle;
      rotatedZ=basisVZ*cosAngle+normalZ*sinAngle;
      normalX=normalX*cosAngle-basisVX*sinAngle;
      normalY=normalY*cosAngle-basisVY*sinAngle;
      normalZ=normalZ*cosAngle-basisVZ*sinAngle;
      basisVX=rotatedX;
      basisVY=rotatedY;
      basisVZ=rotatedZ
    }
    if(rotV){
      cosAngle=Math.cos(rotV);
      sinAngle=Math.sin(rotV);
      rotatedX=basisUX*cosAngle-normalX*sinAngle;
      rotatedY=basisUY*cosAngle-normalY*sinAngle;
      rotatedZ=basisUZ*cosAngle-normalZ*sinAngle;
      normalX=normalX*cosAngle+basisUX*sinAngle;
      normalY=normalY*cosAngle+basisUY*sinAngle;
      normalZ=normalZ*cosAngle+basisUZ*sinAngle;
      basisUX=rotatedX;
      basisUY=rotatedY;
      basisUZ=rotatedZ
    }
    if(rotN){
      cosAngle=Math.cos(rotN);
      sinAngle=Math.sin(rotN);
      rotatedX=basisUX*cosAngle+basisVX*sinAngle;
      rotatedY=basisUY*cosAngle+basisVY*sinAngle;
      rotatedZ=basisUZ*cosAngle+basisVZ*sinAngle;
      basisVX=basisVX*cosAngle-basisUX*sinAngle;
      basisVY=basisVY*cosAngle-basisUY*sinAngle;
      basisVZ=basisVZ*cosAngle-basisUZ*sinAngle;
      basisUX=rotatedX;
      basisUY=rotatedY;
      basisUZ=rotatedZ
    }
    let edgeUX=basisUX*boxWidth,
    edgeUY=basisUY*boxWidth,
    edgeUZ=basisUZ*boxWidth,
    edgeVX=basisVX*boxHeight,
    edgeVY=basisVY*boxHeight,
    edgeVZ=basisVZ*boxHeight,
    edgeWX=normalX*boxDepth,
    edgeWY=normalY*boxDepth,
    edgeWZ=normalZ*boxDepth;
    return[
      center[0]-.5*edgeUX-.5*edgeVX-.5*edgeWX,
      center[1]-.5*edgeUY-.5*edgeVY-.5*edgeWY,
      center[2]-.5*edgeUZ-.5*edgeVZ-.5*edgeWZ,
      edgeUX,edgeUY,edgeUZ,
      edgeVX,edgeVY,edgeVZ,
      edgeWX,edgeWY,edgeWZ,
      basisUX,basisUY,basisUZ,
      basisVX,basisVY,basisVZ,
      normalX,normalY,normalZ,
      1/(boxWidth*boxWidth),1/(boxHeight*boxHeight),1/(boxDepth*boxDepth)
    ]
  };
  _VR.castBox=(box,start,direction,dtype,distance,offset)=>{
    let dirType=dtype|0;
    if(dirType<1||dirType>3){dirType=_box.dtype}
    let maxDistance=distance;
    if(!(maxDistance>0)){maxDistance=_box.distance}
    let startOffset=offset;
    if(startOffset==null){startOffset=_box.offset}
    _toUnitDirVec(direction,dirType);
    let dirX=_dirX,
    dirY=_dirY,
    dirZ=_dirZ,
    startX=start[0]+dirX*startOffset,
    startY=start[1]+dirY*startOffset,
    startZ=start[2]+dirZ*startOffset,
    deltaX=startX-box[0],
    deltaY=startY-box[1],
    deltaZ=startZ-box[2],
    uStart=(deltaX*box[3]+deltaY*box[4]+deltaZ*box[5])*box[21],
    vStart=(deltaX*box[6]+deltaY*box[7]+deltaZ*box[8])*box[22],
    wStart=(deltaX*box[9]+deltaY*box[10]+deltaZ*box[11])*box[23],
    uRate=(dirX*box[3]+dirY*box[4]+dirZ*box[5])*box[21],
    vRate=(dirX*box[6]+dirY*box[7]+dirZ*box[8])*box[22],
    wRate=(dirX*box[9]+dirY*box[10]+dirZ*box[11])*box[23],
    enterTime=-INFINITY,
    exitTime=INFINITY,
    enterAxisIndex=-1,
    exitAxisIndex=-1,
    enterFaceSign=0,
    exitFaceSign=0,
    axisEnterTime,axisExitTime,axisEnterSign,axisExitSign,temp;
    if(uRate*uRate<=1e-18){
      if(uStart<0||uStart>1){
        return{
          hit:!1,
          inRange:!1,
          distance:INFINITY,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }else{
      axisEnterTime=-uStart/uRate;
      axisExitTime=(1-uStart)/uRate;
      axisEnterSign=-1;
      axisExitSign=1;
      if(axisEnterTime>axisExitTime){
        temp=axisEnterTime;
        axisEnterTime=axisExitTime;
        axisExitTime=temp;
        axisEnterSign=1;
        axisExitSign=-1
      }
      if(axisEnterTime>enterTime){
        enterTime=axisEnterTime;
        enterAxisIndex=0;
        enterFaceSign=axisEnterSign
      }
      if(axisExitTime<exitTime){
        exitTime=axisExitTime;
        exitAxisIndex=0;
        exitFaceSign=axisExitSign
      }
      if(enterTime>exitTime){
        return{
          hit:!1,
          inRange:!1,
          distance:INFINITY,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }
    if(vRate*vRate<=1e-18){
      if(vStart<0||vStart>1){
        return{
          hit:!1,
          inRange:!1,
          distance:INFINITY,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }else{
      axisEnterTime=-vStart/vRate;
      axisExitTime=(1-vStart)/vRate;
      axisEnterSign=-1;
      axisExitSign=1;
      if(axisEnterTime>axisExitTime){
        temp=axisEnterTime;
        axisEnterTime=axisExitTime;
        axisExitTime=temp;
        axisEnterSign=1;
        axisExitSign=-1
      }
      if(axisEnterTime>enterTime){
        enterTime=axisEnterTime;
        enterAxisIndex=1;
        enterFaceSign=axisEnterSign
      }
      if(axisExitTime<exitTime){
        exitTime=axisExitTime;
        exitAxisIndex=1;
        exitFaceSign=axisExitSign
      }
      if(enterTime>exitTime){
        return{
          hit:!1,
          inRange:!1,
          distance:INFINITY,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }
    if(wRate*wRate<=1e-18){
      if(wStart<0||wStart>1){
        return{
          hit:!1,
          inRange:!1,
          distance:INFINITY,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }else{
      axisEnterTime=-wStart/wRate;
      axisExitTime=(1-wStart)/wRate;
      axisEnterSign=-1;
      axisExitSign=1;
      if(axisEnterTime>axisExitTime){
        temp=axisEnterTime;
        axisEnterTime=axisExitTime;
        axisExitTime=temp;
        axisEnterSign=1;
        axisExitSign=-1
      }
      if(axisEnterTime>enterTime){
        enterTime=axisEnterTime;
        enterAxisIndex=2;
        enterFaceSign=axisEnterSign
      }
      if(axisExitTime<exitTime){
        exitTime=axisExitTime;
        exitAxisIndex=2;
        exitFaceSign=axisExitSign
      }
      if(enterTime>exitTime){
        return{
          hit:!1,
          inRange:!1,
          distance:INFINITY,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }
    let timeEpsilon=maxDistance*1e-9,
    hitTime=enterTime,
    hitAxisIndex=enterAxisIndex,
    hitFaceSign=enterFaceSign;
    if(hitTime<-timeEpsilon){
      hitTime=exitTime;
      hitAxisIndex=exitAxisIndex;
      hitFaceSign=exitFaceSign
    }
    if(hitTime<-timeEpsilon||hitTime>maxDistance+timeEpsilon) {
      return{
        hit:!1,
        inRange:!1,
        distance:hitTime,
        point:null,
        normal:null,
        uvw:null
      }
    }
    let hitNormalX=0,hitNormalY=0,hitNormalZ=0;
    if(hitAxisIndex===0){
      hitNormalX=box[12]*hitFaceSign;
      hitNormalY=box[13]*hitFaceSign;
      hitNormalZ=box[14]*hitFaceSign
    }else if(hitAxisIndex===1){
      hitNormalX=box[15]*hitFaceSign;
      hitNormalY=box[16]*hitFaceSign;
      hitNormalZ=box[17]*hitFaceSign
    }else{
      hitNormalX=box[18]*hitFaceSign;
      hitNormalY=box[19]*hitFaceSign;
      hitNormalZ=box[20]*hitFaceSign
    }
    return{
      hit:!0,
      inRange:!0,
      distance:hitTime,
      point:[startX+dirX*hitTime,startY+dirY*hitTime,startZ+dirZ*hitTime],
      normal:[hitNormalX,hitNormalY,hitNormalZ],
      uvw:[uStart+uRate*hitTime,vStart+vRate*hitTime,wStart+wRate*hitTime]
    }
  };
  globalThis.VR=_VR;
  void 0
}

// Player Tracker
{
  let _PT={
    join:()=>{},
    leave:()=>{},
    ids:null,
    checkValid:Object.create(null),
    _playerIds:[],
    id_to_name:Object.create(null),
    name_to_id:Object.create(null),
    id_to_dbid:Object.create(null),
    dbid_to_id:Object.create(null),
    positions:null,
    crouching:null,
    update:0xffffffff,
    onPlayerJoin:null,
    onPlayerLeave:null,
    tick:null
  };
  let _stateById=Object.create(null),
  _presentIds=_PT._playerIds,
  _presentById=_PT.checkValid,
  _positions=Object.create(null),
  _crouching=Object.create(null),
  _presentGeneration=1,
  _positionsUpdate=1,
  _crouchingUpdate=1,
  _IdToName=_PT.id_to_name,
  _NameToId=_PT.name_to_id,
  _IdToDbId=_PT.id_to_dbid,
  _DbIdToId=_PT.dbid_to_id,
  _getPlayerIds=api.getPlayerIds,
  _getPosition=api.getPosition,
  _isPlayerCrouching=api.isPlayerCrouching;
  _PT.ids=()=>_presentIds.slice();
  _PT.positions=()=>{
    if(_positionsUpdate){
      let index=0,
      count=_presentIds.length,
      playerId;
      while(index<count){
        playerId=_presentIds[index];
        _positions[playerId]=_getPosition(playerId);
        index++
      }
      _positionsUpdate=0
    }
    return _positions
  };
  _PT.crouching=()=>{
    if(_crouchingUpdate){
      let index=0,
      count=_presentIds.length,
      playerId;
      while(index<count){
        playerId=_presentIds[index];
        _crouching[playerId]=_isPlayerCrouching(playerId);
        index++
      }
      _crouchingUpdate=0
    }
    return _crouching
  };
  _PT.onPlayerJoin=playerId=>{
    let state=_stateById[playerId];
    if(state===void 0){state=_stateById[playerId]=3>>0}
    if(state&1){
      try{
        let name=api.getEntityName(playerId),
        dbid=api.getPlayerDbId(playerId);
        if(!_presentById[playerId]){
          let index=_presentIds.length;
          _presentIds[index]=playerId;
          _presentById[playerId]=index+1
        }
        _IdToName[playerId]=name;
        _NameToId[name]=playerId;
        _IdToDbId[playerId]=dbid;
        _DbIdToId[dbid]=playerId;
        _positionsUpdate=1;
        _crouchingUpdate=1;
        _PT.update=0xffffffff;
        _PT.join(playerId);
        _stateById[playerId]=state&=~1
      }catch(error){
        _stateById[playerId]=state&=~1;
        api.broadcastMessage("Player Tracker: Join handler error: "+error.name+": "+error.message,{color:"#ff9d87"})
      }
    }
  };
  _PT.onPlayerLeave=playerId=>{
    let mapIndex=_presentById[playerId];
    if(!mapIndex){
      delete _stateById[playerId];
      return
    }
    let state=_stateById[playerId]>>>0;
    if(state&2){
      try{
        _PT.leave(playerId);
        _stateById[playerId]=state&=~2
      }catch(error){
        _stateById[playerId]=state&=~2;
        api.broadcastMessage("Player Tracker: Leave handler error: "+error.name+": "+error.message,{color:"#ff9d87"})
      }
    }
    let lastIndex=_presentIds.length-1,
    lastPlayerId=_presentIds[lastIndex];
    if(lastPlayerId!==playerId){
      _presentIds[mapIndex-1]=lastPlayerId;
      _presentById[lastPlayerId]=mapIndex
    }
    _presentIds.length=lastIndex;
    delete _presentById[playerId];
    delete _stateById[playerId];
    let name=_IdToName[playerId],
    dbid=_IdToDbId[playerId];
    delete _IdToName[playerId];
    delete _NameToId[name];
    delete _IdToDbId[playerId];
    delete _DbIdToId[dbid];
    delete _positions[playerId];
    delete _crouching[playerId];
    _positionsUpdate=1;
    _crouchingUpdate=1;
    _PT.update=0xffffffff
  };
  _PT.tick=()=>{
    let newPlayerIds=_getPlayerIds(),
    scanLength=newPlayerIds.length,
    nextPresentGen=_presentGeneration+1,
    scanIndex=0,presentIndex=0,
    playerId,state;
    while(scanIndex<scanLength){
      playerId=newPlayerIds[scanIndex];
      state=_stateById[playerId]??3;
      if(!_presentById[playerId]){
        let index=_presentIds.length;
        _presentIds[index]=playerId;
        _presentById[playerId]=index+1
      }
      if(!(state&2)){state=3}
      _stateById[playerId]=state=nextPresentGen<<2|state&3;
      scanIndex++
    }
    while(presentIndex<_presentIds.length){
      playerId=_presentIds[presentIndex];
      state=_stateById[playerId];
      if(state>>>2===nextPresentGen){
        if(state&1){
          try{
            let name=api.getEntityName(playerId),
            dbid=api.getPlayerDbId(playerId);
            _IdToName[playerId]=name;
            _NameToId[name]=playerId;
            _IdToDbId[playerId]=dbid;
            _DbIdToId[dbid]=playerId;
            _PT.join(playerId);
            _stateById[playerId]=state&=~1
          }catch(error){
            _stateById[playerId]=state&=~1;
            api.broadcastMessage("Player Tracker: Join handler error: "+error.name+": "+error.message,{color:"#ff9d87"})
          }
        }
        presentIndex++;
        continue
      }
      if(state&2){
        try{
          _PT.leave(playerId);
          _stateById[playerId]=state&=~2
        }catch(error){
          _stateById[playerId]=state&=~2;
          api.broadcastMessage("Player Tracker: Leave handler error: "+error.name+": "+error.message,{color:"#ff9d87"})
        }
      }
      let lastIndex=_presentIds.length-1,
      lastPlayerId=_presentIds[lastIndex];
      if(lastIndex!==presentIndex){
        _presentIds[presentIndex]=lastPlayerId;
        _presentById[lastPlayerId]=presentIndex+1
      }
      _presentIds.length=lastIndex;
      delete _presentById[playerId];
      delete _stateById[playerId];
      let name=_IdToName[playerId],
      dbid=_IdToDbId[playerId];
      delete _IdToName[playerId];
      delete _NameToId[name];
      delete _IdToDbId[playerId];
      delete _DbIdToId[dbid];
      delete _positions[playerId];
      delete _crouching[playerId]
    }
    _positionsUpdate=1;
    _crouchingUpdate=1;
    _PT.update=0xffffffff;
    _presentGeneration=nextPresentGen
  };
  Object.seal(_PT);
  globalThis.PT=_PT;
  void 0
}

// Voxel Raycaster [player] (extended)
{
  let _VR=globalThis.VR,
  _PT=globalThis.PT,
  INFINITY=1e9,
  DEG_TO_RAD=.017453292519943295,
  DIR_EPSILON_SQUARED=1e-18,
  _crouchLeanRad=Math.atan2(.26,.64),
  _crouchLeanCos=Math.cos(_crouchLeanRad),
  _crouchLeanSin=Math.sin(_crouchLeanRad),
  _AABB=Object.create(null),
  _ignoreMap=Object.create(null),
  _ignoreGeneration=1,
  _hitAxisIndex=0,
  _hitFaceSign=0,
  _normalX=0,
  _normalY=0,
  _normalZ=0,
  _playerPositions=null,
  _playerCrouching=null,
  _player=_VR.defaults.player={dtype:1,distance:6,offset:0},
  _playerIds=_PT._playerIds,
  _checkValid=_PT.checkValid,
  _getPlayerFacingInfo=api.getPlayerFacingInfo;
  let _setNormalFromYaw=(axisIndex,faceSign,bodyX,bodyZ)=>{
    if(axisIndex===0){
      _normalX=bodyZ*faceSign;
      _normalY=0;
      _normalZ=-bodyX*faceSign;
      return
    }
    if(axisIndex===1){
      _normalX=0;
      _normalY=faceSign;
      _normalZ=0;
      return
    }
    _normalX=bodyX*faceSign;
    _normalY=0;
    _normalZ=bodyZ*faceSign
  },
  _setNormalFromAxes=(axisIndex,faceSign,axis0X,axis0Y,axis0Z,axis1X,axis1Y,axis1Z,axis2X,axis2Y,axis2Z,bodyX,bodyZ)=>{
    let bodyNormalX,bodyNormalY,bodyNormalZ;
    if(axisIndex===0){
      bodyNormalX=axis0X;
      bodyNormalY=axis0Y;
      bodyNormalZ=axis0Z
    }else if(axisIndex===1){
      bodyNormalX=axis1X;
      bodyNormalY=axis1Y;
      bodyNormalZ=axis1Z
    }else{
      bodyNormalX=axis2X;
      bodyNormalY=axis2Y;
      bodyNormalZ=axis2Z
    }
    bodyNormalX*=faceSign;
    bodyNormalY*=faceSign;
    bodyNormalZ*=faceSign;
    _normalX=bodyZ*bodyNormalX+bodyX*bodyNormalZ;
    _normalY=bodyNormalY;
    _normalZ=-bodyX*bodyNormalX+bodyZ*bodyNormalZ
  },
  _intersectAABB=(minX,minY,minZ,maxX,maxY,maxZ,startX,startY,startZ,dirX,dirY,dirZ)=>{
    let enterTime=-INFINITY,
    exitTime=INFINITY,
    enterAxisIndex=-1,
    exitAxisIndex=-1,
    enterFaceSign=0,
    exitFaceSign=0,
    axisEnterTime,axisExitTime,axisEnterFaceSign,axisExitFaceSign,temp;
    if(dirX*dirX<=DIR_EPSILON_SQUARED){
      if(startX<minX||startX>maxX){return INFINITY}
    }else{
      axisEnterTime=(minX-startX)/dirX;
      axisExitTime=(maxX-startX)/dirX;
      axisEnterFaceSign=-1;
      axisExitFaceSign=1;
      if(axisEnterTime>axisExitTime){
        temp=axisEnterTime;
        axisEnterTime=axisExitTime;
        axisExitTime=temp;
        axisEnterFaceSign=1;
        axisExitFaceSign=-1
      }
      if(axisEnterTime>enterTime){
        enterTime=axisEnterTime;
        enterAxisIndex=0;
        enterFaceSign=axisEnterFaceSign
      }
      if(axisExitTime<exitTime){
        exitTime=axisExitTime;
        exitAxisIndex=0;
        exitFaceSign=axisExitFaceSign
      }
      if(enterTime>exitTime){return INFINITY}
    }
    if(dirY*dirY<=DIR_EPSILON_SQUARED){
      if(startY<minY||startY>maxY){return INFINITY}
    }else{
      axisEnterTime=(minY-startY)/dirY;
      axisExitTime=(maxY-startY)/dirY;
      axisEnterFaceSign=-1;
      xisExitFaceSign=1;
      if(axisEnterTime>axisExitTime){
        temp=axisEnterTime;
        axisEnterTime=axisExitTime;
        axisExitTime=temp;
        axisEnterFaceSign=1;
        axisExitFaceSign=-1
      }
      if(axisEnterTime>enterTime){
        enterTime=axisEnterTime;
        enterAxisIndex=1;
        enterFaceSign=axisEnterFaceSign
      }
      if(axisExitTime<exitTime){
        exitTime=axisExitTime;
        exitAxisIndex=1;
        exitFaceSign=axisExitFaceSign
      }
      if(enterTime>exitTime){return INFINITY}
    }
    if(dirZ*dirZ<=DIR_EPSILON_SQUARED){
      if(startZ<minZ||startZ>maxZ){return INFINITY}
    }else{
      axisEnterTime=(minZ-startZ)/dirZ;
      axisExitTime=(maxZ-startZ)/dirZ;
      axisEnterFaceSign=-1;
      axisExitFaceSign=1;
      if(axisEnterTime>axisExitTime){
        temp=axisEnterTime;
        axisEnterTime=axisExitTime;
        axisExitTime=temp;
        axisEnterFaceSign=1;
        axisExitFaceSign=-1
      }
      if(axisEnterTime>enterTime){
        enterTime=axisEnterTime;
        enterAxisIndex=2;
        enterFaceSign=axisEnterFaceSign
      }
      if(axisExitTime<exitTime){
        exitTime=axisExitTime;
        exitAxisIndex=2;
        exitFaceSign=axisExitFaceSign
      }if(enterTime>exitTime){return INFINITY}
    }
    let hitTime=enterTime,
    axisIndex=enterAxisIndex,
    faceSign=enterFaceSign;
    if(hitTime<0){
      hitTime=exitTime;
      axisIndex=exitAxisIndex;
      faceSign=exitFaceSign
    }
    if(axisIndex<0){return INFINITY}
    _hitAxisIndex=axisIndex;
    _hitFaceSign=faceSign;
    return hitTime
  };
  _VR.castPlayer=(ignore,start,direction,dtype,distance,offset)=>{
    let dirType=dtype|0;
    if(dirType<1||dirType>3){dirType=_player.dtype}
    let maxDistance=distance;
    if(!(maxDistance>0)){maxDistance=_player.distance}
    let startOffset=offset;
    if(startOffset==null){startOffset=_player.offset}
    let playerIndex=0,
    playerCount=_playerIds.length;
    _playerPositions=_PT.positions();
    _playerCrouching=_PT.crouching();
    if(_PT.update&1){
      let playerId,position,isCrouching,x,y,z,aabb;
      playerIndex=0;
      while(playerIndex<playerCount){
        playerId=_playerIds[playerIndex];
        position=_playerPositions[playerId];
        isCrouching=_playerCrouching[playerId];
        x=position[0];
        y=position[1];
        z=position[2];
        aabb=_AABB[playerId];
        if(!aabb){
          aabb=_AABB[playerId]=[0,0,0,0,0,0]
        }
        if(isCrouching){
          aabb[0]=x-.94;
          aabb[1]=y;
          aabb[2]=z-.94;
          aabb[3]=x+.94;
          aabb[4]=y+2.01;
          aabb[5]=z+.94
        }else{
          aabb[0]=x-.5;
          aabb[1]=y;
          aabb[2]=z-.5;
          aabb[3]=x+.5;
          aabb[4]=y+2.06;
          aabb[5]=z+.5
        }
        playerIndex++
      }
      _PT.update&=~1
    }
    _ignoreGeneration+=1;
    if(ignore&&ignore.length>0){
      let ignoreIndex=0,
      ignoreCount=ignore.length,
      playerId;
      while(ignoreIndex<ignoreCount){
        playerId=ignore[ignoreIndex];
        if(_checkValid[playerId]){
          _ignoreMap[playerId]=_ignoreGeneration
        }
        ignoreIndex++
      }
    }
    let dirX,dirY,dirZ;
    if(dirType===1){
      dirX=direction[0];
      dirY=direction[1];
      dirZ=direction[2];
      let normSquared=dirX*dirX+dirY*dirY+dirZ*dirZ;
      if(normSquared<.999999||normSquared>1.000001){
        let inverseNorm=1/Math.sqrt(normSquared);
        dirX*=inverseNorm;
        dirY*=inverseNorm;
        dirZ*=inverseNorm
      }
    }else{
      let dirYaw=direction[0],
      dirPitch=direction[1];
      if(dirType===3){
        dirYaw*=DEG_TO_RAD;
        dirPitch*=DEG_TO_RAD
      }
      let cosPitch=Math.cos(dirPitch);
      dirX=-cosPitch*Math.sin(dirYaw);
      dirY=Math.sin(dirPitch);
      dirZ=-cosPitch*Math.cos(dirYaw)
    }
    let startX=start[0]+dirX*startOffset,
    startY=start[1]+dirY*startOffset,
    startZ=start[2]+dirZ*startOffset,
    timeEpsilon=maxDistance*1e-9,
    maxTime=maxDistance+timeEpsilon,
    bestHitPlayerId=null,
    bestHitPartName=null,
    bestHitTime=INFINITY,
    bestHitNormalX=0,
    bestHitNormalY=0,
    bestHitNormalZ=0,
    playerId,aabb,enterTime,exitTime,axisEnterTime,axisExitTime,temp,broadHitTime;
    playerIndex=0;
    while(playerIndex<playerCount){
      playerId=_playerIds[playerIndex];
      playerIndex++;
      if(_ignoreMap[playerId]===_ignoreGeneration){continue}
      aabb=_AABB[playerId];
      enterTime=-INFINITY;
      exitTime=INFINITY;
      if(dirX*dirX<=DIR_EPSILON_SQUARED){
        if(startX<aabb[0]||startX>aabb[3]){continue}
      }else{
        axisEnterTime=(aabb[0]-startX)/dirX;
        axisExitTime=(aabb[3]-startX)/dirX;
        if(axisEnterTime>axisExitTime){
          temp=axisEnterTime;
          axisEnterTime=axisExitTime;
          axisExitTime=temp
        }
        if(axisEnterTime>enterTime){enterTime=axisEnterTime}
        if(axisExitTime<exitTime){exitTime=axisExitTime}
        if(enterTime>exitTime){continue}
      }
      if(dirY*dirY<=DIR_EPSILON_SQUARED){
        if(startY<aabb[1]||startY>aabb[4]){continue}
      }else{
        axisEnterTime=(aabb[1]-startY)/dirY;
        axisExitTime=(aabb[4]-startY)/dirY;
        if(axisEnterTime>axisExitTime){
          temp=axisEnterTime;
          axisEnterTime=axisExitTime;
          axisExitTime=temp
        }
        if(axisEnterTime>enterTime){enterTime=axisEnterTime}
        if(axisExitTime<exitTime){exitTime=axisExitTime}
        if(enterTime>exitTime){continue}
      }
      if(dirZ*dirZ<=DIR_EPSILON_SQUARED){
        if(startZ<aabb[2]||startZ>aabb[5]){continue}
      }else{
        axisEnterTime=(aabb[2]-startZ)/dirZ;
        axisExitTime=(aabb[5]-startZ)/dirZ;
        if(axisEnterTime>axisExitTime){
          temp=axisEnterTime;
          axisEnterTime=axisExitTime;
          axisExitTime=temp
        }
        if(axisEnterTime>enterTime){enterTime=axisEnterTime}
        if(axisExitTime<exitTime){exitTime=axisExitTime}
        if(enterTime>exitTime){continue}
      }
      if(exitTime<0){continue}
      broadHitTime=enterTime>0?enterTime:0;
      if(broadHitTime>maxTime||broadHitTime>bestHitTime){continue}
      let position=_playerPositions[playerId],
      isCrouching=_playerCrouching[playerId],
      facingDirection=_getPlayerFacingInfo(playerId).dir,
      facingDirX=facingDirection[0],
      facingDirY=facingDirection[1],
      facingDirZ=facingDirection[2],
      cosPitch=Math.sqrt(facingDirX*facingDirX+facingDirZ*facingDirZ),
      sinPitch=facingDirY,
      bodyX=facingDirX/cosPitch,
      bodyZ=facingDirZ/cosPitch,
      deltaX=startX-position[0],
      deltaY=startY-position[1],
      deltaZ=startZ-position[2],
      bodyDirX=dirX*bodyZ+dirZ*-bodyX,
      bodyDirY=dirY,
      bodyDirZ=dirX*bodyX+dirZ*bodyZ,
      bodyStartX=deltaX*bodyZ+deltaZ*-bodyX,
      bodyStartY=deltaY,
      bodyStartZ=deltaX*bodyX+deltaZ*bodyZ,
      hitTime,axisIndex,faceSign;
      if(!isCrouching){
        hitTime=_intersectAABB(-.25,.75,-.125,.25,1.44,.125,bodyStartX,bodyStartY,bodyStartZ,bodyDirX,bodyDirY,bodyDirZ);
        if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
          axisIndex=_hitAxisIndex;
          faceSign=_hitFaceSign;
          _setNormalFromYaw(axisIndex,faceSign,bodyX,bodyZ);
          bestHitTime=hitTime;
          bestHitPlayerId=playerId;
          bestHitPartName="Torso";
          bestHitNormalX=_normalX;
          bestHitNormalY=_normalY;
          bestHitNormalZ=_normalZ
        }
        hitTime=_intersectAABB(.25,.62,-.125,.5,1.44,.125,bodyStartX,bodyStartY,bodyStartZ,bodyDirX,bodyDirY,bodyDirZ);
        if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
          axisIndex=_hitAxisIndex;
          faceSign=_hitFaceSign;
          _setNormalFromYaw(axisIndex,faceSign,bodyX,bodyZ);
          bestHitTime=hitTime;
          bestHitPlayerId=playerId;
          bestHitPartName="ArmRight";
          bestHitNormalX=_normalX;
          bestHitNormalY=_normalY;
          bestHitNormalZ=_normalZ
        }
        hitTime=_intersectAABB(-.5,.62,-.125,-.25,1.44,.125,bodyStartX,bodyStartY,bodyStartZ,bodyDirX,bodyDirY,bodyDirZ);
        if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
          axisIndex=_hitAxisIndex;
          faceSign=_hitFaceSign;
          _setNormalFromYaw(axisIndex,faceSign,bodyX,bodyZ);
          bestHitTime=hitTime;
          bestHitPlayerId=playerId;
          bestHitPartName="ArmLeft";
          bestHitNormalX=_normalX;
          bestHitNormalY=_normalY;
          bestHitNormalZ=_normalZ
        }
      }else{
        let relativeX,relativeY,relativeZ,
        partStartX,partStartY,partStartZ,
        partDirX,partDirY,partDirZ;
        relativeX=bodyStartX;
        relativeY=bodyStartY-1.07;
        relativeZ=bodyStartZ-.13;
        partStartX=relativeX;
        partStartY=relativeY*_crouchLeanCos+relativeZ*_crouchLeanSin;
        partStartZ=-relativeY*_crouchLeanSin+relativeZ*_crouchLeanCos;
        partDirX=bodyDirX;
        partDirY=bodyDirY*_crouchLeanCos+bodyDirZ*_crouchLeanSin;
        partDirZ=-bodyDirY*_crouchLeanSin+bodyDirZ*_crouchLeanCos;
        hitTime=_intersectAABB(-.25,-.37,-.125,.25,.37,.125,partStartX,partStartY,partStartZ,partDirX,partDirY,partDirZ);
        if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
          axisIndex=_hitAxisIndex;
          faceSign=_hitFaceSign;
          _setNormalFromAxes(axisIndex,faceSign,1,0,0,0,_crouchLeanCos,_crouchLeanSin,0,-_crouchLeanSin,_crouchLeanCos,bodyX,bodyZ);
          bestHitTime=hitTime;
          bestHitPlayerId=playerId;
          bestHitPartName="Torso";
          bestHitNormalX=_normalX;
          bestHitNormalY=_normalY;
          bestHitNormalZ=_normalZ
        }
        relativeX=bodyStartX-.375;
        relativeY=bodyStartY-1.035;
        relativeZ=bodyStartZ-.105;
        partStartX=relativeX;
        partStartY=relativeY*_crouchLeanCos+relativeZ*_crouchLeanSin;
        partStartZ=-relativeY*_crouchLeanSin+relativeZ*_crouchLeanCos;
        partDirX=bodyDirX;
        partDirY=bodyDirY*_crouchLeanCos+bodyDirZ*_crouchLeanSin;
        partDirZ=-bodyDirY*_crouchLeanSin+bodyDirZ*_crouchLeanCos;
        hitTime=_intersectAABB(-.125,-.405,-.125,.125,.405,.125,partStartX,partStartY,partStartZ,partDirX,partDirY,partDirZ);
        if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
          axisIndex=_hitAxisIndex;
          faceSign=_hitFaceSign;
          _setNormalFromAxes(axisIndex,faceSign,1,0,0,0,_crouchLeanCos,_crouchLeanSin,0,-_crouchLeanSin,_crouchLeanCos,bodyX,bodyZ);
          bestHitTime=hitTime;
          bestHitPlayerId=playerId;
          bestHitPartName="ArmRight";
          bestHitNormalX=_normalX;
          bestHitNormalY=_normalY;
          bestHitNormalZ=_normalZ
        }
        relativeX=bodyStartX+.375;
        relativeY=bodyStartY-1.035;
        relativeZ=bodyStartZ-.105;
        partStartX=relativeX;
        partStartY=relativeY*_crouchLeanCos+relativeZ*_crouchLeanSin;
        partStartZ=-relativeY*_crouchLeanSin+relativeZ*_crouchLeanCos;
        partDirX=bodyDirX;
        partDirY=bodyDirY*_crouchLeanCos+bodyDirZ*_crouchLeanSin;
        partDirZ=-bodyDirY*_crouchLeanSin+bodyDirZ*_crouchLeanCos;
        hitTime=_intersectAABB(-.125,-.405,-.125,.125,.405,.125,partStartX,partStartY,partStartZ,partDirX,partDirY,partDirZ);
        if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
          axisIndex=_hitAxisIndex;
          faceSign=_hitFaceSign;
          _setNormalFromAxes(axisIndex,faceSign,1,0,0,0,_crouchLeanCos,_crouchLeanSin,0,-_crouchLeanSin,_crouchLeanCos,bodyX,bodyZ);
          bestHitTime=hitTime;
          bestHitPlayerId=playerId;
          bestHitPartName="ArmLeft";
          bestHitNormalX=_normalX;
          bestHitNormalY=_normalY;
          bestHitNormalZ=_normalZ
        }
      }
      hitTime=_intersectAABB(0,0,-.125,.25,.75,.125,bodyStartX,bodyStartY,bodyStartZ,bodyDirX,bodyDirY,bodyDirZ);
      if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
        axisIndex=_hitAxisIndex;
        faceSign=_hitFaceSign;
        _setNormalFromYaw(axisIndex,faceSign,bodyX,bodyZ);
        bestHitTime=hitTime;
        bestHitPlayerId=playerId;
        bestHitPartName="LegRight";
        bestHitNormalX=_normalX;
        bestHitNormalY=_normalY;
        bestHitNormalZ=_normalZ
      }
      hitTime=_intersectAABB(-.25,0,-.125,0,.75,.125,bodyStartX,bodyStartY,bodyStartZ,bodyDirX,bodyDirY,bodyDirZ);
      if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
        axisIndex=_hitAxisIndex;
        faceSign=_hitFaceSign;
        _setNormalFromYaw(axisIndex,faceSign,bodyX,bodyZ);
        bestHitTime=hitTime;
        bestHitPlayerId=playerId;
        bestHitPartName="LegLeft";
        bestHitNormalX=_normalX;
        bestHitNormalY=_normalY;
        bestHitNormalZ=_normalZ
      }
      let headBottomY=isCrouching?1.39:1.44,
      headAnchorZ=isCrouching?.26:0,
      relativeX=bodyStartX,
      relativeY=bodyStartY-(headBottomY+.28),
      relativeZ=bodyStartZ-headAnchorZ,
      headStartX=relativeX,
      headStartY=relativeY*cosPitch+relativeZ*sinPitch,
      headStartZ=-relativeY*sinPitch+relativeZ*cosPitch,
      headDirX=bodyDirX,
      headDirY=bodyDirY*cosPitch+bodyDirZ*sinPitch,
      headDirZ=-bodyDirY*sinPitch+bodyDirZ*cosPitch;
      hitTime=_intersectAABB(-.28,-.28,-.28,.28,.28,.28,headStartX,headStartY,headStartZ,headDirX,headDirY,headDirZ);
      if(hitTime>=-timeEpsilon&&hitTime<=maxTime&&hitTime<bestHitTime){
        axisIndex=_hitAxisIndex;
        faceSign=_hitFaceSign;
        _setNormalFromAxes(axisIndex,faceSign,1,0,0,0,cosPitch,sinPitch,0,-sinPitch,cosPitch,bodyX,bodyZ);
        bestHitTime=hitTime;
        bestHitPlayerId=playerId;
        bestHitPartName="Head";
        bestHitNormalX=_normalX;
        bestHitNormalY=_normalY;
        bestHitNormalZ=_normalZ
      }
    }
    if(!bestHitPlayerId){
      return{
        playerId:null,
        inRange:!1,
        distance:INFINITY,
        point:null,
        normal:null,
        part:null
      }
    }
    return{
      playerId:bestHitPlayerId,
      inRange:!0,
      distance:bestHitTime,
      point:[startX+dirX*bestHitTime,startY+dirY*bestHitTime,startZ+dirZ*bestHitTime],
      normal:[bestHitNormalX,bestHitNormalY,bestHitNormalZ],
      part:bestHitPartName
    }
  };
  _VR.onPlayerJoin=playerId=>{
    _AABB[playerId]=[0,0,0,0,0,0];
    _ignoreMap[playerId]=1
  };
  _VR.onPlayerLeave=playerId=>{
    delete _AABB[playerId];
    delete _ignoreMap[playerId]
  };
  void 0
}

Object.seal(globalThis.VR);
void 0;

