import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { generateAccessCredentialApi, getAccessCredentialApi } from '#/api/core';
import { generateExperimentNumApi, returnStaticCommand, getExperimentDetailByIdApi } from '#/api/core/experiment';
import { useExperimentStore } from '#/store/experiment';
import { useDataCollector } from '#/composables/useDataCollector';
import {
  saveExperimentToStorage,
  getExperimentFromStorage,
  clearExperimentFromStorage,
  type ExperimentStorageData,
} from '#/composables/useExperimentStorage';



export function useCurrentExperiment() {
  const experimentStore = useExperimentStore();
  const { executeSyncQueue } = useDataCollector();
  const router = useRouter();
  const experimentNo = ref('');

  const hasCredential = ref(false);
  const credentialModalOpen = ref(false);
  const accessCredential = ref<{ url: string; account: string; password: string }>({
    url: '',
    account: '',
    password: '',
  });

  const isSettingsExpanded = ref(true);

  const experimentButtons = ref([
    { key: 'create', label: '新建实验', type: 'primary', icon: 'plus', disabled: false },
    { key: 'end', label: '结束本次实验', type: 'default', icon: 'check', disabled: true },
    { key: 'abandon', label: '废弃本次实验', type: 'default', icon: 'close', disabled: true, danger: true },
    { key: 'preview', label: '报告预览', type: 'default', icon: 'eye', disabled: true },
    { key: 'sync', label: '数据同步', type: 'default', icon: 'sync', disabled: true },
    { key: 'back', label: '返回静态', type: 'primary', icon: 'arrow-left', disabled: true },
    { key: 'credential', label: '生成访问凭证', type: 'default', icon: 'key', disabled: true },
  ]);

  const updateButtonStates = () => {
    const hasExperiment = !!experimentStore.state.currentExperiment?.id;
    experimentButtons.value.forEach((button: any) => {
      if (button.key === 'create') button.disabled = hasExperiment;
      else button.disabled = !hasExperiment;
    });
  };

  const setCredentialButtonLabel = () => {
    const btn = experimentButtons.value.find((b: any) => b.key === 'credential');
    if (btn) btn.label = hasCredential.value ? '查看访问凭证' : '生成访问凭证';
  };

  // 初始化实验数据，从 localStorage 恢复
  const initializeExperimentData = async () => {
    const storedData = getExperimentFromStorage();
    if (storedData && storedData.experimentNo && storedData.id) {
      try {
        console.log('从本地存储发现实验数据:', storedData);
        
        // 从后端获取完整的实验数据
        const experimentDetail = await getExperimentDetailByIdApi({ 
          id: storedData.id,
          isNewExperiment: false 
        });
        // 将完整数据同步到 store
          experimentStore.setCurrentExperiment(experimentDetail);
          experimentNo.value = storedData.experimentNo;
          
          // 执行数据提交
          await experimentStore.submitExperimentData();
          
          updateButtonStates();
          console.log('实验数据已从后端恢复并同步到store:', experimentDetail);
          message.success(`已恢复实验 ${storedData.experimentNo}`);
      } catch (error) {
        console.error('恢复实验数据失败:', error);
        // 如果获取失败，清除本地存储避免重复尝试
        clearExperimentFromStorage();
        message.error('恢复实验数据失败，请重新创建实验');
      }
    }
  };

  const handleButtonClick = async (buttonKey: string) => {
    switch (buttonKey) {
      case 'create': {
        const result = await generateExperimentNumApi();
        experimentNo.value = result.experimentNo;
        
        // 创建新的实验
        experimentStore.updateExperimentNoAndId(result.experimentNo, result.id);
        
        // 将实验数据保存到 localStorage
        saveExperimentToStorage(result.experimentNo, result.id, 0);
        
        const syncSuccess = await executeSyncQueue();
        if (syncSuccess) {
          await experimentStore.submitExperimentData();
          updateButtonStates(); 
        }
        
        break;
      }
      case 'end': {
        console.log('结束实验:', experimentNo.value);
        // 更新实验状态为已结束
          if (experimentStore.state.currentExperiment) {
            experimentStore.updateExperimentData({ status: 1 }); // 1-已结束
            
            // 提交实验数据
            await experimentStore.submitExperimentData();
            
            // 清除当前实验数据
            experimentStore.clearCurrentExperiment();
            
            // 清除本地存储的实验数据
            clearExperimentFromStorage();
            experimentNo.value = '';

            console.log('experimentStore:', experimentStore.state.currentExperiment);
            updateButtonStates(); 
            
            message.success('实验已成功结束');
            
            // 跳转到历史记录页面
            router.push('/history');
          } else {
            message.warning('没有正在进行的实验');
          }
        break;
      }
      case 'abandon': {
        if (experimentStore.state.currentExperiment) {
            experimentStore.updateExperimentData({ status: 2 }); // 2-已废弃
            
            // 提交实验数据
            await experimentStore.submitExperimentData();
            
            // 清除当前实验数据
            experimentStore.clearCurrentExperiment();
            
            // 清除本地存储的实验数据
            clearExperimentFromStorage();
            experimentNo.value = '';
            
            updateButtonStates(); 
            
            message.success('实验已成功废弃');
            
            // 跳转到历史记录页面
            router.push('/history');
          } else {
            message.warning('没有正在进行的实验');
          }
        break;
      }
      case 'back': {
        const expId = experimentStore.state.currentExperiment?.id;
        if (!expId) {
          message.warning('无法返回静态：未找到实验ID');
        } else {
          await returnStaticCommand({ experimentId: expId });
          message.info('静态指令已发送');
        }
        break;
      }
      case 'preview': {
        console.log('预览报告:', experimentNo.value);
        // 跳转到报告页面，携带本地存储的 id 和 experimentNo 作为路由参数
        const stored: ExperimentStorageData | null = getExperimentFromStorage();
        const idParam = stored?.id || experimentStore.state.currentExperiment?.id || '';
        const expNoParam = stored?.experimentNo || experimentNo.value || '';
        if (!idParam || !expNoParam) {
          message.warning('缺少实验ID或编号，建议先创建或恢复实验');
        }
        router.push({
          path: '/report',
          query: {
            id: String(idParam),
            experimentNo: String(expNoParam),
          },
        });
        break;
      }
      case 'sync': {
        console.log('同步数据:', experimentNo.value);
        try {
          // 获取所有收集器信息
          // const collectorInfo = getCollectorInfo();
          // console.log('当前注册的数据收集器:', collectorInfo)
          
        
          
          // 执行数据同步队列
          const syncSuccess = await executeSyncQueue();
          
          if (syncSuccess) {
            // 直接使用store中的数据进行同步，简化流程
            console.log('直接使用store中的数据进行同步:', experimentStore.state.currentExperiment);
            await experimentStore.submitExperimentData();
            message.success('实验数据同步成功');
          } else {
            message.error('数据收集器同步失败');
          }
        } catch (error) {
          console.error('同步数据失败:', error);
          message.error('实验数据同步失败');
        }
        break;
      }
      case 'credential': {
        if (!experimentNo.value) return;
        const expId = experimentStore.state.currentExperiment?.id;
        if (!expId) {
          message.warning('请先创建实验，缺少实验ID');
          break;
        }
        try {
          if (!hasCredential.value) {
            const res = await generateAccessCredentialApi({ username: experimentNo.value, end: 1 });
            accessCredential.value = {
              url: res?.url ?? '',
              account: experimentNo.value,
              password: res?.password ?? String(Math.floor(100000 + Math.random() * 900000)),
            };
            hasCredential.value = true;
            setCredentialButtonLabel();
            credentialModalOpen.value = true;
            message.success('访问凭证已生成');
          } else {
            try {
              const res = await getAccessCredentialApi({ experimentId: expId });
              accessCredential.value = {
                url: res?.url ?? accessCredential.value.url,
                account: experimentNo.value,
                password: res?.password ?? accessCredential.value.password,
              };
            } catch {}
            credentialModalOpen.value = true;
          }
        } catch (e) {
          message.error('访问凭证生成失败');
        }
        break;
      }
    }
  };

  const copyCredentialAll = async () => {
    const text = `临时访问地址：${accessCredential.value.url}\n账号：${accessCredential.value.account}\n密码：${accessCredential.value.password}`;
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制');
    } catch {
      message.error('复制失败');
    }
  };

  const activeTab = ref('environment');
  const activeMonitorTab = ref('realtime');

  const experimentTabs = [
    { key: 'environment', label: '试验环境' },
    { key: 'appearance', label: '外观检查' },
    { key: 'cold-insulation', label: '冷态绝缘电阻测量' },
    { key: 'startup', label: '启动性能试验' },
    { key: 'operation', label: '机组运转检查' },
    { key: 'protection', label: '机组保护装置试验' },
    { key: 'comprehensive', label: '综合实验' },
    // { key: 'load', label: '负载试验' },
    // { key: 'steady', label: '稳态试验' },
    // { key: 'fluctuation', label: '波动试验' },
    { key: 'transient', label: '瞬态实验' },
    { key: 'hot-insulation', label: '热态绝缘电阻测量' },
  ];

  const monitorTabs = [
    { key: 'realtime', label: '实时数据' },
    { key: 'monitoring', label: '设备监控' },
  ];

  const handleTabChange = (key: string) => {
    activeTab.value = key;
  };

  const handleMonitorTabChange = (key: string) => {
    activeMonitorTab.value = key;
  };

  return {
    experimentNo,
    hasCredential,
    credentialModalOpen,
    accessCredential,
    isSettingsExpanded,
    experimentButtons,
    updateButtonStates,
    setCredentialButtonLabel,
    handleButtonClick,
    copyCredentialAll,
    copyText,
    activeTab,
    activeMonitorTab,
    experimentTabs,
    monitorTabs,
    handleTabChange,
    handleMonitorTabChange,
    experimentStore,
    initializeExperimentData,
  };
}