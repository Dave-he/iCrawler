#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createWorkflow, executeWorkflow, listWorkflows } from './commands';

const program = new Command();

program
  .name('icrawler')
  .description('Browser automation workflow engine')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new workflow')
  .argument('<name>', 'Workflow name')
  .option('-t, --template <template>', 'Template to use')
  .action(async (name, options) => {
    console.log(chalk.blue(`Creating workflow: ${name}`));
    await createWorkflow(name, options.template);
  });

program
  .command('execute')
  .description('Execute a workflow')
  .argument('<workflow>', 'Workflow file or ID')
  .option('-d, --data <data>', 'Input data (JSON)')
  .option('-v, --verbose', 'Verbose output')
  .action(async (workflow, options) => {
    console.log(chalk.blue(`Executing workflow: ${workflow}`));
    await executeWorkflow(workflow, options.data, options.verbose);
  });

program
  .command('list')
  .description('List available workflows')
  .action(async () => {
    console.log(chalk.blue('Listing workflows...'));
    await listWorkflows();
  });

program
  .command('server')
  .description('Start the iCrawler server')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .option('-h, --host <host>', 'Host to listen on', 'localhost')
  .action((options) => {
    console.log(chalk.blue(`Starting server on ${options.host}:${options.port}`));
    // 启动服务器逻辑
  });

program.parse();