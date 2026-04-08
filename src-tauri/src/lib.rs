use serde::Serialize;
use std::{fs, path::Path};
use tauri::Manager;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileMetadataDto {
    is_file: bool,
    is_directory: bool,
    is_symlink: bool,
    size: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DirEntryDto {
    name: String,
    path: String,
    is_file: bool,
    is_directory: bool,
    is_symlink: bool,
}

fn metadata_to_dto(metadata: &fs::Metadata) -> FileMetadataDto {
    let file_type = metadata.file_type();

    FileMetadataDto {
        is_file: metadata.is_file(),
        is_directory: metadata.is_dir(),
        is_symlink: file_type.is_symlink(),
        size: metadata.len(),
    }
}

fn normalize_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

fn remove_path(path: &Path, recursive: bool) -> Result<(), String> {
    let metadata = fs::symlink_metadata(path).map_err(|error| error.to_string())?;
    let file_type = metadata.file_type();

    if file_type.is_symlink() {
        if path.is_dir() {
            fs::remove_dir(path).map_err(|error| error.to_string())
        } else {
            fs::remove_file(path).map_err(|error| error.to_string())
        }
    } else if metadata.is_dir() {
        if recursive {
            fs::remove_dir_all(path).map_err(|error| error.to_string())
        } else {
            fs::remove_dir(path).map_err(|error| error.to_string())
        }
    } else {
        fs::remove_file(path).map_err(|error| error.to_string())
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn native_fs_exists(path: String) -> Result<bool, String> {
    Path::new(&path)
        .try_exists()
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn native_fs_mkdir(path: String, recursive: bool) -> Result<(), String> {
    if recursive {
        fs::create_dir_all(&path).map_err(|error| error.to_string())
    } else {
        fs::create_dir(&path).map_err(|error| error.to_string())
    }
}

#[tauri::command]
fn native_fs_read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|error| error.to_string())
}

#[tauri::command]
fn native_fs_write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|error| error.to_string())
}

#[tauri::command]
fn native_fs_read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|error| error.to_string())
}

#[tauri::command]
fn native_fs_write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    fs::write(&path, contents).map_err(|error| error.to_string())
}

#[tauri::command]
fn native_fs_copy_file(source: String, target: String) -> Result<(), String> {
    fs::copy(&source, &target)
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn native_fs_rename(source: String, target: String) -> Result<(), String> {
    fs::rename(&source, &target).map_err(|error| error.to_string())
}

#[tauri::command]
fn native_fs_remove(path: String, recursive: bool) -> Result<(), String> {
    remove_path(Path::new(&path), recursive)
}

#[tauri::command]
fn native_fs_stat(path: String) -> Result<FileMetadataDto, String> {
    let metadata = fs::metadata(&path).map_err(|error| error.to_string())?;
    Ok(metadata_to_dto(&metadata))
}

#[tauri::command]
fn native_fs_lstat(path: String) -> Result<FileMetadataDto, String> {
    let metadata = fs::symlink_metadata(&path).map_err(|error| error.to_string())?;
    Ok(metadata_to_dto(&metadata))
}

#[tauri::command]
fn native_fs_read_dir(path: String) -> Result<Vec<DirEntryDto>, String> {
    let mut entries = Vec::new();

    for entry_result in fs::read_dir(&path).map_err(|error| error.to_string())? {
        let entry = entry_result.map_err(|error| error.to_string())?;
        let entry_path = entry.path();
        let metadata = fs::symlink_metadata(&entry_path).map_err(|error| error.to_string())?;
        let file_type = metadata.file_type();

        entries.push(DirEntryDto {
            name: entry.file_name().to_string_lossy().to_string(),
            path: normalize_path(&entry_path),
            is_file: metadata.is_file(),
            is_directory: metadata.is_dir(),
            is_symlink: file_type.is_symlink(),
        });
    }

    Ok(entries)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("could not resolve app local data path")
                .join("stronghold-salt.txt");

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                app.handle().plugin(tauri_plugin_cli::init())?;
                app.handle().plugin(tauri_plugin_positioner::init())?;
                app.handle()
                    .plugin(tauri_plugin_autostart::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_persisted_scope::init())?;
                app.handle()
                    .plugin(tauri_plugin_window_state::Builder::default().build())?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            native_fs_exists,
            native_fs_mkdir,
            native_fs_read_text_file,
            native_fs_write_text_file,
            native_fs_read_binary_file,
            native_fs_write_binary_file,
            native_fs_copy_file,
            native_fs_rename,
            native_fs_remove,
            native_fs_stat,
            native_fs_lstat,
            native_fs_read_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
