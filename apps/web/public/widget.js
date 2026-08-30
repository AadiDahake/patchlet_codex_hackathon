(function(){"use strict";var Le,S,mt,re,bt,_t,vt,Je,Ce,me,yt,Xe,Ze,Qe,Ie={},Me=[],Tn=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Ne=Array.isArray;function Z(e,t){for(var n in t)e[n]=t[n];return e}function et(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function Ln(e,t,n){var r,i,o,a={};for(o in t)o=="key"?r=t[o]:o=="ref"?i=t[o]:a[o]=t[o];if(arguments.length>2&&(a.children=arguments.length>3?Le.call(arguments,2):n),typeof e=="function"&&e.defaultProps!=null)for(o in e.defaultProps)a[o]===void 0&&(a[o]=e.defaultProps[o]);return Oe(e,a,r,i,null)}function Oe(e,t,n,r,i){var o={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++mt,__i:-1,__u:0};return i==null&&S.vnode!=null&&S.vnode(o),o}function oe(e){return e.children}function Re(e,t){this.props=e,this.context=t}function ae(e,t){if(t==null)return e.__?ae(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type=="function"?ae(e):null}function Cn(e){if(e.__P&&e.__d){var t=e.__v,n=t.__e,r=[],i=[],o=Z({},t);o.__v=t.__v+1,S.vnode&&S.vnode(o),tt(e.__P,o,t,e.__n,e.__P.namespaceURI,32&t.__u?[n]:null,r,n??ae(t),!!(32&t.__u),i),o.__v=t.__v,o.__.__k[o.__i]=o,Lt(r,o,i),t.__e=t.__=null,o.__e!=n&&wt(o)}}function wt(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),wt(e)}function xt(e){(!e.__d&&(e.__d=!0)&&re.push(e)&&!Pe.__r++||bt!=S.debounceRendering)&&((bt=S.debounceRendering)||_t)(Pe)}function Pe(){try{for(var e,t=1;re.length;)re.length>t&&re.sort(vt),e=re.shift(),t=re.length,Cn(e)}finally{re.length=Pe.__r=0}}function kt(e,t,n,r,i,o,a,u,d,l,h){var m,s,g,b,E,w,T=r&&r.__k||Me,v=t.length;for(d=In(n,t,T,d,v),m=0;m<v;m++)(g=n.__k[m])!=null&&(s=g.__i!=-1&&T[g.__i]||Ie,g.__i=m,w=tt(e,g,s,i,o,a,u,d,l,h),b=g.__e,g.ref&&s.ref!=g.ref&&(s.ref&&nt(s.ref,null,g),h.push(g.ref,g.__c||b,g)),E==null&&b!=null&&(E=b),4&g.__u?(d=St(g,d,e),s.__e&&(s.__e=null)):typeof g.type=="function"&&w!==void 0?d=w:b&&(d=b.nextSibling),g.__u&=-7);return n.__e=E,d}function In(e,t,n,r,i){var o,a,u,d,l,h=n.length,m=h,s=0;for(e.__k=new Array(i),o=0;o<i;o++)(a=t[o])!=null&&typeof a!="boolean"&&typeof a!="function"?(typeof a=="string"||typeof a=="number"||typeof a=="bigint"||a.constructor==String?a=e.__k[o]=Oe(null,a,null,null,null):Ne(a)?a=e.__k[o]=Oe(oe,{children:a},null,null,null):a.constructor===void 0&&a.__b>0?a=e.__k[o]=Oe(a.type,a.props,a.key,a.ref?a.ref:null,a.__v):e.__k[o]=a,d=o+s,a.__=e,a.__b=e.__b+1,u=null,(l=a.__i=Mn(a,n,d,m))!=-1&&(m--,(u=n[l])&&(u.__u|=2)),u==null||u.__v==null?(l==-1&&(i>h?s--:i<h&&s++),typeof a.type!="function"&&(a.__u|=4)):l!=d&&(l==d-1?s--:l==d+1?s++:(l>d?s--:s++,a.__u|=4))):e.__k[o]=null;if(m)for(o=0;o<h;o++)(u=n[o])!=null&&(2&u.__u)==0&&(u.__e==r&&(r=ae(u)),It(u,u));return r}function St(e,t,n){var r,i;if(typeof e.type=="function"){for(r=e.__k,i=0;r&&i<r.length;i++)r[i]&&(r[i].__=e,t=St(r[i],t,n));return t}e.__e!=t&&(t&&e.type&&!t.parentNode&&(t=ae(e)),t=n.insertBefore(e.__e,t||null));do t=t&&t.nextSibling;while(t!=null&&t.nodeType==8);return t}function Mn(e,t,n,r){var i,o,a,u=e.key,d=e.type,l=t[n],h=l!=null&&(2&l.__u)==0;if(l===null&&u==null||h&&u==l.key&&d==l.type)return n;if(r>(h?1:0)){for(i=n-1,o=n+1;i>=0||o<t.length;)if((l=t[a=i>=0?i--:o++])!=null&&(2&l.__u)==0&&u==l.key&&d==l.type)return a}return-1}function Et(e,t,n){t[0]=="-"?e.setProperty(t,n??""):e[t]=n==null?"":typeof n!="number"||Tn.test(t)?n:n+"px"}function De(e,t,n,r,i){var o,a;e:if(t=="style")if(typeof n=="string")e.style.cssText=n;else{if(typeof r=="string"&&(e.style.cssText=r=""),r)for(t in r)n&&t in n||Et(e.style,t,"");if(n)for(t in n)r&&n[t]==r[t]||Et(e.style,t,n[t])}else if(t[0]=="o"&&t[1]=="n")o=t!=(t=t.replace(yt,"$1")),a=t.toLowerCase(),t=a in e||t=="onFocusOut"||t=="onFocusIn"?a.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+o]=n,n?r?n[me]=r[me]:(n[me]=Xe,e.addEventListener(t,o?Qe:Ze,o)):e.removeEventListener(t,o?Qe:Ze,o);else{if(i=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=n??"";break e}catch{}typeof n=="function"||(n==null||n===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&n==1?"":n))}}function At(e){return function(t){if(this.l){var n=this.l[t.type+e];if(t[Ce]==null)t[Ce]=Xe++;else if(t[Ce]<n[me])return;return n(S.event?S.event(t):t)}}}function tt(e,t,n,r,i,o,a,u,d,l){var h,m,s,g,b,E,w,T,v,p,x,y,R,U,H,V,I=t.type;if(t.constructor!==void 0)return null;128&n.__u&&(d=!!(32&n.__u),o=[u=t.__e=n.__e]),(h=S.__b)&&h(t);e:if(typeof I=="function"){m=a.length;try{if(v=t.props,p=I.prototype&&I.prototype.render,x=(h=I.contextType)&&r[h.__c],y=h?x?x.props.value:h.__:r,n.__c?T=(s=t.__c=n.__c).__=s.__E:(p?t.__c=s=new I(v,y):(t.__c=s=new Re(v,y),s.constructor=I,s.render=On),x&&x.sub(s),s.state||(s.state={}),s.__n=r,g=s.__d=!0,s.__h=[],s._sb=[]),p&&s.__s==null&&(s.__s=s.state),p&&I.getDerivedStateFromProps!=null&&(s.__s==s.state&&(s.__s=Z({},s.__s)),Z(s.__s,I.getDerivedStateFromProps(v,s.__s))),b=s.props,E=s.state,s.__v=t,g)p&&I.getDerivedStateFromProps==null&&s.componentWillMount!=null&&s.componentWillMount(),p&&s.componentDidMount!=null&&s.__h.push(s.componentDidMount);else{if(p&&I.getDerivedStateFromProps==null&&v!==b&&s.componentWillReceiveProps!=null&&s.componentWillReceiveProps(v,y),t.__v==n.__v||!s.__e&&s.shouldComponentUpdate!=null&&s.shouldComponentUpdate(v,s.__s,y)===!1){t.__v!=n.__v&&(s.props=v,s.state=s.__s,s.__d=!1),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(N){N&&(N.__=t)}),Me.push.apply(s.__h,s._sb),s._sb=[],s.__h.length&&a.push(s),u=ae(n);break e}s.componentWillUpdate!=null&&s.componentWillUpdate(v,s.__s,y),p&&s.componentDidUpdate!=null&&s.__h.push(function(){s.componentDidUpdate(b,E,w)})}if(s.context=y,s.props=v,s.__P=e,s.__e=!1,R=S.__r,U=0,p)s.state=s.__s,s.__d=!1,R&&R(t),h=s.render(s.props,s.state,s.context),Me.push.apply(s.__h,s._sb),s._sb=[];else do s.__d=!1,R&&R(t),h=s.render(s.props,s.state,s.context),s.state=s.__s;while(s.__d&&++U<25);s.state=s.__s,s.getChildContext!=null&&(r=Z(Z({},r),s.getChildContext())),p&&!g&&s.getSnapshotBeforeUpdate!=null&&(w=s.getSnapshotBeforeUpdate(b,E)),H=h!=null&&h.type===oe&&h.key==null?Ct(h.props.children):h,u=kt(e,Ne(H)?H:[H],t,n,r,i,o,a,u,d,l),s.base=t.__e,t.__u&=-161,s.__h.length&&a.push(s),T&&(s.__E=s.__=null)}catch(N){if(a.length=m,t.__v=null,d||o!=null){if(N.then){for(t.__u|=d?160:128;u&&u.nodeType==8&&u.nextSibling;)u=u.nextSibling;o!=null&&(o[o.indexOf(u)]=null),t.__e=u}else if(o!=null)for(V=o.length;V--;)et(o[V])}else t.__e=n.__e;t.__k==null&&(t.__k=n.__k||[]),N.then||Tt(t),S.__e(N,t,n)}}else o==null&&t.__v==n.__v?(t.__k=n.__k,t.__e=n.__e):u=t.__e=Nn(n.__e,t,n,r,i,o,a,d,l);return(h=S.diffed)&&h(t),128&t.__u?void 0:u}function Tt(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(Tt))}function Lt(e,t,n){for(var r=0;r<n.length;r++)nt(n[r],n[++r],n[++r]);S.__c&&S.__c(t,e),e.some(function(i){try{e=i.__h,i.__h=[],e.some(function(o){o.call(i)})}catch(o){S.__e(o,i.__v)}})}function Ct(e){return typeof e!="object"||e==null||e.__b>0?e:Ne(e)?e.map(Ct):e.constructor!==void 0?null:Z({},e)}function Nn(e,t,n,r,i,o,a,u,d){var l,h,m,s,g,b,E,w=n.props||Ie,T=t.props,v=t.type;if(v=="svg"?i="http://www.w3.org/2000/svg":v=="math"?i="http://www.w3.org/1998/Math/MathML":i||(i="http://www.w3.org/1999/xhtml"),o!=null){for(l=0;l<o.length;l++)if((g=o[l])&&"setAttribute"in g==!!v&&(v?g.localName==v:g.nodeType==3)){e=g,o[l]=null;break}}if(e==null){if(v==null)return document.createTextNode(T);e=document.createElementNS(i,v,T.is&&T),u&&(S.__m&&S.__m(t,o),u=!1),o=null}if(v==null)w===T||u&&e.data==T||(e.data=T);else{if(o=v=="textarea"&&T.defaultValue!=null?null:o&&Le.call(e.childNodes),!u&&o!=null)for(w={},l=0;l<e.attributes.length;l++)w[(g=e.attributes[l]).name]=g.value;for(l in w)g=w[l],l=="dangerouslySetInnerHTML"?m=g:l=="children"||l in T||l=="value"&&"defaultValue"in T||l=="checked"&&"defaultChecked"in T||De(e,l,null,g,i);for(l in T)g=T[l],l=="children"?s=g:l=="dangerouslySetInnerHTML"?h=g:l=="value"?b=g:l=="checked"?E=g:u&&typeof g!="function"||w[l]===g||De(e,l,g,w[l],i);if(h)u||m&&(h.__html==m.__html||h.__html==e.innerHTML)||(e.innerHTML=h.__html),t.__k=[];else if(m&&(e.innerHTML=""),kt(t.type=="template"?e.content:e,Ne(s)?s:[s],t,n,r,v=="foreignObject"?"http://www.w3.org/1999/xhtml":i,o,a,o?o[0]:n.__k&&ae(n,0),u,d),o!=null)for(l=o.length;l--;)et(o[l]);u&&v!="textarea"||(l="value",v=="progress"&&b==null?e.removeAttribute("value"):b!=null&&(b!==e[l]||v=="progress"&&!b||v=="option"&&b!=w[l])&&De(e,l,b,w[l],i),l="checked",E!=null&&E!=e[l]&&De(e,l,E,w[l],i))}return e}function nt(e,t,n){try{if(typeof e=="function"){var r=typeof e.__u=="function";r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(i){S.__e(i,n)}}function It(e,t,n){var r,i;if(S.unmount&&S.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||nt(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(o){S.__e(o,t)}r.base=r.__P=r.__n=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&It(r[i],t,n||typeof e.type!="function");n||et(e.__e),e.__c=e.__=e.__e=void 0}function On(e,t,n){return this.constructor(e,n)}function Rn(e,t,n){var r,i,o,a;t==document&&(t=document.documentElement),S.__&&S.__(e,t),i=(r=!1)?null:t.__k,o=[],a=[],tt(t,e=t.__k=Ln(oe,null,[e]),i||Ie,Ie,t.namespaceURI,i?null:t.firstChild?Le.call(t.childNodes):null,o,i?i.__e:t.firstChild,r,a),Lt(o,e,a),e.props.children=null}Le=Me.slice,S={__e:function(e,t,n,r){for(var i,o,a;t=t.__;)if((i=t.__c)&&!i.__)try{if((o=i.constructor)&&o.getDerivedStateFromError!=null&&(i.setState(o.getDerivedStateFromError(e)),a=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),a=i.__d),a)return i.__E=i}catch(u){e=u}throw e}},mt=0,Re.prototype.setState=function(e,t){var n;n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=Z({},this.state),typeof e=="function"&&(e=e(Z({},n),this.props)),e&&Z(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),xt(this))},Re.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),xt(this))},Re.prototype.render=oe,re=[],_t=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,vt=function(e,t){return e.__v.__b-t.__v.__b},Pe.__r=0,Je=Math.random().toString(8),Ce="__d"+Je,me="__a"+Je,yt=/(PointerCapture)$|Capture$/i,Xe=0,Ze=At(!1),Qe=At(!0);var Pn=0;function c(e,t,n,r,i,o){t||(t={});var a,u,d=t;if("ref"in d)for(u in d={},t)u=="ref"?a=t[u]:d[u]=t[u];var l={type:e,props:d,key:n,ref:a,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Pn,__i:-1,__u:0,__source:i,__self:o};if(typeof e=="function"&&(a=e.defaultProps))for(u in a)d[u]===void 0&&(d[u]=a[u]);return S.vnode&&S.vnode(l),l}var ce,L,rt,Mt,be=0,Nt=[],C=S,Ot=C.__b,Rt=C.__r,Pt=C.diffed,Dt=C.__c,Ht=C.unmount,$t=C.__;function He(e,t){C.__h&&C.__h(L,e,be||t),be=0;var n=L.__H||(L.__H={__:[],__h:[]});return e>=n.__.length&&n.__.push({}),n.__[e]}function M(e){return be=1,Ut(Gt,e)}function Ut(e,t,n){var r=He(ce++,2);if(r.t=e,!r.__c&&(r.__=[Gt(void 0,t),function(u){var d=r.__N?r.__N[0]:r.__[0],l=r.t(d,u);d!==l&&(r.__N=[l,r.__[1]],r.__c.setState({}))}],r.__c=L,!L.__f)){var i=function(u,d,l){if(!r.__c.__H)return!0;var h=!1,m=r.__c.props!==u;if(r.__c.__H.__.some(function(g){if(g.__N){h=!0;var b=g.__[0];g.__=g.__N,g.__N=void 0,b!==g.__[0]&&(m=!0)}}),o){var s=o.call(this,u,d,l);return h?s||m:s}return!h||m};L.__f=!0;var o=L.shouldComponentUpdate,a=L.componentWillUpdate;L.componentWillUpdate=function(u,d,l){if(this.__e){var h=o;o=void 0,i(u,d,l),o=h}a&&a.call(this,u,d,l)},L.shouldComponentUpdate=i}return r.__N||r.__}function q(e,t){var n=He(ce++,3);!C.__s&&ot(n.__H,t)&&(n.__=e,n.u=t,L.__H.__h.push(n))}function Dn(e,t){var n=He(ce++,4);!C.__s&&ot(n.__H,t)&&(n.__=e,n.u=t,L.__h.push(n))}function O(e){return be=5,$e(function(){return{current:e}},[])}function $e(e,t){var n=He(ce++,7);return ot(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function $(e,t){return be=8,$e(function(){return e},t)}function Hn(){for(var e;e=Nt.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(Ue),t.__h.some(it),t.__h=[]}catch(n){t.__h=[],C.__e(n,e.__v)}}}C.__b=function(e){L=null,Ot&&Ot(e)},C.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),$t&&$t(e,t)},C.__r=function(e){Rt&&Rt(e),ce=0;var t=(L=e.__c).__H;t&&(rt===L?(t.__h=[],L.__h=[],t.__.some(function(n){n.__N&&(n.__=n.__N),n.u=n.__N=void 0})):(t.__h.some(Ue),t.__h.some(it),t.__h=[],ce=0)),rt=L},C.diffed=function(e){Pt&&Pt(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(Nt.push(t)!==1&&Mt===C.requestAnimationFrame||((Mt=C.requestAnimationFrame)||$n)(Hn)),t.__H.__.some(function(n){n.u&&(n.__H=n.u,n.u=void 0)})),rt=L=null},C.__c=function(e,t){t.some(function(n){try{n.__h.some(Ue),n.__h=n.__h.filter(function(r){return!r.__||it(r)})}catch(r){t.some(function(i){i.__h&&(i.__h=[])}),t=[],C.__e(r,n.__v)}}),Dt&&Dt(e,t)},C.unmount=function(e){Ht&&Ht(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.some(function(r){try{Ue(r)}catch(i){t=i}}),n.__H=void 0,t&&C.__e(t,n.__v))};var qt=typeof requestAnimationFrame=="function";function $n(e){var t,n=function(){clearTimeout(r),qt&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);qt&&(t=requestAnimationFrame(n))}function Ue(e){var t=L,n=e.__c;typeof n=="function"&&(e.__c=void 0,n()),L=t}function it(e){var t=L;e.__c=e.__(),L=t}function ot(e,t){return!e||e.length!==t.length||t.some(function(n,r){return n!==e[r]})}function Gt(e,t){return typeof t=="function"?t(e):t}function Un(e=document){const t=e.documentElement?.getBoundingClientRect();return!!(t&&t.width+t.height>0)}function ue(e){if(!e||!e.isConnected)return!1;const t=e.ownerDocument;if(!t||!Un(t))return!0;const n=e.getBoundingClientRect();if(n.width<=0||n.height<=0)return!1;const r=t.defaultView,i=r?.innerWidth??0,o=r?.innerHeight??0;return n.bottom>-o&&n.right>-i&&n.top<o*2&&n.left<i*2}let Vt=!1;const at=new Set;function qn(){if(!(Vt||typeof history>"u")){Vt=!0;for(const e of["pushState","replaceState"]){const t=history[e];history[e]=function(...r){const i=t.apply(this,r);for(const o of at)o();return i}}}}function Gn(e){qn();let t=location.href;const n=()=>{location.href!==t&&(t=location.href,e())};return at.add(n),addEventListener("popstate",n),addEventListener("hashchange",n),()=>{at.delete(n),removeEventListener("popstate",n),removeEventListener("hashchange",n)}}function Vn(e,t=300,n=document.body){if(typeof MutationObserver>"u")return()=>{};let r;const i=new MutationObserver(()=>{r&&clearTimeout(r),r=setTimeout(e,t)});return i.observe(n,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style","hidden","aria-hidden"]}),()=>{r&&clearTimeout(r),i.disconnect()}}function Fn(e=300,t=1500,n=document.body){return new Promise(r=>{let i=!1,o,a;const u=typeof MutationObserver>"u"||!n?null:new MutationObserver(()=>l()),d=()=>{i||(i=!0,o&&clearTimeout(o),a&&clearTimeout(a),u?.disconnect(),r())},l=()=>{o&&clearTimeout(o),o=setTimeout(d,e)};u&&n&&(u.observe(n,{childList:!0,subtree:!0,attributes:!0}),a=setTimeout(d,t)),l()})}function jn(e,t=300){const n=Gn(()=>setTimeout(e,t)),r=Vn(e,t);return()=>{n(),r()}}const st=1500,Bn=3,Wn=[0,120,400,900,st];class zn{constructor(t){this.deps=t,this.state="DONE",this.steps=[],this.index=0,this.lookup=new Map,this.affordances=new Map,this.target=null,this.message=null,this.unwatch=null,this.replanning=!1,this.recoveries=0,this.pressed=null,this.vanishTimers=[],this.onUserEvent=n=>{if(this.state!=="SPOTLIGHTING"||!this.target)return;const r=this.steps[this.index];if(r&&Kn(n,this.target)){if(n.type==="pointerdown"){if(r.advanceOn!=="click"&&r.advanceOn!=="navigation")return;this.arm(this.target);return}if(Yn(r.advanceOn,n.type)){if(n.type==="keydown"){const i=n.key;if(i!=="Enter"&&i!==" "&&i!=="Spacebar")return}this.enterVerifying()}}},this.onPageChanged=()=>{if(this.state==="DONE"||this.state==="FAILED"||this.replanning)return;const n=this.steps[this.index];if(n){if(this.pressed){this.checkPressedVanished();return}if(n.advanceOn==="navigation"&&this.state==="SPOTLIGHTING"){this.enterVerifying();return}ue(this.target)||this.recover()}},this.doc=t.doc??document,this.settleMs=t.settleMs??300}get snapshot(){return{state:this.state,stepIndex:this.index,total:this.steps.length,step:this.steps[this.index]??null,target:this.target,message:this.message}}start(t,n){this.stopListening(),this.steps=n,this.index=0,this.message=null,this.adoptScan(t);for(const r of["pointerdown","click","keydown","input","change"])this.doc.addEventListener(r,this.onUserEvent,!0);this.deps.watch&&(this.unwatch=this.deps.watch(this.onPageChanged)),this.enterSpotlight()}next(){this.state!=="SPOTLIGHTING"&&this.state!=="VERIFYING"||this.enterSnapshot()}lost(){this.state==="SPOTLIGHTING"&&this.recover()}stop(){this.stopListening(),this.target=null,this.transition("DONE")}dispose(){this.stopListening()}stopListening(){this.clearVanishChecks(),this.pressed=null;for(const t of["pointerdown","click","keydown","input","change"])this.doc.removeEventListener(t,this.onUserEvent,!0);this.unwatch?.(),this.unwatch=null}adoptScan(t){this.lookup=t.lookup,this.affordances=new Map(t.page.affordances.map(n=>[n.id,n]))}transition(t){this.state=t,this.deps.onChange(this.snapshot)}enterSpotlight(){const t=this.steps[this.index];if(!t){this.stopListening(),this.target=null,this.transition("DONE");return}const n=this.lookup.get(t.target)??null;if(!ue(n)){this.target=null,this.recover();return}this.target=n,this.message=null,this.transition("SPOTLIGHTING")}arm(t){this.clearVanishChecks(),this.pressed={element:t,at:Date.now(),index:this.index};for(const n of Wn)this.vanishTimers.push(setTimeout(()=>this.checkPressedVanished(),n))}clearVanishChecks(){for(const t of this.vanishTimers)clearTimeout(t);this.vanishTimers=[]}checkPressedVanished(){const t=this.pressed;if(!(!t||this.state!=="SPOTLIGHTING"||t.index!==this.index)){if(Date.now()-t.at>st){this.clearVanishChecks(),this.pressed=null;return}ue(t.element)||(this.clearVanishChecks(),this.pressed=null,this.enterVerifying())}}enterVerifying(){this.clearVanishChecks(),this.pressed=null,this.transition("VERIFYING"),this.settle().then(()=>{this.state==="VERIFYING"&&this.enterSnapshot()})}settle(){return this.deps.settle?this.deps.settle():Fn(this.settleMs,st,this.doc.body)}async enterSnapshot(){if(this.clearVanishChecks(),this.pressed=null,this.transition("SNAPSHOTTING"),this.index+=1,this.recoveries=0,this.index>=this.steps.length){await this.continueOrFinish();return}const t=this.steps[this.index],n=this.affordances.get(t.target),r=this.deps.rescan(),i=n?Ft(r,n):null;if(this.adoptScan(r),n&&!i){await this.recover();return}i&&i!==t.target&&(this.steps=this.steps.map((o,a)=>a===this.index?{...o,target:i}:o)),this.enterSpotlight()}async continueOrFinish(){if(!this.replanning){this.replanning=!0,this.target=null,this.transition("SNAPSHOTTING");try{const t=await this.deps.replan(this.index);if(t&&t.steps.length>0){this.steps=[...this.steps.slice(0,this.index),...t.steps],this.adoptScan(t),this.replanning=!1,this.enterSpotlight();return}}catch{}this.replanning=!1,this.stopListening(),this.target=null,this.transition("DONE")}}async recover(){if(!this.replanning){if(this.recoveries>=Bn){this.message="That control is no longer on the page.",this.stopListening(),this.target=null,this.transition("FAILED");return}this.recoveries+=1,this.replanning=!0,this.target=null,this.transition("SNAPSHOTTING");try{const t=this.steps[this.index],n=t?this.affordances.get(t.target):void 0,r=this.deps.rescan(),i=n?Ft(r,n):null;if(i){this.adoptScan(r),this.steps=this.steps.map((a,u)=>u===this.index?{...a,target:i}:a),this.replanning=!1,this.enterSpotlight();return}const o=await this.deps.replan(this.index);if(!o||o.steps.length===0){this.message="That control is no longer on the page.",this.stopListening(),this.transition("FAILED");return}this.steps=[...this.steps.slice(0,this.index),...o.steps],this.adoptScan(o),this.replanning=!1,this.enterSpotlight()}catch{this.message="Guidance stopped because the page changed.",this.stopListening(),this.transition("FAILED")}finally{this.replanning=!1}}}}function Kn(e,t){return(typeof e.composedPath=="function"?e.composedPath():[]).includes(t)?!0:e.target instanceof Node&&t.contains(e.target)}function Yn(e,t){switch(e){case"click":return t==="click"||t==="keydown";case"input":return t==="input"||t==="change";case"navigation":return t==="click"||t==="keydown";case"manual":return!1}}function Ft(e,t){const n=t.name.trim().toLowerCase();if(!n)return null;for(const r of e.page.affordances)if(r.role===t.role&&r.name.trim().toLowerCase()===n&&ue(e.lookup.get(r.id)))return r.id;return null}const qe=8,Jn=12,Xn=260,jt=14;class Zn{constructor(t,n){this.host=t,this.handlers=n,this.view=null,this.frame=0,this.open=!1,this.schedule=()=>{this.frame||(this.frame=requestAnimationFrame(()=>{this.frame=0,this.reposition()}))};const{root:r,hole:i,ring:o,bubble:a,counter:u,text:d,advance:l,stop:h}=Qn();this.root=r,this.hole=i,this.ring=o,this.bubble=a,this.counter=u,this.text=d,this.advance=l,this.stop=h,this.advance.addEventListener("click",()=>{this.view&&(this.view.isLast?this.handlers.onDone():this.handlers.onNext())}),this.stop.addEventListener("click",()=>this.handlers.onStop()),this.host.appendChild(this.root)}show(t){if(!ue(t.target)){this.hide(),this.handlers.onLost?.();return}const n=t.target.getBoundingClientRect();(n.top<8||n.left<8||n.bottom>window.innerHeight-8||n.right>window.innerWidth-8)&&t.target.scrollIntoView({block:"center",inline:"center",behavior:"auto"}),this.view=t,this.counter.textContent=`Step ${t.index+1} of ${t.total}`,this.text.textContent=t.caption,this.advance.textContent=t.isLast?"Done":"Next",this.advance.hidden=!0,this.root.classList.toggle("pl-spot--busy",!!t.busy),this.open||(this.open=!0,er(this.root),addEventListener("scroll",this.schedule,!0),addEventListener("resize",this.schedule)),this.reposition()}hide(){this.view=null,this.open&&(this.open=!1,tr(this.root),removeEventListener("scroll",this.schedule,!0),removeEventListener("resize",this.schedule),this.frame&&cancelAnimationFrame(this.frame),this.frame=0)}destroy(){this.hide(),this.root.remove()}reposition(){if(!this.view)return;if(!ue(this.view.target)){this.hide(),this.handlers.onLost?.();return}const t=this.view.target.getBoundingClientRect(),n=innerWidth,r=innerHeight,i=Math.max(t.left-qe,4),o=Math.max(t.top-qe,4),a=Math.max(t.width+qe*2,12),u=Math.max(t.height+qe*2,12);for(const g of[this.hole,this.ring])g.setAttribute("x",String(i)),g.setAttribute("y",String(o)),g.setAttribute("width",String(Math.min(a,n-i-4))),g.setAttribute("height",String(Math.min(u,r-o-4))),g.setAttribute("rx",String(Jn));const d=o+u+jt,l=this.bubble.offsetHeight||120,h=d+l<r,m=h?d:Math.max(o-jt-l,8),s=Math.min(Math.max(i,8),Math.max(n-Xn-8,8));this.bubble.dataset.side=h?"below":"above",this.bubble.style.transform=`translate(${Math.round(s)}px, ${Math.round(m)}px)`}}function Qn(){const e=document.createElement("div");e.className="pl-spot",e.setAttribute("popover","manual");const t=document.createElementNS("http://www.w3.org/2000/svg","svg");t.setAttribute("class","pl-spot__svg"),t.setAttribute("aria-hidden","true");const n=document.createElementNS("http://www.w3.org/2000/svg","defs"),r=document.createElementNS("http://www.w3.org/2000/svg","mask");r.setAttribute("id","pl-spot-mask");const i=document.createElementNS("http://www.w3.org/2000/svg","rect");i.setAttribute("width","100%"),i.setAttribute("height","100%"),i.setAttribute("fill","white");const o=document.createElementNS("http://www.w3.org/2000/svg","rect");o.setAttribute("fill","black"),r.append(i,o),n.append(r);const a=document.createElementNS("http://www.w3.org/2000/svg","rect");a.setAttribute("class","pl-spot__scrim"),a.setAttribute("width","100%"),a.setAttribute("height","100%"),a.setAttribute("mask","url(#pl-spot-mask)");const u=document.createElementNS("http://www.w3.org/2000/svg","rect");u.setAttribute("class","pl-spot__ring"),t.append(n,a,u);const d=document.createElement("div");d.className="pl-spot__bubble";const l=document.createElement("span");l.className="pl-spot__counter";const h=document.createElement("p");h.className="pl-spot__caption";const m=document.createElement("div");m.className="pl-spot__actions";const s=document.createElement("button");s.type="button",s.className="pl-btn pl-btn--quiet",s.textContent="Skip";const g=document.createElement("button");return g.type="button",g.className="pl-btn pl-btn--accent",g.textContent="Next",g.hidden=!0,m.append(s,g),d.append(l,h,m),e.append(t,d),{root:e,hole:o,ring:u,bubble:d,counter:l,text:h,advance:g,stop:s}}function er(e){const t=e;if(typeof t.showPopover=="function")try{t.showPopover();return}catch{}e.classList.add("pl-spot--fallback")}function tr(e){const t=e;if(typeof t.hidePopover=="function")try{t.hidePopover()}catch{}e.classList.remove("pl-spot--fallback")}var nr=Object.prototype.toString;function rr(e){return typeof e=="function"||nr.call(e)==="[object Function]"}function ir(e){var t=Number(e);return isNaN(t)?0:t===0||!isFinite(t)?t:(t>0?1:-1)*Math.floor(Math.abs(t))}var or=Math.pow(2,53)-1;function ar(e){var t=ir(e);return Math.min(Math.max(t,0),or)}function z(e,t){var n=Array,r=Object(e);if(e==null)throw new TypeError("Array.from requires an array-like object - not null or undefined");for(var i=ar(r.length),o=rr(n)?Object(new n(i)):new Array(i),a=0,u;a<i;)u=r[a],o[a]=u,a+=1;return o.length=i,o}function _e(e){"@babel/helpers - typeof";return _e=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},_e(e)}function sr(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function lr(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,Bt(r.key),r)}}function cr(e,t,n){return t&&lr(e.prototype,t),Object.defineProperty(e,"prototype",{writable:!1}),e}function ur(e,t,n){return t=Bt(t),t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Bt(e){var t=pr(e,"string");return _e(t)=="symbol"?t:t+""}function pr(e,t){if(_e(e)!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(_e(r)!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}var dr=(function(){function e(){var t=arguments.length>0&&arguments[0]!==void 0?arguments[0]:[];sr(this,e),ur(this,"items",void 0),this.items=t}return cr(e,[{key:"add",value:function(n){return this.has(n)===!1&&this.items.push(n),this}},{key:"clear",value:function(){this.items=[]}},{key:"delete",value:function(n){var r=this.items.length;return this.items=this.items.filter(function(i){return i!==n}),r!==this.items.length}},{key:"forEach",value:function(n){var r=this;this.items.forEach(function(i){n(i,i,r)})}},{key:"has",value:function(n){return this.items.indexOf(n)!==-1}},{key:"size",get:function(){return this.items.length}}])})();const hr=typeof Set>"u"?Set:dr;function D(e){var t;return(t=e.localName)!==null&&t!==void 0?t:e.tagName.toLowerCase()}var fr={article:"article",aside:"complementary",button:"button",datalist:"listbox",dd:"definition",details:"group",dialog:"dialog",dt:"term",fieldset:"group",figure:"figure",form:"form",footer:"contentinfo",h1:"heading",h2:"heading",h3:"heading",h4:"heading",h5:"heading",h6:"heading",header:"banner",hr:"separator",html:"document",legend:"legend",li:"listitem",math:"math",main:"main",menu:"list",nav:"navigation",ol:"list",optgroup:"group",option:"option",output:"status",progress:"progressbar",section:"region",summary:"button",table:"table",tbody:"rowgroup",textarea:"textbox",tfoot:"rowgroup",td:"cell",th:"columnheader",thead:"rowgroup",tr:"row",ul:"list"},gr={caption:new Set(["aria-label","aria-labelledby"]),code:new Set(["aria-label","aria-labelledby"]),deletion:new Set(["aria-label","aria-labelledby"]),emphasis:new Set(["aria-label","aria-labelledby"]),generic:new Set(["aria-label","aria-labelledby","aria-roledescription"]),insertion:new Set(["aria-label","aria-labelledby"]),none:new Set(["aria-label","aria-labelledby"]),paragraph:new Set(["aria-label","aria-labelledby"]),presentation:new Set(["aria-label","aria-labelledby"]),strong:new Set(["aria-label","aria-labelledby"]),subscript:new Set(["aria-label","aria-labelledby"]),superscript:new Set(["aria-label","aria-labelledby"])};function mr(e,t){return["aria-atomic","aria-busy","aria-controls","aria-current","aria-description","aria-describedby","aria-details","aria-dropeffect","aria-flowto","aria-grabbed","aria-hidden","aria-keyshortcuts","aria-label","aria-labelledby","aria-live","aria-owns","aria-relevant","aria-roledescription"].some(function(n){var r;return e.hasAttribute(n)&&!((r=gr[t])!==null&&r!==void 0&&r.has(n))})}function Wt(e,t){return mr(e,t)}function br(e){var t=vr(e);if(t===null||lt.indexOf(t)!==-1){var n=_r(e);if(lt.indexOf(t||"")===-1||Wt(e,n||""))return n}return t}function _r(e){var t=fr[D(e)];if(t!==void 0)return t;switch(D(e)){case"a":case"area":case"link":if(e.hasAttribute("href"))return"link";break;case"img":return e.getAttribute("alt")===""&&!Wt(e,"img")?"presentation":"img";case"input":{var n=e,r=n.type;switch(r){case"button":case"image":case"reset":case"submit":return"button";case"checkbox":case"radio":return r;case"range":return"slider";case"email":case"tel":case"text":case"url":return e.hasAttribute("list")?"combobox":"textbox";case"search":return e.hasAttribute("list")?"combobox":"searchbox";case"number":return"spinbutton";default:return null}}case"select":return e.hasAttribute("multiple")||e.size>1?"listbox":"combobox"}return null}function vr(e){var t=e.getAttribute("role");if(t!==null){var n=t.trim().split(" ")[0];if(n.length>0)return n}return null}var lt=["presentation","none"];function A(e){return e!==null&&e.nodeType===e.ELEMENT_NODE}function zt(e){return A(e)&&D(e)==="caption"}function Ge(e){return A(e)&&D(e)==="input"}function yr(e){return A(e)&&D(e)==="optgroup"}function wr(e){return A(e)&&D(e)==="select"}function xr(e){return A(e)&&D(e)==="table"}function kr(e){return A(e)&&D(e)==="textarea"}function Sr(e){var t=e.ownerDocument===null?e:e.ownerDocument,n=t.defaultView;if(n===null)throw new TypeError("no window available");return n}function Er(e){return A(e)&&D(e)==="fieldset"}function Ar(e){return A(e)&&D(e)==="legend"}function Tr(e){return A(e)&&D(e)==="slot"}function Lr(e){return A(e)&&e.ownerSVGElement!==void 0}function Cr(e){return A(e)&&D(e)==="svg"}function Ir(e){return Lr(e)&&D(e)==="title"}function ct(e,t){if(A(e)&&e.hasAttribute(t)){var n=e.getAttribute(t).split(" "),r=e.getRootNode?e.getRootNode():e.ownerDocument;return n.map(function(i){return r.getElementById(i)}).filter(function(i){return i!==null})}return[]}function Q(e,t){return A(e)?t.indexOf(br(e))!==-1:!1}function Mr(e){return e.trim().replace(/\s\s+/g," ")}function Nr(e,t){if(!A(e))return!1;if(e.hasAttribute("hidden")||e.getAttribute("aria-hidden")==="true")return!0;var n=t(e);return n.getPropertyValue("display")==="none"||n.getPropertyValue("visibility")==="hidden"}function Or(e){return Q(e,["button","combobox","listbox","textbox"])||Kt(e,"range")}function Kt(e,t){if(!A(e))return!1;switch(t){case"range":return Q(e,["meter","progressbar","scrollbar","slider","spinbutton"]);default:throw new TypeError("No knowledge about abstract role '".concat(t,"'. This is likely a bug :("))}}function Yt(e,t){var n=z(e.querySelectorAll(t));return ct(e,"aria-owns").forEach(function(r){n.push.apply(n,z(r.querySelectorAll(t)))}),n}function Rr(e){return wr(e)?e.selectedOptions||Yt(e,"[selected]"):Yt(e,'[aria-selected="true"]')}function Pr(e){return Q(e,lt)}function Dr(e){return zt(e)}function Hr(e){return Q(e,["button","cell","checkbox","columnheader","gridcell","heading","label","legend","link","menuitem","menuitemcheckbox","menuitemradio","option","radio","row","rowheader","switch","tab","tooltip","treeitem"])}function $r(e){return!1}function Ur(e){return Ge(e)||kr(e)?e.value:e.textContent||""}function Jt(e){var t=e.getPropertyValue("content");return/^["'].*["']$/.test(t)?t.slice(1,-1):""}function Xt(e){var t=D(e);return t==="button"||t==="input"&&e.getAttribute("type")!=="hidden"||t==="meter"||t==="output"||t==="progress"||t==="select"||t==="textarea"}function Zt(e){if(Xt(e))return e;var t=null;return e.childNodes.forEach(function(n){if(t===null&&A(n)){var r=Zt(n);r!==null&&(t=r)}}),t}function qr(e){if(e.control!==void 0)return e.control;var t=e.getAttribute("for");return t!==null?e.ownerDocument.getElementById(t):Zt(e)}function Gr(e){var t=e.labels;if(t===null)return t;if(t!==void 0)return z(t);if(!Xt(e))return null;var n=e.ownerDocument;return z(n.querySelectorAll("label")).filter(function(r){return qr(r)===e})}function Vr(e){var t=e.assignedNodes();return t.length===0?z(e.childNodes):t}function Fr(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},n=new hr,r=typeof Map>"u"?void 0:new Map,i=Sr(e),o=t.compute,a=o===void 0?"name":o,u=t.computedStyleSupportsPseudoElements,d=u===void 0?t.getComputedStyle!==void 0:u,l=t.getComputedStyle,h=l===void 0?i.getComputedStyle.bind(i):l,m=t.hidden,s=m===void 0?!1:m,g=function(x,y){if(y!==void 0)throw new Error("use uncachedGetComputedStyle directly for pseudo elements");if(r===void 0)return h(x);var R=r.get(x);if(R)return R;var U=h(x,y);return r.set(x,U),U};function b(p,x){var y="";if(A(p)&&d){var R=h(p,"::before"),U=Jt(R);y="".concat(U," ").concat(y)}var H=Tr(p)?Vr(p):z(p.childNodes).concat(ct(p,"aria-owns"));if(H.forEach(function(N){var J=v(N,{isEmbeddedInLabel:x.isEmbeddedInLabel,isReferenced:!1,recursion:!0}),G=A(N)?g(N).getPropertyValue("display"):"inline",ee=G!=="inline"?" ":"";y+="".concat(ee).concat(J).concat(ee)}),A(p)&&d){var V=h(p,"::after"),I=Jt(V);y="".concat(y," ").concat(I)}return y.trim()}function E(p,x){var y=p.getAttributeNode(x);return y!==null&&!n.has(y)&&y.value.trim()!==""?(n.add(y),y.value):null}function w(p){return A(p)?E(p,"title"):null}function T(p){if(!A(p))return null;if(Er(p)){n.add(p);for(var x=z(p.childNodes),y=0;y<x.length;y+=1){var R=x[y];if(Ar(R))return v(R,{isEmbeddedInLabel:!1,isReferenced:!1,recursion:!1})}}else if(xr(p)){n.add(p);for(var U=z(p.childNodes),H=0;H<U.length;H+=1){var V=U[H];if(zt(V))return v(V,{isEmbeddedInLabel:!1,isReferenced:!1,recursion:!1})}}else if(Cr(p)){n.add(p);for(var I=z(p.childNodes),N=0;N<I.length;N+=1){var J=I[N];if(Ir(J))return J.textContent}return null}else if(D(p)==="img"||D(p)==="area"){var G=E(p,"alt");if(G!==null)return G}else if(yr(p)){var ee=E(p,"label");if(ee!==null)return ee}if(Ge(p)&&(p.type==="button"||p.type==="submit"||p.type==="reset")){var we=E(p,"value");if(we!==null)return we;if(p.type==="submit")return"Submit";if(p.type==="reset")return"Reset"}var he=Gr(p);if(he!==null&&he.length!==0)return n.add(p),z(he).map(function(fe){return v(fe,{isEmbeddedInLabel:!0,isReferenced:!1,recursion:!0})}).filter(function(fe){return fe.length>0}).join(" ");if(Ge(p)&&p.type==="image"){var je=E(p,"alt");if(je!==null)return je;var xe=E(p,"title");return xe!==null?xe:"Submit Query"}if(Q(p,["button"])){var Be=b(p,{isEmbeddedInLabel:!1});if(Be!=="")return Be}return null}function v(p,x){if(n.has(p))return"";if(!s&&Nr(p,g)&&!x.isReferenced)return n.add(p),"";var y=A(p)?p.getAttributeNode("aria-labelledby"):null,R=y!==null&&!n.has(y)?ct(p,"aria-labelledby"):[];if(a==="name"&&!x.isReferenced&&R.length>0)return n.add(y),R.map(function(G){return v(G,{isEmbeddedInLabel:x.isEmbeddedInLabel,isReferenced:!0,recursion:!1})}).join(" ");var U=x.recursion&&Or(p)&&a==="name";if(!U){var H=(A(p)&&p.getAttribute("aria-label")||"").trim();if(H!==""&&a==="name")return n.add(p),H;if(!Pr(p)){var V=T(p);if(V!==null)return n.add(p),V}}if(Q(p,["menu"]))return n.add(p),"";if(U||x.isEmbeddedInLabel||x.isReferenced){if(Q(p,["combobox","listbox"])){n.add(p);var I=Rr(p);return I.length===0?Ge(p)?p.value:"":z(I).map(function(G){return v(G,{isEmbeddedInLabel:x.isEmbeddedInLabel,isReferenced:!1,recursion:!0})}).join(" ")}if(Kt(p,"range"))return n.add(p),p.hasAttribute("aria-valuetext")?p.getAttribute("aria-valuetext"):p.hasAttribute("aria-valuenow")?p.getAttribute("aria-valuenow"):p.getAttribute("value")||"";if(Q(p,["textbox"]))return n.add(p),Ur(p)}if(Hr(p)||A(p)&&x.isReferenced||Dr(p)||$r()){var N=b(p,{isEmbeddedInLabel:x.isEmbeddedInLabel});if(N!=="")return n.add(p),N}if(p.nodeType===p.TEXT_NODE)return n.add(p),p.textContent||"";if(x.recursion)return n.add(p),b(p,{isEmbeddedInLabel:x.isEmbeddedInLabel});var J=w(p);return J!==null?(n.add(p),J):(n.add(p),"")}return Mr(v(e,{isEmbeddedInLabel:!1,isReferenced:a==="description",recursion:!1}))}function jr(e){return Q(e,["caption","code","deletion","emphasis","generic","insertion","none","paragraph","presentation","strong","subscript","superscript"])}function Br(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};return jr(e)?"":Fr(e,t)}const Wr=new Set(["a","an","and","are","be","can","do","does","for","from","how","i","in","is","it","me","my","of","on","or","the","this","to","up","what","where","with","you","your"]),zr=new Set(["ok","go","close","open","menu","more","link","button","submit","click here","here","next","previous","back","toggle","dismiss","x"]),Kr={dialog:3,sidebar:2,header:2,navigation:2,main:1},Yr={theme:["dark","light","appearance","mode"],dark:["theme","appearance","night"],username:["name","handle","profile","account","display"],profile:["account","username","settings"],account:["profile","user","settings"],password:["security","credentials"],billing:["payment","invoice","plan"],key:["keys","token","api"]};function Qt(e){return e.toLowerCase().split(/[^a-z0-9]+/).filter(t=>t.length>1&&!Wr.has(t)).map(en)}function en(e){return e.length>4&&e.endsWith("ies")?`${e.slice(0,-3)}y`:e.length>3&&e.endsWith("es")&&!e.endsWith("ses")?e.slice(0,-2):e.length>3&&e.endsWith("s")&&!e.endsWith("ss")?e.slice(0,-1):e.length>5&&e.endsWith("ing")?e.slice(0,-3):e}function Jr(e){const t=new Set(Qt(e));for(const n of[...t])for(const r of Yr[n]??[])t.add(en(r));return t}function Xr(e,t){let n=e.visible?4:0;n+=Kr[e.landmark??""]??0,e.disabled&&(n-=2);const r=Qt([e.name,e.text??"",e.href??""].join(" "));r.length===0&&(n-=3);let i=0;for(const a of new Set(r))t.has(a)&&(i+=1);n+=i*6;const o=e.name.trim().toLowerCase();return o?zr.has(o)&&(n-=2):n-=4,n}function Zr(e,t,n){const r=Jr(t);return e.map((i,o)=>({candidate:i,index:o,score:Xr(i,r)})).sort((i,o)=>o.score-i.score||i.index-o.index).slice(0,n).sort((i,o)=>i.index-o.index).map(i=>i.candidate)}const Qr=["button","a[href]",'input:not([type="hidden"])',"select","textarea","summary",'[role="button"]','[role="link"]','[role="tab"]','[role="menuitem"]','[role="menuitemcheckbox"]','[role="checkbox"]','[role="radio"]','[role="switch"]','[role="combobox"]','[role="option"]','[tabindex]:not([tabindex="-1"])','[contenteditable=""]','[contenteditable="true"]'].join(","),ei=150;function ti(e={}){const t=e.root??document,n=e.question??"",r=e.limit??ei,i=[],o=new Set;ni(t.body??t.documentElement,i,o,e.exclude??null);const a=Zr(i,n,r),u=new Map,d=a.map((l,h)=>{const m=`a${h+1}`;u.set(m,l.element);const s={id:m,role:l.role,name:l.name,visible:l.visible};return l.text&&l.text!==l.name&&(s.text=l.text),l.landmark&&(s.landmark=l.landmark),l.href&&(s.href=l.href),l.disabled&&(s.disabled=!0),l.state&&(s.state=l.state),s});return{page:{url:t.defaultView?.location?.href??"",title:t.title??"",affordances:d},lookup:u}}function ni(e,t,n,r){if(!e)return;const i=[e];for(;i.length;){const o=i.shift();if(r&&(o===r||r.contains(o)))continue;o!==e&&!n.has(o)&&ri(o,Qr)&&(n.add(o),t.push(ii(o)));for(const u of Array.from(o.children))i.push(u);const a=o.shadowRoot;if(a&&a.mode==="open")for(const u of Array.from(a.children))i.push(u)}}function ri(e,t){try{return e.matches(t)}catch{return!1}}function ii(e){const t=si(e),n=(e.textContent??"").replace(/\s+/g," ").trim().slice(0,120),r=e instanceof HTMLAnchorElement?e.getAttribute("href")??void 0:void 0;return{element:e,role:ci(e),name:t,text:n||void 0,landmark:ui(e),href:r,visible:di(e),disabled:pi(e),state:oi(e)}}function oi(e){const t=[];return(e.getAttribute("aria-selected")==="true"||e.getAttribute("aria-current")==="page")&&t.push("selected"),e.getAttribute("aria-expanded")==="true"&&t.push("expanded"),(e.getAttribute("aria-checked")??(ai(e)?"true":null))==="true"&&t.push("checked"),t.length?t.join(", "):void 0}function ai(e){return e instanceof HTMLInputElement&&(e.type==="checkbox"||e.type==="radio")?e.checked:!1}function si(e){try{const n=Br(e).replace(/\s+/g," ").trim();if(n)return n}catch{}return(e.getAttribute("aria-label")??e.getAttribute("title")??e.getAttribute("placeholder")??e.getAttribute("value")??e.textContent??"").replace(/\s+/g," ").trim().slice(0,120)}const li={checkbox:"checkbox",radio:"radio",range:"slider",button:"button",submit:"button",reset:"button",search:"searchbox",email:"textbox",tel:"textbox",url:"textbox",number:"spinbutton",password:"textbox",text:"textbox"};function ci(e){const t=e.getAttribute("role");if(t)return t.trim().split(/\s+/)[0];switch(e.tagName.toLowerCase()){case"a":return e.hasAttribute("href")?"link":"generic";case"button":return"button";case"select":return"combobox";case"textarea":return"textbox";case"summary":return"button";case"input":{const r=(e.getAttribute("type")??"text").toLowerCase();return li[r]??"textbox"}default:return e.getAttribute("contenteditable")!==null?"textbox":"button"}}const tn={nav:"sidebar",header:"header",main:"main",aside:"sidebar",footer:"footer",dialog:"dialog",form:"form"},nn={navigation:"sidebar",banner:"header",main:"main",complementary:"sidebar",contentinfo:"footer",dialog:"dialog",alertdialog:"dialog",menu:"menu",form:"form",search:"search"};function ui(e){let t=e;for(;t&&t!==t.ownerDocument?.body;){const n=t.getAttribute("role");if(n&&nn[n])return nn[n];const r=t.tagName.toLowerCase();if(tn[r])return tn[r];const i=t.getAttribute("aria-label");if(i&&t.hasAttribute("data-region"))return i.toLowerCase();t=t.parentElement??t.getRootNode().host??null}}function pi(e){return e.getAttribute("aria-disabled")==="true"?!0:"disabled"in e&&!!e.disabled}function di(e){if(e.closest('[aria-hidden="true"],[hidden],[inert]'))return!1;const t=e.ownerDocument?.defaultView,n=t?.getComputedStyle(e);if(n&&(n.display==="none"||n.visibility==="hidden"||n.visibility==="collapse"||n.opacity==="0"))return!1;const r=e.getBoundingClientRect();if(!(typeof t?.innerWidth=="number"&&r.width+r.height>0))return hi(e);if(r.width===0||r.height===0)return!1;const o=t?.innerWidth??0,a=t?.innerHeight??0;return r.bottom<=0||r.right<=0||r.top>=a||r.left>=o?!1:fi(e,r,o,a)}function hi(e){let t=e;const n=e.ownerDocument?.defaultView;for(;t;){const r=n?.getComputedStyle(t);if(r&&(r.display==="none"||r.visibility==="hidden"))return!1;t=t.parentElement}return!0}function fi(e,t,n,r){const i=e.ownerDocument;if(!i||typeof i.elementFromPoint!="function")return!0;const o=Math.min(Math.max(t.left+t.width/2,1),n-1),a=Math.min(Math.max(t.top+t.height/2,1),r-1),u=gi(i,o,a);return u?u===e||e.contains(u)||u.contains(e):!1}function gi(e,t,n){let r=e.elementFromPoint(t,n);for(;r;){const i=r.shadowRoot;if(!i)return r;const o=i.elementFromPoint?.(t,n);if(!o||o===r)return r;r=o}return r}class mi{constructor(t,n=()=>{}){this.onStateChange=t,this.onFinished=n,this.audio=null,this.abort=null,this.objectUrl=null,this.token=0}get speaking(){return!!(this.audio&&!this.audio.paused&&!this.audio.ended)}async play(t){this.stop();const n=this.token+=1,r=()=>{n===this.token&&(this.token+=1,this.onFinished())},i=new AbortController;this.abort=i;try{const o=await t(i.signal);if(!o.body){r();return}const a=new Audio;this.audio=a,a.addEventListener("ended",()=>{this.onStateChange(!1),r()}),a.addEventListener("error",()=>r()),a.addEventListener("pause",()=>this.onStateChange(this.speaking)),bi()?await this.playStreaming(a,o.body,i.signal,r):await this.playBuffered(a,o,r),this.onStateChange(!0)}catch(o){o?.name!=="AbortError"&&(this.onStateChange(!1),r())}}stop(){this.token+=1,this.abort?.abort(),this.abort=null,this.audio&&(this.audio.pause(),this.audio.src="",this.audio=null),this.objectUrl&&(URL.revokeObjectURL(this.objectUrl),this.objectUrl=null),this.onStateChange(!1)}async playStreaming(t,n,r,i){const o=new MediaSource;this.objectUrl=URL.createObjectURL(o),t.src=this.objectUrl,await new Promise(l=>o.addEventListener("sourceopen",()=>l(),{once:!0}));const a=o.addSourceBuffer("audio/mpeg"),u=n.getReader();let d=!1;for(;;){const{done:l,value:h}=await u.read();if(l||r.aborted)break;await _i(a,h),d||(d=!0,t.play().catch(i))}o.readyState==="open"&&o.endOfStream(),d||t.play().catch(i)}async playBuffered(t,n,r){const i=await n.blob();this.objectUrl=URL.createObjectURL(i),t.src=this.objectUrl,await t.play().catch(r)}}function bi(){return typeof MediaSource<"u"&&typeof MediaSource.isTypeSupported=="function"&&MediaSource.isTypeSupported("audio/mpeg")}function _i(e,t){return new Promise((n,r)=>{const i=()=>{e.removeEventListener("updateend",i),n()};e.addEventListener("updateend",i),e.addEventListener("error",r,{once:!0});try{e.appendBuffer(t)}catch(o){r(o)}})}class pe{constructor(){this.recorder=null,this.chunks=[],this.stream=null,this.audio=null,this.silenceTimer=null}static get supported(){return typeof MediaRecorder<"u"&&typeof navigator<"u"&&!!navigator.mediaDevices?.getUserMedia}static async alreadyAllowed(){try{return(await navigator.permissions.query({name:"microphone"})).state==="granted"}catch{return!1}}get recording(){return this.recorder?.state==="recording"}async start(t){this.recording||(this.stream=await navigator.mediaDevices.getUserMedia({audio:!0}),this.chunks=[],this.recorder=new MediaRecorder(this.stream,vi()),this.recorder.addEventListener("dataavailable",n=>{n.data.size>0&&this.chunks.push(n.data)}),this.recorder.start(250),t&&this.watchForSilence(t))}watchForSilence(t){if(!this.stream)return;const n=window.AudioContext??window.webkitAudioContext;if(!n)return;this.audio=new n;const r=this.audio.createMediaStreamSource(this.stream),i=this.audio.createAnalyser();i.fftSize=1024,r.connect(i);const o=new Uint8Array(i.frequencyBinCount);let a=!1,u=0;const d=()=>{if(!this.recording)return;i.getByteTimeDomainData(o);let l=0;for(const s of o)l=Math.max(l,Math.abs(s-128));const h=l>6,m=Date.now();if(h)a=!0,u=0;else if(a){if(u===0)u=m;else if(m-u>2600){t();return}}this.silenceTimer=window.setTimeout(d,120)};d()}async stop(){const t=this.recorder;if(!t||t.state==="inactive")return this.release(),null;const n=await new Promise(r=>{t.addEventListener("stop",()=>r(new Blob(this.chunks,{type:t.mimeType||"audio/webm"})),{once:!0}),t.stop()});return this.release(),n.size>0?n:null}cancel(){this.recorder&&this.recorder.state!=="inactive"&&this.recorder.stop(),this.release()}release(){this.silenceTimer!==null&&window.clearTimeout(this.silenceTimer),this.silenceTimer=null,this.audio?.close().catch(()=>{}),this.audio=null,this.stream?.getTracks().forEach(t=>t.stop()),this.stream=null,this.recorder=null,this.chunks=[]}}function vi(){for(const e of["audio/webm;codecs=opus","audio/webm","audio/mp4"])if(MediaRecorder.isTypeSupported?.(e))return{mimeType:e};return{}}const rn={active:!1,muted:!1,phase:"listening"};function yi(e,t){switch(t.type){case"start":return e.active?e:{active:!0,muted:!1,phase:"listening"};case"end":return rn}if(!e.active)return e;switch(t.type){case"toggleMute":return{...e,muted:!e.muted};case"heard":return e.phase==="listening"?{...e,phase:"thinking"}:e;case"answered":return e.phase==="speaking"?e:{...e,phase:"speaking"};case"spoke":return e.phase==="speaking"?{...e,phase:"listening"}:e;case"unheard":return e.phase==="listening"?e:{...e,phase:"listening"};default:return e}}function wi(e){return e.active?e.phase==="listening"?e.muted?"Muted":"Listening":e.phase==="thinking"?"Thinking":"Speaking":""}function xi(e){return e.active&&!e.muted&&e.phase==="listening"}const j={viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":1.8,"stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true"},ki=()=>c("svg",{...j,children:c("path",{d:"M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z"})}),on=()=>c("svg",{...j,children:c("path",{d:"m6 6 12 12M18 6 6 18"})}),Si=()=>c("svg",{...j,children:c("path",{d:"M4.5 12h13M12 5.5 18.5 12 12 18.5"})}),an=()=>c("svg",{...j,children:[c("rect",{x:"9",y:"3",width:"6",height:"11",rx:"3"}),c("path",{d:"M5 11a7 7 0 0 0 14 0M12 18v3"})]}),Ei=()=>c("svg",{...j,children:[c("path",{d:"M15 5a3 3 0 0 0-6 0v4M9 12v2a3 3 0 0 0 4.6 2.5"}),c("path",{d:"M5 11a7 7 0 0 0 10.9 5.8M19 11a7 7 0 0 1-.6 2.8M12 18v3"}),c("path",{d:"m4 3 16 18"})]}),Ai=()=>c("svg",{...j,children:[c("path",{d:"M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"}),c("path",{d:"M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"})]}),Ti=()=>c("svg",{...j,children:c("path",{d:"M6.5 3.5h3l1.5 4-2 1.3a12 12 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"})}),Li=()=>c("svg",{...j,children:[c("path",{d:"M8.2 4.2h2.4l1.2 3.4-1.7 1.1a11 11 0 0 0 4.6 4.6l1.1-1.7 3.4 1.2v2.4a1.8 1.8 0 0 1-2 1.8A14.6 14.6 0 0 1 6.4 6.2a1.8 1.8 0 0 1 1.8-2Z"}),c("path",{d:"m3.5 3.5 17 17"})]}),Ci=()=>c("svg",{...j,children:[c("rect",{x:"9",y:"9",width:"11",height:"11",rx:"2.5"}),c("path",{d:"M15 5.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 5.5 15"})]}),Ii=()=>c("svg",{...j,children:c("path",{d:"m5 12.5 4.5 4.5L19 7"})}),Mi=()=>c("svg",{...j,children:[c("path",{d:"M7 10.5 11 3a2.2 2.2 0 0 1 2.2 2.7L12.5 9h4.7A2 2 0 0 1 19 11.4l-1.3 6A2 2 0 0 1 15.7 19H7"}),c("rect",{x:"3",y:"10",width:"4",height:"9",rx:"1.2"})]}),Ni=()=>c("svg",{...j,children:[c("path",{d:"M7 13.5 11 21a2.2 2.2 0 0 0 2.2-2.7L12.5 15h4.7A2 2 0 0 0 19 12.6l-1.3-6A2 2 0 0 0 15.7 5H7"}),c("rect",{x:"3",y:"5",width:"4",height:"9",rx:"1.2"})]});function Oi({state:e,transcript:t,onToggleMute:n,onEnd:r}){const i=wi(e);return c("div",{class:"pl-call",role:"group","aria-label":"Call controls",children:[c("div",{class:"pl-call__state",children:[c("span",{class:`pl-call__pulse pl-call__pulse--${e.muted?"muted":e.phase}`,"aria-hidden":"true"}),c("span",{class:"pl-call__body",children:[c("span",{class:"pl-call__label",role:"status","aria-live":"polite",children:i}),t&&c("span",{class:"pl-call__transcript",children:t})]})]}),c("button",{type:"button",class:"pl-icon-btn","aria-pressed":e.muted,"aria-label":e.muted?"Unmute the microphone":"Mute the microphone",title:e.muted?"Unmute":"Mute",onClick:n,children:e.muted?c(Ei,{}):c(an,{})}),c("button",{type:"button",class:"pl-btn pl-btn--end",onClick:r,children:[c(Li,{}),c("span",{children:"End call"})]})]})}function Ri(e){const t=O(null),[n,r]=M(0);q(()=>{t.current?.focus()},[e.focusToken]),q(()=>{const o=t.current;o&&(o.style.height="auto",o.style.height=`${Math.min(o.scrollHeight,96)}px`,o.style.overflowY=o.scrollHeight>96?"auto":"hidden",r(o.scrollHeight))},[e.value]);const i=e.recording?"Stop and send":"Dictate a question";return c("form",{class:"pl-composer",onSubmit:o=>{o.preventDefault(),e.onSubmit()},children:[c("div",{class:"pl-composer__field",children:[c("textarea",{ref:t,rows:1,"data-height":n,value:e.value,placeholder:e.transcribing?"Transcribing...":e.recording?"Listening...":"Ask a question","aria-label":"Ask a question",disabled:e.transcribing,onInput:o=>e.onInput(o.currentTarget.value),onKeyDown:o=>{o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),e.onSubmit())}}),e.voiceSupported&&c("button",{type:"button",class:"pl-icon-btn","aria-pressed":e.recording,"aria-label":i,title:i,onClick:()=>e.onToggleRecording(),children:c(an,{})})]}),c("button",{type:"submit",class:"pl-send","aria-label":"Send",disabled:e.busy||e.value.trim().length===0,children:c(Si,{})})]})}function Pi({open:e,unread:t,onClick:n}){return c("button",{type:"button",class:"pl-launcher","aria-label":e?"Close support":t?"Open support, one new answer":"Open support","aria-expanded":e,onClick:n,children:[e?c(on,{}):c(ki,{}),!e&&t&&c("span",{class:"pl-launcher__dot","aria-hidden":"true"})]})}function sn({text:e,rating:t,canRate:n,onRate:r}){const[i,o]=M(!1),a=async()=>{try{await navigator.clipboard.writeText(e),o(!0),setTimeout(()=>o(!1),1600)}catch{}};return c("div",{class:"pl-answer-actions",children:[c("button",{type:"button",class:"pl-mini",onClick:()=>void a(),"aria-label":i?"Copied":"Copy the answer",children:[i?c(Ii,{}):c(Ci,{}),c("span",{children:i?"Copied":"Copy"})]}),c("span",{class:"pl-answer-actions__spacer"}),t?c("span",{class:"pl-answer-actions__thanks",children:"Thank you"}):c(oe,{children:[c("button",{type:"button",class:"pl-mini pl-mini--icon",disabled:!n,"aria-label":"This answer helped",title:"This answer helped",onClick:()=>r("up"),children:c(Mi,{})}),c("button",{type:"button",class:"pl-mini pl-mini--icon",disabled:!n,"aria-label":"This answer did not help",title:"This answer did not help",onClick:()=>r("down"),children:c(Ni,{})})]})]})}const Di=600,ln=40;function cn(){return typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches}function Hi(e){return e.match(/\S+\s*/g)??[]}function un(e){const[t,n]=M(()=>cn()?e:""),r=O(!1);return q(()=>{if(r.current||cn()||!e){n(e);return}r.current=!0;const i=Hi(e),o=Math.max(1,Math.ceil(i.length/Math.max(1,Di/ln)));let a=0;const u=setInterval(()=>{if(a+=o,a>=i.length){clearInterval(u),n(e);return}n(i.slice(0,a).join(""))},ln);return()=>clearInterval(u)},[e]),t}const $i={no_repository:"The team has not connected a repository yet, so I cannot report this.",failed:"The report could not be sent. Nothing was lost, so try again in a moment."};function Ui({text:e,request:t,escalation:n,reporting:r,blocked:i,noted:o,elapsedSeconds:a,rating:u,canRate:d,onReport:l,onRate:h}){const m=un(e),s=m===e;return c("div",{class:"pl-card",children:[c("p",{children:m}),s&&!n&&!i&&t&&c("div",{class:"pl-card__actions",children:[c("button",{type:"button",class:"pl-btn pl-btn--accent",onClick:l,disabled:r,children:r?"Reporting":"Report to developers"}),c("span",{class:"pl-card__label",children:t.title})]}),s&&!n&&i&&c("p",{class:"pl-card__note",children:$i[i]}),s&&!n&&!i&&o&&c("p",{class:"pl-card__note",children:"I have noted this for the team."}),n&&c(Gi,{escalation:n,elapsedSeconds:a}),s&&c(sn,{text:e,rating:u,canRate:d,onRate:h})]})}const qi=[{key:"filed",label:"Your request was sent to the team",statuses:["filing","filed","updated","inspecting","drafting","pr_open","awaiting_approval","approved","merging","deploying","shipped"]},{key:"drafted",label:"Someone is working on it",statuses:["drafting","pr_open","awaiting_approval","approved","merging","deploying","shipped"]},{key:"pr",label:"A change is ready for review",statuses:["pr_open","awaiting_approval","approved","merging","deploying","shipped"]},{key:"approval",label:"Waiting on a final check",statuses:["awaiting_approval","approved","merging","deploying","shipped"]},{key:"shipped",label:"Done, it is live",statuses:["shipped"]}],pn=["queued","filing","filed","updated","inspecting","drafting","pr_open","awaiting_approval","approved","merging","deploying","shipped"];function Gi({escalation:e,elapsedSeconds:t}){const n=e.status,r=pn.indexOf(n);return n==="failed"||n==="rejected"?c("p",{class:"pl-timeline__note",children:n==="rejected"?"A developer decided not to build this for now.":"The report could not be completed. The team has the details."}):c(oe,{children:[c("span",{class:"pl-card__label",children:"Progress"}),c("ul",{class:"pl-timeline",children:qi.map(i=>{const o=i.statuses.includes(n),a=pn.indexOf(i.statuses[0]),u=o?r>a?"done":"current":"pending";return c("li",{"data-state":u,children:[c("span",{class:"pl-timeline__mark"}),c("span",{class:"pl-timeline__body",children:[c("span",{children:Vi(i,e)}),u==="current"&&t>10&&c("span",{class:"pl-timeline__note",children:[t,"s so far"]})]})]},i.key)})})]})}function Vi(e,t){return e.key==="filed"&&t.issueUrl?c("a",{class:"pl-link",href:t.issueUrl,target:"_blank",rel:"noreferrer noopener",children:"See your request on GitHub"}):e.key==="pr"&&t.prUrl?c("a",{class:"pl-link",href:t.prUrl,target:"_blank",rel:"noreferrer noopener",children:"See the change on GitHub"}):e.key==="shipped"&&t.deploymentUrl?c("a",{class:"pl-link",href:t.deploymentUrl,target:"_blank",rel:"noreferrer noopener",children:"It is live now, reload the page to use it"}):e.label}function Fi({text:e,steps:t,guiding:n,rating:r,canRate:i,onShowMe:o,onRate:a}){const u=un(e),d=u===e;return c("div",{class:"pl-card",children:[c("p",{children:u}),d&&t&&t.length>0&&c("div",{class:"pl-card__actions",children:[c("button",{type:"button",class:"pl-btn pl-btn--accent",onClick:o,disabled:n,children:n?"Showing you":"Show me"}),c("span",{class:"pl-card__label",children:[t.length," step",t.length===1?"":"s"]})]}),d&&c(sn,{text:e,rating:r,canRate:i,onRate:a})]})}const ve=["reading","docs","page","code","deciding","writing"],ji={reading:"Reading your question",docs:"Checking the documentation",page:"Looking at this page",code:"Checking known product capabilities",deciding:"Deciding",writing:"Writing the answer"},Ve="reading",Bi=700,Wi=8e3,zi="Still working";function Ki(e){switch(e.type){case"conversation":return"reading";case"understanding":return"docs";case"probe":return e.status==="running"?"docs":e.probe==="docs"?"page":e.probe==="interface"?"code":"deciding";case"verdict":return"writing";default:return null}}function Yi(e,t){const n=Ki(t);return n&&ve.indexOf(n)>ve.indexOf(e)?n:e}function Ji(e,t){const n=ve.indexOf(e);return ve.indexOf(t)>n?ve[n+1]:e}function Xi(e,t){const n=ji[e];return t>=Wi?`${n}. ${zi}`:n}function Zi({stage:e,elapsedMs:t}){return c("div",{class:"pl-thinking",role:"status","aria-live":"polite",children:[c("span",{class:"pl-typing","aria-hidden":"true",children:[c("span",{}),c("span",{}),c("span",{})]}),c("span",{class:"pl-thinking__line",children:Xi(e,t)})]})}const dn=40;function Qi({turns:e,workingTurnId:t,stage:n,workingMs:r,guidingTurnId:i,elapsedSeconds:o,scroll:a,onShowMe:u,onReport:d,onRate:l}){const h=O(null),m=O(!0),s=O(!1);return Dn(()=>{const b=h.current;!b||s.current||(s.current=!0,!(a.current<0)&&(b.scrollTop=a.current,m.current=b.scrollHeight-b.scrollTop-b.clientHeight<dn))},[a]),q(()=>{const b=h.current;!b||!m.current||(b.scrollTop=b.scrollHeight,a.current=b.scrollTop)},[e,t,n,a]),c("div",{class:"pl-messages",ref:h,onScroll:()=>{const b=h.current;b&&(a.current=b.scrollTop,m.current=b.scrollHeight-b.scrollTop-b.clientHeight<dn)},children:[e.length===0&&c("div",{class:"pl-empty",children:[c("h3",{children:"How can we help?"}),c("p",{children:"Ask a question and we will point at the right control on this page."})]}),e.map(b=>c(eo,{turn:b,working:t===b.id,stage:n,workingMs:r,guiding:i===b.id,elapsedSeconds:o,onShowMe:u,onReport:d,onRate:l},b.id))]})}function eo({turn:e,working:t,stage:n,workingMs:r,guiding:i,elapsedSeconds:o,onShowMe:a,onReport:u,onRate:d}){const l=e.answer?.escalation,h=!!e.messageId,m=s=>d(e,s);return c(oe,{children:[c("div",{class:"pl-msg pl-msg--user",children:c("p",{children:e.question})}),e.memory&&e.memory.length>0&&c("p",{class:"pl-recall",children:"Welcome back."}),t&&c(Zi,{stage:n,elapsedMs:r}),e.error&&c("div",{class:"pl-msg pl-msg--agent",children:c("p",{children:e.error})}),e.answer&&l&&(l.offered===!0||l.reason)&&c(Ui,{text:e.answer.text,request:l.offered===!0?l.request:void 0,escalation:e.escalation,reporting:e.reporting,blocked:e.reportBlocked??(l.offered===!0?void 0:l.reason),noted:e.answer.noted,elapsedSeconds:o,rating:e.rating,canRate:h,onReport:()=>u(e),onRate:m}),e.answer&&l?.offered!==!0&&!l?.reason&&c(Fi,{text:e.answer.text,steps:e.answer.steps,guiding:i,rating:e.rating,canRate:h,onShowMe:()=>a(e),onRate:m})]})}const to='button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';function no({title:e,subtitle:t,speaking:n,onCall:r,onStopSpeaking:i,onClose:o,onEscape:a,children:u}){const d=O(null);return q(()=>{const l=d.current;if(!l)return;const h=m=>{if(m.key==="Escape"){m.stopPropagation(),a();return}if(m.key!=="Tab")return;const s=Array.from(l.querySelectorAll(to)).filter(w=>w.offsetParent!==null||w===l.ownerDocument.activeElement);if(s.length===0)return;const g=s[0],b=s[s.length-1],E=l.getRootNode().activeElement;!m.shiftKey&&E===b?(m.preventDefault(),g.focus()):m.shiftKey&&E===g&&(m.preventDefault(),b.focus())};return l.addEventListener("keydown",h),()=>l.removeEventListener("keydown",h)},[a]),c("div",{class:"pl-panel",role:"dialog","aria-label":e,ref:d,children:[c("header",{class:"pl-header",children:[c("div",{class:"pl-header__text",children:[c("p",{class:"pl-header__title",children:e}),c("p",{class:"pl-header__sub",children:t})]}),c("span",{class:"pl-header__spacer"}),r&&c("button",{type:"button",class:"pl-btn pl-btn--call",onClick:r,children:[c(Ti,{}),c("span",{children:"Start a call"})]}),n&&c("button",{type:"button",class:"pl-icon-btn","aria-label":"Stop speaking",onClick:i,children:c(Ai,{})}),c("button",{type:"button",class:"pl-icon-btn","aria-label":"Close support",onClick:o,children:c(on,{})})]}),u]})}function ro(e,t){return{id:e,question:t,probes:{docs:{status:"pending"},interface:{status:"pending"},repository:{status:"pending"}}}}const ut="patchlet:call";function Fe(e){try{e?sessionStorage.setItem(ut,"1"):sessionStorage.removeItem(ut)}catch{}}function io(){try{return sessionStorage.getItem(ut)==="1"}catch{return!1}}const hn=new Set(["shipped","failed","rejected"]),oo=["queued","filing","inspecting","drafting","pr_open","awaiting_approval","approved","rejected","merging","deploying","shipped","failed"];function ao(e){return oo.includes(e)?e:"queued"}function so({client:e,shadow:t,host:n,position:r,register:i}){const[o,a]=M(!1),[u,d]=M([]),[l,h]=M(""),[m,s]=M(!1),[g,b]=M(null),[E,w]=M(""),[T,v]=M(!1),[p,x]=M(!1),[y,R]=M(!1),[U,H]=M(0),[V,I]=M(!1),[N,J]=M(0),[G,ee]=M(null),[we,he]=M(Ve),[je,xe]=M(Ve),[Be,fe]=M(0),[te,B]=Ut(yi,rn),[Eo,pt]=M(""),We=O(null),ze=O(void 0),ie=O(null),ke=O(null),se=O(null),Ao=O(0),To=O(-1),X=O(te);X.current=te;const W=$e(()=>new pe,[]),kn=O(()=>{}),le=$e(()=>new mi(R,()=>kn.current()),[]);kn.current=()=>{X.current.active&&B({type:"spoke"})};const ge=$(f=>ti({question:f,exclude:n}),[n]),K=$((f,_)=>{d(k=>k.map(P=>P.id===f?_(P):P))},[]),Se=$(()=>{ie.current?.stop(),ke.current?.hide(),se.current=null,b(null)},[]),Sn=$(f=>{const _=ke.current;if(_){if(f.state==="DONE"||f.state==="FAILED"){_.hide(),se.current=null,b(null),a(!0),w(f.state==="DONE"?"Guidance finished.":f.message??"Guidance stopped.");return}if(!f.step||!f.target){_.hide();return}_.show({target:f.target,caption:f.step.caption,index:f.stepIndex,total:f.total,isLast:f.stepIndex===f.total-1,busy:f.state!=="SPOTLIGHTING"}),f.state==="SPOTLIGHTING"&&w(`Step ${f.stepIndex+1} of ${f.total}. ${f.step.caption}`)}},[]),En=$(async f=>{const _=se.current;if(!_)return null;const k=ge(_.question);We.current=k;let P=null;try{await e.ask({question:_.question,page:k.page,conversationId:ze.current,continueFrom:f,onEvent:Y=>{Y.type==="answer"&&(P=Y.steps)}})}catch{return null}return P?{...k,steps:P}:null},[e,ge]),Ke=$(()=>{ke.current||(ke.current=new Zn(t,{onNext:()=>ie.current?.next(),onDone:()=>ie.current?.next(),onStop:()=>Se(),onLost:()=>ie.current?.lost()})),ie.current||(ie.current=new zn({rescan:()=>{const f=se.current,_=ge(f?.question??"");return We.current=_,_},replan:En,onChange:Sn,watch:f=>jn(f,300)}))},[Sn,En,ge,t,Se]),dt=$(f=>{const _=f.answer?.steps,k=We.current;!_||_.length===0||!k||(Ke(),se.current={turnId:f.id,question:f.question},b(f.id),a(!1),ie.current?.start(k,_))},[Ke]),ht=O(o);ht.current=o;const An=O(we);An.current=we;const Ee=$(async f=>{const _=f.trim();if(!_||m)return;a(!0),h(""),s(!0);const k=`t${Ao.current+=1}`;let P=ro(k,_);d(F=>[...F,P]),ee(k),he(Ve),xe(Ve),fe(0);const Y=F=>{P=F,K(k,()=>F)},ne=ge(_);We.current=ne,Ke();try{await e.ask({question:_,page:ne.page,conversationId:ze.current,onEvent:F=>{if(he(Te=>Yi(Te,F)),Y(lo(P,F,ze)),F.type==="answer")if(ee(null),ht.current||I(!0),F.steps?.length&&dt(P),X.current.active){const Te=F.text;B({type:"answered"}),le.play(Oo=>e.speak(Te,Oo))}else J(Te=>Te+1)}})}catch{Y({...P,error:"The support service is not reachable right now."})}finally{ee(null),s(!1),X.current.active&&X.current.phase==="thinking"&&B({type:"unheard"})}},[m,e,Ke,K,le,ge,dt]),Lo=$(async f=>{const _=ze.current;if(!(!_||!f.messageId||f.reporting||f.escalationId)){K(f.id,k=>({...k,reporting:!0,reportBlocked:void 0}));try{const k=await e.escalate(_,f.messageId);if(!k.ok){K(f.id,ne=>({...ne,reporting:!1,reportBlocked:k.reason}));return}const{escalationId:P,status:Y}=k;K(f.id,ne=>({...ne,reporting:!1,escalationId:P,escalation:{id:P,status:ao(Y)}})),co(e,P,ne=>{K(f.id,F=>(F.escalation?.status!==ne.status&&H(0),{...F,escalation:ne}))})}catch{K(f.id,k=>({...k,reporting:!1,reportBlocked:"failed"}))}}},[e,K]),Co=$(async(f,_)=>{const k=f.messageId;if(!k||f.rating)return;K(f.id,Y=>({...Y,rating:_})),w("Thank you for the feedback."),await e.feedback(k,_)||K(f.id,Y=>({...Y,rating:void 0}))},[e,K]);q(()=>{if(!u.some(k=>k.escalation&&!hn.has(k.escalation.status)))return;const _=setInterval(()=>H(k=>k+1),1e3);return()=>clearInterval(_)},[u]),q(()=>{if(!G)return;const f=Date.now(),_=setInterval(()=>fe(Date.now()-f),500);return()=>clearInterval(_)},[G]),q(()=>{if(!G)return;const f=setInterval(()=>xe(_=>Ji(_,An.current)),Bi);return()=>clearInterval(f)},[G]),q(()=>{o&&I(!1)},[o]);const ft=$(()=>{B({type:"end"}),Fe(!1),W.cancel(),v(!1),le.stop(),pt(""),J(f=>f+1)},[le,W]),Io=$(()=>{if(!pe.supported){w("This browser cannot use the microphone.");return}a(!0),pt(""),B({type:"start"}),Fe(!0),w("The call has started. Speak when you are ready.")},[]),Ae=$(()=>{X.current.active&&ft(),a(!1)},[ft]);q(()=>{if(!io()||!pe.supported)return;let f=!1;return pe.alreadyAllowed().then(_=>{if(!f){if(!_){Fe(!1);return}a(!0),B({type:"start"})}}),()=>{f=!0}},[]),q(()=>{const f=_=>{_.key==="Escape"&&(se.current?Se():ht.current&&Ae())};return document.addEventListener("keydown",f),()=>document.removeEventListener("keydown",f)},[Ae,Se]),q(()=>{i({open:()=>a(!0),close:()=>a(!1),ask:f=>void Ee(f)})},[Ee,i]),q(()=>()=>{ie.current?.dispose(),ke.current?.destroy(),le.stop(),W.cancel()},[le,W]);const Ye=$(async()=>{v(!1);let f=null;try{f=await W.stop()}catch{f=null}X.current.active&&B({type:"heard"}),x(!0);try{if(!f){X.current.active&&B({type:"unheard"});return}const _=await e.transcribe(f);_?(pt(_),h(_),Ee(_)):(w("I did not catch that. Try again."),X.current.active&&B({type:"unheard"}))}catch{w("The microphone is not available."),X.current.active&&B({type:"unheard"})}finally{x(!1)}},[Ee,e,W]),gt=O(Ye);gt.current=Ye,q(()=>{if(!xi(te))return;let f=!1;return(async()=>{try{await W.start(()=>void gt.current()),f?W.cancel():v(!0)}catch{w("Microphone access was declined."),B({type:"end"}),Fe(!1)}})(),()=>{f=!0,W.cancel(),v(!1)}},[te,W]);const Mo=$(async()=>{if(T){await Ye();return}try{await W.start(()=>void gt.current()),v(!0)}catch{w("Microphone access was declined.")}},[Ye,W,T]),No=te.active?"On a call":m?"Working on it":"We can show you on this page";return c("div",{class:"pl-root","data-position":r,children:[c("div",{class:"pl-sr",role:"status","aria-live":"polite",children:E}),o&&c(no,{title:"Support",subtitle:No,speaking:y&&!te.active,onCall:te.active||!pe.supported?void 0:Io,onStopSpeaking:()=>le.stop(),onClose:Ae,onEscape:()=>se.current?Se():Ae(),children:[c(Qi,{turns:u,workingTurnId:G,stage:je,workingMs:Be,guidingTurnId:g,elapsedSeconds:U,scroll:To,onShowMe:dt,onReport:f=>void Lo(f),onRate:(f,_)=>void Co(f,_)}),te.active?c(Oi,{state:te,transcript:Eo,onToggleMute:()=>B({type:"toggleMute"}),onEnd:ft}):c(Ri,{value:l,busy:m,voiceSupported:pe.supported,recording:T,transcribing:p,focusToken:N,onInput:h,onSubmit:()=>void Ee(l),onToggleRecording:()=>void Mo()})]}),c(Pi,{open:o,unread:V,onClick:()=>o?Ae():a(!0)})]})}function lo(e,t,n){switch(t.type){case"conversation":return n.current=t.conversationId,{...e,messageId:t.messageId};case"understanding":return{...e,feature:t.feature,memory:t.memory};case"probe":return{...e,probes:{...e.probes,[t.probe]:t.status==="running"?{status:"running"}:{status:"done",result:t.result}}};case"verdict":return{...e,verdict:t.verdict};case"answer":return{...e,answer:{text:t.text,steps:t.steps,escalation:t.escalation,noted:t.noted}};case"error":return{...e,error:t.message}}}function co(e,t,n){let r=!1;const i=async()=>{if(!r){try{const o=await e.escalation(t);if(n(o),hn.has(o.status)){r=!0;return}}catch{}setTimeout(i,3e3)}};i()}class uo{constructor(){this.buffer=""}push(t){this.buffer+=t.replace(/\r\n/g,`
`);const n=[];let r=this.buffer.indexOf(`

`);for(;r!==-1;){const i=fn(this.buffer.slice(0,r));this.buffer=this.buffer.slice(r+2),i!==null&&n.push(i),r=this.buffer.indexOf(`

`)}return n}flush(){const t=this.buffer.trim();if(this.buffer="",!t)return[];const n=fn(t);return n===null?[]:[n]}}function fn(e){const t=[];for(const n of e.split(`
`)){if(!n||n.startsWith(":"))continue;const r=n.indexOf(":");if((r===-1?n:n.slice(0,r))!=="data")continue;const i=r===-1?"":n.slice(r+1);t.push(i.startsWith(" ")?i.slice(1):i)}return t.length===0?null:t.join(`
`)}const po=["docs","interface","repository"],de=e=>typeof e=="object"&&e!==null;function gn(e){let t;try{t=JSON.parse(e)}catch{return null}if(!de(t))return null;switch(t.type){case"conversation":return typeof t.conversationId!="string"||typeof t.messageId!="string"?null:{type:"conversation",conversationId:t.conversationId,messageId:t.messageId};case"understanding":{if(typeof t.feature!="string")return null;const n=t.intent==="howto"||t.intent==="feature"?t.intent:"other",r=Array.isArray(t.memory)?t.memory.filter(i=>typeof i=="string"):[];return{type:"understanding",feature:t.feature,intent:n,memory:r}}case"probe":{if(typeof t.probe!="string"||!po.includes(t.probe))return null;const n=t.probe;return t.status==="running"?{type:"probe",probe:n,status:"running"}:t.status==="done"&&de(t.result)?{type:"probe",probe:n,status:"done",result:ho(n,t.result)}:null}case"verdict":return de(t.verdict)?{type:"verdict",verdict:fo(t.verdict)}:null;case"answer":return typeof t.text!="string"?null:{type:"answer",text:t.text,steps:mo(t.steps),escalation:bo(t.escalation),noted:t.noted===!0};case"error":return{type:"error",message:typeof t.message=="string"?t.message:"Something went wrong."};default:return null}}function ho(e,t){return{probe:e,hit:t.hit===!0,score:typeof t.score=="number"?t.score:null,summary:typeof t.summary=="string"?t.summary:"",evidence:t.evidence??null,latencyMs:typeof t.latencyMs=="number"?t.latencyMs:0}}function fo(e){const t=e.outcome;return{outcome:t==="answer"||t==="absent"?t:"hedge",confidence:typeof e.confidence=="number"?e.confidence:0,reasoning:typeof e.reasoning=="string"?e.reasoning:"",feature:typeof e.feature=="string"?e.feature:""}}const go=["click","input","navigation","manual"];function mo(e){if(!Array.isArray(e))return null;const t=[];for(const n of e)de(n)&&(typeof n.target!="string"||typeof n.caption!="string"||t.push({target:n.target,caption:n.caption,advanceOn:typeof n.advanceOn=="string"&&go.includes(n.advanceOn)?n.advanceOn:"click"}));return t.length?t:null}function bo(e){return de(e)?e.offered===!0&&de(e.request)?{offered:!0,request:e.request}:e.reason==="no_repository"?{offered:!1,reason:"no_repository"}:{offered:!1}:{offered:!1}}const mn="patchlet:visitor";function bn(){const e=new Uint8Array(16);return crypto.getRandomValues(e),Array.from(e,t=>t.toString(16).padStart(2,"0")).join("")}function _n(){try{const e=localStorage.getItem(mn);if(e&&/^[0-9a-f]{32}$/.test(e))return e;const t=bn();return localStorage.setItem(mn,t),t}catch{return bn()}}class _o{constructor(t){this.config=t}url(t){return`${this.config.apiBase.replace(/\/$/,"")}${t}`}async ask({question:t,page:n,conversationId:r,continueFrom:i,signal:o,onEvent:a}){const u={key:this.config.key,question:t,page:n,visitorId:_n()};r&&(u.conversationId=r),typeof i=="number"&&(u.continueFrom=i);const d=await fetch(this.url("/api/chat"),{method:"POST",headers:{"content-type":"application/json",accept:"text/event-stream"},body:JSON.stringify(u),signal:o});if(!d.ok||!d.body)throw new Error(`Chat request failed (${d.status})`);const l=d.body.getReader(),h=new TextDecoder,m=new uo;for(;;){const{done:s,value:g}=await l.read();if(s)break;for(const b of m.push(h.decode(g,{stream:!0}))){const E=gn(b);E&&a(E)}}for(const s of m.flush()){const g=gn(s);g&&a(g)}}async escalate(t,n){const r=await fetch(this.url("/api/escalate"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:this.config.key,conversationId:t,messageId:n,visitorId:_n()})}),i=await r.json().catch(()=>({}));return!r.ok||!i.escalationId?{ok:!1,reason:i.reason==="no_repository"?"no_repository":"failed"}:{ok:!0,escalationId:i.escalationId,status:i.status??"queued"}}async escalation(t){const n=await fetch(this.url(`/api/escalations/${encodeURIComponent(t)}?key=${encodeURIComponent(this.config.key)}`));if(!n.ok)throw new Error(`Could not read the report status (${n.status})`);return await n.json()}async feedback(t,n,r){const i={key:this.config.key,messageId:t,rating:n};r&&(i.note=r);try{return(await fetch(this.url("/api/feedback"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(i)})).ok}catch{return!1}}async transcribe(t){const n=new FormData;n.append("key",this.config.key),n.append("file",t,"speech.webm");const r=await fetch(this.url("/api/transcribe"),{method:"POST",body:n});if(!r.ok)throw new Error(`Could not transcribe that (${r.status})`);const i=await r.json();return typeof i.text=="string"?i.text:""}async speak(t,n){const r=await fetch(this.url("/api/speak"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({key:this.config.key,text:t}),signal:n});if(!r.ok)throw new Error(`Could not read that out (${r.status})`);return r}}const ye={"--pl-accent":"#2e6f54","--pl-ink":"#17201c","--pl-muted":"#5b645f","--pl-glass":"rgba(255, 253, 247, 0.6)","--pl-radius":"18px"},vn=`
:host {
  --pl-accent: ${ye["--pl-accent"]};
  --pl-ink: ${ye["--pl-ink"]};
  --pl-muted: ${ye["--pl-muted"]};
  --pl-glass: ${ye["--pl-glass"]};
  --pl-radius: ${ye["--pl-radius"]};

  --pl-accent-deep: #174633;
  /* The accent as text: the deep green on light glass, a lighter green on dark. */
  --pl-accent-text: var(--pl-accent);
  --pl-glass-strong: rgba(255, 253, 247, 0.82);
  --pl-border: rgba(255, 255, 255, 0.72);
  --pl-hairline: rgba(23, 32, 28, 0.1);
  --pl-field: rgba(255, 255, 255, 0.5);
  --pl-bubble: rgba(255, 255, 255, 0.62);
  --pl-shadow: 0 28px 74px rgba(23, 32, 28, 0.24), 0 2px 10px rgba(23, 32, 28, 0.08);
  --pl-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.28);
  --pl-scrim: rgba(14, 18, 16, 0.42);
  --pl-blur: blur(32px) saturate(170%);
  --pl-serif: ui-serif, Georgia, "Times New Roman", serif;

  all: initial;
  position: fixed;
  inset: auto 0 0 auto;
  z-index: 2147483000;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--pl-ink);
  -webkit-font-smoothing: antialiased;
}

