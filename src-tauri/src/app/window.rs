use tauri::Manager;

/// Sets window opacity (20-100)
#[tauri::command]
pub fn set_window_opacity(app: tauri::AppHandle, opacity: f64) -> Result<(), String> {
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
