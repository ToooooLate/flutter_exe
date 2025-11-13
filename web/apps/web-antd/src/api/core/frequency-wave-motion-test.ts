import { requestClient } from '#/api/request';

export interface FrequencyWaveMotionTestParams {
  loadIndex: number;
}

export interface FrequencyWaveMotionTestData {
  power: string;
  frequency: string;
  powerFactor: string;
  measuredFreqBefore: string;
  freqMax: string;
  freqMin: string;
  freqAve: string;
  motionRate: string;
}

/**
 * 获取转速波动率测定数据
 */
export async function getFrequencyWaveMotionTestApi(params: FrequencyWaveMotionTestParams): Promise<FrequencyWaveMotionTestData> {
  return requestClient.get<FrequencyWaveMotionTestData>('/api/frequency-wave-motion-test/measurement', {
    params,
  });
}