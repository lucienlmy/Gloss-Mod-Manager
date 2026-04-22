/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly GLOSS_MOD_KEY: string;
    readonly MODID_KEY: string;
    readonly MODID_UID_KEY: string;
    readonly CURSE_FORGE_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
