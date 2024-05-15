import{r as p,R as C,j as M}from"./vendor-Bnznptw5.js";function N(r,e,t,n){if(r==0)return[0,0,[]];var[o,i]=e.offsetToItem(n);o=Math.max(0,Math.min(r-1,o));var s=n+t;const S=1,a=1;for(let l=0;l<S&&o>0;l++)o--,i-=e.itemSize(o);const g=o;var f=i;const d=[];for(;f<s&&o<r;){const l=e.itemSize(o);d.push(l),f+=l,o++}for(let l=0;l<a&&o<r;l++){const c=e.itemSize(o);d.push(c),o++}return[g,i,d]}const te=6e6,se=100;function U(r){let e=0,t=0,n=0;r<te?(e=t=r,n=1):(e=te,t=e/se,n=Math.floor(r/t));function o(f){return f<=0?0:f>=n-1?r-e:Math.round((f-1)*(r-e)/(n-3))}const i={scrollOffset:0,renderOffset:0,page:0,scrollDirection:"forward"},[s,S]=p.useState(i);function a(f,d,l){if(s.scrollOffset==l)return l;let c=Math.max(0,Math.min(l,d-f));const z=s.scrollOffset<=c?"forward":"backward";let u,w,x=l;if(Math.abs(c-s.scrollOffset)<f)u=Math.min(n-1,Math.floor((l+s.renderOffset)/t)),w=o(u),u!=s.page&&(c=l+s.renderOffset-w,x=c);else{if(c<t)u=0;else if(c>=e-t)u=n-1;else{const y=(r-t*2)/(e-t*2);u=Math.min(n-3,Math.floor((c-t)*y/t))+1}w=o(u)}return S({scrollOffset:c,renderOffset:w,page:u,scrollDirection:z}),x}function g(f,d){const l=Math.min(r-d,Math.max(f,0)),c=s.scrollOffset+s.renderOffset<=l?"forward":"backward",z=Math.min(n-1,Math.floor(l/t)),u=o(z),w=l-u;return S({scrollOffset:w,renderOffset:u,page:z,scrollDirection:c}),w}return{...s,renderSize:e,onScroll:a,doScrollTo:g}}function _(r){return r.addEventListener!==void 0}function re(r,e,t=window,n={}){const o=p.useRef(),{capture:i,passive:s,once:S}=n;p.useEffect(()=>{o.current=e},[e]),p.useEffect(()=>{if(!t)return;const a=_(t)?t:t.current;if(!a)return;const g=d=>o.current(d),f={capture:i,passive:s,once:S};return a.addEventListener(r,g,f),()=>{a.removeEventListener(r,g,f)}},[r,t,i,s,S])}if(import.meta.vitest){const{it:r,expect:e}=import.meta.vitest;r("isListener",()=>{e(_(window)).toBe(!0),e(_(document)).toBe(!0),e(_(document.createElement("div"))).toBe(!0),e(_(p.createRef())).toBe(!1)})}function ie(r,e,t){const n=p.useRef(),o=p.useRef(r);p.useEffect(()=>{o.current=r},[r]);const i=performance.now();p.useEffect(()=>{function s(){n.current=void 0,e!==null&&(performance.now()-i>=e?o.current():n.current=requestAnimationFrame(s))}return s(),()=>{typeof n.current=="number"&&(cancelAnimationFrame(n.current),n.current=void 0)}},[e,t])}const le=150,ce=500;function ne(r=window){const[e,t]=p.useState(0),n="onscrollend"in window,o=n?ce:le;return re("scroll",()=>t(i=>i+1),r),re("scrollend",()=>t(0),n?r:null),ie(()=>t(0),e==0?null:o,e),e>0}const fe=(r,e,t)=>`${r}:${e}`,me=C.forwardRef(function(e,t){const{width:n,height:o,rowCount:i,rowOffsetMapping:s,columnCount:S,columnOffsetMapping:a,children:g,itemData:f=void 0,itemKey:d=fe,useIsScrolling:l=!1}=e,c=s.itemOffset(i),z=a.itemOffset(S),u=C.useRef(null),{scrollOffset:w,renderOffset:x,renderSize:L,onScroll:y,doScrollTo:O}=U(c),{scrollOffset:F,renderOffset:A,renderSize:P,onScroll:W,doScrollTo:K}=U(z),H=ne(u);C.useImperativeHandle(t,()=>({scrollTo(T,R){const I=u.current;I&&I.scrollTo(K(R,I.clientWidth),O(T,I.clientHeight))},scrollToItem(T,R){this.scrollTo(s.itemOffset(T),a.itemOffset(R))}}),[s,a]);function V(T){const{clientWidth:R,clientHeight:I,scrollWidth:G,scrollHeight:oe,scrollLeft:J,scrollTop:Q}=T.currentTarget,Y=y(I,oe,Q),ee=W(R,G,J);u.current&&(Y!=Q||ee!=J)&&u.current.scrollTo(ee,Y)}const[j,h,m]=N(i,s,o,w+x),[D,b,E]=N(S,a,n,F+A),v=g;let q=h-x,B=0,X=0,$=0,k=0,Z=0;return M.jsx("div",{onScroll:V,ref:u,style:{position:"relative",height:o,width:n,overflow:"auto",willChange:"transform"},children:M.jsx("div",{style:{height:L,width:P},children:m.map((T,R)=>(X=q,q+=T,B=j+R,$=b-A,M.jsx(p.Fragment,{children:E.map((I,G)=>(Z=$,$+=I,k=D+G,M.jsx(v,{data:f,rowIndex:B,columnIndex:k,isScrolling:l?H:void 0,style:{position:"absolute",top:X,height:T,left:Z,width:I}},d(B,k,f))))},d(B,0,f))))})})}),ue=(r,e)=>r,Se=C.forwardRef(function(e,t){const{width:n,height:o,itemCount:i,itemOffsetMapping:s,children:S,itemData:a=void 0,itemKey:g=ue,layout:f="vertical",useIsScrolling:d=!1}=e,l=s.itemOffset(i),c=C.useRef(null),{scrollOffset:z,renderOffset:u,renderSize:w,onScroll:x,doScrollTo:L}=U(l),y=ne(c),O=f==="vertical";C.useImperativeHandle(t,()=>({scrollTo(h){const m=c.current;m&&(O?m.scrollTo(0,L(h,m.clientHeight)):m.scrollTo(L(h,m.clientWidth),0))},scrollToItem(h){this.scrollTo(s.itemOffset(h))}}),[s]);function F(h){if(O){const{clientHeight:m,scrollHeight:D,scrollTop:b,scrollLeft:E}=h.currentTarget,v=x(m,D,b);v!=b&&c.current&&c.current.scrollTo(E,v)}else{const{clientWidth:m,scrollWidth:D,scrollTop:b,scrollLeft:E}=h.currentTarget,v=x(m,D,E);v!=E&&c.current&&c.current.scrollTo(v,b)}}const[A,P,W]=N(i,s,O?o:n,z+u),K=S;let H=P-u,V,j;return M.jsx("div",{onScroll:F,ref:c,style:{position:"relative",height:o,width:n,overflow:"auto",willChange:"transform"},children:M.jsx("div",{style:{height:O?w:"100%",width:O?"100%":w},children:W.map((h,m)=>(j=H,H+=h,V=A+m,M.jsx(K,{data:a,index:V,isScrolling:d?y:void 0,style:{position:"absolute",top:O?j:void 0,left:O?void 0:j,height:O?h:"100%",width:O?"100%":h}},g(V,a))))})})});class ae{constructor(e){Object.defineProperty(this,"fixedItemSize",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),this.fixedItemSize=e}itemSize(e){return this.fixedItemSize}itemOffset(e){return e*this.fixedItemSize}offsetToItem(e){const t=Math.floor(e/this.fixedItemSize),n=t*this.fixedItemSize;return[t,n]}}function we(r){return new ae(r)}class de{constructor(e,t){Object.defineProperty(this,"defaultItemSize",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),Object.defineProperty(this,"sizes",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),this.defaultItemSize=e,this.sizes=t}itemSize(e){return e<this.sizes.length?this.sizes[e]:this.defaultItemSize}itemOffset(e){var t=0;let n=this.sizes.length;e>n?t=(e-n)*this.defaultItemSize:n=e;for(let o=0;o<n;o++)t+=this.sizes[o];return t}offsetToItem(e){var t=0;const n=this.sizes.length;for(let i=0;i<n;i++){const s=this.sizes[i];if(t+s>e)return[i,t];t+=s}const o=Math.floor((e-t)/this.defaultItemSize);return t+=o*this.defaultItemSize,[o+n,t]}}function Oe(r,e){return new de(r,e||[])}export{Se as V,we as a,me as b,Oe as u};
//# sourceMappingURL=index-SSYFzs9A.js.map
