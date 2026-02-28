const { spawn } = require('child_process');

// The user has ELECTRON_RUN_AS_NODE globally set in their environment variables.
// This completely breaks Electron apps by forcing them to run as standard Node.js processes 
// without the 'electron' application module loaded.
// We explicitly remove it before spawning electron to ensure a clean boot.
delete process.env.ELECTRON_RUN_AS_NODE;

// require('electron') gives the absolute path to the electron binary executable
const electronPath = require('electron');

console.log('Spawning Electron securely without run-as-node interference...');

const child = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: process.env
});

child.on('close', (code) => {
    process.exit(code);
});
