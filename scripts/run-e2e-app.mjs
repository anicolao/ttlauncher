import { spawn, spawnSync } from 'node:child_process';

const environment = {
  ...process.env,
  PUBLIC_DATA_MODE: 'firebase',
  PUBLIC_FIREBASE_API_KEY: 'ttlauncher-emulator-key',
  PUBLIC_FIREBASE_AUTH_DOMAIN: 'ttlauncher-e2e.firebaseapp.com',
  PUBLIC_FIREBASE_PROJECT_ID: 'ttlauncher-e2e',
  PUBLIC_FIREBASE_APP_ID: '1:123456789:web:e2e',
  PUBLIC_USE_FIREBASE_EMULATORS: 'true',
  PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1',
  PUBLIC_FIREBASE_AUTH_EMULATOR_PORT: '9195',
  PUBLIC_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
  PUBLIC_FIRESTORE_EMULATOR_PORT: '8195'
};

const build = spawnSync('npm', ['run', 'build'], { env: environment, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

const server = spawn('npm', ['run', 'preview'], { env: environment, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
server.on('exit', (code) => process.exit(code ?? 0));
