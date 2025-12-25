import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 数据导出节点
 * 将数据导出为各种格式（JSON、CSV、TXT等）
 */
export class ExportData implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Export Data',
    name: 'exportData',
    group: ['output'],
    version: 1,
    description: 'Export data to various formats (JSON, CSV, TXT)',
    defaults: {
      name: 'Export Data',
      color: '#2ECC71',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Export Format',
        name: 'format',
        type: 'options',
        options: [
          {
            name: 'JSON',
            value: 'json',
            description: 'Export as JSON file',
          },
          {
            name: 'CSV',
            value: 'csv',
            description: 'Export as CSV file',
          },
          {
            name: 'TXT',
            value: 'txt',
            description: 'Export as plain text file',
          },
          {
            name: 'JSONL',
            value: 'jsonl',
            description: 'Export as JSON Lines (one JSON object per line)',
          },
        ],
        default: 'json',
      },
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        placeholder: '/path/to/output.json',
        default: '',
        description: 'Full path where the file should be saved',
        required: true,
      },
      {
        displayName: 'Data Field',
        name: 'dataField',
        type: 'string',
        placeholder: 'collectedData',
        default: '',
        description: 'Field name containing the data to export (leave empty to export entire item)',
      },
      {
        displayName: 'Pretty Print',
        name: 'prettyPrint',
        type: 'boolean',
        displayOptions: {
          show: {
            format: ['json'],
          },
        },
        default: true,
        description: 'Whether to format JSON with indentation',
      },
      {
        displayName: 'CSV Delimiter',
        name: 'csvDelimiter',
        type: 'options',
        displayOptions: {
          show: {
            format: ['csv'],
          },
        },
        options: [
          {
            name: 'Comma (,)',
            value: ',',
          },
          {
            name: 'Semicolon (;)',
            value: ';',
          },
          {
            name: 'Tab',
            value: '\t',
          },
          {
            name: 'Pipe (|)',
            value: '|',
          },
        ],
        default: ',',
        description: 'Delimiter to use for CSV files',
      },
      {
        displayName: 'Include Headers',
        name: 'includeHeaders',
        type: 'boolean',
        displayOptions: {
          show: {
            format: ['csv'],
          },
        },
        default: true,
        description: 'Whether to include column headers in CSV',
      },
      {
        displayName: 'Append Mode',
        name: 'appendMode',
        type: 'boolean',
        default: false,
        description: 'Whether to append to existing file instead of overwriting',
      },
      {
        displayName: 'Create Directory',
        name: 'createDirectory',
        type: 'boolean',
        default: true,
        description: 'Whether to create the directory if it doesn\'t exist',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const format = this.getNodeParameter('format', itemIndex) as string;
        const filePath = this.getNodeParameter('filePath', itemIndex) as string;
        const dataField = this.getNodeParameter('dataField', itemIndex) as string;
        const appendMode = this.getNodeParameter('appendMode', itemIndex) as boolean;
        const createDirectory = this.getNodeParameter('createDirectory', itemIndex) as boolean;

        if (!filePath) {
          throw new NodeOperationError(this.getNode(), 'File path is required');
        }

        // 获取要导出的数据
        let dataToExport: any;
        if (dataField) {
          dataToExport = items[itemIndex].json[dataField];
          if (!dataToExport) {
            throw new NodeOperationError(
              this.getNode(),
              `Field "${dataField}" not found in input data`
            );
          }
        } else {
          dataToExport = items[itemIndex].json;
        }

        // 确保数据是数组格式（用于CSV和JSONL）
        const dataArray = Array.isArray(dataToExport) ? dataToExport : [dataToExport];

        // 创建目录（如果需要）
        if (createDirectory) {
          const directory = path.dirname(filePath);
          await fs.mkdir(directory, { recursive: true });
        }

        let content: string;

        switch (format) {
          case 'json': {
            const prettyPrint = this.getNodeParameter('prettyPrint', itemIndex) as boolean;
            content = prettyPrint
              ? JSON.stringify(dataToExport, null, 2)
              : JSON.stringify(dataToExport);
            break;
          }

          case 'csv': {
            const delimiter = this.getNodeParameter('csvDelimiter', itemIndex) as string;
            const includeHeaders = this.getNodeParameter('includeHeaders', itemIndex) as boolean;
            content = this.convertToCSV(dataArray, delimiter, includeHeaders);
            break;
          }

          case 'jsonl': {
            content = dataArray.map(item => JSON.stringify(item)).join('\n');
            break;
          }

          case 'txt': {
            content = typeof dataToExport === 'string'
              ? dataToExport
              : JSON.stringify(dataToExport, null, 2);
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Unknown format: ${format}`);
        }

        // 写入文件
        if (appendMode) {
          await fs.appendFile(filePath, content + '\n', 'utf-8');
        } else {
          await fs.writeFile(filePath, content, 'utf-8');
        }

        const stats = await fs.stat(filePath);

        returnData.push({
          json: {
            ...items[itemIndex].json,
            exportResult: {
              success: true,
              filePath,
              format,
              size: stats.size,
              itemsExported: dataArray.length,
              appendMode,
            },
          },
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
              exportResult: {
                success: false,
              },
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
   * 将数据转换为CSV格式
   */
  private convertToCSV(data: any[], delimiter: string, includeHeaders: boolean): string {
    if (data.length === 0) {
      return '';
    }

    // 获取所有唯一的键作为列
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });
    const headers = Array.from(allKeys);

    const lines: string[] = [];

    // 添加标题行
    if (includeHeaders) {
      lines.push(headers.map(h => this.escapeCSVValue(h, delimiter)).join(delimiter));
    }

    // 添加数据行
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        return this.escapeCSVValue(value, delimiter);
      });
      lines.push(row.join(delimiter));
    });

    return lines.join('\n');
  }

  /**
   * 转义CSV值
   */
  private escapeCSVValue(value: any, delimiter: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // 如果值包含分隔符、引号或换行符，需要用引号包裹并转义内部引号
    if (
      stringValue.includes(delimiter) ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }
}