:host([data-pl-scheme="dark"]) {
  --pl-ink: #f2f2f5;
  --pl-muted: #b3b3bd;
  --pl-accent-text: #9fd0b5;
  --pl-accent-deep: #2e6f54;
  --pl-glass: rgba(28, 30, 29, 0.66);
  --pl-glass-strong: rgba(30, 30, 36, 0.92);
  --pl-border: rgba(255, 255, 255, 0.14);
  --pl-hairline: rgba(255, 255, 255, 0.1);
  --pl-field: rgba(255, 255, 255, 0.07);
  --pl-bubble: rgba(255, 255, 255, 0.08);
  --pl-shadow: 0 28px 74px rgba(0, 0, 0, 0.5), 0 2px 10px rgba(0, 0, 0, 0.35);
  --pl-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  --pl-scrim: rgba(4, 6, 5, 0.55);
}

*, *::before, *::after { box-sizing: border-box; }

.pl-root {
  position: fixed;
  bottom: 22px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
}
.pl-root[data-position="right"] { right: 22px; align-items: flex-end; }
.pl-root[data-position="left"] { left: 22px; align-items: flex-start; }

/* Launcher */
.pl-launcher {
  appearance: none;
  position: relative;
  width: 62px;
  height: 62px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: var(--pl-accent-deep);
  box-shadow:
    0 16px 38px rgba(23, 70, 51, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: #fffdf7;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
}
.pl-launcher:hover {
  transform: translateY(-2px);
  background: var(--pl-accent);
  box-shadow:
    0 20px 44px rgba(23, 70, 51, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.32);
}
.pl-launcher:active { transform: translateY(0) scale(0.96); }
.pl-launcher[aria-expanded="true"] { background: var(--pl-accent); }
.pl-launcher:focus-visible { outline: 2px solid var(--pl-accent); outline-offset: 3px; }
.pl-launcher svg { width: 26px; height: 26px; display: block; }
/* One small mark, no count: the panel is one conversation, so a number would always read "1". */
.pl-launcher__dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #fffdf7;
  box-shadow: 0 0 0 2px var(--pl-accent-deep);
}

