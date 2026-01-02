// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

/// Global application state
struct AppState {
    /// Window hidden flag (via shortcut)
    is_hidden: Mutex<bool>,
    /// Last toggle timestamp (for debounce)
    last_toggle: Mutex<std::time::Instant>,
    /// Currently registered shortcut
    current_shortcut: Mutex<Option<String>>,
    /// Shortcut handling active flag
    shortcut_enabled: Mutex<bool>,
}

/// Sets window opacity (20-100)
#[tauri::command]
fn set_window_opacity(app: tauri::AppHandle, opacity: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            use windows::Win32::Foundation::{HWND, COLORREF};
            use windows::Win32::UI::WindowsAndMessaging::{
                GetWindowLongW, SetWindowLongW, SetLayeredWindowAttributes,
                GWL_EXSTYLE, LWA_ALPHA, WS_EX_LAYERED,
            };

            let hwnd = window.hwnd().map_err(|e| e.to_string())?;
            let hwnd = HWND(hwnd.0);

            unsafe {
                let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
                SetWindowLongW(hwnd, GWL_EXSTYLE, ex_style | WS_EX_LAYERED.0 as i32);
                
                let alpha = ((opacity / 100.0) * 255.0) as u8;
                SetLayeredWindowAttributes(hwnd, COLORREF(0), alpha, LWA_ALPHA)
                    .ok()
                    .ok_or_else(|| "Failed to set window opacity".to_string())?;
            }
        }
        Ok(())
    } else {
        Err("Window not found".to_string())
    }
}

/// Registers global shortcut (unregisters previous)
#[tauri::command]
fn register_shortcut(app: tauri::AppHandle, shortcut: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    let state = app.state::<AppState>();
    
    let _ = app.global_shortcut().unregister_all();
    
    let parsed_shortcut: Shortcut = shortcut.parse().map_err(|e| format!("Invalid shortcut: {:?}", e))?;
    
    app.global_shortcut()
        .register(parsed_shortcut)
        .map_err(|e| e.to_string())?;
    
    *state.current_shortcut.lock().unwrap() = Some(shortcut);
    
    Ok(())
}

/// Temporarily disables shortcut handling (used during editing)
#[tauri::command]
fn disable_shortcut(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    *state.shortcut_enabled.lock().unwrap() = false;
    Ok(())
}

/// Re-enables shortcut handling
#[tauri::command]
fn enable_shortcut(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    *state.shortcut_enabled.lock().unwrap() = true;
    Ok(())
}

/// Opens the application data folder in file explorer
#[tauri::command]
fn open_app_folder(app: tauri::AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(app_data_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(app_data_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(app_data_dir)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}

/// Launches Deadlock game via Steam (App ID: 1422450)
#[tauri::command]
fn launch_deadlock() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        std::process::Command::new("cmd")
            .args(["/C", "start", "steam://rungameid/1422450"])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

/// Checks if Deadlock game is currently running
#[tauri::command]
fn is_deadlock_running() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        let output = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Get-Process -Name 'project8' -ErrorAction SilentlyContinue | Select-Object -First 1",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| e.to_string())?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(!stdout.trim().is_empty())
    }

    #[cfg(not(target_os = "windows"))]
    Ok(false)
}

#[derive(serde::Serialize)]
struct SteamInfo {
    is_installed: bool,
    install_path: Option<String>,
    steam_id64: Option<String>,
    persona_name: Option<String>,
    is_running: bool,
}

