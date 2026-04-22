import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueRouter from "vue-router/vite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => {
    return {
        plugins: [
            vue(),
            VueRouter({
                // Recommended: auto-included by tsconfig
                dts: "src/typed-router.d.ts",
            }),
            tailwindcss(),
            AutoImport({
                imports: ["vue", "vue-router", "@vueuse/core", "pinia"],
                dts: "src/auto-imports.d.ts",
                dirs: ["src/lib", "src/stores"],
            }),
            Components({
                dirs: ["src/components/ui", "src/components"],
                resolvers: [
                    (name) => {
                        if (name.startsWith("Icon")) {
                            return {
                                name: name.slice(4),
                                from: "lucide-vue-next",
                            };
                        }
                    },
                ],
                dts: "src/components.d.ts",
            }),
        ],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        // 兼容项目现有 .env 键名，避免必须改成 VITE_* 前缀。
        envPrefix: ["VITE_", "GLOSS_MOD_", "MODID_", "CURSE_FORGE_"],

        // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
        //
        // 1. prevent Vite from obscuring rust errors
        clearScreen: false,
        // 2. tauri expects a fixed port, fail if that port is not available
        server: {
            port: 1420,
            strictPort: true,
            host: host || false,
            hmr: host
                ? {
                      protocol: "ws",
                      host,
                      port: 1421,
                  }
                : undefined,
            watch: {
                // 3. tell Vite to ignore watching `src-tauri`
                ignored: ["**/src-tauri/**"],
            },
        },
    };
});
