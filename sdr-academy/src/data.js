/* SDR Academy — procedural companies, prospects, archetypes. */
(function () {
  var S = window.SDRA;

  /* ---------------- Company generator ---------------- */
  S.INDUSTRIES = [
    { n:'Commercial Insurance', size:[400,2600], ai:2, stack:'Pega, Salesforce, Snowflake, Azure',
      pains:['Claims triage backlog','Underwriter time on routine submissions','Fraud review inconsistency'],
      triggers:['Regional carrier acquired','Regulatory reporting deadline','Claims backlog post-storm season'],
      init:['Claims modernization','Automation mandate from group parent'], rivals:['Guidewire','Duck Creek'] },
    { n:'Third-Party Logistics', size:[800,5200], ai:3, stack:'Oracle TMS, SAP, Kubernetes, Snowflake',
      pains:['Carrier rate quoting is manual','Dispatcher phones ringing constantly','Margin leakage on spot loads'],
      triggers:['New COO hired','Peak season capacity crunch','Acquired two regional brokers'],
      init:['Autonomous dispatch pilot','Driver-facing self-serve portal'], rivals:['project44','FourKites'] },
    { n:'Healthcare Provider Network', size:[2000,14000], ai:2, stack:'Epic, Cerner, ServiceNow, Mulesoft',
      pains:['Prior authorization staffing cost','Call center deflection pressure','Documentation burden on clinicians'],
      triggers:['CMS prior-auth rule change','RDA staffing freeze','Epic upgrade window'],
      init:['Ambient documentation','Patient access transformation'], rivals:['Abridge','Nuance DAX'] },
    { n:'Industrial Manufacturing', size:[1500,9000], ai:1, stack:'SAP, Maximo, OPC-UA, on-prem VMs',
      pains:['Maintenance knowledge trapped in 3 people','Downtime cost per hour is brutal','Compliance audit prep is manual'],
      triggers:['Plant closure rumor','New SVP Operations','Insurance renewal requiring audit trail'],
      init:['Predictive maintenance','Digital twin roadmap'], rivals:['IBM','Augury'] },
    { n:'Regional Banking', size:[1200,7000], ai:2, stack:'Salesforce, Mambu, Informatica, mainframe',
      pains:['Compliance evidence collection','KYC document review','Branch banker onboarding time'],
      triggers:['OCC exam scheduled','Core banking migration','New Chief Risk Officer'],
      init:['Responsible AI policy','Commercial banker productivity'], rivals:['Hebbia','Featurespace'] },
    { n:'Higher Education', size:[2000,20000], ai:2, stack:'Workday, Banner, Canvas, AWS',
      pains:['Advising caseload overload','Grant reporting burden','Student support response times'],
      triggers:['Budget cliff for next FY','New provost','Enrollment decline'],
      init:['Advising AI co-pilot','Admissions yield work'], rivals:['AdmitHub','Degree Analytics'] },
    { n:'Specialty Retail Chain', size:[1000,8000], ai:3, stack:'Shopify Plus, NetSuite, Klaviyo, BigQuery',
      pains:['Store labor scheduling','Returns processing cost','Marketing attribution is guesswork'],
      triggers:['Private equity owner change','Holiday plan locked','Store closures announced'],
      init:['Personalization everywhere','Store associate productivity'], rivals:['Blue Yonder','Zilliant'] },
    { n:'Staffing & Talent Firm', size:[300,2500], ai:2, stack:'Bullhorn, Greenhouse, outreach.io',
      pains:['Recruiter admin overload','Placement fee leakage','Client drop-off after intake'],
      triggers:['Record quarter','New business unit','Client SLA breach'],
      init:['Sourcing automation','Client self-service intake'], rivals:['Eightfold','HireVue'] },
    { n:'Energy & Utilities', size:[3000,22000], ai:1, stack:'Maximo, PI System, SAP, SCADA',
      pains:['Regulatory reporting','Field service dispatch','Outage communications'],
      triggers:['Rate case filing','Wildfire liability review','Grid modernization grant'],
      init:['Asset reliability','Customer service automation'], rivals:['GE Vernova','C3.ai'] },
    { n:'Professional Services Network', size:[500,4000], ai:3, stack:'Salesforce, Workday, Microsoft 365, Azure',
      pains:['Knowledge search across 4,000 people','Time entry compliance','Proposal production bottleneck'],
      triggers:['New practice group','Ramp-up program change','Attrition spike'],
      init:['Win themes automation','Expertise matching'], rivals:['Rogo','AlphaSense'] },
    { n:'Biotech', size:[200,1800], ai:3, stack:'Benchling, Veeva, AWS, Lab LIMS',
      pains:['Regulatory document assembly','Clinical site data access','Knowledge across trials'],
      triggers:['Series B closed','FDA submission deadline','Site activation wave'],
      init:['Trial intelligence','Research knowledge assistant'], rivals:['Certara','YseAI'] },
    { n:'Food & Beverage Manufacturer', size:[1200,7000], ai:2, stack:'SAP, OSIsoft, Power BI, on-prem SQL',
      pains:['Unplanned downtime','Quality deviation investigation','Plant reporting lag'],
      triggers:['Recall in the news','Line overhaul','New COO from Kraft'],
      init:['Plant assistant','Quality analytics'], rivals:['Augury','Limble'] },
    { n:'Insurance Brokerage', size:[200,1500], ai:3, stack:'Applied Epic, Vertafore, M365',
      pains:['Renewal preparation sprawl','Client prep in 48 hours','Producer admin'],
      triggers:['Jan 1 hard renewal','New producer pod','Agency system migration'],
      init:['Renewal intelligence','Producer copilot'], rivals:['Cytora','Riskfuel'] },
    { n:'Public Sector Agency', size:[800,9000], ai:1, stack:'On-prem, mainframe, SharePoint, Salesforce',
      pains:['Procurement cycle length','Legacy records retrieval','Citizen service response times'],
      triggers:['Budget request window','Statewide initiative','Audit findings'],
      init:['Digital service delivery','Records modernization'], rivals:['Accenture Federal','CivicPlus'] },
    { n:'SaaS Company', size:[150,2500], ai:4, stack:'Snowflake, Salesforce, dbt, AWS, own LLM infra',
      pains:['Support ticket volume','Build vs buy ambiguity','Enterprise security review time'],
      triggers:['SOC 2 Type II','Series C','Enterprise tier launched'],
      init:['Everything'], rivals:['Intercom','Zendesk','OpenAI'] },
    { n:'Franchise / Multi-Site Services', size:[400,4000], ai:2, stack:'Jonas, ServiceTitan, QuickBooks',
      pains:['Field technician scheduling','No-show rate','Franchisee reporting variance'],
      triggers:['Franchisee revolt','New franchise group','Fleet refresh'],
      init:['Dispatch automation','Technician assistant'], rivals:['ServiceTitan','FieldEdge'] },
    { n:'Legal Services Firm', size:[300,3000], ai:3, stack:'iManage, Clio, M365, on-prem DMS',
      pains:['Document review bottleneck','Matter profitability unknown','Time capture discipline'],
      triggers:['New practice area','Budget review','Client mandated AI policy'],
      init:['Knowledge retrieval','Contract review workflow'], rivals:['Harvey','Evisort'] },
    { n:'Hospitality Group', size:[1500,12000], ai:2, stack:'Opera, POS, M365, fragmented PMS',
      pains:['Labor scheduling across properties','Guest review response','Group sales quoting'],
      triggers:['Soft travel demand','Property acquisition','Seasonal close'],
      init:['Guest personalization','Back-office automation'], rivals:['Oracle OPERA Cloud','Mews'] },
    { n:'Nonprofit / Foundation', size:[100,900], ai:1, stack:'Salesforce NPSP, SharePoint, blackbaud',
      pains:['Grant proposal writing','Donor data fragmentation','Compliance reporting'],
      triggers:['Annual giving season','New executive director','Audit'],
      init:['Program assistant','Donor intelligence'], rivals:['Bloomerang','Every.org'] },
    { n:'Telecom Mid-Market', size:[2000,16000], ai:2, stack:'BSS/OSS legacy, Salesforce, Hadoop',
      pains:['Churn prediction accuracy','Field tech routing','Billing disputes'],
      triggers:['Fiber buildout','Executive reshuffle','Regulatory unbundling'],
      init:['Churn AI','Field automation'], rivals:['Amdocs','CSG'] }
  ];

  S.COMPANY_PREFIX = ['Meridian','Northlake','Vertex','Halcyon','Cardinal','Brightpath','Ironwood','Solstice',
    'Granite Peak','Lakeshore','Copperfield','Ardent','Redstone','Kestrel','Waverly','Tidewater','Pinnacle',
    'Hollowbrook','Alderwood','Vantage','Beacon Hill','Clearwater','Blackpine','Silverline','Oakmont','Ashford'];
  S.COMPANY_SUFFIX = ['Group','Holdings','Partners','Industries','Systems','Collective','Labs','Logistics',
    'Capital','Health','Networks','Solutions','Technologies','Manufacturing','Services','Resources','Analytics'];

  var AI_MATURITY_TEXT = ['Not started — one pilot, no owner','Ad hoc — two teams experimenting, no governance',
    'Early — a working group, first production use case','Maturing — platform team, policy exists',
    'Advanced — internal models, formal governance board'];

  S.makeCompany = function (force) {
    var ind = force && force.industry ? force.industry : S.pick(S.INDUSTRIES);
    var size = S.rint(ind.size[0], ind.size[1]);
    var name = S.pick(S.COMPANY_PREFIX) + ' ' + S.pick(S.COMPANY_SUFFIX);
    var revenue = Math.round((size * (S.rint(180, 420) * 1000)) / 10000) * 10000;
    var aiMaturity = S.clamp(ind.ai + S.rint(-1, 1), 1, 5);
    return {
      id: 'co' + (S.rnd() * 1e9).toFixed(0),
      name: name, industry: ind.n,
      employees: size,
      revenue: revenue,
      location: S.pick(['Columbus, OH','Austin, TX','Nashville, TN','Columbus, OH','Charlotte, NC',
        'Raleigh, NC','Denver, CO','Phoenix, AZ','Atlanta, GA','Boise, ID','Madison, WI','Tampa, FL',
        'Portland, OR','Rochester, NY','Birmingham, AL','Omaha, NE','Richmond, VA','Spokane, WA']),
      businessModel: S.pick(['Subscription','Project + support','Transactional','Regulated','Nonprofit-funded','Franchise']),
      aiMaturity: aiMaturity,
      aiMaturityText: AI_MATURITY_TEXT[aiMaturity - 1],
      techStack: ind.stack,
      currentAI: S.pick(['None','A pilot with a small vendor','An internal ChatGPT rollout',
        'Two overlapping vendor tools','A central platform team','An LLM API used directly by engineering']),
      priorities: S.pickN(ind.init, 2),
      pains: S.pickN(ind.pains, 2),
      hiddenPain: S.pick(['Nobody owns the metric the vendor would improve',
        'The real blocker is a change freeze until the fiscal year',
        'Two internal teams are building the same thing and neither knows',
        'The budget exists but is owned by a person you have never met',
        'The pain is real but it is a symptom; the cause is upstream',
        'A failed vendor pilot two years ago created permanent scar tissue',
        'The executive sponsor left in June and nobody replaced them']),
      triggers: S.pickN(ind.triggers, 2),
      competitors: ind.rivals,
      vendorRelationships: S.pick(['Locked in a 3-year deal with an incumbent',
        'Recently churned a vendor and is cautious',
        'Never formally evaluated a vendor',
        'Evaluating three vendors right now',
        'Bought a small tool from a startup that folded']),
      budgetEnv: S.pick(['Tight — discretionary spend frozen','Normal — funded if the case is made',
        'Open — a new initiative has budget','Unclear — nobody has asked finance',
        'Ring-fenced — only available through a specific program']),
      securityEnv: S.pick(['SOC 2 required before pilot','Security review takes 6-8 weeks',
        'No formal review, just IT approval','Legal must sign a DPA first','Procurement demands a penetration test report']),
      procurementEnv: S.pick(['3 quotes required over $50k','Standard software review',
        'MSA negotiated centrally','Purchase order required, no payment terms changes']),
      buyingCommittee: S.pickN(['CTO','CISO','VP Operations','CFO','COO','CHRO','Head of Procurement',
        'Director of IT','Compliance Officer','Business Unit VP','Data/Analytics Lead'], S.rint(3, 5)),
      potentialChampions: [], potentialBlockers: [],
      expansion: S.pick(['Hiring aggressively','Flat headcount','Down 8% after restructuring',
        'Acquired a competitor','Opened a second site']),
      _ind: ind
    };
  };

  /* ---------------- Roles & archetypes ---------------- */
  S.ROLES = [
    { t:'Chief Technology Officer', c:'C', d:'Technology', ai:4, auth:1.0,
      cares:'architecture, build-vs-buy, engineering credibility', avoid:'being sold to' },
    { t:'VP of Information Technology', c:'VP', d:'Technology', ai:3, auth:0.85,
      cares:'integration, security, delivery risk', avoid:'an extra project to manage' },
    { t:'Director of IT', c:'Director', d:'Technology', ai:2, auth:0.6,
      cares:'headcount, tickets, budget cycle', avoid:'being the sponsor of someone else project' },
    { t:'Chief Information Security Officer', c:'C', d:'Security', ai:3, auth:0.9,
      cares:'data residency, auditability, model risk', avoid:'vague AI claims' },
    { t:'Security Manager', c:'Manager', d:'Security', ai:2, auth:0.35,
      cares:'control evidence, vendor questionnaires', avoid:'another questionnaire' },
    { t:'VP of Operations', c:'VP', d:'Operations', ai:2, auth:0.8,
      cares:'throughput, cost per unit, labor', avoid:'technology for technology sake' },
    { t:'Operations Director', c:'Director', d:'Operations', ai:2, auth:0.55,
      cares:'process, dashboards, headcount', avoid:'another platform to learn' },
    { t:'Chief Financial Officer', c:'C', d:'Finance', ai:1, auth:1.0,
      cares:'payback, capex vs opex, downside', avoid:'unquantified promises' },
    { t:'Director of Procurement', c:'Director', d:'Procurement', ai:1, auth:0.7,
      cares:'price, risk, competitive quotes', avoid:'a sales person with no paper' },
    { t:'Head of Customer Operations', c:'VP', d:'Operations', ai:3, auth:0.7,
      cares:'deflection, CSAT, staffing', avoid:'a tool that makes agents look lazy' },
    { t:'Revenue Operations Lead', c:'Director', d:'Revenue', ai:4, auth:0.5,
      cares:'stack fit, attribution, duplicate tools', avoid:'another overlapping point solution' },
    { t:'Data & Analytics Manager', c:'Manager', d:'Data', ai:4, auth:0.3,
      cares:'data quality, model accuracy, access', avoid:'demos with fake data' },
    { t:'General Manager', c:'Director', d:'Operations', ai:1, auth:0.7,
      cares:'P&L, occupancy, labour cost', avoid:'IT-led purchasing he cannot fund' },
    { t:'Head of Legal', c:'Director', d:'Legal', ai:2, auth:0.8,
      cares:'liability, indemnity, data processing', avoid:'unlimited obligations' },
    { t:'Compliance Lead', c:'Manager', d:'Legal', ai:2, auth:0.45,
      cares:'evidence, audit trail, policy alignment', avoid:'a system without logs' },
    { t:'Director of People Operations', c:'Director', d:'HR', ai:2, auth:0.55,
      cares:'adoption, employee trust, policy', avoid:'surveillance perception' },
    { t:'Head of Transformation', c:'VP', d:'Strategy', ai:3, auth:0.75,
      cares:'programme delivery, visible wins', avoid:'a 12-month pilot with no story' }
  ];

  S.FIRST = ['Dana','Marcus','Priya','Elena','Tom','Aisha','Greg','Naomi','Chris','Luis','Farah','Owen',
    'Imani','Vikram','Sofia','Brad','Nina','Derek','Yuki','Maya','Sean','Leah','Andre','Carla','Ravi',
    'Jordan','Beth','Hector','Mira','Keith','Talia','Ross','Jin','Amara','Colin','Nadia','Sam','Petra',
    'Wes','Iris','Dmitri','Ruth','Kwame','Lucia','Bo','Anneke','Ravi','Gio','Trish','Emil','Zoe'];
  S.LAST = ['Whitaker','Okonkwo','Raman','Vasquez','Lindqvist','Bailey','Chen','Moreau','Alvarez','Brooks',
    'Kapoor','Novak','Fitzgerald','Duarte','Sandberg','Mbeki','Holloway','Tanaka','Ricci','Oyelaran',
    'Bergstrom','Pritchard','Nakamura','Delgado','Fitzgerald','Whitaker','Sokolov','Amara','Kowalski','Byrne',
    'Iyer','Lindgren','Okafor','Marchetti','Salazar','Haugen','Petrov','Beaumont','Castellano','Ferreira'];

  /* Archetype: behavioural weightings, not a stereotype — the same archetype plays differently
     depending on hidden fit, mood and history. */
  S.ARCHETYPES = [
    { id:'skeptic_cto', label:'Technically Skeptical',
      patience:0.30, skepticism:0.9, openness:0.35, interestAI:0.35, detail:0.9, tone:'blunt',
      openerHint:'challenges claims immediately', likes:['specifics','admitting limits'], hates:['hype','being managed'] },
    { id:'busy_exec', label:'Time-Starved Executive',
      patience:0.12, skepticism:0.5, openness:0.5, interestAI:0.5, detail:0.2, tone:'clipped',
      openerHint:'answers in four words', likes:['bottom line','next step'], hates:['rambling','discovery that does not land'] },
    { id:'curious_director', label:'Genuinely Curious',
      patience:0.75, skepticism:0.35, openness:0.85, interestAI:0.8, detail:0.6, tone:'warm',
      openerHint:'asks their own questions', likes:['honesty','examples'], hates:['being sold','pressure'] },
    { id:'gatekeeper', label:'Protective Gatekeeper',
      patience:0.35, skepticism:0.55, openness:0.4, interestAI:0.3, detail:0.4, tone:'guarded',
      openerHint:'filters for the boss', likes:['respect','a one-line reason'], hates:['pushiness','being ignored'] },
    { id:'incumbent_lover', label:'Loyal to Incumbent',
      patience:0.4, skepticism:0.6, openness:0.25, interestAI:0.45, detail:0.5, tone:'defensive',
      openerHint:'mentions their current tool', likes:['respect for the incumbent'], hates:['attack on current vendor','being told to switch'] },
    { id:'burned_buyer', label:'Burned by a Vendor',
      patience:0.3, skepticism:0.95, openness:0.3, interestAI:0.55, detail:0.7, tone:'wry',
      openerHint:'warns you about vendors', likes:['references','risk talk'], hates:['overselling','no references'] },
    { id:'internal_builder', label:'Built It Internally',
      patience:0.45, skepticism:0.7, openness:0.4, interestAI:0.85, detail:0.95, tone:'technical',
      openerHint:'describes their internal stack', likes:['honesty about limits'], hates:['bad architecture claims','being oversold'] },
    { id:'champion_candidate', label:'Quietly Frustrated',
      patience:0.6, skepticism:0.45, openness:0.6, interestAI:0.6, detail:0.5, tone:'guarded-warm',
      openerHint:'has a problem nobody has asked about', likes:['being heard'], hates:['being ignored','a pitch before they talk'] },
    { id:'delegator', label:'Delegates Everything',
      patience:0.5, skepticism:0.4, openness:0.5, interestAI:0.5, detail:0.25, tone:'pleasant',
      openerHint:'sounds interested, decides nothing', likes:['ease'], hates:['difficult questions'] },
    { id:'ai_enthusiast', label:'AI Enthusiast',
      patience:0.65, skepticism:0.35, openness:0.9, interestAI:0.95, detail:0.6, tone:'fast',
      openerHint:'finishes your sentences', likes:['capability','speed'], hates:['conservatism','"we cannot do that"'] },
    { id:'polite_dismiss', label:'Politely Interested',
      patience:0.3, skepticism:0.35, openness:0.45, interestAI:0.4, detail:0.3, tone:'cordial',
      openerHint:'says everything sounds great', likes:['politeness'], hates:['pushiness','reading the room'] },
    { id:'overloaded', label:'Buried Operator',
      patience:0.25, skepticism:0.5, openness:0.55, interestAI:0.5, detail:0.45, tone:'tired',
      openerHint:'is visibly mid-something', likes:['brevity','being left alone'], hates:['another meeting','a demo'] },
    { id:'no_problem', label:'No Actual Problem',
      patience:0.3, skepticism:0.5, openness:0.3, interestAI:0.3, detail:0.4, tone:'pleasant',
      openerHint:'has no pain to speak of', likes:['being left alone'], hates:['manufactured urgency'] },
    { id:'phantom_pain', label:'Pain Nobody Named',
      patience:0.55, skepticism:0.4, openness:0.6, interestAI:0.5, detail:0.55, tone:'guarded',
      openerHint:'cannot articulate what hurts', likes:['being asked gently'], hates:['asserting their problem for them'] },
    { id:'no_authority', label:'Interested, No Authority',
      patience:0.6, skepticism:0.4, openness:0.6, interestAI:0.6, detail:0.5, tone:'friendly',
      openerHint:'likes you, cannot buy', likes:['respect','a favor'], hates:['being put on the spot'] }
  ];

  S.REL_LEVELS = ['STRANGER','AWARE','FAMILIAR','TRUSTING','ENGAGED','CHAMPION'];
  S.relIndex = function (r) { return S.REL_LEVELS.indexOf(r); };
  S.relUp = function (r) {
    var i = S.relIndex(r) + 1;
    return S.REL_LEVELS[Math.min(i, S.REL_LEVELS.length - 1)];
  };
  S.relDown = function (r) {
    var i = S.relIndex(r) - 1;
    return S.REL_LEVELS[Math.max(0, i)];
  };

  /* Visible info vs hidden. The player researches and converses to find the hidden half. */
  S.makeProspect = function (company, opts) {
    opts = opts || {};
    var role = opts.role || S.pick(S.ROLES);
    var arch = opts.archetype || S.pick(S.ARCHETYPES);
    var p = {
      id: 'pr' + (S.rnd() * 1e9).toFixed(0),
      companyId: company.id,
      name: S.pick(S.FIRST) + ' ' + S.pick(S.LAST),
      title: role.t, cLevel: role.c, department: role.d,
      archetype: arch.id, archetypeLabel: arch.label,
      seniority: arch.detail > 0.8 ? 'Senior' : arch.detail < 0.3 ? 'Executive' : 'Mid',
      authority: role.auth, cares: role.cares, avoids: role.avoid,
      prefChannel: S.pick(['phone','email','email','linkedin']),
      prefTime: S.pick(['morning','mid-morning','afternoon','end of day']),
      /* --- VISIBLE (CRM shows this) --- */
      visible: {
        title: role.t, department: role.d,
        companySize: company.employees, industry: company.industry,
        openRole: S.pick(['posted 2 weeks ago','posted yesterday','reposted','open 60+ days','just closed']),
        recentNews: S.pick(company.triggers),
        fundingOrChange: S.pick(company.expansion),
        techSignal: S.pick(company.techStack.split(', ')),
        aiSignal: S.chance(0.45) ? company.aiMaturityText : null
      },
      /* --- HIDDEN (must be earned) --- */
      hidden: {
        patience: arch.patience, skepticism: arch.skepticism, openness: arch.openness,
        interestAI: arch.interestAI, detail: arch.detail,
        trust: 0.15, curiosity: 0.2, interest: 0.15, urgency: S.rnd() * 0.4,
        problemAwareness: S.chance(0.5) ? 0.6 : 0.25,
        politicalRisk: S.rnd() * 0.6, competitiveLoyalty: S.rnd() * 0.7,
        authority: role.auth, budgetConfidence: S.rnd() * 0.5,
        timePressure: S.rnd() * 0.5,
        realObjection: null, surfacedObjection: null,
        decisionProcess: S.pick(['single approver','two approvers','committee of five','board sign-off required']),
        timeline: S.pick(['this quarter','next quarter','6-12 months','no timeline at all','FY end in 7 weeks']),
        influence: S.rng() < role.auth ? 'decision maker' : 'influencer'
      },
      relationship: 'STRANGER',
      memory: { calls: 0, convos: 0, emails: 0, meetings: 0, promises: [], misses: [], statedPriorities: [],
        soundedScripted: 0, listenedScore: 0, rejected: 0, ghosted: 0, referred: [], lastTouchDay: 0 },
      stage: 'new',            // new | touched | engaged | meeting | opp | disqualified | nurture
      dealValue: 0,
      notes: [],
      mood: 0,                 // transient irritation
      exhausted: false
    };
    /* real objection drawn from a category that fits the archetype and role */
    p.hidden.realObjection = S.pickRealObjection(p, company);
    p.hidden.surfacedObjection = p.hidden.realObjection.category;
    p.hidden.meaningOfSendMe = S.pickMeaning(p);
    company.buyingCommittee = company.buyingCommittee || [];
    if (company.buyingCommittee.indexOf(p.title) < 0) company.buyingCommittee.push(p.title);
    return p;
  };

  S.OBJECTIONS = [
    { c:'timing', surf:'Honestly, this is not the quarter for us. We are heads down on a project.',
      real:['The project is consuming the budget','There is a change freeze until the fiscal year ends','They just had a reorg and priorities moved','They want it but cannot start for months'],
      depth:'deep' },
    { c:'budget', surf:'We do not have budget for this.',
      real:['The budget exists but sits with a person they cannot influence','The problem is not big enough to justify spend','There is a budget but it was already committed','They have budget, just not for this category'],
      depth:'deep' },
    { c:'authority', surf:'That is not my area, I am not the right person.',
      real:['They are the wrong person and know it','They are avoiding accountability','They ARE the right person but do not want the fight','They are an influencer who needs an internal sponsor first'],
      depth:'medium' },
    { c:'competition', surf:'We already use a platform for this.',
      real:['Incumbent is mid-contract and reasonably good','They are contractually locked for 18 months','They are comparing three vendors and shopping on price','The incumbent underperforms but switching is expensive'],
      depth:'deep' },
    { c:'internal', surf:'We built something in-house for this already.',
      real:['The internal version is genuinely adequate','The internal version is held together by one person','They are proud of it and it is a status symbol','They have tried to rebuild twice and failed'],
      depth:'deep' },
    { c:'no_problem', surf:'I do not think we have that problem.',
      real:['They genuinely do not — bad fit, disqualify','The problem exists but lives in another department','They have the symptom and have normalised it','They have never been measured on it so cannot feel it'],
      depth:'deep' },
    { c:'security', surf:'Our security team will never approve sending our data to you.',
      real:['Legitimate policy, pilot impossible in this window','Possible with on-prem deployment at 3x cost','Possible but the review takes 8 weeks','They have not asked security yet and assume the worst'],
      depth:'deep' },
    { c:'trust', surf:'How do we know you are any good?',
      real:['A past vendor failed them badly','They have no reference and no case study they trust','They were given bad information by another vendor','They were fired for buying something before'],
      depth:'medium' },
    { c:'resources', surf:'We do not have the people to run a pilot right now.',
      real:['No champion available','Champion exists but is overloaded','Team is mid-migration','They need a partner, not a tool'],
      depth:'medium' },
    { c:'low_priority', surf:'Send me an email and I will look at it when I can.',
      real:['DISMISSAL — wants the call to end','GENUINE — wants material to share internally','OVERWHELMED — interested, cannot take a call','TEST — checking if you will respect the boundary'],
      depth:'shallow' },
    { c:'not_interested', surf:'I am not interested.',
      real:['DISMISSAL — never interested','BAD FIT — no pain, no budget, no authority','BAD TIMING — true now, not ever','RUDDENESS — hiding discomfort'],
      depth:'shallow' },
    { c:'technical', surf:'How does this actually work with our stack?',
      real:['Genuine architecture question that decides the deal','A stall — they do not want to go deeper','A test of whether you will bluff','They are an engineer who wants to talk to an engineer'],
      depth:'deep' },
    { c:'how_got_number', surf:'How did you get my number?',
      real:['Reasonable compliance concern','Legitimate — you should be able to say','They are establishing whether you are legitimate','Pure defensiveness'],
      depth:'shallow' },
    { c:'too_busy', surf:'I literally cannot talk right now, I am in the middle of something.',
      real:['TRUE — genuinely busy, timing is the issue','AVOIDANCE — will never be ready','GENUINE INTEREST — bad moment, will return','POWER PLAY — wants to set the terms'],
      depth:'shallow' },
    { c:'build_vs_buy', surf:'Our CTO wants to build it. Why would we buy?',
      real:['They agree with the CTO and the deal is dead','CTO has a team and a mandate to build','CTO is defensive about their mandate','They want ammunition against the build decision'],
      depth:'deep' },
    { c:'ai_skeptic', surf:'We tried AI last year and it was a disaster.',
      real:['A real failure, credibility matters more than features','A partial failure on one use case','A rumour or a story from elsewhere','Failure was due to change management, not the technology'],
      depth:'deep' }
  ];

  S.pickRealObjection = function (p, company) {
    var pool = S.OBJECTIONS;
    var pick;
    if (p.archetype === 'no_problem') pick = pool.filter(function (o) { return o.c === 'no_problem'; })[0];
    else if (p.archetype === 'internal_builder') pick = pool.filter(function (o) { return o.c === 'internal' || o.c === 'build_vs_buy'; })[0];
    else if (p.archetype === 'skeptic_cto') pick = pool.filter(function (o) { return o.c === 'technical' || o.c === 'build_vs_buy' || o.c === 'ai_skeptic'; })[0];
    else if (p.archetype === 'busy_exec') pick = pool.filter(function (o) { return o.c === 'timing' || o.c === 'budget' || o.c === 'low_priority'; })[0];
    else if (p.archetype === 'burned_buyer') pick = pool.filter(function (o) { return o.c === 'trust'; })[0];
    else if (p.archetype === 'incumbent_lover') pick = pool.filter(function (o) { return o.c === 'competition'; })[0];
    else pick = S.pick(pool);
    var real = S.pick(pick.real);
    return { category: pick.c, surface: pick.surf, truth: real,
      meaning: real.split(' — ')[0],
      isolated: false, handled: false, validToAdvance: true,
      surfaceText: p.archetype === 'overloaded'
        ? 'Can you make this fast? ' + pick.surf : pick.surf };
  };

  S.pickMeaning = function (p) {
    var o = p.hidden.realObjection;
    if (o.category === 'low_priority' || o.category === 'not_interested') return o.truth.split(' — ')[0];
    return null;
  };

  /* Emotional / tonal surface text. Short, broken, human. */
  S.toneAdorner = function (p) {
    var out = [];
    if (p.mood > 0.4) out.push(S.pick(['Their tone is flat.', 'They sound clipped.', 'There is an edge there.']));
    else if (p.hidden.trust > 0.55 && p.relationship !== 'STRANGER')
      out.push(S.pick(['There is a small laugh in their voice.', 'They sound less guarded than the first call.']));
    if (p.archetype === 'overloaded') out.push('They are typing. You can hear keys.');
    if (p.archetype === 'gatekeeper') out.push('They put the phone down for a second.');
    return out.join(' ');
  };
})();