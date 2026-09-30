// AgriBridge AI - Consistent Mock Data
// Single source of truth for platform prototype telemetry.

export const PROTOTYPE_LABEL = 'Prototype Data — Not connected to live sensors';

export const farms = [
  {
    id: 'farm-1',
    name: 'Green Valley Farm',
    location: 'Nashik, Maharashtra',
    size: 12,
    sizeUnit: 'hectares',
    crops: ['Wheat', 'Cotton'],
    soilHealth: 78,
    cropHealth: 86,
    lat: 19.9975,
    lng: 73.7898,
    soilType: 'Black Cotton Soil',
    irrigationType: 'Drip Irrigation',
    lastUpdated: '2026-09-28',
    owner: 'Rajesh Patil',
    established: '2018',
    soilPH: 6.8,
    organicMatter: 3.2,
    nitrogen: 245,
    phosphorus: 38,
    potassium: 180,
  },
  {
    id: 'farm-2',
    name: 'Sunrise Organics',
    location: 'Amritsar, Punjab',
    size: 8,
    sizeUnit: 'hectares',
    crops: ['Rice', 'Sugarcane'],
    soilHealth: 82,
    cropHealth: 91,
    lat: 31.634,
    lng: 74.8723,
    soilType: 'Alluvial Soil',
    irrigationType: 'Canal Irrigation',
    lastUpdated: '2026-09-29',
    owner: 'Gurpreet Singh',
    established: '2015',
    soilPH: 7.1,
    organicMatter: 3.8,
    nitrogen: 280,
    phosphorus: 42,
    potassium: 210,
  },
  {
    id: 'farm-3',
    name: 'Deccan Harvest',
    location: 'Dharwad, Karnataka',
    size: 15,
    sizeUnit: 'hectares',
    crops: ['Jowar', 'Groundnut'],
    soilHealth: 71,
    cropHealth: 79,
    lat: 15.4589,
    lng: 75.0078,
    soilType: 'Red Laterite Soil',
    irrigationType: 'Borewell / Sprinkler',
    lastUpdated: '2026-09-27',
    owner: 'Mahadevi Kulkarni',
    established: '2020',
    soilPH: 6.2,
    organicMatter: 2.4,
    nitrogen: 190,
    phosphorus: 28,
    potassium: 155,
  },
];

export const weatherData = {
  'farm-1': {
    current: { temp: 31, humidity: 68, rainfall: 2.4, windSpeed: 12, condition: 'Partly Cloudy', feelsLike: 34, uvIndex: 6 },
    forecast: [
      { day: 'Mon', high: 32, low: 24, condition: 'Sunny', rain: 0 },
      { day: 'Tue', high: 30, low: 23, condition: 'Cloudy', rain: 5 },
      { day: 'Wed', high: 28, low: 22, condition: 'Rain', rain: 18 },
      { day: 'Thu', high: 29, low: 22, condition: 'Rain', rain: 12 },
      { day: 'Fri', high: 31, low: 23, condition: 'Partly Cloudy', rain: 2 },
      { day: 'Sat', high: 33, low: 25, condition: 'Sunny', rain: 0 },
      { day: 'Sun', high: 32, low: 24, condition: 'Sunny', rain: 0 },
    ],
  },
  'farm-2': {
    current: { temp: 34, humidity: 72, rainfall: 0, windSpeed: 8, condition: 'Sunny', feelsLike: 38, uvIndex: 8 },
    forecast: [
      { day: 'Mon', high: 35, low: 26, condition: 'Sunny', rain: 0 },
      { day: 'Tue', high: 34, low: 25, condition: 'Sunny', rain: 0 },
      { day: 'Wed', high: 33, low: 25, condition: 'Partly Cloudy', rain: 0 },
      { day: 'Thu', high: 31, low: 24, condition: 'Cloudy', rain: 8 },
      { day: 'Fri', high: 30, low: 23, condition: 'Rain', rain: 15 },
      { day: 'Sat', high: 32, low: 25, condition: 'Partly Cloudy', rain: 3 },
      { day: 'Sun', high: 34, low: 26, condition: 'Sunny', rain: 0 },
    ],
  },
  'farm-3': {
    current: { temp: 29, humidity: 55, rainfall: 0, windSpeed: 15, condition: 'Sunny', feelsLike: 31, uvIndex: 7 },
    forecast: [
      { day: 'Mon', high: 30, low: 21, condition: 'Sunny', rain: 0 },
      { day: 'Tue', high: 31, low: 22, condition: 'Sunny', rain: 0 },
      { day: 'Wed', high: 30, low: 21, condition: 'Partly Cloudy', rain: 0 },
      { day: 'Thu', high: 28, low: 20, condition: 'Cloudy', rain: 5 },
      { day: 'Fri', high: 27, low: 19, condition: 'Rain', rain: 22 },
      { day: 'Sat', high: 29, low: 20, condition: 'Partly Cloudy', rain: 4 },
      { day: 'Sun', high: 31, low: 22, condition: 'Sunny', rain: 0 },
    ],
  },
};

