#[cfg(target_os = "windows")]
pub const CREATE_NO_WINDOW: u32 = 0x08000000;

pub const STEAM_ID_BASE: u64 = 76561197960265728;

/// Converts Steam ID64 to Steam ID3 (account ID)
pub fn steamid64_to_steamid3(steamid64: u64) -> Result<u32, String> {
    if steamid64 < STEAM_ID_BASE {
        return Ok(steamid64 as u32);
    }
    
    let account_id = steamid64
        .checked_sub(STEAM_ID_BASE)
        .ok_or_else(|| format!("Invalid Steam ID64: {}", steamid64))?;
    
    u32::try_from(account_id)
        .map_err(|_| format!("Steam ID3 overflow: {}", account_id))
}

#[cfg(target_os = "windows")]
pub mod windows {
    use std::process::Command;
    use std::os::windows::process::CommandExt;
    
    /// Executes a PowerShell command without showing a window
    pub fn execute_powershell(args: &[&str]) -> Result<std::process::Output, std::io::Error> {
        Command::new("powershell")
            .args(args)
            .creation_flags(super::CREATE_NO_WINDOW)
            .output()
    }
    
    /// Executes a PowerShell web request and returns the content as string
    pub fn execute_web_request(url: &str) -> Result<String, Box<dyn std::error::Error>> {
        let output = execute_powershell(&[
            "-NoProfile",
            "-Command",
            &format!("(Invoke-WebRequest -Uri '{}' -UseBasicParsing).Content", url)
        ])?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("PowerShell request failed: {}", stderr).into());
        }
        
        Ok(String::from_utf8(output.stdout)?.trim().to_string())
    }
}
