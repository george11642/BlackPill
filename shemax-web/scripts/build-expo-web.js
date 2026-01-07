const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Building Expo web app...');

const webDir = path.join(__dirname, '..');
const mobileDir = path.join(__dirname, '..', '..', 'mobile');
const outputDir = path.join(webDir, 'public', 'app');

// Ensure output directory exists
if (!fs.existsSync(path.join(webDir, 'public'))) {
  fs.mkdirSync(path.join(webDir, 'public'), { recursive: true });
}

// Remove old build if it exists
if (fs.existsSync(outputDir)) {
  console.log('🧹 Cleaning old Expo web build...');
  fs.rmSync(outputDir, { recursive: true, force: true });
}

// Check if mobile directory exists
if (!fs.existsSync(mobileDir)) {
  console.error('❌ Mobile directory not found at:', mobileDir);
  console.error('   Make sure the mobile directory is available in the build environment.');
  process.exit(1);
}

function buildExpo() {
  // Build Expo web app
  console.log('📦 Exporting Expo web app...');
  console.log(`📁 Mobile directory: ${mobileDir}`);
  console.log(`📁 Output directory: ${outputDir}`);

  // Use absolute path for output
  const absoluteOutputDir = path.resolve(outputDir);

  // Use spawn with explicit arguments to avoid shell
  // Try to find npx in node_modules first, then fall back to system npx
  const nodeExecutable = process.execPath;
  const npxPath = path.join(mobileDir, 'node_modules', '.bin', 'npx');

  return new Promise((resolve, reject) => {
    // Track if Promise has been settled to prevent double resolution
    let isSettled = false;
    
    const safeResolve = (value) => {
      if (!isSettled) {
        isSettled = true;
        resolve(value);
      }
    };
    
    const safeReject = (error) => {
      if (!isSettled) {
        isSettled = true;
        reject(error);
      }
    };
    
    // Use modern expo export command with web platform
    const child = spawn('npx', ['expo', 'export', '--platform', 'web', '--output-dir', absoluteOutputDir], {
      stdio: 'inherit',
      cwd: mobileDir,
      env: { ...process.env, NODE_ENV: 'production' },
      shell: true, // Use shell on Windows for better compatibility
    });

    child.on('error', (error) => {
      // If spawn fails, try with require.resolve to find expo CLI directly
      console.log('⚠️  npx not found, trying Expo CLI directly...');
      
      try {
        // First, try to find expo in mobile's node_modules
        let expoCliPath;
        try {
          expoCliPath = require.resolve('expo/package.json', { paths: [mobileDir] });
          expoCliPath = path.join(path.dirname(expoCliPath), '..', 'cli', 'build', 'bin', 'cli.js');
        } catch (e) {
          // Try @expo/cli instead
          expoCliPath = require.resolve('@expo/cli/build/bin/cli.js', { paths: [mobileDir] });
        }
        
        if (!fs.existsSync(expoCliPath)) {
          throw new Error(`Expo CLI not found at ${expoCliPath}`);
        }
        
        console.log(`📦 Using Expo CLI at: ${expoCliPath}`);
        const child2 = spawn(nodeExecutable, [expoCliPath, 'export', '--platform', 'web', '--output-dir', absoluteOutputDir], {
          stdio: 'inherit',
          cwd: mobileDir,
          env: { ...process.env, NODE_ENV: 'production' },
          shell: false,
        });

        child2.on('error', (error2) => {
          console.error('❌ Error spawning Expo build command:', error2.message);
          safeReject(error2);
        });

        child2.on('exit', (code) => {
          if (code === 0) {
            console.log('✅ Expo web app built and copied to web/public/app');
            console.log(`📁 Output directory: ${outputDir}`);
            safeResolve();
          } else {
            safeReject(new Error(`Expo build failed with exit code ${code}`));
          }
        });
      } catch (resolveError) {
        console.error('❌ Error finding Expo CLI:', resolveError.message);
        console.error('   Make sure mobile dependencies are installed');
        safeReject(resolveError);
      }
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log('✅ Expo web app built and copied to web/public/app');
        console.log(`📁 Output directory: ${outputDir}`);
        safeResolve();
      } else if (code !== null) {
        safeReject(new Error(`Expo build failed with exit code ${code}`));
      }
    });
  }).catch((error) => {
    console.error('❌ Error building Expo web app:', error.message);
    process.exit(1);
  });
}

// Check if mobile node_modules exists, install if missing
const mobileNodeModules = path.join(mobileDir, 'node_modules');
const mobilePackageJson = path.join(mobileDir, 'package.json');

if (!fs.existsSync(mobileNodeModules)) {
  console.log('⚠️  Mobile node_modules not found. Installing dependencies...');
  if (!fs.existsSync(mobilePackageJson)) {
    console.error('❌ Mobile package.json not found. Cannot install dependencies.');
    process.exit(1);
  }
  
  // Install mobile dependencies
  console.log('📦 Installing mobile dependencies...');
  const installProcess = spawn('npm', ['install'], {
    stdio: 'inherit',
    cwd: mobileDir,
    env: { ...process.env, NODE_ENV: 'production' },
    shell: true,
  });
  
  installProcess.on('error', (error) => {
    console.error('❌ Error installing mobile dependencies:', error.message);
    process.exit(1);
  });
  
  installProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ npm install failed with exit code ${code}`);
      process.exit(1);
    }
    console.log('✅ Mobile dependencies installed successfully');
    // Continue with build after installation
    buildExpo().catch((error) => {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    });
  });
} else {
  // Dependencies already installed, proceed with build
  buildExpo().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

