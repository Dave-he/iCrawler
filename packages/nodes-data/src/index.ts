import { DataMapper } from './nodes/DataMapper.node';

// 导出所有数据处理节点
export const dataNodes = [
  DataMapper,
];

// 节点类型映射
export const nodeTypeMap = {
  dataMapper: DataMapper,
};

export * from './nodes/DataMapper.node';