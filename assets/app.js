/* Linder Travel Skill – trip app runtime.
   Expects globals injected by build.py:  DATA (trip.json + coast), ART (art key -> url).  */
(function(){
const M = DATA.meta;
const RTL = (M.dir || 'ltr') === 'rtl';
const STR = {
  he:{home:'בית',today:'היום',map:'מפה',book:'הזמנות',tips:'טיפים',tripMap:'מפת המסע',navigate:'ניווט',days:'הימים',firstDay:'היום הראשון',
      openDay:'פתיחת היום',dayOf:(i,n)=>`יום ${i} מתוך ${n}`,day:i=>`יום ${i}`,untilTakeoff:'ימים עד ההמראה',inTrip:n=>`מתוך ${n} ימים – אנחנו בטיול!`,
      after:'ימים של זיכרונות',route:'מסלול בגוגל',share:'שיתוף',copied:'הועתק',plan:'תוכנית',options:'אפשרויות',more:'עוד',
      howToday:'איך מתניידים היום',bags:'מזוודות',stay:'לינה',thePlan:'התוכנית',gem:'פנינה נסתרת',linkHint:'שמות באנגלית עם קו מנוקד נפתחים בגוגל מפות.',
      morning:'בוקר',noon:'צהריים ואחר הצהריים',evening:'ערב',openRoute:'פתיחת כל המסלול בגוגל מפות',
      mapHint:'מפה סכמטית לפי סדר מומלץ; בכחול כהה – המלון. לניווט אמיתי – הכפתורים לגוגל מפות.',
      food:'מה לאכול',planb:'תוכנית ב׳',shop:'שופינג מקומי',tipsDay:'טיפים וטריקים',check:'להזמין / לבדוק',
      mapTitle:'מפת המסע',mapHint2:'לחצו על עיר כדי לפתוח את היום הראשון שלה.',bookTitle:'הזמנות ובדיקות',bookSub:'מה להזמין ומתי, ומה כדאי לסגור לפני הטיסה.',
      checkTitle:'נקודות לבדיקה בתוכנית',inPlan:'בתוכנית',priority:'חשיבות',pr:{high:'גבוהה',mid:'בינונית',low:'נמוכה'},
      tipsTitle:'טיפים ושופינג',tipsSub:'תחבורה, כסף, נימוסים, ואיפה לקנות מה.',shopGuide:'מדריך שופינג',star:'מומלץ',warn:'לבדוק',back:'חזרה',dests:'יעדים',inset:'הגדלה',width:k=>`רוחב המפה: כ-${k} ק"מ`},
  en:{home:'Home',today:'Today',map:'Map',book:'Bookings',tips:'Tips',tripMap:'Trip map',navigate:'Navigate',days:'days',firstDay:'First day',
      openDay:'Open day',dayOf:(i,n)=>`Day ${i} of ${n}`,day:i=>`Day ${i}`,untilTakeoff:'days to takeoff',inTrip:n=>`of ${n} days – we're there!`,
      after:'days of memories',route:'Route',share:'Share',copied:'Copied',plan:'Plan',options:'Options',more:'More',
      howToday:'Getting around today',bags:'Luggage',stay:'Staying',thePlan:'The plan',gem:'Hidden gem',linkHint:'Dotted names open in Google Maps.',
      morning:'Morning',noon:'Afternoon',evening:'Evening',openRoute:'Open the whole route in Google Maps',
      mapHint:'Schematic map in suggested order; the hotel is dark blue. Use the Google Maps buttons to navigate.',
      food:'What to eat',planb:'Plan B',shop:'Local shopping',tipsDay:'Tips',check:'Book / check',
      mapTitle:'Trip map',mapHint2:'Tap a city to open its first day.',bookTitle:'Bookings & checks',bookSub:'What to book and when, and what to settle before you fly.',
      checkTitle:'Things to check',inPlan:'In the plan',priority:'priority',pr:{high:'high',mid:'medium',low:'low'},
      tipsTitle:'Tips & shopping',tipsSub:'Transport, money, etiquette and where to buy what.',shopGuide:'Shopping guide',star:'Top pick',warn:'Check',back:'Back',dests:'Destinations',inset:'Zoom',width:k=>`Map width: ~${k} km`}
};
const S = STR[M.lang] || STR.en;
const N = DATA.days.length;
const SEGC = k => (M.segments[k] || {}).color || '#22306B';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY = 'trip:' + (M.id || M.title) + ':';
const store = {get(k,d){try{const v=localStorage.getItem(KEY+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
               set(k,v){try{localStorage.setItem(KEY+k,JSON.stringify(v))}catch(e){}}};
const gmq = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const fmt = (iso, o) => new Date(iso + 'T12:00:00').toLocaleDateString(M.lang === 'he' ? 'he-IL' : (M.locale || 'en-GB'), o);
const art = k => ART[k] || ART._fallback;

const chevF = '<path d="m15 6-6 6 6 6"/>', chevB = '<path d="m9 6 6 6-6 6"/>';
const svgI = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  map:svgI('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
  pin:svgI('<path d="M12 21s7-7.6 7-12a7 7 0 0 0-14 0c0 4.4 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  prev:svgI(RTL ? chevB : chevF), next:svgI(RTL ? chevF : chevB), back:svgI(RTL ? chevB : chevF),
  share:svgI('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  check:svgI('<path d="m9 11 3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>'),
  tips:svgI('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>'),
  home:svgI('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>'),
  cal:svgI('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>')
};

/* ---------- text → html; English place names become Google Maps links ---------- */
const NOLINK = new Set(['Google Maps','Google Translate','Apple Wallet','iPhone','Android','App','Visa','Mastercard','Amex','Wi-Fi','WiFi','eSIM','QR','Uber','Bolt','Booking','Airbnb','TripAdvisor','Klook','GetYourGuide','Viator','Duty Free','Tax Free','Tax-Free','Tax Refund','VAT','Metro','Bus','Train','Airport','Express','Line','Pass','Card'].concat(M.nolink || []));
let CTX = M.country || '';
function linkify(html){
  if (M.linkify === false) return html;
  return html.split(/(<[^>]+>)/).map(part => {
    if (part.startsWith('<')) return part;
    return part.replace(/[A-Z][A-Za-z0-9'&.\-À-ÿ]*(?:(?: |-)(?:[A-Za-z0-9'&.\-À-ÿ]+))*/g, m => {
      const t = m.replace(/[ .\-']+$/,''), tail = m.slice(t.length);
      if (t.length < 3 || NOLINK.has(t) || /^[A-Z]{1,3}$/.test(t)) return m;
      return `<a class="gm" href="${gmq(t + ', ' + CTX)}" target="_blank" rel="noopener">${t}</a>${tail}`;
    });
  }).join('');
}
function inline(t){
  let s = esc(t.trim()), pre = '';
  s = s.replace(/^⭐\s*/, () => {pre += `<span class="tag star">${S.star}</span>`; return '';});
  s = s.replace(/^⚠️\s*/, () => {pre += `<span class="tag warn">${S.warn}</span>`; return '';});
  s = s.replace(/⚠️|⭐/g,'');
  const m = s.match(/^([^:]{2,42}):\s([\s\S]+)$/);
  s = m ? '<b>'+linkify(m[1])+':</b> '+linkify(m[2]) : linkify(s);
  return pre + s;
}
function items(text){
  if (!text || text === '—') return [];
  const arr = Array.isArray(text) ? text : String(text).split('\n');
  return arr.filter(l => String(l).trim()).map(l => ({sub:/^\s+[–-]\s/.test(l), html:inline(String(l).replace(/^\s*[•–-]\s*/,''))}));
}
const opts = text => '<ul class="opts">' + items(text).map(i => `<li${i.sub?' class="sub"':''}>${i.html}</li>`).join('') + '</ul>';

/* ---------- maps ---------- */
const RB = DATA.coast.map(r => {let a=[999,999,-999,-999];r.forEach(([lo,la])=>{a[0]=Math.min(a[0],lo);a[1]=Math.min(a[1],la);a[2]=Math.max(a[2],lo);a[3]=Math.max(a[3],la)});return a;});
const LAKES = DATA.lakes || [];
function project(b, W, H){
  const lat0=(b.s+b.n)/2, kx=Math.cos(lat0*Math.PI/180), w=(b.e-b.w)*kx, h=b.n-b.s, sc=Math.min(W/w,H/h);
  const ox=(W-w*sc)/2, oy=(H-h*sc)/2;
  return (lat, lon) => [ox+(lon-b.w)*kx*sc, oy+(b.n-lat)*sc];
}
function bbox(pts, minSpan, pad){
  let s=90,n=-90,w=180,e=-180;
  pts.forEach(([la,lo]) => {s=Math.min(s,la);n=Math.max(n,la);w=Math.min(w,lo);e=Math.max(e,lo);});
  const cla=(s+n)/2, clo=(w+e)/2;
  let hs=Math.max((n-s)/2,minSpan/2), hw=Math.max((e-w)/2,minSpan/2/Math.cos(cla*Math.PI/180));
  hs*=1+pad; hw*=1+pad; return {s:cla-hs,n:cla+hs,w:clo-hw,e:clo+hw};
}
function fitAspect(b, W, H){
  const kx=Math.cos(((b.s+b.n)/2)*Math.PI/180), w=(b.e-b.w)*kx, h=b.n-b.s, t=W/H;
  if (w/h < t){const nw=h*t/kx, c=(b.e+b.w)/2; b.w=c-nw/2; b.e=c+nw/2;} else {const nh=w/t, c=(b.n+b.s)/2; b.s=c-nh/2; b.n=c+nh/2;}
  return b;
}
const pathOf = (P, ring, lonFirst) => 'M'+ring.map(c => (lonFirst ? P(c[1],c[0]) : P(c[0],c[1])).map(v=>v.toFixed(1)).join(',')).join('L')+'Z';
function landPaths(P, b){
  const pad=.5, out=[];
  DATA.coast.forEach((ring,k) => { const r=RB[k]; if (r[2]<b.w-pad||r[0]>b.e+pad||r[3]<b.s-pad||r[1]>b.n+pad) return; out.push(pathOf(P, ring, true)); });
  return out.join('');
}
const lakePaths = P => LAKES.map(r => pathOf(P, r, false)).join('');
function km(a,b){const dl=(a.lat-b.lat)*111.32, dg=(a.lon-b.lon)*111.32*Math.cos(a.lat*Math.PI/180);return Math.hypot(dl,dg);}
function pins(xy, stops, r){
  return xy.map((p,i) => {const h=stops[i].k==='h';
    return `<g><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${h?'#22306B':'#E5708F'}" stroke="#fff" stroke-width="${r>9?3:2}"/><text x="${p[0].toFixed(1)}" y="${(p[1]+(r>9?4:3.5)).toFixed(1)}" text-anchor="middle" font-size="${r>9?11:9.5}" font-weight="700" fill="#fff" font-family="Rubik Variable,Arial">${stops[i].n}</text></g>`;}).join('');
}
function dayMap(d, uid){
  const W=440, H=330, col=SEGC(d.seg);
  const stops = d.stops.map((s,i) => ({...s, n:i+1}));
  if (!stops.length) return '';
  const anchor = stops.find(s => s.k==='h') || stops[stops.length-1];
  const cluster = stops.filter(s => km(s, anchor) < 45);
  const b = fitAspect(bbox(stops.map(s=>[s.lat,s.lon]), .035, .32), W, H), P = project(b, W, H);
  const xy = stops.map(s => P(s.lat,s.lon)), cxy = cluster.map(s => P(s.lat,s.lon));
  const spread = Math.max(...cxy.map(p=>p[0]))-Math.min(...cxy.map(p=>p[0]))+Math.max(...cxy.map(p=>p[1]))-Math.min(...cxy.map(p=>p[1]));
  const inset = cluster.length>=2 && cluster.length<stops.length && spread<90;
  const path = 'M'+xy.map(p=>p.map(v=>v.toFixed(1)).join(',')).join('L');
  let labels='', placed=[], lp=[];
  xy.forEach((p,i) => {
    if (inset && cluster.includes(stops[i]) && stops[i]!==anchor) return;
    if (!placed.every(q => Math.hypot(q[0]-p[0],q[1]-p[1]) > 64)) return;
    placed.push(p);
    let name = stops[i].name.length>24 ? stops[i].name.slice(0,23)+'…' : stops[i].name;
    const tw = name.length*6.6; let left = p[0]+15+tw > W-6;
    if (left && p[0]-15-tw < 6){ const room=Math.max(p[0]-21,W-p[0]-21); left=p[0]-21>W-p[0]-21; name=name.slice(0,Math.max(4,Math.floor(room/6.6)-1))+'…'; }
    lp.push([left?p[0]-15-tw:p[0]+15+tw,p[1]],[left?p[0]-15-tw/2:p[0]+15+tw/2,p[1]]);
    labels += `<text class="lbl" x="${(p[0]+(left?-15:15)).toFixed(1)}" y="${(p[1]+4).toFixed(1)}" text-anchor="${left?'end':'start'}">${esc(name)}</text>`;
  });
  let ins='';
  if (inset){
    const IW=170, IH=130, corners=[[10,H-IH-24],[W-IW-10,H-IH-24],[10,10],[W-IW-10,10]];
    const dist=(p,c)=>Math.hypot(Math.max(c[0]-p[0],0,p[0]-(c[0]+IW)),Math.max(c[1]-p[1],0,p[1]-(c[1]+IH)));
    let best=corners[0], bs=-1; corners.forEach(c => {const sc=Math.min(...xy.concat(lp).map(p=>dist(p,c))); if(sc>bs){bs=sc;best=c;}});
    const [ix,iy]=best, ib=fitAspect(bbox(cluster.map(s=>[s.lat,s.lon]),.02,.35),IW,IH), IP0=project(ib,IW,IH), IP=(la,lo)=>{const p=IP0(la,lo);return [p[0]+ix,p[1]+iy];};
    const ixy = cluster.map(s=>IP(s.lat,s.lon));
    ins = `<defs><clipPath id="ic${uid}"><rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" rx="6"/></clipPath></defs>
      <rect x="${ix-2}" y="${iy-2}" width="${IW+4}" height="${IH+4}" rx="8" fill="#fff"/>
      <g clip-path="url(#ic${uid})"><rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" fill="var(--sea)"/>
      <path d="${landPaths(IP,ib)}" fill="var(--land)" stroke="var(--coast)"/><path d="${lakePaths(IP)}" fill="var(--sea)" stroke="var(--coast)"/>
      <path d="M${ixy.map(p=>p.map(v=>v.toFixed(1)).join(',')).join('L')}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${pins(ixy,cluster,8)}</g>
      <rect x="${ix}" y="${iy}" width="${IW}" height="${IH}" rx="6" fill="none" stroke="${col}" stroke-width="2"/>
      <text class="hlbl" x="${ix+IW-6}" y="${iy+15}" text-anchor="end">${S.inset}</text>`;
  }
  const kmw = Math.round((b.e-b.w)*111.32*Math.cos(((b.s+b.n)/2)*Math.PI/180));
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.stops.map(s=>s.name).join(', '))}">
    <rect width="${W}" height="${H}" fill="var(--sea)"/><path d="${landPaths(P,b)}" fill="var(--land)" stroke="var(--coast)"/>
    <path d="${lakePaths(P)}" fill="var(--sea)" stroke="var(--coast)"/>
    <path d="${path}" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${path}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    ${pins(xy,stops,11)}${labels}${ins}<text class="hlbl" x="${W-10}" y="${H-10}" text-anchor="end">${S.width(kmw)}</text></svg>`;
}
function overviewMap(){
  const R = DATA.route; if (!R || !R.length) return '';
  const W=600, H=470, b=fitAspect(bbox(R.map(r=>[r.lat,r.lon]),.5,.22),W,H), P=project(b,W,H);
  let lines='';
  for (const stroke of ['#fff', null]) for (let i=0;i<R.length-1;i++){
    const a=P(R[i].lat,R[i].lon), c=P(R[i+1].lat,R[i+1].lon);
    lines += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${c[0].toFixed(1)}" y2="${c[1].toFixed(1)}" stroke="${stroke||SEGC(R[i+1].seg)}" stroke-width="${stroke?10:6}" stroke-linecap="round"/>`;
  }
  const seen=new Set();
  const nodes = R.map(r => {
    const key=r.name+r.lat; if (seen.has(r.name)) return ''; seen.add(r.name);
    const [x,y]=P(r.lat,r.lon), right = x < W*0.6, dx = right?14:-14, an = right?'start':'end';
    return `<g class="node" tabindex="0" role="button" data-day="${r.day}" aria-label="${esc(r.name)}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="#fff" stroke="${SEGC(r.seg)}" stroke-width="4"/>
      ${r.label?`<text class="jlbl" x="${(x+dx).toFixed(1)}" y="${(y-10).toFixed(1)}" text-anchor="${an}">${esc(r.label)}</text>`:''}
      <text class="${r.label?'hlbl':'lbl'}" x="${(x+dx).toFixed(1)}" y="${(y+(r.label?6:4)).toFixed(1)}" text-anchor="${an}">${esc(r.name)}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(S.tripMap)}"><rect width="${W}" height="${H}" fill="var(--sea)"/>
    <path d="${landPaths(P,b)}" fill="var(--land)" stroke="var(--coast)"/><path d="${lakePaths(P)}" fill="var(--sea)" stroke="var(--coast)"/>${lines}${nodes}</svg>`;
}
function gmRoute(stops){
  if (!stops || !stops.length) return gmq(CTX);
  const f=s=>s.lat+','+s.lon, w=stops.slice(1,-1).map(f).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${f(stops[0])}&destination=${f(stops[stops.length-1])}${w?'&waypoints='+encodeURIComponent(w):''}`;
}

/* ---------- dates ---------- */
const todayISO = () => {const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};
const todayIdx = () => DATA.days.findIndex(d => d.iso === todayISO());
const daysUntil = () => {const s=new Date(DATA.days[0].iso+'T00:00:00'), t=new Date(); t.setHours(0,0,0,0); return Math.round((s-t)/864e5);};

/* ---------- screens ---------- */
function renderHome(){
  const ti=todayIdx(), until=daysUntil(), fi = ti>=0 ? ti : (until>0 ? 0 : store.get('day',0)), f=DATA.days[fi];
  const count = ti>=0 ? `<b>${ti+1}</b><span>${S.inTrip(N)}</span>` : until>0 ? `<b>${until}</b><span>${S.untilTakeoff}</span>` : `<b>${N}</b><span>${S.after}</span>`;
  $('#s-home').innerHTML = `
  <header class="hero home-hero">
    <div class="bar"><span style="font-family:var(--jp);font-weight:800;font-size:20px">${esc(M.badge||'')}</span>
      <button class="iconbtn" type="button" data-go="map" aria-label="${S.tripMap}">${I.map}</button></div>
    <h1>${esc(M.title)}</h1>
    <p class="en">${esc(M.subtitle||'')}</p>
    <div class="count">${count}</div>
  </header>
  <div class="dest-rail" aria-label="${S.dests}">
    ${DATA.dests.map(x => `<button class="dest" type="button" data-day="${x.day}" style="--c:${SEGC(x.seg)}">
      <img src="${art(x.art)}" alt="" width="118" height="118"><span class="he">${esc(x.name)}</span><span class="en">${esc(x.name_en||'')}</span>
      <span class="dt"><span class="dot"></span><bdi dir="ltr">${esc(x.dates)}</bdi></span></button>`).join('')}
  </div>
  <div class="sec"><div class="sec-h"><h2>${ti>=0?S.today:S.firstDay}</h2></div>
    <button class="feature" type="button" data-day="${fi}"><img src="${art(f.art)}" alt="">
      <div class="k">${esc(f.label||'')} ${f.label?'· ':''}${S.day(fi+1)}</div><div class="t">${esc(f.title)}</div><div class="e">${esc(f.title_en||'')}</div><span class="go">${S.openDay}</span></button></div>
  <div class="sec"><div class="quick">
      <button type="button" data-go="map"><span class="ic on">${I.map}</span>${S.tripMap}</button>
      <button type="button" data-go="book"><span class="ic">${I.check}</span>${S.book}</button>
      <button type="button" data-go="tips"><span class="ic">${I.tips}</span>${S.tips}</button>
      <a href="${gmRoute(f.stops)}" target="_blank" rel="noopener"><span class="ic">${I.pin}</span>${S.navigate}</a></div></div>
  <div class="sec"><div class="sec-h"><h2>${N} ${S.days}</h2><span style="font-size:13px;color:var(--muted)"><bdi dir="ltr">${esc(M.range||'')}</bdi></span></div>
    <ul class="daylist">${DATA.days.map((d,i) => `<li><button type="button" data-day="${i}" ${i===ti?'data-today="1"':''}>
      <img src="${art(d.art)}" alt="" width="54" height="54" loading="lazy">
      <div><div class="t"><span class="seg" style="--c:${SEGC(d.seg)}"></span>${esc(d.title)}</div><div class="e">${esc(d.title_en||'')}</div></div>
      <div class="d"><b>${+d.iso.slice(8,10)}</b><span>${esc(fmt(d.iso,{month:'short'}))}</span></div></button></li>`).join('')}</ul></div>`;
}

let cur=0, curTab='plan';
function renderDay(i){
  const d=DATA.days[i], prev=DATA.days[i-1], next=DATA.days[i+1];
  CTX = d.ctx || M.country || '';
  const chips=[d.weather, d.hotel].filter(Boolean);
  const more=[['food',S.food,'🍜'],['planb',S.planb,'☂️'],['shop',S.shop,'🛍️'],['tips',S.tipsDay,'💡'],['check',S.check,'✅']].filter(([k]) => d[k] && d[k] !== '—' && (d[k].length||0));
  $('#s-day').innerHTML = `
  <header class="hero day-hero">
    <div class="bar"><button class="iconbtn" type="button" data-go="home" aria-label="${S.back}">${I.back}</button>
      <span class="meta">${S.dayOf(i+1,N)} · ${esc(fmt(d.iso,{weekday:'short',day:'numeric',month:'long'}))}</span></div>
    ${d.label?`<div class="kj">${esc(d.label)}</div>`:''}
    <h1>${esc(d.title)}</h1><p class="en">${esc(d.title_en||'')}</p>
    <div class="chips">${chips.map(c=>`<span class="chip">${esc(c)}</span>`).join('')}</div>
    <img class="porthole" src="${art(d.art)}" alt="">
    <svg class="curve" viewBox="0 0 400 56" preserveAspectRatio="none" aria-hidden="true"><path d="${RTL?'M0 56 C 120 0, 280 0, 400 40 L400 56 Z':'M0 40 C 120 0, 280 0, 400 56 L0 56 Z'}" fill="var(--paper)"/></svg>
  </header>
  <div class="actions">
    <a href="${gmRoute(d.stops)}" target="_blank" rel="noopener"><span class="ic on">${I.pin}</span>${S.route}</a>
    <button type="button" id="dPrev" ${prev?'':'disabled'}><span class="ic">${I.prev}</span>${prev?S.day(i):'—'}</button>
    <button type="button" id="dNext" ${next?'':'disabled'}><span class="ic">${I.next}</span>${next?S.day(i+2):'—'}</button>
    <button type="button" id="dShare"><span class="ic">${I.share}</span><span>${S.share}</span></button>
  </div>
  <div class="seg-ctl" role="tablist">${[['plan',S.plan],['opts',S.options],['map',S.map],['more',S.more]].map(([k,t]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k===curTab}">${t}</button>`).join('')}</div>
  <div class="panel" data-panel="plan">
    <div class="ticket"><div class="lbl">${S.howToday}</div><div class="how">${esc(d.how||'')}</div><p>${esc(d.travel||'')}</p>
      ${d.steps&&d.steps.length?`<ol class="steps" lang="en">${d.steps.map(s=>`<li>${linkSteps(s)}</li>`).join('')}</ol>`:''}
      <div class="row"><div><b>${S.bags}</b>${esc(d.bags||'—')}</div><div><b>${S.stay}</b>${esc(d.area||d.hotel||'—')}</div></div></div>
    <div class="card" style="margin-top:12px"><h3>${S.thePlan}</h3><ul class="plan">${items(d.plan).map(x=>`<li>${x.html}</li>`).join('')}</ul>
      ${d.gem?`<div class="gem"><b>${S.gem}:</b> ${inline(d.gem)}</div>`:''}</div>
    <p class="hint">${S.linkHint}</p></div>
  <div class="panel" data-panel="opts"><div class="tl">
    <div class="tl-stop" style="--c:var(--gold)"><h3>${S.morning}</h3>${opts(d.morning)}</div>
    <div class="tl-stop" style="--c:var(--sakura)"><h3>${S.noon}</h3>${opts(d.noon)}</div>
    <div class="tl-stop" style="--c:var(--night)"><h3>${S.evening}</h3>${opts(d.evening)}</div></div></div>
  <div class="panel" data-panel="map"><div class="mapbox">${dayMap(d,i)}
    <ol class="stops">${d.stops.map((s,j) => `<li><span class="n${s.k==='h'?' h':''}">${j+1}</span>
      <div><div class="he">${esc(s.name)}</div>${s.name.includes(s.q)||s.q.includes(s.name)?'':`<div class="en">${esc(s.q)}</div>`}</div>
      <a href="${gmq(s.q)}" target="_blank" rel="noopener">Google Maps</a></li>`).join('')}</ol>
    <div style="padding:4px 14px 14px"><a class="btn" href="${gmRoute(d.stops)}" target="_blank" rel="noopener">${I.pin}${S.openRoute}</a></div></div>
    <p class="hint">${S.mapHint}</p></div>
  <div class="panel" data-panel="more">${more.map(([k,t,ic],j) => `<details class="acc"${j===0?' open':''}><summary><span class="ic" aria-hidden="true">${ic}</span><span>${t}</span></summary>${opts(d[k])}</details>`).join('')}</div>`;
  showTab(curTab);
  $('#s-day .seg-ctl').addEventListener('click', e => { const b=e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  $('#dPrev').onclick = () => prev && openDay(i-1);
  $('#dNext').onclick = () => next && openDay(i+1);
  $('#dShare').onclick = async () => {
    const text = `${S.day(i+1)} – ${d.title}\n${d.title_en||''}\n${gmRoute(d.stops)}`;
    try { if (navigator.share) await navigator.share({title:M.title, text}); else { await navigator.clipboard.writeText(text); $('#dShare span:last-child').textContent=S.copied; } } catch(e){}
  };
}
function linkSteps(s){
  return String(s).split(/(\s→\s|:\s|\(|\)|,\s| or )/).map(p => {
    const t=p.trim();
    if (!t || /^(→|:|\(|\)|,|or)$/.test(t) || /^~|min\b|^\d/.test(t) || t.length<4) return esc(p);
    return `<a href="${gmq(t+', '+CTX)}" target="_blank" rel="noopener">${esc(p)}</a>`;
  }).join('');
}
function showTab(k){
  curTab=k;
  document.querySelectorAll('#s-day [data-panel]').forEach(p => p.hidden = p.dataset.panel!==k);
  document.querySelectorAll('#s-day .seg-ctl [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab===k?'true':'false'));
}
function pageHero(title, sub, extra=''){
  return `<header class="hero page-hero"><div class="bar"><button class="iconbtn" type="button" data-go="home" aria-label="${S.back}">${I.back}</button><span></span></div>
    <h1>${title}</h1><p>${sub}</p>${extra}</header>`;
}
function renderMap(){
  $('#s-map').innerHTML = pageHero(S.mapTitle, esc(M.routeSummary||'')) + `<div class="page-body"><div class="mapbox">${overviewMap()}</div>
    <p class="hint">${S.mapHint2}</p><ul class="legs">${DATA.dests.map(x => `<li><button type="button" data-day="${x.day}"><img src="${art(x.art)}" alt="" width="52" height="52" loading="lazy">
    <div><div class="t">${esc(x.name)}</div><div class="s">${esc([x.name_en,x.hotel].filter(Boolean).join(' · '))}</div></div><span class="d"><bdi dir="ltr">${esc(x.dates)}</bdi></span></button></li>`).join('')}</ul></div>`;
}
function renderBook(){
  const done=store.get('book',{}), n=DATA.book.length, c=Object.values(done).filter(Boolean).length;
  $('#s-book').innerHTML = pageHero(S.bookTitle, S.bookSub, `<div class="progress"><div class="bar2"><i style="width:${n?c/n*100:0}%"></i></div><span id="bkCount">${c}/${n}</span></div>`) +
  `<div class="page-body"><ul class="checks">${DATA.book.map((b,i) => `<li><label><input type="checkbox" data-i="${i}" ${done[i]?'checked':''}>
    <div><div class="t">${esc(b.what)}</div><div class="m">${esc([b.when,b.where,b.notes].filter(Boolean).join(' · '))}</div></div></label></li>`).join('')}</ul>
    ${(DATA.notes||[]).length?`<h2 class="h">${S.checkTitle}</h2><ul class="notes">${DATA.notes.map(x => `<li class="${x.priority==='high'?'hi':x.priority==='mid'?'mid':''}">
      <div class="d">${esc(x.date||'')} · ${S.priority} ${esc(S.pr[x.priority]||x.priority||'')}</div><div class="t">${esc(x.topic)}</div>
      ${x.plan?`<div class="q">${S.inPlan}: ${esc(x.plan)}</div>`:''}<div class="a">${esc(x.advice)}</div></li>`).join('')}</ul>`:''}</div>`;
  $('#s-book').querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => {
    const s=store.get('book',{}); s[cb.dataset.i]=cb.checked; store.set('book',s);
    const c2=Object.values(s).filter(Boolean).length; $('#s-book .progress i').style.width=(c2/n*100)+'%'; $('#bkCount').textContent=c2+'/'+n;
  }));
}
function renderTips(){
  CTX = M.country || '';
  $('#s-tips').innerHTML = pageHero(S.tipsTitle, S.tipsSub) + `<div class="page-body">
    ${(DATA.tips||[]).map(t => `<details class="acc"><summary><span class="ic" aria-hidden="true">${t.icon||'•'}</span><span>${esc(t.title)}<small>${esc(t.group||'')}</small></span></summary>${opts(t.body)}</details>`).join('')}
    ${(DATA.shop||[]).length?`<h2 class="h">${S.shopGuide}</h2>${DATA.shop.map((s,i) => `<details class="acc"${i===0?' open':''}><summary><span class="ic" aria-hidden="true">🛍️</span><span>${esc(s.title)}</span></summary>${opts(s.body)}</details>`).join('')}`:''}</div>`;
}

/* ---------- navigation ---------- */
function buildTabbar(){
  $('nav.tabbar').innerHTML = [['home',I.home,S.home],['today',I.cal,S.today],['map',I.map,S.map],['book',I.check,S.book],['tips',I.tips,S.tips]]
    .map(([k,ic,t]) => `<button type="button" data-go="${k}">${ic}${t}</button>`).join('');
}
const screens=['home','day','map','book','tips'];
function show(name){
  screens.forEach(s => $('#s-'+s).hidden = s!==name);
  document.querySelectorAll('nav.tabbar [data-go]').forEach(b => { b.removeAttribute('aria-current'); if (b.dataset.go===name || (b.dataset.go==='today'&&name==='day')) b.setAttribute('aria-current','page'); });
  window.scrollTo(0,0);
}
function openDay(i){ cur=Math.max(0,Math.min(N-1,i)); store.set('day',cur); renderDay(cur); show('day'); history.replaceState(null,'','#day-'+(cur+1)); }
function route(name){
  if (name==='today'){ const t=todayIdx(); return openDay(t>=0?t:store.get('day',0)); }
  if (name==='tips') renderTips(); if (name==='home') renderHome();
  show(name); history.replaceState(null,'', name==='home'?'#':'#'+name);
}
document.addEventListener('click', e => {
  const d=e.target.closest('[data-day]'); if (d && !e.target.closest('a')) return openDay(+d.dataset.day);
  const g=e.target.closest('[data-go]'); if (g) route(g.dataset.go);
});
document.addEventListener('keydown', e => { const n=e.target.closest&&e.target.closest('svg .node'); if (n&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDay(+n.dataset.day);} });
function fromHash(){
  const h=location.hash, m=h.match(/^#day-(\d+)$/);
  if (m) return openDay(+m[1]-1);
  if (['#map','#book','#tips'].includes(h)) return route(h.slice(1));
  renderHome(); show('home');
}
buildTabbar(); renderMap(); renderBook(); renderTips();
window.addEventListener('hashchange', fromHash);
fromHash();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
