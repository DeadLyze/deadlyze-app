// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{Emitter, Manager};

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
            open_app_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