/* Panel */
.pl-panel {
  width: min(380px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: var(--pl-radius);
  border: 1px solid var(--pl-border);
  background:
    linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0) 34%),
    radial-gradient(120% 80% at 90% 0%, rgba(46, 111, 84, 0.1), transparent 60%),
    var(--pl-glass);
  -webkit-backdrop-filter: var(--pl-blur);
  backdrop-filter: var(--pl-blur);
  box-shadow: var(--pl-shadow);
  overflow: hidden;
  transform-origin: bottom right;
  animation: pl-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
}
.pl-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: var(--pl-highlight);
}
.pl-root[data-position="left"] .pl-panel { transform-origin: bottom left; }
:host([data-pl-scheme="dark"]) .pl-panel::before { box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1); }
/* The light sheen across the top of the glass is tuned for a pale ground. At full strength on a
   dark host it reads as a smudge, so the dark scheme gets the same shape at a fifth of it. */
:host([data-pl-scheme="dark"]) .pl-panel {
  background:
    linear-gradient(to bottom, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 34%),
    radial-gradient(120% 80% at 90% 0%, rgba(46, 111, 84, 0.18), transparent 60%),
    var(--pl-glass);
}

@keyframes pl-in { from { opacity: 0; transform: translateY(10px) scale(0.97); } to { opacity: 1; transform: none; } }

