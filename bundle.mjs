import { createRequire } from "module"; const require = createRequire(import.meta.url); const __filename = new URL(import.meta.url).pathname; const __dirname = new URL(".", import.meta.url).pathname;
var Jn=Object.create;var ir=Object.defineProperty;var Kn=Object.getOwnPropertyDescriptor;var Yn=Object.getOwnPropertyNames;var Xn=Object.getPrototypeOf,Qn=Object.prototype.hasOwnProperty;var L=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var S=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var Zn=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of Yn(t))!Qn.call(e,n)&&n!==r&&ir(e,n,{get:()=>t[n],enumerable:!(i=Kn(t,n))||i.enumerable});return e};var nr=(e,t,r)=>(r=e!=null?Jn(Xn(e)):{},Zn(t||!e||!e.__esModule?ir(r,"default",{value:e,enumerable:!0}):r,e));var F=S(At=>{"use strict";At.fromCallback=function(e){return Object.defineProperty(function(...t){if(typeof t[t.length-1]=="function")e.apply(this,t);else return new Promise((r,i)=>{t.push((n,o)=>n!=null?i(n):r(o)),e.apply(this,t)})},"name",{value:e.name})};At.fromPromise=function(e){return Object.defineProperty(function(...t){let r=t[t.length-1];if(typeof r!="function")return e.apply(this,t);t.pop(),e.apply(this,t).then(i=>r(null,i),r)},"name",{value:e.name})}});var Ur=S((Hl,zr)=>{var ie=L("constants"),Wo=process.cwd,ot=null,Vo=process.env.GRACEFUL_FS_PLATFORM||process.platform;process.cwd=function(){return ot||(ot=Wo.call(process)),ot};try{process.cwd()}catch{}typeof process.chdir=="function"&&(Nt=process.chdir,process.chdir=function(e){ot=null,Nt.call(process,e)},Object.setPrototypeOf&&Object.setPrototypeOf(process.chdir,Nt));var Nt;zr.exports=Go;function Go(e){ie.hasOwnProperty("O_SYMLINK")&&process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)&&t(e),e.lutimes||r(e),e.chown=o(e.chown),e.fchown=o(e.fchown),e.lchown=o(e.lchown),e.chmod=i(e.chmod),e.fchmod=i(e.fchmod),e.lchmod=i(e.lchmod),e.chownSync=a(e.chownSync),e.fchownSync=a(e.fchownSync),e.lchownSync=a(e.lchownSync),e.chmodSync=n(e.chmodSync),e.fchmodSync=n(e.fchmodSync),e.lchmodSync=n(e.lchmodSync),e.stat=s(e.stat),e.fstat=s(e.fstat),e.lstat=s(e.lstat),e.statSync=c(e.statSync),e.fstatSync=c(e.fstatSync),e.lstatSync=c(e.lstatSync),e.chmod&&!e.lchmod&&(e.lchmod=function(l,u,h){h&&process.nextTick(h)},e.lchmodSync=function(){}),e.chown&&!e.lchown&&(e.lchown=function(l,u,h,p){p&&process.nextTick(p)},e.lchownSync=function(){}),Vo==="win32"&&(e.rename=typeof e.rename!="function"?e.rename:(function(l){function u(h,p,f){var m=Date.now(),y=0;l(h,p,function b(R){if(R&&(R.code==="EACCES"||R.code==="EPERM"||R.code==="EBUSY")&&Date.now()-m<6e4){setTimeout(function(){e.stat(p,function(k,C){k&&k.code==="ENOENT"?l(h,p,b):f(R)})},y),y<100&&(y+=10);return}f&&f(R)})}return Object.setPrototypeOf&&Object.setPrototypeOf(u,l),u})(e.rename)),e.read=typeof e.read!="function"?e.read:(function(l){function u(h,p,f,m,y,b){var R;if(b&&typeof b=="function"){var k=0;R=function(C,Ue,Te){if(C&&C.code==="EAGAIN"&&k<10)return k++,l.call(e,h,p,f,m,y,R);b.apply(this,arguments)}}return l.call(e,h,p,f,m,y,R)}return Object.setPrototypeOf&&Object.setPrototypeOf(u,l),u})(e.read),e.readSync=typeof e.readSync!="function"?e.readSync:(function(l){return function(u,h,p,f,m){for(var y=0;;)try{return l.call(e,u,h,p,f,m)}catch(b){if(b.code==="EAGAIN"&&y<10){y++;continue}throw b}}})(e.readSync);function t(l){l.lchmod=function(u,h,p){l.open(u,ie.O_WRONLY|ie.O_SYMLINK,h,function(f,m){if(f){p&&p(f);return}l.fchmod(m,h,function(y){l.close(m,function(b){p&&p(y||b)})})})},l.lchmodSync=function(u,h){var p=l.openSync(u,ie.O_WRONLY|ie.O_SYMLINK,h),f=!0,m;try{m=l.fchmodSync(p,h),f=!1}finally{if(f)try{l.closeSync(p)}catch{}else l.closeSync(p)}return m}}function r(l){ie.hasOwnProperty("O_SYMLINK")&&l.futimes?(l.lutimes=function(u,h,p,f){l.open(u,ie.O_SYMLINK,function(m,y){if(m){f&&f(m);return}l.futimes(y,h,p,function(b){l.close(y,function(R){f&&f(b||R)})})})},l.lutimesSync=function(u,h,p){var f=l.openSync(u,ie.O_SYMLINK),m,y=!0;try{m=l.futimesSync(f,h,p),y=!1}finally{if(y)try{l.closeSync(f)}catch{}else l.closeSync(f)}return m}):l.futimes&&(l.lutimes=function(u,h,p,f){f&&process.nextTick(f)},l.lutimesSync=function(){})}function i(l){return l&&function(u,h,p){return l.call(e,u,h,function(f){d(f)&&(f=null),p&&p.apply(this,arguments)})}}function n(l){return l&&function(u,h){try{return l.call(e,u,h)}catch(p){if(!d(p))throw p}}}function o(l){return l&&function(u,h,p,f){return l.call(e,u,h,p,function(m){d(m)&&(m=null),f&&f.apply(this,arguments)})}}function a(l){return l&&function(u,h,p){try{return l.call(e,u,h,p)}catch(f){if(!d(f))throw f}}}function s(l){return l&&function(u,h,p){typeof h=="function"&&(p=h,h=null);function f(m,y){y&&(y.uid<0&&(y.uid+=4294967296),y.gid<0&&(y.gid+=4294967296)),p&&p.apply(this,arguments)}return h?l.call(e,u,h,f):l.call(e,u,f)}}function c(l){return l&&function(u,h){var p=h?l.call(e,u,h):l.call(e,u);return p&&(p.uid<0&&(p.uid+=4294967296),p.gid<0&&(p.gid+=4294967296)),p}}function d(l){if(!l||l.code==="ENOSYS")return!0;var u=!process.getuid||process.getuid()!==0;return!!(u&&(l.code==="EINVAL"||l.code==="EPERM"))}}});var Gr=S((Bl,Vr)=>{var Wr=L("stream").Stream;Vr.exports=Jo;function Jo(e){return{ReadStream:t,WriteStream:r};function t(i,n){if(!(this instanceof t))return new t(i,n);Wr.call(this);var o=this;this.path=i,this.fd=null,this.readable=!0,this.paused=!1,this.flags="r",this.mode=438,this.bufferSize=64*1024,n=n||{};for(var a=Object.keys(n),s=0,c=a.length;s<c;s++){var d=a[s];this[d]=n[d]}if(this.encoding&&this.setEncoding(this.encoding),this.start!==void 0){if(typeof this.start!="number")throw TypeError("start must be a Number");if(this.end===void 0)this.end=1/0;else if(typeof this.end!="number")throw TypeError("end must be a Number");if(this.start>this.end)throw new Error("start must be <= end");this.pos=this.start}if(this.fd!==null){process.nextTick(function(){o._read()});return}e.open(this.path,this.flags,this.mode,function(l,u){if(l){o.emit("error",l),o.readable=!1;return}o.fd=u,o.emit("open",u),o._read()})}function r(i,n){if(!(this instanceof r))return new r(i,n);Wr.call(this),this.path=i,this.fd=null,this.writable=!0,this.flags="w",this.encoding="binary",this.mode=438,this.bytesWritten=0,n=n||{};for(var o=Object.keys(n),a=0,s=o.length;a<s;a++){var c=o[a];this[c]=n[c]}if(this.start!==void 0){if(typeof this.start!="number")throw TypeError("start must be a Number");if(this.start<0)throw new Error("start must be >= zero");this.pos=this.start}this.busy=!1,this._queue=[],this.fd===null&&(this._open=e.open,this._queue.push([this._open,this.path,this.flags,this.mode,void 0]),this.flush())}}});var Kr=S((zl,Jr)=>{"use strict";Jr.exports=Yo;var Ko=Object.getPrototypeOf||function(e){return e.__proto__};function Yo(e){if(e===null||typeof e!="object")return e;if(e instanceof Object)var t={__proto__:Ko(e)};else var t=Object.create(null);return Object.getOwnPropertyNames(e).forEach(function(r){Object.defineProperty(t,r,Object.getOwnPropertyDescriptor(e,r))}),t}});var Ee=S((Ul,zt)=>{var j=L("fs"),Xo=Ur(),Qo=Gr(),Zo=Kr(),at=L("util"),B,ct;typeof Symbol=="function"&&typeof Symbol.for=="function"?(B=Symbol.for("graceful-fs.queue"),ct=Symbol.for("graceful-fs.previous")):(B="___graceful-fs.queue",ct="___graceful-fs.previous");function ea(){}function Qr(e,t){Object.defineProperty(e,B,{get:function(){return t}})}var me=ea;at.debuglog?me=at.debuglog("gfs4"):/\bgfs4\b/i.test(process.env.NODE_DEBUG||"")&&(me=function(){var e=at.format.apply(at,arguments);e="GFS4: "+e.split(/\n/).join(`
GFS4: `),console.error(e)});j[B]||(Yr=global[B]||[],Qr(j,Yr),j.close=(function(e){function t(r,i){return e.call(j,r,function(n){n||Xr(),typeof i=="function"&&i.apply(this,arguments)})}return Object.defineProperty(t,ct,{value:e}),t})(j.close),j.closeSync=(function(e){function t(r){e.apply(j,arguments),Xr()}return Object.defineProperty(t,ct,{value:e}),t})(j.closeSync),/\bgfs4\b/i.test(process.env.NODE_DEBUG||"")&&process.on("exit",function(){me(j[B]),L("assert").equal(j[B].length,0)}));var Yr;global[B]||Qr(global,j[B]);zt.exports=Ht(Zo(j));process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH&&!j.__patched&&(zt.exports=Ht(j),j.__patched=!0);function Ht(e){Xo(e),e.gracefulify=Ht,e.createReadStream=Ue,e.createWriteStream=Te;var t=e.readFile;e.readFile=r;function r(g,x,E){return typeof x=="function"&&(E=x,x=null),_(g,x,E);function _(N,D,T,q){return t(N,D,function(P){P&&(P.code==="EMFILE"||P.code==="ENFILE")?ke([_,[N,D,T],P,q||Date.now(),Date.now()]):typeof T=="function"&&T.apply(this,arguments)})}}var i=e.writeFile;e.writeFile=n;function n(g,x,E,_){return typeof E=="function"&&(_=E,E=null),N(g,x,E,_);function N(D,T,q,P,H){return i(D,T,q,function($){$&&($.code==="EMFILE"||$.code==="ENFILE")?ke([N,[D,T,q,P],$,H||Date.now(),Date.now()]):typeof P=="function"&&P.apply(this,arguments)})}}var o=e.appendFile;o&&(e.appendFile=a);function a(g,x,E,_){return typeof E=="function"&&(_=E,E=null),N(g,x,E,_);function N(D,T,q,P,H){return o(D,T,q,function($){$&&($.code==="EMFILE"||$.code==="ENFILE")?ke([N,[D,T,q,P],$,H||Date.now(),Date.now()]):typeof P=="function"&&P.apply(this,arguments)})}}var s=e.copyFile;s&&(e.copyFile=c);function c(g,x,E,_){return typeof E=="function"&&(_=E,E=0),N(g,x,E,_);function N(D,T,q,P,H){return s(D,T,q,function($){$&&($.code==="EMFILE"||$.code==="ENFILE")?ke([N,[D,T,q,P],$,H||Date.now(),Date.now()]):typeof P=="function"&&P.apply(this,arguments)})}}var d=e.readdir;e.readdir=u;var l=/^v[0-5]\./;function u(g,x,E){typeof x=="function"&&(E=x,x=null);var _=l.test(process.version)?function(T,q,P,H){return d(T,N(T,q,P,H))}:function(T,q,P,H){return d(T,q,N(T,q,P,H))};return _(g,x,E);function N(D,T,q,P){return function(H,$){H&&(H.code==="EMFILE"||H.code==="ENFILE")?ke([_,[D,T,q],H,P||Date.now(),Date.now()]):($&&$.sort&&$.sort(),typeof q=="function"&&q.call(this,H,$))}}}if(process.version.substr(0,4)==="v0.8"){var h=Qo(e);b=h.ReadStream,k=h.WriteStream}var p=e.ReadStream;p&&(b.prototype=Object.create(p.prototype),b.prototype.open=R);var f=e.WriteStream;f&&(k.prototype=Object.create(f.prototype),k.prototype.open=C),Object.defineProperty(e,"ReadStream",{get:function(){return b},set:function(g){b=g},enumerable:!0,configurable:!0}),Object.defineProperty(e,"WriteStream",{get:function(){return k},set:function(g){k=g},enumerable:!0,configurable:!0});var m=b;Object.defineProperty(e,"FileReadStream",{get:function(){return m},set:function(g){m=g},enumerable:!0,configurable:!0});var y=k;Object.defineProperty(e,"FileWriteStream",{get:function(){return y},set:function(g){y=g},enumerable:!0,configurable:!0});function b(g,x){return this instanceof b?(p.apply(this,arguments),this):b.apply(Object.create(b.prototype),arguments)}function R(){var g=this;K(g.path,g.flags,g.mode,function(x,E){x?(g.autoClose&&g.destroy(),g.emit("error",x)):(g.fd=E,g.emit("open",E),g.read())})}function k(g,x){return this instanceof k?(f.apply(this,arguments),this):k.apply(Object.create(k.prototype),arguments)}function C(){var g=this;K(g.path,g.flags,g.mode,function(x,E){x?(g.destroy(),g.emit("error",x)):(g.fd=E,g.emit("open",E))})}function Ue(g,x){return new e.ReadStream(g,x)}function Te(g,x){return new e.WriteStream(g,x)}var de=e.open;e.open=K;function K(g,x,E,_){return typeof E=="function"&&(_=E,E=null),N(g,x,E,_);function N(D,T,q,P,H){return de(D,T,q,function($,oc){$&&($.code==="EMFILE"||$.code==="ENFILE")?ke([N,[D,T,q,P],$,H||Date.now(),Date.now()]):typeof P=="function"&&P.apply(this,arguments)})}}return e}function ke(e){me("ENQUEUE",e[0].name,e[1]),j[B].push(e),Bt()}var st;function Xr(){for(var e=Date.now(),t=0;t<j[B].length;++t)j[B][t].length>2&&(j[B][t][3]=e,j[B][t][4]=e);Bt()}function Bt(){if(clearTimeout(st),st=void 0,j[B].length!==0){var e=j[B].shift(),t=e[0],r=e[1],i=e[2],n=e[3],o=e[4];if(n===void 0)me("RETRY",t.name,r),t.apply(null,r);else if(Date.now()-n>=6e4){me("TIMEOUT",t.name,r);var a=r.pop();typeof a=="function"&&a.call(null,i)}else{var s=Date.now()-o,c=Math.max(o-n,1),d=Math.min(c*1.2,100);s>=d?(me("RETRY",t.name,r),t.apply(null,r.concat([n]))):j[B].push(e)}st===void 0&&(st=setTimeout(Bt,0))}}});var W=S(ee=>{"use strict";var Zr=F().fromCallback,U=Ee(),ta=["access","appendFile","chmod","chown","close","copyFile","cp","fchmod","fchown","fdatasync","fstat","fsync","ftruncate","futimes","glob","lchmod","lchown","lutimes","link","lstat","mkdir","mkdtemp","open","opendir","readdir","readFile","readlink","realpath","rename","rm","rmdir","stat","statfs","symlink","truncate","unlink","utimes","writeFile"].filter(e=>typeof U[e]=="function");Object.assign(ee,U);ta.forEach(e=>{ee[e]=Zr(U[e])});ee.exists=function(e,t){return typeof t=="function"?U.exists(e,t):new Promise(r=>U.exists(e,r))};ee.read=function(e,t,r,i,n,o){return typeof o=="function"?U.read(e,t,r,i,n,o):new Promise((a,s)=>{U.read(e,t,r,i,n,(c,d,l)=>{if(c)return s(c);a({bytesRead:d,buffer:l})})})};ee.write=function(e,t,...r){return typeof r[r.length-1]=="function"?U.write(e,t,...r):new Promise((i,n)=>{U.write(e,t,...r,(o,a,s)=>{if(o)return n(o);i({bytesWritten:a,buffer:s})})})};ee.readv=function(e,t,...r){return typeof r[r.length-1]=="function"?U.readv(e,t,...r):new Promise((i,n)=>{U.readv(e,t,...r,(o,a,s)=>{if(o)return n(o);i({bytesRead:a,buffers:s})})})};ee.writev=function(e,t,...r){return typeof r[r.length-1]=="function"?U.writev(e,t,...r):new Promise((i,n)=>{U.writev(e,t,...r,(o,a,s)=>{if(o)return n(o);i({bytesWritten:a,buffers:s})})})};typeof U.realpath.native=="function"?ee.realpath.native=Zr(U.realpath.native):process.emitWarning("fs.realpath.native is not a function. Is fs being monkey-patched?","Warning","fs-extra-WARN0003")});var ti=S((Vl,ei)=>{"use strict";var ra=L("path");ei.exports.checkPath=function(t){if(process.platform==="win32"&&/[<>:"|?*]/.test(t.replace(ra.parse(t).root,""))){let i=new Error(`Path contains invalid characters: ${t}`);throw i.code="EINVAL",i}}});var oi=S((Gl,Ut)=>{"use strict";var ri=W(),{checkPath:ii}=ti(),ni=e=>{let t={mode:511};return typeof e=="number"?e:{...t,...e}.mode};Ut.exports.makeDir=async(e,t)=>(ii(e),ri.mkdir(e,{mode:ni(t),recursive:!0}));Ut.exports.makeDirSync=(e,t)=>(ii(e),ri.mkdirSync(e,{mode:ni(t),recursive:!0}))});var X=S((Jl,ai)=>{"use strict";var ia=F().fromPromise,{makeDir:na,makeDirSync:Wt}=oi(),Vt=ia(na);ai.exports={mkdirs:Vt,mkdirsSync:Wt,mkdirp:Vt,mkdirpSync:Wt,ensureDir:Vt,ensureDirSync:Wt}});var ne=S((Kl,ci)=>{"use strict";var oa=F().fromPromise,si=W();function aa(e){return si.access(e).then(()=>!0).catch(()=>!1)}ci.exports={pathExists:oa(aa),pathExistsSync:si.existsSync}});var Gt=S((Yl,li)=>{"use strict";var Pe=W(),sa=F().fromPromise;async function ca(e,t,r){let i=await Pe.open(e,"r+"),n=null;try{await Pe.futimes(i,t,r)}finally{try{await Pe.close(i)}catch(o){n=o}}if(n)throw n}function la(e,t,r){let i=Pe.openSync(e,"r+");return Pe.futimesSync(i,t,r),Pe.closeSync(i)}li.exports={utimesMillis:sa(ca),utimesMillisSync:la}});var ye=S((Xl,fi)=>{"use strict";var Re=W(),M=L("path"),di=F().fromPromise;function da(e,t,r){let i=r.dereference?n=>Re.stat(n,{bigint:!0}):n=>Re.lstat(n,{bigint:!0});return Promise.all([i(e),i(t).catch(n=>{if(n.code==="ENOENT")return null;throw n})]).then(([n,o])=>({srcStat:n,destStat:o}))}function ua(e,t,r){let i,n=r.dereference?a=>Re.statSync(a,{bigint:!0}):a=>Re.lstatSync(a,{bigint:!0}),o=n(e);try{i=n(t)}catch(a){if(a.code==="ENOENT")return{srcStat:o,destStat:null};throw a}return{srcStat:o,destStat:i}}async function pa(e,t,r,i){let{srcStat:n,destStat:o}=await da(e,t,i);if(o){if(De(n,o)){let a=M.basename(e),s=M.basename(t);if(r==="move"&&a!==s&&a.toLowerCase()===s.toLowerCase())return{srcStat:n,destStat:o,isChangingCase:!0};throw new Error("Source and destination must not be the same.")}if(n.isDirectory()&&!o.isDirectory())throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);if(!n.isDirectory()&&o.isDirectory())throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`)}if(n.isDirectory()&&Jt(e,t))throw new Error(lt(e,t,r));return{srcStat:n,destStat:o}}function fa(e,t,r,i){let{srcStat:n,destStat:o}=ua(e,t,i);if(o){if(De(n,o)){let a=M.basename(e),s=M.basename(t);if(r==="move"&&a!==s&&a.toLowerCase()===s.toLowerCase())return{srcStat:n,destStat:o,isChangingCase:!0};throw new Error("Source and destination must not be the same.")}if(n.isDirectory()&&!o.isDirectory())throw new Error(`Cannot overwrite non-directory '${t}' with directory '${e}'.`);if(!n.isDirectory()&&o.isDirectory())throw new Error(`Cannot overwrite directory '${t}' with non-directory '${e}'.`)}if(n.isDirectory()&&Jt(e,t))throw new Error(lt(e,t,r));return{srcStat:n,destStat:o}}async function ui(e,t,r,i){let n=M.resolve(M.dirname(e)),o=M.resolve(M.dirname(r));if(o===n||o===M.parse(o).root)return;let a;try{a=await Re.stat(o,{bigint:!0})}catch(s){if(s.code==="ENOENT")return;throw s}if(De(t,a))throw new Error(lt(e,r,i));return ui(e,t,o,i)}function pi(e,t,r,i){let n=M.resolve(M.dirname(e)),o=M.resolve(M.dirname(r));if(o===n||o===M.parse(o).root)return;let a;try{a=Re.statSync(o,{bigint:!0})}catch(s){if(s.code==="ENOENT")return;throw s}if(De(t,a))throw new Error(lt(e,r,i));return pi(e,t,o,i)}function De(e,t){return t.ino!==void 0&&t.dev!==void 0&&t.ino===e.ino&&t.dev===e.dev}function Jt(e,t){let r=M.resolve(e).split(M.sep).filter(n=>n),i=M.resolve(t).split(M.sep).filter(n=>n);return r.every((n,o)=>i[o]===n)}function lt(e,t,r){return`Cannot ${r} '${e}' to a subdirectory of itself, '${t}'.`}fi.exports={checkPaths:di(pa),checkPathsSync:fa,checkParentPaths:di(ui),checkParentPathsSync:pi,isSrcSubdir:Jt,areIdentical:De}});var mi=S((Ql,hi)=>{"use strict";async function ha(e,t){let r=[];for await(let i of e)r.push(t(i).then(()=>null,n=>n??new Error("unknown error")));await Promise.all(r.map(i=>i.then(n=>{if(n!==null)throw n})))}hi.exports={asyncIteratorConcurrentProcess:ha}});var vi=S((Zl,bi)=>{"use strict";var z=W(),Le=L("path"),{mkdirs:ma}=X(),{pathExists:ya}=ne(),{utimesMillis:ga}=Gt(),Fe=ye(),{asyncIteratorConcurrentProcess:wa}=mi();async function ba(e,t,r={}){typeof r=="function"&&(r={filter:r}),r.clobber="clobber"in r?!!r.clobber:!0,r.overwrite="overwrite"in r?!!r.overwrite:r.clobber,r.preserveTimestamps&&process.arch==="ia32"&&process.emitWarning(`Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,"Warning","fs-extra-WARN0001");let{srcStat:i,destStat:n}=await Fe.checkPaths(e,t,"copy",r);if(await Fe.checkParentPaths(e,i,t,"copy"),!await gi(e,t,r))return;let a=Le.dirname(t);await ya(a)||await ma(a),await wi(n,e,t,r)}async function gi(e,t,r){return r.filter?r.filter(e,t):!0}async function wi(e,t,r,i){let o=await(i.dereference?z.stat:z.lstat)(t);if(o.isDirectory())return ka(o,e,t,r,i);if(o.isFile()||o.isCharacterDevice()||o.isBlockDevice())return va(o,e,t,r,i);if(o.isSymbolicLink())return Ea(e,t,r,i);throw o.isSocket()?new Error(`Cannot copy a socket file: ${t}`):o.isFIFO()?new Error(`Cannot copy a FIFO pipe: ${t}`):new Error(`Unknown file: ${t}`)}async function va(e,t,r,i,n){if(!t)return yi(e,r,i,n);if(n.overwrite)return await z.unlink(i),yi(e,r,i,n);if(n.errorOnExist)throw new Error(`'${i}' already exists`)}async function yi(e,t,r,i){if(await z.copyFile(t,r),i.preserveTimestamps){xa(e.mode)&&await Sa(r,e.mode);let n=await z.stat(t);await ga(r,n.atime,n.mtime)}return z.chmod(r,e.mode)}function xa(e){return(e&128)===0}function Sa(e,t){return z.chmod(e,t|128)}async function ka(e,t,r,i,n){t||await z.mkdir(i),await wa(await z.opendir(r),async o=>{let a=Le.join(r,o.name),s=Le.join(i,o.name);if(await gi(a,s,n)){let{destStat:d}=await Fe.checkPaths(a,s,"copy",n);await wi(d,a,s,n)}}),t||await z.chmod(i,e.mode)}async function Ea(e,t,r,i){let n=await z.readlink(t);if(i.dereference&&(n=Le.resolve(process.cwd(),n)),!e)return z.symlink(n,r);let o=null;try{o=await z.readlink(r)}catch(a){if(a.code==="EINVAL"||a.code==="UNKNOWN")return z.symlink(n,r);throw a}if(i.dereference&&(o=Le.resolve(process.cwd(),o)),n!==o){if(Fe.isSrcSubdir(n,o))throw new Error(`Cannot copy '${n}' to a subdirectory of itself, '${o}'.`);if(Fe.isSrcSubdir(o,n))throw new Error(`Cannot overwrite '${o}' with '${n}'.`)}return await z.unlink(r),z.symlink(n,r)}bi.exports=ba});var Pi=S((ed,Ei)=>{"use strict";var V=Ee(),Me=L("path"),Pa=X().mkdirsSync,Ra=Gt().utimesMillisSync,Ae=ye();function $a(e,t,r){typeof r=="function"&&(r={filter:r}),r=r||{},r.clobber="clobber"in r?!!r.clobber:!0,r.overwrite="overwrite"in r?!!r.overwrite:r.clobber,r.preserveTimestamps&&process.arch==="ia32"&&process.emitWarning(`Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,"Warning","fs-extra-WARN0002");let{srcStat:i,destStat:n}=Ae.checkPathsSync(e,t,"copy",r);if(Ae.checkParentPathsSync(e,i,t,"copy"),r.filter&&!r.filter(e,t))return;let o=Me.dirname(t);return V.existsSync(o)||Pa(o),xi(n,e,t,r)}function xi(e,t,r,i){let o=(i.dereference?V.statSync:V.lstatSync)(t);if(o.isDirectory())return _a(o,e,t,r,i);if(o.isFile()||o.isCharacterDevice()||o.isBlockDevice())return Oa(o,e,t,r,i);if(o.isSymbolicLink())return Fa(e,t,r,i);throw o.isSocket()?new Error(`Cannot copy a socket file: ${t}`):o.isFIFO()?new Error(`Cannot copy a FIFO pipe: ${t}`):new Error(`Unknown file: ${t}`)}function Oa(e,t,r,i,n){return t?Ta(e,r,i,n):Si(e,r,i,n)}function Ta(e,t,r,i){if(i.overwrite)return V.unlinkSync(r),Si(e,t,r,i);if(i.errorOnExist)throw new Error(`'${r}' already exists`)}function Si(e,t,r,i){return V.copyFileSync(t,r),i.preserveTimestamps&&ja(e.mode,t,r),Kt(r,e.mode)}function ja(e,t,r){return qa(e)&&Ia(r,e),Ca(t,r)}function qa(e){return(e&128)===0}function Ia(e,t){return Kt(e,t|128)}function Kt(e,t){return V.chmodSync(e,t)}function Ca(e,t){let r=V.statSync(e);return Ra(t,r.atime,r.mtime)}function _a(e,t,r,i,n){return t?ki(r,i,n):Da(e.mode,r,i,n)}function Da(e,t,r,i){return V.mkdirSync(r),ki(t,r,i),Kt(r,e)}function ki(e,t,r){let i=V.opendirSync(e);try{let n;for(;(n=i.readSync())!==null;)La(n.name,e,t,r)}finally{i.closeSync()}}function La(e,t,r,i){let n=Me.join(t,e),o=Me.join(r,e);if(i.filter&&!i.filter(n,o))return;let{destStat:a}=Ae.checkPathsSync(n,o,"copy",i);return xi(a,n,o,i)}function Fa(e,t,r,i){let n=V.readlinkSync(t);if(i.dereference&&(n=Me.resolve(process.cwd(),n)),e){let o;try{o=V.readlinkSync(r)}catch(a){if(a.code==="EINVAL"||a.code==="UNKNOWN")return V.symlinkSync(n,r);throw a}if(i.dereference&&(o=Me.resolve(process.cwd(),o)),n!==o){if(Ae.isSrcSubdir(n,o))throw new Error(`Cannot copy '${n}' to a subdirectory of itself, '${o}'.`);if(Ae.isSrcSubdir(o,n))throw new Error(`Cannot overwrite '${o}' with '${n}'.`)}return Ma(n,r)}else return V.symlinkSync(n,r)}function Ma(e,t){return V.unlinkSync(t),V.symlinkSync(e,t)}Ei.exports=$a});var dt=S((td,Ri)=>{"use strict";var Aa=F().fromPromise;Ri.exports={copy:Aa(vi()),copySync:Pi()}});var Ne=S((rd,Oi)=>{"use strict";var $i=Ee(),Na=F().fromCallback;function Ha(e,t){$i.rm(e,{recursive:!0,force:!0},t)}function Ba(e){$i.rmSync(e,{recursive:!0,force:!0})}Oi.exports={remove:Na(Ha),removeSync:Ba}});var Li=S((id,Di)=>{"use strict";var za=F().fromPromise,qi=W(),Ii=L("path"),Ci=X(),_i=Ne(),Ti=za(async function(t){let r;try{r=await qi.readdir(t)}catch{return Ci.mkdirs(t)}return Promise.all(r.map(i=>_i.remove(Ii.join(t,i))))});function ji(e){let t;try{t=qi.readdirSync(e)}catch{return Ci.mkdirsSync(e)}t.forEach(r=>{r=Ii.join(e,r),_i.removeSync(r)})}Di.exports={emptyDirSync:ji,emptydirSync:ji,emptyDir:Ti,emptydir:Ti}});var Ni=S((nd,Ai)=>{"use strict";var Ua=F().fromPromise,Fi=L("path"),te=W(),Mi=X();async function Wa(e){let t;try{t=await te.stat(e)}catch{}if(t&&t.isFile())return;let r=Fi.dirname(e),i=null;try{i=await te.stat(r)}catch(n){if(n.code==="ENOENT"){await Mi.mkdirs(r),await te.writeFile(e,"");return}else throw n}i.isDirectory()?await te.writeFile(e,""):await te.readdir(r)}function Va(e){let t;try{t=te.statSync(e)}catch{}if(t&&t.isFile())return;let r=Fi.dirname(e);try{te.statSync(r).isDirectory()||te.readdirSync(r)}catch(i){if(i&&i.code==="ENOENT")Mi.mkdirsSync(r);else throw i}te.writeFileSync(e,"")}Ai.exports={createFile:Ua(Wa),createFileSync:Va}});var Wi=S((od,Ui)=>{"use strict";var Ga=F().fromPromise,Hi=L("path"),oe=W(),Bi=X(),{pathExists:Ja}=ne(),{areIdentical:zi}=ye();async function Ka(e,t){let r;try{r=await oe.lstat(t)}catch{}let i;try{i=await oe.lstat(e)}catch(a){throw a.message=a.message.replace("lstat","ensureLink"),a}if(r&&zi(i,r))return;let n=Hi.dirname(t);await Ja(n)||await Bi.mkdirs(n),await oe.link(e,t)}function Ya(e,t){let r;try{r=oe.lstatSync(t)}catch{}try{let o=oe.lstatSync(e);if(r&&zi(o,r))return}catch(o){throw o.message=o.message.replace("lstat","ensureLink"),o}let i=Hi.dirname(t);return oe.existsSync(i)||Bi.mkdirsSync(i),oe.linkSync(e,t)}Ui.exports={createLink:Ga(Ka),createLinkSync:Ya}});var Gi=S((ad,Vi)=>{"use strict";var ae=L("path"),He=W(),{pathExists:Xa}=ne(),Qa=F().fromPromise;async function Za(e,t){if(ae.isAbsolute(e)){try{await He.lstat(e)}catch(o){throw o.message=o.message.replace("lstat","ensureSymlink"),o}return{toCwd:e,toDst:e}}let r=ae.dirname(t),i=ae.join(r,e);if(await Xa(i))return{toCwd:i,toDst:e};try{await He.lstat(e)}catch(o){throw o.message=o.message.replace("lstat","ensureSymlink"),o}return{toCwd:e,toDst:ae.relative(r,e)}}function es(e,t){if(ae.isAbsolute(e)){if(!He.existsSync(e))throw new Error("absolute srcpath does not exist");return{toCwd:e,toDst:e}}let r=ae.dirname(t),i=ae.join(r,e);if(He.existsSync(i))return{toCwd:i,toDst:e};if(!He.existsSync(e))throw new Error("relative srcpath does not exist");return{toCwd:e,toDst:ae.relative(r,e)}}Vi.exports={symlinkPaths:Qa(Za),symlinkPathsSync:es}});var Yi=S((sd,Ki)=>{"use strict";var Ji=W(),ts=F().fromPromise;async function rs(e,t){if(t)return t;let r;try{r=await Ji.lstat(e)}catch{return"file"}return r&&r.isDirectory()?"dir":"file"}function is(e,t){if(t)return t;let r;try{r=Ji.lstatSync(e)}catch{return"file"}return r&&r.isDirectory()?"dir":"file"}Ki.exports={symlinkType:ts(rs),symlinkTypeSync:is}});var en=S((cd,Zi)=>{"use strict";var ns=F().fromPromise,Xi=L("path"),Q=W(),{mkdirs:os,mkdirsSync:as}=X(),{symlinkPaths:ss,symlinkPathsSync:cs}=Gi(),{symlinkType:ls,symlinkTypeSync:ds}=Yi(),{pathExists:us}=ne(),{areIdentical:Qi}=ye();async function ps(e,t,r){let i;try{i=await Q.lstat(t)}catch{}if(i&&i.isSymbolicLink()){let[s,c]=await Promise.all([Q.stat(e),Q.stat(t)]);if(Qi(s,c))return}let n=await ss(e,t);e=n.toDst;let o=await ls(n.toCwd,r),a=Xi.dirname(t);return await us(a)||await os(a),Q.symlink(e,t,o)}function fs(e,t,r){let i;try{i=Q.lstatSync(t)}catch{}if(i&&i.isSymbolicLink()){let s=Q.statSync(e),c=Q.statSync(t);if(Qi(s,c))return}let n=cs(e,t);e=n.toDst,r=ds(n.toCwd,r);let o=Xi.dirname(t);return Q.existsSync(o)||as(o),Q.symlinkSync(e,t,r)}Zi.exports={createSymlink:ns(ps),createSymlinkSync:fs}});var ln=S((ld,cn)=>{"use strict";var{createFile:tn,createFileSync:rn}=Ni(),{createLink:nn,createLinkSync:on}=Wi(),{createSymlink:an,createSymlinkSync:sn}=en();cn.exports={createFile:tn,createFileSync:rn,ensureFile:tn,ensureFileSync:rn,createLink:nn,createLinkSync:on,ensureLink:nn,ensureLinkSync:on,createSymlink:an,createSymlinkSync:sn,ensureSymlink:an,ensureSymlinkSync:sn}});var ut=S((dd,dn)=>{function hs(e,{EOL:t=`
`,finalEOL:r=!0,replacer:i=null,spaces:n}={}){let o=r?t:"";return JSON.stringify(e,i,n).replace(/\n/g,t)+o}function ms(e){return Buffer.isBuffer(e)&&(e=e.toString("utf8")),e.replace(/^\uFEFF/,"")}dn.exports={stringify:hs,stripBom:ms}});var hn=S((ud,fn)=>{var $e;try{$e=Ee()}catch{$e=L("fs")}var pt=F(),{stringify:un,stripBom:pn}=ut();async function ys(e,t={}){typeof t=="string"&&(t={encoding:t});let r=t.fs||$e,i="throws"in t?t.throws:!0,n=await pt.fromCallback(r.readFile)(e,t);n=pn(n);let o;try{o=JSON.parse(n,t?t.reviver:null)}catch(a){if(i)throw a.message=`${e}: ${a.message}`,a;return null}return o}var gs=pt.fromPromise(ys);function ws(e,t={}){typeof t=="string"&&(t={encoding:t});let r=t.fs||$e,i="throws"in t?t.throws:!0;try{let n=r.readFileSync(e,t);return n=pn(n),JSON.parse(n,t.reviver)}catch(n){if(i)throw n.message=`${e}: ${n.message}`,n;return null}}async function bs(e,t,r={}){let i=r.fs||$e,n=un(t,r);await pt.fromCallback(i.writeFile)(e,n,r)}var vs=pt.fromPromise(bs);function xs(e,t,r={}){let i=r.fs||$e,n=un(t,r);return i.writeFileSync(e,n,r)}fn.exports={readFile:gs,readFileSync:ws,writeFile:vs,writeFileSync:xs}});var yn=S((pd,mn)=>{"use strict";var ft=hn();mn.exports={readJson:ft.readFile,readJsonSync:ft.readFileSync,writeJson:ft.writeFile,writeJsonSync:ft.writeFileSync}});var ht=S((fd,bn)=>{"use strict";var Ss=F().fromPromise,Yt=W(),gn=L("path"),wn=X(),ks=ne().pathExists;async function Es(e,t,r="utf-8"){let i=gn.dirname(e);return await ks(i)||await wn.mkdirs(i),Yt.writeFile(e,t,r)}function Ps(e,...t){let r=gn.dirname(e);Yt.existsSync(r)||wn.mkdirsSync(r),Yt.writeFileSync(e,...t)}bn.exports={outputFile:Ss(Es),outputFileSync:Ps}});var xn=S((hd,vn)=>{"use strict";var{stringify:Rs}=ut(),{outputFile:$s}=ht();async function Os(e,t,r={}){let i=Rs(t,r);await $s(e,i,r)}vn.exports=Os});var kn=S((md,Sn)=>{"use strict";var{stringify:Ts}=ut(),{outputFileSync:js}=ht();function qs(e,t,r){let i=Ts(t,r);js(e,i,r)}Sn.exports=qs});var Pn=S((yd,En)=>{"use strict";var Is=F().fromPromise,G=yn();G.outputJson=Is(xn());G.outputJsonSync=kn();G.outputJSON=G.outputJson;G.outputJSONSync=G.outputJsonSync;G.writeJSON=G.writeJson;G.writeJSONSync=G.writeJsonSync;G.readJSON=G.readJson;G.readJSONSync=G.readJsonSync;En.exports=G});var jn=S((gd,Tn)=>{"use strict";var Cs=W(),Rn=L("path"),{copy:_s}=dt(),{remove:On}=Ne(),{mkdirp:Ds}=X(),{pathExists:Ls}=ne(),$n=ye();async function Fs(e,t,r={}){let i=r.overwrite||r.clobber||!1,{srcStat:n,isChangingCase:o=!1}=await $n.checkPaths(e,t,"move",r);await $n.checkParentPaths(e,n,t,"move");let a=Rn.dirname(t);return Rn.parse(a).root!==a&&await Ds(a),Ms(e,t,i,o)}async function Ms(e,t,r,i){if(!i){if(r)await On(t);else if(await Ls(t))throw new Error("dest already exists.")}try{await Cs.rename(e,t)}catch(n){if(n.code!=="EXDEV")throw n;await As(e,t,r)}}async function As(e,t,r){return await _s(e,t,{overwrite:r,errorOnExist:!0,preserveTimestamps:!0}),On(e)}Tn.exports=Fs});var Dn=S((wd,_n)=>{"use strict";var In=Ee(),Qt=L("path"),Ns=dt().copySync,Cn=Ne().removeSync,Hs=X().mkdirpSync,qn=ye();function Bs(e,t,r){r=r||{};let i=r.overwrite||r.clobber||!1,{srcStat:n,isChangingCase:o=!1}=qn.checkPathsSync(e,t,"move",r);return qn.checkParentPathsSync(e,n,t,"move"),zs(t)||Hs(Qt.dirname(t)),Us(e,t,i,o)}function zs(e){let t=Qt.dirname(e);return Qt.parse(t).root===t}function Us(e,t,r,i){if(i)return Xt(e,t,r);if(r)return Cn(t),Xt(e,t,r);if(In.existsSync(t))throw new Error("dest already exists.");return Xt(e,t,r)}function Xt(e,t,r){try{In.renameSync(e,t)}catch(i){if(i.code!=="EXDEV")throw i;return Ws(e,t,r)}}function Ws(e,t,r){return Ns(e,t,{overwrite:r,errorOnExist:!0,preserveTimestamps:!0}),Cn(e)}_n.exports=Bs});var Fn=S((bd,Ln)=>{"use strict";var Vs=F().fromPromise;Ln.exports={move:Vs(jn()),moveSync:Dn()}});var Zt=S((vd,Mn)=>{"use strict";Mn.exports={...W(),...dt(),...Li(),...ln(),...Pn(),...X(),...Fn(),...ht(),...ne(),...Ne()}});import{createServer as eo}from"http";import{Http2ServerRequest as to}from"http2";import{Http2ServerRequest as vt}from"http2";import{Readable as or}from"stream";import ho from"crypto";var ue=class extends Error{constructor(e,t){super(e,t),this.name="RequestError"}},ro=e=>e instanceof ue?e:new ue(e.message,{cause:e}),io=global.Request,je=class extends io{constructor(e,t){typeof e=="object"&&ve in e&&(e=e[ve]()),typeof t?.body?.getReader<"u"&&(t.duplex??="half"),super(e,t)}},no=e=>{let t=[],r=e.rawHeaders;for(let i=0;i<r.length;i+=2){let{[i]:n,[i+1]:o}=r;n.charCodeAt(0)!==58&&t.push([n,o])}return new Headers(t)},sr=Symbol("wrapBodyStream"),oo=(e,t,r,i,n)=>{let o={method:e,headers:r,signal:n.signal};if(e==="TRACE"){o.method="GET";let a=new je(t,o);return Object.defineProperty(a,"method",{get(){return"TRACE"}}),a}if(!(e==="GET"||e==="HEAD"))if("rawBody"in i&&i.rawBody instanceof Buffer)o.body=new ReadableStream({start(a){a.enqueue(i.rawBody),a.close()}});else if(i[sr]){let a;o.body=new ReadableStream({async pull(s){try{a||=or.toWeb(i).getReader();let{done:c,value:d}=await a.read();c?s.close():s.enqueue(d)}catch(c){s.error(c)}}})}else o.body=or.toWeb(i);return new je(t,o)},ve=Symbol("getRequestCache"),ao=Symbol("requestCache"),We=Symbol("incomingKey"),Ve=Symbol("urlKey"),so=Symbol("headersKey"),be=Symbol("abortControllerKey"),co=Symbol("getAbortController"),Ge={get method(){return this[We].method||"GET"},get url(){return this[Ve]},get headers(){return this[so]||=no(this[We])},[co](){return this[ve](),this[be]},[ve](){return this[be]||=new AbortController,this[ao]||=oo(this.method,this[Ve],this.headers,this[We],this[be])}};["body","bodyUsed","cache","credentials","destination","integrity","mode","redirect","referrer","referrerPolicy","signal","keepalive"].forEach(e=>{Object.defineProperty(Ge,e,{get(){return this[ve]()[e]}})});["arrayBuffer","blob","clone","formData","json","text"].forEach(e=>{Object.defineProperty(Ge,e,{value:function(){return this[ve]()[e]()}})});Object.setPrototypeOf(Ge,je.prototype);var lo=(e,t)=>{let r=Object.create(Ge);r[We]=e;let i=e.url||"";if(i[0]!=="/"&&(i.startsWith("http://")||i.startsWith("https://"))){if(e instanceof vt)throw new ue("Absolute URL for :path is not allowed in HTTP/2");try{let s=new URL(i);r[Ve]=s.href}catch(s){throw new ue("Invalid absolute URL",{cause:s})}return r}let n=(e instanceof vt?e.authority:e.headers.host)||t;if(!n)throw new ue("Missing host header");let o;if(e instanceof vt){if(o=e.scheme,!(o==="http"||o==="https"))throw new ue("Unsupported scheme")}else o=e.socket&&e.socket.encrypted?"https":"http";let a=new URL(`${o}://${n}${i}`);if(a.hostname.length!==n.length&&a.hostname!==n.replace(/:\d+$/,""))throw new ue("Invalid host header");return r[Ve]=a.href,r},ar=Symbol("responseCache"),we=Symbol("getResponseCache"),pe=Symbol("cache"),St=global.Response,qe=class cr{#t;#e;[we](){return delete this[pe],this[ar]||=new St(this.#t,this.#e)}constructor(t,r){let i;if(this.#t=t,r instanceof cr){let n=r[ar];if(n){this.#e=n,this[we]();return}else this.#e=r.#e,i=new Headers(r.#e.headers)}else this.#e=r;(typeof t=="string"||typeof t?.getReader<"u"||t instanceof Blob||t instanceof Uint8Array)&&(i||=r?.headers||{"content-type":"text/plain; charset=UTF-8"},this[pe]=[r?.status||200,t,i])}get headers(){let t=this[pe];return t?(t[2]instanceof Headers||(t[2]=new Headers(t[2])),t[2]):this[we]().headers}get status(){return this[pe]?.[0]??this[we]().status}get ok(){let t=this.status;return t>=200&&t<300}};["body","bodyUsed","redirected","statusText","trailers","type","url"].forEach(e=>{Object.defineProperty(qe.prototype,e,{get(){return this[we]()[e]}})});["arrayBuffer","blob","clone","formData","json","text"].forEach(e=>{Object.defineProperty(qe.prototype,e,{value:function(){return this[we]()[e]()}})});Object.setPrototypeOf(qe,St);Object.setPrototypeOf(qe.prototype,St.prototype);async function uo(e){return Promise.race([e,Promise.resolve().then(()=>Promise.resolve(void 0))])}function lr(e,t,r){let i=s=>{e.cancel(s).catch(()=>{})};return t.on("close",i),t.on("error",i),(r??e.read()).then(a,n),e.closed.finally(()=>{t.off("close",i),t.off("error",i)});function n(s){s&&t.destroy(s)}function o(){e.read().then(a,n)}function a({done:s,value:c}){try{if(s)t.end();else if(!t.write(c))t.once("drain",o);else return e.read().then(a,n)}catch(d){n(d)}}}function po(e,t){if(e.locked)throw new TypeError("ReadableStream is locked.");return t.destroyed?void 0:lr(e.getReader(),t)}var dr=e=>{let t={};e instanceof Headers||(e=new Headers(e??void 0));let r=[];for(let[i,n]of e)i==="set-cookie"?r.push(n):t[i]=n;return r.length>0&&(t["set-cookie"]=r),t["content-type"]??="text/plain; charset=UTF-8",t},fo="x-hono-already-sent";typeof global.crypto>"u"&&(global.crypto=ho);var kt=Symbol("outgoingEnded"),mo=()=>new Response(null,{status:400}),ur=e=>new Response(null,{status:e instanceof Error&&(e.name==="TimeoutError"||e.constructor.name==="TimeoutError")?504:500}),xt=(e,t)=>{let r=e instanceof Error?e:new Error("unknown error",{cause:e});r.code==="ERR_STREAM_PREMATURE_CLOSE"?console.info("The user aborted a request."):(console.error(e),t.headersSent||t.writeHead(500,{"Content-Type":"text/plain"}),t.end(`Error: ${r.message}`),t.destroy(r))},pr=e=>{"flushHeaders"in e&&e.writable&&e.flushHeaders()},fr=async(e,t)=>{let[r,i,n]=e[pe];n instanceof Headers&&(n=dr(n)),typeof i=="string"?n["Content-Length"]=Buffer.byteLength(i):i instanceof Uint8Array?n["Content-Length"]=i.byteLength:i instanceof Blob&&(n["Content-Length"]=i.size),t.writeHead(r,n),typeof i=="string"||i instanceof Uint8Array?t.end(i):i instanceof Blob?t.end(new Uint8Array(await i.arrayBuffer())):(pr(t),await po(i,t)?.catch(o=>xt(o,t))),t[kt]?.()},yo=e=>typeof e.then=="function",go=async(e,t,r={})=>{if(yo(e))if(r.errorHandler)try{e=await e}catch(n){let o=await r.errorHandler(n);if(!o)return;e=o}else e=await e.catch(ur);if(pe in e)return fr(e,t);let i=dr(e.headers);if(e.body){let n=e.body.getReader(),o=[],a=!1,s;if(i["transfer-encoding"]!=="chunked"){let c=2;for(let d=0;d<c;d++){s||=n.read();let l=await uo(s).catch(u=>{console.error(u),a=!0});if(!l){if(d===1){await new Promise(u=>setTimeout(u)),c=3;continue}break}if(s=void 0,l.value&&o.push(l.value),l.done){a=!0;break}}a&&!("content-length"in i)&&(i["content-length"]=o.reduce((d,l)=>d+l.length,0))}t.writeHead(e.status,i),o.forEach(c=>{t.write(c)}),a?t.end():(o.length===0&&pr(t),await lr(n,t,s))}else i[fo]||(t.writeHead(e.status,i),t.end());t[kt]?.()},wo=(e,t={})=>{let r=t.autoCleanupIncoming??!0;return t.overrideGlobalObjects!==!1&&global.Request!==je&&(Object.defineProperty(global,"Request",{value:je}),Object.defineProperty(global,"Response",{value:qe})),async(i,n)=>{let o,a;try{a=lo(i,t.hostname);let s=!r||i.method==="GET"||i.method==="HEAD";if(s||(i[sr]=!0,i.on("end",()=>{s=!0}),i instanceof to&&(n[kt]=()=>{s||setTimeout(()=>{s||setTimeout(()=>{i.destroy(),n.destroy()})})})),n.on("close",()=>{a[be]&&(i.errored?a[be].abort(i.errored.toString()):n.writableFinished||a[be].abort("Client connection prematurely closed.")),s||setTimeout(()=>{s||setTimeout(()=>{i.destroy()})})}),o=e(a,{incoming:i,outgoing:n}),pe in o)return fr(o,n)}catch(s){if(o)return xt(s,n);if(t.errorHandler){if(o=await t.errorHandler(a?s:ro(s)),!o)return}else a?o=ur(s):o=mo()}try{return await go(o,n,t)}catch(s){return xt(s,n)}}},bo=e=>{let t=e.fetch,r=wo(t,{hostname:e.hostname,overrideGlobalObjects:e.overrideGlobalObjects,autoCleanupIncoming:e.autoCleanupIncoming});return(e.createServer||eo)(e.serverOptions||{},r)},hr=(e,t)=>{let r=bo(e);return r.listen(e?.port??3e3,e.hostname,()=>{let i=r.address();t&&t(i)}),r};var mr=(e,t=xo)=>{let r=/\.([a-zA-Z0-9]+?)$/,i=e.match(r);if(!i)return;let n=t[i[1]];return n&&n.startsWith("text")&&(n+="; charset=utf-8"),n};var vo={aac:"audio/aac",avi:"video/x-msvideo",avif:"image/avif",av1:"video/av1",bin:"application/octet-stream",bmp:"image/bmp",css:"text/css",csv:"text/csv",eot:"application/vnd.ms-fontobject",epub:"application/epub+zip",gif:"image/gif",gz:"application/gzip",htm:"text/html",html:"text/html",ico:"image/x-icon",ics:"text/calendar",jpeg:"image/jpeg",jpg:"image/jpeg",js:"text/javascript",json:"application/json",jsonld:"application/ld+json",map:"application/json",mid:"audio/x-midi",midi:"audio/x-midi",mjs:"text/javascript",mp3:"audio/mpeg",mp4:"video/mp4",mpeg:"video/mpeg",oga:"audio/ogg",ogv:"video/ogg",ogx:"application/ogg",opus:"audio/opus",otf:"font/otf",pdf:"application/pdf",png:"image/png",rtf:"application/rtf",svg:"image/svg+xml",tif:"image/tiff",tiff:"image/tiff",ts:"video/mp2t",ttf:"font/ttf",txt:"text/plain",wasm:"application/wasm",webm:"video/webm",weba:"audio/webm",webmanifest:"application/manifest+json",webp:"image/webp",woff:"font/woff",woff2:"font/woff2",xhtml:"application/xhtml+xml",xml:"application/xml",zip:"application/zip","3gp":"video/3gpp","3g2":"video/3gpp2",gltf:"model/gltf+json",glb:"model/gltf-binary"},xo=vo;import{createReadStream as yr,statSync as So,existsSync as ko}from"fs";import{join as gr}from"path";import{versions as Eo}from"process";import{Readable as Po}from"stream";var Ro=/^\s*(?:text\/[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i,Pt={br:".br",zstd:".zst",gzip:".gz"},$o=Object.keys(Pt),Oo=()=>{let[e,t]=Eo.node.split(".").map(r=>parseInt(r));return e>=23||e===22&&t>=7||e===20&&t>=18},To=Oo(),wr=e=>To?Po.toWeb(e):new ReadableStream({start(r){e.on("data",i=>{r.enqueue(i)}),e.on("error",i=>{r.error(i)}),e.on("end",()=>{r.close()})},cancel(){e.destroy()}}),Et=e=>{let t;try{t=So(e)}catch{}return t},Je=(e={root:""})=>{let t=e.root||"",r=e.path;return t!==""&&!ko(t)&&console.error(`serveStatic: root path '${t}' is not found, are you sure it's correct?`),async(i,n)=>{if(i.finalized)return n();let o;if(r)o=r;else try{if(o=decodeURIComponent(i.req.path),/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(o))throw new Error}catch{return await e.onNotFound?.(i.req.path,i),n()}let a=gr(t,!r&&e.rewriteRequestPath?e.rewriteRequestPath(o,i):o),s=Et(a);if(s&&s.isDirectory()){let h=e.index??"index.html";a=gr(a,h),s=Et(a)}if(!s)return await e.onNotFound?.(a,i),n();let c=mr(a);if(i.header("Content-Type",c||"application/octet-stream"),e.precompressed&&(!c||Ro.test(c))){let h=new Set(i.req.header("Accept-Encoding")?.split(",").map(p=>p.trim()));for(let p of $o){if(!h.has(p))continue;let f=Et(a+Pt[p]);if(f){i.header("Content-Encoding",p),i.header("Vary","Accept-Encoding",{append:!0}),s=f,a=a+Pt[p];break}}}let d,l=s.size,u=i.req.header("range")||"";if(i.req.method=="HEAD"||i.req.method=="OPTIONS")i.header("Content-Length",l.toString()),i.status(200),d=i.body(null);else if(!u)i.header("Content-Length",l.toString()),d=i.body(wr(yr(a)),200);else{i.header("Accept-Ranges","bytes"),i.header("Date",s.birthtime.toUTCString());let h=u.replace(/bytes=/,"").split("-",2),p=parseInt(h[0],10)||0,f=parseInt(h[1],10)||l-1;l<f-p+1&&(f=l-1);let m=f-p+1,y=yr(a,{start:p,end:f});i.header("Content-Length",m.toString()),i.header("Content-Range",`bytes ${p}-${f}/${s.size}`),d=i.body(wr(y),206)}return await e.onFound?.(a,i),d}};var Rt=(e,t,r)=>(i,n)=>{let o=-1;return a(0);async function a(s){if(s<=o)throw new Error("next() called multiple times");o=s;let c,d=!1,l;if(e[s]?(l=e[s][0][0],i.req.routeIndex=s):l=s===e.length&&n||void 0,l)try{c=await l(i,()=>a(s+1))}catch(u){if(u instanceof Error&&t)i.error=u,c=await t(u,i),d=!0;else throw u}else i.finalized===!1&&r&&(c=await r(i));return c&&(i.finalized===!1||d)&&(i.res=c),i}};var br=Symbol();var vr=async(e,t=Object.create(null))=>{let{all:r=!1,dot:i=!1}=t,o=(e instanceof Ke?e.raw.headers:e.headers).get("Content-Type");return o?.startsWith("multipart/form-data")||o?.startsWith("application/x-www-form-urlencoded")?jo(e,{all:r,dot:i}):{}};async function jo(e,t){let r=await e.formData();return r?qo(r,t):{}}function qo(e,t){let r=Object.create(null);return e.forEach((i,n)=>{t.all||n.endsWith("[]")?Io(r,n,i):r[n]=i}),t.dot&&Object.entries(r).forEach(([i,n])=>{i.includes(".")&&(Co(r,i,n),delete r[i])}),r}var Io=(e,t,r)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(r):e[t]=[e[t],r]:t.endsWith("[]")?e[t]=[r]:e[t]=r},Co=(e,t,r)=>{let i=e,n=t.split(".");n.forEach((o,a)=>{a===n.length-1?i[o]=r:((!i[o]||typeof i[o]!="object"||Array.isArray(i[o])||i[o]instanceof File)&&(i[o]=Object.create(null)),i=i[o])})};var Ot=e=>{let t=e.split("/");return t[0]===""&&t.shift(),t},xr=e=>{let{groups:t,path:r}=_o(e),i=Ot(r);return Do(i,t)},_o=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(r,i)=>{let n=`@${i}`;return t.push([n,r]),n}),{groups:t,path:e}},Do=(e,t)=>{for(let r=t.length-1;r>=0;r--){let[i]=t[r];for(let n=e.length-1;n>=0;n--)if(e[n].includes(i)){e[n]=e[n].replace(i,t[r][1]);break}}return e},Ye={},Sr=(e,t)=>{if(e==="*")return"*";let r=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){let i=`${e}#${t}`;return Ye[i]||(r[2]?Ye[i]=t&&t[0]!==":"&&t[0]!=="*"?[i,r[1],new RegExp(`^${r[2]}(?=/${t})`)]:[e,r[1],new RegExp(`^${r[2]}$`)]:Ye[i]=[e,r[1],!0]),Ye[i]}return null},Xe=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return t(r)}catch{return r}})}},Lo=e=>Xe(e,decodeURI),Tt=e=>{let t=e.url,r=t.indexOf("/",t.indexOf(":")+4),i=r;for(;i<t.length;i++){let n=t.charCodeAt(i);if(n===37){let o=t.indexOf("?",i),a=t.indexOf("#",i),s=o===-1?a===-1?void 0:a:a===-1?o:Math.min(o,a),c=t.slice(r,s);return Lo(c.includes("%25")?c.replace(/%25/g,"%2525"):c)}else if(n===63||n===35)break}return t.slice(r,i)};var kr=e=>{let t=Tt(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},fe=(e,t,...r)=>(r.length&&(t=fe(t,...r)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`),Qe=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;let t=e.split("/"),r=[],i="";return t.forEach(n=>{if(n!==""&&!/\:/.test(n))i+="/"+n;else if(/\:/.test(n))if(/\?/.test(n)){r.length===0&&i===""?r.push("/"):r.push(i);let o=n.replace("?","");i+="/"+o,r.push(i)}else i+="/"+n}),r.filter((n,o,a)=>a.indexOf(n)===o)},$t=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Xe(e,jt):e):e,Er=(e,t,r)=>{let i;if(!r&&t&&!/[%+]/.test(t)){let a=e.indexOf("?",8);if(a===-1)return;for(e.startsWith(t,a+1)||(a=e.indexOf(`&${t}`,a+1));a!==-1;){let s=e.charCodeAt(a+t.length+1);if(s===61){let c=a+t.length+2,d=e.indexOf("&",c);return $t(e.slice(c,d===-1?void 0:d))}else if(s==38||isNaN(s))return"";a=e.indexOf(`&${t}`,a+1)}if(i=/[%+]/.test(e),!i)return}let n={};i??=/[%+]/.test(e);let o=e.indexOf("?",8);for(;o!==-1;){let a=e.indexOf("&",o+1),s=e.indexOf("=",o);s>a&&a!==-1&&(s=-1);let c=e.slice(o+1,s===-1?a===-1?void 0:a:s);if(i&&(c=$t(c)),o=a,c==="")continue;let d;s===-1?d="":(d=e.slice(s+1,a===-1?void 0:a),i&&(d=$t(d))),r?(n[c]&&Array.isArray(n[c])||(n[c]=[]),n[c].push(d)):n[c]??=d}return t?n[t]:n},Pr=Er,Rr=(e,t)=>Er(e,t,!0),jt=decodeURIComponent;var $r=e=>Xe(e,jt),Ke=class{raw;#t;#e;routeIndex=0;path;bodyCache={};constructor(e,t="/",r=[[]]){this.raw=e,this.path=t,this.#e=r,this.#t={}}param(e){return e?this.#r(e):this.#o()}#r(e){let t=this.#e[0][this.routeIndex][1][e],r=this.#n(t);return r&&/\%/.test(r)?$r(r):r}#o(){let e={},t=Object.keys(this.#e[0][this.routeIndex][1]);for(let r of t){let i=this.#n(this.#e[0][this.routeIndex][1][r]);i!==void 0&&(e[r]=/\%/.test(i)?$r(i):i)}return e}#n(e){return this.#e[1]?this.#e[1][e]:e}query(e){return Pr(this.url,e)}queries(e){return Rr(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((r,i)=>{t[i]=r}),t}async parseBody(e){return this.bodyCache.parsedBody??=await vr(this,e)}#i=e=>{let{bodyCache:t,raw:r}=this,i=t[e];if(i)return i;let n=Object.keys(t)[0];return n?t[n].then(o=>(n==="json"&&(o=JSON.stringify(o)),new Response(o)[e]())):t[e]=r[e]()};json(){return this.#i("text").then(e=>JSON.parse(e))}text(){return this.#i("text")}arrayBuffer(){return this.#i("arrayBuffer")}blob(){return this.#i("blob")}formData(){return this.#i("formData")}addValidatedData(e,t){this.#t[e]=t}valid(e){return this.#t[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[br](){return this.#e}get matchedRoutes(){return this.#e[0].map(([[,e]])=>e)}get routePath(){return this.#e[0].map(([[,e]])=>e)[this.routeIndex].path}};var qt={Stringify:1,BeforeStream:2,Stream:3},xe=(e,t)=>{let r=new String(e);return r.isEscaped=!0,r.callbacks=t,r},Fo=/[&<>'"]/,Or=async(e,t)=>{let r="";t||=[];let i=await Promise.all(e);for(let n=i.length-1;r+=i[n],n--,!(n<0);n--){let o=i[n];typeof o=="object"&&t.push(...o.callbacks||[]);let a=o.isEscaped;if(o=await(typeof o=="object"?o.toString():o),typeof o=="object"&&t.push(...o.callbacks||[]),o.isEscaped??a)r+=o;else{let s=[r];Ze(o,s),r=s[0]}}return xe(r,t)},Ze=(e,t)=>{let r=e.search(Fo);if(r===-1){t[0]+=e;return}let i,n,o=0;for(n=r;n<e.length;n++){switch(e.charCodeAt(n)){case 34:i="&quot;";break;case 39:i="&#39;";break;case 38:i="&amp;";break;case 60:i="&lt;";break;case 62:i="&gt;";break;default:continue}t[0]+=e.substring(o,n)+i,o=n+1}t[0]+=e.substring(o,n)},Tr=e=>{let t=e.callbacks;if(!t?.length)return e;let r=[e],i={};return t.forEach(n=>n({phase:qt.Stringify,buffer:r,context:i})),r[0]},It=async(e,t,r,i,n)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let o=e.callbacks;if(!o?.length)return Promise.resolve(e);n?n[0]+=e:n=[e];let a=Promise.all(o.map(s=>s({phase:t,buffer:n,context:i}))).then(s=>Promise.all(s.filter(Boolean).map(c=>It(c,t,!1,i,n))).then(()=>n[0]));return r?xe(await a,o):a};var Mo="text/plain; charset=UTF-8",Ct=(e,t)=>({"Content-Type":e,...t}),jr=class{#t;#e;env={};#r;finalized=!1;error;#o;#n;#i;#d;#c;#l;#s;#u;#p;constructor(e,t){this.#t=e,t&&(this.#n=t.executionCtx,this.env=t.env,this.#l=t.notFoundHandler,this.#p=t.path,this.#u=t.matchResult)}get req(){return this.#e??=new Ke(this.#t,this.#p,this.#u),this.#e}get event(){if(this.#n&&"respondWith"in this.#n)return this.#n;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#n)return this.#n;throw Error("This context has no ExecutionContext")}get res(){return this.#i||=new Response(null,{headers:this.#s??=new Headers})}set res(e){if(this.#i&&e){e=new Response(e.body,e);for(let[t,r]of this.#i.headers.entries())if(t!=="content-type")if(t==="set-cookie"){let i=this.#i.headers.getSetCookie();e.headers.delete("set-cookie");for(let n of i)e.headers.append("set-cookie",n)}else e.headers.set(t,r)}this.#i=e,this.finalized=!0}render=(...e)=>(this.#c??=t=>this.html(t),this.#c(...e));setLayout=e=>this.#d=e;getLayout=()=>this.#d;setRenderer=e=>{this.#c=e};header=(e,t,r)=>{this.finalized&&(this.#i=new Response(this.#i.body,this.#i));let i=this.#i?this.#i.headers:this.#s??=new Headers;t===void 0?i.delete(e):r?.append?i.append(e,t):i.set(e,t)};status=e=>{this.#o=e};set=(e,t)=>{this.#r??=new Map,this.#r.set(e,t)};get=e=>this.#r?this.#r.get(e):void 0;get var(){return this.#r?Object.fromEntries(this.#r):{}}#a(e,t,r){let i=this.#i?new Headers(this.#i.headers):this.#s??new Headers;if(typeof t=="object"&&"headers"in t){let o=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[a,s]of o)a.toLowerCase()==="set-cookie"?i.append(a,s):i.set(a,s)}if(r)for(let[o,a]of Object.entries(r))if(typeof a=="string")i.set(o,a);else{i.delete(o);for(let s of a)i.append(o,s)}let n=typeof t=="number"?t:t?.status??this.#o;return new Response(e,{status:n,headers:i})}newResponse=(...e)=>this.#a(...e);body=(e,t,r)=>this.#a(e,t,r);text=(e,t,r)=>!this.#s&&!this.#o&&!t&&!r&&!this.finalized?new Response(e):this.#a(e,t,Ct(Mo,r));json=(e,t,r)=>this.#a(JSON.stringify(e),t,Ct("application/json",r));html=(e,t,r)=>{let i=n=>this.#a(n,t,Ct("text/html; charset=UTF-8",r));return typeof e=="object"?It(e,qt.Stringify,!1,{}).then(i):i(e)};redirect=(e,t)=>{let r=String(e);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,t??302)};notFound=()=>(this.#l??=()=>new Response,this.#l(this))};var O="ALL",qr="all",Ir=["get","post","put","delete","options","patch"],et="Can not add a route since the matcher is already built.",tt=class extends Error{};var Cr="__COMPOSED_HANDLER";var Ao=e=>e.text("404 Not Found",404),_r=(e,t)=>{if("getResponse"in e){let r=e.getResponse();return t.newResponse(r.body,r)}return console.error(e),t.text("Internal Server Error",500)},Dr=class Lr{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath="/";#t="/";routes=[];constructor(t={}){[...Ir,qr].forEach(o=>{this[o]=(a,...s)=>(typeof a=="string"?this.#t=a:this.#o(o,this.#t,a),s.forEach(c=>{this.#o(o,this.#t,c)}),this)}),this.on=(o,a,...s)=>{for(let c of[a].flat()){this.#t=c;for(let d of[o].flat())s.map(l=>{this.#o(d.toUpperCase(),this.#t,l)})}return this},this.use=(o,...a)=>(typeof o=="string"?this.#t=o:(this.#t="*",a.unshift(o)),a.forEach(s=>{this.#o(O,this.#t,s)}),this);let{strict:i,...n}=t;Object.assign(this,n),this.getPath=i??!0?t.getPath??Tt:kr}#e(){let t=new Lr({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,t.#r=this.#r,t.routes=this.routes,t}#r=Ao;errorHandler=_r;route(t,r){let i=this.basePath(t);return r.routes.map(n=>{let o;r.errorHandler===_r?o=n.handler:(o=async(a,s)=>(await Rt([],r.errorHandler)(a,()=>n.handler(a,s))).res,o[Cr]=n.handler),i.#o(n.method,n.path,o)}),this}basePath(t){let r=this.#e();return r._basePath=fe(this._basePath,t),r}onError=t=>(this.errorHandler=t,this);notFound=t=>(this.#r=t,this);mount(t,r,i){let n,o;i&&(typeof i=="function"?o=i:(o=i.optionHandler,i.replaceRequest===!1?n=c=>c:n=i.replaceRequest));let a=o?c=>{let d=o(c);return Array.isArray(d)?d:[d]}:c=>{let d;try{d=c.executionCtx}catch{}return[c.env,d]};n||=(()=>{let c=fe(this._basePath,t),d=c==="/"?0:c.length;return l=>{let u=new URL(l.url);return u.pathname=u.pathname.slice(d)||"/",new Request(u,l)}})();let s=async(c,d)=>{let l=await r(n(c.req.raw),...a(c));if(l)return l;await d()};return this.#o(O,fe(t,"*"),s),this}#o(t,r,i){t=t.toUpperCase(),r=fe(this._basePath,r);let n={basePath:this._basePath,path:r,method:t,handler:i};this.router.add(t,r,[i,n]),this.routes.push(n)}#n(t,r){if(t instanceof Error)return this.errorHandler(t,r);throw t}#i(t,r,i,n){if(n==="HEAD")return(async()=>new Response(null,await this.#i(t,r,i,"GET")))();let o=this.getPath(t,{env:i}),a=this.router.match(n,o),s=new jr(t,{path:o,matchResult:a,env:i,executionCtx:r,notFoundHandler:this.#r});if(a[0].length===1){let d;try{d=a[0][0][0][0](s,async()=>{s.res=await this.#r(s)})}catch(l){return this.#n(l,s)}return d instanceof Promise?d.then(l=>l||(s.finalized?s.res:this.#r(s))).catch(l=>this.#n(l,s)):d??this.#r(s)}let c=Rt(a[0],this.errorHandler,this.#r);return(async()=>{try{let d=await c(s);if(!d.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return d.res}catch(d){return this.#n(d,s)}})()}fetch=(t,...r)=>this.#i(t,r[1],r[0],t.method);request=(t,r,i,n)=>t instanceof Request?this.fetch(r?new Request(t,r):t,i,n):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${fe("/",t)}`,r),i,n));fire=()=>{addEventListener("fetch",t=>{t.respondWith(this.#i(t.request,t,void 0,t.request.method))})}};var rt=[];function _t(e,t){let r=this.buildAllMatchers(),i=((n,o)=>{let a=r[n]||r[O],s=a[2][o];if(s)return s;let c=o.match(a[0]);if(!c)return[[],rt];let d=c.indexOf("",1);return[a[1][d],c]});return this.match=i,i(e,t)}var it="[^/]+",Ie=".*",Ce="(?:|/.*)",he=Symbol(),No=new Set(".\\+*[^]$()");function Ho(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===Ie||e===Ce?1:t===Ie||t===Ce?-1:e===it?1:t===it?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var Fr=class Dt{#t;#e;#r=Object.create(null);insert(t,r,i,n,o){if(t.length===0){if(this.#t!==void 0)throw he;if(o)return;this.#t=r;return}let[a,...s]=t,c=a==="*"?s.length===0?["","",Ie]:["","",it]:a==="/*"?["","",Ce]:a.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),d;if(c){let l=c[1],u=c[2]||it;if(l&&c[2]&&(u===".*"||(u=u.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(u))))throw he;if(d=this.#r[u],!d){if(Object.keys(this.#r).some(h=>h!==Ie&&h!==Ce))throw he;if(o)return;d=this.#r[u]=new Dt,l!==""&&(d.#e=n.varIndex++)}!o&&l!==""&&i.push([l,d.#e])}else if(d=this.#r[a],!d){if(Object.keys(this.#r).some(l=>l.length>1&&l!==Ie&&l!==Ce))throw he;if(o)return;d=this.#r[a]=new Dt}d.insert(s,r,i,n,o)}buildRegExpStr(){let r=Object.keys(this.#r).sort(Ho).map(i=>{let n=this.#r[i];return(typeof n.#e=="number"?`(${i})@${n.#e}`:No.has(i)?`\\${i}`:i)+n.buildRegExpStr()});return typeof this.#t=="number"&&r.unshift(`#${this.#t}`),r.length===0?"":r.length===1?r[0]:"(?:"+r.join("|")+")"}};var Mr=class{#t={varIndex:0};#e=new Fr;insert(e,t,r){let i=[],n=[];for(let a=0;;){let s=!1;if(e=e.replace(/\{[^}]+\}/g,c=>{let d=`@\\${a}`;return n[a]=[d,c],a++,s=!0,d}),!s)break}let o=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let a=n.length-1;a>=0;a--){let[s]=n[a];for(let c=o.length-1;c>=0;c--)if(o[c].indexOf(s)!==-1){o[c]=o[c].replace(s,n[a][1]);break}}return this.#e.insert(o,t,i,this.#t,r),i}buildRegExp(){let e=this.#e.buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0,r=[],i=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(n,o,a)=>o!==void 0?(r[++t]=Number(o),"$()"):(a!==void 0&&(i[Number(a)]=++t),"")),[new RegExp(`^${e}`),r,i]}};var Bo=[/^$/,[],Object.create(null)],Ar=Object.create(null);function Nr(e){return Ar[e]??=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,r)=>r?`\\${r}`:"(?:|/.*)")}$`)}function zo(){Ar=Object.create(null)}function Uo(e){let t=new Mr,r=[];if(e.length===0)return Bo;let i=e.map(d=>[!/\*|\/:/.test(d[0]),...d]).sort(([d,l],[u,h])=>d?1:u?-1:l.length-h.length),n=Object.create(null);for(let d=0,l=-1,u=i.length;d<u;d++){let[h,p,f]=i[d];h?n[p]=[f.map(([y])=>[y,Object.create(null)]),rt]:l++;let m;try{m=t.insert(p,l,h)}catch(y){throw y===he?new tt(p):y}h||(r[l]=f.map(([y,b])=>{let R=Object.create(null);for(b-=1;b>=0;b--){let[k,C]=m[b];R[k]=C}return[y,R]}))}let[o,a,s]=t.buildRegExp();for(let d=0,l=r.length;d<l;d++)for(let u=0,h=r[d].length;u<h;u++){let p=r[d][u]?.[1];if(!p)continue;let f=Object.keys(p);for(let m=0,y=f.length;m<y;m++)p[f[m]]=s[p[f[m]]]}let c=[];for(let d in a)c[d]=r[a[d]];return[o,c,n]}function Se(e,t){if(e){for(let r of Object.keys(e).sort((i,n)=>n.length-i.length))if(Nr(r).test(t))return[...e[r]]}}var nt=class{name="RegExpRouter";#t;#e;constructor(){this.#t={[O]:Object.create(null)},this.#e={[O]:Object.create(null)}}add(e,t,r){let i=this.#t,n=this.#e;if(!i||!n)throw new Error(et);i[e]||[i,n].forEach(s=>{s[e]=Object.create(null),Object.keys(s[O]).forEach(c=>{s[e][c]=[...s[O][c]]})}),t==="/*"&&(t="*");let o=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let s=Nr(t);e===O?Object.keys(i).forEach(c=>{i[c][t]||=Se(i[c],t)||Se(i[O],t)||[]}):i[e][t]||=Se(i[e],t)||Se(i[O],t)||[],Object.keys(i).forEach(c=>{(e===O||e===c)&&Object.keys(i[c]).forEach(d=>{s.test(d)&&i[c][d].push([r,o])})}),Object.keys(n).forEach(c=>{(e===O||e===c)&&Object.keys(n[c]).forEach(d=>s.test(d)&&n[c][d].push([r,o]))});return}let a=Qe(t)||[t];for(let s=0,c=a.length;s<c;s++){let d=a[s];Object.keys(n).forEach(l=>{(e===O||e===l)&&(n[l][d]||=[...Se(i[l],d)||Se(i[O],d)||[]],n[l][d].push([r,o-c+s+1]))})}}match=_t;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#e).concat(Object.keys(this.#t)).forEach(t=>{e[t]||=this.#r(t)}),this.#t=this.#e=void 0,zo(),e}#r(e){let t=[],r=e===O;return[this.#t,this.#e].forEach(i=>{let n=i[e]?Object.keys(i[e]).map(o=>[o,i[e][o]]):[];n.length!==0?(r||=!0,t.push(...n)):e!==O&&t.push(...Object.keys(i[O]).map(o=>[o,i[O][o]]))}),r?Uo(t):null}};var Lt=class{name="SmartRouter";#t=[];#e=[];constructor(e){this.#t=e.routers}add(e,t,r){if(!this.#e)throw new Error(et);this.#e.push([e,t,r])}match(e,t){if(!this.#e)throw new Error("Fatal error");let r=this.#t,i=this.#e,n=r.length,o=0,a;for(;o<n;o++){let s=r[o];try{for(let c=0,d=i.length;c<d;c++)s.add(...i[c]);a=s.match(e,t)}catch(c){if(c instanceof tt)continue;throw c}this.match=s.match.bind(s),this.#t=[s],this.#e=void 0;break}if(o===n)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,a}get activeRouter(){if(this.#e||this.#t.length!==1)throw new Error("No active router has been determined yet.");return this.#t[0]}};var _e=Object.create(null),Hr=class Br{#t;#e;#r;#o=0;#n=_e;constructor(t,r,i){if(this.#e=i||Object.create(null),this.#t=[],t&&r){let n=Object.create(null);n[t]={handler:r,possibleKeys:[],score:0},this.#t=[n]}this.#r=[]}insert(t,r,i){this.#o=++this.#o;let n=this,o=xr(r),a=[];for(let s=0,c=o.length;s<c;s++){let d=o[s],l=o[s+1],u=Sr(d,l),h=Array.isArray(u)?u[0]:d;if(h in n.#e){n=n.#e[h],u&&a.push(u[1]);continue}n.#e[h]=new Br,u&&(n.#r.push(u),a.push(u[1])),n=n.#e[h]}return n.#t.push({[t]:{handler:i,possibleKeys:a.filter((s,c,d)=>d.indexOf(s)===c),score:this.#o}}),n}#i(t,r,i,n){let o=[];for(let a=0,s=t.#t.length;a<s;a++){let c=t.#t[a],d=c[r]||c[O],l={};if(d!==void 0&&(d.params=Object.create(null),o.push(d),i!==_e||n&&n!==_e))for(let u=0,h=d.possibleKeys.length;u<h;u++){let p=d.possibleKeys[u],f=l[d.score];d.params[p]=n?.[p]&&!f?n[p]:i[p]??n?.[p],l[d.score]=!0}}return o}search(t,r){let i=[];this.#n=_e;let o=[this],a=Ot(r),s=[];for(let c=0,d=a.length;c<d;c++){let l=a[c],u=c===d-1,h=[];for(let p=0,f=o.length;p<f;p++){let m=o[p],y=m.#e[l];y&&(y.#n=m.#n,u?(y.#e["*"]&&i.push(...this.#i(y.#e["*"],t,m.#n)),i.push(...this.#i(y,t,m.#n))):h.push(y));for(let b=0,R=m.#r.length;b<R;b++){let k=m.#r[b],C=m.#n===_e?{}:{...m.#n};if(k==="*"){let x=m.#e["*"];x&&(i.push(...this.#i(x,t,m.#n)),x.#n=C,h.push(x));continue}let[Ue,Te,de]=k;if(!l&&!(de instanceof RegExp))continue;let K=m.#e[Ue],g=a.slice(c).join("/");if(de instanceof RegExp){let x=de.exec(g);if(x){if(C[Te]=x[0],i.push(...this.#i(K,t,m.#n,C)),Object.keys(K.#e).length){K.#n=C;let E=x[0].match(/\//)?.length??0;(s[E]||=[]).push(K)}continue}}(de===!0||de.test(l))&&(C[Te]=l,u?(i.push(...this.#i(K,t,C,m.#n)),K.#e["*"]&&i.push(...this.#i(K.#e["*"],t,C,m.#n))):(K.#n=C,h.push(K)))}}o=h.concat(s.shift()??[])}return i.length>1&&i.sort((c,d)=>c.score-d.score),[i.map(({handler:c,params:d})=>[c,d])]}};var Ft=class{name="TrieRouter";#t;constructor(){this.#t=new Hr}add(e,t,r){let i=Qe(t);if(i){for(let n=0,o=i.length;n<o;n++)this.#t.insert(e,i[n],r);return}this.#t.insert(e,t,r)}match(e,t){return this.#t.search(e,t)}};var Mt=class extends Dr{constructor(e={}){super(e),this.router=e.router??new Lt({routers:[new nt,new Ft]})}};var w=nr(Zt(),1);import A from"path";import ec from"os";var Oe=nr(Zt(),1);import re from"path";import{spawn as Gs}from"child_process";import{fileURLToPath as Js}from"url";var Ks=Js(import.meta.url),Ys=re.dirname(Ks),An=Ys,J=re.join(An,"cached_videos"),se=re.join(J,"metadata"),Xs=re.join(J,"subtitles"),Be=re.join(J,"thumbnails"),mt=re.join(An,"server_data"),ge=re.join(mt,"history.json"),ce=re.join(mt,"playlists.json"),yt=re.join(mt,"subscriptions.json");(async()=>(await Oe.default.ensureDir(J),await Oe.default.ensureDir(se),await Oe.default.ensureDir(Xs),await Oe.default.ensureDir(Be),await Oe.default.ensureDir(mt)))();var Qs=2,er=0,tr=[],le=new Map,ze=(e,t=null)=>new Promise((r,i)=>{let n=()=>{er++;let o=e.includes("--dump-json")||e.includes("--dump-single-json");console.log(o?"[YT-DLP] Fetching metadata...":`
[YT-DLP] Executing: yt-dlp ${e.filter(d=>!d.startsWith("http")).join(" ")}`);let a=Gs("yt-dlp",[...e]),s="",c="";a.stdout.on("data",d=>{let l=d.toString();s+=l;let u=l.trim(),h=u.startsWith("{")||u.startsWith("["),p=u.includes("[download]")||u.includes("[info]");if(!o&&!h&&(p||u.length<200)&&process.stdout.write(l),t){let f=l.match(/\[download\]\s+(\d+\.?\d+)%/);f&&t(parseFloat(f[1]))}}),a.stderr.on("data",d=>{let l=d.toString();c+=l,!(l.includes("hls")||l.includes("http")||l.includes("WARNING")||l.includes("Extracting URL")||l.includes("Downloading")&&l.includes("webpage"))&&l.trim().length>0&&process.stderr.write(l)}),a.on("close",d=>{if(er--,tr.length>0){let l=tr.shift();l&&l()}d===0||d===1&&s.trim()?r(s):i(new Error(c||"yt-dlp failed"))})};er<Qs?n():tr.push(n)});var gt=e=>typeof e=="number"?Math.floor(e/60)+":"+(e%60).toString().padStart(2,"0"):e,wt=e=>e?e>1e6?(e/1e6).toFixed(1)+"jt":e>1e3?(e/1e3).toFixed(0)+"rb":e+"":"";var v=(e,...t)=>{let r=[""];for(let i=0,n=e.length-1;i<n;i++){r[0]+=e[i];let o=Array.isArray(t[i])?t[i].flat(1/0):[t[i]];for(let a=0,s=o.length;a<s;a++){let c=o[a];if(typeof c=="string")Ze(c,r);else if(typeof c=="number")r[0]+=c;else{if(typeof c=="boolean"||c===null||c===void 0)continue;if(typeof c=="object"&&c.isEscaped)if(c.callbacks)r.unshift("",c);else{let d=c.toString();d instanceof Promise?r.unshift("",d):r[0]+=d}else c instanceof Promise?r.unshift("",c):Ze(c.toString(),r)}}}return r[0]+=e.at(-1),r.length===1?"callbacks"in r?xe(Tr(xe(r[0],r.callbacks))):xe(r[0]):Or(r,r.callbacks)};var Y=e=>{let{title:t,activePage:r,playingVideo:i,query:n,children:o,subscriptions:a}=e,s=c=>c?c.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n"):"";return v`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${t||"YT-Studio"}</title>
    <link rel="shortcut icon" href="/static/favicon.ico" type="image/x-icon">
    <meta name="referrer" content="no-referrer">
    <script defer src="/static/alpine.min.js"></script>
    <style>
        :root {
            --bg: #0a0a0c; --surface: #16161a; --surface-accent: #23232a;
            --primary: #ff0000ff; --primary-glow: rgba(88, 101, 242, 0.3);
            --text-main: #ffffff; --text-dim: #a0a0ab;
            --bottom-nav-height: 70px; --safe-area-inset-bottom: env(safe-area-inset-bottom);
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; padding: 0; background: var(--bg); color: var(--text-main); font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; display: flex; flex-direction: column; min-height: 100vh; }
        header { position: sticky; top: 0; z-index: 100; background: rgba(10, 10, 12, 0.85); backdrop-filter: blur(20px); padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .logo { font-weight: 700; font-size: 1.2rem; letter-spacing: -0.5px; background: linear-gradient(135deg, #fff 0%, #a0a0ab 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer; }
        .search-trigger { background: var(--surface); padding: 8px 15px; border-radius: 20px; display: flex; align-items: center; gap: 10px; color: var(--text-dim); font-size: 0.9rem; flex: 1; margin: 0 15px; border: 1px solid rgba(255, 255, 255, 0.03); }
        .app-container { display: flex; min-height: 80vh; }
        .mobile-only { display: none; }
        .desktop-only { display: block; }
        .desktop-sidebar { 
            display: none; width: 240px; background: rgba(22, 22, 26, 0.95); backdrop-filter: blur(20px); 
            border-right: 1px solid rgba(255, 255, 255, 0.05); position: fixed; top: 70px; bottom: 0; 
            padding: 20px 0; z-index: 1000; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            transform: translateX(-100%); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .desktop-sidebar::-webkit-scrollbar { width: 5px; }
        .desktop-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .desktop-sidebar.open { display: block; transform: translateX(0); }
        .side-nav-item { display: flex; align-items: center; gap: 15px; padding: 12px 20px; border-radius: 12px; color: var(--text-dim); text-decoration: none; margin-bottom: 5px; transition: all 0.2s; font-weight: 500; font-size: 0.9rem; }
        .side-nav-item i { width: 24px; text-align: center; display: flex; justify-content: center; }
        .side-nav-item:hover { background: var(--surface); color: white; }
        .side-nav-item.active { background: var(--surface-accent); color: var(--primary); }

        /* Feather Icon System */
        .icon {
            display: inline-block;
            width: 1.25em;
            height: 1.25em;
            background-color: currentColor;
            -webkit-mask-size: contain;
            mask-size: contain;
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
            -webkit-mask-position: center;
            mask-position: center;
            vertical-align: middle;
        }
        .icon-search { -webkit-mask-image: url(/static/feather/search.svg); mask-image: url(/static/feather/search.svg); }
        .icon-menu { -webkit-mask-image: url(/static/feather/menu.svg); mask-image: url(/static/feather/menu.svg); }
        .icon-x { -webkit-mask-image: url(/static/feather/x.svg); mask-image: url(/static/feather/x.svg); }
        .icon-home { -webkit-mask-image: url(/static/feather/home.svg); mask-image: url(/static/feather/home.svg); }
        .icon-list { -webkit-mask-image: url(/static/feather/list.svg); mask-image: url(/static/feather/list.svg); }
        .icon-clock { -webkit-mask-image: url(/static/feather/clock.svg); mask-image: url(/static/feather/clock.svg); }
        .icon-download { -webkit-mask-image: url(/static/feather/download.svg); mask-image: url(/static/feather/download.svg); }
        .icon-play { -webkit-mask-image: url(/static/feather/play.svg); mask-image: url(/static/feather/play.svg); }
        .icon-pause { -webkit-mask-image: url(/static/feather/pause.svg); mask-image: url(/static/feather/pause.svg); }
        .icon-plus { -webkit-mask-image: url(/static/feather/plus.svg); mask-image: url(/static/feather/plus.svg); }
        .icon-more-vertical { -webkit-mask-image: url(/static/feather/more-vertical.svg); mask-image: url(/static/feather/more-vertical.svg); }
        .icon-user-plus { -webkit-mask-image: url(/static/feather/user-plus.svg); mask-image: url(/static/feather/user-plus.svg); }
        .icon-user-minus { -webkit-mask-image: url(/static/feather/user-minus.svg); mask-image: url(/static/feather/user-minus.svg); }
        .icon-arrow-left { -webkit-mask-image: url(/static/feather/arrow-left.svg); mask-image: url(/static/feather/arrow-left.svg); }
        .icon-chevron-right { -webkit-mask-image: url(/static/feather/chevron-right.svg); mask-image: url(/static/feather/chevron-right.svg); }
        .icon-trash { -webkit-mask-image: url(/static/feather/trash-2.svg); mask-image: url(/static/feather/trash-2.svg); }
        .icon-check { -webkit-mask-image: url(/static/feather/check.svg); mask-image: url(/static/feather/check.svg); }
        .icon-check-circle { -webkit-mask-image: url(/static/feather/check-circle.svg); mask-image: url(/static/feather/check-circle.svg); }
        .icon-alert-circle { -webkit-mask-image: url(/static/feather/alert-circle.svg); mask-image: url(/static/feather/alert-circle.svg); }
        .icon-info { -webkit-mask-image: url(/static/feather/info.svg); mask-image: url(/static/feather/info.svg); }
        .icon-download-cloud { -webkit-mask-image: url(/static/feather/download-cloud.svg); mask-image: url(/static/feather/download-cloud.svg); }
        .icon-folder { -webkit-mask-image: url(/static/feather/folder.svg); mask-image: url(/static/feather/folder.svg); }
        .icon-rotate-ccw { -webkit-mask-image: url(/static/feather/rotate-ccw.svg); mask-image: url(/static/feather/rotate-ccw.svg); }
        main { padding: 15px; padding-bottom: calc(20px + var(--safe-area-inset-bottom)); flex: 1; transition: margin-left 0.3s; }
        
        @media (max-width: 991px) {
            .mobile-only { display: block; cursor: pointer; }
            .desktop-only { display: none; }
            .logo { background: none; -webkit-text-fill-color: initial; }
            .desktop-sidebar { display: block; z-index: 2000; } 
            
            /* Overlay when sidebar open on mobile */
            .sidebar-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 1500;
                backdrop-filter: blur(4px);
            }
        }
        
        /* Toast Notification Styles */
        #toast-container {
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px; pointer-events: none;
        }
        .toast {
            background: var(--surface-accent); color: white; padding: 12px 24px;
            border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            font-size: 0.9rem; font-weight: 500;
            display: flex; align-items: center; gap: 10px;
            transform: translateX(120%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
        }
        .toast.show { transform: translateX(0); }
        .toast-info i { color: #3498db; }
        .toast-success i { color: #2ecc71; }
        .toast-error i { color: #e74c3c; }
        
        /* Bottom nav removed */
        
        .video-card { background: var(--surface); border-radius: 16px; margin-bottom: 18px; border: 1px solid rgba(255, 255, 255, 0.03); transition: transform 0.2s; position: relative; }
        .video-card:active { transform: scale(0.98); }
        .thumb-container { position: relative; width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 16px 16px 0 0; overflow: hidden; }
        .thumb-container img { width: 100%; height: 100%; object-fit: cover; }
        .duration-tag { position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.8); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
        .video-meta { padding: 12px 0; display: flex; gap: 12px; }
        .video-info { flex: 1; min-width: 0; position: relative; }
        .video-title { font-size: 1rem; font-weight: 600; line-height: 1.4; margin-bottom: 4px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; padding-right: 24px; color: #fff; }
        .video-subtext { font-size: 0.85rem; color: var(--text-dim); display: flex; flex-direction: column; gap: 2px; }
        .video-subtext span:hover { color: #fff; }
        .dot { width: 3px; height: 3px; background: currentColor; border-radius: 50%; opacity: 0.5; }
        @media (min-width: 768px) { main { max-width: 600px; margin: 0 auto; } }
        @media (min-width: 992px) { 
            header { padding: 15px 40px; } 
            .search-trigger { max-width: 500px; margin: 0 auto; } 
            .desktop-sidebar { display: block; transform: translateX(0); background: rgba(22, 22, 26, 0.5); z-index: 90; } 
            main { margin-left: 240px; padding: 30px 40px; max-width: none; } 
            nav.bottom-nav { display: none; } 
            .mobile-only { display: none; }
            .desktop-only { display: block; }
            .logo { background: linear-gradient(135deg, #fff 0%, #a0a0ab 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        }
        @media (min-width: 1400px) { main { max-width: 1400px; margin-right: auto; } }
        /* Mini Player */
        /* Mini Player Overlay (Bottom Bar Style) */
        .mini-player-overlay { 
            position: fixed; 
            bottom: 0;
            left: 0; 
            right: 0; 
            background: rgba(10, 10, 12, 0.98); 
            backdrop-filter: blur(20px);
            display: flex; 
            align-items: center; 
            gap: 12px; 
            padding: 8px 15px; 
            padding-bottom: calc(8px + var(--safe-area-inset-bottom));
            z-index: 999; 
            box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.5); 
            border-top: 1px solid rgba(255, 255, 255, 0.08); 
            cursor: pointer; 
            transition: all 0.3s ease;
        }
        .mini-player-thumb { width: 45px; height: 45px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .mini-player-info { flex: 1; min-width: 0; }
        .mini-player-info h4 { margin: 0; font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
        .mini-player-info p { margin: 1px 0 0; font-size: 0.75rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mini-player-ctrl { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #fff; border-radius: 50%; transition: background 0.2; }
        .mini-player-ctrl:hover { background: rgba(255,255,255,0.1); }
        .mini-player-ctrl.close { color: var(--text-dim); }
        
        @media (min-width: 992px) { 
            .mini-player-overlay { 
                left: 240px; /* Offset by sidebar width */
                border-left: 1px solid rgba(255, 255, 255, 0.08);
            } 
        }
        .suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin-top: 5px; z-index: 1000; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
        .suggestion-item { padding: 12px 15px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text-dim); transition: all 0.2s; }
        .suggestion-item:hover, .suggestion-item.selected { background: var(--surface-accent); color: white; }
    </style>
</head>
<body x-data="{ sidebarOpen: false }">
    <header>
        <div class="logo">
            <span class="desktop-only" onclick="navigate('/')">YT-Studio</span>
            <span class="mobile-only" @click="sidebarOpen = !sidebarOpen">
                <i class="icon" :class="sidebarOpen ? 'icon-x' : 'icon-menu'" style="font-size: 1.2rem; color: white;"></i>
            </span>
        </div>
        <div class="search-container" style="flex: 1; margin: 0 15px; position: relative; max-width: 600px;" 
             x-data="{
                 query: '${n||""}',
                 suggestions: [],
                 selectedIndex: -1,
                 showSuggestions: false,
                 async fetchSuggestions() {
                     if (!this.query.trim()) { this.suggestions = []; this.showSuggestions = false; return; }
                     try {
                         const res = await fetch('/api/suggestions?q=' + encodeURIComponent(this.query));
                         this.suggestions = await res.json();
                         this.showSuggestions = this.suggestions.length > 0;
                         this.selectedIndex = -1;
                     } catch (e) { this.suggestions = []; }
                 },
                 selectSuggestion(suggestion) { navigate('/?q=' + encodeURIComponent(suggestion)); },
                 handleKeydown(e) {
                     if (!this.showSuggestions || this.suggestions.length === 0) return;
                     if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length; }
                     else if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length; }
                     else if (e.key === 'Enter' && this.selectedIndex >= 0) { e.preventDefault(); this.selectSuggestion(this.suggestions[this.selectedIndex]); }
                 }
             }" @click.outside="showSuggestions = false">
            <form action="/" method="GET" class="search-trigger">
                <i class="icon icon-search"></i>
                <input type="text" x-ref="searchInput" name="q" x-model="query" @input.debounce.300ms="fetchSuggestions()" @keydown="handleKeydown($event)" placeholder="Cari video..." autocomplete="off" style="background:none; border:none; outline:none; color:inherit; width:100%; font-family:inherit;">
                <i class="icon icon-x" x-show="query.length > 0" @click="query = ''; $refs.searchInput.focus()" style="cursor: pointer; padding: 5px; color: var(--text-dim);"></i>
            </form>
            <div class="suggestions-dropdown" x-show="showSuggestions" x-transition style="display: none;">
                <template x-for="(suggestion, index) in suggestions" :key="index">
                    <div class="suggestion-item" :class="{ 'selected': index === selectedIndex }" @click="selectSuggestion(suggestion)">
                        <i class="icon icon-search opacity-30"></i>
                        <span x-text="suggestion"></span>
                    </div>
                </template>
            </div>
        </div>
        <div class="header-actions" style="display: flex; gap: 15px; align-items: center;"></div>
    </header>

    <div id="toast-container"></div>

    <div class="app-container">
        <div class="sidebar-overlay" x-show="sidebarOpen" x-transition.opacity @click="sidebarOpen = false" style="display: none;"></div>
        <aside class="desktop-sidebar" :class="sidebarOpen ? 'open' : ''">
            <div style="padding: 0 10px; margin-bottom: 20px;">
                <a href="/" class="side-nav-item ${r==="home"?"active":""}"><i class="icon icon-home"></i><span>Beranda</span></a>
                <a href="/playlists" class="side-nav-item ${r==="playlist"?"active":""}"><i class="icon icon-list"></i><span>Playlist</span></a>
                <a href="/history" class="side-nav-item ${r==="history"?"active":""}"><i class="icon icon-clock"></i><span>Histori</span></a>
                <a href="/offline" class="side-nav-item ${r==="offline"?"active":""}"><i class="icon icon-download"></i><span>Offline</span></a>
            </div>

            ${a&&a.length>0?v`
                <div style="padding: 0 10px;">
                    <div style="padding: 0 12px; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;">Langganan</div>
                    ${a.map(c=>v`
                        <a href="/?q=${encodeURIComponent(c.uploader)}" class="side-nav-item" title="${c.uploader}">
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.uploader}</span>
                        </a>
                    `)}
                </div>
            `:v`
                 <div style="padding: 0 10px;">
                     <div style="padding: 0 12px; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;">Langganan</div>
                     <div class="side-nav-item" style="opacity: 0.5; font-size: 0.85rem;">Belum ada langganan</div>
                 </div>
            `}
            <div style="height: ${i?"100px":"20px"};"></div>
        </aside>

        <main>${o}</main>
    </div>

    ${i&&r!=="play"?v`
    <div class="mini-player-overlay" onclick="location.href='/play?v=${i.id}&t=' + Math.floor(document.getElementById('bgPlayer')?.currentTime || 0)">
        <div style="width: 50px; height: 50px; border-radius: 6px; overflow: hidden; background: #000; flex-shrink: 0;">
            <video id="bgPlayer" src="${i.stream_url}" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
        </div>
        <div class="mini-player-info">
            <h4>${i.title}</h4>
            <p>${i.uploader}</p>
        </div>
        <div class="mini-player-ctrl" onclick="event.stopPropagation(); const p = document.getElementById('bgPlayer'); if(p.paused) { p.play(); this.querySelector('i').classList.remove('icon-play'); this.querySelector('i').classList.add('icon-pause'); } else { p.pause(); this.querySelector('i').classList.remove('icon-pause'); this.querySelector('i').classList.add('icon-play'); }">
            <i class="icon icon-pause"></i>
        </div>
        <div class="mini-player-ctrl close" onclick="event.stopPropagation(); const u = new window.URL(location.href); u.searchParams.delete('min'); localStorage.removeItem('videoTime_${i.id}'); location.href = u.pathname + u.search;">
            <i class="icon icon-x"></i>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const player = document.getElementById('bgPlayer');
            if (player) {
                const savedTime = localStorage.getItem('videoTime_${i.id}');
                if (savedTime) player.currentTime = parseFloat(savedTime);
                
                player.ontimeupdate = () => { localStorage.setItem('videoTime_${i.id}', player.currentTime); };
                
                const playVideo = () => {
                    player.play().then(() => {
                        updateMediaMetadata({
                            title: '${s(i.title)}',
                            uploader: '${s(i.uploader)}',
                            thumbnail: '${i.thumbnail}'
                        }, player);
                    }).catch(() => { 
                        const playIcon = document.querySelector('.mini-player-ctrl i.icon-pause'); 
                        if (playIcon) { playIcon.classList.remove('icon-pause'); playIcon.classList.add('icon-play'); } 
                    });
                };

                playVideo();
            }
        });
    </script>`:""}

    <script>
        window.navigate = function (url) {
            const urlParams = new window.URLSearchParams(window.location.search);
            const minId = urlParams.get('min');
            const targetPath = url.split('?')[0];
            const isPlayPage = targetPath === '/play' || targetPath.endsWith('/play');
            if (minId && !url.includes('min=') && !isPlayPage) {
                const separator = url.includes('?') ? '&' : '?';
                url = url + separator + 'min=' + minId;
            }
            location.href = url;
        };
        (function () {
            const urlParams = new window.URLSearchParams(window.location.search);
            const minId = urlParams.get('min') || (window.location.pathname === '/play' ? urlParams.get('v') : null);
            if (minId) {
                document.addEventListener('DOMContentLoaded', function () {
                    document.querySelectorAll('a').forEach(function (link) {
                        const href = link.getAttribute('href');
                        if (!href || !href.startsWith('/') || href.includes('min=')) return;
                        const targetPath = href.split('?')[0];
                        const isPlayPage = targetPath === '/play' || targetPath.endsWith('/play');
                        if (!isPlayPage) {
                            const separator = href.includes('?') ? '&' : '?';
                            link.setAttribute('href', href + separator + 'min=' + minId);
                        }
                    });
                    document.querySelectorAll('form').forEach(function (form) {
                        const method = form.getAttribute('method');
                        if (method && method.toUpperCase() === 'GET' && !form.querySelector('input[name="min"]')) {
                            const input = document.createElement('input');
                            input.type = 'hidden'; input.name = 'min'; input.value = minId;
                            form.appendChild(input);
                        }
                    });
                });
            }
        })();

        // MediaSession API for background playback
        window.updateMediaMetadata = function(video, playerElement) {
            if (!('mediaSession' in navigator)) return;

            navigator.mediaSession.metadata = new MediaMetadata({
                title: video.title,
                artist: video.uploader,
                artwork: [
                    { src: video.thumbnail, sizes: '512x512', type: 'image/png' }
                ]
            });

            const actionHandlers = [
                ['play', () => { playerElement.play(); }],
                ['pause', () => { playerElement.pause(); }],
                ['seekbackward', (details) => { playerElement.currentTime = Math.max(playerElement.currentTime - (details.seekOffset || 10), 0); }],
                ['seekforward', (details) => { playerElement.currentTime = Math.min(playerElement.currentTime + (details.seekOffset || 10), playerElement.duration); }],
                ['previoustrack', null],
                ['nexttrack', null]
            ];

                for (const [action, handler] of actionHandlers) {
                try {
                    navigator.mediaSession.setActionHandler(action, handler);
                } catch (error) {
                    console.log(\`The media session action "\${action}" is not supported yet.\`);
                }
            }
        };

        // Global functions for Menu, Subscription, and Playlist
        window.activeMenuId = null;

        window.toggleMenu = function(event, videoId) {
            event.stopPropagation();
            const menuId = 'menu-' + videoId;
            const menu = document.getElementById(menuId);
            
            // Close other open menus
            document.querySelectorAll('.video-menu').forEach(m => {
                if (m.id !== menuId) m.style.display = 'none';
            });

            if (menu) {
                const isVisible = menu.style.display === 'block';
                menu.style.display = isVisible ? 'none' : 'block';
                window.activeMenuId = isVisible ? null : menuId;
            }
        };

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.menu-btn') && !e.target.closest('.video-menu')) {
                document.querySelectorAll('.video-menu').forEach(m => m.style.display = 'none');
                window.activeMenuId = null;
            }
        });

        window.toggleGlobalSub = async function(channelId, uploader) {
            if (!channelId || channelId === 'undefined') return alert('Channel ID tidak tersedia.');
            try {
                await fetch('/toggle_subscription', {
                    method: 'POST',
                    body: JSON.stringify({ channel_id: channelId, uploader }),
                    headers: { 'Content-Type': 'application/json' }
                });
                location.reload();
            } catch (e) {
                console.error(e);
                showToast('Gagal mengubah status langganan.', 'error');
            }
        };

        window.showToast = function(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast toast-' + type;
            const icon = type === 'success' ? 'icon-check-circle' : (type === 'error' ? 'icon-alert-circle' : 'icon-info');
            toast.innerHTML = '<i class="icon ' + icon + '"></i> <span>' + message + '</span>';
            container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 10);
            
            // Auto-hide
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        window.currentVideoForPlaylist = null;
        window.openPlaylistModal = async function(id, title, uploader, thumbnail, duration, views, channelId) {
            window.currentVideoForPlaylist = { id, title: decodeURIComponent(title), uploader: decodeURIComponent(uploader), thumbnail, duration, views, channel_id: channelId };
            
            // Show loading or fetch directly
            try {
                const res = await fetch('/api/playlists');
                const playlists = await res.json();
                let html = '';
                if (Object.keys(playlists).length === 0) {
                    html = '<p style="padding: 20px; text-align: center; opacity: 0.5;">Belum ada playlist.</p>';
                } else {
                    for (const name in playlists) {
                        html += \`
                            <div class="playlist-select-item" onclick="saveToGlobalPlaylist(\${\`\${name}\`.replace(/'/g, "\\\\'")})">
                                <i class="icon icon-list"></i>
                                <span>\${name}</span>
                            </div>
                        \`;
                    }
                }
                document.getElementById('globalPlaylistModalList').innerHTML = html;
                document.getElementById('globalPlaylistModal').classList.add('show');
                document.getElementById('globalModalBackdrop').classList.add('show');
                
                // Close menu
                if (window.activeMenuId) {
                    document.getElementById(window.activeMenuId).style.display = 'none';
                    window.activeMenuId = null;
                }
            } catch (e) {
                console.error(e);
                showToast('Gagal memuat playlist.', 'error');
            }
        };

        window.saveToGlobalPlaylist = async function(playlistName) {
            if (!window.currentVideoForPlaylist) return;
            try {
                const res = await fetch('/add_to_playlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playlistName, video: window.currentVideoForPlaylist })
                });
                if (res.ok) {
                    hideGlobalModal();
                    showToast('Berhasil disimpan ke ' + playlistName, 'success');
                }
            } catch (e) {
                console.error(e);
                showToast('Gagal menyimpan ke playlist.', 'error');
            }
        };

        window.hideGlobalModal = function() {
            document.getElementById('globalPlaylistModal').classList.remove('show');
            document.getElementById('globalModalBackdrop').classList.remove('show');
            window.currentVideoForPlaylist = null;
        };
    </script>

    <!-- Global Playlist Modal -->
    <div id="globalModalBackdrop" onclick="hideGlobalModal()" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 2000; backdrop-filter: blur(5px);"></div>
    <div id="globalPlaylistModal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 400px; background: var(--surface); border-radius: 24px; z-index: 2001; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem;">Simpan ke...</h3>
            <i class="icon icon-x" onclick="hideGlobalModal()" style="cursor: pointer; opacity: 0.5;"></i>
        </div>
        <div id="globalPlaylistModalList" style="max-height: 300px; overflow-y: auto; padding: 10px;"></div>
    </div>
    <style>
        /* Menu Button Styles */
        .menu-btn {
            background: none; border: none; color: var(--text-dim); padding: 6px; cursor: pointer; border-radius: 50%; transition: all 0.2s;
            position: absolute; top: 0; right: -8px; z-index: 10;
        }
        .menu-btn:hover { background: var(--surface-accent); color: white; }
        
        .video-menu {
            position: absolute; top: 35px; right: 0; background: var(--surface); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 6px; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; width: 180px;
        }
        
        .menu-item {
            padding: 10px 14px; font-size: 0.9rem; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; gap: 12px; border-radius: 8px; transition: all 0.2s;
        }
        .menu-item:hover { background: var(--surface-accent); color: white; }
        .menu-item i { width: 18px; text-align: center; }
        
        /* Playlist Modal Styles (Global) */
        .playlist-select-item { padding: 15px; display: flex; align-items: center; gap: 15px; border-radius: 12px; cursor: pointer; transition: background 0.2s; color: var(--text-dim); }
        .playlist-select-item:hover { background: var(--surface-accent); color: white; }
        .playlist-select-item i { color: var(--primary); }
        #globalModalBackdrop, #globalPlaylistModal { opacity: 0; transition: opacity 0.2s ease-in-out; pointer-events: none; visibility: hidden; }
        #globalModalBackdrop.show, #globalPlaylistModal.show { display: block !important; opacity: 1; pointer-events: auto; visibility: visible; }
    </style>
</body>
</html>`};var Z=e=>v`
    <div class="video-card" onclick="navigate('/play?v=${e.id}')" style="cursor: pointer; position: relative;">
        <div class="thumb-container" style="position: relative;">
            <img src="${e.thumbnail}" loading="lazy" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
            
            <div style="position: absolute; top: 8px; left: 8px; display: flex; gap: 5px; z-index: 5;">
                ${e.is_offline?v`
                    <span style="background: #2ecc71; padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.4); backdrop-filter: blur(4px);">Offline</span>
                `:v`
                    <div id="card-dl-${e.id}" style="display: none; background: rgba(255, 0, 0, 0.85); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase; backdrop-filter: blur(8px); box-shadow: 0 4px 10px rgba(255,0,0,0.3);">Downloading...</div>
                `}
            </div>

            <span class="duration-tag" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                ${gt(e.duration)}
            </span>
        </div>
        <div class="video-meta" style="padding: 12px;">
            <div class="video-info" style="position: relative;">
                <h3 class="video-title" style="margin: 0; font-size: 0.95rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; padding-right: 25px;">${e.title}</h3>
                
                <button class="menu-btn" onclick="toggleMenu(event, '${e.id}')" style="position: absolute; top: 0; right: -5px; background: none; border: none; color: var(--text-dim); cursor: pointer;">
                    <i class="icon icon-more-vertical"></i>
                </button>
                
                <div id="menu-${e.id}" class="video-menu" style="display: none; position: absolute; right: 0; top: 30px; background: var(--surface-accent); border-radius: 8px; padding: 5px; z-index: 100; box-shadow: 0 10px 20px rgba(0,0,0,0.5); width: 180px;">
                    <div class="menu-item" onclick="event.stopPropagation(); toggleGlobalSub('${e.channel_id}', '${encodeURIComponent(e.uploader||"")}')" style="padding: 8px 12px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <i class="icon ${e.is_subscribed?"icon-user-minus":"icon-user-plus"}"></i> 
                        <span>${e.is_subscribed?"Unsubscribe":"Subscribe"}</span>
                    </div>
                    <div class="menu-item" onclick="event.stopPropagation(); openPlaylistModal('${e.id}', '${encodeURIComponent(e.title)}', '${encodeURIComponent(e.uploader||"")}', '${e.thumbnail}', '${e.duration}', '${e.views}', '${e.channel_id}')" style="padding: 8px 12px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <i class="icon icon-plus"></i> 
                        <span>Simpan ke Playlist</span>
                    </div>
                    <div class="menu-item" onclick="event.stopPropagation(); window.location.href='/play?v=${e.id}&download=1'" style="padding: 8px 12px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <i class="icon icon-download"></i> 
                        <span>Download HQ (Kecil)</span>
                    </div>
                </div>

                <div class="video-subtext" style="margin-top: 5px; font-size: 0.8rem; color: var(--text-dim);">
                    <a href="/?q=${encodeURIComponent(e.uploader||"")}" onclick="event.stopPropagation();" style="color: var(--text-dim); text-decoration: none; display: block; margin-bottom: 2px; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'" title="Lihat channel ${e.uploader}">
                        ${e.uploader}
                    </a>
                    <div>${wt(e.views)} x tonton</div>
                </div>
            </div>
        </div>
        <script>
            (async function() {
                if ('${e.is_offline}' === 'true') return;
                try {
                    const res = await fetch('/api/download_status/${e.id}');
                    const data = await res.json();
                    if (data.status === 'downloading') {
                        const el = document.getElementById('card-dl-${e.id}');
                        if (el) el.style.display = 'block';
                    }
                } catch(e) {}
            })();
        </script>
    </div>
`;var Nn=e=>{let{results:t,query:r,activePage:i,playingVideo:n,subscriptions:o}=e;return Y({title:r?`Hasil Pencarian: ${r}`:"Beranda",activePage:i,playingVideo:n,query:r,subscriptions:o,children:v`
            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
                
                .loading-indicator {
                    grid-column: 1 / -1;
                    padding: 30px 20px;
                    padding-bottom: 120px; /* Extra padding untuk mini-player */
                    text-align: center;
                    color: var(--text-dim);
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
            </style>

            <div class="grid-container" id="resultsGrid">
                ${t&&t.length>0?v`
                    ${t.map(a=>Z(a))}
                `:""}
                
                ${r&&t&&t.length>0?v`
                    <div id="loadingSentinel" class="loading-indicator">
                        <span>Memuat...</span>
                    </div>
                `:""}
            </div>

            ${!t||t.length===0?v`
                ${r?v`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i class="icon icon-search" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                            <p>Video tidak ditemukan: "${r}"</p>
                        </div>
                    </div>
                `:v`
                    <div style="text-align: center; padding: 100px 20px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background: #1a1a1e; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i class="icon icon-play" style="color: var(--primary); font-size: 1.5rem; margin-left: 5px;"></i>
                        </div>
                        <p style="color: var(--text-dim); font-size: 0.9rem;">Cari sesuatu untuk mulai menonton</p>
                    </div>
                `}
            `:""}

            <script>
                (function() {
                    let currentPage = 1;
                    let isLoading = false;
                    let hasMore = true;
                    const query = '${r||""}';
                    const sentinel = document.getElementById('loadingSentinel');
                    const grid = document.getElementById('resultsGrid');

                    if (!sentinel || !query) return;

                    const observer = new IntersectionObserver(async (entries) => {
                        const entry = entries[0];
                        if (entry.isIntersecting && !isLoading && hasMore) {
                            await loadMore();
                        }
                    }, {
                        rootMargin: '200px' // Pre-load when sentinel is 200px from viewport
                    });

                    observer.observe(sentinel);

                    async function loadMore() {
                        isLoading = true;
                        currentPage++;
                        console.log('[CLIENT] Loading page ' + currentPage);
                        
                        try {
                            const res = await fetch('/api/search?q=' + encodeURIComponent(query) + '&page=' + currentPage);
                            const html = await res.text();
                            
                            if (html.trim()) {
                                // Create a temp div to parse HTML
                                const temp = document.createElement('div');
                                temp.innerHTML = html;
                                
                                // Append each new video card before the sentinel
                                while (temp.firstChild) {
                                    grid.insertBefore(temp.firstChild, sentinel);
                                }
                                isLoading = false;
                            } else {
                                hasMore = false;
                                sentinel.style.display = 'none';
                                observer.disconnect();
                            }
                        } catch (e) {
                            console.error(e);
                            isLoading = false;
                            sentinel.innerHTML = '<span>Gagal memuat. Mencoba lagi...</span>';
                            setTimeout(loadMore, 3000);
                        }
                    }
                })();
            </script>
        `})};var Hn=e=>{let{id:t,title:r,uploader:i,thumbnail:n,duration:o,views:a,channel_id:s,stream_url:c,is_offline:d,subtitles:l,relatedVideos:u,isSubscribed:h,subscriptions:p}=e,f=m=>m?m.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,"\\n"):"";return Y({title:r,activePage:"play",subscriptions:p,children:v`
            <div style="max-width: 1000px; margin: 0 auto; padding: 0 20px;">
                <div style="position: relative; width: 100%; aspect-ratio: 16/9; max-height: 60vh; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 15px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
                    <video id="mainPlayer" 
                        poster="${n}" 
                        style="width: 100%; height: 100%; object-fit: contain;" 
                        controls autoplay playsinline>
                        <source src="${c}" type="${c.endsWith(".webm")?"video/webm":"video/mp4"}">
                        ${l&&l.map(m=>v`<track kind="captions" src="${m.url}" srclang="${m.lang}" label="${m.name}">`)}
                    </video>
                </div>

                <div style="margin-bottom: 20px;">
                    <h1 style="font-size: 1.2rem; font-weight: 700; margin: 0 0 10px 0; line-height: 1.4;">${r}</h1>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                        <a href="/?q=${encodeURIComponent(i)}" style="display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" title="Lihat channel ${i}">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--surface-accent); display: flex; align-items: center; justify-content: center; font-weight: 700;">
                                ${(i||"C").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600;">${i}</h3>
                                <p style="margin: 2px 0 0; font-size: 0.75rem; color: var(--text-dim);">${wt(a)} x tonton</p>
                            </div>
                        </a>
                        
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button onclick="toggleGlobalSub('${s}', '${f(i)}')" 
                                class="sub-btn ${h?"subscribed":""}"
                                style="padding: 8px 20px; border-radius: 20px; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; background: ${h?"var(--surface-accent)":"#fff"}; color: ${h?"var(--text-dim)":"#000"};">
                                ${h?"Disubscribe":"Subscribe"}
                            </button>
                            
                            <button onclick="openPlaylistModal('${t}', '${encodeURIComponent(r)}', '${encodeURIComponent(i)}', '${n}', '${o}', '${a}', '${s}')" style="background: var(--surface-accent); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="icon icon-plus"></i>
                            </button>

                            <div style="position: relative; display: flex; align-items: center; gap: 8px;">
                                <button id="dlBtn" onclick="startDownload('${t}')" style="background: ${d?"var(--surface-accent)":"#fff"}; border: none; width: 40px; height: 40px; border-radius: 50%; color: ${d?"white":"#000"}; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                                    <i class="icon icon-download" id="dlIcon"></i>
                                    <div id="dlFullProgress" style="position: absolute; bottom: 0; left: 0; height: 100%; width: 0%; background: rgba(30, 215, 96, 0.3); transition: width 0.3s;"></div>
                                </button>
                                <span id="dlText" style="font-size: 0.75rem; color: var(--text-dim); font-weight: 600; min-width: 30px; display: none;">0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.05); margin: 20px 0;"></div>

                <h3 style="font-size: 1rem; margin-bottom: 15px;">Video Terkait</h3>
                <div class="related-grid" style="display: grid; gap: 15px;">
                    ${u&&u.length>0?u.map(m=>Z(m)):v`<p style="text-align: center; padding: 20px; opacity: 0.5;">Belum ada video terkait</p>`}
                </div>
            </div>

            <script>
                window.startDownload = async function(id) {
                    const btn = document.getElementById('dlBtn');
                    if (btn.disabled || '${d}' === 'true') return;
                    try {
                        await fetch('/api/download/' + id, { method: 'POST' });
                        btn.style.opacity = '0.7';
                        checkDownloadStatus();
                    } catch (e) { console.error(e); }
                };

                async function checkDownloadStatus() {
                    const id = '${t}';
                    const icon = document.getElementById('dlIcon');
                    const text = document.getElementById('dlText');
                    const progressBg = document.getElementById('dlFullProgress');
                    const btn = document.getElementById('dlBtn');

                    try {
                        const res = await fetch('/api/download_status/' + id);
                        const data = await res.json();
                        
                        if (data.status === 'downloading' || data.status === 'finished') {
                            text.style.display = 'inline';
                            text.innerText = Math.round(data.progress) + '%';
                            progressBg.style.width = data.progress + '%';
                            
                            if (data.status === 'finished') {
                                text.style.display = 'none';
                                btn.style.background = 'var(--surface-accent)';
                                btn.style.color = 'white';
                                btn.style.opacity = '1';
                                progressBg.style.display = 'none';
                                switchToOffline();
                                return;
                            }
                            setTimeout(checkDownloadStatus, 2000);
                        }
                    } catch (e) { console.error(e); }
                }

                function switchToOffline() {
                    const player = document.getElementById('mainPlayer');
                    // Jika sudah menggunakan offline, jangan refresh
                    if (player.querySelector('source').src.includes('/offline/')) return;
                    
                    const currentTime = Math.floor(player.currentTime);
                    const url = new URL(window.location.href);
                    url.searchParams.set('t', currentTime);
                    
                    showToast('Download selesai! Me-refresh untuk menggunakan versi offline...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = url.toString();
                    }, 1000);
                }

                document.addEventListener('DOMContentLoaded', () => {
                    const player = document.getElementById('mainPlayer');
                    if (player) {
                        const savedTime = localStorage.getItem('videoTime_${t}');
                        if (savedTime) player.currentTime = parseFloat(savedTime);
                        player.ontimeupdate = () => { localStorage.setItem('videoTime_${t}', player.currentTime); };
                    }
                    checkDownloadStatus();
                });
            </script>

            <style>
                @media (min-width: 600px) { .related-grid { grid-template-columns: repeat(2, 1fr); } } 
                @media (min-width: 1000px) { .related-grid { grid-template-columns: repeat(3, 1fr); } }
            </style>
        `})};var Bn=e=>{let{results:t,playingVideo:r,subscriptions:i}=e;return Y({title:"Histori Tontonan",activePage:"history",playingVideo:r,subscriptions:i,children:v`
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 0 5px;">
                <h2 style="font-size: 1.3rem; margin: 0;">Histori Tontonan</h2>
                <form action="/clear_history" method="POST" onsubmit="return confirm('Hapus semua histori?')">
                    <button type="submit"
                        style="background: none; border: none; color: #ff4d4d; font-size: 0.8rem; font-weight: 600; cursor: pointer;">Hapus Semua</button>
                </form>
            </div>

            <div class="grid-container">
                ${t&&t.length>0?v`
                    ${t.map(n=>Z(n))}
                `:v`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5; grid-column: 1 / -1;">
                        <i class="icon icon-rotate-ccw" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                        <p>Belum ada histori tontonan.</p>
                    </div>
                `}
            </div>

            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 768px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1000px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(6, 1fr); } }
            </style>
        `})};var zn=e=>{let{results:t,playingVideo:r,subscriptions:i}=e;return Y({title:"Video Offline",activePage:"offline",playingVideo:r,subscriptions:i,children:v`
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 0 5px;">
                <h2 style="font-size: 1.3rem; margin: 0;">Video Offline</h2>
                <span style="font-size: 0.8rem; color: var(--text-dim);">
                    ${t?t.length:0} Video
                </span>
            </div>

            <div class="grid-container">
                ${t&&t.length>0?v`
                    ${t.map(n=>v`
                        <div class="video-card" onclick="navigate('/play?v=${n.id}')">
                            <div class="thumb-container">
                                <img src="${n.thumbnail||""}" loading="lazy">
                                <span class="duration-tag">
                                    ${gt(n.duration)}
                                </span>
                                <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,255,100,0.8); width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                                    <i class="icon icon-check" style="color: black;"></i>
                                </div>
                            </div>
                            <div class="video-meta">
                                <div class="channel-avatar">
                                </div>
                                <div class="video-info">
                                    <h3 class="video-title">${n.title}</h3>
                                    <div class="video-subtext">
                                        <span>${n.uploader}</span>
                                        <span class="dot"></span>
                                        <span>Offline</span>
                                    </div>
                                </div>
                                <button onclick="deleteOffline(event, '${n.id}')"
                                    style="background: none; border: none; color: var(--text-dim); padding: 5px; cursor: pointer;">
                                    <i class="icon icon-trash"></i>
                                </button>
                            </div>
                        </div>
                    `)}
                `:v`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5; grid-column: 1 / -1;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background: #1a1a1e; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i class="icon icon-download-cloud" style="font-size: 1.5rem;"></i>
                        </div>
                        <p>Belum ada video offline.</p>
                        <a href="/" style="color: var(--primary); font-size: 0.9rem; text-decoration: none;">Cari & Download</a>
                    </div>
                `}
            </div>

            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
            </style>

            <script>
                async function deleteOffline(event, videoId) {
                    event.stopPropagation();
                    if (confirm('Hapus video ini dari memori offline?')) {
                        const res = await fetch('/delete_offline/' + videoId, { method: 'DELETE' });
                        if (res.ok) location.reload();
                    }
                }
            </script>
        `})};var Un=e=>{let{results:t,activePage:r,playingVideo:i,subscriptions:n}=e;return Y({title:"Koleksi Anda",activePage:"playlist",playingVideo:i,subscriptions:n,children:v`
            <div style="margin-bottom: 30px;" x-data="{ 
                newName: '',
                async createPlaylist() {
                    if (!this.newName.trim()) return showToast('Nama playlist tidak boleh kosong', 'error');
                    const res = await fetch('/create_playlist', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: this.newName })
                    });
                    if (res.ok) {
                        location.reload();
                    } else {
                        showToast('Gagal membuat playlist', 'error');
                    }
                }
            }">
                <h2 style="font-size: 1.5rem; margin-bottom: 20px;">Koleksi Anda</h2>
                <div style="background: var(--surface); padding: 5px 5px 5px 15px; border-radius: 30px; display: flex; gap: 10px; align-items: center; border: 1px solid rgba(255,255,255,0.05); max-width: 400px;">
                    <i class="icon icon-plus" style="color: var(--primary); opacity: 0.7;"></i>
                    <input type="text" x-model="newName" placeholder="Buat playlist baru..."
                        @keydown.enter="createPlaylist()"
                        style="background: none; border: none; outline: none; color: white; flex: 1; font-family: inherit; font-size: 0.9rem; height: 40px;">
                    <button @click="createPlaylist()"
                        style="background: var(--primary); color: white; border: none; padding: 0 20px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; height: 34px; cursor: pointer;">Tambah</button>
                </div>
            </div>

            <div class="grid-container">
                ${t&&Object.keys(t).length>0?v`
                    ${Object.keys(t).map(o=>{let a=t[o];return v`
                            <div class="playlist-row" onclick="navigate('/playlists/${encodeURIComponent(o)}')">
                                <div class="playlist-icon">
                                    <i class="icon icon-list"></i>
                                </div>
                                <div class="playlist-details">
                                    <h3>${o}</h3>
                                    <p>${a.length} Video</p>
                                </div>
                                <i class="icon icon-chevron-right" style="color: var(--text-dim); font-size: 0.8rem; opacity: 0.5;"></i>
                            </div>
                        `})}
                `:v`
                    <div style="text-align: center; padding: 60px 20px; opacity: 0.3; grid-column: 1 / -1;">
                        <i class="icon icon-folder" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                        <p>Belum ada playlist.</p>
                    </div>
                `}
            </div>

            <style>
                 .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }

                .playlist-row {
                    background: var(--surface);
                    padding: 20px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .playlist-row:hover {
                    background: var(--surface-accent);
                    transform: translateY(-2px);
                }

                .playlist-icon {
                    width: 50px;
                    height: 50px;
                    background: rgba(88, 101, 242, 0.1);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    font-size: 1.2rem;
                }

                .playlist-details {
                    flex: 1;
                }

                .playlist-details h3 {
                    margin: 0;
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: white;
                }

                .playlist-details p {
                    margin: 4px 0 0;
                    font-size: 0.8rem;
                    color: var(--text-dim);
                }
            </style>
        `})};var Wn=e=>{let{title:t,results:r,activePage:i,playingVideo:n,subscriptions:o}=e;return Y({title:t,activePage:"playlist",playingVideo:n,subscriptions:o,children:v`
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 0 5px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <a href="/playlists" style="color: var(--text-dim);"><i class="icon icon-arrow-left"></i></a>
                    <h2 style="font-size: 1.3rem; margin: 0;">${t}</h2>
                </div>
                <span style="font-size: 0.8rem; color: var(--text-dim);">${r?r.length:0} Video</span>
            </div>

            <div class="grid-container">
                ${r&&r.length>0?v`
                    ${r.map(a=>Z(a))}
                `:v`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5; grid-column: 1 / -1;">
                        <i class="icon icon-list" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                        <p>Playlist kosong.</p>
                    </div>
                `}
            </div>

            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
            </style>
        `})};var Zs=Date.now(),I=new Mt,rr=Number(process.env.PORT)||8e3,bt=new Map,tc=3e4;I.use("/static/*",Je({root:"./"}));I.use("/offline/*",Je({root:"./cached_videos",rewriteRequestPath:e=>e.replace(/^\/offline/,"")}));I.use("/thumb/*",Je({root:"./cached_videos/thumbnails",rewriteRequestPath:e=>e.replace(/^\/thumb/,"")}));I.use("*",async(e,t)=>{let r=e.req.query("min"),i=await w.default.readJson(yt).catch(()=>[]);if(e.set("subscriptions",i),r&&e.req.path!=="/play"){let n=null,o=A.join(se,`${r}.json`);await w.default.pathExists(o)?(n=await w.default.readJson(o),n.stream_url=`/offline/${r}.webm`,await w.default.pathExists(A.join(J,`${r}.webm`))||(n.stream_url=`/offline/${r}.mp4`)):n=(await w.default.readJson(ge).catch(()=>[])).find(s=>s.id===r),e.set("playingVideo",n),console.log(`[STATE] Active Mini-Player: ${n?.title||r}`)}await t()});var Vn=async(e,t=[],r=1)=>{if(!e)return[];let i=`${e}_${r}`,n=bt.get(i);if(n&&Date.now()-n.timestamp<tc)return console.log(`[CACHE] Using cached results for: ${e} (page ${r})`),n.data;try{let a=(r-1)*20+1,s=a+20-1,c=e.startsWith("http")?e:`ytsearch${s+20}:${e}`,d=await ze(["--no-warnings","--flat-playlist","--dump-single-json","--playlist-start",a.toString(),"--playlist-end",s.toString(),c]),l=JSON.parse(d);if(!l)return[];let u=l.entries||[l];u.length>20&&(u=u.slice(0,20));let p=(await Promise.all(u.map(async f=>{if(!f||!f.id)return null;let m=await w.default.pathExists(A.join(J,`${f.id}.webm`))||await w.default.pathExists(A.join(J,`${f.id}.mp4`)),y=f.channel_id||f.uploader_id||"unknown",b=f.thumbnail||f.thumbnails?.[0]?.url||"";if(m){let R=A.join(se,`${f.id}.json`);await w.default.pathExists(R)&&(b=(await w.default.readJson(R)).thumbnail||b)}return{id:f.id,title:f.title||"Untitled",thumbnail:b,uploader:f.uploader||f.channel||"Unknown",channel_id:y,duration:f.duration||0,views:f.view_count||0,is_offline:m,is_subscribed:t.some(R=>R.channel_id===y)}}))).filter(f=>f);bt.set(i,{data:p,timestamp:Date.now()});for(let[f,m]of bt.entries())Date.now()-m.timestamp>3e5&&bt.delete(f);return p}catch(o){return console.error(o),[]}};I.get("/",async e=>{let t=e.req.query("q"),r=e.get("playingVideo"),i=e.get("subscriptions");console.log(`[GET] Home Page${t?` - Search: ${t}`:""}`);let n=await Vn(t,i,1);return e.html(Nn({results:n,query:t,activePage:"home",playingVideo:r,subscriptions:i}))});I.get("/play",async e=>{let t=e.req.query("v");if(console.log(`[GET] Play Video: ${t}`),!t)return e.redirect("/");let r=A.join(se,`${t}.json`),i={},n=A.join(J,`${t}.webm`),o=A.join(J,`${t}.mp4`);if((await w.default.pathExists(n)||await w.default.pathExists(o))&&await w.default.pathExists(r)&&(i=await w.default.readJson(r),i.stream_url=await w.default.pathExists(n)?`/offline/${t}.webm`:`/offline/${t}.mp4`,i.is_offline=!0),!i.id)try{let l=await ze(["--no-warnings","--dump-json",`https://www.youtube.com/watch?v=${t}`]),u=JSON.parse(l);if(!u)throw new Error("Gagal mengambil informasi video.");let h=u.formats.find(k=>k.vcodec!=="none"&&k.acodec!=="none"&&k.height<=480)||u.formats.find(k=>k.vcodec!=="none"&&k.acodec!=="none");i={id:t,title:u.title,uploader:u.uploader||u.channel,channel_id:u.channel_id,thumbnail:u.thumbnail,duration:u.duration,views:u.view_count,stream_url:h?.url,is_offline:!1,subtitles:[]};let p=u.thumbnail,f=".webp",m=A.join(Be,`${t}${f}`),y=p;try{let C=await(await fetch(p)).arrayBuffer();await w.default.writeFile(m,Buffer.from(C)),y=`/thumb/${t}${f}`,console.log(`[THUMB] Downloaded: ${t}`)}catch(k){console.error("[THUMB] Gagal download, menggunakan URL online:",k.message)}let b=await w.default.readJson(ge).catch(()=>[]);b=[{id:t,title:i.title,uploader:i.uploader,thumbnail:y,duration:i.duration,views:i.views,channel_id:i.channel_id},...b.filter(k=>k.id!==t)].slice(0,100),await w.default.writeJson(ge,b,{spaces:4})}catch(l){return console.error(l),e.text("Gagal memutar video.")}let s=(await w.default.readJson(ge).catch(()=>[])).filter(l=>l.id!==t).slice(0,10),c=e.get("subscriptions"),d=c.some(l=>l.channel_id===i.channel_id);return e.req.query("download")==="1"&&Gn(t),e.html(Hn({...i,relatedVideos:s,isSubscribed:d,subscriptions:c}))});async function Gn(e){if(le.has(e))return;let t=A.join(J,`${e}.webm`),r=A.join(J,`${e}.mp4`);if(await w.default.pathExists(t)||await w.default.pathExists(r)){le.set(e,100);return}le.set(e,.1);try{let i=A.join(se,`${e}.json`),n=null,o=await ze(["--no-warnings","--dump-json",`https://www.youtube.com/watch?v=${e}`]);n=JSON.parse(o);let a=n.thumbnail,s=".webp",c=A.join(Be,`${e}${s}`);try{let u=await(await fetch(a)).arrayBuffer();await w.default.writeFile(c,Buffer.from(u)),console.log(`[THUMB] Downloaded: ${e}`)}catch(l){console.error("[THUMB] Gagal download thumbnail:",l)}let d={id:e,title:n.title,uploader:n.uploader||n.channel,channel_id:n.channel_id,thumbnail:`/thumb/${e}${s}`,duration:n.duration,views:n.view_count};await w.default.writeJson(i,d,{spaces:4}),await ze(["--no-warnings","-f","bestvideo[height<=480][ext=webm]+bestaudio[ext=webm]/best[height<=480][ext=webm]/best[ext=webm]/best","--merge-output-format","webm","-o",t,`https://www.youtube.com/watch?v=${e}`],l=>{le.set(e,l)}),le.set(e,100)}catch(i){console.error(`Download Gagal untuk ${e}:`,i),le.delete(e)}}I.get("/api/suggestions",async e=>{let t=e.req.query("q");if(!t)return e.json([]);try{let i=await(await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(t)}`)).json();return e.json(i[1]||[])}catch{return e.json([])}});I.get("/api/search",async e=>{let t=e.req.query("q"),r=Number(e.req.query("page"))||1,i=e.get("subscriptions");if(!t)return e.text("");let n=await Vn(t,i,r);return e.html(n.map(o=>Z(o)).join(""))});I.get("/api/download_status/:id",e=>{let t=e.req.param("id"),r=le.get(t);return r===void 0?e.json({status:"not_found"}):e.json({status:r>=100?"finished":"downloading",progress:r})});I.post("/api/download/:id",async e=>{let t=e.req.param("id");return Gn(t),e.json({status:"started"})});I.post("/toggle_subscription",async e=>{let{channel_id:t,uploader:r}=await e.req.json(),i=await w.default.readJson(yt).catch(()=>[]),n=i.findIndex(o=>o.channel_id===t);return n>-1?i.splice(n,1):i.push({channel_id:t,uploader:r}),await w.default.writeJson(yt,i,{spaces:4}),e.json({status:"ok"})});I.get("/api/playlists",async e=>{let t=await w.default.readJson(ce).catch(()=>({}));return e.json(t)});I.post("/add_to_playlist",async e=>{let{playlistName:t,video:r}=await e.req.json(),i=await w.default.readJson(ce).catch(()=>({}));return i[t]&&(i[t].find(n=>n.id===r.id)||(i[t].push(r),await w.default.writeJson(ce,i,{spaces:4}))),e.json({status:"ok"})});I.get("/history",async e=>{let t=await w.default.readJson(ge).catch(()=>[]);return e.html(Bn({results:t,playingVideo:e.get("playingVideo"),subscriptions:e.get("subscriptions")}))});I.post("/clear_history",async e=>(await w.default.writeJson(ge,[],{spaces:4}),e.redirect("/history")));I.get("/offline",async e=>{let t=await w.default.readdir(J).catch(()=>[]),r=[],i=new Set;for(let n of t)if(n.endsWith(".mp4")||n.endsWith(".webm")){let o=n.split(".")[0];if(i.has(o))continue;i.add(o);let a=A.join(se,`${o}.json`);if(await w.default.pathExists(a)){let s=await w.default.readJson(a);s.is_offline=!0,r.push(s)}}return e.html(zn({results:r,playingVideo:e.get("playingVideo"),subscriptions:e.get("subscriptions")}))});I.delete("/delete_offline/:id",async e=>{let t=e.req.param("id");try{return await w.default.remove(A.join(J,`${t}.mp4`)),await w.default.remove(A.join(J,`${t}.webm`)),await w.default.remove(A.join(Be,`${t}.webp`)),await w.default.remove(A.join(se,`${t}.json`)),e.json({status:"ok"})}catch{return e.json({status:"error"},500)}});I.get("/playlists",async e=>{let t=await w.default.readJson(ce).catch(()=>({}));return e.html(Un({results:t,playingVideo:e.get("playingVideo"),subscriptions:e.get("subscriptions")}))});I.post("/create_playlist",async e=>{let{name:t}=await e.req.json(),r=await w.default.readJson(ce).catch(()=>({}));return r[t]||(r[t]=[],await w.default.writeJson(ce,r,{spaces:4})),e.json({status:"ok"})});I.get("/playlists/:name",async e=>{let t=e.req.param("name"),r=await w.default.readJson(ce).catch(()=>({}));return e.html(Wn({title:t,results:r[t]||[],playingVideo:e.get("playingVideo"),subscriptions:e.get("subscriptions")}))});var rc=nc(),ic=((Date.now()-Zs)/1e3).toFixed(4);console.log(`run on http://localhost:${rr} | http://${rc}:${rr}`);console.log(`took ${ic}s`);hr({fetch:I.fetch,port:rr});function nc(){let e=ec.networkInterfaces();for(let t of Object.keys(e))for(let r of e[t])if(r.family==="IPv4"&&!r.internal)return r.address;return"127.0.0.1"}
