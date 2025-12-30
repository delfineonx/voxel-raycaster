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
  let A=1e9,
  B=3.141592653589793,
  C=6.283185307179586,
  D=.017453292519943295,
  E=57.29577951308232,
  F=1e-9,
  G=0,
  H=0,
  I=0,
  J=_VR.defaults,
  K=J.convert,
  L=J.offset,
  M=J.block,
  N=J.rect,
  O=J.box,
  P=api.getBlockId;
  let Q=(R,S)=>{
    if(S===1){
      G=R[0];
      H=R[1];
      I=R[2];
      let a=G*G+H*H+I*I;
      if(a>.999999&&a<1.000001){return}
      let b=1/Math.sqrt(a);
      G*=b;
      H*=b;
      I*=b;
      return
    }
    let c=R[0],
    d=R[1];
    if(S===3){
      c*=D;
      d*=D
    }
    let e=Math.cos(d);
    G=-e*Math.sin(c);
    H=Math.sin(d);
    I=-e*Math.cos(c)
  };
  _VR.convert=(R,S,T)=>{
    let a=S|0;
    if(a<1||a>3){a=K.fromType}
    let b=T|0;
    if(b<1||b>3){b=K.toType}
    let c=R[0],
    d=R[1],
    e=R[2];
    switch(a*10+b){
      case 11:{
        let f=c*c+d*d+e*e;
        if(f>.999999&&f<1.000001){return[c,d,e]}
        let g=1/Math.sqrt(f);
        return[c*g,d*g,e*g]
      }
      case 12:{
        d=Math.atan2(d,Math.sqrt(c*c+e*e));
        c=Math.atan2(-c,-e);
        return[c,d]
      }
      case 13:{
        d=Math.atan2(d,Math.sqrt(c*c+e*e))*E;
        c=Math.atan2(-c,-e)*E;
        return[c,d]
      }
      case 21:{
        let h=Math.cos(d);
        return[-h*Math.sin(c),Math.sin(d),-h*Math.cos(c)]
      }
      case 22:{
        if(c>=B||c<-B){
          c=(c+B)%C;
          if(c<0){c+=C}
          c-=B
        }
        return[c,d]
      }
      case 23:{
        if(c>=B||c<-B){
          c=(c+B)%C;
          if(c<0){c+=C}
          c-=B
        }
        return[c*E,d*E]
      }
      case 31:{
        c*=D;
        d*=D;
        let i=Math.cos(d);
        return[-i*Math.sin(c),Math.sin(d),-i*Math.cos(c)]
      }
      case 32:{
        if(c>=180||c<-180){
          c=(c+180)%360;
          if(c<0){c+=360}
          c-=180
        }
        return[c*D,d*D]
      }
      case 33:{
        if(c>=180||c<-180){
          c=(c+180)%360;
          if(c<0){c+=360}
          c-=180
        }
        return[c,d]
      }
      default:{
        return null
      }
    }
  };
  _VR.offsetPosition=(R,S,T,U)=>{
    let a=T|0;
    if(a<1||a>3){a=L.dtype}
    let b=U;
    if(b==null){b=L.offset}
    Q(S,a);
    return[R[0]+G*b,R[1]+H*b,R[2]+I*b]
  };
  _VR.castBlock=(R,S,T,U,V,W)=>{
    let a=T|0;
    if(a<1||a>3){a=M.dtype}
    let b=U;
    if(!(b>0)){b=M.distance}
    let c=V;
    if(c==null){c=M.offset}
    let d=W;
    if(!(d>0)){d=M.cell}
    Q(S,a);
    let e=G,
    $=H,
    g=I,
    h=R[0]+e*c,
    i=R[1]+$*c,
    j=R[2]+g*c,
    k=h/d,
    l=k|0;
    l-=k<l;
    k=i/d;
    let m=k|0;
    m-=k<m;
    k=j/d;
    let n=k|0;
    n-=k<n;
    let o=P(l,m,n);
    if(o){
      return{
        blockId:o,
        inRange:!0,
        distance:0,
        point:[h,i,j],
        position:[l,m,n],
        normal:[0,0,0],
        adjacent:[l,m,n],
        steps:0
      }
    }
    let p=(e>0)-(e<0),
    q=($>0)-($<0),
    r=(g>0)-(g<0),
    s=e*p,
    t=$*q,
    u=g*r,
    v=d*1e-9,
    w=A,
    x=A,
    y=A,
    z=A,
    X=A,
    Y=A;
    if(s!==0){
      w=d/s;
      z=((l+(p+1>>1))*d-h)/e+v
    }
    if(t!==0){
      x=d/t;
      X=((m+(q+1>>1))*d-i)/$+v
    }
    if(u!==0){
      y=d/u;
      Y=((n+(r+1>>1))*d-j)/g+v
    }
    let Z=b+v,
    _=0,
    f=0,
    a_=!0,
    b_=0;
    while(!o&&a_){
      b_++;
      if(z<X){
        if(z<Y){
          _=z;
          l+=p;
          z+=w;
          f=0
        }else{
          _=Y;
          n+=r;
          Y+=y;
          f=2
        }
      }else{
        if(X<=Y){
          _=X;
          m+=q;
          X+=x;
          f=1
        }else{
          _=Y;
          n+=r;
          Y+=y;
          f=2
        }
      }
      a_=_<=Z;
      o=P(l,m,n)
    }
    let e_=0,f_=0,g_=0;
    if(f===0){
      e_=-p
    }else if(f===1){
      f_=-q
    }else{
      g_=-r
    }
    return{
      blockId:o,
      inRange:a_,
      distance:_,
      point:[h+e*_,i+$*_,j+g*_],
      position:[l,m,n],
      normal:[e_,f_,g_],
      adjacent:[l+e_,m+f_,n+g_],
      steps:b_
    }
  };
  _VR.makeRect=(R,S,T,U,V,W,X)=>{
    let a=T|0;
    if(a<1||a>3){a=N.ntype}
    let b=U;
    if(!(b>0)){b=N.width}
    let c=V;
    if(!(c>0)){c=N.height}
    let d=W;
    if(d==null){d=N.rotation}
    let e=X|0;
    if(e!==2&&e!==3){e=N.rtype}
    let f=0,g=0,h=0;
    if(typeof d==="number"){
      h=d
    }else{
      f=d[0]||0;
      g=d[1]||0;
      h=d[2]||0
    }
    if(e===3){
      f*=D;
      g*=D;
      h*=D
    }
    Q(S,a);
    let i=G,
    j=H,
    k=I,
    l=0,m=0,n=0;
    if(i<.9&&i>-.9){
      l=1
    }else{
      m=1
    }
    let o=m*k-n*j,
    p=n*i-l*k,
    q=l*j-m*i,
    r=1/(Math.sqrt(o*o+p*p+q*q)||1);
    o*=r;
    p*=r;
    q*=r;
    let s=j*q-k*p,
    t=k*o-i*q,
    u=i*p-j*o,
    v,w,x,y,z;
    if(f){
      v=Math.cos(f);
      w=Math.sin(f);
      x=s*v+i*w;
      y=t*v+j*w;
      z=u*v+k*w;
      i=i*v-s*w;
      j=j*v-t*w;
      k=k*v-u*w;
      s=x;
      t=y;
      u=z
    }
    if(g){
      v=Math.cos(g);
      w=Math.sin(g);
      x=o*v-i*w;
      y=p*v-j*w;
      z=q*v-k*w;
      i=i*v+o*w;
      j=j*v+p*w;
      k=k*v+q*w;
      o=x;
      p=y;
      q=z
    }
    if(h){
      v=Math.cos(h);
      w=Math.sin(h);
      x=o*v+s*w;
      y=p*v+t*w;
      z=q*v+u*w;
      s=s*v-o*w;
      t=t*v-p*w;
      u=u*v-q*w;
      o=x;
      p=y;
      q=z
    }
    let Y=o*b,
    Z=p*b,
    a_=q*b,
    b_=s*c,
    c_=t*c,
    d_=u*c;
    return[
      R[0]-.5*Y-.5*b_,
      R[1]-.5*Z-.5*c_,
      R[2]-.5*a_-.5*d_,
      Y,Z,a_,
      b_,c_,d_,
      i,j,k,
      1/(b*b),1/(c*c)
    ]
  };
  _VR.castRect=(R,S,T,U,V,W)=>{
    let a=U|0;
    if(a<1||a>3){a=N.dtype}
    let b=V;
    if(!(b>0)){b=N.distance}
    let c=W;
    if(c==null){c=N.offset}
    Q(T,a);
    let d=G,
    e=H,
    $=I,
    g=S[0]+d*c,
    h=S[1]+e*c,
    i=S[2]+$*c,
    j=R[0],
    k=R[1],
    l=R[2],
    m=R[9],
    n=R[10],
    o=R[11],
    p=d*m+e*n+$*o;
    if(p*p<=1e-18){
      return{
        hit:!1,
        inRange:!1,
        distance:A,
        point:null,
        normal:null,
        uv:null
      }
    }
    let q=((j-g)*m+(k-h)*n+(l-i)*o)/p,
    r=b*1e-9;
    if(q<-r||q>b+r) {
      return{
        hit:!1,
        inRange:!1,
        distance:q,
        point:null,
        normal:null,
        uv:null
      }
    }
    let s=g+d*q,
    t=h+e*q,
    u=i+$*q,
    v=s-j,
    w=t-k,
    x=u-l,
    y=(v*R[3]+w*R[4]+x*R[5])*R[12],
    z=(v*R[6]+w*R[7]+x*R[8])*R[13],
    f=y>=-F&&y<=1+F&&z>=-F&&z<=1+F;
    if(!f){
      return{
        hit:!1,
        inRange:!0,
        distance:q,
        point:[s,t,u],
        normal:null,
        uv:[y,z]
      }
    }
    if(p>0){
      m=-m;
      n=-n;
      o=-o
    }
    return{
      hit:!0,
      inRange:!0,
      distance:q,
      point:[s,t,u],
      normal:[m,n,o],
      uv:[y,z]
    }
  };
  _VR.makeBox=(R,S,T,U,V,W,X,Y)=>{
    let a=T|0;
    if(a<1||a>3){a=O.ntype}
    let b=U;
    if(!(b>0)){b=O.width}
    let c=V;
    if(!(c>0)){c=O.height}
    let d=W;
    if(!(d>0)){d=O.depth}
    let e=X;
    if(e==null){e=O.rotation}
    let f=Y|0;
    if(f!==2&&f!==3){f=O.rtype}
    let g=0,h=0,i=0;
    if(typeof e==="number"){
      i=e
    }else{
      g=e[0]||0;
      h=e[1]||0;
      i=e[2]||0
    }
    if(f===3){
      g*=D;
      h*=D;
      i*=D
    }
    Q(S,a);
    let j=G,
    k=H,
    l=I,
    m=0,n=0,o=0;
    if(j<.9&&j>-.9){
      m=1
    }else{
      n=1
    }
    let p=n*l-o*k,
    q=o*j-m*l,
    r=m*k-n*j,
    s=1/(Math.sqrt(p*p+q*q+r*r)||1);
    p*=s;
    q*=s;
    r*=s;
    let t=k*r-l*q,
    u=l*p-j*r,
    v=j*q-k*p,
    w,x,y,z,Z;
    if(g){
      w=Math.cos(g);
      x=Math.sin(g);
      y=t*w+j*x;
      z=u*w+k*x;
      Z=v*w+l*x;
      j=j*w-t*x;
      k=k*w-u*x;
      l=l*w-v*x;
      t=y;
      u=z;
      v=Z
    }
    if(h){
      w=Math.cos(h);
      x=Math.sin(h);
      y=p*w-j*x;
      z=q*w-k*x;
      Z=r*w-l*x;
      j=j*w+p*x;
      k=k*w+q*x;
      l=l*w+r*x;
      p=y;
      q=z;
      r=Z
    }
    if(i){
      w=Math.cos(i);
      x=Math.sin(i);
      y=p*w+t*x;
      z=q*w+u*x;
      Z=r*w+v*x;
      t=t*w-p*x;
      u=u*w-q*x;
      v=v*w-r*x;
      p=y;
      q=z;
      r=Z
    }
    let a_=p*b,
    b_=q*b,
    c_=r*b,
    d_=t*c,
    e_=u*c,
    f_=v*c,
    g_=j*d,
    h_=k*d,
    i_=l*d;
    return[
      R[0]-.5*a_-.5*d_-.5*g_,
      R[1]-.5*b_-.5*e_-.5*h_,
      R[2]-.5*c_-.5*f_-.5*i_,
      a_,b_,c_,
      d_,e_,f_,
      g_,h_,i_,
      p,q,r,
      t,u,v,
      j,k,l,
      1/(b*b),1/(c*c),1/(d*d)
    ]
  };
  _VR.castBox=(R,S,T,U,V,W)=>{
    let a=U|0;
    if(a<1||a>3){a=O.dtype}
    let b=V;
    if(!(b>0)){b=O.distance}
    let c=W;
    if(c==null){c=O.offset}
    Q(T,a);
    let d=G,
    e=H,
    f=I,
    g=S[0]+d*c,
    h=S[1]+e*c,
    i=S[2]+f*c,
    j=g-R[0],
    k=h-R[1],
    l=i-R[2],
    m=(j*R[3]+k*R[4]+l*R[5])*R[21],
    n=(j*R[6]+k*R[7]+l*R[8])*R[22],
    o=(j*R[9]+k*R[10]+l*R[11])*R[23],
    p=(d*R[3]+e*R[4]+f*R[5])*R[21],
    q=(d*R[6]+e*R[7]+f*R[8])*R[22],
    r=(d*R[9]+e*R[10]+f*R[11])*R[23],
    s=-A,
    t=A,
    u=-1,
    v=-1,
    w=0,
    x=0,
    y,z,X,Y,Z;
    if(p*p<=1e-18){
      if(m<0||m>1){
        return{
          hit:!1,
          inRange:!1,
          distance:A,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }else{
      y=-m/p;
      z=(1-m)/p;
      X=-1;
      Y=1;
      if(y>z){
        Z=y;
        y=z;
        z=Z;
        X=1;
        Y=-1
      }
      if(y>s){
        s=y;
        u=0;
        w=X
      }
      if(z<t){
        t=z;
        v=0;
        x=Y
      }
      if(s>t){
        return{
          hit:!1,
          inRange:!1,
          distance:A,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }
    if(q*q<=1e-18){
      if(n<0||n>1){
        return{
          hit:!1,
          inRange:!1,
          distance:A,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }else{
      y=-n/q;
      z=(1-n)/q;
      X=-1;
      Y=1;
      if(y>z){
        Z=y;
        y=z;
        z=Z;
        X=1;
        Y=-1
      }
      if(y>s){
        s=y;
        u=1;
        w=X
      }
      if(z<t){
        t=z;
        v=1;
        x=Y
      }
      if(s>t){
        return{
          hit:!1,
          inRange:!1,
          distance:A,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }
    if(r*r<=1e-18){
      if(o<0||o>1){
        return{
          hit:!1,
          inRange:!1,
          distance:A,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }else{
      y=-o/r;
      z=(1-o)/r;
      X=-1;
      Y=1;
      if(y>z){
        Z=y;
        y=z;
        z=Z;
        X=1;
        Y=-1
      }
      if(y>s){
        s=y;
        u=2;
        w=X
      }
      if(z<t){
        t=z;
        v=2;
        x=Y
      }
      if(s>t){
        return{
          hit:!1,
          inRange:!1,
          distance:A,
          point:null,
          normal:null,
          uvw:null
        }
      }
    }
    let a_=b*1e-9,
    b_=s,
    c_=u,
    d_=w;
    if(b_<-a_){
      b_=t;
      c_=v;
      d_=x
    }
    if(b_<-a_||b_>b+a_) {
      return{
        hit:!1,
        inRange:!1,
        distance:b_,
        point:null,
        normal:null,
        uvw:null
      }
    }
    let e_=0,f_=0,g_=0;
    if(c_===0){
      e_=R[12]*d_;
      f_=R[13]*d_;
      g_=R[14]*d_
    }else if(c_===1){
      e_=R[15]*d_;
      f_=R[16]*d_;
      g_=R[17]*d_
    }else{
      e_=R[18]*d_;
      f_=R[19]*d_;
      g_=R[20]*d_
    }
    return{
      hit:!0,
      inRange:!0,
      distance:b_,
      point:[g+d*b_,h+e*b_,i+f*b_],
      normal:[e_,f_,g_],
      uvw:[m+p*b_,n+q*b_,o+r*b_]
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
  let A=Object.create(null),
  B=_PT._playerIds,
  C=_PT.checkValid,
  D=Object.create(null),
  E=Object.create(null),
  F=1,
  G=1,
  H=1,
  I=_PT.id_to_name,
  J=_PT.name_to_id,
  K=_PT.id_to_dbid,
  L=_PT.dbid_to_id,
  M=api.getPlayerIds,
  N=api.getPosition,
  O=api.isPlayerCrouching;
  _PT.ids=()=>B.slice();
  _PT.positions=()=>{
    if(G){
      let a=0,
      b=B.length,
      c;
      while(a<b){
        c=B[a];
        D[c]=N(c);
        a++
      }
      G=0
    }
    return D
  };
  _PT.crouching=()=>{
    if(H){
      let a=0,
      b=B.length,
      c;
      while(a<b){
        c=B[a];
        E[c]=O(c);
        a++
      }
      H=0
    }
    return E
  };
  _PT.onPlayerJoin=P=>{
    let a=A[P];
    if(a===void 0){a=A[P]=3>>0}
    if(a&1){
      try{
        let b=api.getEntityName(P),
        c=api.getPlayerDbId(P);
        if(!C[P]){
          let d=B.length;
          B[d]=P;
          C[P]=d+1
        }
        I[P]=b;
        J[b]=P;
        K[P]=c;
        L[c]=P;
        G=1;
        H=1;
        _PT.update=0xffffffff;
        _PT.join(P);
        A[P]=a&=~1
      }catch(e){
        A[P]=a&=~1;
        api.broadcastMessage("Player Tracker: Join handler error: "+e.name+": "+e.message,{color:"#ff9d87"})
      }
    }
  };
  _PT.onPlayerLeave=P=>{
    let a=C[P];
    if(!a){
      delete A[P];
      return
    }
    let b=A[P]>>>0;
    if(b&2){
      try{
        _PT.leave(P);
        A[P]=b&=~2
      }catch(c){
        A[P]=b&=~2;
        api.broadcastMessage("Player Tracker: Leave handler error: "+c.name+": "+c.message,{color:"#ff9d87"})
      }
    }
    let d=B.length-1,
    e=B[d];
    if(e!==P){
      B[a-1]=e;
      C[e]=a
    }
    B.length=d;
    delete C[P];
    delete A[P];
    let f=I[P],
    g=K[P];
    delete I[P];
    delete J[f];
    delete K[P];
    delete L[g];
    delete D[P];
    delete E[P];
    G=1;
    H=1;
    _PT.update=0xffffffff
  };
  _PT.tick=()=>{
    let a=M(),
    b=a.length,
    c=F+1,
    d=0,e=0,
    f,g;
    while(d<b){
      f=a[d];
      g=A[f]??3;
      if(!C[f]){
        let h=B.length;
        B[h]=f;
        C[f]=h+1
      }
      if(!(g&2)){g=3}
      A[f]=g=c<<2|g&3;
      d++
    }
    while(e<B.length){
      f=B[e];
      g=A[f];
      if(g>>>2===c){
        if(g&1){
          try{
            let i=api.getEntityName(f),
            j=api.getPlayerDbId(f);
            I[f]=i;
            J[i]=f;
            K[f]=j;
            L[j]=f;
            _PT.join(f);
            A[f]=g&=~1
          }catch(k){
            A[f]=g&=~1;
            api.broadcastMessage("Player Tracker: Join handler error: "+k.name+": "+k.message,{color:"#ff9d87"})
          }
        }
        e++;
        continue
      }
      if(g&2){
        try{
          _PT.leave(f);
          A[f]=g&=~2
        }catch(l){
          A[f]=g&=~2;
          api.broadcastMessage("Player Tracker: Leave handler error: "+l.name+": "+l.message,{color:"#ff9d87"})
        }
      }
      let m=B.length-1,
      n=B[m];
      if(m!==e){
        B[e]=n;
        C[n]=e+1
      }
      B.length=m;
      delete C[f];
      delete A[f];
      let o=I[f],
      p=K[f];
      delete I[f];
      delete J[o];
      delete K[f];
      delete L[p];
      delete D[f];
      delete E[f]
    }
    G=1;
    H=1;
    _PT.update=0xffffffff;
    F=c
  };
  Object.seal(_PT);
  globalThis.PT=_PT;
  void 0
}

// Voxel Raycaster [player] (extended)
{
  let _VR=globalThis.VR,
  _PT=globalThis.PT,
  A=1e9,
  B=.017453292519943295,
  C=1e-18,
  D=Math.atan2(.26,.64),
  E=Math.cos(D),
  F=Math.sin(D),
  G=Object.create(null),
  H=Object.create(null),
  I=1,
  J=0,
  K=0,
  L=0,
  M=0,
  N=0,
  O=null,
  P=null,
  Q=_VR.defaults.player={dtype:1,distance:6,offset:0},
  R=_PT._playerIds,
  S=_PT.checkValid,
  T=api.getPlayerFacingInfo;
  let U=(a,b,c,d)=>{
    if(a===0){
      L=d*b;
      M=0;
      N=-c*b;
      return
    }
    if(a===1){
      L=0;
      M=b;
      N=0;
      return
    }
    L=c*b;
    M=0;
    N=d*b
  },
  V=(a,b,c,d,e,f,g,h,i,j,k,l,m)=>{
    let n,o,p;
    if(a===0){
      n=c;
      o=d;
      p=e
    }else if(a===1){
      n=f;
      o=g;
      p=h
    }else{
      n=i;
      o=j;
      p=k
    }
    n*=b;
    o*=b;
    p*=b;
    L=m*n+l*p;
    M=o;
    N=-l*n+m*p
  },
  W=(a,b,c,d,e,f,g,h,i,j,k,l)=>{
    let m=-A,
    n=A,
    o=-1,
    p=-1,
    q=0,
    r=0,
    s,t,u,v,w;
    if(j*j<=C){
      if(g<a||g>d){return A}
    }else{
      s=(a-g)/j;
      t=(d-g)/j;
      u=-1;
      v=1;
      if(s>t){
        w=s;
        s=t;
        t=w;
        u=1;
        v=-1
      }
      if(s>m){
        m=s;
        o=0;
        q=u
      }
      if(t<n){
        n=t;
        p=0;
        r=v
      }
      if(m>n){return A}
    }
    if(k*k<=C){
      if(h<b||h>e){return A}
    }else{
      s=(b-h)/k;
      t=(e-h)/k;
      u=-1;
      v=1;
      if(s>t){
        w=s;
        s=t;
        t=w;
        u=1;
        v=-1
      }
      if(s>m){
        m=s;
        o=1;
        q=u
      }
      if(t<n){
        n=t;
        p=1;
        r=v
      }
      if(m>n){return A}
    }
    if(l*l<=C){
      if(i<c||i>f){return A}
    }else{
      s=(c-i)/l;
      t=(f-i)/l;
      u=-1;
      v=1;
      if(s>t){
        w=s;
        s=t;
        t=w;
        u=1;
        v=-1
      }
      if(s>m){
        m=s;
        o=2;
        q=u
      }
      if(t<n){
        n=t;
        p=2;
        r=v
      }if(m>n){return A}
    }
    let x=m,
    y=o,
    z=q;
    if(x<0){
      x=n;
      y=p;
      z=r
    }
    if(y<0){return A}
    J=y;
    K=z;
    return x
  };
  _VR.castPlayer=(a_,b_,c_,d_,e_,f_)=>{
    let g_=d_|0;
    if(g_<1||g_>3){g_=Q.dtype}
    let h_=e_;
    if(!(h_>0)){h_=Q.distance}
    let i_=f_;
    if(i_==null){i_=Q.offset}
    let t=0,
    j_=R.length;
    O=_PT.positions();
    P=_PT.crouching();
    if(_PT.update&1){
      let k_,l_,m_,n_,o_,p_,q_;
      t=0;
      while(t<j_){
        k_=R[t];
        l_=O[k_];
        m_=P[k_];
        n_=l_[0];
        o_=l_[1];
        p_=l_[2];
        q_=G[k_];
        if(!q_){
          q_=G[k_]=[0,0,0,0,0,0]
        }
        if(m_){
          q_[0]=n_-.94;
          q_[1]=o_;
          q_[2]=p_-.94;
          q_[3]=n_+.94;
          q_[4]=o_+2.01;
          q_[5]=p_+.94
        }else{
          q_[0]=n_-.5;
          q_[1]=o_;
          q_[2]=p_-.5;
          q_[3]=n_+.5;
          q_[4]=o_+2.06;
          q_[5]=p_+.5
        }
        t++
      }
      _PT.update&=~1
    }
    I+=1;
    if(a_&&a_.length>0){
      let r_=0,
      s_=a_.length,
      t_;
      while(r_<s_){
        t_=a_[r_];
        if(S[t_]){
          H[t_]=I
        }
        r_++
      }
    }
    let u_,v_,w_;
    if(g_===1){
      u_=c_[0];
      v_=c_[1];
      w_=c_[2];
      let x_=u_*u_+v_*v_+w_*w_;
      if(x_<.999999||x_>1.000001){
        let y_=1/Math.sqrt(x_);
        u_*=y_;
        v_*=y_;
        w_*=y_
      }
    }else{
      let z_=c_[0],
      _a=c_[1];
      if(g_===3){
        z_*=B;
        _a*=B
      }
      let _b=Math.cos(_a);
      u_=-_b*Math.sin(z_);
      v_=Math.sin(_a);
      w_=-_b*Math.cos(z_)
    }
    let a=b_[0]+u_*i_,
    b=b_[1]+v_*i_,
    c=b_[2]+w_*i_,
    d=h_*1e-9,
    e=h_+d,
    g=null,
    f=null,
    h=A,
    i=0,
    j=0,
    k=0,
    l,m,n,o,p,q,r,s;
    t=0;
    while(t<j_){
      l=R[t];
      t++;
      if(H[l]===I){continue}
      m=G[l];
      n=-A;
      o=A;
      if(u_*u_<=C){
        if(a<m[0]||a>m[3]){continue}
      }else{
        p=(m[0]-a)/u_;
        q=(m[3]-a)/u_;
        if(p>q){
          r=p;
          p=q;
          q=r
        }
        if(p>n){n=p}
        if(q<o){o=q}
        if(n>o){continue}
      }
      if(v_*v_<=C){
        if(b<m[1]||b>m[4]){continue}
      }else{
        p=(m[1]-b)/v_;
        q=(m[4]-b)/v_;
        if(p>q){
          r=p;
          p=q;
          q=r
        }
        if(p>n){n=p}
        if(q<o){o=q}
        if(n>o){continue}
      }
      if(w_*w_<=C){
        if(c<m[2]||c>m[5]){continue}
      }else{
        p=(m[2]-c)/w_;
        q=(m[5]-c)/w_;
        if(p>q){
          r=p;
          p=q;
          q=r
        }
        if(p>n){n=p}
        if(q<o){o=q}
        if(n>o){continue}
      }
      if(o<0){continue}
      s=n>0?n:0;
      if(s>e||s>h){continue}
      let _c=O[l],
      _d=P[l],
      _e=T(l).dir,
      _f=_e[0],
      _g=_e[1],
      _h=_e[2],
      _i=Math.sqrt(_f*_f+_h*_h),
      _j=_g,
      u=_f/_i,
      v=_h/_i,
      _m=a-_c[0],
      _l=b-_c[1],
      _k=c-_c[2],
      w=u_*v+w_*-u,
      x=v_,
      y=u_*u+w_*v,
      z=_m*v+_k*-u,
      X=_l,
      Y=_m*u+_k*v,
      Z,$,_;
      if(!_d){
        Z=W(-.25,.75,-.125,.25,1.44,.125,z,X,Y,w,x,y);
        if(Z>=-d&&Z<=e&&Z<h){
          $=J;
          _=K;
          U($,_,u,v);
          h=Z;
          g=l;
          f="Torso";
          i=L;
          j=M;
          k=N
        }
        Z=W(.25,.62,-.125,.5,1.44,.125,z,X,Y,w,x,y);
        if(Z>=-d&&Z<=e&&Z<h){
          $=J;
          _=K;
          U($,_,u,v);
          h=Z;
          g=l;
          f="ArmRight";
          i=L;
          j=M;
          k=N
        }
        Z=W(-.5,.62,-.125,-.25,1.44,.125,z,X,Y,w,x,y);
        if(Z>=-d&&Z<=e&&Z<h){
          $=J;
          _=K;
          U($,_,u,v);
          h=Z;
          g=l;
          f="ArmLeft";
          i=L;
          j=M;
          k=N
        }
      }else{
        let _n,_o,_p,
        _q,_r,_s,
        _t,_u,_v;
        _n=z;
        _o=X-1.07;
        _p=Y-.13;
        _q=_n;
        _r=_o*E+_p*F;
        _s=-_o*F+_p*E;
        _t=w;
        _u=x*E+y*F;
        _v=-x*F+y*E;
        Z=W(-.25,-.37,-.125,.25,.37,.125,_q,_r,_s,_t,_u,_v);
        if(Z>=-d&&Z<=e&&Z<h){
          $=J;
          _=K;
          V($,_,1,0,0,0,E,F,0,-F,E,u,v);
          h=Z;
          g=l;
          f="Torso";
          i=L;
          j=M;
          k=N
        }
        _n=z-.375;
        _o=X-1.035;
        _p=Y-.105;
        _q=_n;
        _r=_o*E+_p*F;
        _s=-_o*F+_p*E;
        _t=w;
        _u=x*E+y*F;
        _v=-x*F+y*E;
        Z=W(-.125,-.405,-.125,.125,.405,.125,_q,_r,_s,_t,_u,_v);
        if(Z>=-d&&Z<=e&&Z<h){
          $=J;
          _=K;
          V($,_,1,0,0,0,E,F,0,-F,E,u,v);
          h=Z;
          g=l;
          f="ArmRight";
          i=L;
          j=M;
          k=N
        }
        _n=z+.375;
        _o=X-1.035;
        _p=Y-.105;
        _q=_n;
        _r=_o*E+_p*F;
        _s=-_o*F+_p*E;
        _t=w;
        _u=x*E+y*F;
        _v=-x*F+y*E;
        Z=W(-.125,-.405,-.125,.125,.405,.125,_q,_r,_s,_t,_u,_v);
        if(Z>=-d&&Z<=e&&Z<h){
          $=J;
          _=K;
          V($,_,1,0,0,0,E,F,0,-F,E,u,v);
          h=Z;
          g=l;
          f="ArmLeft";
          i=L;
          j=M;
          k=N
        }
      }
      Z=W(0,0,-.125,.25,.75,.125,z,X,Y,w,x,y);
      if(Z>=-d&&Z<=e&&Z<h){
        $=J;
        _=K;
        U($,_,u,v);
        h=Z;
        g=l;
        f="LegRight";
        i=L;
        j=M;
        k=N
      }
      Z=W(-.25,0,-.125,0,.75,.125,z,X,Y,w,x,y);
      if(Z>=-d&&Z<=e&&Z<h){
        $=J;
        _=K;
        U($,_,u,v);
        h=Z;
        g=l;
        f="LegLeft";
        i=L;
        j=M;
        k=N
      }
      let _w=_d?1.39:1.44,
      _x=_d?.26:0,
      _y=z,
      _z=X-(_w+.28),
      $a=Y-_x,
      $b=_y,
      $c=_z*_i+$a*_j,
      $d=-_z*_j+$a*_i,
      $e=w,
      $f=x*_i+y*_j,
      $g=-x*_j+y*_i;
      Z=W(-.28,-.28,-.28,.28,.28,.28,$b,$c,$d,$e,$f,$g);
      if(Z>=-d&&Z<=e&&Z<h){
        $=J;
        _=K;
        V($,_,1,0,0,0,_i,_j,0,-_j,_i,u,v);
        h=Z;
        g=l;
        f="Head";
        i=L;
        j=M;
        k=N
      }
    }
    if(!g){
      return{
        playerId:null,
        inRange:!1,
        distance:A,
        point:null,
        normal:null,
        part:null
      }
    }
    return{
      playerId:g,
      inRange:!0,
      distance:h,
      point:[a+u_*h,b+v_*h,c+w_*h],
      normal:[i,j,k],
      part:f
    }
  };
  _VR.onPlayerJoin=X=>{
    G[X]=[0,0,0,0,0,0];
    H[X]=1
  };
  _VR.onPlayerLeave=X=>{
    delete G[X];
    delete H[X]
  };
  void 0
}

Object.seal(globalThis.VR);
void 0;

