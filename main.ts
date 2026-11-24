// make.fun tiny stack ISA v1 VM; Int32Array stores wrap (ToInt32); traps are thrown as their exit code
import{mkdirSync as K,readdirSync as R,readFileSync as F,writeFileSync as W}from'fs'
const[,,A='/input',B='/output']=process.argv,O=new Uint8Array(65536),
// per opcode byte: 48+imm*16+pops*4+pushes, ' ' = unknown
T='0Aq46:;?        999999959995999 999             PTTP0           58              4414',
G='a+b a-b Math.imul(a,b) a/b a%b (a>>>0)/(b>>>0) (a>>>0)%(b>>>0) -a a&b a|b a^b ~a a<<b a>>b a>>>b  a==b a<b a>>>0<b>>>0'.split(' ').map(e=>Function('a,b','return '+e))
for(const d of R(A)){const p=F(`${A}/${d}/program.bin`),n=F(`${A}/${d}/input.bin`),L=p.length,D=new Int32Array(256),M=new Int32Array(256),C=[]
let s=0,o=0,q=0,i=0,t=0,e,a,b,z,x,k,m,u
try{for(;;){if(++t>1e6)throw 10
if(i>>>0>=L)throw 9
x=p[i];k=T.charCodeAt(x)-48;m=k>>4;u=k>>2&3
if(!(k>=0))throw 5
if(i+m>=L)throw 9
if(s<u)throw 2
if(s-u+(k&3)>256)throw 3
i+=1+m
if(x>15&&x<35){if(k==9){b=D[--s];if(!b&&x>18&&x<23)throw 4}D[s-1]=G[x-16](D[s-1],b)}else switch(x){case 0:throw 0
case 1:case 2:D[s++]=p.readIntLE(i-m,m);break
case 3:s--;break
case 4:case 6:D[s]=D[s++-x/2+1];break
case 5:case 7:a=D[z=s-(x>>1)];D.copyWithin(z,z+1,s);D[s-1]=a;break
case 49:case 50:if(!D[--s]==x>49)break
case 48:i+=p.readInt16LE(i-2);break
case 51:if(C.push(i)>64)throw 7;i=p[i-2]|p[i-1]<<8;break
case 52:if(!(i=C.pop()))throw 8;break
case 64:case 65:if((a=D[s-1])&-256)throw 6;x>64?M[a]=D[s-=2]:D[s-1]=M[a];break
case 80:case 81:z=x>80?[D[s-1]]:Buffer.from(''+D[s-1]);if(o+z.length>65536)throw 11;s--;O.set(z,o);o+=z.length;break
case 82:D[s++]=n[q++]??-1;break
default:throw D[--s]&255}}}catch(c){e=c}
K(z=`${B}/${d}`);W(z+'/stdout.bin',O.subarray(0,o));W(z+'/exit.txt',e+'')}
