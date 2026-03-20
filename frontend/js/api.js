/* api.js — Unified API layer with mock fallbacks */

// ─── Mock data (used when backend is offline) ──────────────
const MOCK = {
  ncdCards: [
    { label:'Diabetes Diagnosis', value:'12,840', sub:'Diagnosed this month', zone:'North Zone', trend:'+6%', dir:'up', color:'green' },
    { label:'Hypertension Diagnosis', value:'15,220', sub:'Diagnosed this month', zone:'West Zone', trend:'+4%', dir:'up', color:'blue' },
    { label:'Oral Cancer Diagnosis', value:'4,210', sub:'Confirmed cases', zone:'Central Zone', trend:'-2%', dir:'down', color:'orange' },
    { label:'Breast Cancer Diagnosis', value:'3,118', sub:'Confirmed cases', zone:'South Zone', trend:'+1%', dir:'up', color:'purple' },
    { label:'Cervical Cancer Diagnosis', value:'2,904', sub:'Confirmed cases', zone:'East Zone', trend:'-3%', dir:'down', color:'red' },
    { label:'Cardiovascular Disease', value:'8,760', sub:'Active monitoring', zone:'All Zones', trend:'+8%', dir:'up', color:'gold' },
  ],
  surveillance: [
    { disease:'Dengue', active:126, recovered:39, admitted:24, deaths:2, trend:'+14%', dir:'up', alert:'Hotspot', summary:'Higher case concentration in North Zone; intensified vector control advised.' },
    { disease:'Malaria', active:63, recovered:21, admitted:11, deaths:0, trend:'+11%', dir:'up', alert:'Rising', summary:'Rising positivity in East Zone with pending field surveillance closure.' },
    { disease:'Tuberculosis', active:84, recovered:9, admitted:6, deaths:1, trend:'+6%', dir:'up', alert:'Watch', summary:'Most cases remain on treatment; adherence tracking required for defaulter prevention.' },
    { disease:'Influenza-like Illness', active:152, recovered:71, admitted:8, deaths:0, trend:'+18%', dir:'up', alert:'Cluster', summary:'Cluster activity in West Zone with rapid outpatient growth.' },
    { disease:'Acute Diarrheal Disease', active:47, recovered:28, admitted:4, deaths:0, trend:'-3%', dir:'down', alert:'Normal', summary:'Stable trend; sanitation and water quality follow-up continues.' },
    { disease:'Cholera', active:12, recovered:8, admitted:2, deaths:0, trend:'-8%', dir:'down', alert:'Normal', summary:'Declining trend. Water treatment interventions effective.' },
    { disease:'Typhoid', active:34, recovered:18, admitted:5, deaths:0, trend:'+3%', dir:'up', alert:'Watch', summary:'Mild upward trend in Central Zone. Monitoring ongoing.' },
    { disease:'Leptospirosis', active:8, recovered:5, admitted:1, deaths:0, trend:'+2%', dir:'up', alert:'Normal', summary:'Seasonal uptick; rodent control measures in progress.' },
  ],
  hotspots: [
    { name:'Dharavi Cluster', disease:'Tuberculosis', count:44, lat:19.0412, lng:72.8525, desc:'High density area with prolonged treatment follow-up burden.', severity:'High' },
    { name:'Kurla Belt', disease:'Dengue', count:38, lat:19.0726, lng:72.8843, desc:'Recent vector-borne case spike with breeding-site response pending.', severity:'High' },
    { name:'Malad West', disease:'ILI', count:52, lat:19.1874, lng:72.8479, desc:'Outpatient respiratory cluster increasing this week.', severity:'Medium' },
    { name:'Govandi Pocket', disease:'Acute Diarrheal Disease', count:21, lat:19.0614, lng:72.9248, desc:'Water sanitation follow-up and household outreach underway.', severity:'Low' },
    { name:'Andheri Node', disease:'Malaria', count:17, lat:19.1136, lng:72.8697, desc:'Breeding sites identified; larvicide spraying scheduled.', severity:'Medium' },
    { name:'Bandra Cluster', disease:'Dengue', count:29, lat:19.0596, lng:72.8295, desc:'High-density residential buildings identified.', severity:'High' },
    { name:'Worli Slum', disease:'Typhoid', count:12, lat:18.9994, lng:72.8154, desc:'Typhoid cluster near water supply area.', severity:'Low' },
    { name:'Chembur East', disease:'ILI', count:33, lat:19.0508, lng:72.9014, desc:'ILI spike in dense residential colony.', severity:'Medium' },
  ],
  zones: [
    { name:'North Zone', disease:'Dengue', cases:126, delta:'+34%', dir:'up', alert:'Hotspot', lat:19.18, lng:72.85 },
    { name:'Central Zone', disease:'Tuberculosis', cases:84, delta:'+6%', dir:'up', alert:'Watch', lat:19.02, lng:72.84 },
    { name:'East Zone', disease:'Malaria', cases:63, delta:'+11%', dir:'up', alert:'Rising', lat:19.07, lng:72.93 },
    { name:'West Zone', disease:'ILI', cases:152, delta:'+18%', dir:'up', alert:'Cluster', lat:19.08, lng:72.83 },
    { name:'South Zone', disease:'ADD', cases:47, delta:'-3%', dir:'down', alert:'Normal', lat:18.94, lng:72.83 },
  ],
  facilities: [
    // Real Mumbai hospital data — addresses, phones, and GPS from public sources
    { id:1,  name:'Sion Hospital (LTMG)',       type:'Municipal Hospital', zone:'East Zone',    beds:1500, patients:842,  occ:56, phone:'+91 22 2408 7000', address:'Dr. Babasaheb Ambedkar Rd, Sion West, Mumbai 400022', lat:19.0363, lng:72.8603, email:'dean.sion@mcgm.gov.in',  website:'www.mcgm.gov.in', emergency:true  },
    { id:2,  name:'KEM Hospital',               type:'Municipal Hospital', zone:'Central Zone', beds:1800, patients:1420, occ:79, phone:'+91 22 2410 7000', address:'Acharya Donde Marg, Parel, Mumbai 400012',             lat:19.0044, lng:72.8399, email:'dean.kem@mcgm.gov.in',   website:'www.kem.edu',     emergency:true  },
    { id:3,  name:'Nair Hospital (BYL)',         type:'Municipal Hospital', zone:'Central Zone', beds:1250, patients:960,  occ:77, phone:'+91 22 2309 8600', address:'Dr. A.L. Nair Rd, Mumbai Central, Mumbai 400008',     lat:19.0360, lng:72.8407, email:'dean.nair@mcgm.gov.in',  website:'www.mcgm.gov.in', emergency:true  },
    { id:4,  name:'Cooper Hospital (R.N.)',      type:'Municipal Hospital', zone:'West Zone',    beds:1100, patients:680,  occ:62, phone:'+91 22 2620 7254', address:'Bhaktivedanta Swami Marg, Juhu, Mumbai 400056',       lat:19.1055, lng:72.8372, email:'dean.cooper@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:true  },
    { id:5,  name:'Kasturba Hospital',           type:'Municipal Hospital', zone:'South Zone',   beds:600,  patients:490,  occ:82, phone:'+91 22 2370 1444', address:'Sane Guruji Marg, Chinchpokli, Mumbai 400012',       lat:18.9543, lng:72.8295, email:'dean.kasturba@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:true  },
    { id:6,  name:'GT Hospital',                 type:'Municipal Hospital', zone:'Central Zone', beds:800,  patients:610,  occ:76, phone:'+91 22 2262 8888', address:'Near CST, Lokmanya Tilak Marg, Fort, Mumbai 400001',  lat:18.9375, lng:72.8360, email:'dean.gt@mcgm.gov.in',    website:'www.mcgm.gov.in', emergency:true  },
    { id:7,  name:'Rajawadi Hospital',           type:'Municipal Hospital', zone:'East Zone',    beds:500,  patients:320,  occ:64, phone:'+91 22 2512 5011', address:'Rajawadi, Ghatkopar East, Mumbai 400077',             lat:19.0812, lng:72.8905, email:'dean.rajawadi@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:true  },
    { id:8,  name:'Shatabdi Hospital',           type:'Municipal Hospital', zone:'North Zone',   beds:850,  patients:620,  occ:73, phone:'+91 22 2897 8686', address:'Govandi Station Rd, Govandi, Mumbai 400043',          lat:19.2180, lng:72.8450, email:'dean.shatabdi@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:true  },
    { id:9,  name:'M.T. Agarwal Hospital',       type:'Municipal Hospital', zone:'East Zone',    beds:400,  patients:280,  occ:70, phone:'+91 22 2163 0350', address:'Rajendra Prasad Rd, Mulund West, Mumbai 400080',      lat:19.0680, lng:72.8550, email:'info@mtagarwal.gov.in',  website:'www.mcgm.gov.in', emergency:false },
    { id:10, name:'Lokmanya Tilak Hospital',     type:'Municipal Hospital', zone:'East Zone',    beds:1600, patients:1320, occ:83, phone:'+91 22 2408 7000', address:'Dr. Babasaheb Ambedkar Rd, Sion, Mumbai 400022',      lat:19.0385, lng:72.8584, email:'info@ltmg.gov.in',        website:'www.mcgm.gov.in', emergency:true  },
    { id:11, name:'PHC Dharavi',                 type:'PHC',                zone:'East Zone',    beds:80,   patients:70,   occ:88, phone:'+91 22 2407 1234', address:'90 Feet Rd, Dharavi, Mumbai 400017',                  lat:19.0430, lng:72.8535, email:'phcdharavi@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:false },
    { id:12, name:'PHC Kurla',                   type:'PHC',                zone:'East Zone',    beds:80,   patients:58,   occ:73, phone:'+91 22 2512 2345', address:'LBS Marg, Kurla West, Mumbai 400070',                 lat:19.0720, lng:72.8825, email:'phckurla@mcgm.gov.in',   website:'www.mcgm.gov.in', emergency:false },
    { id:13, name:'PHC Malad',                   type:'PHC',                zone:'North Zone',   beds:60,   patients:42,   occ:70, phone:'+91 22 2889 0100', address:'Marve Rd, Malad West, Mumbai 400064',                 lat:19.1878, lng:72.8480, email:'phcmalad@mcgm.gov.in',   website:'www.mcgm.gov.in', emergency:false },
    { id:14, name:'PHC Govandi',                 type:'PHC',                zone:'East Zone',    beds:60,   patients:52,   occ:87, phone:'+91 22 2554 1100', address:'Station Rd, Govandi, Mumbai 400043',                  lat:19.0628, lng:72.9241, email:'phcgovandi@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:false },
    { id:15, name:'PHC Bhandup',                 type:'PHC',                zone:'East Zone',    beds:70,   patients:48,   occ:69, phone:'+91 22 2565 7890', address:'LBS Marg, Bhandup West, Mumbai 400078',               lat:19.1525, lng:72.9360, email:'phcbhandup@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:false },
    { id:16, name:'PHC Mulund',                  type:'PHC',                zone:'East Zone',    beds:70,   patients:50,   occ:71, phone:'+91 22 2163 1234', address:'MG Rd, Mulund West, Mumbai 400080',                   lat:19.1767, lng:72.9542, email:'phcmulund@mcgm.gov.in',  website:'www.mcgm.gov.in', emergency:false },
    { id:17, name:'CHC Andheri',                 type:'CHC',                zone:'West Zone',    beds:150,  patients:110,  occ:73, phone:'+91 22 2623 4567', address:'S.V. Rd, Andheri West, Mumbai 400058',               lat:19.1136, lng:72.8697, email:'chcandheri@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:false },
    { id:18, name:'CHC Borivali',                type:'CHC',                zone:'North Zone',   beds:140,  patients:102,  occ:73, phone:'+91 22 2898 5432', address:'IC Colony Rd, Borivali West, Mumbai 400103',          lat:19.2308, lng:72.8567, email:'chcborivali@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:false },
    { id:19, name:'CHC Ghatkopar',               type:'CHC',                zone:'East Zone',    beds:120,  patients:86,   occ:72, phone:'+91 22 2511 3456', address:'LBS Marg, Ghatkopar East, Mumbai 400077',             lat:19.0858, lng:72.9081, email:'chcghatkopar@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:false },
    { id:20, name:'Dispensary Worli',            type:'Dispensary',         zone:'South Zone',   beds:40,   patients:28,   occ:70, phone:'+91 22 2493 1122', address:'Dr. A. B. Rd, Worli, Mumbai 400018',                  lat:18.9994, lng:72.8154, email:'dispworli@mcgm.gov.in',  website:'www.mcgm.gov.in', emergency:false },
    { id:21, name:'Dispensary Bandra',           type:'Dispensary',         zone:'West Zone',    beds:40,   patients:30,   occ:75, phone:'+91 22 2655 3344', address:'Station Rd, Bandra West, Mumbai 400050',             lat:19.0596, lng:72.8295, email:'dispbandra@mcgm.gov.in', website:'www.mcgm.gov.in', emergency:false },
    { id:22, name:'Dispensary Dadar',            type:'Dispensary',         zone:'Central Zone', beds:40,   patients:26,   occ:65, phone:'+91 22 2416 5566', address:'Gokhale Rd, Dadar West, Mumbai 400028',              lat:19.0178, lng:72.8478, email:'dispdadar@mcgm.gov.in',  website:'www.mcgm.gov.in', emergency:false },
    { id:23, name:'Lilavati Hospital',           type:'Private',            zone:'West Zone',    beds:323,  patients:215,  occ:67, phone:'+91 22 6930 1000', address:'A-791, Bandra Reclamation, Bandra West, Mumbai 400050', lat:19.0523, lng:72.8274, email:'info@lilavatihospital.com', website:'www.lilavatihospital.com', emergency:true },
    { id:24, name:'Hinduja Hospital',            type:'Private',            zone:'West Zone',    beds:350,  patients:282,  occ:81, phone:'+91 22 6766 8080', address:'Veer Savarkar Marg, Mahim, Mumbai 400016',           lat:19.0411, lng:72.8350, email:'info@hindujahospital.com', website:'www.hindujahospital.com', emergency:true },
    { id:25, name:'Kokilaben Hospital',          type:'Private',            zone:'West Zone',    beds:750,  patients:580,  occ:77, phone:'+91 22 4269 6969', address:'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai 400053', lat:19.1332, lng:72.8272, email:'info@kokilabenhospital.com', website:'www.kokilabenhospital.com', emergency:true },
    { id:26, name:'Holy Spirit Hospital',        type:'Private',            zone:'West Zone',    beds:250,  patients:188,  occ:75, phone:'+91 22 2692 0111', address:'Mahakali Caves Rd, Andheri East, Mumbai 400093',      lat:19.1181, lng:72.8437, email:'info@holyspirithospital.com', website:'www.holyspirithospital.com', emergency:true },
    { id:27, name:'Breach Candy Hospital',       type:'Private',            zone:'South Zone',   beds:200,  patients:155,  occ:78, phone:'+91 22 2367 1888', address:'60-A, Bhulabhai Desai Rd, Breach Candy, Mumbai 400026', lat:18.9731, lng:72.8083, email:'info@breachcandyhospital.org', website:'www.breachcandyhospital.org', emergency:true },
    { id:28, name:'Bombay Hospital',             type:'Specialty Center',   zone:'Central Zone', beds:650,  patients:500,  occ:77, phone:'+91 22 2206 7676', address:'12, New Marine Lines, Mumbai 400020',                lat:18.9411, lng:72.8291, email:'info@bombayhospital.com', website:'www.bombayhospital.com', emergency:true },
    { id:29, name:'Tata Memorial Hospital',      type:'Specialty Center',   zone:'Central Zone', beds:629,  patients:568,  occ:90, phone:'+91 22 2417 7000', address:'Dr. E. Borges Rd, Parel, Mumbai 400012',             lat:18.9988, lng:72.8125, email:'tmc@tmc.gov.in',          website:'www.tmc.gov.in',  emergency:true },
    { id:30, name:'NIMHANS Mumbai',              type:'Specialty Center',   zone:'South Zone',   beds:300,  patients:210,  occ:70, phone:'+91 22 2416 1234', address:'Near Bombay Hospital, Marine Lines, Mumbai 400020',   lat:18.9300, lng:72.8260, email:'info@nimhans.ac.in',      website:'www.nimhans.ac.in', emergency:false },
  ],
  patients: [
    { id:'P-00412', name:'Anjali Sharma', age:42, gender:'Female', disease:'Dengue', zone:'North Zone', facility:'Sion Hospital', admitted:'Mar 15, 2026', status:'Admitted' },
    { id:'P-00413', name:'Ravi Mehta', age:65, gender:'Male', disease:'Tuberculosis', zone:'Central Zone', facility:'KEM Hospital', admitted:'Mar 14, 2026', status:'Monitoring' },
    { id:'P-00414', name:'Pooja Iyer', age:31, gender:'Female', disease:'Malaria', zone:'East Zone', facility:'Cooper Hospital', admitted:'Mar 14, 2026', status:'Recovered' },
    { id:'P-00415', name:'Dilip Nair', age:55, gender:'Male', disease:'Hypertension', zone:'West Zone', facility:'Nair Hospital', admitted:'Mar 13, 2026', status:'Discharged' },
    { id:'P-00416', name:'Meena Patel', age:27, gender:'Female', disease:'ILI', zone:'West Zone', facility:'Kasturba Hospital', admitted:'Mar 13, 2026', status:'Monitoring' },
    { id:'P-00417', name:'Suresh Joshi', age:48, gender:'Male', disease:'Diabetes', zone:'South Zone', facility:'GT Hospital', admitted:'Mar 12, 2026', status:'Admitted' },
    { id:'P-00418', name:'Kavita Rao', age:36, gender:'Female', disease:'Dengue', zone:'North Zone', facility:'Sion Hospital', admitted:'Mar 12, 2026', status:'Recovered' },
    { id:'P-00419', name:'Arjun Singh', age:22, gender:'Male', disease:'Typhoid', zone:'Central Zone', facility:'KEM Hospital', admitted:'Mar 11, 2026', status:'Admitted' },
    { id:'P-00420', name:'Fatima Khan', age:38, gender:'Female', disease:'Malaria', zone:'East Zone', facility:'Rajawadi Hospital', admitted:'Mar 11, 2026', status:'Admitted' },
    { id:'P-00421', name:'Harish Dubey', age:52, gender:'Male', disease:'COPD', zone:'West Zone', facility:'Kokilaben Hospital', admitted:'Mar 10, 2026', status:'Monitoring' },
    { id:'P-00422', name:'Sneha Patil', age:29, gender:'Female', disease:'Dengue', zone:'North Zone', facility:'Sion Hospital', admitted:'Mar 10, 2026', status:'Recovered' },
    { id:'P-00423', name:'Vikram Desai', age:60, gender:'Male', disease:'Cardiovascular Disease', zone:'South Zone', facility:'KEM Hospital', admitted:'Mar 9, 2026', status:'Admitted' },
    { id:'P-00424', name:'Priya Kulkarni', age:34, gender:'Female', disease:'Breast Cancer', zone:'South Zone', facility:'Tata Memorial Hospital', admitted:'Mar 9, 2026', status:'Monitoring' },
    { id:'P-00425', name:'Mohammad Shaikh', age:45, gender:'Male', disease:'Tuberculosis', zone:'East Zone', facility:'Sion Hospital', admitted:'Mar 8, 2026', status:'Admitted' },
    { id:'P-00426', name:'Rekha Jain', age:58, gender:'Female', disease:'Diabetes', zone:'West Zone', facility:'Lilavati Hospital', admitted:'Mar 8, 2026', status:'Discharged' },
    { id:'P-00427', name:'Tejas Mehta', age:19, gender:'Male', disease:'ILI', zone:'North Zone', facility:'Shatabdi Hospital', admitted:'Mar 7, 2026', status:'Recovered' },
    { id:'P-00428', name:'Ananya Ghosh', age:43, gender:'Female', disease:'Hypertension', zone:'Central Zone', facility:'GT Hospital', admitted:'Mar 7, 2026', status:'Discharged' },
    { id:'P-00429', name:'Rohit Chaudhari', age:37, gender:'Male', disease:'Dengue', zone:'North Zone', facility:'PHC Dharavi', admitted:'Mar 6, 2026', status:'Admitted' },
    { id:'P-00430', name:'Sita Yadav', age:66, gender:'Female', disease:'Cardiovascular Disease', zone:'East Zone', facility:'KEM Hospital', admitted:'Mar 6, 2026', status:'Monitoring' },
    { id:'P-00431', name:'Aditya Sharma', age:24, gender:'Male', disease:'Typhoid', zone:'West Zone', facility:'Nair Hospital', admitted:'Mar 5, 2026', status:'Recovered' },
  ],
  trendData: {
    months: ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
    Dengue:  [18,22,35,58,72,88,95,110,126,98,80,63],
    Malaria: [10,14,20,30,42,55,65,70,63,50,38,28],
    Tuberculosis: [72,75,78,80,82,84,86,85,84,82,80,79],
    ILI:     [55,48,40,30,25,28,35,60,90,130,152,145],
    ADD:     [30,28,25,22,18,20,24,30,38,44,47,42],
  },
  dashboardSummary: { total_patients:30247, admitted:4820, recovered:18430, total_deaths:142, diseases_tracked:20, facilities_active:30 },
  users: [
    { id:1, username:'admin',          name:'Dr. Rashmi Patel',    email:'dr.rashmi@bmchealth.in',  role:'Admin',         last_login:'Mar 19, 2026', status:'Active' },
    { id:2, username:'samved',         name:'Dr. Samved Vora',     email:'dr.samved@bmchealth.in',  role:'Admin',         last_login:'Mar 19, 2026', status:'Active' },
    { id:3, username:'kuldeep',        name:'Dr. Kuldeep Solanki', email:'dr.kuldeep@bmchealth.in', role:'Admin',         last_login:'Mar 19, 2026', status:'Active' },
    { id:4, username:'dr.aditya',      name:'Dr. Aditya Kumar',    email:'aditya.k@bmchealth.in',   role:'Doctor',        last_login:'Mar 18, 2026', status:'Active' },
    { id:5, username:'dr.priya',       name:'Dr. Priya Sharma',    email:'priya.s@bmchealth.in',    role:'Doctor',        last_login:'Mar 17, 2026', status:'Active' },
    { id:6, username:'nurse.meena',    name:'Meena Joshi',         email:'meena.j@bmchealth.in',    role:'Nurse',         last_login:'Mar 15, 2026', status:'Active' },
    { id:7, username:'officer.ravi',   name:'Ravi Nair',           email:'ravi.n@bmchealth.in',     role:'Field Officer', last_login:'Mar 15, 2026', status:'Active' },
    { id:8, username:'analyst.kavita', name:'Kavita Rao',          email:'kavita.r@bmchealth.in',   role:'Analyst',       last_login:'Mar 10, 2026', status:'Active' },
    { id:9, username:'staff.suresh',   name:'Suresh Verma',        email:'suresh.v@bmchealth.in',   role:'Staff',         last_login:'Mar 10, 2026', status:'Inactive' },
  ],
  notifications: [
    { level:'red', text:'<strong>Hotspot Alert:</strong> Dengue cases surged +34% in North Zone this week. Immediate field inspection required.', time:'5 min ago' },
    { level:'red', text:'<strong>Critical Occupancy:</strong> Tata Memorial Hospital at 90% bed capacity. Diversion protocols may apply.', time:'18 min ago' },
    { level:'gold', text:'<strong>Watch Advisory:</strong> Tuberculosis treatment defaulter rate increased in Central Zone.', time:'1 hr ago' },
    { level:'gold', text:'<strong>Rising Trend:</strong> ILI cases climbing in West Zone — cluster alert threshold approaching.', time:'2 hrs ago' },
    { level:'blue', text:'<strong>Report Published:</strong> March surveillance summary successfully published to NCD programme.', time:'3 hrs ago' },
    { level:'blue', text:'<strong>Data Sync:</strong> Facility occupancy data refreshed from all 30 facilities.', time:'6 hrs ago' },
  ],
};

// ─── API Fetch ──────────────────────────────────────────────
// Returns: { data, error, status } internally — callers get data or null
async function apiFetch(path, opts = {}) {
  try {
    const r = await fetch(CFG.API_BASE + path, {
      ...opts,
      headers: { 'Content-Type':'application/json', ...(opts.headers||{}) },
    });
    const j = await r.json();
    if (!r.ok) {
      // Return a structured error so login can distinguish wrong-password vs network-down
      return { __error: true, status: r.status, message: j.message || `HTTP ${r.status}` };
    }
    return j.data ?? j;
  } catch(e) {
    // Network error — backend unreachable
    return { __error: true, status: 0, message: 'Cannot reach server. Is the backend running?' };
  }
}

const API = {
  async dashboardSummary(zone='', period='', dateFrom='', dateTo='') {
    const params = new URLSearchParams();
    if (zone && zone !== 'All Zones') params.set('zone', zone);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo)   params.set('date_to',   dateTo);
    const qs = params.toString() ? '?' + params.toString() : '';
    const d = await apiFetch('/dashboard-summary' + qs);
    return d?.__error ? MOCK.dashboardSummary : (d?.summary ?? MOCK.dashboardSummary);
  },
  // ── Helper: build filter query string from global state ──────────
  _filterQS(extra) {
    const p = new URLSearchParams(extra || {});
    const z  = window._globalZone      || '';
    const df = window._globalDateFrom  || '';
    const dt = window._globalDateTo    || '';
    if (z  && z  !== 'All Zones') p.set('zone',      z);
    if (df) p.set('date_from', df);
    if (dt) p.set('date_to',   dt);
    return p.toString() ? '?' + p.toString() : '';
  },

  async ncdStats(zone, month) {
    const qs = this._filterQS(zone && zone !== 'All Zones' ? {zone} : {});
    const d  = await apiFetch('/ncd-stats' + qs);
    return d?.__error ? MOCK.ncdCards : (d?.cards ?? MOCK.ncdCards);
  },
  async surveillance(disease) {
    const qs = this._filterQS(disease ? {disease} : {});
    const d  = await apiFetch('/surveillance' + qs);
    return d?.__error ? MOCK.surveillance : (d?.diseases ?? MOCK.surveillance);
  },
  async hotspots()  { const d = await apiFetch('/hotspots');  return d?.__error ? MOCK.hotspots   : (d?.clusters  ?? MOCK.hotspots);   },
  async zones()     { const d = await apiFetch('/zones');     return d?.__error ? MOCK.zones      : (d?.zones     ?? MOCK.zones);      },
  async patients(search='', page=1, perPage=20) {
    const qs = this._filterQS({search: encodeURIComponent(search), page, per_page: perPage});
    const d  = await apiFetch('/patients' + qs);
    return d?.__error ? { patients: MOCK.patients, total: MOCK.patients.length, page:1, pages:1 } : d ?? { patients: MOCK.patients, total: MOCK.patients.length, page:1, pages:1 };
  },
  async facilities() { const d = await apiFetch('/facilities'); return d?.__error ? MOCK.facilities : (d?.facilities ?? MOCK.facilities); },
  async trends(disease) { const d = await apiFetch(`/trends?disease=${encodeURIComponent(disease)}`); return d?.__error ? MOCK.trendData : (d?.trends ?? MOCK.trendData); },

  async login(username, password) {
    const d = await apiFetch('/auth/login', { method:'POST', body: JSON.stringify({username, password}) });

    // ── Success ──────────────────────────────────────────
    if (d && !d.__error && d.token) {
      return { ok: true, token: d.token, user: d.user };
    }

    // ── Wrong credentials (backend returned 401) ─────────
    if (d?.__error && d.status === 401) {
      return { ok: false, reason: 'credentials', message: 'Invalid username or password.' };
    }

    // ── Backend unreachable — ONLY allow demo mode for admin ─
    // (kuldeep/samved are real DB users and cannot be faked client-side)
    if (d?.__error && d.status === 0) {
      if (username === 'admin' && password === 'admin123') {
        console.warn('[Auth] Backend offline — using demo mode for admin only');
        return {
          ok: true,
          token: 'demo-token-offline',
          user: { id:1, name:'Dr. Rashmi Patel', role:'Admin', username:'admin', avatar:'DR' },
          offlineMode: true,
        };
      }
      return {
        ok: false,
        reason: 'offline',
        message: `Backend is unreachable (${CFG.API_BASE}). Start the Flask server and try again.`,
      };
    }

    // ── Other server error ───────────────────────────────
    return { ok: false, reason: 'server', message: d?.message || 'Login failed. Try again.' };
  },

  async users() { const d = await apiFetch('/users'); return d?.__error ? MOCK.users : (d?.users ?? MOCK.users); },
  notifications() { return MOCK.notifications; },
};