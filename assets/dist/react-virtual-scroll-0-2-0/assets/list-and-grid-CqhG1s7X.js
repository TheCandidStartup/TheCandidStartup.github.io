var u=Object.defineProperty;var f=(s,e,t)=>e in s?u(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var o=(s,e,t)=>(f(s,typeof e!="symbol"?e+"":e,t),t);import"./styles-s6unqNiX.js";import{R as c,j as l,a as h}from"./vendor-Bnznptw5.js";import{V as m,a as p,u as g}from"./useFixedSizeItemOffsetMapping-CHivuuFc.js";class z{constructor(e,t){o(this,"defaultItemSize");o(this,"sizes");this.defaultItemSize=e,this.sizes=t}itemSize(e){return e<this.sizes.length?this.sizes[e]:this.defaultItemSize}itemOffset(e){var t=0;let i=this.sizes.length;e>i?t=(e-i)*this.defaultItemSize:i=e;for(let r=0;r<i;r++)t+=this.sizes[r];return t}offsetToItem(e){var t=0;const i=this.sizes.length;for(let a=0;a<i;a++){const n=this.sizes[a];if(t+n>e)return[a,t];t+=n}const r=Math.floor((e-t)/this.defaultItemSize);return t+=r*this.defaultItemSize,[r+i,t]}}function d(s,e){return new z(s,e||[])}const S=({index:s,isScrolling:e,style:t})=>l.jsx("div",{className:s==0?"header":e?"cellScroll":"cell",style:t,children:s==0?"Header":"Item "+s}),I=({rowIndex:s,columnIndex:e,isScrolling:t,style:i})=>l.jsx("div",{className:s==0?"header":t?"cellScroll":"cell",style:i,children:s==0?`${e}`:`${s}:${e}`});function j(){var s=d(30,[50]),e=g(100);const t=c.createRef();return l.jsxs("div",{className:"app-container",children:[l.jsxs("label",{children:["ScrollToItem:",l.jsx("input",{type:"number",height:200,onChange:i=>{var a,n;const r=parseInt((a=i.target)==null?void 0:a.value);(n=t.current)==null||n.scrollToItem(r)}})]}),l.jsx(m,{ref:t,height:240,itemCount:100,itemOffsetMapping:s,useIsScrolling:!0,width:600,children:S}),l.jsx(p,{ref:t,height:240,rowCount:100,rowOffsetMapping:s,columnCount:100,columnOffsetMapping:e,useIsScrolling:!0,width:600,children:I})]})}h.render(l.jsx(c.StrictMode,{children:l.jsx(j,{})}),document.getElementById("root"));
//# sourceMappingURL=list-and-grid-CqhG1s7X.js.map