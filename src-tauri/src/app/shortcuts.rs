use tauri::Manager;
use crate::app::state::AppState;

/// Registers global shortcut (unregisters previous)
#[tauri::command]
pub fn register_shortcut(app: tauri::AppHandle, shortcut: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
    
    let state = app.state::<AppState>();
    
    let _ = app.global_shortcut().unregister_all();
    
    let parsed_shortcut: Shortcut = shortcut
        .parse()
        .map_err(|e| format!("Invalid shortcut: {:?}", e))?;
    
    app.global_shortcut()
        .register(parsed_shortcut)
        .map_err(|e| e.to_string())?;
    
    *state.current_shortcut.lock().unwrap() = Some(shortcut);
    
    Ok(())
}

/// Temporarily disables shortcut handling (used during editing)
#[tauri::command]
pub fn disable_shortcut(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    *state.shortcut_enabled.lock().unwrap() = false;
    Ok(())
}

/// Re-enables shortcut handling
#[tauri::command]
pub fn enable_shortcut(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();
    *state.shortcut_enabled.lock().unwrap() = true;
    Ok(())
}