.pl-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 13px;
  border-bottom: 1px solid var(--pl-hairline);
}
.pl-header__title {
  margin: 0;
  font-family: var(--pl-serif);
  font-size: 19px;
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.15;
}
.pl-header__sub { font-size: 12px; color: var(--pl-muted); margin: 2px 0 0; }
.pl-header__text { min-width: 0; }
.pl-header__text p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-header__spacer { flex: 1; }

.pl-icon-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--pl-muted);
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.pl-icon-btn:hover { background: var(--pl-field); color: var(--pl-ink); }
.pl-icon-btn:focus-visible { outline: 2px solid var(--pl-accent); outline-offset: 2px; }
.pl-icon-btn[aria-pressed="true"] { color: var(--pl-accent-text); background: color-mix(in srgb, var(--pl-accent) 12%, transparent); }
.pl-icon-btn svg { width: 17px; height: 17px; }

/* Messages */
.pl-messages {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
}
.pl-empty { margin: auto 0; text-align: center; color: var(--pl-muted); padding: 8px 12px; }
.pl-empty h3 {
  margin: 0 0 8px;
  font-family: var(--pl-serif);
  font-size: 22px;
  font-weight: 500;
  color: var(--pl-ink);
}
.pl-empty p { margin: 0; font-size: 14px; }

