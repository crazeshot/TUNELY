use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::process::Child;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::Manager;

fn is_port_in_use(port: u16) -> bool {
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    TcpStream::connect_timeout(&addr, Duration::from_millis(300)).is_ok()
}

fn find_backend_executable(app: &tauri::AppHandle) -> Option<PathBuf> {
    let bin_name = if cfg!(windows) { "tunely-backend.exe" } else { "tunely-backend" };
    let arch_bin_name = if cfg!(windows) {
        "tunely-backend-x86_64-pc-windows-msvc.exe"
    } else if cfg!(target_arch = "aarch64") {
        "tunely-backend-aarch64-apple-darwin"
    } else {
        "tunely-backend-x86_64-apple-darwin"
    };

    let mut candidate_dirs: Vec<PathBuf> = Vec::new();

    // 1. Next to the main executable (in MacOS folder of .app on mac, or release folder on windows)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(dir) = exe_path.parent() {
            candidate_dirs.push(dir.to_path_buf());
            candidate_dirs.push(dir.join("../MacOS"));
            candidate_dirs.push(dir.join("../Resources"));
            candidate_dirs.push(dir.join("../Resources/binaries"));
        }
    }

    // 2. In resource directory
    if let Ok(res_dir) = app.path().resource_dir() {
        candidate_dirs.push(res_dir.clone());
        candidate_dirs.push(res_dir.join("binaries"));
        candidate_dirs.push(res_dir.join("../MacOS"));
    }

    // 3. Dev & working directory paths
    if let Ok(cwd) = std::env::current_dir() {
        candidate_dirs.push(cwd.clone());
        candidate_dirs.push(cwd.join("binaries"));
        candidate_dirs.push(cwd.join("src-tauri/binaries"));
        candidate_dirs.push(cwd.join("../src-tauri/binaries"));
        candidate_dirs.push(cwd.join("backend/dist"));
        candidate_dirs.push(cwd.join("../backend/dist"));
        candidate_dirs.push(cwd.join("../../backend/dist"));
    }

    let bin_names = [bin_name, arch_bin_name];

    for dir in &candidate_dirs {
        for name in &bin_names {
            let full_path = dir.join(name);
            if full_path.is_file() {
                if let Ok(canonical) = full_path.canonicalize() {
                    return Some(canonical);
                }
                return Some(full_path);
            }
        }
    }

    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let backend_child: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let backend_child_clone = Arc::clone(&backend_child);

    let app = tauri::Builder::default()
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Check if backend is already running on port 8000
            if is_port_in_use(8000) {
                log::info!("Backend server is already active on 127.0.0.1:8000.");
            } else if let Some(backend_bin) = find_backend_executable(app.handle()) {
                log::info!("Starting backend sidecar from {:?}", backend_bin);

                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if let Ok(metadata) = std::fs::metadata(&backend_bin) {
                        let mut perms = metadata.permissions();
                        let mode = perms.mode();
                        if mode & 0o111 == 0 {
                            perms.set_mode(mode | 0o755);
                            let _ = std::fs::set_permissions(&backend_bin, perms);
                        }
                    }
                }

                let mut cmd = std::process::Command::new(&backend_bin);
                if let Some(parent) = backend_bin.parent() {
                    cmd.current_dir(parent);
                }

                cmd.stdin(std::process::Stdio::null());

                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
                }

                match cmd.spawn() {
                    Ok(child) => {
                        log::info!("Backend sidecar spawned successfully (PID: {}).", child.id());
                        *backend_child.lock().unwrap() = Some(child);
                    }
                    Err(err) => {
                        log::error!("Failed to spawn backend sidecar: {}", err);
                    }
                }
            } else {
                log::warn!("No backend sidecar binary found. Assuming external or dev server on port 8000.");
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(move |_app_handle, event| match event {
        tauri::RunEvent::Exit | tauri::RunEvent::ExitRequested { .. } => {
            if let Some(mut child) = backend_child_clone.lock().unwrap().take() {
                log::info!("Terminating backend sidecar...");
                let _ = child.kill();
            }
        }
        _ => {}
    });
}

