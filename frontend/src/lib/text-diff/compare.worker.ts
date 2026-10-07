import { compare, type CompareOptions } from './compare';
self.onmessage = (event: MessageEvent<{ left: string; right: string; options: CompareOptions }>) => {
  try { self.postMessage({ result: compare(event.data.left, event.data.right, event.data.options) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : '比较失败，请重试。' }); }
};
