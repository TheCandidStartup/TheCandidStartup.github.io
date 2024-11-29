import{R as x,j as O,r as z}from"./vendor-BFDfz19Z.js";const re=({...e},t)=>O.jsx("div",{ref:t,...e}),L=x.forwardRef(function({render:t=re,...o},n){return t(o,n)});function ee(e){const{children:t,className:o,style:n}=e,[r,s]=x.useState(0),[i,a]=x.useState(0),c=x.useRef(null),m=x.useCallback(g=>{g.forEach(l=>{const C=Math.round(l.contentBoxSize[0].inlineSize);s(C);const f=Math.round(l.borderBoxSize[0].blockSize);a(f)})},[]);x.useLayoutEffect(()=>{const g=c.current;if(g&&(a(g.clientHeight),s(g.clientWidth),typeof ResizeObserver<"u")){const l=new ResizeObserver(m);return l.observe(g),()=>{l.disconnect()}}},[m]);const S=i>0&&r>0;return O.jsx("div",{ref:c,className:o,style:n,children:O.jsx("div",{style:{overflow:"visible",width:0,height:0},children:S&&t({height:i,width:r})})})}const ne=6e6,oe=100;function q(e,t=ne,o=oe){let n=0,r=0,s=0;e<t?(n=r=e,s=1):(n=t,r=n/o,s=Math.floor(e/r));function i(l){return l<=0?0:l>=s-1?e-n:Math.round((l-1)*(e-n)/(s-3))}const a={scrollOffset:0,renderOffset:0,page:0,scrollDirection:"forward"},[c,m]=z.useState(a);function S(l,C,f){if(c.scrollOffset==f)return[f,c];let h=Math.max(0,Math.min(f,C-l));const T=c.scrollOffset<=h?"forward":"backward";let u,w,p=f;if(Math.abs(h-c.scrollOffset)<l)u=Math.min(s-1,Math.floor((f+c.renderOffset)/r)),w=i(u),u!=c.page&&(h=f+c.renderOffset-w,p=h);else{if(h<r)u=0;else if(h>=n-r)u=s-1;else{const R=(e-r*2)/(n-r*2);u=Math.min(s-3,Math.floor((h-r)*R/r))+1}w=i(u)}const v={scrollOffset:h,renderOffset:w,page:u,scrollDirection:T};return m(v),[p,v]}function g(l,C){const f=Math.min(e-C,Math.max(l,0)),h=c.scrollOffset+c.renderOffset<=f?"forward":"backward",T=Math.min(s-1,Math.floor(f/r)),u=i(T),w=f-u;return m({scrollOffset:w,renderOffset:u,page:T,scrollDirection:h}),w}return{...c,renderSize:n,onScroll:S,doScrollTo:g}}function N(e){return e.addEventListener!==void 0}function X(e,t,o=window,n={}){const r=z.useRef(),{capture:s,passive:i,once:a}=n;z.useEffect(()=>{r.current=t},[t]),z.useEffect(()=>{if(!o)return;const c=N(o)?o:o.current;if(!c)return;const m=g=>{var l;return(l=r.current)==null?void 0:l.call(r,g)},S={capture:s,passive:i,once:a};return c.addEventListener(e,m,S),()=>{c.removeEventListener(e,m,S)}},[e,o,s,i,a])}if(import.meta.vitest){const{it:e,expect:t}=import.meta.vitest;e("isListener",()=>{t(N(window)).toBe(!0),t(N(document)).toBe(!0),t(N(document.createElement("div"))).toBe(!0),t(N(z.createRef())).toBe(!1)})}function se(e,t,o){const n=z.useRef(),r=z.useRef(e);z.useEffect(()=>{r.current=e},[e]);const s=performance.now();z.useEffect(()=>{function i(){n.current=void 0,t!==null&&(performance.now()-s>=t?r.current():n.current=requestAnimationFrame(i))}return i(),()=>{typeof n.current=="number"&&(cancelAnimationFrame(n.current),n.current=void 0)}},[s,t,o])}const ie=150,le=500;function ce(e=window){const[t,o]=z.useState(0),n="onscrollend"in window,r=n?le:ie;return X("scroll",()=>o(s=>s+1),e),X("scrollend",()=>o(0),n?e:null),se(()=>o(0),t==0?null:r,t),t>0}function Z(e,t,o,n,r){if(e===void 0)return;if(r!="visible"||e<n)return e;t=t||0;const s=e+t,i=n+o;if(!(s<=i))return t>o?e:e-o+t}const te=x.forwardRef(function(t,o){const{width:n,height:r,scrollWidth:s=0,scrollHeight:i=0,className:a,innerClassName:c,children:m,onScroll:S,useIsScrolling:g=!1,innerRender:l,outerRender:C}=t,f=x.useRef(null),{scrollOffset:h,renderOffset:T,renderSize:u,onScroll:w,doScrollTo:p}=q(i,t.maxCssSize,t.minNumPages),d=h+T,{scrollOffset:v,renderOffset:R,renderSize:M,onScroll:V,doScrollTo:E}=q(s,t.maxCssSize,t.minNumPages),A=v+R,B=ce(f);x.useImperativeHandle(o,()=>({scrollTo(I,y){if(I===void 0&&y===void 0)return;const j=f.current;if(j){const b={};I!=null&&(b.top=p(I,j.clientHeight)),y!=null&&(b.left=E(y,j.clientWidth)),j.scrollTo(b)}},scrollToArea(I,y,j,b,D){const H=f.current;if(!H)return;const W=Z(I,y,H.clientHeight,d,D),_=Z(j,b,H.clientWidth,A,D);this.scrollTo(W,_)},get clientWidth(){return f.current?f.current.clientWidth:0},get clientHeight(){return f.current?f.current.clientHeight:0}}),[p,E,d,A]);function P(I){const{clientWidth:y,clientHeight:j,scrollWidth:b,scrollHeight:D,scrollLeft:H,scrollTop:W}=I.currentTarget,[_,k]=w(j,D,W),[U,K]=V(y,b,H);f.current&&(_!=W||U!=H)&&f.current.scrollTo(U,_),S==null||S(k.scrollOffset+k.renderOffset,K.scrollOffset+K.renderOffset,k,K)}const $=g?B:void 0;return O.jsxs(L,{className:a,render:C,onScroll:P,ref:f,style:{position:"relative",height:r,width:n,overflow:"auto",willChange:"transform"},children:[O.jsx(L,{className:c,render:l,style:{zIndex:1,position:"sticky",top:0,left:0,width:"100%",height:"100%"},children:m({isScrolling:$})}),O.jsx("div",{style:{position:"absolute",top:0,left:0,height:i?u:"100%",width:s?M:"100%"}})]})});function G(e,t,o,n){if(e==0)return[0,0,0,[]];if(n<0&&(o+=n,n=0),o<=0)return[0,0,0,[]];const[r,s]=t.offsetToItem(n);if(r>=e)return[0,0,0,[]];let i=Math.max(0,Math.min(e-1,r));const a=n+o,c=i;let m=s;const S=[];let g=0;for(;m<a&&i<e;){const l=t.itemSize(i);S.push(l),g+=l,m+=l,i++}return[c,s,g,S]}function J(e,t){return e==1?`${t}px`:`repeat(${e},${t}px)`}function Q(e,t){return e?e+" "+t:t}function F(e){const t=e.length;if(t==0)return;let o,n=e[0],r=1;for(let i=1;i<t;i++){const a=e[i];if(a==n)r++;else{const c=J(r,n);o=Q(o,c),n=a,r=1}}const s=J(r,n);return Q(o,s)}const fe=(e,t)=>e,ae={boxSizing:"border-box"};function ue(e){const{width:t,height:o,itemCount:n,itemOffsetMapping:r,className:s,innerClassName:i,offset:a,children:c,itemData:m,itemKey:S=fe,layout:g="vertical",outerRender:l,innerRender:C,isScrolling:f}=e,h=g==="vertical",[T,u,w,p]=G(n,r,h?o:t,a),d=F(p),v=u-a,R=c;return O.jsx(L,{className:s,render:l,style:{position:"relative",height:o,width:t,overflow:"hidden",willChange:"transform"},children:O.jsx(L,{className:i,render:C,style:{position:"absolute",display:"grid",gridTemplateColumns:h?void 0:d,gridTemplateRows:h?d:void 0,top:h?v:0,left:h?0:v,height:h?w:"100%",width:h?"100%":w},children:p.map((M,V)=>O.jsx(R,{data:m,isScrolling:f,index:T+V,style:ae},S(T+V,m)))})})}const de=(e,t,o)=>`${e}:${t}`,he={boxSizing:"border-box"};function me(e){const{width:t,height:o,rowCount:n,rowOffsetMapping:r,columnCount:s,columnOffsetMapping:i,className:a,innerClassName:c,rowOffset:m,columnOffset:S,children:g,itemData:l,itemKey:C=de,outerRender:f,innerRender:h,isScrolling:T}=e,[u,w,p,d]=G(n,r,o,m),v=F(d),[R,M,V,E]=G(s,i,t,S),A=F(E),B=w-m,P=M-S,$=g;return O.jsx(L,{className:a,render:f,style:{position:"relative",height:o,width:t,overflow:"hidden",willChange:"transform"},children:O.jsx(L,{className:c,render:h,style:{position:"absolute",display:"grid",gridTemplateColumns:A,gridTemplateRows:v,top:B,left:P,height:p,width:V},children:d.map((I,y)=>O.jsx(z.Fragment,{children:E.map((j,b)=>O.jsx($,{data:l,isScrolling:T,rowIndex:u+y,columnIndex:R+b,style:he},C(u+y,R+b,l)))},C(u+y,0,l)))})})}function Y(e,t){return e===void 0?[void 0,void 0]:[t.itemOffset(e),t.itemSize(e)]}function Se(e,t,o,n,r,s){const i=e.current;if(!i)return;const[a,c]=Y(n,t),[m,S]=Y(r,o);i.scrollToArea(a,c,m,S,s)}const ve=x.forwardRef(function(t,o){const{rowCount:n,rowOffsetMapping:r,columnCount:s,columnOffsetMapping:i,children:a,innerClassName:c,innerRender:m,itemData:S,itemKey:g,onScroll:l,...C}=t,f=r.itemOffset(n),h=i.itemOffset(s),[T,u]=x.useState([0,0]),w=x.useRef(null);x.useImperativeHandle(o,()=>({scrollTo(d,v){const R=w.current;R&&R.scrollTo(d,v)},scrollToItem(d,v,R){Se(w,r,i,d,v,R)},get clientWidth(){return w.current?w.current.clientWidth:0},get clientHeight(){return w.current?w.current.clientHeight:0}}),[r,i]);const p=a;return O.jsx(te,{ref:w,...C,scrollHeight:f,scrollWidth:h,onScroll:(d,v,R,M)=>{u([d,v]),l&&l(d,v,R,M)},children:({isScrolling:d})=>O.jsx(ee,{style:{height:"100%",width:"100%"},children:({height:v,width:R})=>O.jsx(me,{innerClassName:c,innerRender:m,rowOffset:T[0],columnOffset:T[1],height:v,rowCount:n,columnCount:s,itemData:S,itemKey:g,isScrolling:d,rowOffsetMapping:r,columnOffsetMapping:i,width:R,children:p})})})});function we(e,t,o,n,r){const s=e.current;if(!s)return;const i=t.itemOffset(n),a=t.itemSize(n);o?s.scrollToArea(i,a,void 0,void 0,r):s.scrollToArea(void 0,void 0,i,a,r)}const pe=x.forwardRef(function(t,o){const{itemCount:n,itemOffsetMapping:r,children:s,layout:i="vertical",onScroll:a,innerClassName:c,innerRender:m,itemData:S,itemKey:g,...l}=t,C=r.itemOffset(n),[f,h]=x.useState(0),T=x.useRef(null),u=i==="vertical";x.useImperativeHandle(o,()=>({scrollTo(p){const d=T.current;d&&(u?d.scrollTo(p,void 0):d.scrollTo(void 0,p))},scrollToItem(p,d){we(T,r,u,p,d)}}),[r,u]);const w=s;return O.jsx(te,{ref:T,...l,scrollHeight:u?C:void 0,scrollWidth:u?void 0:C,onScroll:(p,d,v,R)=>{const M=u?p:d;h(M),a&&a(M,u?v:R)},children:({isScrolling:p})=>O.jsx(ee,{style:{height:"100%",width:"100%"},children:({height:d,width:v})=>O.jsx(ue,{innerClassName:c,innerRender:m,layout:i,offset:f,height:d,itemCount:n,itemData:S,itemKey:g,isScrolling:p,itemOffsetMapping:r,width:v,children:w})})})});export{ee as A,ue as D,pe as V,ve as a,me as b,te as c};
//# sourceMappingURL=VirtualList-Cz-FhLmM.js.map