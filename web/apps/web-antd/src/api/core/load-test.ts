import { requestClient } from '../request';

export interface LoadTestMeasurementPayload {
  itemId: number;
}

export interface LoadTestMeasurementResp {
  powerMeasured: string;
  frequency: string;
  powerFactor: string;
  uA: string;
  uB: string;
  uC: string;
  iA: string;
  iB: string;
  iC: string;
  speed: string;
  oilTemp: string;
  oilPressure: string;
  coolantTemp: string;
  crankcasePress: string;
  fuelRate: string;
  percentPowerInhale: string;
  percentPowerIntake: string;
  fuelAccumulatorPress: string;
  fuelSupplyPress: string;
  exhaustTempLB: string;
  exhaustTempRB: string;
  coolantPress: string;
  seaWaterPress: string;
  fuelTemp: string;
  boostPressL: string;
  boostPressR: string;
  intakeManifTempLBF: string;
  intakeManifTempLBR: string;
  intakeManifTempRBF: string;
  intakeManifTempRBR: string;
}

export function getLoadTestMeasurementApi(
  payload: LoadTestMeasurementPayload,
): Promise<LoadTestMeasurementResp> {
  return requestClient.post('/experiment/load-test/measurement', payload);
}