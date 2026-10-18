/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS_BASE_SEPOLIA?: string;
  readonly VITE_CONTRACT_ADDRESS_SEPOLIA?: string;
  readonly VITE_DEPLOY_BLOCK_BASE_SEPOLIA?: string;
  readonly VITE_DEPLOY_BLOCK_SEPOLIA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
