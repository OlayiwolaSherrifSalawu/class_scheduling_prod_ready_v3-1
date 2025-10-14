// Course catalog with 15 departments (100-400 level)
export const Departments = [
  "Computer Science","Electrical Engineering","Mechanical Engineering","Civil Engineering","Chemical Engineering",
  "Mathematics","Physics","Biology","Chemistry","Economics",
  "Business Administration","Accounting","Mass Communication","Sociology","Political Science"
];

const gen = (code, name, level) => ({ code, name, level });

export const Catalog = {
  "Computer Science": [
    gen("CSC101","Introduction to Programming I",100),
    gen("CSC102","Introduction to Programming II",100),
    gen("CSC201","Data Structures",200),
    gen("CSC202","Computer Architecture",200),
    gen("CSC301","Algorithms",300),
    gen("CSC302","Operating Systems",300),
    gen("CSC401","Distributed Systems",400),
    gen("CSC402","Machine Learning",400)
  ],
  "Electrical Engineering": [
    gen("EE101","Circuit Theory I",100), gen("EE102","Basic Electronics",100),
    gen("EE201","Signals & Systems",200), gen("EE202","Electromagnetics",200),
    gen("EE301","Control Systems",300), gen("EE302","Power Systems",300),
    gen("EE401","Communication Systems",400), gen("EE402","Embedded Systems",400)
  ],
  "Mechanical Engineering": [
    gen("ME101","Engineering Drawing",100), gen("ME102","Statics",100),
    gen("ME201","Dynamics",200), gen("ME202","Thermodynamics",200),
    gen("ME301","Fluid Mechanics",300), gen("ME302","Machine Design",300),
    gen("ME401","Manufacturing Processes",400), gen("ME402","Heat Transfer",400)
  ],
  "Civil Engineering":[
    gen("CE101","Intro to Civil Engineering",100), gen("CE102","Engineering Materials",100),
    gen("CE201","Structural Analysis I",200), gen("CE202","Fluid Mechanics",200),
    gen("CE301","Geotechnical Engineering",300), gen("CE302","Transportation Engineering",300),
    gen("CE401","Structural Design",400), gen("CE402","Water Resources",400)
  ],
  "Chemical Engineering":[
    gen("CHE101","Material & Energy Balance",100), gen("CHE102","Process Calculations",100),
    gen("CHE201","Thermodynamics",200), gen("CHE202","Fluid Flow",200),
    gen("CHE301","Mass Transfer",300), gen("CHE302","Reaction Engineering",300),
    gen("CHE401","Process Control",400), gen("CHE402","Plant Design",400)
  ],
  "Mathematics":[
    gen("MTH101","Calculus I",100), gen("MTH102","Linear Algebra I",100),
    gen("MTH201","Calculus II",200), gen("MTH202","Abstract Algebra",200),
    gen("MTH301","Real Analysis",300), gen("MTH302","Complex Analysis",300),
    gen("MTH401","Numerical Analysis",400), gen("MTH402","Topology",400)
  ],
  "Physics":[
    gen("PHY101","Mechanics",100), gen("PHY102","Waves & Optics",100),
    gen("PHY201","Electromagnetism",200), gen("PHY202","Thermal Physics",200),
    gen("PHY301","Quantum Mechanics",300), gen("PHY302","Solid State Physics",300),
    gen("PHY401","Nuclear Physics",400), gen("PHY402","Statistical Mechanics",400)
  ],
  "Biology":[
    gen("BIO101","Cell Biology",100), gen("BIO102","Genetics",100),
    gen("BIO201","Microbiology",200), gen("BIO202","Plant Physiology",200),
    gen("BIO301","Molecular Biology",300), gen("BIO302","Biochemistry",300),
    gen("BIO401","Immunology",400), gen("BIO402","Neuroscience",400)
  ],
  "Chemistry":[
    gen("CHM101","General Chemistry I",100), gen("CHM102","General Chemistry II",100),
    gen("CHM201","Organic Chemistry I",200), gen("CHM202","Inorganic Chemistry",200),
    gen("CHM301","Physical Chemistry I",300), gen("CHM302","Analytical Chemistry",300),
    gen("CHM401","Environmental Chemistry",400), gen("CHM402","Industrial Chemistry",400)
  ],
  "Economics":[
    gen("ECO101","Principles of Microeconomics",100), gen("ECO102","Principles of Macroeconomics",100),
    gen("ECO201","Intermediate Microeconomics",200), gen("ECO202","Statistics for Economists",200),
    gen("ECO301","Econometrics",300), gen("ECO302","Development Economics",300),
    gen("ECO401","Public Finance",400), gen("ECO402","International Economics",400)
  ],
  "Business Administration":[
    gen("BUS101","Introduction to Business",100), gen("BUS102","Business Communication",100),
    gen("BUS201","Marketing Principles",200), gen("BUS202","Operations Management",200),
    gen("BUS301","Organizational Behavior",300), gen("BUS302","Business Law",300),
    gen("BUS401","Strategic Management",400), gen("BUS402","Entrepreneurship",400)
  ],
  "Accounting":[
    gen("ACC101","Intro Financial Accounting",100), gen("ACC102","Managerial Accounting",100),
    gen("ACC201","Intermediate Accounting I",200), gen("ACC202","Taxation",200),
    gen("ACC301","Auditing",300), gen("ACC302","Financial Reporting",300),
    gen("ACC401","Advanced Accounting",400), gen("ACC402","Accounting Information Systems",400)
  ],
  "Mass Communication":[
    gen("MCM101","Intro to Mass Communication",100), gen("MCM102","Media Writing",100),
    gen("MCM201","Broadcasting",200), gen("MCM202","Public Relations",200),
    gen("MCM301","Advertising",300), gen("MCM302","Investigative Journalism",300),
    gen("MCM401","New Media",400), gen("MCM402","Media Ethics & Law",400)
  ],
  "Sociology":[
    gen("SOC101","Intro to Sociology",100), gen("SOC102","Social Psychology",100),
    gen("SOC201","Social Research Methods",200), gen("SOC202","Demography",200),
    gen("SOC301","Criminology",300), gen("SOC302","Sociology of Development",300),
    gen("SOC401","Urban Sociology",400), gen("SOC402","Industrial Sociology",400)
  ],
  "Political Science":[
    gen("PSC101","Intro to Political Science",100), gen("PSC102","Nigerian Government",100),
    gen("PSC201","Comparative Politics",200), gen("PSC202","International Relations",200),
    gen("PSC301","Political Theory",300), gen("PSC302","Public Administration",300),
    gen("PSC401","Peace & Conflict Studies",400), gen("PSC402","Political Economy",400)
  ]
};

export const Levels = [100,200,300,400];
export const Days = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
