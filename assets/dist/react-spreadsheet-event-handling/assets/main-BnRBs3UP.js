var Me=Object.defineProperty;var Ne=(r,e,n)=>e in r?Me(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var Ce=(r,e,n)=>Ne(r,typeof e!="symbol"?e+"":e,n);import{r as $,R as h,j as a,f as je,d as ze,a as Le}from"./vendor-BtTeP8fd.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))t(o);new MutationObserver(o=>{for(const l of o)if(l.type==="childList")for(const u of l.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&t(u)}).observe(document,{childList:!0,subtree:!0});function n(o){const l={};return o.integrity&&(l.integrity=o.integrity),o.referrerPolicy&&(l.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?l.credentials="include":o.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function t(o){if(o.ep)return;o.ep=!0;const l=n(o);fetch(o.href,l)}})();function Ee(r){let e=0;for(let n=0;n<r.length;n++)e=r.charCodeAt(n)-64+e*26;return e-1}function pe(r){let e="";for(r++;r>0;){r--;const n=r%26;r=Math.floor(r/26),e=String.fromCharCode(65+n)+e}return e}function He(r){const e=/^([A-Z]*)(\d*)$/,n=r.match(e);if(!n)return[void 0,void 0];const t=n[1],o=parseInt(n[2]);return[o>0?o-1:void 0,t||void 0]}function be(r){const[e,n]=He(r);return[e,n?Ee(n):void 0]}function De(r,e){return r!==void 0?e!==void 0?pe(e)+(r+1):(r+1).toString():e!==void 0?pe(e):""}function ge(r,e,n,t){if(r==0)return[0,0,[]];let[o,l]=e.offsetToItem(t);o=Math.max(0,Math.min(r-1,o));const u=t+n,M=1,f=1;for(let c=0;c<M&&o>0;c++)o--,l-=e.itemSize(o);const R=o;let p=l;const z=[];for(;p<u&&o<r;){const c=e.itemSize(o);z.push(c),p+=c,o++}for(let c=0;c<f&&o<r;c++){const m=e.itemSize(o);z.push(m),o++}return[R,l,z]}const Fe=6e6,Pe=100;function Re(r,e=Fe,n=Pe){let t=0,o=0,l=0;r<e?(t=o=r,l=1):(t=e,o=t/n,l=Math.floor(r/o));function u(c){return c<=0?0:c>=l-1?r-t:Math.round((c-1)*(r-t)/(l-3))}const M={scrollOffset:0,renderOffset:0,page:0,scrollDirection:"forward"},[f,R]=$.useState(M);function p(c,m,g){if(f.scrollOffset==g)return[g,f];let x=Math.max(0,Math.min(g,m-c));const y=f.scrollOffset<=x?"forward":"backward";let O,_,G=g;if(Math.abs(x-f.scrollOffset)<c)O=Math.min(l-1,Math.floor((g+f.renderOffset)/o)),_=u(O),O!=f.page&&(x=g+f.renderOffset-_,G=x);else{if(x<o)O=0;else if(x>=t-o)O=l-1;else{const k=(r-o*2)/(t-o*2);O=Math.min(l-3,Math.floor((x-o)*k/o))+1}_=u(O)}const L={scrollOffset:x,renderOffset:_,page:O,scrollDirection:y};return R(L),[G,L]}function z(c,m){const g=Math.min(r-m,Math.max(c,0)),x=f.scrollOffset+f.renderOffset<=g?"forward":"backward",y=Math.min(l-1,Math.floor(g/o)),O=u(y),_=g-O;return R({scrollOffset:_,renderOffset:O,page:y,scrollDirection:x}),_}return{...f,renderSize:t,onScroll:p,doScrollTo:z}}function fe(r){return r.addEventListener!==void 0}function ve(r,e,n=window,t={}){const o=$.useRef(),{capture:l,passive:u,once:M}=t;$.useEffect(()=>{o.current=e},[e]),$.useEffect(()=>{if(!n)return;const f=fe(n)?n:n.current;if(!f)return;const R=z=>{var c;return(c=o.current)==null?void 0:c.call(o,z)},p={capture:l,passive:u,once:M};return f.addEventListener(r,R,p),()=>{f.removeEventListener(r,R,p)}},[r,n,l,u,M])}if(import.meta.vitest){const{it:r,expect:e}=import.meta.vitest;r("isListener",()=>{e(fe(window)).toBe(!0),e(fe(document)).toBe(!0),e(fe(document.createElement("div"))).toBe(!0),e(fe($.createRef())).toBe(!1)})}function Ae(r,e,n){const t=$.useRef(),o=$.useRef(r);$.useEffect(()=>{o.current=r},[r]);const l=performance.now();$.useEffect(()=>{function u(){t.current=void 0,e!==null&&(performance.now()-l>=e?o.current():t.current=requestAnimationFrame(u))}return u(),()=>{typeof t.current=="number"&&(cancelAnimationFrame(t.current),t.current=void 0)}},[l,e,n])}const Be=150,$e=500;function ye(r=window){const[e,n]=$.useState(0),t="onscrollend"in window,o=t?$e:Be;return ve("scroll",()=>n(l=>l+1),r),ve("scrollend",()=>n(0),t?r:null),Ae(()=>n(0),e==0?null:o,e),e>0}const Ge=(r,e,n)=>`${r}:${e}`,We=h.forwardRef(function({render:e,...n},t){return e(n,t)});function Ke({...r},e){return a.jsx("div",{ref:e,...r})}const ke=h.forwardRef(function({render:e,...n},t){return e(n,t)});function Ue({...r},e){return a.jsx("div",{ref:e,...r})}const qe=h.forwardRef(function(e,n){const{width:t,height:o,rowCount:l,rowOffsetMapping:u,columnCount:M,columnOffsetMapping:f,children:R,className:p,innerClassName:z,itemData:c=void 0,itemKey:m=Ge,onScroll:g,useIsScrolling:x=!1}=e,y=u.itemOffset(l),O=f.itemOffset(M),_=h.useRef(null),{scrollOffset:G,renderOffset:W,renderSize:L,onScroll:k,doScrollTo:v}=Re(y,e.maxCssSize,e.minNumPages),{scrollOffset:V,renderOffset:ee,renderSize:N,onScroll:te,doScrollTo:I}=Re(O,e.maxCssSize,e.minNumPages),se=ye(_);h.useImperativeHandle(n,()=>({scrollTo(P,A){const H=_.current;if(H){const B={};P!=null&&(B.top=v(P,H.clientHeight)),A!=null&&(B.left=I(A,H.clientWidth)),H.scrollTo(B)}},scrollToItem(P,A){const H=P!=null?u.itemOffset(P):void 0,B=A!=null?f.itemOffset(A):void 0;this.scrollTo(H,B)},get clientWidth(){return _.current?_.current.clientWidth:0},get clientHeight(){return _.current?_.current.clientHeight:0}}),[u,f,v,I]);function re(P){const{clientWidth:A,clientHeight:H,scrollWidth:B,scrollHeight:we,scrollLeft:ie,scrollTop:s}=P.currentTarget,[i,w]=k(H,we,s),[S,d]=te(A,B,ie);_.current&&(i!=s||S!=ie)&&_.current.scrollTo(S,i),g==null||g(w.scrollOffset+w.renderOffset,d.scrollOffset+d.renderOffset,w,d)}const[E,X,U]=ge(l,u,o,G+W),[C,j,Y]=ge(M,f,t,V+ee),q=R,b=e.outerRender||Ue,D=e.innerRender||Ke;let F=X-W,Z=0,de=0,ne=0,le=0,he=0;return a.jsx(ke,{className:p,render:b,onScroll:re,ref:_,style:{position:"relative",height:o,width:t,overflow:"auto",willChange:"transform"},children:a.jsx(We,{className:z,render:D,style:{height:L,width:N},children:U.map((P,A)=>(de=F,F+=P,Z=E+A,ne=j-ee,a.jsx($.Fragment,{children:Y.map((H,B)=>(he=ne,ne+=H,le=C+B,a.jsx(q,{data:c,rowIndex:Z,columnIndex:le,isScrolling:x?se:void 0,style:{position:"absolute",top:de,height:P,left:he,width:H}},m(Z,le,c))))},m(Z,0,c))))})})}),Xe=(r,e)=>r,Ye=h.forwardRef(function({render:e,...n},t){return e(n,t)});function Ze({...r},e){return a.jsx("div",{ref:e,...r})}const Qe=h.forwardRef(function({render:e,...n},t){return e(n,t)});function Je({...r},e){return a.jsx("div",{ref:e,...r})}const Te=h.forwardRef(function(e,n){const{width:t,height:o,itemCount:l,itemOffsetMapping:u,children:M,className:f,innerClassName:R,itemData:p=void 0,itemKey:z=Xe,layout:c="vertical",onScroll:m,useIsScrolling:g=!1}=e,x=u.itemOffset(l),y=h.useRef(null),{scrollOffset:O,renderOffset:_,renderSize:G,onScroll:W,doScrollTo:L}=Re(x,e.maxCssSize,e.minNumPages),k=ye(y),v=c==="vertical";h.useImperativeHandle(n,()=>({scrollTo(C){const j=y.current;j&&(v?j.scrollTo(0,L(C,j.clientHeight)):j.scrollTo(L(C,j.clientWidth),0))},scrollToItem(C){this.scrollTo(u.itemOffset(C))}}),[u,v,L]);function V(C){if(v){const{clientHeight:j,scrollHeight:Y,scrollTop:q,scrollLeft:b}=C.currentTarget,[D,F]=W(j,Y,q);D!=q&&y.current&&y.current.scrollTo(b,D),m==null||m(F.scrollOffset+F.renderOffset,F)}else{const{clientWidth:j,scrollWidth:Y,scrollTop:q,scrollLeft:b}=C.currentTarget,[D,F]=W(j,Y,b);D!=b&&y.current&&y.current.scrollTo(D,q),m==null||m(F.scrollOffset+F.renderOffset,F)}}const[ee,N,te]=ge(l,u,v?o:t,O+_),I=M,se=e.outerRender||Je,re=e.innerRender||Ze;let E=N-_,X,U;return a.jsx(Qe,{className:f,render:se,onScroll:V,ref:y,style:{position:"relative",height:o,width:t,overflow:"auto",willChange:"transform"},children:a.jsx(Ye,{className:R,render:re,style:{height:v?G:"100%",width:v?"100%":G},children:te.map((C,j)=>(U=E,E+=C,X=ee+j,a.jsx(I,{data:p,index:X,isScrolling:g?k:void 0,style:{position:"absolute",top:v?U:void 0,left:v?void 0:U,height:v?C:"100%",width:v?"100%":C}},z(X,p))))})})});class et{constructor(e){Ce(this,"fixedItemSize");this.fixedItemSize=e}itemSize(e){return this.fixedItemSize}itemOffset(e){return e*this.fixedItemSize}offsetToItem(e){const n=Math.floor(e/this.fixedItemSize),t=n*this.fixedItemSize;return[n,t]}}function xe(r){return new et(r)}function ue(...r){let e;return r.forEach(n=>{e&&n?e=e+" "+n:n&&(e=n)}),e}function J(r,e){return r?e:void 0}const tt={leap1900:!1,dateSpanLarge:!0};function rt(r,e,n,t){const o=r.getCellValue(e,n,t);if(o==null)return"";if(typeof o=="object")return o.value;if(typeof o=="string"&&o[0]=="'")return o.substring(1);let l=r.getCellFormat(e,n,t);return l===void 0&&(l=""),je(l,o,tt)}function Ve({index:r,data:e,style:n}){return e(r,n)}function nt({rowIndex:r,columnIndex:e,data:n,style:t}){return n(r,e,t)}const Ie={scrollOffset:0,renderOffset:0,page:0,scrollDirection:"forward"};function ot(r){var ie;const{width:e,height:n,theme:t,data:o,minRowCount:l=100,minColumnCount:u=26,maxRowCount:M=1e12,maxColumnCount:f=1e12}=r,R=xe(100),p=xe(30),z=h.useRef(null),c=h.useRef(null),m=h.useRef(null),g=h.useRef(!1),x=h.useRef(null),y=h.useCallback(s=>o.subscribe(s),[o]),O=h.useSyncExternalStore(y,o.getSnapshot.bind(o),(ie=o.getServerSnapshot)==null?void 0:ie.bind(o)),[_,G]=h.useState(""),[W,L]=h.useState(0),[k,v]=h.useState(0),[V,ee]=h.useState([void 0,void 0]),[N,te]=h.useState(null),[I,se]=h.useState([Ie,Ie]),re=o.getRowCount(O),E=Math.max(l,re,W+1,N?N[0]+1:0),X=p.itemOffset(E),U=o.getColumnCount(O),C=Math.max(u,U,k+1,N?N[1]+1:0),j=R.itemOffset(C);h.useLayoutEffect(()=>{var s;g.current&&(g.current=!1,(s=m.current)==null||s.scrollToItem(V[0],V[1]))},[V]),h.useEffect(()=>{var s;(s=x.current)==null||s.focus({preventScroll:!0})},[N]);function Y(s,i,w,S){var d,T;(d=z.current)==null||d.scrollTo(i),(T=c.current)==null||T.scrollTo(s),s==0?L(0):m.current&&s+m.current.clientHeight==X&&W<E&&E<M&&L(E),i==0?v(0):m.current&&i+m.current.clientWidth==j&&k<C&&C<f&&v(C),se([w,S])}function q(s,i){te(s===void 0&&i===void 0?null:[s||0,i||0])}function b(s,i){ee([s,i]),G(De(s,i)),q(s,i)}function D(s,i){s<0||s>=E||i<0||i>=C||b(s,i)}function F(s){var d;if(s.key!=="Enter")return;let i=!1,[w,S]=be(_);w!==void 0&&(w>=M&&(w=M-1),w>W?(L(w),i=!0):w==0&&L(0)),S!==void 0&&(S>=f&&(S=f-1),S>k?(v(S),i=!0):S==0&&v(0)),b(w,S),i?g.current=!0:(d=m.current)==null||d.scrollToItem(w,S)}function Z(s){return V[0]==null&&V[1]==s}function de(s){return V[0]!=null&&(V[1]==null||V[1]==s)}function ne(s){return V[0]==s&&V[1]==null}function le(s){return V[1]!=null&&(V[0]==null||V[0]==s)}const he=({style:s,...i},w)=>a.jsx("div",{ref:w,style:{...s,overflow:"hidden"},onClick:S=>{const d=S.currentTarget.getBoundingClientRect(),T=S.clientX-d.left+I[1].renderOffset+I[1].scrollOffset,[K]=R.offsetToItem(T);b(void 0,K)},...i}),P=({style:s,...i},w)=>a.jsx("div",{ref:w,style:{...s,overflow:"hidden"},onClick:S=>{const d=S.currentTarget.getBoundingClientRect(),T=S.clientY-d.top+I[0].renderOffset+I[0].scrollOffset,[K]=p.offsetToItem(T);b(K,void 0)},...i}),A=(s,i)=>a.jsx("div",{className:ue(t==null?void 0:t.VirtualSpreadsheet_Column,J(Z(s),t==null?void 0:t.VirtualSpreadsheet_Column__Selected),J(de(s),t==null?void 0:t.VirtualSpreadsheet_Column__CellSelected)),style:i,children:s<C?pe(s):""}),H=(s,i)=>a.jsx("div",{className:ue(t==null?void 0:t.VirtualSpreadsheet_Row,J(ne(s),t==null?void 0:t.VirtualSpreadsheet_Row__Selected),J(le(s),t==null?void 0:t.VirtualSpreadsheet_Row__CellSelected)),style:i,children:s<E?s+1:""}),B=({children:s,...i},w)=>{let S;if(N){const d=N[0],T=N[1],K=I[0].scrollOffset,Se=p.itemSize(d),oe=Math.max(n,Se*3);let Q=p.itemOffset(d)-I[0].renderOffset;Q<K-oe?Q=K-oe:Q>K+n+oe&&(Q=K+n+oe);const me=I[1].scrollOffset,Oe=R.itemSize(T),_e=Math.max(e,Oe*3);let ce=R.itemOffset(T)-I[1].renderOffset;ce<me-_e?ce=me-_e:ce>me+e+_e&&(ce=me+e+_e),S=a.jsx("input",{ref:x,className:ue(t==null?void 0:t.VirtualSpreadsheet_Cell,t==null?void 0:t.VirtualSpreadsheet_Cell__Focus),type:"text",onKeyDown:ae=>{switch(ae.key){case"ArrowDown":D(d+1,T),ae.preventDefault();break;case"ArrowUp":D(d-1,T),ae.preventDefault();break;case"ArrowLeft":D(d,T-1),ae.preventDefault();break;case"ArrowRight":D(d,T+1),ae.preventDefault();break}},style:{zIndex:-1,position:"absolute",top:Q,height:Se,left:ce,width:Oe}})}return a.jsxs("div",{ref:w,onClick:d=>{const T=d.currentTarget.getBoundingClientRect(),K=d.clientX-T.left+I[1].renderOffset+I[1].scrollOffset,Se=d.clientY-T.top+I[0].renderOffset+I[0].scrollOffset,[oe]=p.offsetToItem(Se),[Q]=R.offsetToItem(K);b(oe,Q)},...i,children:[s,S]})},we=(s,i,w)=>{const S=s<re&&i<U?rt(o,O,s,i):"",d=N&&s==N[0]&&i==N[1],T=ue(t==null?void 0:t.VirtualSpreadsheet_Cell,J(ne(s),t==null?void 0:t.VirtualSpreadsheet_Cell__RowSelected),J(Z(i),t==null?void 0:t.VirtualSpreadsheet_Cell__ColumnSelected),J(d,t==null?void 0:t.VirtualSpreadsheet_Cell__Focus));return a.jsx("div",{className:T,style:w,children:S})};return a.jsxs("div",{className:ue(r.className,t==null?void 0:t.VirtualSpreadsheet),style:{display:"grid",gridTemplateColumns:"100px 1fr",gridTemplateRows:"50px 50px 1fr"},children:[a.jsx("div",{className:t==null?void 0:t.VirtualSpreadsheet_Name,style:{gridColumnStart:1,gridColumnEnd:3},children:a.jsxs("label",{children:["Scroll To Row, Column or Cell:",a.jsx("input",{type:"text",value:_,height:200,onChange:s=>{var i;G((i=s.target)==null?void 0:i.value)},onKeyUp:F})]})}),a.jsx("div",{}),a.jsx(Te,{ref:z,className:t==null?void 0:t.VirtualSpreadsheet_ColumnHeader,itemData:A,outerRender:he,height:50,itemCount:C+1,itemOffsetMapping:R,layout:"horizontal",maxCssSize:r.maxCssSize,minNumPages:r.minNumPages,width:r.width,children:Ve}),a.jsx(Te,{ref:c,className:t==null?void 0:t.VirtualSpreadsheet_RowHeader,itemData:H,outerRender:P,height:r.height,itemCount:E+1,itemOffsetMapping:p,maxCssSize:r.maxCssSize,minNumPages:r.minNumPages,width:100,children:Ve}),a.jsx(qe,{className:t==null?void 0:t.VirtualSpreadsheet_Grid,ref:m,itemData:we,outerRender:B,onScroll:Y,height:r.height,rowCount:E,rowOffsetMapping:p,columnCount:C,columnOffsetMapping:R,maxCssSize:r.maxCssSize,minNumPages:r.minNumPages,width:r.width,children:nt})]})}const st="_VirtualSpreadsheet_ColumnHeader_1sf9h_1",lt="_VirtualSpreadsheet_Column_1sf9h_1",it="_VirtualSpreadsheet_Column__Selected_1sf9h_1",ct="_VirtualSpreadsheet_Column__CellSelected_1sf9h_1",at="_VirtualSpreadsheet_RowHeader_1sf9h_1",ut="_VirtualSpreadsheet_Row_1sf9h_1",ft="_VirtualSpreadsheet_Row__Selected_1sf9h_1",dt="_VirtualSpreadsheet_Row__CellSelected_1sf9h_1",ht="_VirtualSpreadsheet_Grid_1sf9h_1",St="_VirtualSpreadsheet_Cell_1sf9h_1",mt="_VirtualSpreadsheet_Cell__RowSelected_1sf9h_1",_t="_VirtualSpreadsheet_Cell__ColumnSelected_1sf9h_1",Ct="_VirtualSpreadsheet_Cell__Focus_1sf9h_1",wt={VirtualSpreadsheet_ColumnHeader:st,VirtualSpreadsheet_Column:lt,VirtualSpreadsheet_Column__Selected:it,VirtualSpreadsheet_Column__CellSelected:ct,VirtualSpreadsheet_RowHeader:at,VirtualSpreadsheet_Row:ut,VirtualSpreadsheet_Row__Selected:ft,VirtualSpreadsheet_Row__CellSelected:dt,VirtualSpreadsheet_Grid:ht,VirtualSpreadsheet_Cell:St,VirtualSpreadsheet_Cell__RowSelected:mt,VirtualSpreadsheet_Cell__ColumnSelected:_t,VirtualSpreadsheet_Cell__Focus:Ct},pt=["Date","Time","Item","Price","Quantity","Cost","Tax Rate","Tax","Subtotal","Transaction Fee","Total","Running Total"],gt=["First","Last","Count","Average","Max","Total","Min","Total","Total","Total","Total","Running Total"];class Rt{constructor(){Ce(this,"count");Ce(this,"base");this.count=1e6;const n=ze(new Date)||0;this.base=n-this.count/(24*60)}subscribe(e){const n=setInterval(()=>{this.count++,e()},6e4);return()=>{clearInterval(n)}}getSnapshot(){return this.count}getRowCount(e){return e+4}getColumnCount(e){return 12}dateTime(e){return this.base+e/(24*60)}totalRow(e,n){switch(n){case 0:return this.dateTime(1);case 1:return this.dateTime(e);case 2:return e;case 3:return .01;case 4:return 80;case 5:return .8*e;case 6:return .15;case 7:return .12*e;case 8:return .92*e;case 9:return .08*e;case 10:return e;case 11:return e}}getCellValue(e,n,t){if(n==0)return pt[t];if(n==e+1)return;if(n==e+2)return gt[t];if(n==e+3)return this.totalRow(e,t);const o=this.dateTime(n);switch(t){case 0:return o;case 1:return o;case 2:return"Nails";case 3:return .01;case 4:return 80;case 5:return .8;case 6:return .15;case 7:return .12;case 8:return .92;case 9:return .08;case 10:return 1;case 11:return n}}getCellFormat(e,n,t){if(n==e+3&&t==1)return"yyyy-mm-dd";switch(t){case 0:return"yyyy-mm-dd";case 1:return"hh:mm";case 6:return"0%";case 3:case 5:case 7:case 8:case 9:case 10:case 11:return"$0.00";default:return}}}const Ot=new Rt;function vt(){return a.jsx(ot,{data:Ot,theme:wt,height:300,minColumnCount:0,width:600})}Le.render(a.jsx(h.StrictMode,{children:a.jsx(vt,{})}),document.getElementById("root"));
//# sourceMappingURL=main-BnRBs3UP.js.map
