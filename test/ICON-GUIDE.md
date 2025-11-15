# App Icon Guide

## 🎨 Using PNG Icon for Blog Articles Manager

The app now supports PNG icons instead of ICO files!

## 📏 Icon Requirements

### **Recommended Specifications:**
- **Format**: PNG
- **Size**: 512x512 pixels (or 256x256, 1024x1024)
- **Transparency**: Supported (for modern look)
- **File name**: `blog-icon.png`
- **Location**: Place in the `test/` folder

### **Quick Tips:**
- ✅ Square dimensions (512x512, 256x256, etc.)
- ✅ Transparent background works great
- ✅ Simple, recognizable design
- ✅ High contrast colors
- ⚠️ Avoid very thin lines (may not scale well)

## 🚀 How to Add Your Icon

1. **Create or find your icon** (512x512 PNG)
2. **Name it**: `blog-icon.png`
3. **Place it in**: `test/` folder (same location as package.json)
4. **Build the app**: Run `build-portable.bat`

That's it! Your app will now use the PNG icon.

## 🎯 Icon Ideas for Blog Manager

Since this is a blog articles manager, consider:
- 📝 Notepad/document icon
- ✍️ Pen and paper
- 📚 Book or journal
- 📄 Article/document stack
- 💬 Chat bubble with text
- 🖊️ Feather pen (classic blog style)

## 🔄 Changing the Icon Later

To change the icon:
1. Replace `test/blog-icon.png` with your new icon
2. Run `build-portable.bat` again
3. New .exe will have the updated icon

## 🛠️ Creating Icons

### Online Tools:
- **Canva**: https://www.canva.com (easy, templates)
- **Figma**: https://www.figma.com (professional)
- **GIMP**: https://www.gimp.org (free desktop app)

### Quick Generator:
- **favicon.io**: Generate from text/emoji
- **Flaticon**: Download ready-made icons
- **IconArchive**: Free icon library

## 📦 What Electron-Builder Does

Electron-builder automatically:
- ✅ Converts PNG to ICO (for Windows)
- ✅ Creates multiple sizes for Windows
- ✅ Embeds icon in the .exe file
- ✅ Sets taskbar icon
- ✅ Sets window icon

## 🎨 Example: Creating a Simple Icon

### Using Emoji (Quick & Easy):
1. Go to https://favicon.io/emoji-favicons/
2. Choose an emoji (📝 notepad, 📚 books, etc.)
3. Download as PNG
4. Resize to 512x512 if needed
5. Rename to `blog-icon.png`
6. Done!

### Using Design Tools:
1. Create 512x512 canvas
2. Design your icon (keep it simple)
3. Export as PNG
4. Save as `blog-icon.png`
5. Build!

## 💡 Pro Tips

1. **Test your icon**: Build and check how it looks in:
   - Taskbar (small size)
   - Desktop shortcut
   - Alt+Tab switcher
   - Window title bar

2. **Keep it simple**: Icons look best when not too detailed

3. **Use brand colors**: Match your blog's theme

4. **Add padding**: Leave ~10% margin around edges for better look

## ❓ Troubleshooting

**Icon not showing after build:**
- Make sure file is named exactly: `blog-icon.png`
- Check file is in `test/` folder
- Rebuild with clean build: delete `dist/` folder first
- Check PNG is valid (open in image viewer)

**Icon looks pixelated:**
- Use larger source image (512x512 or higher)
- Ensure PNG is high quality, not compressed heavily

**Wrong icon showing:**
- Windows caches icons - restart Explorer or PC
- Delete and rebuild to get fresh icon
