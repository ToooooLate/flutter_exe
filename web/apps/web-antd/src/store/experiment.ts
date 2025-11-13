import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { updateExperimentDataApi } from '#/api/core/experiment';

// 环境参数接口
interface EnvironmentData {
  id: string;
  testPlace: string;
  temperature: number;
  relativeHumidity: number;
  atmosphericPressure: number;
  testDate: string; // yyyy-mm-dd格式
}

// 外观检查项目接口
interface AppearanceCheckItem {
  id: string;
  serialNumber: number;
  checkContent: string;
  checkRequirement: string;
  checkStatus: string;
  remarks: string;
  conclusion: string;
}

// 冷态绝缘接口
interface ColdInsulation {
  id: string;
  generatorSn: string;
  measured: number;
  standard: number;
  conclusion: string;
}

// 启动性能子项接口
interface StartPerformanceSubItem {
  startNumber?: number;
  ambientTemperature?: number;
  startupTime?: number;
  startupStatus?: string;
}

// 启动性能接口
interface StartPerformance {
  id: string;
  flywheelTeeth: number;
  ratedIdleSpeed: number;
  startSuccessCriteria: string;
  autoStartExperimentResult: string;
  autoShutdownExperimentResult: string;
  threeStartFailureResult: string;
  emergencyShutdownResult: string;
  conclusion: string;
  subList: StartPerformanceSubItem[];
}

// 运行检查项目接口
interface OperationCheckItem {
  id?: string;
  serialNumber: number;
  item: string;
  voltage: string;
  frequency: string;
  waterTemp: string;
  oilPressure: string;
  speed: string;
  threeLeakage: string;
  conclusion?: string;
}

// 超速保护接口
interface OverspeedProtectItem {
  id: string;
  serialNumber: number;
  speed: string;
  alarmShutdown: string;
  remarks: string;
  conclusion: string;
}

// 保护实验接口
interface ProtectExperimentItem {
  id: string;
  serialNumber: number;
  testItem: string;
  signalType: string;
  setValue: string;
  localDisplay: string;
  localAlarm: string;
  localShd: string;
  testResult: string;
  remark: string;
  conclusion: string;
}

// 负载测试接口
interface LoadTestItem {
  id: string;
  serialNumber: number;
  timeMin: string;
  loadPercent: string;
  powerStandard: string;
  powerMeasured: string;
  frequency: string;
  powerFactor: string;
  ua: string;
  ub: string;
  uc: string;
  ia: string;
  ib: string;
  ic: string;
  speed: string;
  oilTemperature: string;
  oilPressure: string;
  coolantTemp: string;
  exhaustTemp: string;
  crankcasePress: string;
  fuelRate: string;
  percentPower: string;
  fuelAccumulatorPress: string;
  fuelSupplyPress: string;
  exhaustTempLb: string;
  exhaustTempRb: string;
  coolantPress: string;
  seaWaterPress: string;
  fuelTemp: string;
  boostPressL: string;
  boostPressR: string;
  intakeManifoldTempLbf: string;
  intakeManifoldTempLbb: string;
  intakeManifoldTempRbf: string;
  intakeManifoldTempRbb: string;
  conclusion: string;
}

// 稳态调节接口
interface SteadyAdjustment {
  id: string;
  ratedVoltage: string;
  noLoadMaxVoltage: string;
  noLoadMinVoltage: string;
  maxSpeedRegulationNoLoadFreq: string;
  maxSpeedRegulationFullLoadFreq: string;
  maxSteadyStateSpeedRegulation: string;
  minSpeedRegulationNoLoadFreq: string;
  minSpeedRegulationFullLoadFreq: string;
  minSteadyStateSpeedRegulation: string;
  conclusion: string;
}

