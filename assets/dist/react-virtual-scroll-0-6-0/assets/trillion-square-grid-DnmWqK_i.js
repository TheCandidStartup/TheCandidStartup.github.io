import"./styles-tIW3KCtR.js";import{c as f,j as e,R as s}from"./vendor-BFDfz19Z.js";import{u as h,a as d,b as g}from"./index-sRQ6KY0_.js";const j=({rowIndex:t,columnIndex:n,style:r})=>e.jsx("div",{className:t==0?"header":"cell",style:r,children:t==0?`${n}`:`${t}:${n}`});function b(){var t=h(30,[50]),n=d(280);const r=s.useRef(null),u=s.useRef(null),o=s.useRef(null);function i(){var l,a,c;const p=((l=u.current)==null?void 0:l.valueAsNumber)||0,m=((a=o.current)==null?void 0:a.valueAsNumber)||0;(c=r.current)==null||c.scrollToItem(p,m)}return e.jsxs("div",{children:[e.jsxs("label",{children:["Row:",e.jsx("input",{ref:u,type:"number",height:200,onChange:i})]}),e.jsxs("label",{children:["Col:",e.jsx("input",{ref:o,type:"number",height:200,onChange:i})]}),e.jsx(g,{ref:r,className:"outerContainer",height:240,rowCount:1e12,rowOffsetMapping:t,columnCount:1e12,columnOffsetMapping:n,width:600,children:j})]})}f(document.getElementById("root")).render(e.jsx(b,{}));
//# sourceMappingURL=trillion-square-grid-DnmWqK_i.js.map