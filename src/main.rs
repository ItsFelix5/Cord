/*
 * Cord, a Discord client mod based on Vencord
 * Copyright (c) 2024 Cord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod notifications;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

fn focus(app: &tauri::AppHandle<tauri::Wry>) {
    let window = app
        .get_webview_window("main")
        .expect("No main window found");
    let _ = window.show();
    let _ = window.set_focus();
    let _ = window.unminimize();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| focus(app)))
        .invoke_handler(tauri::generate_handler![notifications::notify])
        .append_invoke_initialization_script(include_str!("../plugin.js"))
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                //todo add config value
                window.hide().unwrap_or_default();
                api.prevent_close();
            }
            _ => {}
        })
        .setup(|app: &mut tauri::App| {
            let open_i = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
            let restart_i = MenuItem::with_id(app, "restart", "Restart", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &restart_i, &quit_i])?;

            TrayIconBuilder::<tauri::Wry>::new()
                .tooltip("Cord")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app: &tauri::AppHandle<_>, event| match event.id.as_ref() {
                    "open" => focus(app),
                    "restart" => app.restart(),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => focus(tray.app_handle()),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
