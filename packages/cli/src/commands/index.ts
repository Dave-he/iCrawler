import { IcrawlerWorkflowExecute } from '@icrawler/core';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

/**
 * 创建新工作流
 */
export async function createWorkflow(name: string, template?: string) {
  const spinner = ora('Creating workflow...').start();

  try {
    const workflowDir = join(process.cwd(), 'workflows');
    const workflowFile = join(workflowDir, `${name}.json`);

    // 确保目录存在
    if (!existsSync(workflowDir)) {
      const fs = await import('fs').then(m => m.promises);
      await fs.mkdir(workflowDir, { recursive: true });
    }

    // 创建基础工作流结构
    const workflow = {
      name,
      description: `Workflow: ${name}`,
      nodes: [
        {
          id: '1',
          type: 'browserAction',
          position: { x: 100, y: 100 },
          data: {
            label: 'Start',
            action: 'navigate',
            url: 'https://example.com'
          }
        }
      ],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    writeFileSync(workflowFile, JSON.stringify(workflow, null, 2));
    
    spinner.succeed(`Workflow created: ${chalk.green(name)}`);
    console.log(`Location: ${chalk.cyan(workflowFile)}`);

  } catch (error) {
    spinner.fail(`Failed to create workflow: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 执行工作流
 */
export async function executeWorkflow(workflowId: string, inputData?: string, verbose = false) {
  const spinner = ora(`Executing workflow: ${workflowId}`).start();

  try {
    // 读取工作流文件
    let workflowData;
    const workflowFile = existsSync(`${workflowId}.json`) 
      ? `${workflowId}.json` 
      : join(process.cwd(), 'workflows', `${workflowId}.json`);

    if (existsSync(workflowFile)) {
      workflowData = JSON.parse(readFileSync(workflowFile, 'utf8'));
    } else {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // 解析输入数据
    let data = {};
    if (inputData) {
      try {
        data = JSON.parse(inputData);
      } catch (error) {
        throw new Error(`Invalid JSON data: ${error.message}`);
      }
    }

    // 创建工作流执行器
    const workflowExecute = new IcrawlerWorkflowExecute(
      {
        userId: 'cli-user',
        executionId: `cli-${Date.now()}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        mode: 'cli',
        retryOf: undefined,
        resumeData: undefined,
        additionalData: {
          secrets: {},
          executionTimeoutTimestamp: undefined,
          executionTimeout: undefined,
          startTime: Date.now(),
          restoreData: undefined,
          restartExecutionId: undefined,
          resumeExecutionId: undefined,
          resumeExecutionData: undefined,
          resumeExecutionMode: undefined,
          resumeExecutionWorkflowId: undefined,
          resumeExecutionUserId: undefined,
          resumeExecutionWebhookData: undefined,
          resumeExecutionWebhookResponse: undefined,
          resumeExecutionWebhookStatus: undefined,
          resumeExecutionWebhookHeaders: undefined,
          resumeExecutionWebhookMethod: undefined,
          resumeExecutionWebhookPath: undefined,
          resumeExecutionWebhookQuery: undefined,
          resumeExecutionWebhookBody: undefined,
          resumeExecutionWebhookParams: undefined,
          resumeExecutionWebhookHeadersRaw: undefined,
          resumeExecutionWebhookBodyRaw: undefined,
          resumeExecutionWebhookQueryRaw: undefined,
          resumeExecutionWebhookParamsRaw: undefined,
          resumeExecutionWebhookHeadersParsed: undefined,
          resumeExecutionWebhookBodyParsed: undefined,
          resumeExecutionWebhookQueryParsed: undefined,
          resumeExecutionWebhookParamsParsed: undefined,
        }
      },
      'cli'
    );

    // 执行工作流
    const result = await workflowExecute.executeWorkflow(workflowData, { data });

    spinner.succeed(`Workflow executed successfully`);
    
    if (verbose) {
      console.log(chalk.blue('Execution result:'));
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    spinner.fail(`Workflow execution failed: ${error.message}`);
    if (verbose) {
      console.error(chalk.red(error.stack));
    }
    process.exit(1);
  }
}

/**
 * 列出工作流
 */
export async function listWorkflows() {
  const spinner = ora('Listing workflows...').start();

  try {
    const workflowDir = join(process.cwd(), 'workflows');
    
    if (!existsSync(workflowDir)) {
      spinner.info('No workflows found. Create one with: icrawler create <name>');
      return;
    }

    const fs = await import('fs').then(m => m.promises);
    const files = await fs.readdir(workflowDir);
    const workflowFiles = files.filter(file => file.endsWith('.json'));

    if (workflowFiles.length === 0) {
      spinner.info('No workflows found. Create one with: icrawler create <name>');
      return;
    }

    spinner.succeed(`Found ${workflowFiles.length} workflow(s)`);

    for (const file of workflowFiles) {
      const filePath = join(workflowDir, file);
      const content = readFileSync(filePath, 'utf8');
      const workflow = JSON.parse(content);
      
      console.log(`  ${chalk.cyan(workflow.name)} (${file})`);
      if (workflow.description) {
        console.log(`    ${chalk.gray(workflow.description)}`);
      }
    }

  } catch (error) {
    spinner.fail(`Failed to list workflows: ${error.message}`);
    process.exit(1);
  }
}