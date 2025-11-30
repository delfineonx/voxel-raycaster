// Copyright (c) 2025 delfineonx
// This product includes "Block Raycaster" created by delfineonx.
// Licensed under the Apache License, Version 2.0.

{
let _BR={default:null,cast:null,convertDirection:null,offsetPosition:null,maxDistancePosition:null},X=null,Y=null,Z=null,I=1e9,P=3.141592653589793,W=6.283185307179586,R=0.017453292519943295,G=57.29577951308232,U=_BR.default={directionType:1,maxDistance:6,startOffset:0,cellSize:1},C={get 11(){let i=1/Math.sqrt(X*X+Y*Y+Z*Z);X*=i;Y*=i;Z*=i},get 12(){Y=Math.atan2(Y,Math.sqrt(X*X+Z*Z));X=Math.atan2(-X,-Z)},get 13(){Y=Math.atan2(Y,Math.sqrt(X*X+Z*Z))*G;X=Math.atan2(-X,-Z)*G},get 21(){X=(X+P)%W;if(X<0){X+=W}X=X-P;let y=Math.cos(X),p=Math.cos(Y);X=-p*Math.sin(X);Y=Math.sin(Y);Z=-p*y},get 22(){X=(X+P)%W;if(X<0){X+=W}X=X-P},get 23(){X=(X+P)%W;if(X<0){X+=W}X=X-P;X*=G;Y*=G},get 31(){X=(X+180)%360;if(X<0){X+=360}X-=180;X*=R;Y*=R;let y=Math.cos(X),p=Math.cos(Y);X=-p*Math.sin(X);Y=Math.sin(Y);Z=-p*y},get 32(){X=(X+180)%360;if(X<0){X+=360}X-=180;X*=R;Y*=R},get 33(){X=(X+180)%360;if(X<0){X+=360}X-=180}};
_BR.cast=(S,D,T,M,O,L)=>{let a=T|0;if(a<1|a>3){a=U.directionType}let b=M;if(!(b>0)){b=U.maxDistance}let v=O;if(v===undefined|v===null){v=U.startOffset}let d=L;if(!(d>0)){d=U.cellSize}X=D[0];Y=D[1];Z=D[2];C[a+"1"];let e=X,f=Y,g=Z,h=S[0]+e*v,i=S[1]+f*v,j=S[2]+g*v,k=(e>0)-(e<0),l=(f>0)-(f<0),m=(g>0)-(g<0),n=e*k,o=f*l,p=g*m,q=d/(n+(n===0)),r=d/(o+(o===0)),s=d/(p+(p===0)),t=h/d;t=(t|0)-(t<(t|0));let u=i/d;u=(u|0)-(u<(u|0));let c=j/d;c=(c|0)-(c<(c|0));let w=I;if(n!==0){w=((t+(k+1>>1))*d-h)/e}let x=I;if(o!==0){x=((u+(l+1>>1))*d-i)/f}let y=I;if(p!==0){y=((c+(m+1>>1))*d-j)/g}let z=d*1e-9;if(w===0){w+=z}if(x===0){x+=z}if(y===0){y+=z}let A=b+z,B=0,E,F,H,J,K,N;do{B++;E=w<x&w<y;F=x<=y&1-E;H=1-E-F;J=w*E+x*F+y*H;t+=k*E;u+=l*F;c+=m*H;w+=q*E;x+=r*F;y+=s*H;K=api.getBlockId(t,u,c);N=J<=A}while(!K&N);let Q=-k*E,V=-l*F,$=-m*H;return{blockId:K,position:[t,u,c],normal:[Q,V,$],adjacent:[t+Q,u+V,c+$],point:[h+e*J,i+f*J,j+g*J],distance:J+v,offset:J,steps:B,inRange:N}},
_BR.offsetPosition=(S,D,T,O)=>{let p=T|0;if(p<1|p>3){p=U.directionType}let o=O;if(o===undefined|o===null){o=U.startOffset}X=D[0];Y=D[1];Z=D[2];C[p+"1"];return[S[0]+X*o,S[1]+Y*o,S[2]+Z*o]},
_BR.maxDistancePosition=(S,D,T,M,O)=>{let p=T|0;if(p<1|p>3){p=U.directionType}let m=M;if(!(m>0)){m=U.maxDistance}let o=O;if(o===undefined|o===null){o=U.startOffset}X=D[0];Y=D[1];Z=D[2];C[p+"1"];let t=m+o;return[S[0]+X*t,S[1]+Y*t,S[2]+Z*t]},
_BR.convertDirection=(D,A,B)=>{let a=A|0;if(a<1|a>3){a=U.directionType}let b=B|0;if(b<1|b>3){b=U.directionType}X=D[0];Y=D[1];Z=D[2];C[""+a+b];if(b===1){return[X,Y,Z]}else{return[X,Y]}};
Object.seal(_BR);
globalThis.BR=_BR;
void 0
}

