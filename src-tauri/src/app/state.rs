use std::sync::Mutex;

/// Global application state
pub struct AppState {
    /// Window hidden flag (via shortcut)
    pub is_hidden: Mutex<bool>,
    /// Last toggle timestamp (for debounce)
    pub last_toggle: Mutex<std::time::Instant>,
    /// Currently registered shortcut
    pub current_shortcut: Mutex<Option<String>>,
    /// Shortcut handling active flag
    pub shortcut_enabled: Mutex<bool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            is_hidden: Mutex::new(false),
            last_toggle: Mutex::new(std::time::Instant::now()),
            current_shortcut: Mutex::new(None),
            shortcut_enabled: Mutex::new(true),
        }
    }
}
