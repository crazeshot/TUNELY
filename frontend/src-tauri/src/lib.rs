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
    // 1. Next to the main executable (production installed app)
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(dir) = exe_path.parent() {
            let p1 = dir.join("tunely-backend.exe");
            if p1.exists() {
                return Some(p1);
            }
            let p2 = dir.join("tunely-backend-x86_64-pc-windows-msvc.exe");
            if p2.exists() {
                return Some(p2);
            }
        }
    }

    // 2. In resource directory
    if let Ok(res_dir) = app.path().resource_dir() {
        let p = res_dir.join("tunely-backend.exe");
        if p.exists() {
            return Some(p);
        }
        let p_bin = res_dir.join("binaries").join("tunely-backend-x86_64-pc-windows-msvc.exe");
        if p_bin.exists() {
            return Some(p_bin);
        }
    }

    // 3. In relative paths for development
    let dev_paths = [
        "binaries/tunely-backend-x86_64-pc-windows-msvc.exe",
        "src-tauri/binaries/tunely-backend-x86_64-pc-windows-msvc.exe",
        "../src-tauri/binaries/tunely-backend-x86_64-pc-windows-msvc.exe",
        "../../backend/dist/tunely-backend.exe",
        "backend/dist/tunely-backend.exe",
        "../backend/dist/tunely-backend.exe",
    ];

    for rel in &dev_paths {
        let path = PathBuf::from(rel);
        if path.exists() {
            return Some(path);
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
                let mut cmd = std::process::Command::new(&backend_bin);

                #[cfg(windows)]
                {
                    use std::os::windows::process::CommandExt;
                    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
                }

                match cmd.spawn() {
                    Ok(child) => {
                        log::info!("Backend sidecar spawned successfully.");
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