.pl-msg { max-width: 88%; padding: 9px 12px; border-radius: 14px; font-size: 14px; }
.pl-msg--user {
  align-self: flex-end;
  background: color-mix(in srgb, var(--pl-accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--pl-accent) 24%, transparent);
}
.pl-msg--agent { align-self: flex-start; background: var(--pl-bubble); border: 1px solid var(--pl-hairline); }
.pl-msg p { margin: 0; white-space: pre-wrap; }

/* One quiet line when the agent already knows this visitor. */
.pl-recall {
  align-self: flex-start;
  margin: -4px 0 0;
  padding: 0 2px;
  color: var(--pl-muted);
  font-size: 11.5px;
  line-height: 1.45;
}

/* Cards */
.pl-card {
  align-self: stretch;
  border: 1px solid var(--pl-hairline);
  background: var(--pl-glass-strong);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pl-card p { margin: 0; font-size: 14px; white-space: pre-wrap; }
.pl-card__label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--pl-muted); }
.pl-card__actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pl-card__note { color: var(--pl-muted); font-size: 12.5px; }

.pl-btn {
  appearance: none;
  font: inherit;
  font-size: 12.5px;
  font-weight: 550;
  border-radius: 10px;
  padding: 7px 12px;
  border: 1px solid var(--pl-hairline);
  background: var(--pl-field);
  color: var(--pl-ink);
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
}
.pl-btn:hover { transform: translateY(-1px); }
.pl-btn:focus-visible { outline: 2px solid var(--pl-accent); outline-offset: 2px; }
.pl-btn:disabled { opacity: 0.55; cursor: default; transform: none; }
.pl-btn--accent { background: var(--pl-accent-deep); border-color: transparent; color: #fffdf7; }
.pl-btn--accent:hover { background: var(--pl-accent); }
.pl-btn--quiet { background: transparent; color: var(--pl-muted); }
.pl-btn svg { width: 15px; height: 15px; flex: none; }
.pl-btn--call,
.pl-btn--end {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 6px 11px;
  white-space: nowrap;
}
.pl-btn--call { background: color-mix(in srgb, var(--pl-accent) 13%, transparent); border-color: color-mix(in srgb, var(--pl-accent) 30%, transparent); color: var(--pl-accent-deep); }
.pl-btn--call:hover { background: color-mix(in srgb, var(--pl-accent) 20%, transparent); }
:host([data-pl-scheme="dark"]) .pl-btn--call { color: var(--pl-ink); }
.pl-btn--end { background: #b3261e; border-color: transparent; color: #fffdf7; }
.pl-btn--end:hover { background: #c9372f; }

/* The working state: three dots and one honest line about what is happening. */
.pl-thinking {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 14px;
  background: var(--pl-bubble);
  border: 1px solid var(--pl-hairline);
  max-width: 88%;
}
.pl-thinking__line { font-size: 13px; color: var(--pl-muted); }
.pl-typing { display: inline-flex; gap: 4px; flex: none; }
.pl-typing span {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: var(--pl-accent);
  opacity: 0.35;
  animation: pl-typing 1.25s ease-in-out infinite;
}
.pl-typing span:nth-child(2) { animation-delay: 0.16s; }
.pl-typing span:nth-child(3) { animation-delay: 0.32s; }
@keyframes pl-typing { 0%, 60%, 100% { opacity: 0.3; transform: none; } 30% { opacity: 1; transform: translateY(-2px); } }

/* Copy and rating, quiet until the pointer is on them. */
.pl-answer-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding-top: 9px;
  border-top: 1px solid var(--pl-hairline);
}
.pl-answer-actions__spacer { flex: 1; }
.pl-answer-actions__thanks { font-size: 11.5px; color: var(--pl-muted); }
.pl-mini {
  appearance: none;
  font: inherit;
  font-size: 11.5px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: var(--pl-muted);
  border-radius: 8px;
  padding: 4px 7px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.pl-mini:hover:not(:disabled) { background: var(--pl-field); color: var(--pl-ink); }
.pl-mini:focus-visible { outline: 2px solid var(--pl-accent); outline-offset: 2px; }
.pl-mini:disabled { opacity: 0.4; cursor: default; }
.pl-mini svg { width: 14px; height: 14px; }
.pl-mini--icon { padding: 5px; }

/* Call bar, in the composer's place */
.pl-call {
  border-top: 1px solid var(--pl-hairline);
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.pl-call__state { flex: 1; min-width: 0; display: flex; align-items: center; gap: 9px; }
.pl-call__body { min-width: 0; display: flex; flex-direction: column; }
.pl-call__label { font-size: 13px; font-weight: 550; }
.pl-call__transcript {
  font-size: 11.5px;
  color: var(--pl-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pl-call__pulse {
  width: 9px;
  height: 9px;
  flex: none;
  border-radius: 999px;
  background: var(--pl-accent);
  animation: pl-pulse 1.4s ease-in-out infinite;
}
.pl-call__pulse--thinking { animation-duration: 0.9s; }
.pl-call__pulse--speaking { animation: none; opacity: 1; }
.pl-call__pulse--muted { animation: none; background: var(--pl-muted); opacity: 0.5; }

/* Escalation timeline */
.pl-timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.pl-timeline li { display: flex; gap: 9px; align-items: flex-start; font-size: 12.5px; }
.pl-timeline__mark {
  width: 8px; height: 8px; margin-top: 6px; border-radius: 999px; flex: none;
  border: 1px solid var(--pl-muted); background: transparent;
}
.pl-timeline li[data-state="done"] .pl-timeline__mark { background: var(--pl-muted); }
.pl-timeline li[data-state="current"] .pl-timeline__mark { background: var(--pl-accent); border-color: var(--pl-accent); }
.pl-timeline li[data-state="pending"] { color: var(--pl-muted); }
.pl-timeline__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pl-timeline__note { color: var(--pl-muted); font-size: 11.5px; }
.pl-link { color: var(--pl-accent-text); text-decoration: none; font-weight: 550; }
.pl-link:hover { text-decoration: underline; }

/* Composer */
.pl-composer {
  border-top: 1px solid var(--pl-hairline);
  padding: 10px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
.pl-composer__field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--pl-field);
  border: 1px solid var(--pl-hairline);
  border-radius: 13px;
  padding: 6px 8px 6px 12px;
}
.pl-composer__field:focus-within { border-color: color-mix(in srgb, var(--pl-accent) 45%, transparent); }
.pl-composer textarea {
  flex: 1;
  min-width: 0;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--pl-ink);
  max-height: 96px;
  padding: 3px 0;
  /* The field grows to fit its text, so it only scrolls once it hits the cap. Left on auto it
     shows a scrollbar with stepper arrows on a one-line question. */
  overflow-y: hidden;
  scrollbar-width: thin;
}
.pl-composer textarea::-webkit-scrollbar { width: 6px; }
.pl-composer textarea::-webkit-scrollbar-button { display: none; }
.pl-composer textarea::-webkit-scrollbar-thumb { border-radius: 999px; background: var(--pl-hairline); }
.pl-composer textarea::placeholder { color: var(--pl-muted); }
.pl-send {
  appearance: none;
  border: 0;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 11px;
  background: var(--pl-accent-deep);
  color: #fffdf7;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.pl-send:hover:not(:disabled) { background: var(--pl-accent); }
.pl-send:disabled { opacity: 0.35; cursor: default; }
.pl-send:focus-visible { outline: 2px solid var(--pl-accent); outline-offset: 2px; }
.pl-send svg { width: 16px; height: 16px; }
.pl-hint { font-size: 11px; color: var(--pl-muted); padding: 0 12px 8px; }

.pl-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* Spotlight */
.pl-spot {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  overflow: visible;
  pointer-events: none;
}
.pl-spot::backdrop { background: transparent; }
.pl-spot--fallback { z-index: 2147483001; }
.pl-spot__svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pl-spot__scrim { fill: var(--pl-scrim); transition: opacity 160ms ease; }
.pl-spot__ring {
  fill: none;
  stroke: var(--pl-accent);
  stroke-width: 2;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--pl-accent) 55%, transparent));
  transition: x 160ms ease, y 160ms ease, width 160ms ease, height 160ms ease;
}
.pl-spot__bubble {
  position: absolute;
  top: 0;
  left: 0;
  width: 260px;
  pointer-events: auto;
  border-radius: 14px;
  border: 1px solid var(--pl-border);
  background: var(--pl-glass-strong);
  -webkit-backdrop-filter: var(--pl-blur);
  backdrop-filter: var(--pl-blur);
  box-shadow: var(--pl-shadow), var(--pl-highlight);
  padding: 12px 13px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--pl-ink);
  transition: transform 160ms ease;
}
/* A caret on the edge facing the ring, so the caption reads as being about that control and
   not as a notice that happens to be nearby. */
.pl-spot__bubble::after {
  content: "";
  position: absolute;
  left: 24px;
  width: 11px;
  height: 11px;
  background: var(--pl-glass-strong);
  border: 1px solid var(--pl-border);
  transform: rotate(45deg);
}
.pl-spot__bubble[data-side="below"]::after {
  top: -6.5px;
  border-right: 0;
  border-bottom: 0;
}
.pl-spot__bubble[data-side="above"]::after {
  bottom: -6.5px;
  border-left: 0;
  border-top: 0;
}
.pl-spot__counter {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pl-accent-text);
}
.pl-spot__caption { margin: 0; font-size: 14px; line-height: 1.45; }
.pl-spot__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 1px; }
.pl-spot--busy .pl-spot__caption { opacity: 0.6; }

