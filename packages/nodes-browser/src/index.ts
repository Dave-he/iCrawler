import { BrowserAction } from './nodes/BrowserAction.node';
import { ElementExists } from './nodes/ElementExists.node';

// 导出所有浏览器自动化节点
export const browserNodes = [
  BrowserAction,
  ElementExists,
];

// 节点类型映射
export const nodeTypeMap = {
  browserAction: BrowserAction,
  elementExists: ElementExists,
};

export * from './nodes/BrowserAction.node';
export * from './nodes/ElementExists.node';