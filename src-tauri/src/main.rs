// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod match_parser;
mod app;
mod game;
mod handlers;
mod commands;
mod utils;

use tauri::Manager;
use app::AppState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
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
                        
                        if is_minimized || *is_hidden {
                            handlers::show_window(&window);
                            *is_hidden = false;
                        } else {
                            handlers::hide_window(app, &window);
                            *is_hidden = true;
                            
                            // Focus Deadlock game after hiding
                            #[cfg(target_os = "windows")]
                            {
                                std::thread::spawn(|| {
                                    use windows::Win32::UI::WindowsAndMessaging::{FindWindowW, SetForegroundWindow};
                                    use windows::core::PCWSTR;
                                    
                                    unsafe {
                                        let window_name: Vec<u16> = "Deadlock\0".encode_utf16().collect();
                                        if let Ok(hwnd) = FindWindowW(PCWSTR::null(), PCWSTR(window_name.as_ptr())) {
                                            if !hwnd.0.is_null() {
                                                let _ = SetForegroundWindow(hwnd);
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    }
                })
                .build()
        )
        .setup(|app| {
            app.manage(AppState::default());
            handlers::setup_window_events(app);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app::window::set_window_opacity,
            app::shortcuts::register_shortcut,
            app::shortcuts::disable_shortcut,
            app::shortcuts::enable_shortcut,
            app::filesystem::open_app_folder,
            game::deadlock::launch_deadlock,
            game::deadlock::is_deadlock_running,
            game::steam::get_steam_info,
            commands::match_commands::fetch_match_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
