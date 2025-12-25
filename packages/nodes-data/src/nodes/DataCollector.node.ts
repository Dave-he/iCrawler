import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { BrowserWorkflowService } from '@icrawler/core';

/**
 * 数据收集节点
 * 从页面中提取和收集结构化数据
 */
export class DataCollector implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Data Collector',
    name: 'dataCollector',
    group: ['browser'],
    version: 1,
    description: 'Extract and collect structured data from the page',
    defaults: {
      name: 'Data Collector',
      color: '#3498DB',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Collection Mode',
        name: 'collectionMode',
        type: 'options',
        options: [
          {
            name: 'Single Element',
            value: 'single',
            description: 'Extract data from a single element',
          },
          {
            name: 'Multiple Elements',
            value: 'multiple',
            description: 'Extract data from multiple elements',
          },
          {
            name: 'Table',
            value: 'table',
            description: 'Extract data from a table',
          },
          {
            name: 'Custom Schema',
            value: 'schema',
            description: 'Extract data using a custom schema',
          },
        ],
        default: 'single',
      },
      {
        displayName: 'Root Selector',
        name: 'rootSelector',
        type: 'string',
        displayOptions: {
          show: {
            collectionMode: ['single', 'multiple', 'table'],
          },
        },
        placeholder: '.container',
        default: '',
        description: 'CSS selector for the root element(s)',
      },
      {
        displayName: 'Data Schema',
        name: 'dataSchema',
        type: 'json',
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        placeholder: `{
  "title": ".title",
  "price": ".price",
  "description": ".description",
  "image": {
    "selector": "img",
    "attribute": "src"
  }
}`,
        default: '{}',
        description: 'JSON schema defining how to extract data',
        required: true,
      },
      {
        displayName: 'Max Items',
        name: 'maxItems',
        type: 'number',
        displayOptions: {
          show: {
            collectionMode: ['multiple'],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 10000,
        },
        default: 100,
        description: 'Maximum number of items to collect',
      },
      {
        displayName: 'Include Metadata',
        name: 'includeMetadata',
        type: 'boolean',
        default: false,
        description: 'Whether to include metadata (timestamp, URL, etc.)',
      },
      {
        displayName: 'Clean Data',
        name: 'cleanData',
        type: 'boolean',
        default: true,
        description: 'Whether to trim whitespace and clean extracted data',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const browserService = new BrowserWorkflowService(this.getWorkflowData());

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const collectionMode = this.getNodeParameter('collectionMode', itemIndex) as string;
        const dataSchemaStr = this.getNodeParameter('dataSchema', itemIndex) as string;
        const includeMetadata = this.getNodeParameter('includeMetadata', itemIndex) as boolean;
        const cleanData = this.getNodeParameter('cleanData', itemIndex) as boolean;

        const dataSchema = JSON.parse(dataSchemaStr);
        const page = await browserService.getCurrentPage();

        let collectedData: any[] = [];

        switch (collectionMode) {
          case 'single': {
            const rootSelector = this.getNodeParameter('rootSelector', itemIndex) as string;
            const data = await this.extractDataFromElement(page, rootSelector, dataSchema, cleanData);
            collectedData = [data];
            break;
          }

          case 'multiple': {
            const rootSelector = this.getNodeParameter('rootSelector', itemIndex) as string;
            const maxItems = this.getNodeParameter('maxItems', itemIndex) as number;

            const elements = await page.$$(rootSelector);
            const elementsToProcess = elements.slice(0, maxItems);

            for (const element of elementsToProcess) {
              const data = await element.evaluate((el, schema, clean) => {
                return this.extractDataFromSchema(el, schema, clean);
              }, dataSchema, cleanData);
              collectedData.push(data);
            }
            break;
          }

          case 'table': {
            const rootSelector = this.getNodeParameter('rootSelector', itemIndex) as string;
            collectedData = await page.evaluate((selector) => {
              const table = document.querySelector(selector) as HTMLTableElement;
              if (!table) return [];

              const rows = Array.from(table.querySelectorAll('tr'));
              const headers = Array.from(rows[0]?.querySelectorAll('th, td') || [])
                .map(th => th.textContent?.trim() || '');

              return rows.slice(1).map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                const rowData: any = {};
                cells.forEach((cell, index) => {
                  const header = headers[index] || `column_${index}`;
                  rowData[header] = cell.textContent?.trim() || '';
                });
                return rowData;
              });
            }, rootSelector);
            break;
          }

          case 'schema': {
            collectedData = await page.evaluate((schema, clean) => {
              const extractValue = (element: Element, config: any): any => {
                if (typeof config === 'string') {
                  const el = element.querySelector(config);
                  return clean ? el?.textContent?.trim() : el?.textContent;
                }

                if (typeof config === 'object' && config.selector) {
                  const el = element.querySelector(config.selector);
                  if (config.attribute) {
                    return el?.getAttribute(config.attribute);
                  }
                  return clean ? el?.textContent?.trim() : el?.textContent;
                }

                return null;
              };

              const result: any = {};
              for (const [key, value] of Object.entries(schema)) {
                result[key] = extractValue(document.body, value);
              }
              return [result];
            }, dataSchema, cleanData);
            break;
          }

          default:
            throw new NodeOperationError(this.getNode(), `Unknown collection mode: ${collectionMode}`);
        }

        // 添加元数据
        if (includeMetadata) {
          const currentUrl = await browserService.getCurrentUrl();
          collectedData = collectedData.map(item => ({
            ...item,
            _metadata: {
              url: currentUrl,
              timestamp: new Date().toISOString(),
              collectionMode,
            },
          }));
        }

        returnData.push({
          json: {
            ...items[itemIndex].json,
            collectedData,
            totalItems: collectedData.length,
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
   * 从元素中提取数据
   */
  private async extractDataFromElement(
    page: any,
    selector: string,
    schema: any,
    cleanData: boolean
  ): Promise<any> {
    return await page.evaluate(
      (sel: string, sch: any, clean: boolean) => {
        const element = document.querySelector(sel);
        if (!element) return null;

        const extractValue = (el: Element, config: any): any => {
          if (typeof config === 'string') {
            const targetEl = el.querySelector(config);
            return clean ? targetEl?.textContent?.trim() : targetEl?.textContent;
          }

          if (typeof config === 'object' && config.selector) {
            const targetEl = el.querySelector(config.selector);
            if (config.attribute) {
              return targetEl?.getAttribute(config.attribute);
            }
            return clean ? targetEl?.textContent?.trim() : targetEl?.textContent;
          }

          return null;
        };

        const result: any = {};
        for (const [key, value] of Object.entries(sch)) {
          result[key] = extractValue(element, value);
        }
        return result;
      },
      selector,
      schema,
      cleanData
    );
  }
}
