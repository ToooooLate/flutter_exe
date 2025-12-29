<script setup lang="ts">
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import { downloadFileFromBlob } from '@vben/utils';
import { message } from 'ant-design-vue';

import { $t } from '#/locales';
import { downloadVideoApi, getVideoDownloadUrlApi } from '#/api/core';

interface VideoFileItem {
  fileName: string;
  fileSize: string;
  relativePath: string;
}

const videoList = ref<VideoFileItem[]>([]);
const videoLoading = ref(false);
const downloadingVideoName = ref<string | null>(null);
const accessStore = useAccessStore();

const [Modal, modalApi] = useVbenModal({
  title: $t('page.history.operation.downloadVideo'),
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const data = modalApi.getData<{ experimentNo?: string } | undefined>();
    const experimentNo = String(data?.experimentNo ?? '');
    if (!experimentNo) {
      message.warning($t('page.history.message.missingExperimentIdOrNo'));
      modalApi.close();
      return;
    }
    videoLoading.value = true;
    try {
      const res = await getVideoDownloadUrlApi({ experimentNo });
      const list = (res ?? []) as VideoFileItem[];
      videoList.value = Array.isArray(list) ? list : [];
      if (!videoList.value.length) {
        message.info($t('page.history.message.noVideoToDownload'));
      }
    } catch (error) {
      console.error('获取视频列表失败:', error);
      message.error($t('page.history.message.fetchVideoListFailed'));
      modalApi.close();
    } finally {
      videoLoading.value = false;
    }
  },
});

const handleDownloadVideoFile = async (item: VideoFileItem) => {
  if (!item.fileName) return;

  // 检查是否在 Flutter 桌面端环境
  if ((window as any).DownloadBridge) {
    const query = new URLSearchParams({
      fileName: item.relativePath || item.fileName,
    }).toString();
    const url = `${window.location.origin}/api/sg/video/download?${query}`;
    const token = accessStore.accessToken;
    const payload = {
      type: 'url',
      url,
      fileName: item.fileName,
      headers: {
        'sg-Token': token || '',
      },
    };
    try {
      (window as any).DownloadBridge.postMessage(JSON.stringify(payload));
      message.success($t('common.downloading'));
    } catch (e) {
      console.error('Bridge download failed', e);
      message.error($t('page.history.message.downloadVideoFailed'));
    }
    return;
  }

  downloadingVideoName.value = item.fileName;
  try {
    const blob = (await downloadVideoApi({
      fileName: item.relativePath || item.fileName,
    })) as Blob;
    downloadFileFromBlob({
      fileName: item.fileName,
      source: blob,
    });
  } catch (error) {
    console.error('下载视频失败:', error);
    message.error($t('page.history.message.downloadVideoFailed'));
  } finally {
    downloadingVideoName.value = null;
  }
};
</script>

<template>
  <Modal class="w-[640px]">
    <div class="space-y-4">
      <div
        v-if="videoLoading"
        class="flex items-center justify-center py-6 text-gray-500"
      >
        {{ $t('page.history.videoModal.loading') }}
      </div>
      <div
        v-else-if="!videoList.length"
        class="flex items-center justify-center py-6 text-gray-500"
      >
        {{ $t('page.history.videoModal.empty') }}
      </div>
      <div v-else class="max-h-96 overflow-y-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b">
              <th class="px-3 py-2 text-left">
                {{ $t('page.history.videoModal.table.fileName') }}
              </th>
              <th class="px-3 py-2 text-left">
                {{ $t('page.history.videoModal.table.fileSize') }}
              </th>
              <th class="px-3 py-2 text-right">
                {{ $t('page.history.videoModal.table.actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in videoList"
              :key="item.relativePath || item.fileName"
              class="border-b last:border-b-0"
            >
              <td class="break-all px-3 py-2">
                {{ item.fileName }}
              </td>
              <td class="whitespace-nowrap px-3 py-2">
                {{ item.fileSize }}
              </td>
              <td class="px-3 py-2 text-right">
                <button
                  type="button"
                  class="text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="downloadingVideoName === item.fileName"
                  @click="handleDownloadVideoFile(item)"
                >
                  {{
                    downloadingVideoName === item.fileName
                      ? $t('page.history.videoModal.action.downloading')
                      : $t('page.history.videoModal.action.download')
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Modal>
</template>
