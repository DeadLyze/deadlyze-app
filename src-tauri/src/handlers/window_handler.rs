use tauri::{Emitter, Manager};
use crate::app::AppState;

pub fn setup_window_events(app: &tauri::App) {
    if let Some(window) = app.get_webview_window("main") {
        let app_handle = app.handle().clone();
        
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Focused(focused) = event {
                if *focused {
                    handle_window_focus(&app_handle);
                }
            }
        });
    }
}

fn handle_window_focus(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let is_hidden = *state.is_hidden.lock().unwrap();
    
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    
    if is_hidden {
        // Restore window when focused via taskbar
        let _ = window.emit("load-saved-opacity", ());
        let _ = window.set_ignore_cursor_events(false);
        let _ = window.set_focus();
        
        *state.is_hidden.lock().unwrap() = false;
    } else {
        // Ensure focus for normal window operations
        let _ = window.set_focus();
    }
}
