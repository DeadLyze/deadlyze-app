use tauri::Emitter;
use crate::app::set_window_opacity;

pub fn show_window(window: &tauri::WebviewWindow) {
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
        if window.is_minimized().unwrap_or(false) {
            let _ = window.unminimize();
        }
    }
    
    let _ = window.emit("load-saved-opacity", ());
    let _ = window.set_ignore_cursor_events(false);
}

pub fn hide_window(app: &tauri::AppHandle, window: &tauri::WebviewWindow) {
    let _ = set_window_opacity(app.clone(), 0.0);
    let _ = window.set_ignore_cursor_events(true);
}
