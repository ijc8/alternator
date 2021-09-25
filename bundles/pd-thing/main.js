// Alternator:
var Module = {
  locateFile(filename) {
    return self.path + filename
  }
}

async function setup(sampleRate) {
  await new Promise(resolve => (Module.onRuntimeInitialized = resolve))
  Module._setup(sampleRate)
}

function process(output) {
  buffer = Module._malloc(output.length * output.BYTES_PER_ELEMENT)
  Module.HEAPF32.set(output, buffer / output.BYTES_PER_ELEMENT)
  const out = Module._process(buffer, output.length)
  output.set(new Float32Array(Module.HEAP32.buffer, buffer, output.length))
  Module._free(buffer)
  return out
}
// Preloader:
  var Module = typeof Module !== 'undefined' ? Module : {};
  
  if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0;
  }
  Module.expectedDataFileDownloads++;
  (function() {
   var loadPackage = function(metadata) {
  
      var PACKAGE_PATH = '';
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
      } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
        // web worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
      }
      var PACKAGE_NAME = 'bundle.data';
      var REMOTE_PACKAGE_BASE = 'bundle.data';
      if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
        Module['locateFile'] = Module['locateFilePackage'];
        err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
      }
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
    
      var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];
      var PACKAGE_UUID = metadata['package_uuid'];
    
      function fetchRemotePackage(packageName, packageSize, callback, errback) {
        
        if (typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string') {
          require('fs').readFile(packageName, function(err, contents) {
            if (err) {
              errback(err);
            } else {
              callback(contents.buffer);
            }
          });
          return;
        }
      
        var xhr = new XMLHttpRequest();
        xhr.open('GET', packageName, true);
        xhr.responseType = 'arraybuffer';
        xhr.onprogress = function(event) {
          var url = packageName;
          var size = packageSize;
          if (event.total) size = event.total;
          if (event.loaded) {
            if (!xhr.addedTotal) {
              xhr.addedTotal = true;
              if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
              Module.dataFileDownloads[url] = {
                loaded: event.loaded,
                total: size
              };
            } else {
              Module.dataFileDownloads[url].loaded = event.loaded;
            }
            var total = 0;
            var loaded = 0;
            var num = 0;
            for (var download in Module.dataFileDownloads) {
            var data = Module.dataFileDownloads[download];
              total += data.total;
              loaded += data.loaded;
              num++;
            }
            total = Math.ceil(total * Module.expectedDataFileDownloads/num);
            if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
          } else if (!Module.dataFileDownloads) {
            if (Module['setStatus']) Module['setStatus']('Downloading data...');
          }
        };
        xhr.onerror = function(event) {
          throw new Error("NetworkError for: " + packageName);
        }
        xhr.onload = function(event) {
          if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            var packageData = xhr.response;
            callback(packageData);
          } else {
            throw new Error(xhr.statusText + " : " + xhr.responseURL);
          }
        };
        xhr.send(null);
      };

      function handleError(error) {
        console.error('package error:', error);
      };
    
        var fetchedCallback = null;
        var fetched = Module['getPreloadedPackage'] ? Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;

        if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
          if (fetchedCallback) {
            fetchedCallback(data);
            fetchedCallback = null;
          } else {
            fetched = data;
          }
        }, handleError);
      
    function runWithFS() {
  
      function assert(check, msg) {
        if (!check) throw msg + new Error().stack;
      }
  Module['FS_createPath']("/", "assets", true, true);

          /** @constructor */
          function DataRequest(start, end, audio) {
            this.start = start;
            this.end = end;
            this.audio = audio;
          }
          DataRequest.prototype = {
            requests: {},
            open: function(mode, name) {
              this.name = name;
              this.requests[name] = this;
              Module['addRunDependency']('fp ' + this.name);
            },
            send: function() {},
            onload: function() {
              var byteArray = this.byteArray.subarray(this.start, this.end);
              this.finish(byteArray);
            },
            finish: function(byteArray) {
              var that = this;
      
          Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
          Module['removeRunDependency']('fp ' + that.name);
  
              this.requests[this.name] = null;
            }
          };
      
              var files = metadata['files'];
              for (var i = 0; i < files.length; ++i) {
                new DataRequest(files[i]['start'], files[i]['end'], files[i]['audio'] || 0).open('GET', files[i]['filename']);
              }
      
        
      function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        
          // Reuse the bytearray from the XHR as the source for file reads.
          DataRequest.prototype.byteArray = byteArray;
    
            var files = metadata['files'];
            for (var i = 0; i < files.length; ++i) {
              DataRequest.prototype.requests[files[i].filename].onload();
            }
                Module['removeRunDependency']('datafile_bundle.data');

      };
      Module['addRunDependency']('datafile_bundle.data');
    
      if (!Module.preloadResults) Module.preloadResults = {};
    
        Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
        if (fetched) {
          processPackageData(fetched);
          fetched = null;
        } else {
          fetchedCallback = processPackageData;
        }
      
    }
    if (Module['calledRun']) {
      runWithFS();
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
    }
  
    Module['removeRunDependency']('bundle.metadata');
   }

   function runMetaWithFS() {
    Module['addRunDependency']('bundle.metadata');
    var REMOTE_METADATA_NAME = Module['locateFile'] ? Module['locateFile']('bundle.metadata', '') : 'bundle.metadata';
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
     if (xhr.readyState === 4 && xhr.status === 200) {
       loadPackage(JSON.parse(xhr.responseText));
     }
    }
    xhr.open('GET', REMOTE_METADATA_NAME, true);
    xhr.overrideMimeType('application/json');
    xhr.send(null);
   }

   if (Module['calledRun']) {
    runMetaWithFS();
   } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runMetaWithFS);
   }
  
  })();
