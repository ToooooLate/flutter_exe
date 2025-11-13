# WebSocket 数据格式优化及解析

### 1. WebSocket 全量实验数据格式--包含数据同步接口以及综合试验数据测定接口



```
{

 "data": {
    "id": "",
    "experimentNo": "",
    "projectName": "",
    "shipNumber": "",
    "testPerson": "",
    "inspector": "",
    "reviewer": "",
    "customer": "",
    "shipyard": "",
    "status": 1,
    "isTemplate": 1,
    "engineModel": "",
    "engineSerial": "",
    "generatorModel": "",
    "generatorSerial": "",
    "unitModel": "",
    "unitSerial": "",
    "ratedVoltage": 1,
    "ratedFrequency": 1,
    "voltageRatio": 1,
    "noLoadFrequency": 1,
    "currentRatio": 1,
    "fullLoadFrequency": 1,
    "powerFactor": 1,
    "benchPosition": 1,
    "generatorComPort": 1,
    "engineComPort": 1,
    "phaseType": "",
    "generatorBaudRate": 1,
    "engineBaudRate": 1,
    "env": {
        "id": "",
        "experimentId": "",
        "testPlace": "",
        "temperature": 1,
        "relativeHumidity": 1,
        "atmosphericPressure": 1,
        "testDate": "2025-10-27 19:33:28"
    },
    "appearanceList": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "checkContent": "",
            "checkRequirement": "",
            "checkStatus": "",
            "remarks": "",
            "conclusion": ""
        }
    ],
    "coldInsulation": {
        "id": "",
        "experimentId": "",
        "generatorSn": "",
        "measured": 1,
        "standard": 1,
        "conclusion": ""
    },
    "startPerformance": {
        "experimentId": "",
        "flywheelTeeth": 1,
        "ratedIdleSpeed": 1,
        "startSuccessCriteria": "",
        "autoStartExperimentResult": "",
        "autoShutdownExperimentResult": "",
        "threeStartFailureResult": "",
        "emergencyShutdownResult": "",
        "conclusion": "",
        "subList": [
            {
                "startExperimentId": "",
                "startNumber": 1,
                "ambientTemperature": "",
                "startupTime": "",
                "startupStatus": "",
                "id": "",
                "delFlag": 0,
                "createTime": "2025-10-27 19:33:28",
                "updateTime": "2025-10-27 19:33:28",
                "createBy": "",
                "updateBy": ""
            }
        ],
        "id": "",
        "delFlag": 0,
        "createTime": "2025-10-27 19:33:28",
        "updateTime": "2025-10-27 19:33:28",
        "createBy": "",
        "updateBy": ""
    },
    "operationCheckList": [
        {
            "id": "",
            "experimentId": "",
            "item": "",
            "voltage": "",
            "frequency": "",
            "waterTemp": "",
            "oilPress": "",
            "speed": "",
            "threeLeakage": "",
            "conclusion": ""
        }
    ],
    "overspeedProtectList": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "speed": 1,
            "alarmShutdown": "",
            "remarks": "",
            "conclusion": ""
        }
    ],
    "protectExperimentList": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "testItem": "",
            "signalType": "",
            "setValue": "",
            "localDisplay": "",
            "localAlarm": "",
            "localShd": "",
            "testResult": "",
            "remark": "",
            "conclusion": ""
        }
    ],
    "integratedList": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "loadPercent": "",
            "timeMin": "",
            "ua": "",
            "ia": "",
            "powerFactor": 1,
            "frequency": 1,
            "umax": 1,
            "umin": 1,
            "fmax": 1,
            "fmin": 1
        }
    ],
    "loadList": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "timeMin": "",
            "loadPercent": "",
            "powerStandard": "",
            "powerMeasured": "",
            "frequency": "",
            "powerFactor": "",
            "ua": "",
            "ub": "",
            "uc": "",
            "ia": "",
            "ib": "",
            "ic": "",
            "speed": "",
            "oilTemperature": "",
            "oilPressure": "",
            "coolantTemp": "",
            "exhaustTemp": "",
            "crankcasePress": "",
            "fuelRate": "",
            "percentPower": "",
            "fuelAccumulatorPress": "",
            "fuelSupplyPress": "",
            "exhaustTempLb": "",
            "exhaustTempRb": "",
            "coolantPress": "",
            "seaWaterPress": "",
            "fuelTemp": "",
            "boostPressL": "",
            "boostPressR": "",
            "intakeManifoldTempLbf": "",
            "intakeManifoldTempLbb": "",
            "intakeManifoldTempRbf": "",
            "intakeManifoldTempRbb": "",
            "conclusion": ""
        }
    ],
    "steadyAdjustment": {
        "id": "",
        "experimentId": "",
        "ratedVoltage": "",
        "noLoadMaxVoltage": "",
        "noLoadMinVoltage": "",
        "maxSpeedRegulationNoLoadFreq": "",
        "maxSpeedRegulationFullLoadFreq": "",
        "maxSteadyStateSpeedRegulation": "",
        "minSpeedRegulationNoLoadFreq": "",
        "minSpeedRegulationFullLoadFreq": "",
        "minSteadyStateSpeedRegulation": "",
        "conclusion": ""
    },
    "steadyVoltageList": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "loadPercent": "",
            "power": "",
            "frequency": "",
            "powerFactor": "",
            "ua": "",
            "ub": "",
            "uc": "",
            "ia": "",
            "ib": "",
            "ic": "",
            "phaseAVoltage": "",
            "steadyVoltageDeviation": "",
            "conclusion": ""
        }
    ],
    "steadySpeedList": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "item": "",
            "steadyFrequencyDeviation": "",
            "speedSystemInsensitivity": "",
            "nonlinearity": "",
            "conclusion": ""
        }
    ],
    "steadySpeedSub1List": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "loadPercent": "",
            "power": "",
            "frequency": "",
            "powerFactor": "",
            "ua": "",
            "ub": "",
            "uc": "",
            "ia": "",
            "ib": "",
            "ic": "",
            "phaseAVoltage": "",
            "steadyFrequencyDeviation": ""
        }
    ],
    "steadySpeedSub2List": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "loadPercent": "",
            "power": "",
            "frequency": "",
            "powerFactor": "",
            "ua": "",
            "ub": "",
            "uc": "",
            "ia": "",
            "ib": "",
            "ic": "",
            "phaseAVoltage": "",
            "steadyFrequencyDeviation": ""
        }
    ],
    "steadySpeedSub3List": [
        {
            "id": "",
            "experimentId": "",
            "serialNumber": 1,
            "loadPercent": "",
            "power": "",
            "frequency": "",
            "powerFactor": "",
            "ua": "",
            "ub": "",
            "uc": "",
            "ia": "",
            "ib": "",
            "ic": "",
            "phaseAVoltage": "",
            "steadyFrequencyDeviation": ""
        }
    ],
    "speedFluctuationList": [
        {
            "id": "",
            "serialNumber": 1,
            "experimentId": "",
            "load": "",
            "power": "",
            "frequency": "",
            "powerFactor": "",
            "measuredFreqBeforeExperiment": "",
            "frequencyWaveMax": "",
            "frequencyWaveMin": "",
            "frequencyWaveAve": "",
            "speedFluctuationRate": "",
            "speedFluctuationStandard": "",
            "conclusion": ""
        }
    ],
    "voltageFluctuationList": [
        {
            "id": "",
            "serialNumber": 1,
            "experimentId": "",
            "load": "",
            "power": "",
            "frequency": "",
            "powerFactor": "",
            "ua": "",
            "ub": "",
            "uc": "",
            "measuredVoltageBeforeExperiment": "",
            "voltageWaveMax": "",
            "voltageWaveMin": "",
            "voltageWaveAve": "",
            "voltageFluctuationRate": "",
            "voltageFluctuationStandard": "",
            "conclusion": ""
        }
    ],
    "transientSpeedList": [
        {
            "id": "",
            "experimentId": "",
            "loadChangeState": "",
            "beforeChangeFrequency": "",
            "beforeChangePower": "",
            "instantaneousFrequencyMaxMin": "",
            "afterChangeFrequency": "",
            "afterChangePower": "",
            "stabilityTime": "",
            "transientSpeedRegulationRate": "",
            "curveInfo": "",
            "conclusion": "",
            "stableFrequencyDeviationRange": ""
        }
    ],
    "transientVoltageList": [
        {
            "id": "",
            "experimentId": "",
            "loadChangeState": "",
            "beforeChangeVoltage": "",
            "beforeChangeCurrent": "",
            "beforeChangePowerFactor": "",
            "instantaneousFrequencyMaxMin": "",
            "afterChangeVoltage": "",
            "afterChangeCurrent": "",
            "afterChangePowerFactor": "",
            "stabilityTime": "",
            "transientVoltageChangeRate": "",
            "curveInfo": "",
            "conclusion": "",
            "stableVoltageDeviationRange": ""
        }
    ],
    "hotInsulation": {
        "id": "",
        "experimentId": "",
        "generatorSn": "",
        "measured": 1,
        "standard": 1,
        "conclusion": ""
    },
    "voltageModulation": {
        "id": "",
        "experimentId": "",
        "umodMax": 1,
        "umodMin": 1,
        "umodSPercent": 1
    }
},

 "experimentId": "1980832496059994113",

 "timestamp": 1761206792222,
 "experimentStatus": true, //一共两次发送命令，点击测定为true，倒计时60秒结束时为false

 "type": "experiment" //综合试验用integratedExperiment

}
```

