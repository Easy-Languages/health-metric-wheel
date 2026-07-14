const _SURVEY_URL = "https://script.google.com/macros/s/AKfycbyiZqd_CktRnkI9KYJM3FukysCqnmmSAN64DLjp0YmRCD_vXwwpHiflNHKfepiJnk_E/exec";
const _TTL = 3600000;

const _cache = {
  get(key){
    try {
      const raw = sessionStorage.getItem(key);
      if(!raw) return null;
      const entry = JSON.parse(raw);
      if(Date.now() - entry.ts < _TTL) return entry.data;
      return null;
    } catch(e){ return null; }
  },
  getStale(key){
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw).data : null;
    } catch(e){ return null; }
  },
  set(key, data){
    try { sessionStorage.setItem(key, JSON.stringify({data, ts: Date.now()})); } catch(e){}
  },
  purgeAll(){
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith("hmw_cache:"))
        .forEach(k => sessionStorage.removeItem(k));
    } catch(e){}
  },
};

async function _fetch(key, url, extract){
  const hit = _cache.get(key);
  if(hit) return hit;
  try {
    const r = await fetch(url);
    const j = await r.json();
    const data = extract(j);
    _cache.set(key, data);
    return data;
  } catch(e){
    const stale = _cache.getStale(key);
    if(stale != null){ console.warn("[hmw] fetch failed, returning stale cache for", key); return stale; }
    throw e;
  }
}

async function fetchTeams(){
  return _fetch("hmw_cache:teams", _SURVEY_URL + "?action=teams", j => j.teams);
}

async function fetchRounds(){
  return _fetch("hmw_cache:rounds", _SURVEY_URL + "?action=rounds", j => j.rounds);
}

async function fetchScores(team, round){
  const key = "hmw_cache:scores:" + encodeURIComponent(team) + ":" + encodeURIComponent(round);
  const url = `${_SURVEY_URL}?action=scores&team=${encodeURIComponent(team)}&round=${encodeURIComponent(round)}`;
  return _fetch(key, url, j => j);
}

(function(){
  const p = new URLSearchParams(location.search);
  if(p.has("purge")){ _cache.purgeAll(); history.replaceState(null, "", location.pathname); console.log("Cache purged"); }
})();
