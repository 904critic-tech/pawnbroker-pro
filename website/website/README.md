# Website Development Environment

## Purpose
This folder serves as a safe development environment for website modifications. All experimental changes should be made here before applying to the main site.

## Development Workflow

### 1. Making Changes
- Copy files from root directory to this folder
- Make modifications here
- Test thoroughly
- Only apply to main site after validation

### 2. File Organization
- `styles.css` - Development styles (copy from root)
- `index-dev.html` - Development version of main page
- `components/` - Reusable components
- `backups/` - Timestamped backups

### 3. Testing Process
1. Create development version
2. Test locally
3. Validate functionality
4. Check responsive design
5. Verify all links work
6. Apply to main site only after approval

## Current Development Files
- `styles.css` - Development stylesheet

## Backup Strategy
Always create backups before making changes:
```bash
# Example backup command
cp ../index.html backups/index-$(date +%Y%m%d-%H%M%S).html
```

## Safety Rules
- Never modify root files directly
- Always test in this environment first
- Create backups before any changes
- Document all modifications
- Verify site functionality after changes