### 2. WebSocket 实时监控数据格式



```
{

 "data": {

   "code": 200,//200正常，500超时

   "coolantTemperature": 1,

   "createTime": "2025-10-23T16:13:57.835",

   "delFlag": 0,

   "exhaustTemp": 1,

   "experimentId": "1980832496059994113",

   "frequency": 1,

   "ia": 1,

   "ib": 1,

   "ic": 1,

   "id": "1981272872928796674",

   "load": 1,

   "oilPressure": 1,

   "oilTemperature": 1,

   "power": 1,

   "powerFactor": 1,

   "speed": 1,

   "ua": 1,

   "ub": 1,

   "uc": 1,

   "updateTime": "2025-10-23T16:13:57.839"

 },

 "experimentId": "1980832496059994113",

 "timestamp": 1761207238994,

 "type": "monitoring"

}
```

### 3. WebSocket 瞬态实验 - 瞬态调速率和稳定时间测定数据格式



```
{

 "data": {

   "code": 200,//200正常，500超时
   
   "isCurveInfo": true,  // 功能标识：true=获取曲线

   "id": "",

   "experimentId": "", // 关联实验表的ID，外键

   "loadChangeState": "", // 负载变化状态

   "beforeChangeFrequency": "", // 突变前频率(Hz)

   "beforeChangePower": "", // 突变前功率(kW)

   "instantaneousFrequencyMaxMin": "", // 瞬时频率最大或最小(Hz)

   "afterChangeFrequency": "", // 突变后频率(Hz)

   "afterChangePower": "", // 突变后功率(kW)

   "stabilityTime": "", // 稳定时间t

   "transientSpeedRegulationRate": "", // 瞬态调速率δ(%)

   "curveInfo": "", // 曲线信息

   "conclusion": "", // 结论

   "stableFrequencyDeviationRange": "" // 稳定频率偏差范围

 },

 "experimentId": "1980832496059994113",

 "timestamp": 1761207238994,

 "type": "transientSpeed"

}
```