// 稳态电压接口
interface SteadyVoltageItem {
  id: string;
  fullLoadFreqSetValue: string;
  noLoadVoltageSetValue: string;
  loadPercent: string;
  power: string;
  frequency: string;
  powerFactor: string;
  ua: string;
  ub: string;
  uc: string;
  ia: string;
  ib: string;
  ic: string;
  phaseAVoltage: string;
  steadyVoltageDeviation: string;
  conclusion: string;
}

// 转速波动接口
interface SpeedFluctuationItem {
  id: string;
  load: string;
  power: string;
  frequency: string;
  powerFactor: string;
  measuredFreqBeforeExperiment: string;
  frequencyWaveMax: string;
  frequencyWaveMin: string;
  frequencyWaveAve: string;
  speedFluctuationRate: string;
  speedFluctuationStandard: string;
  conclusion: string;
}

// 电压波动接口
interface VoltageFluctuationItem {
  id: string;
  load: string;
  power: string;
  frequency: string;
  powerFactor: string;
  measuredVoltageBeforeExperiment: string;
  voltageWaveMax: string;
  voltageWaveMin: string;
  voltageWaveAve: string;
  voltageFluctuationRate: string;
  voltageFluctuationStandard: string;
  conclusion: string;
}

// 瞬态转速接口
interface TransientSpeedItem {
  id: string;
  loadChangeState: string;
  beforeChangeFrequency: string;
  beforeChangePower: string;
  instantaneousFrequencyMaxMin: string;
  afterChangeFrequency: string;
  afterChangePower: string;
  stabilityTime: string;
  transientSpeedRegulationRate: string;
  curveInfo: string;
  conclusion: string;
  stableFrequencyDeviationRange: string;
}

// 瞬态电压接口
interface TransientVoltageItem {
  id: string;
  loadChangeState: string;
  beforeChangeVoltage: string;
  beforeChangeCurrent: string;
  beforeChangePowerFactor: string;
  instantaneousFrequencyMaxMin: string;
  afterChangeVoltage: string;
  afterChangeCurrent: string;
  afterChangePowerFactor: string;
  stabilityTime: string;
  transientVoltageChangeRate: string;
  curveInfo: string;
  conclusion: string;
  stableVoltageDeviationRange: string;
}

// 热态绝缘接口
interface HotInsulation {
  id: string;
  generatorSn: string;
  measured: string;
  standard: string;
  conclusion: string;
}

// 稳态转速子项接口
interface SteadySpeedSubItem {
  id?: string;
  serialNumber?: number;
  loadPercent?: string;
  power?: string;
  frequency?: string;
  powerFactor?: string;
  ua?: string;
  ub?: string;
  uc?: string;
  ia?: string;
  ib?: string;
  ic?: string;
  phaseAVoltage?: string;
  steadyFrequencyDeviation?: string;
}

// 综合检查项目接口
interface IntegratedCheckItem {
  id?: string;
  serialNumber?: number;
  loadPercent?: string;
  timeMin?: string;
  ua?: string;
  ia?: string;
  powerFactor?: number;
  power?: string;
  frequency?: number;
  umax?: number;
  umin?: number;
  fmax?: number;
  fmin?: number;
  visible?: boolean | number;
}

interface SteadySpeedItem {
  id?: string;
  serialNumber?: number;
  item?: string;
  steadyFrequencyDeviation?: string;
  speedSystemInsensitivity?: string;
  nonlinearity?: string;
  conclusion?: string;
}

