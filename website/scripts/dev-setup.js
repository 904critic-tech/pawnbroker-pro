const fs = require('fs');
const path = require('path');

// Development environment setup script
class DevEnvironment {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.devDir = path.join(this.rootDir, 'website');
        this.backupDir = path.join(this.devDir, 'backups');
        this.publicDir = path.join(this.rootDir, 'public-site');
        
        // Global website folder detection
        this.globalWebsitePath = this.findGlobalWebsiteFolder();
    }

    // Find the global website folder from any project
    findGlobalWebsiteFolder() {
        // Check common locations for the website folder
        const possiblePaths = [
            path.join(process.env.USERPROFILE || process.env.HOME, 'OneDrive', 'Desktop', 'Is it worth it', 'website'),
            path.join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'Is it worth it', 'website'),
            path.join(process.env.USERPROFILE || process.env.HOME, 'Documents', 'Is it worth it', 'website'),
            // Add more common paths as needed
        ];

        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                console.log(`Found global website folder: ${possiblePath}`);
                return possiblePath;
            }
        }

        console.log('Global website folder not found in common locations');
        return null;
    }

    // Check if we're in the website project or another project
    isInWebsiteProject() {
        return this.rootDir.includes('website') || this.rootDir.includes('Is it worth it');
    }

    // Get the appropriate website folder to work with
    getWebsiteFolder() {
        if (this.isInWebsiteProject()) {
            return this.devDir; // Use local website folder
        } else if (this.globalWebsitePath) {
            return this.globalWebsitePath; // Use global website folder
        } else {
            throw new Error('No website folder found. Please ensure the website project exists.');
        }
    }

    // Create necessary directories
    createDirectories() {
        const websiteFolder = this.getWebsiteFolder();
        const dirs = [websiteFolder, path.join(websiteFolder, 'backups'), this.publicDir];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }

    // Create timestamped backup
    createBackup(filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sourcePath = path.join(this.rootDir, filename);
        const websiteFolder = this.getWebsiteFolder();
        const backupPath = path.join(websiteFolder, 'backups', `${filename}-${timestamp}`);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, backupPath);
            console.log(`Backup created: ${backupPath}`);
            return backupPath;
        } else {
            console.log(`File not found: ${sourcePath}`);
            return null;
        }
    }

    // Copy file to development environment
    copyToDev(filename) {
        const sourcePath = path.join(this.rootDir, filename);
        const websiteFolder = this.getWebsiteFolder();
        const devPath = path.join(websiteFolder, filename);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, devPath);
            console.log(`Copied to dev: ${filename}`);
            return devPath;
        } else {
            console.log(`File not found: ${sourcePath}`);
            return null;
        }
    }

    // Copy file to public staging
    copyToPublic(filename) {
        const sourcePath = path.join(this.rootDir, filename);
        const publicPath = path.join(this.publicDir, filename);
        
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, publicPath);
            console.log(`Copied to public: ${filename}`);
            return publicPath;
        } else {
            console.log(`File not found: ${sourcePath}`);
            return null;
        }
    }

    // Add project to website
    addProjectToWebsite(projectName, projectFiles = []) {
        const websiteFolder = this.getWebsiteFolder();
        const projectsDir = path.join(websiteFolder, 'projects');
        
        if (!fs.existsSync(projectsDir)) {
            fs.mkdirSync(projectsDir, { recursive: true });
        }

        const projectDir = path.join(projectsDir, projectName);
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        // Copy project files to website projects folder
        projectFiles.forEach(file => {
            const sourcePath = path.join(this.rootDir, file);
            const destPath = path.join(projectDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`Added ${file} to website projects`);
            }
        });

        console.log(`Project ${projectName} added to website successfully!`);
        return projectDir;
    }

    // Setup development environment
    setup() {
        console.log('Setting up development environment...');
        console.log(`Current project: ${this.rootDir}`);
        console.log(`Website folder: ${this.getWebsiteFolder()}`);
        
        this.createDirectories();
        
        // Create backups of critical files if they exist
        const criticalFiles = ['index.html', 'styles.css'];
        criticalFiles.forEach(file => {
            if (fs.existsSync(path.join(this.rootDir, file))) {
                this.createBackup(file);
                this.copyToDev(file);
            }
        });
        
        console.log('Development environment setup complete!');
    }

    // Apply changes from dev to main
    applyChanges(filename) {
        const websiteFolder = this.getWebsiteFolder();
        const devPath = path.join(websiteFolder, filename);
        const mainPath = path.join(this.rootDir, filename);
        
        if (fs.existsSync(devPath)) {
            // Create backup before applying
            this.createBackup(filename);
            
            // Apply changes
            fs.copyFileSync(devPath, mainPath);
            console.log(`Applied changes: ${filename}`);
        } else {
            console.log(`Development file not found: ${devPath}`);
        }
    }

    // List available projects in website
    listProjects() {
        const websiteFolder = this.getWebsiteFolder();
        const projectsDir = path.join(websiteFolder, 'projects');
        
        if (fs.existsSync(projectsDir)) {
            const projects = fs.readdirSync(projectsDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            console.log('Available projects in website:');
            projects.forEach(project => console.log(`- ${project}`));
            return projects;
        } else {
            console.log('No projects folder found');
            return [];
        }
    }
}

// Export for use in other scripts
module.exports = DevEnvironment;

// Run setup if called directly
if (require.main === module) {
    const dev = new DevEnvironment();
    
    // Handle command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'setup':
            dev.setup();
            break;
        case 'backup':
            const filename = args[1];
            if (filename) {
                dev.createBackup(filename);
            } else {
                console.log('Please specify a filename to backup');
            }
            break;
        case 'apply':
            const applyFile = args[1];
            if (applyFile) {
                dev.applyChanges(applyFile);
            } else {
                console.log('Please specify a filename to apply');
            }
            break;
        case 'add-project':
            const projectName = args[1];
            if (projectName) {
                const projectFiles = args.slice(2);
                dev.addProjectToWebsite(projectName, projectFiles);
            } else {
                console.log('Please specify a project name');
            }
            break;
        case 'list-projects':
            dev.listProjects();
            break;
        default:
            dev.setup();
    }
}