export const alerts = [
  { id: 'a1', type: 'warning', title: 'Low Soil Moisture', message: 'Soil moisture in Zone B of Deccan Harvest has dropped below 30%. Consider morning irrigation.', farmId: 'farm-3', timestamp: '2026-09-30T08:15:00', read: false },
  { id: 'a2', type: 'info', title: 'Harvest Window Approach', message: 'Optimal harvest window for Wheat at Green Valley Farm is approaching (Oct 5–12).', farmId: 'farm-1', timestamp: '2026-09-29T14:30:00', read: false },
  { id: 'a3', type: 'critical', title: 'Pest Risk Elevated', message: 'Brown Plant Hopper risk elevated for Rice at Sunrise Organics. Inspect lower leaf collars.', farmId: 'farm-2', timestamp: '2026-09-29T06:00:00', read: false },
  { id: 'a4', type: 'success', title: 'Irrigation Complete', message: 'Scheduled drip irrigation cycle completed for Green Valley Farm Zone A.', farmId: 'farm-1', timestamp: '2026-09-28T18:00:00', read: true },
  { id: 'a5', type: 'warning', title: 'Heavy Rainfall Advisory', message: 'IMD forecasts 40–60mm precipitation for Nashik district on Oct 2. Ensure clear drainage bunds.', farmId: 'farm-1', timestamp: '2026-09-28T10:00:00', read: true },
  { id: 'a6', type: 'info', title: 'Soil Test Reminder', message: 'Quarterly laboratory soil test for Deccan Harvest is due in 3 days.', farmId: 'farm-3', timestamp: '2026-09-27T09:00:00', read: true },
];

export const cropHealthHistory = {
  'farm-1': [
    { month: 'Apr', score: 72 }, { month: 'May', score: 75 }, { month: 'Jun', score: 80 },
    { month: 'Jul', score: 83 }, { month: 'Aug', score: 85 }, { month: 'Sep', score: 86 },
  ],
  'farm-2': [
    { month: 'Apr', score: 78 }, { month: 'May', score: 82 }, { month: 'Jun', score: 85 },
    { month: 'Jul', score: 88 }, { month: 'Aug', score: 90 }, { month: 'Sep', score: 91 },
  ],
  'farm-3': [
    { month: 'Apr', score: 65 }, { month: 'May', score: 68 }, { month: 'Jun', score: 72 },
    { month: 'Jul', score: 74 }, { month: 'Aug', score: 77 }, { month: 'Sep', score: 79 },
  ],
};

export const soilHealthHistory = {
  'farm-1': [
    { month: 'Apr', score: 70 }, { month: 'May', score: 72 }, { month: 'Jun', score: 74 },
    { month: 'Jul', score: 75 }, { month: 'Aug', score: 77 }, { month: 'Sep', score: 78 },
  ],
  'farm-2': [
    { month: 'Apr', score: 74 }, { month: 'May', score: 76 }, { month: 'Jun', score: 78 },
    { month: 'Jul', score: 79 }, { month: 'Aug', score: 81 }, { month: 'Sep', score: 82 },
  ],
  'farm-3': [
    { month: 'Apr', score: 62 }, { month: 'May', score: 64 }, { month: 'Jun', score: 66 },
    { month: 'Jul', score: 68 }, { month: 'Aug', score: 70 }, { month: 'Sep', score: 71 },
  ],
};

