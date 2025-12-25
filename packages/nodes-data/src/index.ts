import { DataMapper } from './nodes/DataMapper.node';
import { DataCollector } from './nodes/DataCollector.node';
import { ExportData } from './nodes/ExportData.node';

// 导出所有数据处理节点
export const dataNodes = [
  DataMapper,
  DataCollector,
  ExportData,
];

// 节点类型映射
export const nodeTypeMap = {
  dataMapper: DataMapper,
  dataCollector: DataCollector,
  exportData: ExportData,
};

export * from './nodes/DataMapper.node';
export * from './nodes/DataCollector.node';
export * from './nodes/ExportData.node';