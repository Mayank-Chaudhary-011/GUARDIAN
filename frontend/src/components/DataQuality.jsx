import { useState, useRef } from 'react';

/* ── CSV parsing helpers ── */
const nullSet = new Set(['', 'nan', 'null', 'na', 'n/a', 'none', 'nil']);
const isNull  = v => nullSet.has(String(v).toLowerCase().trim());
const getType = vals => {
  const ne = vals.filter(v => !isNull(v));
  if (!ne.length) return 'empty';
  return ne.filter(v => !isNaN(v)).length / ne.length > 0.8 ? 'numeric' : 'categorical';
};
const getMean = vals => {
  const n = vals.filter(v => !isNull(v) && !isNaN(v)).map(Number);
  return n.length ? (n.reduce((a,b)=>a+b,0)/n.length).toFixed(4) : null;
};
const getMedian = vals => {
  const n = vals.filter(v => !isNull(v) && !isNaN(v)).map(Number).sort((a,b)=>a-b);
  if (!n.length) return null;
  const m = Math.floor(n.length/2);
  return (n.length%2 ? n[m] : (n[m-1]+n[m])/2).toFixed(4);
};
const getMode = vals => {
  const c = {}; vals.filter(v=>!isNull(v)).forEach(v=>{c[v]=(c[v]||0)+1;});
  const k = Object.keys(c); return k.length ? k.reduce((a,b)=>c[a]>=c[b]?a:b) : null;
};
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l=>l.trim());
  if (lines.length < 2) throw new Error('Need header + at least one data row');
  const split = line => {
    const res=[]; let cur='',inQ=false;
    for(const c of line){
      if(c==='"'){inQ=!inQ;}
      else if(c===','&&!inQ){res.push(cur.trim());cur='';}
      else cur+=c;
    }
    res.push(cur.trim()); return res;
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1).map(line=>{
    const vals=split(line),row={};
    headers.forEach((h,i)=>{row[h]=vals[i]!==undefined?vals[i]:'';});
    return row;
  });
  return {headers,rows};
}

