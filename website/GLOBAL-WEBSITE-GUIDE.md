# 🌐 Global Website Access System

## 🎯 What This Solves

**Problem**: Cursor AI can only access your website when working directly in the website project, limiting your ability to add projects from other locations.

**Solution**: A global system that allows Cursor AI to access your website folder from **ANY project** you're working on, without breaking your existing site.

## 🚀 How It Works

### From ANY Project Location:
```bash
# Add your current project to the website
node scripts/global-website.js add-project my-awesome-app

# List all projects in your website
node scripts/global-website.js list-projects

# Check website status
node scripts/global-website.js status
```

### What Happens:
1. **Project gets copied** to `website/projects/my-awesome-app/`
2. **No interference** with existing website files
3. **Safe integration** without any downtime
4. **Automatic backup** of project files

## 📁 System Architecture

```
Your Computer:
├── Project A (anywhere)
│   ├── package.json
│   ├── index.html
│   └── scripts/global-website.js ← Global access script
│
├── Project B (anywhere)
│   ├── package.json
│   ├── styles.css
│   └── scripts/global-website.js ← Same global access script
│
└── Website Project
    ├── website/
    │   ├── projects/           ← Projects added from anywhere
    │   │   ├── project-a/
    │   │   └── project-b/
    │   ├── backups/           ← Automatic backups
    │   └── styles.css         ← Safe development
    ├── website-config.json    ← Global configuration
    └── [production files]     ← Never touched directly
```

## 🛠️ Setup Instructions

### 1. Copy Global Script to Each Project
Copy `scripts/global-website.js` to any project you want to connect to your website:

```bash
# From your website project, copy the script
cp scripts/global-website.js /path/to/other/project/scripts/
```

### 2. Copy Configuration File
Copy `website-config.json` to make the system aware of your website location:

```bash
# Copy config to other projects
cp website-config.json /path/to/other/project/
```

### 3. Use from Any Project
Now you can run these commands from ANY project:

```bash
# Add current project to website
node scripts/global-website.js add-project my-project

# List all projects
node scripts/global-website.js list-projects

# Check status
node scripts/global-website.js status
```

## 📋 Available Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `add-project <name>` | Add current project to website | `add-project todo-app` |
| `list-projects` | Show all projects in website | `list-projects` |
| `status` | Check website system status | `status` |
| `help` | Show help information | `help` |

## 🔒 Safety Features

### ✅ What's Protected:
- **Main website files** - Never modified directly
- **Production environment** - Always stays live
- **Existing functionality** - No interference
- **Automatic backups** - Before any changes

### 🛡️ How Safety Works:
1. **Projects are copied** to separate folder
2. **No direct modification** of main site files
3. **Isolated development** environment
4. **Easy rollback** from backups

## 🎯 Use Cases

### Scenario 1: Adding a New App
```bash
# You're working on a new todo app
cd /path/to/todo-app
node scripts/global-website.js add-project todo-app
# ✅ Todo app is now safely added to your website
```

### Scenario 2: Adding a Portfolio Project
```bash
# You're working on a portfolio piece
cd /path/to/portfolio-project
node scripts/global-website.js add-project portfolio-2024
# ✅ Portfolio is now in your website projects
```

### Scenario 3: Checking What's Available
```bash
# From any project, check what's in your website
node scripts/global-website.js list-projects
# 📋 Shows: todo-app, portfolio-2024, etc.
```

## 🔧 Configuration

The system automatically finds your website using these paths:
- `C:/Users/shuma/OneDrive/Desktop/Is it worth it/website`
- `C:/Users/shuma/Desktop/Is it worth it/website`
- `C:/Users/shuma/Documents/Is it worth it/website`

You can customize paths in `website-config.json`.

## 🚨 Emergency Recovery

If something goes wrong:
1. **Check backups**: `website/backups/` folder
2. **Restore from backup**: Copy backup files back
3. **Identify issue**: Check project info files
4. **Fix in isolation**: Use development environment

## 📝 For Cursor AI

### When Working on ANY Project:
1. **Use global commands** to add projects to website
2. **Never modify** main website files directly
3. **Always test** in development environment first
4. **Use backups** before making changes

### Example AI Workflow:
```bash
# AI working on a new project
# 1. Develop the project normally
# 2. When ready to add to website:
node scripts/global-website.js add-project new-feature
# 3. Project is safely added without breaking site
```

## 🎉 Benefits

1. **Zero Downtime** - Site never goes down
2. **Cross-Project Access** - Work from anywhere
3. **Safe Integration** - No interference with existing code
4. **Easy Management** - Simple commands from any location
5. **Automatic Backups** - Always safe to experiment

---

**🎯 Result**: Cursor AI can now access your website from ANY project, add new projects safely, and maintain site stability across all development work!
