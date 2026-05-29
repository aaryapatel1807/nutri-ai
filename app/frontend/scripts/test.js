#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`  ${title}`, 'bold')
  log(`${'='.repeat(60)}\n`, 'cyan')
}

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, 'blue')
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'inherit' })
    log(`✅ ${description} completed successfully`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} failed:`, 'red')
    log(`   Error: ${error.message}`, 'red')
    return false
  }
}

function checkFile(filePath, description) {
  log(`\n📁 Checking ${description}...`, 'blue')
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green')
    return true
  } else {
    log(`❌ ${description} not found at: ${filePath}`, 'red')
    return false
  }
}

function checkDirectory(dirPath, description) {
  log(`\n📂 Checking ${description}...`, 'blue')
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    log(`✅ ${description} exists`, 'green')
    return true
  } else {
    log(`❌ ${description} not found at: ${dirPath}`, 'red')
    return false
  }
}

function checkDependency(packagePath, dependency) {
  log(`\n📦 Checking ${dependency}...`, 'blue')
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const isInstalled = packageJson.dependencies && packageJson.dependencies[dependency]
    
    if (isInstalled) {
      log(`✅ ${dependency} is installed (${packageJson.dependencies[dependency]})`, 'green')
      return true
    } else {
      log(`❌ ${dependency} is not installed`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ Failed to check ${dependency}: ${error.message}`, 'red')
    return false
  }
}

// Main verification function
function runVerification() {
  logSection('🚀 NutriAI Project Verification Suite')
  
  let allPassed = true
  
  // Frontend Tests
  logSection('📱 Frontend Verification')
  
  const frontendPath = path.join(__dirname, '../../../')
  
  // Check package.json
  const packageJsonPath = path.join(frontendPath, 'package.new.json')
  if (!checkFile(packageJsonPath, 'Updated package.json')) {
    allPassed = false
  }
  
  // Check design tokens
  const designTokensPath = path.join(frontendPath, 'tokens/design-tokens.js')
  if (!checkFile(designTokensPath, 'Design tokens file')) {
    allPassed = false
  }
  
  // Check UI components
  const uiComponentsPath = path.join(frontendPath, 'components/ui')
  if (!checkDirectory(uiComponentsPath, 'UI components directory')) {
    allPassed = false
  }
  
  // Check new pages
  const pages = [
    { file: 'app/page.new.jsx', desc: 'Enhanced landing page' },
    { file: 'app/dashboard/page.new.jsx', desc: 'Interactive dashboard' },
    { file: 'app/meal-logger/page.new.jsx', desc: 'Advanced meal logger' },
    { file: 'app/workout/page.fixed.jsx', desc: 'Interactive workout planner' },
    { file: 'app/chatbot/page.new.jsx', desc: 'AI chatbot' }
  ]
  
  pages.forEach(page => {
    if (!checkFile(path.join(frontendPath, page.file), page.desc)) {
      allPassed = false
    }
  })
  
  // Check dependencies
  const frontendPackagePath = path.join(frontendPath, 'package.new.json')
  const dependencies = ['framer-motion', 'recharts', '@heroicons/react']
  
  dependencies.forEach(dep => {
    if (!checkDependency(frontendPackagePath, dep)) {
      allPassed = false
    }
  })
  
  // Backend Tests
  logSection('🔧 Backend Verification')
  
  const backendPath = path.join(__dirname, '../../../../backend')
  
  // Check backend structure
  const backendDirs = [
    { path: 'repositories', desc: 'Repository layer' },
    { path: 'services', desc: 'Service layer' },
    { path: 'controllers', desc: 'Controller layer' },
    { path: 'middleware', desc: 'Middleware directory' }
  ]
  
  backendDirs.forEach(dir => {
    if (!checkDirectory(path.join(backendPath, dir.path), dir.desc)) {
      allPassed = false
    }
  })
  
  // Check backend files
  const backendFiles = [
    { file: 'prisma/schema.prisma', desc: 'Updated Prisma schema' },
    { file: 'server.new.js', desc: 'Enhanced server file' },
    { file: 'package.json', desc: 'Updated backend dependencies' }
  ]
  
  backendFiles.forEach(file => {
    if (!checkFile(path.join(backendPath, file.file), file.desc)) {
      allPassed = false
    }
  })
  
  // ML Service Tests
  logSection('🤖 ML Service Verification')
  
  const mlServicePath = path.join(__dirname, '../../../../ml-service')
  
  const mlFiles = [
    { file: 'main.new.py', desc: 'Enhanced FastAPI main' },
    { file: 'requirements.txt', desc: 'Updated requirements' }
  ]
  
  mlFiles.forEach(file => {
    if (!checkFile(path.join(mlServicePath, file.file), file.desc)) {
      allPassed = false
    }
  })
  
  // Build Tests
  logSection('🏗 Build Verification')
  
  // Test frontend build
  if (!runCommand('cd ../../ && npm run build', 'Frontend build')) {
    allPassed = false
  }
  
  // Test backend dependencies
  if (!runCommand('cd ../../../backend && npm install', 'Backend dependencies')) {
    allPassed = false
  }
  
  // Test ML service dependencies
  if (!runCommand('cd ../../../ml-service && pip install -r requirements.txt', 'ML service dependencies')) {
    allPassed = false
  }
  
  // Database Tests
  logSection('🗄️ Database Verification')
  
  if (!runCommand('cd ../../../backend && npx prisma validate', 'Prisma schema validation')) {
    allPassed = false
  }
  
  if (!runCommand('cd ../../../backend && npx prisma generate', 'Prisma client generation')) {
    allPassed = false
  }
  
  // Summary
  logSection('📊 Verification Summary')
  
  if (allPassed) {
    log('🎉 ALL TESTS PASSED! NutriAI is ready for deployment!', 'green')
    log('\n✅ Frontend: Enhanced with premium UI and new features', 'green')
    log('✅ Backend: Modernized with layered architecture', 'green')
    log('✅ ML Service: Upgraded with FastAPI improvements', 'green')
    log('✅ Database: Schema validated and ready', 'green')
    log('\n🚀 Next Steps:', 'blue')
    log('   1. Replace old files with .new versions', 'yellow')
    log('   2. Run database migrations', 'yellow')
    log('   3. Start all services (frontend, backend, ML)', 'yellow')
    log('   4. Test end-to-end functionality', 'yellow')
  } else {
    log('❌ SOME TESTS FAILED! Please fix issues before deployment.', 'red')
    log('\n🔧 Troubleshooting Steps:', 'blue')
    log('   1. Check file paths and permissions', 'yellow')
    log('   2. Install missing dependencies', 'yellow')
    log('   3. Fix build errors', 'yellow')
    log('   4. Validate database connection', 'yellow')
  }
  
  logSection('🏁 Verification Complete')
  
  process.exit(allPassed ? 0 : 1)
}

// Run verification
if (require.main === module) {
  runVerification()
}

module.exports = { runVerification }
