var Ie=Object.defineProperty;var Me=(r,e,n)=>e in r?Ie(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var oe=(r,e,n)=>Me(r,typeof e!="symbol"?e+"":e,n);import{R as O,j as d,r as L,f as Ne,d as He,c as De}from"./vendor-YjzDBCDF.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))t(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&t(l)}).observe(document,{childList:!0,subtree:!0});function n(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function t(o){if(o.ep)return;o.ep=!0;const s=n(o);fetch(o.href,s)}})();function Le(r){let e=0;for(let n=0;n<r.length;n++)e=r.charCodeAt(n)-64+e*26;return e-1}function ae(r){let e="";for(r++;r>0;){r--;const n=r%26;r=Math.floor(r/26),e=String.fromCharCode(65+n)+e}return e}function Ee(r){const e=/^([A-Z]*)(\d*)$/,n=r.match(e);if(!n)return[void 0,void 0];const t=n[1],o=parseInt(n[2]);return[o>0?o-1:void 0,t||void 0]}function Ae(r){const[e,n]=Ee(r);return[e,n?Le(n):void 0]}function Fe(r,e){return r!==void 0?e!==void 0?ae(e)+(r+1):(r+1).toString():e!==void 0?ae(e):""}const We=({...r},e)=>d.jsx("div",{ref:e,...r}),Z=O.forwardRef(function({render:e=We,...n},t){return e(n,t)});function he(r){const{children:e,className:n,style:t}=r,[o,s]=O.useState(0),[l,m]=O.useState(0),v=O.useRef(null),g=O.useCallback(h=>{h.forEach(C=>{const j=Math.round(C.contentBoxSize[0].inlineSize);s(j);const V=Math.round(C.borderBoxSize[0].blockSize);m(V)})},[]);O.useLayoutEffect(()=>{const h=v.current;if(h&&(m(h.clientHeight),s(h.clientWidth),typeof ResizeObserver<"u")){const C=new ResizeObserver(g);return C.observe(h),()=>{C.disconnect()}}},[g]);const _=l>0&&o>0;return d.jsx("div",{ref:v,className:n,style:t,children:d.jsx("div",{style:{overflow:"visible",width:0,height:0},children:_&&e({height:l,width:o})})})}const Pe=6e6,Be=100;function _e(r,e=Pe,n=Be,t=!0){let o=0,s=0,l=0;r<e?(o=s=r,l=1):(o=e,s=o/n,l=Math.floor(r/s));function m(c){return c<=0?0:c>=l-1?r-o:Math.round((c-1)*(r-o)/(l-3))}const v={scrollOffset:0,renderOffset:0,page:0,scrollDirection:"forward"},[g,_]=L.useState(0),h=L.useRef(v);function C(c,R,S){const u=h.current;if(u.scrollOffset==S)return[S,u];let p=Math.max(0,Math.min(S,R-c));const w=u.scrollOffset<=p?"forward":"backward";let f,y,z=S;if(Math.abs(p-u.scrollOffset)<c)f=Math.min(l-1,Math.floor((S+u.renderOffset)/s)),y=m(f),f!=u.page&&(p=S+u.renderOffset-y,z=p);else{if(p<s)f=0;else if(p>=o-s)f=l-1;else{const M=(r-s*2)/(o-s*2);f=Math.min(l-3,Math.floor((p-s)*M/s))+1}y=m(f)}const b={scrollOffset:p,renderOffset:y,page:f,scrollDirection:w};return h.current=b,t&&_(p+y),[z,b]}function j(c,R){const S=h.current,u=Math.min(r-R,Math.max(c,0)),p=S.scrollOffset+S.renderOffset<=u?"forward":"backward",w=Math.min(l-1,Math.floor(u/s)),f=m(w),y=u-f;return h.current={scrollOffset:y,renderOffset:f,page:w,scrollDirection:p},t&&_(y+f),y}function V(){const c=h.current;return c.scrollOffset+c.renderOffset}return{totalOffset:g,renderSize:o,onScroll:C,doScrollTo:j,getCurrentOffset:V,scrollState:h}}function ie(r){return r.addEventListener!==void 0}function ge(r,e,n=window,t={}){const o=L.useRef(),{capture:s,passive:l,once:m}=t;L.useEffect(()=>{o.current=e},[e]),L.useEffect(()=>{if(!n)return;const v=ie(n)?n:n.current;if(!v)return;const g=h=>{var C;return(C=o.current)==null?void 0:C.call(o,h)},_={capture:s,passive:l,once:m};return v.addEventListener(r,g,_),()=>{v.removeEventListener(r,g,_)}},[r,n,s,l,m])}if(import.meta.vitest){const{it:r,expect:e}=import.meta.vitest;r("isListener",()=>{e(ie(window)).toBe(!0),e(ie(document)).toBe(!0),e(ie(document.createElement("div"))).toBe(!0),e(ie(L.createRef())).toBe(!1)})}function ke(r,e,n){const t=L.useRef(),o=L.useRef(r);L.useEffect(()=>{o.current=r},[r]);const s=performance.now();L.useEffect(()=>{function l(){t.current=void 0,e!==null&&(performance.now()-s>=e?o.current():t.current=requestAnimationFrame(l))}return l(),()=>{typeof t.current=="number"&&(cancelAnimationFrame(t.current),t.current=void 0)}},[s,e,n])}const $e=150,Ge=500;function Ke(r=window){const[e,n]=L.useState(0),t="onscrollend"in window,o=t?Ge:$e;return ge("scroll",()=>n(s=>s+1),r),ge("scrollend",()=>n(0),t?r:null),ke(()=>n(0),e==0?null:o,e),e>0}function le(r,e,n,t,o){if(r===void 0)return;if(o!="visible"||r<t)return r;e=e||0;const s=r+e,l=t+n;if(!(s<=l))return e>n?r:r-n+e}const Se=O.forwardRef(function(e,n){const{width:t,height:o,scrollWidth:s=0,scrollHeight:l=0,className:m,innerClassName:v,children:g,onScroll:_,useIsScrolling:h=!1,useOffsets:C=!0,innerRender:j,outerRender:V}=e,c=O.useRef(null),{totalOffset:R,renderSize:S,onScroll:u,doScrollTo:p,getCurrentOffset:w}=_e(l,e.maxCssSize,e.minNumPages,C),{totalOffset:f,renderSize:y,onScroll:z,doScrollTo:E,getCurrentOffset:b}=_e(s,e.maxCssSize,e.minNumPages,C),M=Ke(c);O.useImperativeHandle(n,()=>({scrollTo(H,N){if(H===void 0&&N===void 0)return;const D=c.current;if(D){const B={};H!=null&&(B.top=p(H,D.clientHeight)),N!=null&&(B.left=E(N,D.clientWidth)),D.scrollTo(B)}},scrollToArea(H,N,D,B,Y){const A=c.current;if(!A)return;const $=le(H,N,A.clientHeight,R,Y),W=le(D,B,A.clientWidth,f,Y);this.scrollTo($,W)},get clientWidth(){return c.current?c.current.clientWidth:0},get clientHeight(){return c.current?c.current.clientHeight:0},get verticalOffset(){return w()},get horizontalOffset(){return b()}}),[p,E,R,f,w,b]);function q(H){const{clientWidth:N,clientHeight:D,scrollWidth:B,scrollHeight:Y,scrollLeft:A,scrollTop:$}=H.currentTarget,[W,J]=u(D,Y,$),[ee,te]=z(N,B,A);c.current&&(W!=$||ee!=A)&&c.current.scrollTo(ee,W),_==null||_(J.scrollOffset+J.renderOffset,te.scrollOffset+te.renderOffset,J,te)}const X=h?M:void 0,F=R,Q=f;return d.jsxs(Z,{className:m,render:V,onScroll:q,ref:c,style:{position:"relative",height:o,width:t,overflow:"auto",willChange:"transform"},children:[d.jsx(Z,{className:v,render:j,style:{zIndex:1,position:"sticky",top:0,left:0,width:"100%",height:"100%"},children:g({isScrolling:X,verticalOffset:F,horizontalOffset:Q})}),d.jsx("div",{style:{position:"absolute",top:0,left:0,height:l?S:"100%",width:s?y:"100%"}})]})});function ue(r,e,n,t){if(r==0)return[0,0,0,[]];if(t<0&&(n+=t,t=0),n<=0)return[0,0,0,[]];const[o,s]=e.offsetToItem(t);if(o>=r)return[0,0,0,[]];let l=Math.max(0,Math.min(r-1,o));const m=t+n,v=l;let g=s;const _=[];let h=0;for(;g<m&&l<r;){const C=e.itemSize(l);_.push(C),h+=C,g+=C,l++}return[v,s,h,_]}function Ce(r,e){return r==1?`${e}px`:`repeat(${r},${e}px)`}function we(r,e){return r?r+" "+e:e}function fe(r){const e=r.length;if(e==0)return;let n,t=r[0],o=1;for(let l=1;l<e;l++){const m=r[l];if(m==t)o++;else{const v=Ce(o,t);n=we(n,v),t=m,o=1}}const s=Ce(o,t);return we(n,s)}const Ue=(r,e)=>r,qe={boxSizing:"border-box"};function de(r){const{width:e,height:n,itemCount:t,itemOffsetMapping:o,className:s,innerClassName:l,offset:m,children:v,itemData:g,itemKey:_=Ue,layout:h="vertical",outerRender:C,innerRender:j,isScrolling:V}=r,c=h==="vertical",[R,S,u,p]=ue(t,o,c?n:e,m),w=fe(p),f=S-m,y=v;return d.jsx(Z,{className:s,render:C,style:{position:"relative",height:n,width:e,overflow:"hidden",willChange:"transform"},children:d.jsx(Z,{className:l,render:j,style:{position:"absolute",display:"grid",gridTemplateColumns:c?void 0:w,gridTemplateRows:c?w:void 0,top:c?f:0,left:c?0:f,height:c?u:"100%",width:c?"100%":u},children:p.map((z,E)=>d.jsx(y,{data:g,isScrolling:V,index:R+E,style:qe},_(R+E,g)))})})}const Xe=(r,e,n)=>`${r}:${e}`,Ye={boxSizing:"border-box"};function Oe(r){const{width:e,height:n,rowCount:t,rowOffsetMapping:o,columnCount:s,columnOffsetMapping:l,className:m,innerClassName:v,rowOffset:g,columnOffset:_,children:h,itemData:C,itemKey:j=Xe,outerRender:V,innerRender:c,isScrolling:R}=r,[S,u,p,w]=ue(t,o,n,g),f=fe(w),[y,z,E,b]=ue(s,l,e,_),M=fe(b),q=u-g,X=z-_,F=h;return d.jsx(Z,{className:m,render:V,style:{position:"relative",height:n,width:e,overflow:"hidden",willChange:"transform"},children:d.jsx(Z,{className:v,render:c,style:{position:"absolute",display:"grid",gridTemplateColumns:M,gridTemplateRows:f,top:q,left:X,height:p,width:E},children:w.map((Q,H)=>d.jsx(L.Fragment,{children:b.map((N,D)=>d.jsx(F,{data:C,isScrolling:R,rowIndex:S+H,columnIndex:y+D,style:Ye},j(S+H,y+D,C)))},j(S+H,0,C)))})})}function ce(r,e){return r===void 0?[void 0,void 0]:[e.itemOffset(r),e.itemSize(r)]}function Ze(r,e,n,t,o,s){const l=r.current;if(!l)return;const[m,v]=ce(t,e),[g,_]=ce(o,n);l.scrollToArea(m,v,g,_,s)}O.forwardRef(function(e,n){const{rowCount:t,rowOffsetMapping:o,columnCount:s,columnOffsetMapping:l,children:m,innerClassName:v,innerRender:g,itemData:_,itemKey:h,onScroll:C,...j}=e,V=o.itemOffset(t),c=l.itemOffset(s),R=O.useRef(null);O.useImperativeHandle(n,()=>({scrollTo(u,p){const w=R.current;w&&w.scrollTo(u,p)},scrollToItem(u,p,w){Ze(R,o,l,u,p,w)},get clientWidth(){return R.current?R.current.clientWidth:0},get clientHeight(){return R.current?R.current.clientHeight:0},get verticalOffset(){return R.current?R.current.verticalOffset:0},get horizontalOffset(){return R.current?R.current.horizontalOffset:0}}),[o,l]);const S=m;return d.jsx(Se,{ref:R,...j,scrollHeight:V,scrollWidth:c,onScroll:(u,p,w,f)=>{C&&C(u,p,w,f)},children:({isScrolling:u,verticalOffset:p,horizontalOffset:w})=>d.jsx(he,{style:{height:"100%",width:"100%"},children:({height:f,width:y})=>d.jsx(Oe,{innerClassName:v,innerRender:g,rowOffset:p,columnOffset:w,height:f,rowCount:t,columnCount:s,itemData:_,itemKey:h,isScrolling:u,rowOffsetMapping:o,columnOffsetMapping:l,width:y,children:S})})})});function Qe(r,e,n,t,o){const s=r.current;if(!s)return;const l=e.itemOffset(t),m=e.itemSize(t);n?s.scrollToArea(l,m,void 0,void 0,o):s.scrollToArea(void 0,void 0,l,m,o)}O.forwardRef(function(e,n){const{itemCount:t,itemOffsetMapping:o,children:s,layout:l="vertical",onScroll:m,innerClassName:v,innerRender:g,itemData:_,itemKey:h,...C}=e,j=o.itemOffset(t),V=O.useRef(null),c=l==="vertical";O.useImperativeHandle(n,()=>({scrollTo(S){const u=V.current;u&&(c?u.scrollTo(S,void 0):u.scrollTo(void 0,S))},scrollToItem(S,u){Qe(V,o,c,S,u)},get offset(){const S=V.current;return S?c?S.verticalOffset:S.horizontalOffset:0}}),[o,c]);const R=s;return d.jsx(Se,{ref:V,...C,scrollHeight:c?j:void 0,scrollWidth:c?void 0:j,onScroll:(S,u,p,w)=>{m&&m(c?S:u,c?p:w)},children:({isScrolling:S,verticalOffset:u,horizontalOffset:p})=>d.jsx(he,{style:{height:"100%",width:"100%"},children:({height:w,width:f})=>d.jsx(de,{innerClassName:v,innerRender:g,layout:l,offset:c?u:p,height:w,itemCount:t,itemData:_,itemKey:h,isScrolling:S,itemOffsetMapping:o,width:f,children:R})})})});class Je{constructor(e,n){oe(this,"defaultItemSize");oe(this,"sizes");this.defaultItemSize=e,this.sizes=n}itemSize(e){return e<this.sizes.length?this.sizes[e]:this.defaultItemSize}itemOffset(e){let n=0,t=this.sizes.length;e>t?n=(e-t)*this.defaultItemSize:t=e;for(let o=0;o<t;o++)n+=this.sizes[o];return n}offsetToItem(e){let n=0;const t=this.sizes.length;for(let s=0;s<t;s++){const l=this.sizes[s];if(n+l>e)return[s,n];n+=l}const o=Math.floor((e-n)/this.defaultItemSize);return n+=o*this.defaultItemSize,[o+t,n]}}function Re(r,e){return new Je(r,e||[])}function se(...r){let e;return r.forEach(n=>{e&&n?e=e+" "+n:n&&(e=n)}),e}function U(r,e){return r?e:void 0}const et={leap1900:!1,dateSpanLarge:!0};function tt(r,e,n,t){const o=r.getCellValue(e,n,t);if(o==null)return"";if(typeof o=="object")return o.value;if(typeof o=="string"&&o[0]=="'")return o.substring(1);let s=r.getCellFormat(e,n,t);return s===void 0&&(s=""),Ne(s,o,et)}function ve({index:r,data:e,style:n}){return e(r,n)}function rt({rowIndex:r,columnIndex:e,data:n,style:t}){return n(r,e,t)}function nt(r){var pe;const{width:e,height:n,theme:t,data:o,minRowCount:s=100,minColumnCount:l=26,maxRowCount:m=1e12,maxColumnCount:v=1e12}=r,g=Re(100,[160]),_=Re(30,[70]),h=O.useRef(null),C=O.useRef(null),j=O.useCallback(i=>o.subscribe(i),[o]),V=O.useSyncExternalStore(j,o.getSnapshot.bind(o),(pe=o.getServerSnapshot)==null?void 0:pe.bind(o)),[c,R]=O.useState(""),[S,u]=O.useState(0),[p,w]=O.useState(0),[f,y]=O.useState([void 0,void 0]),[z,E]=O.useState(null),[[b,M],q]=O.useState([0,0]),X=o.getRowCount(V),F=Math.max(s,X,S+1,z?z[0]+1:0),Q=_.itemOffset(F),H=o.getColumnCount(V),N=Math.max(l,H,p+1,z?z[1]+1:0),D=g.itemOffset(N);O.useEffect(()=>{var i;(i=h.current)==null||i.scrollTo(b,M)},[b,M]),O.useEffect(()=>{var i;(i=C.current)==null||i.focus({preventScroll:!0})},[z]);function B(i,a){i==b&&a==M||(i==0?u(0):h.current&&i+h.current.clientHeight==Q&&S<F&&F<m&&u(F),a==0?w(0):h.current&&a+h.current.clientWidth==D&&p<N&&N<v&&w(N),q([i,a]))}function Y(i,a){E(i===void 0&&a===void 0?null:[i||0,a||0])}function A(i,a){y([i,a]),R(Fe(i,a)),Y(i,a)}function $(i,a){const I=h.current;if(!I)return;const P=ce(i,_),x=ce(a,g),T=le(...P,I.clientHeight,b,"visible"),k=le(...x,I.clientWidth,M,"visible");(T!==void 0||k!==void 0)&&q([T===void 0?b:T,k===void 0?M:k])}function W(i,a){if(i!==void 0){if(i<0)return;i>=m&&(i=m-1),i>S?u(i):i==0&&u(0)}if(a!==void 0){if(a<0)return;a>=v&&(a=v-1),a>p?w(a):a==0&&w(0)}A(i,a),$(i,a)}function J(i){if(i.key!=="Enter")return;const[a,I]=Ae(c);W(a,I)}function ee(i){return f[0]==null&&f[1]==i}function te(i){return f[0]!=null&&(f[1]==null||f[1]==i)}function me(i){return f[0]==i&&f[1]==null}function Te(i){return f[1]!=null&&(f[0]==null||f[0]==i)}const Ve=({...i},a)=>d.jsx("div",{ref:a,onClick:I=>{const P=I.currentTarget.getBoundingClientRect(),x=I.clientX-P.left+M,[T]=g.offsetToItem(x);A(void 0,T)},...i}),ye=({...i},a)=>d.jsx("div",{ref:a,onClick:I=>{const P=I.currentTarget.getBoundingClientRect(),x=I.clientY-P.top+b,[T]=_.offsetToItem(x);A(T,void 0)},...i}),xe=(i,a)=>d.jsx("div",{className:se(t==null?void 0:t.VirtualSpreadsheet_Column,U(ee(i),t==null?void 0:t.VirtualSpreadsheet_Column__Selected),U(te(i),t==null?void 0:t.VirtualSpreadsheet_Column__CellSelected)),style:a,children:ae(i)}),ze=(i,a)=>d.jsx("div",{className:se(t==null?void 0:t.VirtualSpreadsheet_Row,U(me(i),t==null?void 0:t.VirtualSpreadsheet_Row__Selected),U(Te(i),t==null?void 0:t.VirtualSpreadsheet_Row__CellSelected)),style:a,children:i+1}),be=({children:i,...a},I)=>{let P;if(z){const x=z[0],T=z[1],k=_.itemSize(x);let G=_.itemOffset(x)-b;G<-k?G=-k:G>n&&(G=n);const re=g.itemSize(T);let K=g.itemOffset(T)-M;K<-re?K=-re:K>e&&(K=e),P=d.jsx("input",{ref:C,className:se(t==null?void 0:t.VirtualSpreadsheet_Cell,t==null?void 0:t.VirtualSpreadsheet_Cell__Focus),type:"text",onFocus:()=>{$(x,T)},onBeforeInput:()=>{$(x,T)},onKeyDown:ne=>{switch(ne.key){case"ArrowDown":W(x+1,T),ne.preventDefault();break;case"ArrowUp":W(x-1,T),ne.preventDefault();break;case"ArrowLeft":W(x,T-1),ne.preventDefault();break;case"ArrowRight":W(x,T+1),ne.preventDefault();break}},style:{zIndex:-1,position:"absolute",top:G,height:k,left:K,width:re}})}return d.jsxs("div",{ref:I,onClick:x=>{const T=x.currentTarget.getBoundingClientRect(),k=x.clientX-T.left+M,G=x.clientY-T.top+b,[re]=_.offsetToItem(G),[K]=g.offsetToItem(k);A(re,K)},...a,children:[i,P]})},je=(i,a,I)=>{const P=i<X&&a<H?tt(o,V,i,a):"",x=z&&i==z[0]&&a==z[1],T=se(t==null?void 0:t.VirtualSpreadsheet_Cell,U(me(i),t==null?void 0:t.VirtualSpreadsheet_Cell__RowSelected),U(ee(a),t==null?void 0:t.VirtualSpreadsheet_Cell__ColumnSelected),U(x,t==null?void 0:t.VirtualSpreadsheet_Cell__Focus));return d.jsx("div",{className:T,style:I,children:P})};return d.jsxs("div",{className:se(r.className,t==null?void 0:t.VirtualSpreadsheet),style:{display:"grid",gridTemplateColumns:"100px 1fr",gridTemplateRows:"50px 50px 1fr"},children:[d.jsx("div",{className:t==null?void 0:t.VirtualSpreadsheet_Name,style:{gridColumnStart:1,gridColumnEnd:3},children:d.jsxs("label",{children:["Scroll To Row, Column or Cell:",d.jsx("input",{type:"text",value:c,height:200,onChange:i=>{var a;R((a=i.target)==null?void 0:a.value)},onKeyUp:J})]})}),d.jsx("div",{}),d.jsx(de,{offset:M,className:t==null?void 0:t.VirtualSpreadsheet_ColumnHeader,itemData:xe,outerRender:Ve,height:50,itemCount:N,itemOffsetMapping:g,layout:"horizontal",width:r.width,children:ve}),d.jsx(de,{offset:b,className:t==null?void 0:t.VirtualSpreadsheet_RowHeader,itemData:ze,outerRender:ye,height:r.height,itemCount:F,itemOffsetMapping:_,width:100,children:ve}),d.jsx(Se,{className:t==null?void 0:t.VirtualSpreadsheet_Grid,ref:h,onScroll:B,height:r.height,width:r.width,scrollHeight:Q,scrollWidth:D,useOffsets:!1,maxCssSize:r.maxCssSize,minNumPages:r.minNumPages,children:i=>d.jsx(he,{style:{height:"100%",width:"100%"},children:({height:a,width:I})=>d.jsx(Oe,{rowOffset:b,columnOffset:M,height:a,width:I,itemData:je,outerRender:be,rowCount:F,rowOffsetMapping:_,columnCount:N,columnOffsetMapping:g,children:rt})})})]})}const ot="_VirtualSpreadsheet_ColumnHeader_1sf9h_1",st="_VirtualSpreadsheet_Column_1sf9h_1",it="_VirtualSpreadsheet_Column__Selected_1sf9h_1",lt="_VirtualSpreadsheet_Column__CellSelected_1sf9h_1",ct="_VirtualSpreadsheet_RowHeader_1sf9h_1",at="_VirtualSpreadsheet_Row_1sf9h_1",ut="_VirtualSpreadsheet_Row__Selected_1sf9h_1",ft="_VirtualSpreadsheet_Row__CellSelected_1sf9h_1",dt="_VirtualSpreadsheet_Grid_1sf9h_1",ht="_VirtualSpreadsheet_Cell_1sf9h_1",St="_VirtualSpreadsheet_Cell__RowSelected_1sf9h_1",mt="_VirtualSpreadsheet_Cell__ColumnSelected_1sf9h_1",pt="_VirtualSpreadsheet_Cell__Focus_1sf9h_1",_t={VirtualSpreadsheet_ColumnHeader:ot,VirtualSpreadsheet_Column:st,VirtualSpreadsheet_Column__Selected:it,VirtualSpreadsheet_Column__CellSelected:lt,VirtualSpreadsheet_RowHeader:ct,VirtualSpreadsheet_Row:at,VirtualSpreadsheet_Row__Selected:ut,VirtualSpreadsheet_Row__CellSelected:ft,VirtualSpreadsheet_Grid:dt,VirtualSpreadsheet_Cell:ht,VirtualSpreadsheet_Cell__RowSelected:St,VirtualSpreadsheet_Cell__ColumnSelected:mt,VirtualSpreadsheet_Cell__Focus:pt},gt=["Date","Time","Item","Price","Quantity","Cost","Tax Rate","Tax","Subtotal","Transaction Fee","Total","Running Total"],Ct=["First","Last","Count","Average","Max","Total","Min","Total","Total","Total","Total","Running Total"];class wt{constructor(){oe(this,"count");oe(this,"base");this.count=1e6;const n=He(new Date)||0;this.base=n-this.count/(24*60)}subscribe(e){const n=setInterval(()=>{this.count++,e()},6e4);return()=>{clearInterval(n)}}getSnapshot(){return this.count}getRowCount(e){return e+4}getColumnCount(e){return 12}dateTime(e){return this.base+e/(24*60)}totalRow(e,n){switch(n){case 0:return this.dateTime(1);case 1:return this.dateTime(e);case 2:return e;case 3:return .01;case 4:return 80;case 5:return .8*e;case 6:return .15;case 7:return .12*e;case 8:return .92*e;case 9:return .08*e;case 10:return e;case 11:return e}}getCellValue(e,n,t){if(n==0)return gt[t];if(n==e+1)return;if(n==e+2)return Ct[t];if(n==e+3)return this.totalRow(e,t);const o=this.dateTime(n);switch(t){case 0:return o;case 1:return o;case 2:return"Nails";case 3:return .01;case 4:return 80;case 5:return .8;case 6:return .15;case 7:return .12;case 8:return .92;case 9:return .08;case 10:return 1;case 11:return n}}getCellFormat(e,n,t){if(n==e+3&&t==1)return"yyyy-mm-dd";switch(t){case 0:return"yyyy-mm-dd";case 1:return"hh:mm";case 6:return"0%";case 3:case 5:case 7:case 8:case 9:case 10:case 11:return"$0.00";default:return}}}const Rt=new wt;function vt(){return d.jsx(nt,{data:Rt,theme:_t,height:300,minColumnCount:0,width:600})}De(document.getElementById("root")).render(d.jsx(O.StrictMode,{children:d.jsx(vt,{})}));
//# sourceMappingURL=main-BDpo8XLa.js.map