export const cropDoctorDiagnoses = [
  {
    id: 'd1',
    cropName: 'Wheat',
    farmId: 'farm-1',
    diagnosis: 'Yellow Rust (Puccinia striiformis)',
    confidence: 87,
    severity: 'Moderate',
    symptoms: ['Yellow-orange pustules on leaves', 'Stripe patterns along leaf veins', 'Reduced leaf area'],
    recommendations: [
      'Isolate affected rows and inspect adjacent plots for spore spread',
      'Prune and safely dispose of heavily infected lower foliage',
      'Ensure proper row spacing for increased air movement',
      'Consult local Krishi Vigyan Kendra (KVK) for regional protocols'
    ],
    date: '2026-09-25',
    imageUrl: null,
  },
  {
    id: 'd2',
    cropName: 'Rice',
    farmId: 'farm-2',
    diagnosis: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
    confidence: 92,
    severity: 'High',
    symptoms: ['Water-soaked lesions on leaf margins', 'Yellowing and wilting of leaves', 'Grayish-white lesions in advanced stage'],
    recommendations: [
      'Drain standing field water to mitigate bacterial transmission',
      'Halt immediate top-dressed nitrogen fertilizer applications',
      'Maintain weed-free bunds to remove collateral host grasses',
      'Consult district agronomist for certified bio-control options'
    ],
    date: '2026-09-28',
    imageUrl: null,
  },
];

export const knowledgeArticles = [
  { id: 'k1', title: 'Integrated Pest Management for Wheat', category: 'Pest Management', readTime: '8 min', summary: 'A comprehensive guide to IPM strategies for wheat cultivation in semi-arid regions.', tags: ['wheat', 'pest management', 'ipm'] },
  { id: 'k2', title: 'Soil Health Restoration Techniques', category: 'Soil Management', readTime: '12 min', summary: 'Evidence-based methods to improve degraded soil including cover cropping, composting, and bio-fertilizers.', tags: ['soil', 'regenerative', 'composting'] },
  { id: 'k3', title: 'Water-Efficient Irrigation Methods', category: 'Irrigation', readTime: '6 min', summary: 'Comparing drip, sprinkler, and flood irrigation efficiency for different crop types.', tags: ['irrigation', 'water', 'drip'] },
  { id: 'k4', title: 'Understanding Crop Nutrient Deficiencies', category: 'Crop Nutrition', readTime: '10 min', summary: 'Visual guide to identifying nitrogen, phosphorus, potassium, and micronutrient deficiencies in field crops.', tags: ['nutrition', 'deficiency', 'diagnosis'] },
  { id: 'k5', title: 'Climate-Resilient Farming Practices', category: 'Climate Adaptation', readTime: '15 min', summary: 'Strategies for adapting farming practices to changing climate patterns including drought and flood management.', tags: ['climate', 'resilience', 'adaptation'] },
  { id: 'k6', title: 'Organic Certification Process in India', category: 'Organic Farming', readTime: '7 min', summary: 'Step-by-step guide to NPOP and PGS-India organic certification for small and medium farms.', tags: ['organic', 'certification', 'npop'] },
  { id: 'k7', title: 'Post-Harvest Storage Best Practices', category: 'Post-Harvest', readTime: '9 min', summary: 'Reducing post-harvest losses through proper storage, drying, and handling techniques.', tags: ['storage', 'post-harvest', 'losses'] },
  { id: 'k8', title: 'Regenerative Agriculture Fundamentals', category: 'Regenerative', readTime: '11 min', summary: 'Core principles of regenerative agriculture including no-till, cover crops, and biodiversity integration.', tags: ['regenerative', 'no-till', 'cover-crops'] },
];

