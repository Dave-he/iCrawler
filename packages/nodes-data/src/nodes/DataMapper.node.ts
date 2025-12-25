import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * 数据映射节点
 * 将输入数据映射到新的结构
 */
export class DataMapper implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Data Mapper',
    name: 'dataMapper',
    group: ['transform'],
    version: 1,
    description: 'Transform and map data to new structure',
    defaults: {
      name: 'Data Mapper',
      color: '#7722CC',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Mapping Rules',
        name: 'mappingRules',
        type: 'json',
        default: '{}',
        description: 'JSON mapping rules to transform data',
      },
      {
        displayName: 'Keep Original Data',
        name: 'keepOriginal',
        type: 'boolean',
        default: false,
        description: 'Keep original data in output',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const mappingRules = this.getNodeParameter('mappingRules', 0) as any;
    const keepOriginal = this.getNodeParameter('keepOriginal', 0) as boolean;

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const inputData = items[itemIndex].json;
        const mappedData = this.applyMapping(inputData, mappingRules, keepOriginal);

        returnData.push({
          json: mappedData,
          pairedItem: {
            item: itemIndex,
          },
        });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              ...items[itemIndex].json,
              error: error.message,
              mappingError: true,
            },
            pairedItem: {
              item: itemIndex,
            },
          });
        } else {
          throw error;
        }
      }
    }

    return this.prepareOutputData(returnData);
  }

  /**
   * 应用映射规则
   */
  private applyMapping(inputData: any, mappingRules: any, keepOriginal: boolean): any {
    const result: any = keepOriginal ? { ...inputData } : {};

    if (typeof mappingRules !== 'object' || mappingRules === null) {
      return result;
    }

    Object.entries(mappingRules).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // 简单路径映射
        const mappedValue = this.getNestedValue(inputData, value);
        if (mappedValue !== undefined) {
          result[key] = mappedValue;
        }
      } else if (typeof value === 'object' && value !== null) {
        // 复杂映射规则
        result[key] = this.applyComplexMapping(inputData, value);
      } else {
        // 直接赋值
        result[key] = value;
      }
    });

    return result;
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * 应用复杂映射规则
   */
  private applyComplexMapping(inputData: any, rule: any): any {
    if (rule.source) {
      const value = this.getNestedValue(inputData, rule.source);
      
      if (rule.transform && typeof rule.transform === 'string') {
        // 简单转换
        return this.transformValue(value, rule.transform);
      }
      
      return value;
    }
    
    return rule;
  }

  /**
   * 转换值
   */
  private transformValue(value: any, transform: string): any {
    switch (transform) {
      case 'toUpperCase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'toLowerCase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'parseInt':
        return parseInt(value, 10);
      case 'parseFloat':
        return parseFloat(value);
      default:
        return value;
    }
  }
}