// 完整实验数据接口
interface ExperimentData {
  id: string;
  experimentNo: string;
  projectName: string;
  shipNumber: string;
  testPerson: string;
  inspector: string;
  reviewer: string;
  customer: string;
  shipyard: string;
  status: number;//0-进行中，1-已结束，2-已废弃
  isTemplate: string;
  engineModel: string;
  engineSerial: string;
  generatorModel: string;
  generatorSerial: string;
  unitModel: string;
  unitSerial: string;
  ratedVoltage: string;
  ratedFrequency: string;
  voltageRatio: string;
  noLoadFrequency: string;
  currentRatio: string;
  fullLoadFrequency: string;
  apparentPower: string;
  ratedPower: string;
  ratedCurrent: string;
  powerFactor: string;
  benchPosition: string;
  communicationPort: string;
  phaseType: string;
  generatorBaudRate: string;
  engineBaudRate: string;
  env: EnvironmentData;
  appearanceList: AppearanceCheckItem[];
  coldInsulation: ColdInsulation;
  startPerformance: StartPerformance;
  operationCheckList: OperationCheckItem[];
  overspeedProtectList: OverspeedProtectItem[];
  protectExperimentList: ProtectExperimentItem[];
  loadList: LoadTestItem[];
  steadyAdjustment: SteadyAdjustment;
  steadyVoltageList: SteadyVoltageItem[];
  speedFluctuationList: SpeedFluctuationItem[];
  voltageFluctuationList: VoltageFluctuationItem[];
  transientSpeedList: TransientSpeedItem[];
  transientVoltageList: TransientVoltageItem[];
  hotInsulation: HotInsulation;
  integratedList: IntegratedCheckItem[];
  integrated2List: IntegratedCheckItem[];
  integrated3List: IntegratedCheckItem[];
  steadySpeedSub1List: SteadySpeedSubItem[];
  steadySpeedSub2List: SteadySpeedSubItem[];
  steadySpeedSub3List: SteadySpeedSubItem[];
  steadySpeedList: SteadySpeedItem[];
}

// 实验状态
interface ExperimentState {
  // 当前实验数据
  currentExperiment: ExperimentData | null;
  // 连接状态
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  // 数据采集状态
  dataCollectionStatus: 'idle' | 'collecting' | 'paused' | 'stopped';
  // 最后更新时间
  lastUpdateTime: number;
  // 实验列表缓存
  experimentList: ExperimentData[];
  // 当前选中的实验ID
  selectedExperimentId: string | null;
}