export const bricsPartners = [
  { country: 'Brazil', flag: '🇧🇷', focus: ['Soybean', 'Sugarcane', 'Coffee'], status: 'Research Exchange', description: 'Potential collaboration on tropical crop canopy modeling and sugarcane drought genetics.' },
  { country: 'Russia', flag: '🇷🇺', focus: ['Wheat', 'Barley', 'Sunflower'], status: 'Knowledge Sharing', description: 'Potential collaboration on cold-hardy cereal varieties and grain storage moisture kinetics.' },
  { country: 'India', flag: '🇮🇳', focus: ['Rice', 'Wheat', 'Cotton'], status: 'Active Platform', description: 'Primary deployment region for AgriBridge AI with live farm parcel telemetry.' },
  { country: 'China', flag: '🇨🇳', focus: ['Rice', 'Corn', 'Vegetables'], status: 'Research Exchange', description: 'Potential collaboration on multispectral UAV imaging and computer vision pest diagnostics.' },
  { country: 'South Africa', flag: '🇿🇦', focus: ['Maize', 'Citrus', 'Wine Grapes'], status: 'Planned', description: 'Planned collaboration on semi-arid dryland farming techniques and soil carbon sequestration.' },
];

export const aiModels = [
  { 
    id: 'm1', 
    name: 'CropHealth Vision', 
    version: 'v2.3',
    type: 'Multimodal Vision', 
    purpose: 'Identifies foliar pathology, lesions, and symptoms from leaf and canopy photographs.',
    inputType: 'RGB Image (JPG/PNG/WebP)',
    output: 'Pathology diagnosis, symptoms, and non-chemical actions',
    targetBenchmark: 94.0, 
    evaluationStatus: 'Benchmark Target (Prototype)',
    dataProvenance: 'PlantVillage + Regional Field Survey Specimen Datasets',
    deploymentStatus: 'Active (Gemini Multimodal Live API)',
    lastTrained: '2026-08-15', 
    status: 'Active' 
  },
  { 
    id: 'm2', 
    name: 'SoilAnalyzer Pro', 
    version: 'v1.8',
    type: 'Soil Spectroscopy Regression', 
    purpose: 'Predicts macro/micronutrient balance, organic matter, and pH from soil samples.',
    inputType: 'Soil Lab Parameters & Sensor Values',
    output: 'Nutrient index score (0-100) and amendment guidance',
    targetBenchmark: 90.0, 
    evaluationStatus: 'Evaluation Pending',
    dataProvenance: 'Soil Health Card (SHC) National Sample Data',
    deploymentStatus: 'Active (Algorithmic Modeling)',
    lastTrained: '2026-07-20', 
    status: 'Active' 
  },
  { 
    id: 'm3', 
    name: 'AgriWeather Predict', 
    version: 'v3.1',
    type: 'Micro-Climate Forecast Model', 
    purpose: 'Generates localized 7-day temperature, rainfall, and humidity projections.',
    inputType: 'Meteorological Grid Parameters',
    output: 'Hourly/Daily agricultural weather forecast',
    targetBenchmark: 88.0, 
    evaluationStatus: 'Evaluation Pending',
    dataProvenance: 'Regional Meteorological Historical Datasets',
    deploymentStatus: 'Active (Prototype Service)',
    lastTrained: '2026-09-01', 
    status: 'Active' 
  },
  { 
    id: 'm4', 
    name: 'PestOutbreak Risk Evaluator', 
    version: 'v1.4',
    type: 'Epidemiological Classifier', 
    purpose: 'Calculates probability of pest vector emergence based on humidity and degree days.',
    inputType: 'Temperature, Relative Humidity, Crop Phenology',
    output: 'Risk level (Low / Moderate / Elevated / High)',
    targetBenchmark: 91.0, 
    evaluationStatus: 'Benchmark Target',
    dataProvenance: 'ICAR Agrometeorological Pest Bulletins',
    deploymentStatus: 'Active (Risk Assessment Rulebase)',
    lastTrained: '2026-08-28', 
    status: 'Active' 
  },
  { 
    id: 'm5', 
    name: 'YieldEstimator Biomass', 
    version: 'v2.0',
    type: 'Canopy Biomass Regressor', 
    purpose: 'Forecasts seasonal harvest yield based on multispectral NDVI and weather accumulation.',
    inputType: 'NDVI Time-Series, GDD (Growing Degree Days)',
    output: 'Metric Tonnes / Hectare Yield Projection',
    targetBenchmark: 85.0, 
    evaluationStatus: 'In Training',
    dataProvenance: 'State Agricultural Yield Crop Cutting Experiments',
    deploymentStatus: 'Training Phase',
    lastTrained: '2026-06-10', 
    status: 'Training' 
  },
  { 
    id: 'm6', 
    name: 'Irrigation Scheduler Engine', 
    version: 'v1.2',
    type: 'Soil Water Balance Optimization', 
    purpose: 'Calculates evapotranspiration rates and prescribes exact drip duration cycles.',
    inputType: 'Soil Moisture, ET0, Solar Radiation',
    output: 'Recommended irrigation cycle minutes & timing',
    targetBenchmark: 89.0, 
    evaluationStatus: 'Benchmark Target',
    dataProvenance: 'FAO-56 Evapotranspiration Standards',
    deploymentStatus: 'Active (Optimization Rulebase)',
    lastTrained: '2026-09-10', 
    status: 'Active' 
  },
];

