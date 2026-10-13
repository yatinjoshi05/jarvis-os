!macro NSIS_HOOK_POSTINSTALL
  CreateShortcut "$DESKTOP\JARVIS OS.lnk" "$INSTDIR\JARVIS OS.exe"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  Delete "$DESKTOP\JARVIS OS.lnk"
!macroend
