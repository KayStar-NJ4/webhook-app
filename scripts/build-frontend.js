#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    sourceDir: path.join(__dirname, '..', 'public', 'admin'),
    targetDir: path.join(__dirname, '..', 'nginx', 'html', 'admin'),
    excludeFiles: ['.DS_Store', 'Thumbs.db', '.gitkeep'],
    excludeDirs: ['.git', 'node_modules', '.vscode', '.idea']
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Utility functions
function shouldExcludeFile(fileName) {
    return CONFIG.excludeFiles.includes(fileName);
}

function shouldExcludeDir(dirName) {
    return CONFIG.excludeDirs.includes(dirName);
}

function copyFile(srcPath, destPath) {
    try {
        fs.copyFileSync(srcPath, destPath);
        return true;
    } catch (error) {
        logError(`Failed to copy file ${srcPath}: ${error.message}`);
        return false;
    }
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    let successCount = 0;
    let errorCount = 0;
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            if (shouldExcludeDir(entry.name)) {
                logWarning(`Skipping directory: ${entry.name}`);
                continue;
            }
            
            const result = copyDirectory(srcPath, destPath);
            successCount += result.success;
            errorCount += result.errors;
        } else {
            if (shouldExcludeFile(entry.name)) {
                logWarning(`Skipping file: ${entry.name}`);
                continue;
            }
            
            if (copyFile(srcPath, destPath)) {
                successCount++;
            } else {
                errorCount++;
            }
        }
    }
    
    return { success: successCount, errors: errorCount };
}

// Main build function
function buildFrontend() {
    logStep('1', 'Starting frontend build process...');
    
    // Check if source directory exists
    if (!fs.existsSync(CONFIG.sourceDir)) {
        logError(`Source directory not found: ${CONFIG.sourceDir}`);
        process.exit(1);
    }
    
    // Create target directory
    if (!fs.existsSync(CONFIG.targetDir)) {
        fs.mkdirSync(CONFIG.targetDir, { recursive: true });
        logSuccess(`Created target directory: ${CONFIG.targetDir}`);
    }
    
    // Clean target directory
    logStep('2', 'Cleaning target directory...');
    try {
        fs.rmSync(CONFIG.targetDir, { recursive: true, force: true });
        fs.mkdirSync(CONFIG.targetDir, { recursive: true });
        logSuccess('Target directory cleaned');
    } catch (error) {
        logError(`Failed to clean target directory: ${error.message}`);
        process.exit(1);
    }
    
    // Copy files
    logStep('3', 'Copying frontend files...');
    const result = copyDirectory(CONFIG.sourceDir, CONFIG.targetDir);
    
    // Summary
    logStep('4', 'Build summary:');
    logSuccess(`Files copied successfully: ${result.success}`);
    
    if (result.errors > 0) {
        logError(`Files failed to copy: ${result.errors}`);
        process.exit(1);
    }
    
    logSuccess('Frontend build completed successfully!');
}

// Run build
if (require.main === module) {
    buildFrontend();
}

module.exports = { buildFrontend };