export const regenerativePlanSteps = [
  { id: 'r1', phase: 'Assessment', title: 'Baseline Soil Assessment', duration: 'Month 1–2', status: 'completed', description: 'Comprehensive soil testing, biodiversity audit, and water flow mapping.', tasks: ['Soil sample collection (12 points per hectare)', 'Microbial biomass analysis', 'Water infiltration tests', 'Current biodiversity assessment'] },
  { id: 'r2', phase: 'Planning', title: 'Cover Crop Integration', duration: 'Month 2–3', status: 'in-progress', description: 'Design cover crop rotations to build soil organic matter and reduce erosion.', tasks: ['Select cover crop species (legumes + grasses)', 'Plan rotation schedule', 'Source seeds from local suppliers', 'Prepare planting schedule'] },
  { id: 'r3', phase: 'Implementation', title: 'Reduced Tillage Transition', duration: 'Month 3–6', status: 'upcoming', description: 'Gradually transition from conventional tillage to minimum or no-till practices.', tasks: ['Acquire no-till seeding equipment', 'Train field workers on new practices', 'Designate pilot plots for comparison', 'Monitor soil compaction changes'] },
  { id: 'r4', phase: 'Implementation', title: 'Composting & Bio-Inputs', duration: 'Month 4–8', status: 'upcoming', description: 'Establish on-farm composting and transition to biological soil amendments.', tasks: ['Build composting infrastructure', 'Source local organic waste inputs', 'Prepare bio-fertilizer formulations', 'Set up vermicompost beds'] },
  { id: 'r5', phase: 'Monitoring', title: 'Soil Health Re-Assessment', duration: 'Month 9–10', status: 'upcoming', description: 'Repeat baseline measurements to quantify improvements.', tasks: ['Follow-up soil tests at same sample points', 'Compare organic matter levels', 'Measure infiltration rate changes', 'Document biodiversity changes'] },
  { id: 'r6', phase: 'Optimization', title: 'Adaptive Management', duration: 'Month 10–12', status: 'upcoming', description: 'Refine practices based on monitoring data and scale successful interventions.', tasks: ['Analyze year-1 data vs baseline', 'Adjust cover crop mix', 'Expand no-till to additional plots', 'Plan year-2 objectives'] },
];

export const defaultSettings = {
  language: 'English',
  theme: 'light',
  notifications: { email: true, push: true, sms: false },
  units: { temperature: 'Celsius', area: 'Hectares', weight: 'Kg' },
  dataRefreshInterval: '30',
  userName: 'Farm Manager',
  email: 'manager@agribridge.demo',
};
