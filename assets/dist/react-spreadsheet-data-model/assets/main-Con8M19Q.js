var Se=Object.defineProperty;var ge=(t,e,r)=>e in t?Se(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r;var X=(t,e,r)=>ge(t,typeof e!="symbol"?e+"":e,r);import{r as V,R as w,j as d,f as we,d as Ce,a as pe}from"./vendor-BtTeP8fd.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function r(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(n){if(n.ep)return;n.ep=!0;const s=r(n);fetch(n.href,s)}})();function Re(t){let e=0;for(let r=0;r<t.length;r++)e=t.charCodeAt(r)-64+e*26;return e-1}function ve(t){let e="";for(t++;t>0;){t--;const r=t%26;t=Math.floor(t/26),e=String.fromCharCode(65+r)+e}return e}function Oe(t){const e=/^([A-Z]*)(\d*)$/,r=t.match(e);if(!r)return[void 0,void 0];const o=r[1],n=parseInt(r[2]);return[n>0?n-1:void 0,o||void 0]}function xe(t){const[e,r]=Oe(t);return[e,r?Re(r):void 0]}function te(t,e,r,o){if(t==0)return[0,0,[]];let[n,s]=e.offsetToItem(o);n=Math.max(0,Math.min(t-1,n));const c=o+r,T=1,a=1;for(let l=0;l<T&&n>0;l++)n--,s-=e.itemSize(n);const I=n;let y=s;const S=[];for(;y<c&&n<t;){const l=e.itemSize(n);S.push(l),y+=l,n++}for(let l=0;l<a&&n<t;l++){const p=e.itemSize(n);S.push(p),n++}return[I,s,S]}const Te=6e6,ye=100;function re(t,e=Te,r=ye){let o=0,n=0,s=0;t<e?(o=n=t,s=1):(o=e,n=o/r,s=Math.floor(t/n));function c(l){return l<=0?0:l>=s-1?t-o:Math.round((l-1)*(t-o)/(s-3))}const T={scrollOffset:0,renderOffset:0,page:0,scrollDirection:"forward"},[a,I]=V.useState(T);function y(l,p,m){if(a.scrollOffset==m)return[m,a];let R=Math.max(0,Math.min(m,p-l));const v=a.scrollOffset<=R?"forward":"backward";let g,u,_=m;if(Math.abs(R-a.scrollOffset)<l)g=Math.min(s-1,Math.floor((m+a.renderOffset)/n)),u=c(g),g!=a.page&&(R=m+a.renderOffset-u,_=R);else{if(R<n)g=0;else if(R>=o-n)g=s-1;else{const D=(t-n*2)/(o-n*2);g=Math.min(s-3,Math.floor((R-n)*D/n))+1}u=c(g)}const N={scrollOffset:R,renderOffset:u,page:g,scrollDirection:v};return I(N),[_,N]}function S(l,p){const m=Math.min(t-p,Math.max(l,0)),R=a.scrollOffset+a.renderOffset<=m?"forward":"backward",v=Math.min(s-1,Math.floor(m/n)),g=c(v),u=m-g;return I({scrollOffset:u,renderOffset:g,page:v,scrollDirection:R}),u}return{...a,renderSize:o,onScroll:y,doScrollTo:S}}function Z(t){return t.addEventListener!==void 0}function ue(t,e,r=window,o={}){const n=V.useRef(),{capture:s,passive:c,once:T}=o;V.useEffect(()=>{n.current=e},[e]),V.useEffect(()=>{if(!r)return;const a=Z(r)?r:r.current;if(!a)return;const I=S=>{var l;return(l=n.current)==null?void 0:l.call(n,S)},y={capture:s,passive:c,once:T};return a.addEventListener(t,I,y),()=>{a.removeEventListener(t,I,y)}},[t,r,s,c,T])}if(import.meta.vitest){const{it:t,expect:e}=import.meta.vitest;t("isListener",()=>{e(Z(window)).toBe(!0),e(Z(document)).toBe(!0),e(Z(document.createElement("div"))).toBe(!0),e(Z(V.createRef())).toBe(!1)})}function Ie(t,e,r){const o=V.useRef(),n=V.useRef(t);V.useEffect(()=>{n.current=t},[t]);const s=performance.now();V.useEffect(()=>{function c(){o.current=void 0,e!==null&&(performance.now()-s>=e?n.current():o.current=requestAnimationFrame(c))}return c(),()=>{typeof o.current=="number"&&(cancelAnimationFrame(o.current),o.current=void 0)}},[s,e,r])}const Ne=150,_e=500;function me(t=window){const[e,r]=V.useState(0),o="onscrollend"in window,n=o?_e:Ne;return ue("scroll",()=>r(s=>s+1),t),ue("scrollend",()=>r(0),o?t:null),Ie(()=>r(0),e==0?null:n,e),e>0}const Me=(t,e,r)=>`${t}:${e}`,ze=w.forwardRef(function(e,r){const{width:o,height:n,rowCount:s,rowOffsetMapping:c,columnCount:T,columnOffsetMapping:a,children:I,className:y,innerClassName:S,itemData:l=void 0,itemKey:p=Me,onScroll:m,useIsScrolling:R=!1}=e,v=c.itemOffset(s),g=a.itemOffset(T),u=w.useRef(null),{scrollOffset:_,renderOffset:M,renderSize:N,onScroll:D,doScrollTo:O}=re(v,e.maxCssSize,e.minNumPages),{scrollOffset:j,renderOffset:W,renderSize:K,onScroll:E,doScrollTo:$}=re(g,e.maxCssSize,e.minNumPages),U=me(u);w.useImperativeHandle(r,()=>({scrollTo(P,b){const z=u.current;if(z){const A={};P!=null&&(A.top=O(P,z.clientHeight)),b!=null&&(A.left=$(b,z.clientWidth)),z.scrollTo(A)}},scrollToItem(P,b){const z=P!=null?c.itemOffset(P):void 0,A=b!=null?a.itemOffset(b):void 0;this.scrollTo(z,A)},get clientWidth(){return u.current?u.current.clientWidth:0},get clientHeight(){return u.current?u.current.clientHeight:0}}),[c,a,O,$]);function q(P){const{clientWidth:b,clientHeight:z,scrollWidth:A,scrollHeight:he,scrollLeft:ie,scrollTop:le}=P.currentTarget,[ce,k]=D(z,he,le),[ae,ee]=E(b,A,ie);u.current&&(ce!=le||ae!=ie)&&u.current.scrollTo(ae,ce),m==null||m(k.scrollOffset+k.renderOffset,ee.scrollOffset+ee.renderOffset,k,ee)}const[G,F,B]=te(s,c,n,_+M),[x,i,f]=te(T,a,o,j+W),h=I,C=e.outerComponent||"div",L=e.innerComponent||"div";let H=F-M,Q=0,oe=0,J=0,Y=0,se=0;return d.jsx(C,{className:y,onScroll:q,ref:u,style:{position:"relative",height:n,width:o,overflow:"auto",willChange:"transform"},children:d.jsx(L,{className:S,style:{height:N,width:K},children:B.map((P,b)=>(oe=H,H+=P,Q=G+b,J=i-W,d.jsx(V.Fragment,{children:f.map((z,A)=>(se=J,J+=z,Y=x+A,d.jsx(h,{data:l,rowIndex:Q,columnIndex:Y,isScrolling:R?U:void 0,style:{position:"absolute",top:oe,height:P,left:se,width:z}},p(Q,Y,l))))},p(Q,0,l))))})})}),Ve=(t,e)=>t,fe=w.forwardRef(function(e,r){const{width:o,height:n,itemCount:s,itemOffsetMapping:c,children:T,className:a,innerClassName:I,itemData:y=void 0,itemKey:S=Ve,layout:l="vertical",onScroll:p,useIsScrolling:m=!1}=e,R=c.itemOffset(s),v=w.useRef(null),{scrollOffset:g,renderOffset:u,renderSize:_,onScroll:M,doScrollTo:N}=re(R,e.maxCssSize,e.minNumPages),D=me(v),O=l==="vertical";w.useImperativeHandle(r,()=>({scrollTo(x){const i=v.current;i&&(O?i.scrollTo(0,N(x,i.clientHeight)):i.scrollTo(N(x,i.clientWidth),0))},scrollToItem(x){this.scrollTo(c.itemOffset(x))}}),[c,O,N]);function j(x){if(O){const{clientHeight:i,scrollHeight:f,scrollTop:h,scrollLeft:C}=x.currentTarget,[L,H]=M(i,f,h);L!=h&&v.current&&v.current.scrollTo(C,L),p==null||p(H.scrollOffset+H.renderOffset,H)}else{const{clientWidth:i,scrollWidth:f,scrollTop:h,scrollLeft:C}=x.currentTarget,[L,H]=M(i,f,C);L!=C&&v.current&&v.current.scrollTo(L,h),p==null||p(H.scrollOffset+H.renderOffset,H)}}const[W,K,E]=te(s,c,O?n:o,g+u),$=T,U=e.outerComponent||"div",q=e.innerComponent||"div";let G=K-u,F,B;return d.jsx(U,{className:a,onScroll:j,ref:v,style:{position:"relative",height:n,width:o,overflow:"auto",willChange:"transform"},children:d.jsx(q,{className:I,style:{height:O?_:"100%",width:O?"100%":_},children:E.map((x,i)=>(B=G,G+=x,F=W+i,d.jsx($,{data:y,index:F,isScrolling:m?D:void 0,style:{position:"absolute",top:O?B:void 0,left:O?void 0:B,height:O?x:"100%",width:O?"100%":x}},S(F,y))))})})});class je{constructor(e){X(this,"fixedItemSize");this.fixedItemSize=e}itemSize(e){return this.fixedItemSize}itemOffset(e){return e*this.fixedItemSize}offsetToItem(e){const r=Math.floor(e/this.fixedItemSize),o=r*this.fixedItemSize;return[r,o]}}function de(t){return new je(t)}const ne=w.forwardRef(({style:t,...e},r)=>d.jsx("div",{ref:r,style:{...t,overflow:"hidden"},...e}));ne.displayName="HideScrollBar";function Ee(t,e){return t&&e?t+" "+e:t||e}const Le={leap1900:!1,dateSpanLarge:!0};function He(t,e,r,o){const n=t.getCellValue(e,r,o);if(n==null)return"";if(typeof n=="object")return n.value;if(typeof n=="string"&&n[0]=="'")return n.substring(1);let s=t.getCellFormat(e,r,o);return s===void 0&&(s=""),we(s,n,Le)}function Pe(t){var x;const{theme:e,data:r,minRowCount:o=100,minColumnCount:n=26,maxRowCount:s=1e12,maxColumnCount:c=1e12}=t,T=de(100),a=de(30),I=w.useRef(null),y=w.useRef(null),S=w.useRef(null),l=w.useRef(!1),p=w.useCallback(i=>r.subscribe(i),[r]),m=w.useSyncExternalStore(p,r.getSnapshot.bind(r),(x=r.getServerSnapshot)==null?void 0:x.bind(r)),[R,v]=w.useState(""),[g,u]=w.useState(0),[_,M]=w.useState(0),[N,D]=w.useState([void 0,void 0]),O=r.getRowCount(m),j=Math.max(o,O,g+1),W=a.itemOffset(j),K=r.getColumnCount(m),E=Math.max(n,K,_+1),$=T.itemOffset(E);w.useLayoutEffect(()=>{var i;l.current&&(l.current=!1,(i=S.current)==null||i.scrollToItem(N[0],N[1]))},[N]);function U(i,f){var h,C;(h=I.current)==null||h.scrollTo(f),(C=y.current)==null||C.scrollTo(i),i==0?u(0):S.current&&i+S.current.clientHeight==W&&g<j&&j<s&&u(j),f==0?M(0):S.current&&f+S.current.clientWidth==$&&_<E&&E<c&&M(E)}function q(i){var L;if(i.key!=="Enter")return;let f=!1,[h,C]=xe(R);h!==void 0&&(h>=s&&(h=s-1),h>g?(u(h),f=!0):h==0&&u(0)),C!==void 0&&(C>=c&&(C=c-1),C>_?(M(C),f=!0):C==0&&M(0)),D([h,C]),f?l.current=!0:(L=S.current)==null||L.scrollToItem(h,C)}const G=({index:i,style:f})=>d.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Column,style:f,children:ve(i)}),F=({index:i,style:f})=>d.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Row,style:f,children:i+1}),B=({rowIndex:i,columnIndex:f,style:h})=>d.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Cell,style:h,children:i<O&&f<K?He(r,m,i,f):""});return d.jsxs("div",{className:Ee(t.className,e==null?void 0:e.VirtualSpreadsheet),style:{display:"grid",gridTemplateColumns:"100px 1fr",gridTemplateRows:"50px 50px 1fr"},children:[d.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Name,style:{gridColumnStart:1,gridColumnEnd:3},children:d.jsxs("label",{children:["Scroll To Row, Column or Cell:",d.jsx("input",{type:"text",value:R,height:200,onChange:i=>{var f;v((f=i.target)==null?void 0:f.value)},onKeyUp:q})]})}),d.jsx("div",{}),d.jsx(fe,{ref:I,className:e==null?void 0:e.VirtualSpreadsheet_ColumnHeader,outerComponent:ne,height:50,itemCount:E,itemOffsetMapping:T,layout:"horizontal",maxCssSize:t.maxCssSize,minNumPages:t.minNumPages,width:t.width,children:G}),d.jsx(fe,{ref:y,className:e==null?void 0:e.VirtualSpreadsheet_RowHeader,outerComponent:ne,height:t.height,itemCount:j,itemOffsetMapping:a,maxCssSize:t.maxCssSize,minNumPages:t.minNumPages,width:100,children:F}),d.jsx(ze,{className:e==null?void 0:e.VirtualSpreadsheet_Grid,ref:S,onScroll:U,height:t.height,rowCount:j,rowOffsetMapping:a,columnCount:E,columnOffsetMapping:T,maxCssSize:t.maxCssSize,minNumPages:t.minNumPages,width:t.width,children:B})]})}const be="_VirtualSpreadsheet_ColumnHeader_1sf9h_1",Ae="_VirtualSpreadsheet_RowHeader_1sf9h_1",De="_VirtualSpreadsheet_Grid_1sf9h_1",Fe={VirtualSpreadsheet_ColumnHeader:be,VirtualSpreadsheet_RowHeader:Ae,VirtualSpreadsheet_Grid:De},Be=["Date","Time","Item","Price","Quantity","Cost","Tax Rate","Tax","Subtotal","Transaction Fee","Total","Running Total"],We=["First","Last","Count","Average","Max","Total","Min","Total","Total","Total","Total","Running Total"];class Ke{constructor(){X(this,"count");X(this,"base");this.count=1e6;const r=Ce(new Date)||0;this.base=r-this.count/(24*60)}subscribe(e){const r=setInterval(()=>{this.count++,e()},6e4);return()=>{clearInterval(r)}}getSnapshot(){return this.count}getRowCount(e){return e+4}getColumnCount(e){return 12}dateTime(e){return this.base+e/(24*60)}totalRow(e,r){switch(r){case 0:return this.dateTime(1);case 1:return this.dateTime(e);case 2:return e;case 3:return .01;case 4:return 80;case 5:return .8*e;case 6:return .15;case 7:return .12*e;case 8:return .92*e;case 9:return .08*e;case 10:return e;case 11:return e}}getCellValue(e,r,o){if(r==0)return Be[o];if(r==e+1)return;if(r==e+2)return We[o];if(r==e+3)return this.totalRow(e,o);const n=this.dateTime(r);switch(o){case 0:return n;case 1:return n;case 2:return"Nails";case 3:return .01;case 4:return 80;case 5:return .8;case 6:return .15;case 7:return .12;case 8:return .92;case 9:return .08;case 10:return 1;case 11:return r}}getCellFormat(e,r,o){if(r==e+3&&o==1)return"yyyy-mm-dd";switch(o){case 0:return"yyyy-mm-dd";case 1:return"hh:mm";case 6:return"0%";case 3:case 5:case 7:case 8:case 9:case 10:case 11:return"$0.00";default:return}}}const $e=new Ke;function Ge(){return d.jsx(Pe,{data:$e,theme:Fe,height:300,minColumnCount:0,width:600})}pe.render(d.jsx(w.StrictMode,{children:d.jsx(Ge,{})}),document.getElementById("root"));
//# sourceMappingURL=main-Con8M19Q.js.map
