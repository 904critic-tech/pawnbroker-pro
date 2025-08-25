#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Global website manager that can be run from any project
class GlobalWebsiteManager {
    constructor() {
        this.configPath = this.findConfigFile();
        this.config = this.loadConfig();
        this.websitePath = this.findWebsitePath();
    }

    // Find the website config file
    findConfigFile() {
        const possiblePaths = [
            path.join(process.env.USERPROFILE || process.env.HOME, 'OneDrive', 'Desktop', 'Is it worth it', 'website', 'website-config.json'),
            path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'Is it worth it', 'website', 'website-config.json'),
            path.join(process.env.USERPROFILE || process.env.HOME, 'Documents', 'Is it worth it', 'website', 'website-config.json'),
            path.join(__dirname, '..', 'website-config.json')
        ];

        for (const configPath of possiblePaths) {
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }

        return null;
    }

    // Load configuration
    loadConfig() {
        if (this.configPath && fs.existsSync(this.configPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } catch (error) {
                console.error('Error loading config:', error.message);
                return null;
            }
        }
        return null;
    }

    // Find the website path
    findWebsitePath() {
        if (this.config && this.config.website && this.config.website.globalPath) {
            const configPath = this.config.website.globalPath;
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }

        // Fallback to common locations
        const commonPaths = [
            path.join(process.env.USERPROFILE || process.env.HOME, 'OneDrive', 'Desktop', 'Is it worth it', 'website'),
            path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'Is it worth it', 'website'),
            path.join(process.env.USERPROFILE || process.env.HOME, 'Documents', 'Is it worth it', 'website')
        ];

        for (const possiblePath of commonPaths) {
            if (fs.existsSync(possiblePath)) {
                return possiblePath;
            }
        }

        return null;
    }

    // Add current project to website
    addCurrentProject(projectName) {
        if (!this.websitePath) {
            console.error('Website path not found!');
            return false;
        }

        const currentDir = process.cwd();
        const projectsDir = path.join(this.websitePath, 'website', 'projects');
        const projectDir = path.join(projectsDir, projectName);

        // Create directories
        if (!fs.existsSync(projectsDir)) {
            fs.mkdirSync(projectsDir, { recursive: true });
        }
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        // Copy important files from current project
        const filesToCopy = ['package.json', 'README.md', 'index.html', 'styles.css', 'vercel.json'];
        let copiedCount = 0;

        filesToCopy.forEach(file => {
            const sourcePath = path.join(currentDir, file);
            const destPath = path.join(projectDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`✓ Copied ${file}`);
                copiedCount++;
            }
        });

        // Create project info file
        const projectInfo = {
            name: projectName,
            addedDate: new Date().toISOString(),
            sourcePath: currentDir,
            files: filesToCopy.filter(file => fs.existsSync(path.join(currentDir, file))),
            deployed: false,
            deploymentUrl: null
        };

        fs.writeFileSync(
            path.join(projectDir, 'project-info.json'),
            JSON.stringify(projectInfo, null, 2)
        );

        console.log(`\n🎉 Project "${projectName}" added to website successfully!`);
        console.log(`📁 Location: ${projectDir}`);
        console.log(`📄 Files copied: ${copiedCount}`);

        return true;
    }

    // Deploy project to Vercel safely
    deployProject(projectName) {
        if (!this.websitePath) {
            console.error('Website path not found!');
            return false;
        }

        const projectDir = path.join(this.websitePath, 'website', 'projects', projectName);
        
        if (!fs.existsSync(projectDir)) {
            console.error(`Project "${projectName}" not found!`);
            return false;
        }

        console.log(`🚀 Deploying project "${projectName}" to Vercel...`);

        try {
            // Create a temporary deployment directory
            const tempDeployDir = path.join(this.websitePath, 'temp-deploy', projectName);
            if (fs.existsSync(tempDeployDir)) {
                fs.rmSync(tempDeployDir, { recursive: true, force: true });
            }
            fs.mkdirSync(tempDeployDir, { recursive: true });

            // Copy project files to temp directory
            this.copyDirectory(projectDir, tempDeployDir);

            // Change to temp directory for deployment
            const originalCwd = process.cwd();
            process.chdir(tempDeployDir);

            // Check if Vercel CLI is installed
            try {
                execSync('vercel --version', { stdio: 'pipe' });
            } catch (error) {
                console.error('❌ Vercel CLI not found. Please install it first: npm i -g vercel');
                process.chdir(originalCwd);
                return false;
            }

            // Deploy to Vercel
            console.log('📤 Deploying to Vercel...');
            const deployOutput = execSync('vercel --prod --yes', { 
                encoding: 'utf8',
                stdio: 'pipe'
            });

            // Extract deployment URL from output
            const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
            const deploymentUrl = urlMatch ? urlMatch[0] : null;

            // Update project info
            const projectInfoPath = path.join(projectDir, 'project-info.json');
            if (fs.existsSync(projectInfoPath)) {
                const projectInfo = JSON.parse(fs.readFileSync(projectInfoPath, 'utf8'));
                projectInfo.deployed = true;
                projectInfo.deploymentUrl = deploymentUrl;
                projectInfo.deployedDate = new Date().toISOString();
                fs.writeFileSync(projectInfoPath, JSON.stringify(projectInfo, null, 2));
            }

            // Clean up temp directory
            process.chdir(originalCwd);
            fs.rmSync(tempDeployDir, { recursive: true, force: true });

            console.log(`\n🎉 Project "${projectName}" deployed successfully!`);
            if (deploymentUrl) {
                console.log(`🌐 Live URL: ${deploymentUrl}`);
            }

            return true;

        } catch (error) {
            console.error(`❌ Deployment failed: ${error.message}`);
            return false;
        }
    }

    // Copy directory recursively
    copyDirectory(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }

        const files = fs.readdirSync(source);
        files.forEach(file => {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }

    // List all projects in website
    listProjects() {
        if (!this.websitePath) {
            console.error('Website path not found!');
            return [];
        }

        const projectsDir = path.join(this.websitePath, 'website', 'projects');
        
        if (!fs.existsSync(projectsDir)) {
            console.log('No projects found in website.');
            return [];
        }

        const projects = fs.readdirSync(projectsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log('\n📋 Projects in website:');
        projects.forEach(project => {
            const projectInfoPath = path.join(projectsDir, project, 'project-info.json');
            if (fs.existsSync(projectInfoPath)) {
                try {
                    const info = JSON.parse(fs.readFileSync(projectInfoPath, 'utf8'));
                    const status = info.deployed ? '🚀 Deployed' : '📁 Local';
                    const url = info.deploymentUrl ? ` (${info.deploymentUrl})` : '';
                    console.log(`  • ${project} - ${status}${url}`);
                } catch (error) {
                    console.log(`  • ${project}`);
                }
            } else {
                console.log(`  • ${project}`);
            }
        });

        return projects;
    }

    // Get website status
    getStatus() {
        console.log('\n🌐 Website Status:');
        console.log(`Website Path: ${this.websitePath || 'Not found'}`);
        console.log(`Config File: ${this.configPath || 'Not found'}`);
        
        if (this.websitePath) {
            const devFolder = path.join(this.websitePath, 'website');
            const backupsFolder = path.join(this.websitePath, 'website', 'backups');
            
            console.log(`Development Folder: ${fs.existsSync(devFolder) ? '✓ Exists' : '✗ Missing'}`);
            console.log(`Backups Folder: ${fs.existsSync(backupsFolder) ? '✓ Exists' : '✗ Missing'}`);
            
            if (fs.existsSync(backupsFolder)) {
                const backups = fs.readdirSync(backupsFolder);
                console.log(`Backups Available: ${backups.length}`);
            }

            // Check Vercel CLI
            try {
                execSync('vercel --version', { stdio: 'pipe' });
                console.log('Vercel CLI: ✓ Installed');
            } catch (error) {
                console.log('Vercel CLI: ✗ Not installed (run: npm i -g vercel)');
            }
        }
    }

    // Show help
    showHelp() {
        console.log(`
🌐 Global Website Manager

Usage: node scripts/global-website.js [command] [options]

Commands:
  add-project <name>    Add current project to website
  deploy <name>        Deploy project to Vercel
  list-projects        List all projects in website
  status              Show website status
  help                Show this help

Examples:
  node scripts/global-website.js add-project my-awesome-app
  node scripts/global-website.js deploy my-awesome-app
  node scripts/global-website.js list-projects
  node scripts/global-website.js status

This script can be run from ANY project to interact with your website!
        `);
    }
}

// Main execution
if (require.main === module) {
    const manager = new GlobalWebsiteManager();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'add-project':
            const projectName = args[1];
            if (projectName) {
                manager.addCurrentProject(projectName);
            } else {
                console.error('Please provide a project name: node scripts/global-website.js add-project <name>');
            }
            break;
        case 'deploy':
            const deployProjectName = args[1];
            if (deployProjectName) {
                manager.deployProject(deployProjectName);
            } else {
                console.error('Please provide a project name: node scripts/global-website.js deploy <name>');
            }
            break;
        case 'list-projects':
            manager.listProjects();
            break;
        case 'status':
            manager.getStatus();
            break;
        case 'help':
        default:
            manager.showHelp();
            break;
    }
}

module.exports = GlobalWebsiteManager;