@media (prefers-reduced-motion: reduce) {
  .pl-panel { animation: none; }
  .pl-launcher, .pl-btn, .pl-spot__bubble, .pl-spot__ring, .pl-spot__scrim { transition: none; }
  .pl-typing span { animation: none; opacity: 0.75; }
  .pl-call__pulse { animation: none; opacity: 1; }
  .pl-mini { transition: none; }
}
`;function vo(e){if(typeof CSSStyleSheet<"u"&&"adoptedStyleSheets"in Document.prototype)try{const n=new CSSStyleSheet;n.replaceSync(vn),e.adoptedStyleSheets=[...e.adoptedStyleSheets,n];return}catch{}const t=document.createElement("style");t.textContent=vn,e.appendChild(t)}function yn(){const e=[];if(typeof document.elementFromPoint=="function"){const t=document.elementFromPoint(Math.max(innerWidth-120,0),Math.max(innerHeight-30,0));for(let n=t;n;n=n.parentElement)n.tagName.toLowerCase()!=="patchlet-widget"&&e.push(n)}e.push(document.body,document.documentElement);for(const t of e){if(!t)continue;const n=getComputedStyle(t).backgroundColor,r=yo(n);if(r!==null)return r<.4?"dark":"light"}return typeof matchMedia=="function"&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}function yo(e){const t=e.match(/rgba?\(([^)]+)\)/);if(!t)return null;const n=t[1].split(",").map(a=>Number.parseFloat(a.trim()));if(n.length<3||n.some(Number.isNaN)||n.length>3&&n[3]===0)return null;const[r,i,o]=n;return(.2126*r+.7152*i+.0722*o)/255}const wn="patchlet-widget",wo="patchlet_ask";function xo(){return new URLSearchParams(location.search).get(wo)?.trim()??""}function ko(){const t=document.currentScript??document.querySelector("script[data-key]"),n=t?.dataset.key?.trim();if(!n)return console.warn("[patchlet] no data-key on the script tag, the widget will not load"),null;const r=t?.src?new URL(t.src,location.href).origin:location.origin,i=t?.dataset.api?.trim()||r,o=t?.dataset.position==="left"?"left":"right";return{key:n,apiBase:i,position:o}}function xn(e){if(document.querySelector(wn))return;let t=xo();const n=document.createElement(wn);n.setAttribute("data-pl-scheme",yn()),document.body.appendChild(n);const r=n.attachShadow({mode:"open"});vo(r);const i=document.createElement("div");r.appendChild(i);const o=new MutationObserver(()=>n.setAttribute("data-pl-scheme",yn()));o.observe(document.documentElement,{attributes:!0,attributeFilter:["class","style","data-theme"]}),o.observe(document.body,{attributes:!0,attributeFilter:["class","style","data-theme"]});const a=new _o({apiBase:e.apiBase,key:e.key});Rn(c(so,{client:a,shadow:r,host:n,position:e.position,register:u=>{if(window.Patchlet=u,t){const d=t;t="",setTimeout(()=>window.Patchlet?.ask(d),400)}}}),i)}function So(){const e=ko();e&&(document.body?xn(e):document.addEventListener("DOMContentLoaded",()=>xn(e),{once:!0}))}So()})();
