#!/usr/bin/env node

/**
 * Node.js 版本检查脚本
 * 确保项目在支持的 Node.js 版本下运行
 */

const { execSync } = require('child_process');
const path = require('path');

const requiredNodeVersion = '24.12.0';
const currentNodeVersion = process.version;

function parseVersion(version) {
  const match = version.match(/^v(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

function compareVersions(v1, v2) {
  if (v1.major !== v2.major) {
    return v1.major - v2.major;
  }
  if (v1.minor !== v2.minor) {
    return v1.minor - v2.minor;
  }
  return v1.patch - v2.patch;
}

function checkNodeVersion() {
  const current = parseVersion(currentNodeVersion);
  const required = parseVersion(requiredNodeVersion);
  
  if (!current || !required) {
    console.error('❌ 无法解析 Node.js 版本');
    process.exit(1);
  }
  
  const comparison = compareVersions(current, required);
  
  if (comparison >= 0) {
    console.log(`✅ Node.js 版本检查通过: ${currentNodeVersion} (要求 >= ${requiredNodeVersion})`);
    return true;
  } else {
    console.error(`❌ Node.js 版本过低: ${currentNodeVersion}`);
    console.error(`   要求版本: >= ${requiredNodeVersion}`);
    console.error('');
    console.error('请升级 Node.js 到 v24.12.0 或更高版本:');
    console.error('  - 使用 nvm: nvm install 24.12.0 && nvm use 24.12.0');
    console.error('  - 使用 fnm: fnm install 24.12.0 && fnm use 24.12.0');
    console.error('  - 直接下载: https://nodejs.org/');
    process.exit(1);
  }
}

function checkPackageManager() {
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ pnpm 版本: ${pnpmVersion}`);
    
    // 检查 pnpm 版本
    const pnpmRequired = '10.22.0';
    const currentPnpm = parseVersion(`v${pnpmVersion}`);
    const requiredPnpm = parseVersion(`v${pnpmRequired}`);
    
    if (compareVersions(currentPnpm, requiredPnpm) >= 0) {
      console.log(`✅ pnpm 版本检查通过: ${pnpmVersion} (要求 >= ${pnpmRequired})`);
    } else {
      console.warn(`⚠️  pnpm 版本可能过低: ${pnpmVersion} (建议 >= ${pnpmRequired})`);
    }
  } catch (error) {
    console.error('❌ 未找到 pnpm，请先安装:');
    console.error('  npm install -g pnpm');
    process.exit(1);
  }
}

function createNvmrc() {
  const nvmrcPath = path.join(process.cwd(), '.nvmrc');
  const fs = require('fs');
  
  try {
    fs.writeFileSync(nvmrcPath, requiredNodeVersion);
    console.log(`✅ 创建 .nvmrc 文件: ${requiredNodeVersion}`);
  } catch (error) {
    console.warn(`⚠️  无法创建 .nvmrc 文件: ${error.message}`);
  }
}

// 主函数
function main() {
  console.log('🔍 检查 Node.js 环境...');
  console.log('');
  
  checkNodeVersion();
  checkPackageManager();
  createNvmrc();
  
  console.log('');
  console.log('🎉 环境检查完成！可以开始开发了。');
}

if (require.main === module) {
  main();
}

module.exports = { checkNodeVersion, checkPackageManager };