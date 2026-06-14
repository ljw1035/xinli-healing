Dim shell, fs, appPath
Set shell = CreateObject("WScript.Shell")
Set fs = CreateObject("Scripting.FileSystemObject")

appPath = shell.CurrentDirectory

If InStr(appPath, "System32") > 0 or InStr(appPath, "Windows") > 0 Then
    appPath = fs.GetParentFolderName(WScript.ScriptFullName)
End If

Dim serverScript
serverScript = """" & appPath & "\server.js"""

shell.Run "cmd /c ""cd /d """ & appPath & """ && node " & serverScript & """" , 0, False

WScript.Sleep 2000

shell.Run "http://localhost:5173"

Set shell = Nothing
Set fs = Nothing
