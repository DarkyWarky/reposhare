use serde::Deserialize;
use std::fs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Define the structure for each change in the text file
#[derive(Deserialize)]
struct Change {
    line_number: u32,
    text: String,
    operation: String,
}

#[tauri::command]
async fn update_file(file_path: String, changes: Vec<Change>) -> Result<(), String> {
    // Load the file contents, or start with an empty string if the file does not exist
    let contents = fs::read_to_string(&file_path).unwrap_or_else(|_| "".to_string());

    // Split file contents into lines or start with an empty vector if the file was empty
    let mut lines: Vec<String> = if contents.is_empty() {
        Vec::new()
    } else {
        contents.lines().map(String::from).collect()
    };

    // Apply each change
    for change in changes {
        // Ensure line exists in `lines` or add new empty lines if needed
        if (change.line_number as usize) >= lines.len() {
            lines.resize(change.line_number as usize + 1, String::new());
        }

        // Apply the specified operation
        if change.operation == "remove" {
            lines[change.line_number as usize] = String::new();
        } else if change.operation == "add" {
            lines[change.line_number as usize] = change.text.clone();
        }
    }

    // Recombine lines and write them back to the file
    let updated_contents = lines.join("\n");
    fs::write(&file_path, updated_contents).map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init()) // Only necessary plugins
        .invoke_handler(tauri::generate_handler![greet, update_file]) // Register update_file here
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
