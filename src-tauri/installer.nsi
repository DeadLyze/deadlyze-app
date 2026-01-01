!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"

Unicode true

!define MANUFACTURER "{{manufacturer}}"
!define PRODUCTNAME "{{product_name}}"
!define VERSION "{{version}}"
!define INSTALLMODE "{{install_mode}}"
!define LICENSE "{{license}}"
!define INSTALLERICON "{{installer_icon}}"
!define SIDEBARIMAGE "{{sidebar_image}}"
!define HEADERIMAGE "{{header_image}}"
!define MAINBINARYNAME "{{main_binary_name}}"
!define MAINBINARYSRCPATH "{{main_binary_path}}"
!define BUNDLEID "{{bundle_id}}"
!define COPYRIGHT "{{copyright}}"
!define OUTFILE "{{out_file}}"
!define ARCH "{{arch}}"
!define PLUGINSPATH "{{additional_plugins_path}}"
!define ALLOWDOWNGRADES "{{allow_downgrades}}"
!define INSTALLWEBVIEW2MODE "{{webview_install_mode}}"
!define WEBVIEW2INSTALLERARGS "{{webview_installer_args}}"
!define WEBVIEW2BOOTSTRAPPERPATH "{{webview_bootstrapper_path}}"
!define WEBVIEW2INSTALLERPATH "{{webview_installer_path}}"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCTNAME}"
!define MANUPRODUCTKEY "Software\${MANUFACTURER}\${PRODUCTNAME}"
!define UNINSTALLERSIGNCOMMAND "{{uninstaller_sign_cmd}}"
!define ESTIMATEDSIZE "{{estimated_size}}"

VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${PRODUCTNAME}"
VIAddVersionKey "FileDescription" "${PRODUCTNAME} Installer"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "${MANUFACTURER}"
VIAddVersionKey "LegalCopyright" "${COPYRIGHT}"

Name "${PRODUCTNAME}"
OutFile "${OUTFILE}"
Icon "${INSTALLERICON}"
UninstallIcon "${INSTALLERICON}"

!if "${INSTALLMODE}" == "perMachine"
  RequestExecutionLevel admin
  InstallDir "$PROGRAMFILES64\${PRODUCTNAME}"
!else
  RequestExecutionLevel user
  InstallDir "$LOCALAPPDATA\${PRODUCTNAME}"
!endif

ShowInstDetails nevershow
ShowUnInstDetails nevershow
SetCompressor /SOLID lzma

!define MUI_ICON "${INSTALLERICON}"
!define MUI_UNICON "${INSTALLERICON}"
!define MUI_ABORTWARNING

Var AppLanguage
Var Dialog
Var Label
Var RadioEN
Var RadioRU
Var CreateDesktopShortcut

!insertmacro MUI_PAGE_WELCOME

Page custom LanguageSelectionPage LanguageSelectionLeave

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_RUN "$INSTDIR\${MAINBINARYNAME}.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${PRODUCTNAME}"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Create Desktop Shortcut"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION CreateDesktopShortcutFunc
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Russian"

LangString AppLanguageTitle ${LANG_ENGLISH} "Application Language"
LangString AppLanguageSubtitle ${LANG_ENGLISH} "Select the language for ${PRODUCTNAME}"
LangString AppLanguageLabel ${LANG_ENGLISH} "Choose application language:"
LangString AppLanguageEnglish ${LANG_ENGLISH} "English"
LangString AppLanguageRussian ${LANG_ENGLISH} "Russian"

LangString AppLanguageTitle ${LANG_RUSSIAN} "Язык приложения"
LangString AppLanguageSubtitle ${LANG_RUSSIAN} "Выберите язык для ${PRODUCTNAME}"
LangString AppLanguageLabel ${LANG_RUSSIAN} "Выберите язык приложения:"
LangString AppLanguageEnglish ${LANG_RUSSIAN} "English"
LangString AppLanguageRussian ${LANG_RUSSIAN} "Русский"

