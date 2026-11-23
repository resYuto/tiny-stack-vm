// make.fun tiny stack ISA v1 VM; Int32Array stores wrap (ToInt32)
import{mkdirSync as K,readdirSync as R,readFileSync as F,writeFileSync as W}from'node:fs'
const I=new Int8Array(256).fill(-1),P=new Int8Array(256),Q=new Int8Array(256)
for(const s of'00000 01101 02401 03010 04012 05022 06023 07033 17011 1b011 30200 31210 32210 33200 34000 40011 41020 50010 51010 52001 53010 10 11 12 13 14 15 16 18 19 1a 1c 1d 1e 20 21 22'.split(' ')){const o=parseInt(s.slice(0,2),16);I[o]=+(s[2]??0);P[o]=+(s[3]??2);Q[o]=+(s[4]??1)}
function v(p,n){const L=p.length,D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),O=new Uint8Array(65536)
let s=0,c=0,o=0,q=0,i=0,t=0,a=0,b=0
const Z=e=>[O.subarray(0,o),e]
for(;;){if(t==1e6)return Z(10)
if(i<0||i>=L)return Z(9)
const x=p[i],m=I[x]
if(m<0)return Z(5)
if(i+m>=L)return Z(9)
t++
if(s<P[x])return Z(2)
if(s-P[x]+Q[x]>256)return Z(3)
i+=1+m
if(x>15&&x<35&&P[x]>1){b=D[--s];a=D[s-1]
if(!b&&x>18&&x<23)return Z(4)
switch(x){case 16:a+=b;break;case 17:a-=b;break;case 18:a=Math.imul(a,b);break;case 19:a/=b;break;case 20:a%=b;break
case 21:a=(a>>>0)/(b>>>0);break;case 22:a=(a>>>0)%(b>>>0);break;case 24:a&=b;break;case 25:a|=b;break;case 26:a^=b;break
case 28:a<<=b;break;case 29:a>>=b;break;case 30:a>>>=b;break;case 32:a=+(a==b);break;case 33:a=+(a<b);break;default:a=+(a>>>0<b>>>0)}
D[s-1]=a;continue}
switch(x){case 0:return Z(0)
case 1:D[s++]=p[i-1]<<24>>24;break
case 2:D[s++]=p[i-4]|p[i-3]<<8|p[i-2]<<16|p[i-1]<<24;break
case 3:s--;break
case 4:D[s]=D[s-1];s++;break
case 5:a=D[s-1];D[s-1]=D[s-2];D[s-2]=a;break
case 6:D[s]=D[s-2];s++;break
case 7:a=D[s-3];D[s-3]=D[s-2];D[s-2]=D[s-1];D[s-1]=a;break
case 23:D[s-1]=-D[s-1];break
case 27:D[s-1]=~D[s-1];break
case 49:if(D[--s])break
case 48:i+=(p[i-2]|p[i-1]<<8)<<16>>16;break
case 50:if(D[--s])i+=(p[i-2]|p[i-1]<<8)<<16>>16;break
case 51:if(c>63)return Z(7);C[c++]=i;i=p[i-2]|p[i-1]<<8;break
case 52:if(!c)return Z(8);i=C[--c];break
case 64:a=D[s-1];if(a<0||a>255)return Z(6);D[s-1]=M[a];break
case 65:a=D[s-1];if(a<0||a>255)return Z(6);M[a]=D[s-2];s-=2;break
case 80:{const z=''+D[s-1];if(o+z.length>65536)return Z(11);s--;for(const h of z)O[o++]=h.charCodeAt(0);break}
case 81:if(o>65535)return Z(11);O[o++]=D[--s];break
case 82:D[s++]=q<n.length?n[q++]:-1;break
default:return Z(D[--s]&255)}}}
const A=process.env.MAKEFUN_INPUT_DIR??'/input',B=process.env.MAKEFUN_OUTPUT_DIR??'/output'
for(const d of R(A).sort()){const g=f=>{try{return F(`${A}/${d}/${f}.bin`)}catch{return new Uint8Array}}
let r=[new Uint8Array,0];try{r=v(g('program'),g('input'))}catch{}
K(`${B}/${d}`,{recursive:true});W(`${B}/${d}/stdout.bin`,r[0]);W(`${B}/${d}/exit.txt`,r[1]+'\n')}