export const useExperimentStore = defineStore('experiment', () => {
  // 状态
  const state = ref<ExperimentState>({
    // 初始化为一个空的实验数据结构，避免各组件初次渲染时访问 null
    currentExperiment: createNewExperiment('', ''),
    connectionStatus: 'disconnected',
    dataCollectionStatus: 'idle',
    lastUpdateTime: 0,
    experimentList: [],
    selectedExperimentId: null,
  });

  // 计算属性
  const hasCurrentExperiment = computed(() => !!state.value.currentExperiment);
  
  const isExperimentRunning = computed(() => 
    state.value.currentExperiment?.status === 0
  );
  
  const isConnected = computed(() => state.value.connectionStatus === 'connected');
  
  const isCollecting = computed(() => state.value.dataCollectionStatus === 'collecting');

  const currentExperimentId = computed(() => state.value.currentExperiment?.id || '');

  const experimentCount = computed(() => state.value.experimentList.length);

  // Actions
  
  /**
   * 设置当前实验
   */
  function setCurrentExperiment(experiment: ExperimentData) {
    state.value.currentExperiment = experiment;
    state.value.selectedExperimentId = experiment.id;
    state.value.lastUpdateTime = Date.now();
  }

  /**
   * 更新实验状态
   */
  function updateExperimentStatus(status: number) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.status = status;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新实验数据
   */
  function updateExperimentData(data: Partial<ExperimentData>) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment = { ...state.value.currentExperiment, ...data };
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新环境数据
   */
  function updateEnvironmentData(envData: Partial<EnvironmentData>) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.env = { ...state.value.currentExperiment.env, ...envData };
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 生成默认的外观检查列表（12项）
   */
  function createDefaultAppearanceList(): AppearanceCheckItem[] {
    const defaultContents = [
      '检查柴油机、发电机与公共底座的连接\nGenset whether the assembly complete',
      '检查润滑油、燃油、冷却水液位是否正常\nCheck lube, fuel, cooling water level.',
      '燃油系统中的空气是否排净\nCheck whether eliminate out air in fuel system',
      '检查附件、管路、电气线路的连接是否可靠\nCheck accessories, piping, electrical wiring',
      '检查各系统管路有否漏油、漏水现象\ncheck there is oil, fuel and water leakage, or not',
      '检查起动系统是否正常\nCheck starting system',
      '检查进出水阀是否在启动准备状态\nCheck water inlet/outlet connection',
      '检查仪表板状态\nCheck control panel',
      '检查机组有无异物\n',
      '机组轴向间隙检查\n',
      '柴油机和发电机连接安装方式\nCheck engine, generator connection',
    ];

    const defaultRequirements = [
      '按工艺卡检查',
      '检查润滑油、冷却水加满',
      '燃油联好，并排除空气',
      '必须联接可靠',
      '不能有漏水漏油的情况',
      '电启动，蓄电池的容量必须正常 ☐\n气启动，气瓶的容量必须正常 ☐\n储能启动，储能的能量必须正常 ☐',
      '阀门必须打开',
      '仪表显示正常',
      '无异物',
      '按装配要求',
      '弹性安装☐\n钢性安装☐',
    ];

    const appearanceList: AppearanceCheckItem[] = [];

    // 添加1-11序号的检查项目
    for (let i = 1; i <= 11; i++) {
      appearanceList.push({
        id: '',
        serialNumber: i,
        checkContent: defaultContents[i - 1] || '',
        checkRequirement: defaultRequirements[i - 1] || '',
        checkStatus: '',
        remarks: '',
        conclusion: '',
      });
    }

    // 添加结论项（第12项）
    appearanceList.push({
      id: '',
      serialNumber: 12,
      checkContent: '外观检查结论',
      checkRequirement: '',
      checkStatus: '',
      remarks: '',
      conclusion: '',
    });

    return appearanceList;
  }

  function createSteadySpeedListData(): SteadySpeedItem[] {
  return [
    {
      id: '1',
      serialNumber: 1,
      item: '第一次结果',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    },
    {
      id: '2',
      serialNumber: 2,
      item: '第二次结果',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    },
    {
      id: '3',
      serialNumber: 3,
      item: '第三次结果',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    },
    {
      id: '4',
      serialNumber: 4,
      item: '平均值',
      steadyFrequencyDeviation: '',
      speedSystemInsensitivity: '',
      nonlinearity: '',
      conclusion: ''
    }
  ];
}

  function createDefaultList(type: string): any {
    const defaultContents = [
      { load: '0 %', time: '10 min' },
      { load: '25 %', time: '10 min' },
      { load: '50 %', time: '10 min' },
      { load: '75 %', time: '10 min' },
      { load: '100 %', time: '30 min' },
      { load: '100 %', time: '30 min' },
      { load: '100 %', time: '30 min' },
      { load: '100 %', time: '30 min' },
      { load: '110 %', time: '30 min' },
      { load: '75 %', time: '10 min' },
      { load: '50 %', time: '10 min' },
      { load: '25 %', time: '10 min' },
      { load: '0 %', time: '10 min' },
    ];
    const halfDefaultContents = defaultContents.slice(0, 9);

    switch (type) {
      // 三类列表共享相同的生成逻辑（取前 9 条）
      case 'loadList':
        return defaultContents
          .map((item, index) => ({
            serialNumber: index + 1,
            loadPercent: item.load,
            timeMin: item.time,
            visible: index < 9,
          }))
          .concat({
            conclusion: '',
          });
      
      case 'speedFluctuationList':
      case 'voltageFluctuationList':
        return defaultContents
          .map((item, index) => ({
            serialNumber: index + 1,
            load: item.load,
            visible: index < 9,
          }))
          .concat({
            conclusion: '',
          });
      // 三个稳态调速子表共享相同的生成逻辑（使用完整列表）
      case 'steadySpeedSub1List':
      case 'steadySpeedSub2List':
      case 'steadySpeedSub3List':
      case 'integratedList':
      case 'integrated2List':
      case 'integrated3List':
        return defaultContents.map((item, index) => ({
          serialNumber: index + 1,
          loadPercent: item.load,
          timeMin: item.time,
          visible: true,
        }));
      case 'steadyVoltageList':
        return defaultContents
          .map((item, index) => ({
            serialNumber: index + 1,
            loadPercent: item.load,
            timeMin: item.time,
          visible: true,
          }))
          .concat({
            conclusion: '',
          });
      default:
        return [];
    }
  }

  function createDefaultOperationCheckListList(): OperationCheckItem[] {
    return [
      {
        serialNumber: 1,
        item: '要求',
        voltage: '',
        frequency: '',
        waterTemp: '',
        oilPressure: '',
        speed: '',
        threeLeakage: '',
      },
      {
        serialNumber: 2,
        item: '实测',
        voltage: '',
        frequency: '',
        waterTemp: '',
        oilPressure: '',
        speed: '',
        threeLeakage: '',
      },
      {conclusion:""}
    ]
  }

  /**
   * 更新数据测定列表
   */
  function updateIntegratedList({integratedList, integrated2List, integrated3List}: {integratedList: IntegratedCheckItem[], integrated2List: IntegratedCheckItem[], integrated3List: IntegratedCheckItem[]}) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.integratedList = integratedList || [];
      state.value.currentExperiment.integrated2List = integrated2List || [];
      state.value.currentExperiment.integrated3List = integrated3List || [];
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新外观检查
   */
  function updateAppearanceList(AppearanceData: AppearanceCheckItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.appearanceList = AppearanceData;
        state.value.lastUpdateTime = Date.now();
    }
  }



  /**
   * 更新外观检查项目
   */
  function updateAppearanceCheckItem(serialNumber: number, data: Partial<AppearanceCheckItem>) {
    if (state.value.currentExperiment) {
      const index = state.value.currentExperiment.appearanceList.findIndex(item => item.serialNumber === serialNumber);
      if (index !== -1) {
        const updatedItem = {
          ...state.value.currentExperiment.appearanceList[index],
          ...data
        } as AppearanceCheckItem;
        state.value.currentExperiment.appearanceList[index] = updatedItem;
        state.value.lastUpdateTime = Date.now();
      }
    }
  }

  /**
   * 添加负载测试项目
   */
  function addLoadTestItem(item: LoadTestItem) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.loadList.push(item);
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新负载测试项目
   */
  function updateLoadTestItem(itemId: string, data: Partial<LoadTestItem>) {
    if (state.value.currentExperiment) {
      const index = state.value.currentExperiment.loadList.findIndex(item => item.id === itemId);
      if (index !== -1) {
        const updatedItem = {
          ...state.value.currentExperiment.loadList[index],
          ...data
        } as LoadTestItem;
        state.value.currentExperiment.loadList[index] = updatedItem;
        state.value.lastUpdateTime = Date.now();
      }
    }
  }

  /**
   * 更新负载测试报告
   */
  function updateLoadTestReport(data: LoadTestItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.loadList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新超速保护列表
   */
  function updateOverspeedProtectionList(data: OverspeedProtectItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.overspeedProtectList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新启动性能数据
   */
  function updateStartPerformance(data: Partial<StartPerformance>) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.startPerformance = {
        ...state.value.currentExperiment.startPerformance,
        ...data
      };
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新超速度保护测试项目
   */
  function updateOverspeedProtectionData(data: Partial<OverspeedProtectItem>) {
    if (state.value.currentExperiment) {
      // 这里应该更新 overspeedProtectList 而不是 overspeedProtection
      const existingList = state.value.currentExperiment.overspeedProtectList || [];
      // 如果需要更新整个列表，可以在这里实现逻辑
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新保护试验列表
   */
  function updateProtectExperimentList(data: ProtectExperimentItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.protectExperimentList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新保护试验项目
   */
  function updateProtectExperimentItem(serialNumber: number, data: Partial<ProtectExperimentItem>) {
    if (state.value.currentExperiment) {
      const index = state.value.currentExperiment.protectExperimentList.findIndex(item => item.serialNumber === serialNumber);
      if (index !== -1) {
        const updatedItem = {
          ...state.value.currentExperiment.protectExperimentList[index],
          ...data
        } as ProtectExperimentItem;
        state.value.currentExperiment.protectExperimentList[index] = updatedItem;
        state.value.lastUpdateTime = Date.now();
      }
    }
  }

  /**
   * 更新瞬态速度调节数据
   */
  function updateTransientSpeedRegulationList(data: TransientSpeedItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.transientSpeedList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新机组运转检查数据
   */
  function updateOperationInspectionList(data: OperationCheckItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.operationCheckList = data
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新瞬态电压变化数据
   */
  function updateTransientVoltageChangeList(data: any[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.transientVoltageList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新稳态电压调整数据
   */
  function updateSteadyVoltageList(data: SteadyVoltageItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.steadyVoltageList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新转速波动率测定数据
   */
  function updateSpeedFluctuationList(data: SpeedFluctuationItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.speedFluctuationList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新电压波动率测定数据
   */
  function updateVoltageFluctuationList(data: VoltageFluctuationItem[]) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.voltageFluctuationList = data;
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新稳态调速特性数据
   */
  function updateSteadySpeedCharacteristic(data: {
    steadySpeedList?: SteadySpeedItem[];
    steadySpeedSub1List?: SteadySpeedSubItem[];
    steadySpeedSub2List?: SteadySpeedSubItem[];
    steadySpeedSub3List?: SteadySpeedSubItem[];
  }) {
    if (state.value.currentExperiment) {
      if (data.steadySpeedList) {
        state.value.currentExperiment.steadySpeedList = data.steadySpeedList;
      }
      if (data.steadySpeedSub1List) {
        state.value.currentExperiment.steadySpeedSub1List = data.steadySpeedSub1List;
      }
      if (data.steadySpeedSub2List) {
        state.value.currentExperiment.steadySpeedSub2List = data.steadySpeedSub2List;
      }
      if (data.steadySpeedSub3List) {
        state.value.currentExperiment.steadySpeedSub3List = data.steadySpeedSub3List;
      }
      // 注意：conclusion 和 requirement 可能需要根据实际数据结构调整存储位置
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新稳态调节数据
   */
  function updateSteadyAdjustment(data: Partial<SteadyAdjustment>) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment.steadyAdjustment = {
        ...state.value.currentExperiment.steadyAdjustment,
        ...data
      };
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 更新实验设置数据
   */
  function updateExperimentSettings(data: Partial<ExperimentData>) {
    if (state.value.currentExperiment) {
      state.value.currentExperiment = {
        ...state.value.currentExperiment,
        ...data
      };
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 设置连接状态
   */
  function setConnectionStatus(status: ExperimentState['connectionStatus']) {
    state.value.connectionStatus = status;
    state.value.lastUpdateTime = Date.now();
  }

  /**
   * 设置数据采集状态
   */
  function setDataCollectionStatus(status: ExperimentState['dataCollectionStatus']) {
    state.value.dataCollectionStatus = status;
    state.value.lastUpdateTime = Date.now();
  }

  /**
   * 设置实验列表
   */
  function setExperimentList(experiments: ExperimentData[]) {
    state.value.experimentList = experiments;
    state.value.lastUpdateTime = Date.now();
  }

  /**
   * 添加实验到列表
   */
  function addExperimentToList(experiment: ExperimentData) {
    state.value.experimentList.push(experiment);
    state.value.lastUpdateTime = Date.now();
  }

  /**
   * 从列表中移除实验
   */
  function removeExperimentFromList(experimentId: string) {
    const index = state.value.experimentList.findIndex(exp => exp.id === experimentId);
    if (index !== -1) {
      state.value.experimentList.splice(index, 1);
      state.value.lastUpdateTime = Date.now();
    }
  }

  /**
   * 清空当前实验数据
   */
  function clearCurrentExperiment() {
    state.value.currentExperiment = createNewExperiment('','');
    state.value.selectedExperimentId = null;
    state.value.dataCollectionStatus = 'idle';
    state.value.lastUpdateTime = Date.now();
  }

  /**
   * 根据ID获取实验数据
   */
  function getExperimentById(experimentId: string): ExperimentData | undefined {
    return state.value.experimentList.find(exp => exp.id === experimentId);
  }

  /**
   * 选择实验
   */
  function selectExperiment(experimentId: string) {
    const experiment = getExperimentById(experimentId);
    if (experiment) {
      setCurrentExperiment(experiment);
    }
  }

  /**
   * 创建新实验
   */
  function createNewExperiment(experimentNo: string, experimentId: string): ExperimentData {
    return {
      id: experimentId,
      experimentNo: experimentNo,
      projectName: '',
      shipNumber: '',
      testPerson: '',
      inspector: '',
      reviewer: '',
      customer: '',
      shipyard: '',
      status: 0,
      isTemplate: '',
      engineModel: '',
      engineSerial: '',
      generatorModel: '',
      generatorSerial: '',
      unitModel: '',
      unitSerial: '',
      ratedVoltage: '',
      ratedFrequency: '',
      voltageRatio: '',
      noLoadFrequency: '',
      currentRatio: '',
      fullLoadFrequency: '',
      apparentPower: '',
      ratedPower: '',
      ratedCurrent: '',
      powerFactor: '',
      benchPosition: '',
      communicationPort: '',
      phaseType: '',
      generatorBaudRate: '',
      engineBaudRate: '',
      env: {
         id: '',
         testPlace: '',
         temperature: 0,
         relativeHumidity: 0,
         atmosphericPressure: 0,
         testDate: '',
       },
      appearanceList: createDefaultAppearanceList(),
      coldInsulation: {
        id: '',
        generatorSn: '',
        measured: 0,
        standard: 0,
        conclusion: '',
      },
      startPerformance: {
         id: '',
         flywheelTeeth: 0,
         ratedIdleSpeed: 0,
         startSuccessCriteria: '',
         autoStartExperimentResult: '',
         autoShutdownExperimentResult: '',
         threeStartFailureResult: '',
         emergencyShutdownResult: '',
         conclusion: '',
         subList: [],
       },
      operationCheckList: createDefaultOperationCheckListList(),
      overspeedProtectList: [],
      protectExperimentList: [],
      loadList: createDefaultList('loadList'),
      steadyAdjustment: {
         id: '',
         ratedVoltage: '',
         noLoadMaxVoltage: '',
         noLoadMinVoltage: '',
         maxSpeedRegulationNoLoadFreq: '',
         maxSpeedRegulationFullLoadFreq: '',
         maxSteadyStateSpeedRegulation: '',
         minSpeedRegulationNoLoadFreq: '',
         minSpeedRegulationFullLoadFreq: '',
         minSteadyStateSpeedRegulation: '',
         conclusion: '',
       },
      steadyVoltageList: createDefaultList('steadyVoltageList'),
      speedFluctuationList: createDefaultList('speedFluctuationList'),
      voltageFluctuationList: createDefaultList('voltageFluctuationList'),
      transientSpeedList: [],
      transientVoltageList: [],
      hotInsulation: {
        id: '',
        generatorSn: '',
        measured: '',
        standard: '',
        conclusion: '',
      },
      integratedList: createDefaultList('integratedList'),
      integrated2List: createDefaultList('integrated2List'),
      integrated3List: createDefaultList('integrated3List'),
      steadySpeedSub1List: createDefaultList('steadySpeedSub1List'),
      steadySpeedSub2List: createDefaultList('steadySpeedSub2List'),
      steadySpeedSub3List: createDefaultList('steadySpeedSub3List'),
      steadySpeedList: createSteadySpeedListData(),
    };
  }

  /**
   * 更新实验序号和实验ID
   */
  function updateExperimentNoAndId(experimentNo: string, experimentId: string) {
    console.log('updateExperimentNoAndId called with:', experimentNo, experimentId);
    console.log('current state.value.currentExperiment:', state.value.currentExperiment);
    
    // 如果当前没有实验，先创建一个新的实验对象
    if (!state.value.currentExperiment) {
      console.log('Creating new experiment...');
      state.value.currentExperiment = createNewExperiment(experimentNo, experimentId);
      console.log('New experiment created:', state.value.currentExperiment);
      console.log('New experiment appearanceList:', state.value.currentExperiment.appearanceList);
      state.value.selectedExperimentId = experimentId;
      state.value.lastUpdateTime = Date.now();
      return;
    }

    // 更新主实验的序号和ID
    console.log('Updating existing experiment...');
    state.value.currentExperiment.experimentNo = experimentNo;
    state.value.currentExperiment.id = experimentId;
    
    state.value.selectedExperimentId = experimentId;
    state.value.lastUpdateTime = Date.now();
  }

  /**
   * 提交实验数据到服务器
   */
  async function submitExperimentData() {
    if (!state.value.currentExperiment) {
      throw new Error('当前没有实验数据可以提交');
    }

    try {
      const result = await updateExperimentDataApi(state.value.currentExperiment);
      state.value.lastUpdateTime = Date.now();
      return result;
    } catch (error) {
      console.error('提交实验数据失败:', error);
      throw error;
    }
  }

  /**
   * 重置 store 状态
   */
  function $reset() {
    state.value = {
      // 重置时也提供默认结构，避免页面因空对象导致的空值访问
      currentExperiment: createNewExperiment('', ''),
      connectionStatus: 'disconnected',
      dataCollectionStatus: 'idle',
      lastUpdateTime: 0,
      experimentList: [],
      selectedExperimentId: null,
    };
  }

  return {
    // 状态
    state: readonly(state),
    
    // 计算属性
    hasCurrentExperiment,
    isExperimentRunning,
    isConnected,
    isCollecting,
    currentExperimentId,
    experimentCount,
    
    // Actions
    $reset,
    setCurrentExperiment,
    updateExperimentStatus,
    updateExperimentData,
    updateEnvironmentData,
    updateAppearanceCheckItem,
    updateAppearanceList,
    addLoadTestItem,
    updateLoadTestItem,
    updateLoadTestReport,
    updateOverspeedProtectionList,
    updateOverspeedProtectionData,
    updateProtectExperimentList,
    updateProtectExperimentItem,
    updateSteadyAdjustment,
    updateExperimentSettings,
    setConnectionStatus,
    setDataCollectionStatus,
    setExperimentList,
    addExperimentToList,
    removeExperimentFromList,
    clearCurrentExperiment,
    getExperimentById,
    selectExperiment,
    createNewExperiment,
    updateExperimentNoAndId,
    submitExperimentData,
    updateOperationInspectionList,
    updateStartPerformance,
    updateTransientSpeedRegulationList,
    updateTransientVoltageChangeList,
    updateSteadyVoltageList,
    updateSpeedFluctuationList,
    updateVoltageFluctuationList,
    updateSteadySpeedCharacteristic,
    updateIntegratedList,
  };
});

// 支持热更新
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExperimentStore, import.meta.hot));
}

// 导出接口类型
export type { 
  EnvironmentData,
  AppearanceCheckItem,
  ColdInsulation,
  StartPerformanceSubItem,
  StartPerformance,
  OperationCheckItem,
  OverspeedProtectItem,
  ProtectExperimentItem,
  IntegratedCheckItem,
  SteadySpeedSubItem,
  SteadySpeedItem
};