Function LanguageSelectionPage
  !insertmacro MUI_HEADER_TEXT "$(AppLanguageTitle)" "$(AppLanguageSubtitle)"
  
  nsDialogs::Create 1018
  Pop $Dialog
  ${If} $Dialog == error
    Abort
  ${EndIf}
  
  ${NSD_CreateLabel} 0 0 100% 12u "$(AppLanguageLabel)"
  Pop $Label
  
  ${NSD_CreateRadioButton} 10 20u 100% 12u "$(AppLanguageEnglish)"
  Pop $RadioEN
  ${NSD_OnClick} $RadioEN OnLanguageEnglish
  
  ${NSD_CreateRadioButton} 10 35u 100% 12u "$(AppLanguageRussian)"
  Pop $RadioRU
  ${NSD_OnClick} $RadioRU OnLanguageRussian
  
  ; Set default based on installer language
  ${If} $LANGUAGE == ${LANG_RUSSIAN}
    StrCpy $AppLanguage "ru"
    ${NSD_Check} $RadioRU
  ${Else}
    StrCpy $AppLanguage "en"
    ${NSD_Check} $RadioEN
  ${EndIf}
  
  nsDialogs::Show
FunctionEnd

Function LanguageSelectionLeave
FunctionEnd

Function OnLanguageEnglish
  StrCpy $AppLanguage "en"
FunctionEnd

Function OnLanguageRussian
  StrCpy $AppLanguage "ru"
FunctionEnd

Function CreateDesktopShortcutFunc
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
FunctionEnd

Section "Install"
  SetOutPath $INSTDIR
  
  {{#each resources_dirs}}
  CreateDirectory "$INSTDIR\{{this}}"
  {{/each}}
  
  {{#each resources}}
  File /oname={{this.[1]}} "{{this.[0]}}"
  {{/each}}
  
  {{#each binaries}}
  File /oname={{this}} "{{this}}"
  {{/each}}
  
  File "${MAINBINARYSRCPATH}"
  
  ; Create config.json with selected language
  CreateDirectory "$APPDATA\${BUNDLEID}"
  FileOpen $0 "$APPDATA\${BUNDLEID}\config.json" w
  FileWrite $0 '{$\r$\n  "language": "$AppLanguage"$\r$\n}'
  FileClose $0
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\${PRODUCTNAME}"
  CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
  
  ; Write uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Registry keys
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayName" "${PRODUCTNAME}"
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\${MAINBINARYNAME}.exe"
  WriteRegStr SHCTX "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr SHCTX "${UNINSTKEY}" "Publisher" "${MANUFACTURER}"
  WriteRegStr SHCTX "${UNINSTKEY}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegDWORD SHCTX "${UNINSTKEY}" "EstimatedSize" "${ESTIMATEDSIZE}"
  WriteRegDWORD SHCTX "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD SHCTX "${UNINSTKEY}" "NoRepair" 1
  
  ; Save app language in registry
  WriteRegStr SHCTX "${MANUPRODUCTKEY}" "AppLanguage" "$AppLanguage"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\${MAINBINARYNAME}.exe"
  Delete "$INSTDIR\uninstall.exe"
  
  {{#each resources}}
  Delete "$INSTDIR\{{this.[1]}}"
  {{/each}}
  
  {{#each binaries}}
  Delete "$INSTDIR\{{this}}"
  {{/each}}
  
  {{#each resources_dirs}}
  RMDir "$INSTDIR\{{this}}"
  {{/each}}
  
  RMDir "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$SMPROGRAMS\${PRODUCTNAME}\${PRODUCTNAME}.lnk"
  RMDir "$SMPROGRAMS\${PRODUCTNAME}"
  Delete "$DESKTOP\${PRODUCTNAME}.lnk"
  
  ; Ask user if they want to delete app data
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to delete application settings and data?" IDNO skip_appdata
  RMDir /r "$APPDATA\${BUNDLEID}"
  skip_appdata:
  
  ; Remove registry keys
  DeleteRegKey SHCTX "${UNINSTKEY}"
  DeleteRegKey SHCTX "${MANUPRODUCTKEY}"
SectionEnd
