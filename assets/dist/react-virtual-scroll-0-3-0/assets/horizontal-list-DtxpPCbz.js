import"./styles-gsjtCB-M.js";import{a as i,j as e,R as l}from"./vendor-Bnznptw5.js";import{V as c,u as m}from"./useFixedSizeItemOffsetMapping-DIBrUQ8f.js";const p=({index:t,isScrolling:r,style:a})=>e.jsx("div",{className:t==0?"header":r?"cellScroll":"cell",style:a,children:t==0?"Header":"Item "+t});function u(){var t=m(100);const r=l.createRef();return e.jsxs("div",{className:"app-container",children:[e.jsxs("label",{children:["ScrollToItem:",e.jsx("input",{type:"number",height:200,onChange:a=>{var s,n;const o=parseInt((s=a.target)==null?void 0:s.value);(n=r.current)==null||n.scrollToItem(o)}})]}),e.jsx(c,{ref:r,height:50,itemCount:100,itemOffsetMapping:t,layout:"horizontal",width:600,children:p})]})}i.render(e.jsx(u,{}),document.getElementById("root"));
//# sourceMappingURL=horizontal-list-DtxpPCbz.js.map
