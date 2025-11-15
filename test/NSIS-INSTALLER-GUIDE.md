# BlogManager NSIS Installer Guide

This guide explains how to create a professional Windows installer for BlogManager using NSIS (Nullsoft Scriptable Install System).

## Prerequisites

1. **NSIS** - Download and install from: https://nsis.sourceforge.io/Download
2. **Node.js** - Already installed (required for building the app)
3. **Built Application** - Run `npm run build-portable` first

## Quick Start

### Option 1: Automated Build (Recommended)

Simply double-click: **`build-nsis-installer.bat`**

This will:
1. Build the portable app
2. Compile the NSIS installer
3. Create `BlogManager_1.0.0.exe`

### Option 2: Manual Build

```cmd
# 1. Build the portable app
npm run build-portable

# 2. Compile with NSIS
cd test
makensis script.nsi
```

## What You Get

The installer (`BlogManager_1.0.0.exe`) includes:

✅ **Professional Installation**
- Welcome screen
- Directory selection
- Progress tracking
- Finish page with launch option

✅ **Desktop Integration**
- Desktop shortcut
- Start Menu entry
- Add/Remove Programs registration

✅ **Clean Uninstall**
- Complete removal of files
- Registry cleanup
- Shortcut removal

## Customization

### Change Version

Edit `test/script.nsi`:
```nsis
!define APP_VERSION "1.0.0"  ; Change this
```

### Change Install Location

Default: `%LOCALAPPDATA%\BlogManager`

To change, edit:
```nsis
InstallDir "$LOCALAPPDATA\${APP_NAME}"
```

Options:
- `$PROGRAMFILES` - Program Files (requires admin)
- `$LOCALAPPDATA` - Local AppData (no admin needed)
- `$APPDATA` - Roaming AppData

### Add License File

1. Create `test/license.txt`
2. Uncomment in `script.nsi`:
```nsis
!insertmacro MUI_PAGE_LICENSE "license.txt"
```

## Distribution

The generated `BlogManager_1.0.0.exe` is:
- ✅ Self-contained (single file)
- ✅ Silent install capable (`/S` flag)
- ✅ Portable (no external dependencies)
- ✅ Signed (if you add code signing)

### File Size
- Installer: ~100-150 MB (includes all Electron files)
- Installed: ~200 MB

## Troubleshooting

### "makensis is not recognized"

**Solution:** Add NSIS to PATH or run from NSIS folder:
```cmd
"C:\Program Files (x86)\NSIS\makensis.exe" script.nsi
```

### "Error opening file for writing"

**Solution:** Close any running BlogManager instances

### Files Not Found

**Solution:** Make sure `dist/BlogManager-win32-x64/` exists:
```cmd
npm run build-portable
```

## Advanced Options

### Silent Installation

```cmd
BlogManager_1.0.0.exe /S
```

### Custom Install Directory

```cmd
BlogManager_1.0.0.exe /D=C:\MyApps\BlogManager
```

### Check Installation Status

```cmd
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\BlogManager"
```

## File Structure

```
test/
├── script.nsi                    # NSIS installer script
├── build-nsis-installer.bat      # Automated build script
├── dist/
│   └── BlogManager-win32-x64/    # Built app (from npm run build-portable)
└── BlogManager_1.0.0.exe         # Final installer (output)
```

## Comparison: Portable vs Installer

| Feature | Portable BAT | NSIS Installer |
|---------|-------------|----------------|
| Single File | ❌ | ✅ |
| Professional Install | ❌ | ✅ |
| Uninstaller | ❌ | ✅ |
| Start Menu | ❌ | ✅ |
| Add/Remove Programs | ❌ | ✅ |
| File Size | ~200 MB | ~150 MB |
| Speed | Instant | 10-20 sec |

## Next Steps

1. **Code Signing** (Optional but recommended):
   - Get a code signing certificate
   - Sign the installer with SignTool
   - Prevents Windows SmartScreen warnings

2. **Auto-Update** (Future):
   - Add update checking to Electron app
   - Host installer on GitHub Releases
   - Implement silent update mechanism

3. **Multi-Language** (Optional):
   - Add language selection in NSIS
   - Translate installer strings

## Support

For issues or questions:
- Check NSIS documentation: https://nsis.sourceforge.io/Docs/
- Verify NSIS installation: `makensis /VERSION`
- Test in clean Windows VM before distribution

---

**Ready to build?** Run `build-nsis-installer.bat` and you're done! 🚀
