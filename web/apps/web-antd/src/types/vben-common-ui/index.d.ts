// 本地类型桩：为 @vben/common-ui 提供最小化声明，满足当前页面类型检查
declare module '@vben/common-ui' {
  export const Page: any;
  export function useVbenForm(...args: any[]): any[];
  export type VbenFormSchema = any;
  export function useVbenModal(
    ...args: any[]
  ): [
    any,
    {
      open?: (args?: any) => void;
      close?: () => void;
      setState?: (state: any) => void;
      /** 兼容示例中的数据传递写法 */
      setData?: (data: any) => any;
      getData?: () => any;
    }
  ];
}

// 兜底：如果子路径被引用
declare module '@vben/*' {
  const anyExport: any;
  export default anyExport;
}