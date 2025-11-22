!define APP_NAME "BlogManager"
!define APP_VERSION "1.0.0"
!define OUTFILE "${APP_NAME}_${APP_VERSION}.exe"

OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\${APP_NAME}"

!include "MUI2.nsh"

Name "${APP_NAME} ${APP_VERSION}"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

; Custom finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\BlogManager.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APP_NAME}"
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "MainSection" SEC01
    SetOutPath "$INSTDIR"

    File /r "dist\BlogManager-win32-x64\*.*"

    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; Create desktop shortcut
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\BlogManager.exe" "" "$INSTDIR\BlogManager.exe"
    
    ; Create Start menu shortcut
    CreateShortcut "$SMPROGRAMS\${APP_NAME}.lnk" "$INSTDIR\BlogManager.exe" "" "$INSTDIR\BlogManager.exe"

    ; Register application for Add/Remove Programs
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "QuietUninstallString" "$\"$INSTDIR\uninstall.exe$\" /S"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "InstallLocation" "$\"$INSTDIR$\""
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$\"$INSTDIR\BlogManager.exe$\""
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "Sedat ERGOZ"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" 1
    WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" 1
SectionEnd

Section "Uninstall"
    ; Remove files and folders
    RMDir /r "$INSTDIR"

    ; Remove desktop shortcut
    Delete "$DESKTOP\${APP_NAME}.lnk"

    ; Remove Start menu shortcut
    Delete "$SMPROGRAMS\${APP_NAME}.lnk"

    ; Remove registry keys
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
    DeleteRegKey HKCU "SOFTWARE\${APP_NAME}"
SectionEnd
