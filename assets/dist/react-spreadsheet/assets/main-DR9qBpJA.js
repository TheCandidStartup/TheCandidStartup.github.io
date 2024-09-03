var Se=Object.defineProperty;var we=(t,e,l)=>e in t?Se(t,e,{enumerable:!0,configurable:!0,writable:!0,value:l}):t[e]=l;var fe=(t,e,l)=>we(t,typeof e!="symbol"?e+"":e,l);import{r as v,R as I,j as a,a as ge}from"./vendor-DnZynArw.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function l(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(r){if(r.ep)return;r.ep=!0;const n=l(r);fetch(r.href,n)}})();function ee(t,e,l,o){if(t==0)return[0,0,[]];let[r,n]=e.offsetToItem(o);r=Math.max(0,Math.min(t-1,r));const i=o+l,p=1,c=1;for(let s=0;s<p&&r>0;s++)r--,n-=e.itemSize(r);const O=r;let S=n;const d=[];for(;S<i&&r<t;){const s=e.itemSize(r);d.push(s),S+=s,r++}for(let s=0;s<c&&r<t;s++){const f=e.itemSize(r);d.push(f),r++}return[O,n,d]}const pe=6e6,Oe=100;function te(t,e=pe,l=Oe){let o=0,r=0,n=0;t<e?(o=r=t,n=1):(o=e,r=o/l,n=Math.floor(t/r));function i(s){return s<=0?0:s>=n-1?t-o:Math.round((s-1)*(t-o)/(n-3))}const p={scrollOffset:0,renderOffset:0,page:0,scrollDirection:"forward"},[c,O]=v.useState(p);function S(s,f,u){if(c.scrollOffset==u)return[u,c];let w=Math.max(0,Math.min(u,f-s));const g=c.scrollOffset<=w?"forward":"backward";let h,m,V=u;if(Math.abs(w-c.scrollOffset)<s)h=Math.min(n-1,Math.floor((u+c.renderOffset)/r)),m=i(h),h!=c.page&&(w=u+c.renderOffset-m,V=w);else{if(w<r)h=0;else if(w>=o-r)h=n-1;else{const H=(t-r*2)/(o-r*2);h=Math.min(n-3,Math.floor((w-r)*H/r))+1}m=i(h)}const M={scrollOffset:w,renderOffset:m,page:h,scrollDirection:g};return O(M),[V,M]}function d(s,f){const u=Math.min(t-f,Math.max(s,0)),w=c.scrollOffset+c.renderOffset<=u?"forward":"backward",g=Math.min(n-1,Math.floor(u/r)),h=i(g),m=u-h;return O({scrollOffset:m,renderOffset:h,page:g,scrollDirection:w}),m}return{...c,renderSize:o,onScroll:S,doScrollTo:d}}function B(t){return t.addEventListener!==void 0}function ue(t,e,l=window,o={}){const r=v.useRef(),{capture:n,passive:i,once:p}=o;v.useEffect(()=>{r.current=e},[e]),v.useEffect(()=>{if(!l)return;const c=B(l)?l:l.current;if(!c)return;const O=d=>{var s;return(s=r.current)==null?void 0:s.call(r,d)},S={capture:n,passive:i,once:p};return c.addEventListener(t,O,S),()=>{c.removeEventListener(t,O,S)}},[t,l,n,i,p])}if(import.meta.vitest){const{it:t,expect:e}=import.meta.vitest;t("isListener",()=>{e(B(window)).toBe(!0),e(B(document)).toBe(!0),e(B(document.createElement("div"))).toBe(!0),e(B(v.createRef())).toBe(!1)})}function xe(t,e,l){const o=v.useRef(),r=v.useRef(t);v.useEffect(()=>{r.current=t},[t]);const n=performance.now();v.useEffect(()=>{function i(){o.current=void 0,e!==null&&(performance.now()-n>=e?r.current():o.current=requestAnimationFrame(i))}return i(),()=>{typeof o.current=="number"&&(cancelAnimationFrame(o.current),o.current=void 0)}},[n,e,l])}const Ce=150,Re=500;function me(t=window){const[e,l]=v.useState(0),o="onscrollend"in window,r=o?Re:Ce;return ue("scroll",()=>l(n=>n+1),t),ue("scrollend",()=>l(0),o?t:null),xe(()=>l(0),e==0?null:r,e),e>0}const ve=(t,e,l)=>`${t}:${e}`,Ie=I.forwardRef(function(e,l){const{width:o,height:r,rowCount:n,rowOffsetMapping:i,columnCount:p,columnOffsetMapping:c,children:O,className:S,innerClassName:d,itemData:s=void 0,itemKey:f=ve,onScroll:u,useIsScrolling:w=!1}=e,g=i.itemOffset(n),h=c.itemOffset(p),m=I.useRef(null),{scrollOffset:V,renderOffset:E,renderSize:M,onScroll:H,doScrollTo:x}=te(g,e.maxCssSize,e.minNumPages),{scrollOffset:W,renderOffset:F,renderSize:b,onScroll:q,doScrollTo:G}=te(h,e.maxCssSize,e.minNumPages),U=me(m);I.useImperativeHandle(l,()=>({scrollTo(y,j){const _=m.current;_&&_.scrollTo(G(j,_.clientWidth),x(y,_.clientHeight))},scrollToItem(y,j){this.scrollTo(i.itemOffset(y),c.itemOffset(j))}}),[i,c,x,G]);function X(y){const{clientWidth:j,clientHeight:_,scrollWidth:Q,scrollHeight:he,scrollLeft:se,scrollTop:le}=y.currentTarget,[ie,Y]=H(_,he,le),[ce,k]=q(j,Q,se);m.current&&(ie!=le||ce!=se)&&m.current.scrollTo(ce,ie),u==null||u(Y.scrollOffset+Y.renderOffset,k.scrollOffset+k.renderOffset,Y,k)}const[$,P,A]=ee(n,i,r,V+E),[C,R,D]=ee(p,c,o,W+F),L=O,z=e.outerComponent||"div",N=e.innerComponent||"div";let T=P-E,K=0,ne=0,Z=0,J=0,oe=0;return a.jsx(z,{className:S,onScroll:X,ref:m,style:{position:"relative",height:r,width:o,overflow:"auto",willChange:"transform"},children:a.jsx(N,{className:d,style:{height:M,width:b},children:A.map((y,j)=>(ne=T,T+=y,K=$+j,Z=R-F,a.jsx(v.Fragment,{children:D.map((_,Q)=>(oe=Z,Z+=_,J=C+Q,a.jsx(L,{data:s,rowIndex:K,columnIndex:J,isScrolling:w?U:void 0,style:{position:"absolute",top:ne,height:y,left:oe,width:_}},f(K,J,s))))},f(K,0,s))))})})}),Te=(t,e)=>t,ae=I.forwardRef(function(e,l){const{width:o,height:r,itemCount:n,itemOffsetMapping:i,children:p,className:c,innerClassName:O,itemData:S=void 0,itemKey:d=Te,layout:s="vertical",onScroll:f,useIsScrolling:u=!1}=e,w=i.itemOffset(n),g=I.useRef(null),{scrollOffset:h,renderOffset:m,renderSize:V,onScroll:E,doScrollTo:M}=te(w,e.maxCssSize,e.minNumPages),H=me(g),x=s==="vertical";I.useImperativeHandle(l,()=>({scrollTo(C){const R=g.current;R&&(x?R.scrollTo(0,M(C,R.clientHeight)):R.scrollTo(M(C,R.clientWidth),0))},scrollToItem(C){this.scrollTo(i.itemOffset(C))}}),[i,x,M]);function W(C){if(x){const{clientHeight:R,scrollHeight:D,scrollTop:L,scrollLeft:z}=C.currentTarget,[N,T]=E(R,D,L);N!=L&&g.current&&g.current.scrollTo(z,N),f==null||f(T.scrollOffset+T.renderOffset,T)}else{const{clientWidth:R,scrollWidth:D,scrollTop:L,scrollLeft:z}=C.currentTarget,[N,T]=E(R,D,z);N!=z&&g.current&&g.current.scrollTo(N,L),f==null||f(T.scrollOffset+T.renderOffset,T)}}const[F,b,q]=ee(n,i,x?r:o,h+m),G=p,U=e.outerComponent||"div",X=e.innerComponent||"div";let $=b-m,P,A;return a.jsx(U,{className:c,onScroll:W,ref:g,style:{position:"relative",height:r,width:o,overflow:"auto",willChange:"transform"},children:a.jsx(X,{className:O,style:{height:x?V:"100%",width:x?"100%":V},children:q.map((C,R)=>(A=$,$+=C,P=F+R,a.jsx(G,{data:S,index:P,isScrolling:u?H:void 0,style:{position:"absolute",top:x?A:void 0,left:x?void 0:A,height:x?C:"100%",width:x?"100%":C}},d(P,S))))})})});class _e{constructor(e){fe(this,"fixedItemSize");this.fixedItemSize=e}itemSize(e){return this.fixedItemSize}itemOffset(e){return e*this.fixedItemSize}offsetToItem(e){const l=Math.floor(e/this.fixedItemSize),o=l*this.fixedItemSize;return[l,o]}}function de(t){return new _e(t)}const re=I.forwardRef(({style:t,...e},l)=>a.jsx("div",{ref:l,style:{...t,overflow:"hidden"},...e}));re.displayName="HideScrollBar";function Me(t,e){return t&&e?t+" "+e:t||e}function ye(t){const{theme:e}=t,l=de(100),o=de(30),r=I.useRef(null),n=I.useRef(null),i=I.useRef(null);function p(d,s){var f,u;(f=r.current)==null||f.scrollTo(s),(u=n.current)==null||u.scrollTo(d)}const c=({index:d,style:s})=>a.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Column,style:s,children:d}),O=({index:d,style:s})=>a.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Row,style:s,children:d}),S=({rowIndex:d,columnIndex:s,style:f})=>a.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Cell,style:f,children:`${d}:${s}`});return a.jsxs("div",{className:Me(t.className,e==null?void 0:e.VirtualSpreadsheet),style:{display:"grid",gridTemplateColumns:"100px 1fr",gridTemplateRows:"50px 50px 1fr"},children:[a.jsx("div",{className:e==null?void 0:e.VirtualSpreadsheet_Name,style:{gridColumnStart:1,gridColumnEnd:3},children:a.jsxs("label",{children:["Scroll To Row:",a.jsx("input",{type:"number",height:200,onChange:d=>{var f,u;const s=parseInt((f=d.target)==null?void 0:f.value);(u=i.current)==null||u.scrollToItem(s,0)}})]})}),a.jsx("div",{}),a.jsx(ae,{ref:r,className:e==null?void 0:e.VirtualSpreadsheet_ColumnHeader,outerComponent:re,height:50,itemCount:t.minColumnCount,itemOffsetMapping:l,layout:"horizontal",width:t.width,children:c}),a.jsx(ae,{ref:n,className:e==null?void 0:e.VirtualSpreadsheet_RowHeader,outerComponent:re,height:t.height,itemCount:t.minRowCount,itemOffsetMapping:o,width:100,children:O}),a.jsx(Ie,{className:e==null?void 0:e.VirtualSpreadsheet_Grid,ref:i,onScroll:p,height:t.height,rowCount:t.minRowCount,rowOffsetMapping:o,columnCount:t.minColumnCount,columnOffsetMapping:l,width:t.width,children:S})]})}const Ve="_VirtualSpreadsheet_ColumnHeader_1sf9h_1",Ne="_VirtualSpreadsheet_RowHeader_1sf9h_1",je="_VirtualSpreadsheet_Grid_1sf9h_1",Ee={VirtualSpreadsheet_ColumnHeader:Ve,VirtualSpreadsheet_RowHeader:Ne,VirtualSpreadsheet_Grid:je};function Le(){return a.jsx(ye,{theme:Ee,height:240,minRowCount:100,minColumnCount:26,width:600})}ge.render(a.jsx(I.StrictMode,{children:a.jsx(Le,{})}),document.getElementById("root"));
//# sourceMappingURL=main-DR9qBpJA.js.map
