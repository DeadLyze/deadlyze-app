#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(serde::Serialize)]
pub struct SteamInfo {
    pub is_installed: bool,
    pub install_path: Option<String>,
    pub steam_id64: Option<String>,
    pub persona_name: Option<String>,
    pub is_running: bool,
}

/// Detects Steam installation and current user
#[tauri::command]
pub fn get_steam_info() -> Result<SteamInfo, String> {
    #[cfg(target_os = "windows")]
    {
        let install_path = find_steam_install_path()?;
        let is_installed = install_path.is_some();
        let is_running = check_steam_running(is_installed)?;
        
        let (steam_id64, persona_name) = if let Some(ref path) = install_path {
            parse_steam_user_info(path)?
        } else {
            (None, None)
        };
        
        Ok(SteamInfo {
            is_installed,
            install_path,
            steam_id64,
            persona_name,
            is_running,
        })
    }
    
    #[cfg(not(target_os = "windows"))]
    Ok(SteamInfo {
        is_installed: false,
        install_path: None,
        steam_id64: None,
        persona_name: None,
        is_running: false,
    })
}

#[cfg(target_os = "windows")]
fn find_steam_install_path() -> Result<Option<String>, String> {
    use std::path::PathBuf;
    
    const REGISTRY_PATHS: &[&str] = &[
        r"HKEY_CURRENT_USER\Software\Valve\Steam",
        r"HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Valve\Steam",
        r"HKEY_LOCAL_MACHINE\SOFTWARE\Valve\Steam",
    ];
    
    for reg_path in REGISTRY_PATHS {
        let output = std::process::Command::new("reg")
            .args(["query", reg_path, "/v", "InstallPath", "/t", "REG_SZ"])
            .creation_flags(crate::utils::CREATE_NO_WINDOW)
            .output();
        
        if let Ok(output) = output {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            if let Some(line) = stdout.lines().find(|l| l.contains("InstallPath")) {
                if let Some(path) = line.split("REG_SZ").nth(1) {
                    let path = path.trim();
                    
                    if !path.is_empty() && PathBuf::from(path).exists() {
                        return Ok(Some(path.to_string()));
                    }
                }
            }
        }
    }
    
    Ok(None)
}

#[cfg(target_os = "windows")]
fn check_steam_running(is_installed: bool) -> Result<bool, String> {
    if !is_installed {
        return Ok(false);
    }
    
    let output = crate::utils::windows::execute_powershell(&[
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Get-Process -Name 'steam' -ErrorAction SilentlyContinue | Select-Object -First 1",
    ])
    .map_err(|e| e.to_string())?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(!stdout.trim().is_empty())
}

#[cfg(target_os = "windows")]
fn parse_steam_user_info(install_path: &str) -> Result<(Option<String>, Option<String>), String> {
    use std::fs;
    use std::path::PathBuf;
    
    let loginusers_path = PathBuf::from(install_path)
        .join("config")
        .join("loginusers.vdf");
    
    if !loginusers_path.exists() {
        return Ok((None, None));
    }
    
    let content = fs::read_to_string(&loginusers_path)
        .map_err(|e| format!("Failed to read loginusers.vdf: {}", e))?;
    
    let mut current_id: Option<String> = None;
    let mut current_name: Option<String> = None;
    let mut is_most_recent = false;
    
    for line in content.lines() {
        let line = line.trim();
        
        // Find Steam ID (17 digit number in quotes)
        if line.starts_with('"') && line.ends_with('"') {
            let id = line.trim_matches('"');
            if id.len() == 17 && id.chars().all(|c| c.is_numeric()) {
                current_id = Some(id.to_string());
                current_name = None;
                is_most_recent = false;
            }
        }
        
        // Find PersonaName
        if line.contains("\"PersonaName\"") {
            if let Some(name_part) = line.split("\"PersonaName\"").nth(1) {
                if let Some(name) = name_part.split('"').nth(1) {
                    current_name = Some(name.to_string());
                }
            }
        }
        
        // Check if MostRecent
        if line.contains("\"MostRecent\"") && line.contains("\"1\"") {
            is_most_recent = true;
        }
        
        // If we found a complete most recent user, return it
        if is_most_recent && current_id.is_some() && current_name.is_some() {
            return Ok((current_id, current_name));
        }
    }
    
    Ok((None, None))
}
