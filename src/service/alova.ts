/*
 * @Author: hhr
 * @Date: 2026-04-28 15:33:44
 * @LastEditTime: 2026-04-29 18:24:06
 * @LastEditors: hhr
 * @Description: 文件描述
 * @FilePath: \ids-gis-web\src\service\alova.ts
 */
import { createAlova } from 'alova';
import VueHook from 'alova/vue';
import adapterFetch from 'alova/fetch';
import { createAlovaMockAdapter } from '@alova/mock';
import router from '@/router';
import { ElMessage } from 'element-plus';
import { appEnv } from '@/config/env';
// import { parseFrappeErrorBody } from '@/utils/frappeError';

const baseURL = appEnv.apiBaseUrl;

let requestAdapter: any;
if (appEnv.useMock) {
  const mockFiles = import.meta.glob('./mock/**/*.ts', { eager: true });
  const mockGroups: any[] = Object.values(mockFiles).flatMap((module: any) => [
    ...(module.default ? [module.default] : []),
    ...Object.keys(module).filter(k => k !== 'default').map(k => module[k])
  ]);

  requestAdapter = mockGroups.length
    ? createAlovaMockAdapter(mockGroups, {
        delay: 500,
        httpAdapter: adapterFetch(),
        enable: true
      })
    : adapterFetch();
} else {
  requestAdapter = adapterFetch();
}

export const alovaInstance = createAlova({
  baseURL,
  statesHook: VueHook,
  requestAdapter,
  cacheLogger: false,
  async beforeRequest(method) {
    // (method.config as any).credentials = 'include';
    const token = localStorage.getItem('token');
    if (token) {
      method.config.headers['Authorization'] = `Bearer ${token}`;
    }
  },
  responded: {
    onSuccess: async (response) => {
      if (response instanceof Response) {
        // const { createAppError, getDisplayMessage } = await import('@/utils/errorCenter');
        let json: any;
        try {
          const text = await response.text();
          if (!text.trim()) throw new SyntaxError('Empty response');
          json = JSON.parse(text);
        } catch (_) {
          // throw createAppError('INVALID_RESPONSE', 'Server returned invalid or empty response.');
        }
        if (response.status === 401) {
          // ElMessage.error(getDisplayMessage({ code: 'UNAUTHORIZED' }));
          localStorage.removeItem('token');
          router.push('/login');
          // throw createAppError('UNAUTHORIZED');
        }
        if (!response.ok) {
          // throw createAppError('REQUEST_FAILED', parseFrappeErrorBody(json));
        }
        return json;
      }
      return response;
    },
    onError: async (err) => {
      // const { getDisplayMessage } = await import('@/utils/errorCenter');
      const status = err?.status ?? err?.response?.status;
      const msg = err?.message;
      
      ElMessage.error(msg);
      
      if (status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
      throw err;
    }
  }
});
