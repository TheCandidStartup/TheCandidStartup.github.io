var r=Object.defineProperty;var u=(s,e,t)=>e in s?r(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var n=(s,e,t)=>u(s,typeof e!="symbol"?e+"":e,t);class a{constructor(e,t){n(this,"defaultItemSize");n(this,"sizes");this.defaultItemSize=e,this.sizes=t}itemSize(e){return e<this.sizes.length?this.sizes[e]:this.defaultItemSize}itemOffset(e){let t=0,i=this.sizes.length;e>i?t=(e-i)*this.defaultItemSize:i=e;for(let f=0;f<i;f++)t+=this.sizes[f];return t}offsetToItem(e){let t=0;const i=this.sizes.length;for(let l=0;l<i;l++){const z=this.sizes[l];if(t+z>e)return[l,t];t+=z}const f=Math.floor((e-t)/this.defaultItemSize);return t+=f*this.defaultItemSize,[f+i,t]}}function o(s,e){return new a(s,e||[])}export{o as u};
//# sourceMappingURL=useVariableSizeItemOffsetMapping-Cin6CDmy.js.map