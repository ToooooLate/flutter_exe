import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useClipboard } from '@vueuse/core';
import { generateAccessCredentialApi, getAccessCredentialApi } from '#/api/core';
import { extendUserAccountAccessApi } from '#/api/core/user';
import { generateExperimentNumApi, returnStaticCommand, getExperimentDetailByIdApi, getExperimentIdByNoApi } from '#/api/core/experiment';
import { useExperimentStore } from '#/store/experiment';
import { useUserStore } from '#/store/user';
import { useDataCollector } from '#/composables/useDataCollector';
import { $t } from '#/locales';
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
  const userStore = useUserStore();
  const experimentNo = ref('');
  const { copy } = useClipboard({ legacy: true });

  const hasCredential = ref(false);
  const credentialModalOpen = ref(false);
  const accessCredential = ref<{ url: string; account: string; password: string, begin?: number , end?: number }>({
    url: '',
    account: '',
    password: '',
  });

  const isSettingsExpanded = ref(true);

  const experimentButtons = ref([
    { key: 'create', label: $t('experiment.current.buttons.create'), type: 'primary', icon: 'plus', disabled: false },
    { key: 'end', label: $t('experiment.current.buttons.end'), type: 'default', icon: 'check', disabled: true },
    { key: 'abandon', label: $t('experiment.current.buttons.abandon'), type: 'default', icon: 'close', disabled: true, danger: true },
    { key: 'preview', label: $t('experiment.current.buttons.preview'), type: 'default', icon: 'eye', disabled: true },
    { key: 'sync', label: $t('experiment.current.buttons.sync'), type: 'default', icon: 'sync', disabled: true },
    { key: 'back', label: $t('experiment.current.buttons.back'), type: 'primary', icon: 'arrow-left', disabled: true },
    { key: 'credential', label: $t('experiment.current.buttons.credentialGenerate'), type: 'default', icon: 'key', disabled: true },
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
    if (btn) btn.label = hasCredential.value ? $t('experiment.current.buttons.credentialView') : $t('experiment.current.buttons.credentialGenerate');
  };

  // 初始化实验数据，从 localStorage 恢复
  const initializeExperimentData = async () => {
    let storedData = getExperimentFromStorage();
    // 如果从本地userStore中获取到的账户角色是guest，且没有storedData，则使用getExperimentIdByNoApi查询实验ID，存储实验信息到localStorage
    if (!storedData) {
      const role = (userStore.userInfo as any)?.roleCode;
      if (role === 'guest') {
        const experimentIdByNo: any = await getExperimentIdByNoApi({ experimentNo: userStore.userInfo?.username});
        saveExperimentToStorage(userStore.userInfo?.username || '', experimentIdByNo || '', 0);
        storedData = getExperimentFromStorage();
      }
    }

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
          message.success(`${$t('experiment.current.message.restored')} ${storedData.experimentNo}`);
      } catch (error) {
        console.error('恢复实验数据失败:', error);
        // 如果获取失败，清除本地存储避免重复尝试
        clearExperimentFromStorage();
        message.error($t('experiment.current.message.restoreFailed'));
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
            
            message.success($t('experiment.current.message.endSuccess'));
            
            // 跳转到历史记录页面
            router.push('/history');
          } else {
            message.warning($t('experiment.current.message.noExperiment'));
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
            
            message.success($t('experiment.current.message.abandonSuccess'));
            
            // 跳转到历史记录页面
            router.push('/history');
          } else {
            message.warning($t('experiment.current.message.noExperiment'));
          }
        break;
      }
      case 'back': {
        const expId = experimentStore.state.currentExperiment?.id;
        if (!expId) {
          message.warning($t('experiment.current.message.backMissingId'));
        } else {
          await returnStaticCommand({ experimentId: expId });
          message.info($t('experiment.current.message.backCommandSent'));
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
          message.warning($t('experiment.current.message.previewMissingInfo'));
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
          // 执行数据同步队列
          const syncSuccess = await executeSyncQueue();
          
          if (syncSuccess) {
            // 直接使用store中的数据进行同步，简化流程
            console.log('直接使用store中的数据进行同步:', experimentStore.state.currentExperiment);
            await experimentStore.submitExperimentData();
            message.success($t('experiment.current.message.syncSuccess'));
          } else {
            message.error($t('experiment.current.message.collectorSyncFailed'));
          }
        } catch (error) {
          console.error('同步数据失败:', error);
          message.error($t('experiment.current.message.syncFailed'));
        }
        break;
      }
      case 'credential': {
        if (!experimentNo.value) return;
        const expId = experimentStore.state.currentExperiment?.id;
        if (!expId) {
          message.warning($t('experiment.current.message.experimentIdEmpty'));
          break;
        }
        try {
          // 先查询是否已有临时账号
          let fetched: any | null = null;
          try {
            fetched = await getAccessCredentialApi({ username: experimentNo.value });
          } catch (err) {
            fetched = null;
          }

          if (fetched && (fetched.url || fetched.password)) {
            // 已存在临时账号，使用查询到的数据
            accessCredential.value = {
              url: fetched?.url ?? accessCredential.value.url ?? '',
              account: experimentNo.value,
              password: fetched?.password ?? accessCredential.value.password ?? '',
              begin: accessCredential.value.begin ?? 0,
              end: fetched?.end ?? accessCredential.value.end ?? 0,
            };
            hasCredential.value = true;
            setCredentialButtonLabel();
            credentialModalOpen.value = true;
            message.success($t('experiment.current.message.fetchedCredentialSuccess'));
          } else {
            // 不存在则生成新的临时账号
            const res = await generateAccessCredentialApi({ username: experimentNo.value, end: 1 });
            accessCredential.value = {
              url: res?.url ?? '',
              account: experimentNo.value,
              password: res?.password ?? accessCredential.value.password ?? '',
              begin: accessCredential.value.begin ?? 0,
              end: res?.end ?? accessCredential.value.end ?? 0,
            };
            hasCredential.value = true;
            setCredentialButtonLabel();
            credentialModalOpen.value = true;
            message.success($t('experiment.current.message.generatedCredentialSuccess'));
          }
        } catch (e) {
          credentialModalOpen.value = false;
          message.error($t('experiment.current.message.credentialProcessFailed'));
        }
        break;
      }
    }
  };

  const copyCredentialAll = async () => {
    const text = `${$t('experiment.current.credential.addressLabel')}: ${accessCredential.value.url}\n${$t('experiment.current.credential.accountLabel')}: ${accessCredential.value.account}\n${$t('experiment.current.credential.passwordLabel')}: ${accessCredential.value.password}`;
    try {
      await copy(text);
      message.success($t('experiment.current.message.copiedToClipboard'));
    } catch {
      message.error($t('experiment.current.message.copyFailed'));
    }
  };

  const copyText = async (text: string) => {
    try {
      await copy(text);
      message.success($t('experiment.current.message.copied'));
    } catch {
      message.error($t('experiment.current.message.copyFailed'));
    }
  };

  // 统一管理：延长临时访问许可并同步凭证状态
  const extendAccessDuration = async () => {
    try {
      const username = experimentNo.value || accessCredential.value.account;
      if (!username) {
        message.warning($t('experiment.current.message.missingExperimentNo'));
        return;
      }
      await extendUserAccountAccessApi({ username, end: 1 });

      // 续期后重新拉取最新的临时访问凭证
      const fetched = await getAccessCredentialApi({ username });
      // end 为 number，直接使用；展示层会做秒/毫秒处理
      const endTs = typeof fetched?.end === 'number'
        ? fetched.end
        : (typeof accessCredential.value.end === 'number' ? accessCredential.value.end : 0);
      accessCredential.value = {
        url: fetched?.url ?? accessCredential.value.url ?? '',
        account: username,
        password: fetched?.password ?? accessCredential.value.password ?? '',
        begin: accessCredential.value.begin ?? 0,
        end: endTs ?? 0,
      };
      message.success($t('experiment.current.message.extendSuccess'));
    } catch (e) {
      message.error($t('experiment.current.message.extendFailed'));
    }
  };

  const activeTab = ref('environment');
  const activeMonitorTab = ref('realtime');

  const experimentTabs = [
    { key: 'environment', label: $t('experiment.current.tabs.environment') },
    { key: 'appearance', label: $t('experiment.current.tabs.appearance') },
    { key: 'cold-insulation', label: $t('experiment.current.tabs.coldInsulation') },
    { key: 'startup', label: $t('experiment.current.tabs.startup') },
    { key: 'operation', label: $t('experiment.current.tabs.operation') },
    { key: 'protection', label: $t('experiment.current.tabs.protection') },
    { key: 'comprehensive', label: $t('experiment.current.tabs.comprehensive') },
    // { key: 'load', label: $t('experiment.current.tabs.load') },
    // { key: 'steady', label: $t('experiment.current.tabs.steady') },
    // { key: 'fluctuation', label: $t('experiment.current.tabs.fluctuation') },
    { key: 'transient', label: $t('experiment.current.tabs.transient') },
    { key: 'hot-insulation', label: $t('experiment.current.tabs.hotInsulation') },
  ];

  const monitorTabs = [
    { key: 'realtime', label: $t('experiment.current.monitorTabs.realtime') },
    { key: 'monitoring', label: $t('experiment.current.monitorTabs.monitoring') },
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
    extendAccessDuration,
  };
}