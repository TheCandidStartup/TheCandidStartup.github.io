import"./styles-Bp5UL7TC.js";import{R as r,j as e,a as x}from"./vendor-Bnznptw5.js";import{V as g,u as j}from"./useFixedSizeItemOffsetMapping-D1VZWoBP.js";const b=({index:t,style:n})=>e.jsx("div",{className:t==0?"header":"cell",style:n,children:t==0?"Header":"Item "+t}),c=r.forwardRef((t,n)=>{const{label:a,...i}=t,l=a+": ";return e.jsx("div",{children:e.jsxs("label",{children:[l,e.jsx("input",{...i,ref:n,readOnly:!0,disabled:!0})]})})});function h(){var t=j(30);const n=r.createRef(),a=r.createRef(),i=r.createRef(),l=r.createRef(),u=r.createRef(),m=r.createRef(),p=r.createRef();function d(o,s){if(a.current&&(a.current.value=o.toString()),i.current){const[f]=t.offsetToItem(o);i.current.value=f.toString()}l.current&&(l.current.value=s.scrollOffset.toString()),u.current&&(u.current.value=s.renderOffset.toString()),m.current&&(m.current.value=s.page.toString()),p.current&&(p.current.value=s.scrollDirection)}return e.jsxs("div",{children:[e.jsxs("label",{children:["Item:",e.jsx("input",{type:"number",height:200,onChange:o=>{var f;const s=parseInt(o.target.value);(f=n.current)==null||f.scrollToItem(s)}})]}),e.jsx(g,{className:"outerContainer",ref:n,height:240,itemCount:100,itemOffsetMapping:t,maxCssSize:1500,minNumPages:5,onScroll:d,width:600,children:b}),e.jsx(c,{ref:a,label:"offset",type:"number"}),e.jsx(c,{ref:i,label:"Item",type:"number"}),e.jsx(c,{ref:l,label:"ScrollOffset",type:"number"}),e.jsx(c,{ref:u,label:"RenderOffset",type:"number"}),e.jsx(c,{ref:m,label:"Page",type:"number"}),e.jsx(c,{ref:p,label:"ScrollDirection",type:"text"})]})}x.render(e.jsx(h,{}),document.getElementById("root"));
//# sourceMappingURL=paging-functional-test-DRHPmmLJ.js.map