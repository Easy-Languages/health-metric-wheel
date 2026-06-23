// Depends on globals from config.js: SCALE, MIN, MAX

const _NS = "http://www.w3.org/2000/svg";
const _SIZE = 520, _C = _SIZE/2, _MAXR = 160;

function _colorFor(s){ return (SCALE[Math.round(s)] || SCALE[MAX]).color; }
function _angleFor(i, n){ return (-90 + i*(360/n)) * Math.PI/180; }
function _radiusFor(s){ const inner=_MAXR*0.16; return inner+(s-MIN)/(MAX-MIN)*(_MAXR-inner); }
function _pt(a, r){ return [_C + r*Math.cos(a), _C + r*Math.sin(a)]; }

function _el(tag, attrs, text){
  const e = document.createElementNS(_NS, tag);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(text != null) e.textContent = text;
  return e;
}

function _svgEl(){
  const s = document.createElementNS(_NS, "svg");
  s.setAttribute("viewBox", "-110 0 740 540");
  s.setAttribute("width", "100%");
  s.style.maxWidth = "660px";
  return s;
}

function _labelAt(svg, i, cats){
  const n = cats.length;
  const a = _angleFor(i, n);
  const [lx, ly] = _pt(a, _MAXR+22);
  const anchor = Math.abs(lx-_C)<6 ? "middle" : (lx<_C ? "end" : "start");
  const words = cats[i].split(" ");
  const mid = Math.ceil(words.length/2);
  const lines = words.length > 2
    ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]
    : [cats[i]];
  const t = _el("text", {x:lx, y:ly-(lines.length-1)*8, "text-anchor":anchor, "font-size":20, fill:"#444"});
  lines.forEach((ln, k) => t.appendChild(_el("tspan", {x:lx, dy:k===0?0:20}, ln)));
  svg.appendChild(t);
}

// Single-dataset filled wheel. Each slice colored by its score via SCALE.
function renderWheel(container, scores, cats){
  const n = cats.length;
  const svg = _svgEl();
  const half = Math.PI/n;
  for(let s=MIN; s<=MAX; s++){
    svg.appendChild(_el("circle",{cx:_C,cy:_C,r:_radiusFor(s),fill:"none",stroke:"#ece9e4","stroke-width":1}));
  }
  for(let i=0; i<n; i++){
    const a0=_angleFor(i,n)-half, a1=_angleFor(i,n)+half, r=_radiusFor(scores[i]);
    const [x0,y0]=_pt(a0,r), [x1,y1]=_pt(a1,r);
    svg.appendChild(_el("path",{
      d:`M ${_C} ${_C} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`,
      fill:_colorFor(scores[i]), "fill-opacity":0.82, stroke:"#fff", "stroke-width":1.5,
    }));
    _labelAt(svg, i, cats);
  }
  container.appendChild(svg);
}

// Dual-overlay wheel for survey comparison. Renders two datasets on the same axes.
// colorA / colorB are hex fill colors for each dataset (score quality shown via radius,
// dataset identity shown via color). Both are semi-transparent so overlap reads naturally.
function renderDualWheel(container, scoresA, scoresB, cats, colorA, colorB){
  const n = cats.length;
  const svg = _svgEl();
  const half = Math.PI/n;

  // Grid rings with score labels on the right axis
  for(let s=MIN; s<=MAX; s++){
    svg.appendChild(_el("circle", {cx:_C,cy:_C,r:_radiusFor(s),fill:"none",stroke:"#ece9e4","stroke-width":1}));
    const r=_radiusFor(s);
    svg.appendChild(_el("text",{x:_C+r+4,y:_C+3.5,"font-size":9,fill:"#bbb"},s));
  }

  // Dataset A slices (drawn behind)
  for(let i=0; i<n; i++){
    const a0=_angleFor(i,n)-half, a1=_angleFor(i,n)+half, r=_radiusFor(scoresA[i]);
    const [x0,y0]=_pt(a0,r), [x1,y1]=_pt(a1,r);
    svg.appendChild(_el("path",{
      d:`M ${_C} ${_C} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`,
      fill:colorA, "fill-opacity":0.72, stroke:"#fff", "stroke-width":1.5,
    }));
  }

  // Dataset B slices (drawn in front, more transparent so A shows through)
  for(let i=0; i<n; i++){
    const a0=_angleFor(i,n)-half, a1=_angleFor(i,n)+half, r=_radiusFor(scoresB[i]);
    const [x0,y0]=_pt(a0,r), [x1,y1]=_pt(a1,r);
    svg.appendChild(_el("path",{
      d:`M ${_C} ${_C} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`,
      fill:colorB, "fill-opacity":0.52, stroke:"#fff", "stroke-width":1.5,
    }));
  }

  for(let i=0; i<n; i++) _labelAt(svg, i, cats);
  container.appendChild(svg);
}