export default function DataQuality() {
  const [paste, setPaste]       = useState('');
  const [csvData, setCsvData]   = useState(null);
  const [cleaned, setCleaned]   = useState(null);
  const fileRef = useRef(null);

  const handleFile = e => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPaste(ev.target.result);
    reader.readAsText(file);
  };

  const analyze = () => {
    try {
      const {headers,rows} = parseCSV(paste);
      let totalNull = 0;
      const colActions = {};
      const stats = headers.map(h => {
        const vals = rows.map(r=>r[h]);
        const nc   = vals.filter(isNull).length;
        const type = getType(vals);
        totalNull += nc;
        colActions[h] = {fill:'none',fillVal:'',encode:'none'};
        return {h,type,nc,total:rows.length,
          pct:((nc/rows.length)*100).toFixed(1),
          mean:type==='numeric'?getMean(vals):null,
          median:type==='numeric'?getMedian(vals):null,
          mode:getMode(vals)};
      });
      setCsvData({headers,rows,stats,totalNull,colActions});
      setCleaned(null);
    } catch(e){ alert(e.message); }
  };

  const setAction = (col,key,val) => {
    setCsvData(prev=>{
      const ca = {...prev.colActions,[col]:{...prev.colActions[col],[key]:val}};
      if(key==='fill'&&val==='custom'){
        const v = prompt(`Custom fill value for "${col}":`);
        ca[col].fillVal = v??'';
      }
      return {...prev,colActions:ca};
    });
  };

  const applyClean = () => {
    const {headers,rows,colActions} = csvData;
    let result = rows.map(r=>({...r}));

    // Fill
    headers.forEach(h=>{
      const a=colActions[h]; if(!a||a.fill==='none') return;
      const vals=rows.map(r=>r[h]);
      let fv;
      if(a.fill==='mean') fv=getMean(vals);
      else if(a.fill==='median') fv=getMedian(vals);
      else if(a.fill==='mode') fv=getMode(vals);
      else if(a.fill==='zero') fv='0';
      else if(a.fill==='custom') fv=a.fillVal;
      if(fv!=null) result.forEach(r=>{if(isNull(r[h])) r[h]=fv;});
    });

    // Drop rows
    headers.forEach(h=>{
      if(colActions[h]?.fill==='drop') result=result.filter(r=>!isNull(r[h]));
    });

    // Encode
    let newHeaders = [...headers];
    headers.forEach(h=>{
      const a=colActions[h]; if(!a||a.encode==='none') return;
      if(a.encode==='label'){
        const cats = [...new Set(result.map(r=>r[h]))].sort();
        const map  = {}; cats.forEach((c,i)=>{map[c]=i;});
        result.forEach(r=>{r[h]=map[r[h]]??0;});
      } else if(a.encode==='onehot'){
        const cats = [...new Set(result.map(r=>r[h]))].sort();
        const idx = newHeaders.indexOf(h);
        const added = cats.map(c=>`${h}_${c}`);
        newHeaders.splice(idx,1,...added);
        result.forEach(r=>{
          const val=r[h]; delete r[h];
          cats.forEach(c=>{r[`${h}_${c}`]=r[val]===c||val===c?1:0;});
        });
      }
    });

    setCleaned({headers:newHeaders,rows:result});
  };

  const downloadCSV = () => {
    if(!cleaned) return;
    const {headers,rows} = cleaned;
    const lines = [headers.join(','),...rows.map(r=>headers.map(h=>JSON.stringify(r[h]??'')).join(','))];
    const blob = new Blob([lines.join('\n')],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download='cleaned_data.csv'; a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Upload/Paste Panel */}
      <div className="card">
        <div className="sec-label">Data Quality & Preprocessing</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div
            className="dq-drop"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px', opacity: 0.6 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Click to Upload CSV</span>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>or drag and drop here</div>
          </div>
          <div>
            <textarea
              rows={4}
              style={{ minHeight: 96, fontSize: 12 }}
              placeholder="Or paste CSV content here (including header row)..."
              value={paste}
              onChange={e => setPaste(e.target.value)}
            />
          </div>
        </div>
        <button
          className="eval-btn"
          disabled={!paste.trim()}
          onClick={analyze}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Analyze CSV
        </button>
      </div>

      {/* Analysis & Actions Panel */}
      {csvData && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="sec-label" style={{ marginBottom: 2 }}>Dataset Analysis</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {csvData.rows.length} rows, {csvData.headers.length} columns, <span style={{ color: csvData.totalNull ? '#f43f5e' : '#10b981', fontWeight: 700 }}>{csvData.totalNull} missing values</span>
              </div>
            </div>
            <button className="eval-btn" style={{ width: 'auto', padding: '8px 18px' }} onClick={applyClean}>
              Apply & Transform
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Missing</th>
                  <th>Stats (Mean/Med/Mode)</th>
                  <th>Imputation Strategy</th>
                  <th>Encoding</th>
                </tr>
              </thead>
              <tbody>
                {csvData.stats.map(s => (
                  <tr key={s.h}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{s.h}</td>
                    <td>
                      <span className={`badge ${s.type==='numeric'?'badge-none':'badge-block'}`}>
                        {s.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: s.nc > 0 ? '#f43f5e' : '#10b981', fontWeight: 700 }}>
                        {s.nc} ({s.pct}%)
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: '#94a3b8' }}>
                      {s.type==='numeric' ? `μ:${s.mean} | m:${s.median}` : `mode:${s.mode}`}
                    </td>
                    <td>
                      <select
                        className="g-select"
                        value={csvData.colActions[s.h]?.fill}
                        onChange={e => setAction(s.h, 'fill', e.target.value)}
                      >
                        <option value="none">None (Keep)</option>
                        {s.type==='numeric' && <option value="mean">Mean</option>}
                        {s.type==='numeric' && <option value="median">Median</option>}
                        <option value="mode">Mode</option>
                        {s.type==='numeric' && <option value="zero">Zero (0)</option>}
                        <option value="custom">Custom Value...</option>
                        <option value="drop">Drop Rows</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="g-select"
                        value={csvData.colActions[s.h]?.encode}
                        onChange={e => setAction(s.h, 'encode', e.target.value)}
                      >
                        <option value="none">None</option>
                        {s.type==='categorical' && <option value="label">Label Encoding</option>}
                        {s.type==='categorical' && <option value="onehot">One-Hot Encoding</option>}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cleaned Result */}
      {cleaned && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="sec-label" style={{ color: '#10b981', marginBottom: 0 }}>
              Cleaned & Preprocessed Dataset
            </div>
            <button className="clear-btn" style={{ borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }} onClick={downloadCSV}>
              Download Cleaned CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  {cleaned.headers.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {cleaned.rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    {cleaned.headers.map(h => <td key={h}>{String(r[h] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cleaned.rows.length > 10 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textAlign: 'center' }}>
              Showing first 10 of {cleaned.rows.length} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
}