/// Detects Steam installation and current user
#[tauri::command]
fn get_steam_info() -> Result<SteamInfo, String> {
    #[cfg(target_os = "windows")]
    {
        use std::fs;
        use std::path::PathBuf;
        
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        // Try to find Steam path from registry
        let registry_paths = [
            r"HKEY_CURRENT_USER\Software\Valve\Steam",
            r"HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Valve\Steam",
            r"HKEY_LOCAL_MACHINE\SOFTWARE\Valve\Steam",
        ];
        
        let mut install_path: Option<String> = None;
        
        for reg_path in registry_paths.iter() {
            let output = std::process::Command::new("reg")
                .args(["query", reg_path, "/v", "InstallPath", "/t", "REG_SZ"])
                .creation_flags(CREATE_NO_WINDOW)
                .output();
            
            if let Ok(output) = output {
                let stdout = String::from_utf8_lossy(&output.stdout);
                
                if let Some(line) = stdout.lines().find(|l| l.contains("InstallPath")) {
                    if let Some(path) = line.split("REG_SZ").nth(1) {
                        let path = path.trim();
                        
                        if !path.is_empty() && PathBuf::from(path).exists() {
                            install_path = Some(path.to_string());
                            break;
                        }
                    }
                }
            }
        }
        
        let is_installed = install_path.is_some();
        
        // Check if Steam is running
        let is_running = if is_installed {
            let output = std::process::Command::new("powershell")
                .args([
                    "-NoProfile",
                    "-NonInteractive",
                    "-Command",
                    "Get-Process -Name 'steam' -ErrorAction SilentlyContinue | Select-Object -First 1",
                ])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
                .map_err(|e| e.to_string())?;
            
            let stdout = String::from_utf8_lossy(&output.stdout);
            !stdout.trim().is_empty()
        } else {
            false
        };
        
        // Try to get current Steam user
        let mut steam_id64: Option<String> = None;
        let mut persona_name: Option<String> = None;
        
        if let Some(ref path) = install_path {
            let loginusers_path = PathBuf::from(path).join("config").join("loginusers.vdf");
            
            if loginusers_path.exists() {
                if let Ok(content) = fs::read_to_string(&loginusers_path) {
                    // Parse loginusers.vdf to find the most recent user
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
                        
                        // If we found a complete most recent user, save it
                        if is_most_recent && current_id.is_some() && current_name.is_some() {
                            steam_id64 = current_id.clone();
                            persona_name = current_name.clone();
                            break;
                        }
                    }
                }
            }
        }
        
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, _shortcut, _event| {
                let state = app.state::<AppState>();
                
                let current = state.current_shortcut.lock().unwrap().clone();
                if current.is_none() {
                    return;
                }
                
                let mut last_toggle = state.last_toggle.lock().unwrap();
                let now = std::time::Instant::now();
                
                if now.duration_since(*last_toggle).as_millis() < 200 {
                    return;
                }
                *last_toggle = now;
                drop(last_toggle);
                
                if let Some(window) = app.get_webview_window("main") {
                    let shortcut_enabled = *state.shortcut_enabled.lock().unwrap();
                    if !shortcut_enabled {
                        return;
                    }
                    
                    let mut is_hidden = state.is_hidden.lock().unwrap();
                    let is_minimized = window.is_minimized().unwrap_or(false);
                    
                    // If window is minimized or hidden, show/restore it WITHOUT focus
                    if is_minimized || *is_hidden {
                        // Show window without activating it
                        #[cfg(target_os = "windows")]
                        {
                            use windows::Win32::Foundation::HWND;
                            use windows::Win32::UI::WindowsAndMessaging::{ShowWindow, SW_SHOWNOACTIVATE};
                            
                            if let Ok(hwnd) = window.hwnd() {
                                unsafe {
                                    let _ = ShowWindow(HWND(hwnd.0), SW_SHOWNOACTIVATE);
                                }
                            }
                        }
                        
                        #[cfg(not(target_os = "windows"))]
                        {
                            if is_minimized {
                                let _ = window.unminimize();
                            }
                        }
                        
                        // Restore opacity without focus (overlay behavior)
                        let _ = window.emit("load-saved-opacity", ());
                        let _ = window.set_ignore_cursor_events(false);
                        *is_hidden = false;
                    } else {
                        // Hide window by setting opacity to 0 (simple and stable)
                        let _ = set_window_opacity(app.clone(), 0.0);
                        let _ = window.set_ignore_cursor_events(true);
                        *is_hidden = true;
                    }
                }
            })
            .build())
        .setup(|app| {
            app.manage(AppState {
                is_hidden: Mutex::new(false),
                last_toggle: Mutex::new(std::time::Instant::now()),
                current_shortcut: Mutex::new(None),
                shortcut_enabled: Mutex::new(true),
            });
            
            // Handle window focus event (clicking on taskbar icon shows WITH focus)
            if let Some(window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(focused) = event {
                        if *focused {
                            let state = app_handle.state::<AppState>();
                            let is_hidden = {
                                let hidden = state.is_hidden.lock().unwrap();
                                *hidden
                            };
                            
                            // When window gains focus via taskbar click, restore if hidden
                            if is_hidden {
                                if let Some(win) = app_handle.get_webview_window("main") {
                                    let _ = win.emit("load-saved-opacity", ());
                                    let _ = win.set_ignore_cursor_events(false);
                                    let _ = win.set_focus();
                                    
                                    let mut hidden = state.is_hidden.lock().unwrap();
                                    *hidden = false;
                                }
                            } else {
                                // Just ensure focus for normal minimize/restore
                                if let Some(win) = app_handle.get_webview_window("main") {
                                    let _ = win.set_focus();
                                }
                            }
                        }
                    }
                });
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_window_opacity,
            register_shortcut,
            disable_shortcut,
            enable_shortcut,
            open_app_folder,
            launch_deadlock,
            is_deadlock_running,
            get_steam_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