// Emscripten:
var h;h||(h=typeof Module !== 'undefined' ? Module : {});var ba={},k;for(k in h)h.hasOwnProperty(k)&&(ba[k]=h[k]);var ca="./this.program";function da(a,b){throw b;}var ea="object"===typeof window,fa="function"===typeof importScripts,ha="object"===typeof process&&"object"===typeof process.versions&&"string"===typeof process.versions.node,l="",ia,ja,ka,la,ma;
if(ha)l=fa?require("path").dirname(l)+"/":__dirname+"/",ia=function(a,b){la||(la=require("fs"));ma||(ma=require("path"));a=ma.normalize(a);return la.readFileSync(a,b?null:"utf8")},ka=function(a){a=ia(a,!0);a.buffer||(a=new Uint8Array(a));assert(a.buffer);return a},ja=function(a,b,c){la||(la=require("fs"));ma||(ma=require("path"));a=ma.normalize(a);la.readFile(a,function(d,e){d?c(d):b(e.buffer)})},1<process.argv.length&&(ca=process.argv[1].replace(/\\/g,"/")),process.argv.slice(2),"undefined"!==typeof module&&
(module.exports=h),process.on("uncaughtException",function(a){if(!(a instanceof na))throw a;}),process.on("unhandledRejection",t),da=function(a,b){if(noExitRuntime||0<oa)throw process.exitCode=a,b;process.exit(a)},h.inspect=function(){return"[Emscripten Module object]"};else if(ea||fa)fa?l=self.location.href:"undefined"!==typeof document&&document.currentScript&&(l=document.currentScript.src),l=0!==l.indexOf("blob:")?l.substr(0,l.lastIndexOf("/")+1):"",ia=function(a){var b=new XMLHttpRequest;b.open("GET",
a,!1);b.send(null);return b.responseText},fa&&(ka=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}),ja=function(a,b,c){var d=new XMLHttpRequest;d.open("GET",a,!0);d.responseType="arraybuffer";d.onload=function(){200==d.status||0==d.status&&d.response?b(d.response):c()};d.onerror=c;d.send(null)};var pa=h.print||console.log.bind(console),qa=h.printErr||console.warn.bind(console);
for(k in ba)ba.hasOwnProperty(k)&&(h[k]=ba[k]);ba=null;h.thisProgram&&(ca=h.thisProgram);h.quit&&(da=h.quit);var ra;h.wasmBinary&&(ra=h.wasmBinary);var noExitRuntime=h.noExitRuntime||!0;"object"!==typeof WebAssembly&&t("no native wasm support detected");var sa,ta=!1;function assert(a,b){a||t("Assertion failed: "+b)}var ua="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
function va(a,b,c){var d=b+c;for(c=b;a[c]&&!(c>=d);)++c;if(16<c-b&&a.subarray&&ua)return ua.decode(a.subarray(b,c));for(d="";b<c;){var e=a[b++];if(e&128){var f=a[b++]&63;if(192==(e&224))d+=String.fromCharCode((e&31)<<6|f);else{var g=a[b++]&63;e=224==(e&240)?(e&15)<<12|f<<6|g:(e&7)<<18|f<<12|g<<6|a[b++]&63;65536>e?d+=String.fromCharCode(e):(e-=65536,d+=String.fromCharCode(55296|e>>10,56320|e&1023))}}else d+=String.fromCharCode(e)}return d}function u(a){return a?va(x,a,void 0):""}
function wa(a,b,c,d){if(!(0<d))return 0;var e=c;d=c+d-1;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var m=a.charCodeAt(++f);g=65536+((g&1023)<<10)|m&1023}if(127>=g){if(c>=d)break;b[c++]=g}else{if(2047>=g){if(c+1>=d)break;b[c++]=192|g>>6}else{if(65535>=g){if(c+2>=d)break;b[c++]=224|g>>12}else{if(c+3>=d)break;b[c++]=240|g>>18;b[c++]=128|g>>12&63}b[c++]=128|g>>6&63}b[c++]=128|g&63}}b[c]=0;return c-e}
function xa(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&(d=65536+((d&1023)<<10)|a.charCodeAt(++c)&1023);127>=d?++b:b=2047>=d?b+2:65535>=d?b+3:b+4}return b}function ya(a){var b=xa(a)+1,c=za(b);c&&wa(a,y,c,b);return c}function Aa(a,b){for(var c=0;c<a.length;++c)y[b++>>0]=a.charCodeAt(c);y[b>>0]=0}var Ba,y,x,Ca,Da,C,Ea,Fa=[],Ga=[],Ha=[],oa=0;function Ia(){var a=h.preRun.shift();Fa.unshift(a)}var Ja=0,Ka=null,La=null;
function Ma(){Ja++;h.monitorRunDependencies&&h.monitorRunDependencies(Ja)}function Na(){Ja--;h.monitorRunDependencies&&h.monitorRunDependencies(Ja);if(0==Ja&&(null!==Ka&&(clearInterval(Ka),Ka=null),La)){var a=La;La=null;a()}}h.preloadedImages={};h.preloadedAudios={};function t(a){if(h.onAbort)h.onAbort(a);qa(a);ta=!0;throw new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");}function Qa(){return D.startsWith("data:application/octet-stream;base64,")}var D;D="main.wasm";
if(!Qa()){var Ra=D;D=h.locateFile?h.locateFile(Ra,l):l+Ra}function Sa(){var a=D;try{if(a==D&&ra)return new Uint8Array(ra);if(ka)return ka(a);throw"both async and sync fetching of the wasm failed";}catch(b){t(b)}}
function Ta(){if(!ra&&(ea||fa)){if("function"===typeof fetch&&!D.startsWith("file://"))return fetch(D,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+D+"'";return a.arrayBuffer()}).catch(function(){return Sa()});if(ja)return new Promise(function(a,b){ja(D,function(c){a(new Uint8Array(c))},b)})}return Promise.resolve().then(function(){return Sa()})}var F,G;
function Ua(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(h);else{var c=b.Ib;"number"===typeof c?void 0===b.Wa?Ea.get(c)():Ea.get(c)(b.Wa):c(void 0===b.Wa?null:b.Wa)}}}
function Va(){function a(g){return(g=g.toTimeString().match(/\(([A-Za-z ]+)\)$/))?g[1]:"GMT"}var b=(new Date).getFullYear(),c=new Date(b,0,1),d=new Date(b,6,1);b=c.getTimezoneOffset();var e=d.getTimezoneOffset(),f=Math.max(b,e);C[Wa()>>2]=60*f;C[Xa()>>2]=Number(b!=e);c=a(c);d=a(d);c=ya(c);d=ya(d);e<b?(C[Ya()>>2]=c,C[Ya()+4>>2]=d):(C[Ya()>>2]=d,C[Ya()+4>>2]=c)}var Za;
function $a(a,b){for(var c=0,d=a.length-1;0<=d;d--){var e=a[d];"."===e?a.splice(d,1):".."===e?(a.splice(d,1),c++):c&&(a.splice(d,1),c--)}if(b)for(;c;c--)a.unshift("..");return a}function H(a){var b="/"===a.charAt(0),c="/"===a.substr(-1);(a=$a(a.split("/").filter(function(d){return!!d}),!b).join("/"))||b||(a=".");a&&c&&(a+="/");return(b?"/":"")+a}
function ab(a){var b=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);a=b[0];b=b[1];if(!a&&!b)return".";b&&(b=b.substr(0,b.length-1));return a+b}function bb(a){if("/"===a)return"/";a=H(a);a=a.replace(/\/$/,"");var b=a.lastIndexOf("/");return-1===b?a:a.substr(b+1)}
function cb(){if("object"===typeof crypto&&"function"===typeof crypto.getRandomValues){var a=new Uint8Array(1);return function(){crypto.getRandomValues(a);return a[0]}}if(ha)try{var b=require("crypto");return function(){return b.randomBytes(1)[0]}}catch(c){}return function(){t("randomDevice")}}
function db(){for(var a="",b=!1,c=arguments.length-1;-1<=c&&!b;c--){b=0<=c?arguments[c]:"/";if("string"!==typeof b)throw new TypeError("Arguments to path.resolve must be strings");if(!b)return"";a=b+"/"+a;b="/"===b.charAt(0)}a=$a(a.split("/").filter(function(d){return!!d}),!b).join("/");return(b?"/":"")+a||"."}
function eb(a,b){function c(g){for(var m=0;m<g.length&&""===g[m];m++);for(var n=g.length-1;0<=n&&""===g[n];n--);return m>n?[]:g.slice(m,n-m+1)}a=db(a).substr(1);b=db(b).substr(1);a=c(a.split("/"));b=c(b.split("/"));for(var d=Math.min(a.length,b.length),e=d,f=0;f<d;f++)if(a[f]!==b[f]){e=f;break}d=[];for(f=e;f<a.length;f++)d.push("..");d=d.concat(b.slice(e));return d.join("/")}var fb=[];function gb(a,b){fb[a]={input:[],output:[],Ja:b};hb(a,ib)}
var ib={open:function(a){var b=fb[a.node.rdev];if(!b)throw new I(43);a.tty=b;a.seekable=!1},close:function(a){a.tty.Ja.flush(a.tty)},flush:function(a){a.tty.Ja.flush(a.tty)},read:function(a,b,c,d){if(!a.tty||!a.tty.Ja.hb)throw new I(60);for(var e=0,f=0;f<d;f++){try{var g=a.tty.Ja.hb(a.tty)}catch(m){throw new I(29);}if(void 0===g&&0===e)throw new I(6);if(null===g||void 0===g)break;e++;b[c+f]=g}e&&(a.node.timestamp=Date.now());return e},write:function(a,b,c,d){if(!a.tty||!a.tty.Ja.Ya)throw new I(60);
try{for(var e=0;e<d;e++)a.tty.Ja.Ya(a.tty,b[c+e])}catch(f){throw new I(29);}d&&(a.node.timestamp=Date.now());return e}},kb={hb:function(a){if(!a.input.length){var b=null;if(ha){var c=Buffer.alloc(256),d=0;try{d=la.readSync(process.stdin.fd,c,0,256,null)}catch(e){if(e.toString().includes("EOF"))d=0;else throw e;}0<d?b=c.slice(0,d).toString("utf-8"):b=null}else"undefined"!=typeof window&&"function"==typeof window.prompt?(b=window.prompt("Input: "),null!==b&&(b+="\n")):"function"==typeof readline&&(b=
readline(),null!==b&&(b+="\n"));if(!b)return null;a.input=jb(b)}return a.input.shift()},Ya:function(a,b){null===b||10===b?(pa(va(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(pa(va(a.output,0)),a.output=[])}},lb={Ya:function(a,b){null===b||10===b?(qa(va(a.output,0)),a.output=[]):0!=b&&a.output.push(b)},flush:function(a){a.output&&0<a.output.length&&(qa(va(a.output,0)),a.output=[])}},K={Da:null,ua:function(){return K.createNode(null,"/",16895,0)},
createNode:function(a,b,c,d){if(24576===(c&61440)||4096===(c&61440))throw new I(63);K.Da||(K.Da={dir:{node:{Ba:K.la.Ba,wa:K.la.wa,lookup:K.la.lookup,Ua:K.la.Ua,rename:K.la.rename,unlink:K.la.unlink,rmdir:K.la.rmdir,readdir:K.la.readdir,symlink:K.la.symlink},stream:{Ga:K.ma.Ga}},file:{node:{Ba:K.la.Ba,wa:K.la.wa},stream:{Ga:K.ma.Ga,read:K.ma.read,write:K.ma.write,bb:K.ma.bb,kb:K.ma.kb,mb:K.ma.mb}},link:{node:{Ba:K.la.Ba,wa:K.la.wa,readlink:K.la.readlink},stream:{}},eb:{node:{Ba:K.la.Ba,wa:K.la.wa},
stream:mb}});c=nb(a,b,c,d);M(c.mode)?(c.la=K.Da.dir.node,c.ma=K.Da.dir.stream,c.na={}):32768===(c.mode&61440)?(c.la=K.Da.file.node,c.ma=K.Da.file.stream,c.pa=0,c.na=null):40960===(c.mode&61440)?(c.la=K.Da.link.node,c.ma=K.Da.link.stream):8192===(c.mode&61440)&&(c.la=K.Da.eb.node,c.ma=K.Da.eb.stream);c.timestamp=Date.now();a&&(a.na[b]=c,a.timestamp=c.timestamp);return c},Jb:function(a){return a.na?a.na.subarray?a.na.subarray(0,a.pa):new Uint8Array(a.na):new Uint8Array(0)},fb:function(a,b){var c=a.na?
a.na.length:0;c>=b||(b=Math.max(b,c*(1048576>c?2:1.125)>>>0),0!=c&&(b=Math.max(b,256)),c=a.na,a.na=new Uint8Array(b),0<a.pa&&a.na.set(c.subarray(0,a.pa),0))},Cb:function(a,b){if(a.pa!=b)if(0==b)a.na=null,a.pa=0;else{var c=a.na;a.na=new Uint8Array(b);c&&a.na.set(c.subarray(0,Math.min(b,a.pa)));a.pa=b}},la:{Ba:function(a){var b={};b.dev=8192===(a.mode&61440)?a.id:1;b.ino=a.id;b.mode=a.mode;b.nlink=1;b.uid=0;b.gid=0;b.rdev=a.rdev;M(a.mode)?b.size=4096:32768===(a.mode&61440)?b.size=a.pa:40960===(a.mode&
61440)?b.size=a.link.length:b.size=0;b.atime=new Date(a.timestamp);b.mtime=new Date(a.timestamp);b.ctime=new Date(a.timestamp);b.tb=4096;b.blocks=Math.ceil(b.size/b.tb);return b},wa:function(a,b){void 0!==b.mode&&(a.mode=b.mode);void 0!==b.timestamp&&(a.timestamp=b.timestamp);void 0!==b.size&&K.Cb(a,b.size)},lookup:function(){throw ob[44];},Ua:function(a,b,c,d){return K.createNode(a,b,c,d)},rename:function(a,b,c){if(M(a.mode)){try{var d=N(b,c)}catch(f){}if(d)for(var e in d.na)throw new I(55);}delete a.parent.na[a.name];
a.parent.timestamp=Date.now();a.name=c;b.na[c]=a;b.timestamp=a.parent.timestamp;a.parent=b},unlink:function(a,b){delete a.na[b];a.timestamp=Date.now()},rmdir:function(a,b){var c=N(a,b),d;for(d in c.na)throw new I(55);delete a.na[b];a.timestamp=Date.now()},readdir:function(a){var b=[".",".."],c;for(c in a.na)a.na.hasOwnProperty(c)&&b.push(c);return b},symlink:function(a,b,c){a=K.createNode(a,b,41471,0);a.link=c;return a},readlink:function(a){if(40960!==(a.mode&61440))throw new I(28);return a.link}},
ma:{read:function(a,b,c,d,e){var f=a.node.na;if(e>=a.node.pa)return 0;a=Math.min(a.node.pa-e,d);if(8<a&&f.subarray)b.set(f.subarray(e,e+a),c);else for(d=0;d<a;d++)b[c+d]=f[e+d];return a},write:function(a,b,c,d,e,f){if(!d)return 0;a=a.node;a.timestamp=Date.now();if(b.subarray&&(!a.na||a.na.subarray)){if(f)return a.na=b.subarray(c,c+d),a.pa=d;if(0===a.pa&&0===e)return a.na=b.slice(c,c+d),a.pa=d;if(e+d<=a.pa)return a.na.set(b.subarray(c,c+d),e),d}K.fb(a,e+d);if(a.na.subarray&&b.subarray)a.na.set(b.subarray(c,
c+d),e);else for(f=0;f<d;f++)a.na[e+f]=b[c+f];a.pa=Math.max(a.pa,e+d);return d},Ga:function(a,b,c){1===c?b+=a.position:2===c&&32768===(a.node.mode&61440)&&(b+=a.node.pa);if(0>b)throw new I(28);return b},bb:function(a,b,c){K.fb(a.node,b+c);a.node.pa=Math.max(a.node.pa,b+c)},kb:function(a,b,c,d,e,f){if(0!==b)throw new I(28);if(32768!==(a.node.mode&61440))throw new I(43);a=a.node.na;if(f&2||a.buffer!==Ba){if(0<d||d+c<a.length)a.subarray?a=a.subarray(d,d+c):a=Array.prototype.slice.call(a,d,d+c);d=!0;
t();c=void 0;if(!c)throw new I(48);y.set(a,c)}else d=!1,c=a.byteOffset;return{Nb:c,Gb:d}},mb:function(a,b,c,d,e){if(32768!==(a.node.mode&61440))throw new I(43);if(e&2)return 0;K.ma.write(a,b,0,d,c,!1);return 0}}};function pb(a,b,c){var d="al "+a;ja(a,function(e){assert(e,'Loading data file "'+a+'" failed (no arrayBuffer).');b(new Uint8Array(e));d&&Na(d)},function(){if(c)c();else throw'Loading data file "'+a+'" failed.';});d&&Ma(d)}var qb=null,rb={},O=[],sb=1,P=null,tb=!0,I=null,ob={};
function Q(a,b){a=db("/",a);b=b||{};if(!a)return{path:"",node:null};var c={gb:!0,Za:0},d;for(d in c)void 0===b[d]&&(b[d]=c[d]);if(8<b.Za)throw new I(32);a=$a(a.split("/").filter(function(g){return!!g}),!1);var e=qb;c="/";for(d=0;d<a.length;d++){var f=d===a.length-1;if(f&&b.parent)break;e=N(e,a[d]);c=H(c+"/"+a[d]);e.Ea&&(!f||f&&b.gb)&&(e=e.Ea.root);if(!f||b.Ha)for(f=0;40960===(e.mode&61440);)if(e=ub(c),c=db(ab(c),e),e=Q(c,{Za:b.Za}).node,40<f++)throw new I(32);}return{path:c,node:e}}
function R(a){for(var b;;){if(a===a.parent)return a=a.ua.lb,b?"/"!==a[a.length-1]?a+"/"+b:a+b:a;b=b?a.name+"/"+b:a.name;a=a.parent}}function vb(a,b){for(var c=0,d=0;d<b.length;d++)c=(c<<5)-c+b.charCodeAt(d)|0;return(a+c>>>0)%P.length}function wb(a){var b=vb(a.parent.id,a.name);a.Ia=P[b];P[b]=a}function xb(a){var b=vb(a.parent.id,a.name);if(P[b]===a)P[b]=a.Ia;else for(b=P[b];b;){if(b.Ia===a){b.Ia=a.Ia;break}b=b.Ia}}
function N(a,b){var c;if(c=(c=yb(a,"x"))?c:a.la.lookup?0:2)throw new I(c,a);for(c=P[vb(a.id,b)];c;c=c.Ia){var d=c.name;if(c.parent.id===a.id&&d===b)return c}return a.la.lookup(a,b)}function nb(a,b,c,d){a=new Ab(a,b,c,d);wb(a);return a}function M(a){return 16384===(a&61440)}var Bb={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090};function Cb(a){var b=["r","w","rw"][a&3];a&512&&(b+="w");return b}
function yb(a,b){if(tb)return 0;if(!b.includes("r")||a.mode&292){if(b.includes("w")&&!(a.mode&146)||b.includes("x")&&!(a.mode&73))return 2}else return 2;return 0}function Db(a,b){try{return N(a,b),20}catch(c){}return yb(a,"wx")}function Eb(a,b,c){try{var d=N(a,b)}catch(e){return e.oa}if(a=yb(a,"wx"))return a;if(c){if(!M(d.mode))return 54;if(d===d.parent||"/"===R(d))return 10}else if(M(d.mode))return 31;return 0}function Fb(a,b){b=b||4096;for(a=a||0;a<=b;a++)if(!O[a])return a;throw new I(33);}
function Gb(a,b,c){Hb||(Hb=function(){},Hb.prototype={});var d=new Hb,e;for(e in a)d[e]=a[e];a=d;b=Fb(b,c);a.fd=b;return O[b]=a}var mb={open:function(a){a.ma=rb[a.node.rdev].ma;a.ma.open&&a.ma.open(a)},Ga:function(){throw new I(70);}};function hb(a,b){rb[a]={ma:b}}
function Ib(a,b){var c="/"===b,d=!b;if(c&&qb)throw new I(10);if(!c&&!d){var e=Q(b,{gb:!1});b=e.path;e=e.node;if(e.Ea)throw new I(10);if(!M(e.mode))throw new I(54);}b={type:a,Mb:{},lb:b,Ab:[]};a=a.ua(b);a.ua=b;b.root=a;c?qb=a:e&&(e.Ea=b,e.ua&&e.ua.Ab.push(b));return a}function Jb(a,b,c){var d=Q(a,{parent:!0}).node;a=bb(a);if(!a||"."===a||".."===a)throw new I(28);var e=Db(d,a);if(e)throw new I(e);if(!d.la.Ua)throw new I(63);return d.la.Ua(d,a,b,c)}
function S(a,b){return Jb(a,(void 0!==b?b:511)&1023|16384,0)}function Kb(a,b,c){"undefined"===typeof c&&(c=b,b=438);return Jb(a,b|8192,c)}function Lb(a,b){if(!db(a))throw new I(44);var c=Q(b,{parent:!0}).node;if(!c)throw new I(44);b=bb(b);var d=Db(c,b);if(d)throw new I(d);if(!c.la.symlink)throw new I(63);c.la.symlink(c,b,a)}
function Mb(a){var b=Q(a,{parent:!0}).node;a=bb(a);var c=N(b,a),d=Eb(b,a,!1);if(d)throw new I(d);if(!b.la.unlink)throw new I(63);if(c.Ea)throw new I(10);b.la.unlink(b,a);xb(c)}function ub(a){a=Q(a).node;if(!a)throw new I(44);if(!a.la.readlink)throw new I(28);return db(R(a.parent),a.la.readlink(a))}function Nb(a,b){a=Q(a,{Ha:!b}).node;if(!a)throw new I(44);if(!a.la.Ba)throw new I(63);return a.la.Ba(a)}function Ob(a){return Nb(a,!0)}
function Pb(a,b){a="string"===typeof a?Q(a,{Ha:!0}).node:a;if(!a.la.wa)throw new I(63);a.la.wa(a,{mode:b&4095|a.mode&-4096,timestamp:Date.now()})}
function T(a,b,c,d,e){if(""===a)throw new I(44);if("string"===typeof b){var f=Bb[b];if("undefined"===typeof f)throw Error("Unknown file open mode: "+b);b=f}c=b&64?("undefined"===typeof c?438:c)&4095|32768:0;if("object"===typeof a)var g=a;else{a=H(a);try{g=Q(a,{Ha:!(b&131072)}).node}catch(m){}}f=!1;if(b&64)if(g){if(b&128)throw new I(20);}else g=Jb(a,c,0),f=!0;if(!g)throw new I(44);8192===(g.mode&61440)&&(b&=-513);if(b&65536&&!M(g.mode))throw new I(54);if(!f&&(c=g?40960===(g.mode&61440)?32:M(g.mode)&&
("r"!==Cb(b)||b&512)?31:yb(g,Cb(b)):44))throw new I(c);if(b&512){c=g;c="string"===typeof c?Q(c,{Ha:!0}).node:c;if(!c.la.wa)throw new I(63);if(M(c.mode))throw new I(31);if(32768!==(c.mode&61440))throw new I(28);if(f=yb(c,"w"))throw new I(f);c.la.wa(c,{size:0,timestamp:Date.now()})}b&=-131713;d=Gb({node:g,path:R(g),flags:b,seekable:!0,position:0,ma:g.ma,Eb:[],error:!1},d,e);d.ma.open&&d.ma.open(d);!h.logReadFiles||b&1||(Qb||(Qb={}),a in Qb||(Qb[a]=1));return d}
function Rb(a){if(null===a.fd)throw new I(8);a.Fa&&(a.Fa=null);try{a.ma.close&&a.ma.close(a)}catch(b){throw b;}finally{O[a.fd]=null}a.fd=null}function Sb(a,b,c){if(null===a.fd)throw new I(8);if(!a.seekable||!a.ma.Ga)throw new I(70);if(0!=c&&1!=c&&2!=c)throw new I(28);a.position=a.ma.Ga(a,b,c);a.Eb=[];return a.position}
function Tb(a,b,c,d,e,f){if(0>d||0>e)throw new I(28);if(null===a.fd)throw new I(8);if(0===(a.flags&2097155))throw new I(8);if(M(a.node.mode))throw new I(31);if(!a.ma.write)throw new I(28);a.seekable&&a.flags&1024&&Sb(a,0,2);var g="undefined"!==typeof e;if(!g)e=a.position;else if(!a.seekable)throw new I(70);b=a.ma.write(a,b,c,d,e,f);g||(a.position+=b);return b}
function Ub(){I||(I=function(a,b){this.node=b;this.Db=function(c){this.oa=c};this.Db(a);this.message="FS error"},I.prototype=Error(),I.prototype.constructor=I,[44].forEach(function(a){ob[a]=new I(a);ob[a].stack="<generic error, no stack>"}))}var Vb;function Wb(a,b){var c=0;a&&(c|=365);b&&(c|=146);return c}function Xb(a,b){a="string"===typeof a?a:R(a);for(b=b.split("/").reverse();b.length;){var c=b.pop();if(c){var d=H(a+"/"+c);try{S(d)}catch(e){}a=d}}return d}
function Yb(a,b,c,d){a=H(("string"===typeof a?a:R(a))+"/"+b);c=Wb(c,d);return Jb(a,(void 0!==c?c:438)&4095|32768,0)}function Zb(a,b,c,d,e,f){a=b?H(("string"===typeof a?a:R(a))+"/"+b):a;d=Wb(d,e);e=Jb(a,(void 0!==d?d:438)&4095|32768,0);if(c){if("string"===typeof c){a=Array(c.length);b=0;for(var g=c.length;b<g;++b)a[b]=c.charCodeAt(b);c=a}Pb(e,d|146);a=T(e,577);Tb(a,c,0,c.length,0,f);Rb(a);Pb(e,d)}return e}
function U(a,b,c,d){a=H(("string"===typeof a?a:R(a))+"/"+b);b=Wb(!!c,!!d);U.jb||(U.jb=64);var e=U.jb++<<8|0;hb(e,{open:function(f){f.seekable=!1},close:function(){d&&d.buffer&&d.buffer.length&&d(10)},read:function(f,g,m,n){for(var q=0,p=0;p<n;p++){try{var r=c()}catch(A){throw new I(29);}if(void 0===r&&0===q)throw new I(6);if(null===r||void 0===r)break;q++;g[m+p]=r}q&&(f.node.timestamp=Date.now());return q},write:function(f,g,m,n){for(var q=0;q<n;q++)try{d(g[m+q])}catch(p){throw new I(29);}n&&(f.node.timestamp=
Date.now());return q}});return Kb(a,b,e)}function $b(a){if(!(a.xb||a.yb||a.link||a.na)){if("undefined"!==typeof XMLHttpRequest)throw Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");if(ia)try{a.na=jb(ia(a.url)),a.pa=a.na.length}catch(b){throw new I(29);}else throw Error("Cannot load without read() or XMLHttpRequest.");}}
function ac(a,b,c,d,e){function f(){this.Xa=!1;this.Ta=[]}f.prototype.get=function(p){if(!(p>this.length-1||0>p)){var r=p%this.chunkSize;return this.ib(p/this.chunkSize|0)[r]}};f.prototype.zb=function(p){this.ib=p};f.prototype.cb=function(){var p=new XMLHttpRequest;p.open("HEAD",c,!1);p.send(null);if(!(200<=p.status&&300>p.status||304===p.status))throw Error("Couldn't load "+c+". Status: "+p.status);var r=Number(p.getResponseHeader("Content-length")),A,B=(A=p.getResponseHeader("Accept-Ranges"))&&
"bytes"===A;p=(A=p.getResponseHeader("Content-Encoding"))&&"gzip"===A;var w=1048576;B||(w=r);var v=this;v.zb(function(E){var L=E*w,aa=(E+1)*w-1;aa=Math.min(aa,r-1);if("undefined"===typeof v.Ta[E]){var J=v.Ta;if(L>aa)throw Error("invalid range ("+L+", "+aa+") or no bytes requested!");if(aa>r-1)throw Error("only "+r+" bytes available! programmer error!");var z=new XMLHttpRequest;z.open("GET",c,!1);r!==w&&z.setRequestHeader("Range","bytes="+L+"-"+aa);"undefined"!=typeof Uint8Array&&(z.responseType="arraybuffer");
z.overrideMimeType&&z.overrideMimeType("text/plain; charset=x-user-defined");z.send(null);if(!(200<=z.status&&300>z.status||304===z.status))throw Error("Couldn't load "+c+". Status: "+z.status);L=void 0!==z.response?new Uint8Array(z.response||[]):jb(z.responseText||"");J[E]=L}if("undefined"===typeof v.Ta[E])throw Error("doXHR failed!");return v.Ta[E]});if(p||!r)w=r=1,w=r=this.ib(0).length,pa("LazyFiles on gzip forces download of the whole file when length is accessed");this.sb=r;this.rb=w;this.Xa=
!0};if("undefined"!==typeof XMLHttpRequest){if(!fa)throw"Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var g=new f;Object.defineProperties(g,{length:{get:function(){this.Xa||this.cb();return this.sb}},chunkSize:{get:function(){this.Xa||this.cb();return this.rb}}});var m=void 0}else m=c,g=void 0;var n=Yb(a,b,d,e);g?n.na=g:m&&(n.na=null,n.url=m);Object.defineProperties(n,{pa:{get:function(){return this.na.length}}});var q={};Object.keys(n.ma).forEach(function(p){var r=
n.ma[p];q[p]=function(){$b(n);return r.apply(null,arguments)}});q.read=function(p,r,A,B,w){$b(n);p=p.node.na;if(w>=p.length)return 0;B=Math.min(p.length-w,B);if(p.slice)for(var v=0;v<B;v++)r[A+v]=p[w+v];else for(v=0;v<B;v++)r[A+v]=p.get(w+v);return B};n.ma=q;return n}
function bc(a,b,c,d,e,f,g,m,n,q){function p(B){function w(E){q&&q();m||Zb(a,b,E,d,e,n);f&&f();Na(A)}var v=!1;h.preloadPlugins.forEach(function(E){!v&&E.canHandle(r)&&(E.handle(B,r,w,function(){g&&g();Na(A)}),v=!0)});v||w(B)}cc.Lb();var r=b?db(H(a+"/"+b)):a,A="cp "+r;Ma(A);"string"==typeof c?pb(c,function(B){p(B)},g):p(c)}var V={},Hb,Qb;
function dc(a,b,c){try{var d=a(b)}catch(e){if(e&&e.node&&H(b)!==H(R(e.node)))return-54;throw e;}C[c>>2]=d.dev;C[c+4>>2]=0;C[c+8>>2]=d.ino;C[c+12>>2]=d.mode;C[c+16>>2]=d.nlink;C[c+20>>2]=d.uid;C[c+24>>2]=d.gid;C[c+28>>2]=d.rdev;C[c+32>>2]=0;G=[d.size>>>0,(F=d.size,1<=+Math.abs(F)?0<F?(Math.min(+Math.floor(F/4294967296),4294967295)|0)>>>0:~~+Math.ceil((F-+(~~F>>>0))/4294967296)>>>0:0)];C[c+40>>2]=G[0];C[c+44>>2]=G[1];C[c+48>>2]=4096;C[c+52>>2]=d.blocks;C[c+56>>2]=d.atime.getTime()/1E3|0;C[c+60>>2]=
0;C[c+64>>2]=d.mtime.getTime()/1E3|0;C[c+68>>2]=0;C[c+72>>2]=d.ctime.getTime()/1E3|0;C[c+76>>2]=0;G=[d.ino>>>0,(F=d.ino,1<=+Math.abs(F)?0<F?(Math.min(+Math.floor(F/4294967296),4294967295)|0)>>>0:~~+Math.ceil((F-+(~~F>>>0))/4294967296)>>>0:0)];C[c+80>>2]=G[0];C[c+84>>2]=G[1];return 0}var ec=void 0;function fc(){ec+=4;return C[ec-4>>2]}function W(a){a=O[a];if(!a)throw new I(8);return a}
var X={ua:function(){h.websocket=h.websocket&&"object"===typeof h.websocket?h.websocket:{};h.websocket.Va={};h.websocket.on=function(a,b){"function"===typeof b&&(this.Va[a]=b);return this};h.websocket.emit=function(a,b){"function"===typeof this.Va[a]&&this.Va[a].call(this,b)};return nb(null,"/",16895,0)},createSocket:function(a,b,c){b&=-526337;c&&assert(1==b==(6==c));a={family:a,type:b,protocol:c,sa:null,error:null,Oa:{},pending:[],Ka:[],xa:X.ta};b=X.Ca();c=nb(X.root,b,49152,0);c.La=a;b=Gb({path:b,
node:c,flags:2,seekable:!1,ma:X.ma});a.stream=b;return a},vb:function(a){return(a=O[a])&&49152===(a.node.mode&49152)?a.node.La:null},ma:{Pa:function(a){a=a.node.La;return a.xa.Pa(a)},Na:function(a,b,c){a=a.node.La;return a.xa.Na(a,b,c)},read:function(a,b,c,d){a=a.node.La;d=a.xa.nb(a,d);if(!d)return 0;b.set(d.buffer,c);return d.buffer.length},write:function(a,b,c,d){a=a.node.La;return a.xa.qb(a,b,c,d)},close:function(a){a=a.node.La;a.xa.close(a)}},Ca:function(){X.Ca.current||(X.Ca.current=0);return"socket["+
X.Ca.current++ +"]"},ta:{Qa:function(a,b,c){if("object"===typeof b){var d=b;c=b=null}if(d)if(d._socket)b=d._socket.remoteAddress,c=d._socket.remotePort;else{c=/ws[s]?:\/\/([^:]+):(\d+)/.exec(d.url);if(!c)throw Error("WebSocket URL must be in the format ws(s)://address:port");b=c[1];c=parseInt(c[2],10)}else try{var e=h.websocket&&"object"===typeof h.websocket,f="ws://";e&&"string"===typeof h.websocket.url&&(f=h.websocket.url);if("ws://"===f||"wss://"===f){var g=b.split("/");f=f+g[0]+":"+c+"/"+g.slice(1).join("/")}g=
"binary";e&&"string"===typeof h.websocket.subprotocol&&(g=h.websocket.subprotocol);var m=void 0;"null"!==g&&(g=g.replace(/^ +| +$/g,"").split(/ *, */),m=ha?{protocol:g.toString()}:g);e&&null===h.websocket.subprotocol&&(m=void 0);d=new (ha?require("ws"):WebSocket)(f,m);d.binaryType="arraybuffer"}catch(n){throw new I(23);}b={ra:b,port:c,socket:d,Ra:[]};X.ta.ab(a,b);X.ta.wb(a,b);2===a.type&&"undefined"!==typeof a.Ma&&b.Ra.push(new Uint8Array([255,255,255,255,112,111,114,116,(a.Ma&65280)>>8,a.Ma&255]));
return b},Sa:function(a,b,c){return a.Oa[b+":"+c]},ab:function(a,b){a.Oa[b.ra+":"+b.port]=b},pb:function(a,b){delete a.Oa[b.ra+":"+b.port]},wb:function(a,b){function c(){h.websocket.emit("open",a.stream.fd);try{for(var f=b.Ra.shift();f;)b.socket.send(f),f=b.Ra.shift()}catch(g){b.socket.close()}}function d(f){if("string"===typeof f)f=(new TextEncoder).encode(f);else{assert(void 0!==f.byteLength);if(0==f.byteLength)return;f=new Uint8Array(f)}var g=e;e=!1;g&&10===f.length&&255===f[0]&&255===f[1]&&255===
f[2]&&255===f[3]&&112===f[4]&&111===f[5]&&114===f[6]&&116===f[7]?(f=f[8]<<8|f[9],X.ta.pb(a,b),b.port=f,X.ta.ab(a,b)):(a.Ka.push({ra:b.ra,port:b.port,data:f}),h.websocket.emit("message",a.stream.fd))}var e=!0;ha?(b.socket.on("open",c),b.socket.on("message",function(f,g){g.Hb&&d((new Uint8Array(f)).buffer)}),b.socket.on("close",function(){h.websocket.emit("close",a.stream.fd)}),b.socket.on("error",function(){a.error=14;h.websocket.emit("error",[a.stream.fd,a.error,"ECONNREFUSED: Connection refused"])})):
(b.socket.onopen=c,b.socket.onclose=function(){h.websocket.emit("close",a.stream.fd)},b.socket.onmessage=function(f){d(f.data)},b.socket.onerror=function(){a.error=14;h.websocket.emit("error",[a.stream.fd,a.error,"ECONNREFUSED: Connection refused"])})},Pa:function(a){if(1===a.type&&a.sa)return a.pending.length?65:0;var b=0,c=1===a.type?X.ta.Sa(a,a.va,a.za):null;if(a.Ka.length||!c||c&&c.socket.readyState===c.socket.CLOSING||c&&c.socket.readyState===c.socket.CLOSED)b|=65;if(!c||c&&c.socket.readyState===
c.socket.OPEN)b|=4;if(c&&c.socket.readyState===c.socket.CLOSING||c&&c.socket.readyState===c.socket.CLOSED)b|=16;return b},Na:function(a,b,c){switch(b){case 21531:return b=0,a.Ka.length&&(b=a.Ka[0].data.length),C[c>>2]=b,0;default:return 28}},close:function(a){if(a.sa){try{a.sa.close()}catch(e){}a.sa=null}for(var b=Object.keys(a.Oa),c=0;c<b.length;c++){var d=a.Oa[b[c]];try{d.socket.close()}catch(e){}X.ta.pb(a,d)}return 0},bind:function(a,b,c){if("undefined"!==typeof a.$a||"undefined"!==typeof a.Ma)throw new I(28);
a.$a=b;a.Ma=c;if(2===a.type){a.sa&&(a.sa.close(),a.sa=null);try{a.xa.listen(a,0)}catch(d){if(!(d instanceof I))throw d;if(138!==d.oa)throw d;}}},connect:function(a,b,c){if(a.sa)throw new I(138);if("undefined"!==typeof a.va&&"undefined"!==typeof a.za){var d=X.ta.Sa(a,a.va,a.za);if(d){if(d.socket.readyState===d.socket.CONNECTING)throw new I(7);throw new I(30);}}b=X.ta.Qa(a,b,c);a.va=b.ra;a.za=b.port;throw new I(26);},listen:function(a){if(!ha)throw new I(138);if(a.sa)throw new I(28);var b=require("ws").Server;
a.sa=new b({host:a.$a,port:a.Ma});h.websocket.emit("listen",a.stream.fd);a.sa.on("connection",function(c){if(1===a.type){var d=X.createSocket(a.family,a.type,a.protocol);c=X.ta.Qa(d,c);d.va=c.ra;d.za=c.port;a.pending.push(d);h.websocket.emit("connection",d.stream.fd)}else X.ta.Qa(a,c),h.websocket.emit("connection",a.stream.fd)});a.sa.on("closed",function(){h.websocket.emit("close",a.stream.fd);a.sa=null});a.sa.on("error",function(){a.error=23;h.websocket.emit("error",[a.stream.fd,a.error,"EHOSTUNREACH: Host is unreachable"])})},
accept:function(a){if(!a.sa)throw new I(28);var b=a.pending.shift();b.stream.flags=a.stream.flags;return b},Kb:function(a,b){if(b){if(void 0===a.va||void 0===a.za)throw new I(53);b=a.va;a=a.za}else b=a.$a||0,a=a.Ma||0;return{ra:b,port:a}},qb:function(a,b,c,d,e,f){if(2===a.type){if(void 0===e||void 0===f)e=a.va,f=a.za;if(void 0===e||void 0===f)throw new I(17);}else e=a.va,f=a.za;var g=X.ta.Sa(a,e,f);if(1===a.type){if(!g||g.socket.readyState===g.socket.CLOSING||g.socket.readyState===g.socket.CLOSED)throw new I(53);
if(g.socket.readyState===g.socket.CONNECTING)throw new I(6);}ArrayBuffer.isView(b)&&(c+=b.byteOffset,b=b.buffer);b=b.slice(c,c+d);if(2===a.type&&(!g||g.socket.readyState!==g.socket.OPEN))return g&&g.socket.readyState!==g.socket.CLOSING&&g.socket.readyState!==g.socket.CLOSED||(g=X.ta.Qa(a,e,f)),g.Ra.push(b),d;try{return g.socket.send(b),d}catch(m){throw new I(28);}},nb:function(a,b){if(1===a.type&&a.sa)throw new I(53);var c=a.Ka.shift();if(!c){if(1===a.type){if(a=X.ta.Sa(a,a.va,a.za)){if(a.socket.readyState===
a.socket.CLOSING||a.socket.readyState===a.socket.CLOSED)return null;throw new I(6);}throw new I(53);}throw new I(6);}var d=c.data.byteLength||c.data.length,e=c.data.byteOffset||0,f=c.data.buffer||c.data;b=Math.min(b,d);var g={buffer:new Uint8Array(f,e,b),ra:c.ra,port:c.port};1===a.type&&b<d&&(c.data=new Uint8Array(f,e+b,d-b),a.Ka.unshift(c));return g}}};function gc(a){a=X.vb(a);if(!a)throw new I(8);return a}
function hc(a){a=a.split(".");for(var b=0;4>b;b++){var c=Number(a[b]);if(isNaN(c))return null;a[b]=c}return(a[0]|a[1]<<8|a[2]<<16|a[3]<<24)>>>0}
function ic(a){var b,c,d=[];if(!/^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i.test(a))return null;if("::"===a)return[0,0,0,0,0,0,0,0];a=a.startsWith("::")?a.replace("::","Z:"):a.replace("::",":Z:");0<a.indexOf(".")?(a=a.replace(RegExp("[.]","g"),":"),a=a.split(":"),a[a.length-4]=parseInt(a[a.length-4])+256*parseInt(a[a.length-3]),a[a.length-3]=parseInt(a[a.length-2])+256*parseInt(a[a.length-
1]),a=a.slice(0,a.length-2)):a=a.split(":");for(b=c=0;b<a.length;b++)if("string"===typeof a[b])if("Z"===a[b]){for(c=0;c<8-a.length+1;c++)d[b+c]=0;--c}else d[b+c]=jc(parseInt(a[b],16));else d[b+c]=a[b];return[d[1]<<16|d[0],d[3]<<16|d[2],d[5]<<16|d[4],d[7]<<16|d[6]]}
function kc(a,b,c,d,e){switch(b){case 2:c=hc(c);x.fill(0,a,a+16);e&&(C[e>>2]=16);Ca[a>>1]=b;C[a+4>>2]=c;Ca[a+2>>1]=jc(d);break;case 10:c=ic(c);x.fill(0,a,a+28);e&&(C[e>>2]=28);C[a>>2]=b;C[a+8>>2]=c[0];C[a+12>>2]=c[1];C[a+16>>2]=c[2];C[a+20>>2]=c[3];Ca[a+2>>1]=jc(d);break;default:return 5}return 0}var lc=1,mc={},nc={};
function oc(a){var b=hc(a);if(null!==b)return a;b=ic(a);if(null!==b)return a;mc[a]?b=mc[a]:(b=lc++,assert(65535>b,"exceeded max address mappings of 65535"),b="172.29."+(b&255)+"."+(b&65280),nc[b]=a,mc[a]=b);return b}function pc(a){return(a&255)+"."+(a>>8&255)+"."+(a>>16&255)+"."+(a>>24&255)}
function qc(a){var b="",c,d=0,e=0,f=0,g=0;a=[a[0]&65535,a[0]>>16,a[1]&65535,a[1]>>16,a[2]&65535,a[2]>>16,a[3]&65535,a[3]>>16];var m=!0;for(c=0;5>c;c++)if(0!==a[c]){m=!1;break}if(m){c=pc(a[6]|a[7]<<16);if(-1===a[5])return"::ffff:"+c;if(0===a[5])return"0.0.0.0"===c&&(c=""),"0.0.0.1"===c&&(c="1"),"::"+c}for(c=0;8>c;c++)0===a[c]&&(1<c-e&&(g=0),e=c,g++),g>d&&(d=g,f=c-d+1);for(c=0;8>c;c++)1<d&&0===a[c]&&c>=f&&c<f+d?c===f&&(b+=":",0===f&&(b+=":")):(b+=Number(rc(a[c]&65535)).toString(16),b+=7>c?":":"");return b}
function sc(a,b){var c=Ca[a>>1],d=rc(Da[a+2>>1]);switch(c){case 2:if(16!==b)return{oa:28};a=C[a+4>>2];a=pc(a);break;case 10:if(28!==b)return{oa:28};a=[C[a+8>>2],C[a+12>>2],C[a+16>>2],C[a+20>>2]];a=qc(a);break;default:return{oa:5}}return{family:c,ra:a,port:d}}function tc(a,b,c){if(c&&0===a)return null;a=sc(a,b);if(a.oa)throw new I(a.oa);b=a.ra;a.ra=(nc[b]?nc[b]:null)||a.ra;return a}
var Y={ya:8192,ua:function(){return nb(null,"/",16895,0)},ub:function(){var a={qa:[],ob:2};a.qa.push({buffer:new Uint8Array(Y.ya),offset:0,Aa:0});var b=Y.Ca(),c=Y.Ca(),d=nb(Y.root,b,4096,0),e=nb(Y.root,c,4096,0);d.pipe=a;e.pipe=a;a=Gb({path:b,node:d,flags:0,seekable:!1,ma:Y.ma});d.stream=a;c=Gb({path:c,node:e,flags:1,seekable:!1,ma:Y.ma});e.stream=c;return{Bb:a.fd,Fb:c.fd}},ma:{Pa:function(a){var b=a.node.pipe;if(1===(a.flags&2097155))return 260;if(0<b.qa.length)for(a=0;a<b.qa.length;a++){var c=b.qa[a];
if(0<c.offset-c.Aa)return 65}return 0},Na:function(){return 28},fsync:function(){return 28},read:function(a,b,c,d){a=a.node.pipe;for(var e=0,f=0;f<a.qa.length;f++){var g=a.qa[f];e+=g.offset-g.Aa}assert(b instanceof ArrayBuffer||ArrayBuffer.isView(b));b=b.subarray(c,c+d);if(0>=d)return 0;if(0==e)throw new I(6);c=d=Math.min(e,d);for(f=e=0;f<a.qa.length;f++){g=a.qa[f];var m=g.offset-g.Aa;if(d<=m){var n=g.buffer.subarray(g.Aa,g.offset);d<m?(n=n.subarray(0,d),g.Aa+=d):e++;b.set(n);break}else n=g.buffer.subarray(g.Aa,
g.offset),b.set(n),b=b.subarray(n.byteLength),d-=n.byteLength,e++}e&&e==a.qa.length&&(e--,a.qa[e].offset=0,a.qa[e].Aa=0);a.qa.splice(0,e);return c},write:function(a,b,c,d){a=a.node.pipe;assert(b instanceof ArrayBuffer||ArrayBuffer.isView(b));b=b.subarray(c,c+d);c=b.byteLength;if(0>=c)return 0;0==a.qa.length?(d={buffer:new Uint8Array(Y.ya),offset:0,Aa:0},a.qa.push(d)):d=a.qa[a.qa.length-1];assert(d.offset<=Y.ya);var e=Y.ya-d.offset;if(e>=c)return d.buffer.set(b,d.offset),d.offset+=c,c;0<e&&(d.buffer.set(b.subarray(0,
e),d.offset),d.offset+=e,b=b.subarray(e,b.byteLength));d=b.byteLength/Y.ya|0;e=b.byteLength%Y.ya;for(var f=0;f<d;f++){var g={buffer:new Uint8Array(Y.ya),offset:Y.ya,Aa:0};a.qa.push(g);g.buffer.set(b.subarray(0,Y.ya));b=b.subarray(Y.ya,b.byteLength)}0<e&&(g={buffer:new Uint8Array(Y.ya),offset:b.byteLength,Aa:0},a.qa.push(g),g.buffer.set(b));return c},close:function(a){a=a.node.pipe;a.ob--;0===a.ob&&(a.qa=null)}},Ca:function(){Y.Ca.current||(Y.Ca.current=0);return"pipe["+Y.Ca.current++ +"]"}},uc={};
function vc(){if(!wc){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"===typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:ca||"./this.program"},b;for(b in uc)void 0===uc[b]?delete a[b]:a[b]=uc[b];var c=[];for(b in a)c.push(b+"="+a[b]);wc=c}return wc}var wc,Z={};
function xc(a){xc.buffer||(xc.buffer=za(256),Z["0"]="Success",Z["-1"]="Invalid value for 'ai_flags' field",Z["-2"]="NAME or SERVICE is unknown",Z["-3"]="Temporary failure in name resolution",Z["-4"]="Non-recoverable failure in name res",Z["-6"]="'ai_family' not supported",Z["-7"]="'ai_socktype' not supported",Z["-8"]="SERVICE not supported for 'ai_socktype'",Z["-10"]="Memory allocation failure",Z["-11"]="System error returned in 'errno'",Z["-12"]="Argument buffer overflow");var b="Unknown error";
a in Z&&(255<Z[a].length?b="Message too long":b=Z[a]);Aa(b,xc.buffer);return xc.buffer}function Ab(a,b,c,d){a||(a=this);this.parent=a;this.ua=a.ua;this.Ea=null;this.id=sb++;this.name=b;this.mode=c;this.la={};this.ma={};this.rdev=d}
Object.defineProperties(Ab.prototype,{read:{get:function(){return 365===(this.mode&365)},set:function(a){a?this.mode|=365:this.mode&=-366}},write:{get:function(){return 146===(this.mode&146)},set:function(a){a?this.mode|=146:this.mode&=-147}},yb:{get:function(){return M(this.mode)}},xb:{get:function(){return 8192===(this.mode&61440)}}});Ub();P=Array(4096);Ib(K,"/");S("/tmp");S("/home");S("/home/web_user");
(function(){S("/dev");hb(259,{read:function(){return 0},write:function(b,c,d,e){return e}});Kb("/dev/null",259);gb(1280,kb);gb(1536,lb);Kb("/dev/tty",1280);Kb("/dev/tty1",1536);var a=cb();U("/dev","random",a);U("/dev","urandom",a);S("/dev/shm");S("/dev/shm/tmp")})();
(function(){S("/proc");var a=S("/proc/self");S("/proc/self/fd");Ib({ua:function(){var b=nb(a,"fd",16895,73);b.la={lookup:function(c,d){var e=O[+d];if(!e)throw new I(8);c={parent:null,ua:{lb:"fake"},la:{readlink:function(){return e.path}}};return c.parent=c}};return b}},"/proc/self/fd")})();var cc;h.FS_createPath=Xb;h.FS_createDataFile=Zb;h.FS_createPreloadedFile=bc;h.FS_createLazyFile=ac;h.FS_createDevice=U;h.FS_unlink=Mb;
function jb(a){var b=Array(xa(a)+1);a=wa(a,b,0,b.length);b.length=a;return b}
var Bc={G:function(a,b){Za||(Za=!0,Va());a=new Date(1E3*C[a>>2]);C[b>>2]=a.getSeconds();C[b+4>>2]=a.getMinutes();C[b+8>>2]=a.getHours();C[b+12>>2]=a.getDate();C[b+16>>2]=a.getMonth();C[b+20>>2]=a.getFullYear()-1900;C[b+24>>2]=a.getDay();var c=new Date(a.getFullYear(),0,1);C[b+28>>2]=(a.getTime()-c.getTime())/864E5|0;C[b+36>>2]=-(60*a.getTimezoneOffset());var d=(new Date(a.getFullYear(),6,1)).getTimezoneOffset();c=c.getTimezoneOffset();a=(d!=c&&a.getTimezoneOffset()==Math.min(c,d))|0;C[b+32>>2]=a;
a=C[Ya()+(a?4:0)>>2];C[b+40>>2]=a;return b},K:function(a,b,c,d){try{for(var e=0,f=b?C[b>>2]:0,g=b?C[b+4>>2]:0,m=c?C[c>>2]:0,n=c?C[c+4>>2]:0,q=d?C[d>>2]:0,p=d?C[d+4>>2]:0,r=0,A=0,B=0,w=0,v=0,E=0,L=(b?C[b>>2]:0)|(c?C[c>>2]:0)|(d?C[d>>2]:0),aa=(b?C[b+4>>2]:0)|(c?C[c+4>>2]:0)|(d?C[d+4>>2]:0),J=0;J<a;J++){var z=1<<J%32;if(32>J?L&z:aa&z){var Oa=O[J];if(!Oa)throw new I(8);var Pa=5;Oa.ma.Pa&&(Pa=Oa.ma.Pa(Oa));Pa&1&&(32>J?f&z:g&z)&&(32>J?r|=z:A|=z,e++);Pa&4&&(32>J?m&z:n&z)&&(32>J?B|=z:w|=z,e++);Pa&2&&(32>
J?q&z:p&z)&&(32>J?v|=z:E|=z,e++)}}b&&(C[b>>2]=r,C[b+4>>2]=A);c&&(C[c>>2]=B,C[c+4>>2]=w);d&&(C[d>>2]=v,C[d+4>>2]=E);return e}catch(zb){return"undefined"!==typeof V&&zb instanceof I||t(zb),-zb.oa}},w:function(a,b,c){try{var d=gc(a),e=d.xa.accept(d);b&&kc(b,e.family,oc(e.va),e.za,c);return e.stream.fd}catch(f){return"undefined"!==typeof V&&f instanceof I||t(f),-f.oa}},N:function(a,b){try{a=u(a);if(b&-8)var c=-28;else{var d;(d=Q(a,{Ha:!0}).node)?(a="",b&4&&(a+="r"),b&2&&(a+="w"),b&1&&(a+="x"),c=a&&yb(d,
a)?-2:0):c=-44}return c}catch(e){return"undefined"!==typeof V&&e instanceof I||t(e),-e.oa}},z:function(a,b,c){try{var d=gc(a),e=tc(b,c);d.xa.bind(d,e.ra,e.port);return 0}catch(f){return"undefined"!==typeof V&&f instanceof I||t(f),-f.oa}},y:function(a,b,c){try{var d=gc(a),e=tc(b,c);d.xa.connect(d,e.ra,e.port);return 0}catch(f){return"undefined"!==typeof V&&f instanceof I||t(f),-f.oa}},P:function(a){try{var b=W(a);return T(b.path,b.flags,0).fd}catch(c){return"undefined"!==typeof V&&c instanceof I||
t(c),-c.oa}},M:function(a,b){try{var c=W(a);if(c.fd===b)var d=b;else{var e=c.path,f=c.flags,g=O[b];g&&Rb(g);d=T(e,f,0,b,b).fd}return d}catch(m){return"undefined"!==typeof V&&m instanceof I||t(m),-m.oa}},b:function(a,b,c){ec=c;try{var d=W(a);switch(b){case 0:var e=fc();return 0>e?-28:T(d.path,d.flags,0,e).fd;case 1:case 2:return 0;case 3:return d.flags;case 4:return e=fc(),d.flags|=e,0;case 12:return e=fc(),Ca[e+0>>1]=2,0;case 13:case 14:return 0;case 16:case 8:return-28;case 9:return C[yc()>>2]=28,
-1;default:return-28}}catch(f){return"undefined"!==typeof V&&f instanceof I||t(f),-f.oa}},V:function(a,b){try{var c=W(a);return dc(Nb,c.path,b)}catch(d){return"undefined"!==typeof V&&d instanceof I||t(d),-d.oa}},H:function(a,b,c){try{var d=W(a);if(!d.Fa){var e=Q(d.path,{Ha:!0}).node;if(!e.la.readdir)throw new I(54);var f=e.la.readdir(e);d.Fa=f}a=0;for(var g=Sb(d,0,1),m=Math.floor(g/280);m<d.Fa.length&&a+280<=c;){var n=d.Fa[m];if("."===n[0]){var q=1;var p=4}else{var r=N(d.node,n);q=r.id;p=8192===(r.mode&
61440)?2:M(r.mode)?4:40960===(r.mode&61440)?10:8}G=[q>>>0,(F=q,1<=+Math.abs(F)?0<F?(Math.min(+Math.floor(F/4294967296),4294967295)|0)>>>0:~~+Math.ceil((F-+(~~F>>>0))/4294967296)>>>0:0)];C[b+a>>2]=G[0];C[b+a+4>>2]=G[1];G=[280*(m+1)>>>0,(F=280*(m+1),1<=+Math.abs(F)?0<F?(Math.min(+Math.floor(F/4294967296),4294967295)|0)>>>0:~~+Math.ceil((F-+(~~F>>>0))/4294967296)>>>0:0)];C[b+a+8>>2]=G[0];C[b+a+12>>2]=G[1];Ca[b+a+16>>1]=280;y[b+a+18>>0]=p;wa(n,x,b+a+19,256);a+=280;m+=1}Sb(d,280*m,0);return a}catch(A){return"undefined"!==
typeof V&&A instanceof I||t(A),-A.oa}},O:function(){return 0},v:function(a,b,c){try{var d=gc(a);if(!d.va)return-53;kc(b,d.family,oc(d.va),d.za,c);return 0}catch(e){return"undefined"!==typeof V&&e instanceof I||t(e),-e.oa}},s:function(a,b,c,d,e){try{var f=gc(a);return 1===b&&4===c?(C[d>>2]=f.error,C[e>>2]=4,f.error=null,0):-50}catch(g){return"undefined"!==typeof V&&g instanceof I||t(g),-g.oa}},l:function(a,b,c){ec=c;try{var d=W(a);switch(b){case 21509:case 21505:return d.tty?0:-59;case 21510:case 21511:case 21512:case 21506:case 21507:case 21508:return d.tty?
0:-59;case 21519:if(!d.tty)return-59;var e=fc();return C[e>>2]=0;case 21520:return d.tty?-28:-59;case 21531:a=e=fc();if(!d.ma.Na)throw new I(59);return d.ma.Na(d,b,a);case 21523:return d.tty?0:-59;case 21524:return d.tty?0:-59;default:t("bad ioctl syscall "+b)}}catch(f){return"undefined"!==typeof V&&f instanceof I||t(f),-f.oa}},x:function(a,b){try{var c=gc(a);c.xa.listen(c,b);return 0}catch(d){return"undefined"!==typeof V&&d instanceof I||t(d),-d.oa}},W:function(a,b){try{return a=u(a),dc(Ob,a,b)}catch(c){return"undefined"!==
typeof V&&c instanceof I||t(c),-c.oa}},X:function(a,b){try{return a=u(a),a=H(a),"/"===a[a.length-1]&&(a=a.substr(0,a.length-1)),S(a,b),0}catch(c){return"undefined"!==typeof V&&c instanceof I||t(c),-c.oa}},m:function(a,b,c){ec=c;try{var d=u(a),e=c?fc():0;return T(d,b,e).fd}catch(f){return"undefined"!==typeof V&&f instanceof I||t(f),-f.oa}},Q:function(a){try{if(0==a)throw new I(21);var b=Y.ub();C[a>>2]=b.Bb;C[a+4>>2]=b.Fb;return 0}catch(c){return"undefined"!==typeof V&&c instanceof I||t(c),-c.oa}},
t:function(a,b,c,d,e,f){try{var g=gc(a),m=g.xa.nb(g,c);if(!m)return 0;e&&kc(e,g.family,oc(m.ra),m.port,f);x.set(m.buffer,b);return m.buffer.byteLength}catch(n){return"undefined"!==typeof V&&n instanceof I||t(n),-n.oa}},S:function(a,b){try{a=u(a);b=u(b);var c=ab(a),d=ab(b),e=bb(a),f=bb(b);var g=Q(a,{parent:!0});var m=g.node;g=Q(b,{parent:!0});var n=g.node;if(!m||!n)throw new I(44);if(m.ua!==n.ua)throw new I(75);var q=N(m,e),p=eb(a,d);if("."!==p.charAt(0))throw new I(28);p=eb(b,c);if("."!==p.charAt(0))throw new I(55);
try{var r=N(n,f)}catch(w){}if(q!==r){var A=M(q.mode),B=Eb(m,e,A);if(B)throw new I(B);if(B=r?Eb(n,f,A):Db(n,f))throw new I(B);if(!m.la.rename)throw new I(63);if(q.Ea||r&&r.Ea)throw new I(10);if(n!==m&&(B=yb(m,"w")))throw new I(B);xb(q);try{m.la.rename(q,n,f)}catch(w){throw w;}finally{wb(q)}}return 0}catch(w){return"undefined"!==typeof V&&w instanceof I||t(w),-w.oa}},T:function(a){try{a=u(a);var b=Q(a,{parent:!0}).node,c=bb(a),d=N(b,c),e=Eb(b,c,!0);if(e)throw new I(e);if(!b.la.rmdir)throw new I(63);
if(d.Ea)throw new I(10);b.la.rmdir(b,c);xb(d);return 0}catch(f){return"undefined"!==typeof V&&f instanceof I||t(f),-f.oa}},u:function(a,b,c,d,e,f){try{var g=gc(a),m=tc(e,f,!0);return m?g.xa.qb(g,y,b,c,m.ra,m.port):Tb(g.stream,y,b,c)}catch(n){return"undefined"!==typeof V&&n instanceof I||t(n),-n.oa}},r:function(){return-50},h:function(a,b,c){try{return X.createSocket(a,b,c).stream.fd}catch(d){return"undefined"!==typeof V&&d instanceof I||t(d),-d.oa}},n:function(a,b){try{return a=u(a),dc(Nb,a,b)}catch(c){return"undefined"!==
typeof V&&c instanceof I||t(c),-c.oa}},U:function(a){try{return a=u(a),Mb(a),0}catch(b){return"undefined"!==typeof V&&b instanceof I||t(b),-b.oa}},J:function(){return-52},a:function(){t()},R:function(){t("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")},Y:function(){t("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")},j:function(){t("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")},
L:function(){return x.length},A:function(a,b,c){x.copyWithin(a,b,b+c)},B:function(){t("OOM")},E:function(a,b){var c=0;vc().forEach(function(d,e){var f=b+c;C[a+4*e>>2]=f;Aa(d,f);c+=d.length+1});return 0},F:function(a,b){var c=vc();C[a>>2]=c.length;var d=0;c.forEach(function(e){d+=e.length+1});C[b>>2]=d;return 0},I:function(){C[yc()>>2]=45;return-1},e:function(a){zc(a)},c:function(a){try{var b=W(a);Rb(b);return 0}catch(c){return"undefined"!==typeof V&&c instanceof I||t(c),c.oa}},C:function(a,b){try{var c=
W(a);y[b>>0]=c.tty?2:M(c.mode)?3:40960===(c.mode&61440)?7:4;return 0}catch(d){return"undefined"!==typeof V&&d instanceof I||t(d),d.oa}},k:function(a,b,c,d){try{a:{for(var e=W(a),f=a=0;f<c;f++){var g=C[b+(8*f+4)>>2],m=e,n=C[b+8*f>>2],q=g,p=void 0,r=y;if(0>q||0>p)throw new I(28);if(null===m.fd)throw new I(8);if(1===(m.flags&2097155))throw new I(8);if(M(m.node.mode))throw new I(31);if(!m.ma.read)throw new I(28);var A="undefined"!==typeof p;if(!A)p=m.position;else if(!m.seekable)throw new I(70);var B=
m.ma.read(m,r,n,q,p);A||(m.position+=B);var w=B;if(0>w){var v=-1;break a}a+=w;if(w<g)break}v=a}C[d>>2]=v;return 0}catch(E){return"undefined"!==typeof V&&E instanceof I||t(E),E.oa}},q:function(a,b,c,d,e){try{var f=W(a);a=4294967296*c+(b>>>0);if(-9007199254740992>=a||9007199254740992<=a)return-61;Sb(f,a,d);G=[f.position>>>0,(F=f.position,1<=+Math.abs(F)?0<F?(Math.min(+Math.floor(F/4294967296),4294967295)|0)>>>0:~~+Math.ceil((F-+(~~F>>>0))/4294967296)>>>0:0)];C[e>>2]=G[0];C[e+4>>2]=G[1];f.Fa&&0===a&&
0===d&&(f.Fa=null);return 0}catch(g){return"undefined"!==typeof V&&g instanceof I||t(g),g.oa}},g:function(a,b,c,d){try{a:{for(var e=W(a),f=a=0;f<c;f++){var g=Tb(e,y,C[b+8*f>>2],C[b+(8*f+4)>>2],void 0);if(0>g){var m=-1;break a}a+=g}m=a}C[d>>2]=m;return 0}catch(n){return"undefined"!==typeof V&&n instanceof I||t(n),n.oa}},p:function(){C[yc()>>2]=52;return-1},d:xc,i:function(a,b,c,d){function e(r,A,B,w,v,E){var L=10===r?28:16;v=10===r?qc(v):pc(v);L=za(L);v=kc(L,r,v,E);assert(!v);v=za(32);C[v+4>>2]=r;
C[v+8>>2]=A;C[v+12>>2]=B;C[v+24>>2]=w;C[v+20>>2]=L;C[v+16>>2]=10===r?28:16;C[v+28>>2]=0;return v}var f=0,g=0,m=0,n=0,q=0,p=0;c&&(m=C[c>>2],n=C[c+4>>2],q=C[c+8>>2],p=C[c+12>>2]);q&&!p&&(p=2===q?17:6);!q&&p&&(q=17===p?2:1);0===p&&(p=6);0===q&&(q=1);if(!a&&!b)return-2;if(m&-1088||0!==c&&C[c>>2]&2&&!a)return-1;if(m&32)return-2;if(0!==q&&1!==q&&2!==q)return-7;if(0!==n&&2!==n&&10!==n)return-6;if(b&&(b=u(b),g=parseInt(b,10),isNaN(g)))return m&1024?-2:-8;if(!a)return 0===n&&(n=2),0===(m&1)&&(2===n?f=Ac(2130706433):
f=[0,0,0,1]),a=e(n,q,p,null,f,g),C[d>>2]=a,0;a=u(a);f=hc(a);if(null!==f)if(0===n||2===n)n=2;else if(10===n&&m&8)f=[0,0,Ac(65535),f],n=10;else return-2;else if(f=ic(a),null!==f)if(0===n||10===n)n=10;else return-2;if(null!=f)return a=e(n,q,p,a,f,g),C[d>>2]=a,0;if(m&4)return-2;a=oc(a);f=hc(a);0===n?n=2:10===n&&(f=[0,0,Ac(65535),f]);a=e(n,q,p,null,f,g);C[d>>2]=a;return 0},o:function(a){var b=Date.now();C[a>>2]=b/1E3|0;C[a+4>>2]=b%1E3*1E3|0;return 0},D:function(a){zc(a)},f:function(a){0!==a&&x.fill(0,
a,a+16);return 0}};
(function(){function a(e){h.asm=e.exports;sa=h.asm.Z;Ba=e=sa.buffer;h.HEAP8=y=new Int8Array(e);h.HEAP16=Ca=new Int16Array(e);h.HEAP32=C=new Int32Array(e);h.HEAPU8=x=new Uint8Array(e);h.HEAPU16=Da=new Uint16Array(e);h.HEAPU32=new Uint32Array(e);h.HEAPF32=new Float32Array(e);h.HEAPF64=new Float64Array(e);Ea=h.asm.ba;Ga.unshift(h.asm._);Na("wasm-instantiate")}function b(e){a(e.instance)}function c(e){return Ta().then(function(f){return WebAssembly.instantiate(f,d)}).then(function(f){return f}).then(e,function(f){qa("failed to asynchronously prepare wasm: "+
f);t(f)})}var d={a:Bc};Ma("wasm-instantiate");if(h.instantiateWasm)try{return h.instantiateWasm(d,a)}catch(e){return qa("Module.instantiateWasm callback failed with error: "+e),!1}(function(){return ra||"function"!==typeof WebAssembly.instantiateStreaming||Qa()||D.startsWith("file://")||"function"!==typeof fetch?c(b):fetch(D,{credentials:"same-origin"}).then(function(e){return WebAssembly.instantiateStreaming(e,d).then(b,function(f){qa("wasm streaming compile failed: "+f);qa("falling back to ArrayBuffer instantiation");
return c(b)})})})();return{}})();h.___wasm_call_ctors=function(){return(h.___wasm_call_ctors=h.asm._).apply(null,arguments)};h._setup=function(){return(h._setup=h.asm.$).apply(null,arguments)};h._process=function(){return(h._process=h.asm.aa).apply(null,arguments)};h._free=function(){return(h._free=h.asm.ca).apply(null,arguments)};
var yc=h.___errno_location=function(){return(yc=h.___errno_location=h.asm.da).apply(null,arguments)},rc=h._ntohs=function(){return(rc=h._ntohs=h.asm.ea).apply(null,arguments)},jc=h._htons=function(){return(jc=h._htons=h.asm.fa).apply(null,arguments)},za=h._malloc=function(){return(za=h._malloc=h.asm.ga).apply(null,arguments)},Ac=h._htonl=function(){return(Ac=h._htonl=h.asm.ha).apply(null,arguments)},Ya=h.__get_tzname=function(){return(Ya=h.__get_tzname=h.asm.ia).apply(null,arguments)},Xa=h.__get_daylight=
function(){return(Xa=h.__get_daylight=h.asm.ja).apply(null,arguments)},Wa=h.__get_timezone=function(){return(Wa=h.__get_timezone=h.asm.ka).apply(null,arguments)};h.addRunDependency=Ma;h.removeRunDependency=Na;h.FS_createPath=Xb;h.FS_createDataFile=Zb;h.FS_createPreloadedFile=bc;h.FS_createLazyFile=ac;h.FS_createDevice=U;h.FS_unlink=Mb;var Cc;function na(a){this.name="ExitStatus";this.message="Program terminated with exit("+a+")";this.status=a}La=function Dc(){Cc||Ec();Cc||(La=Dc)};
function Ec(){function a(){if(!Cc&&(Cc=!0,h.calledRun=!0,!ta)){h.noFSInit||Vb||(Vb=!0,Ub(),h.stdin=h.stdin,h.stdout=h.stdout,h.stderr=h.stderr,h.stdin?U("/dev","stdin",h.stdin):Lb("/dev/tty","/dev/stdin"),h.stdout?U("/dev","stdout",null,h.stdout):Lb("/dev/tty","/dev/stdout"),h.stderr?U("/dev","stderr",null,h.stderr):Lb("/dev/tty1","/dev/stderr"),T("/dev/stdin",0),T("/dev/stdout",1),T("/dev/stderr",1));tb=!1;X.root=Ib(X,null);Y.root=Ib(Y,null);Ua(Ga);if(h.onRuntimeInitialized)h.onRuntimeInitialized();
if(h.postRun)for("function"==typeof h.postRun&&(h.postRun=[h.postRun]);h.postRun.length;){var b=h.postRun.shift();Ha.unshift(b)}Ua(Ha)}}if(!(0<Ja)){if(h.preRun)for("function"==typeof h.preRun&&(h.preRun=[h.preRun]);h.preRun.length;)Ia();Ua(Fa);0<Ja||(h.setStatus?(h.setStatus("Running..."),setTimeout(function(){setTimeout(function(){h.setStatus("")},1);a()},1)):a())}}h.run=Ec;function zc(a){if(!(noExitRuntime||0<oa)){if(h.onExit)h.onExit(a);ta=!0}da(a,new na(a))}
if(h.preInit)for("function"==typeof h.preInit&&(h.preInit=[h.preInit]);0<h.preInit.length;)h.preInit.pop()();Ec();
