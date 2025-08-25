# Cursor AI Website Development Guide

## 🚨 CRITICAL: How to Safely Modify This Website

### The Problem
When Cursor AI modifies website files directly, it can break the entire site and cause downtime.

### The Solution
This project has been configured with a **safe development environment** that prevents site downtime.

## 📁 Folder Structure

```
website/
├── website/           ← SAFE DEVELOPMENT FOLDER
│   ├── backups/      ← Automatic backups
│   ├── styles.css    ← Development styles
│   └── README.md     ← Development guide
├── public-site/      ← Staging environment
├── scripts/          ← Automation scripts
└── [root files]      ← PRODUCTION FILES (DANGER ZONE)
```

## 🔒 Safety Rules

### ✅ DO THIS:
1. **ALWAYS work in the `website/` folder first**
2. **Use `npm run setup-dev` to initialize the environment**
3. **Create backups before any changes**
4. **Test changes in isolation**
5. **Only apply to main site after validation**

### ❌ NEVER DO THIS:
1. **Modify root files directly** (index.html, styles.css, etc.)
2. **Skip the backup process**
3. **Apply untested changes to production**
4. **Work without the development environment**

## 🛠️ Development Workflow

### Step 1: Setup Environment
```bash
npm run setup-dev
```

### Step 2: Make Changes
- Work in `website/` folder
- Modify files there
- Test thoroughly

### Step 3: Apply Changes
```bash
npm run apply-changes [filename]
```

## 📋 Available Commands

| Command | Purpose |
|---------|---------|
| `npm run setup-dev` | Initialize development environment |
| `npm run backup` | Create timestamped backups |
| `npm run apply-changes` | Apply tested changes to main site |

## 🔍 File Access Strategy

### For New Features:
1. Copy files to `website/` folder
2. Develop and test there
3. Apply only after validation

### For Bug Fixes:
1. Create backup first
2. Work in development environment
3. Test fix thoroughly
4. Apply to main site

### For Styling Changes:
1. Modify `website/styles.css`
2. Test responsive design
3. Verify all elements work
4. Apply changes

## 🚨 Emergency Recovery

If the site goes down:
1. Check `website/backups/` for recent backups
2. Restore from backup
3. Identify what caused the issue
4. Fix in development environment first

## 📝 Documentation

- `.cursorrules` - Cursor AI behavior rules
- `website/README.md` - Development environment guide
- `workspace.code-workspace` - VS Code workspace config

## 🎯 Key Benefits

1. **Zero Downtime** - Site stays live during development
2. **Safe Testing** - Changes tested in isolation
3. **Easy Recovery** - Automatic backups prevent data loss
4. **Clear Workflow** - Structured development process

## 🔧 Configuration Files

- `.cursorrules` - Tells Cursor AI how to behave
- `workspace.code-workspace` - VS Code workspace setup
- `scripts/dev-setup.js` - Automation scripts

---

**Remember: Always work in the `website/` folder first, never modify root files directly!**
