#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

/// Launches Deadlock game via Steam (App ID: 1422450)
#[tauri::command]
pub fn launch_deadlock() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "steam://rungameid/1422450"])
            .creation_flags(crate::utils::CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

/// Checks if Deadlock game is currently running
#[tauri::command]
pub fn is_deadlock_running() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let output = crate::utils::windows::execute_powershell(&[
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "Get-Process -Name 'project8' -ErrorAction SilentlyContinue | Select-Object -First 1",
        ])
        .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(!stdout.trim().is_empty())
    }

    #[cfg(not(target_os = "windows"))]
    Ok(false)
}