### 4. WebSocket 瞬态实验 - 瞬态电压变化率和稳定时间测定数据格式



```
{

 "data": {

   "code": 200,//200正常，500超时
   
   "isCurveInfo": true,  // 功能标识：true=获取曲线

   "id": "",

   "experimentId": "", // 关联实验表的ID，外键

   "loadChangeState": "", // 负载变化状态

   "beforeChangeVoltage": "", // 突变前电压(V)

   "beforeChangeCurrent": "", // 突变前电流(A)

   "beforeChangePowerFactor": "", // 突变前功率因数COSΦ

   "instantaneousFrequencyMaxMin": "", // 瞬时频率最大或最小(Hz)

   "afterChangeVoltage": "", // 突变后电压(V)

   "afterChangeCurrent": "", // 突变后电流(A)

   "afterChangePowerFactor": "", // 突变后功率因数COSΦ

   "stabilityTime": "", // 稳定时间t

   "transientVoltageChangeRate": "", // 瞬态电压变化率δ(%)

   "curveInfo": "", // 曲线信息

   "conclusion": "", // 结论

   "stableVoltageDeviationRange": "" // 稳定电压偏差范围

 },

 "experimentId": "1980832496059994113",

 "timestamp": 1761207238994,

 "type": "transientVoltage"

}
```

### 5. WebSocket 电压调制数据格式



```
{

 "data": {

   "code": 200,//200正常，500超时

   "id": "",
   
   "serialNumber": 1,  // 序号

   "experimentId": "",

   "umodMax": 1, // 最大调制电压 (V)

   "umodMin": 1, // 最小调制电压 (V)

   "umodSPercent": 1 // 电压调制百分比 (%)

 },

 "experimentId": "1980832496059994113",

 "timestamp": 1761207238994,

 "type": "voltageModulation"

}
```

### 6. WebSocket 机组运转检查数据格式



```
{

 "data": {

   "code": 200,//200正常，500超时

   "id": "",

   "experimentId": "", // 实验ID

   "item": "", // 项目

   "voltage": "", // 电压

   "frequency": "", // 频率

   "waterTemp": "", // 水温

   "oilPress": "", // 油压

   "speed": "", // 转速

   "threeLeakage": "", // 三路漏电

   "conclusion": "" // 结论

 },

 "experimentId": "1980832496059994113",

 "timestamp": 1761207238994,

 "type": "checkStartup"

}
```

### 7.WebSocket 返回静态数据格式

{

 "data": {

   "code": 200,//200正常，500超时

   "experimentId": ""// 实验ID

 },

 "experimentId": "1980832496059994113",

 "timestamp": 1761207238994,

 "type": "returnStatic"

}

### 8.WebSocket DCU启用链接数据格式

{

 "data": {

   "code": 200 //200正常，500超时

 },

 "timestamp": 1761207238994,

 "type": "dcuConnectionInfo"

}
