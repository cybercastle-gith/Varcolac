const os = process.platform;

console.log("");
console.log("======================================");
console.log("     Projeto Werewolf - Android Setup");
console.log("======================================");
console.log("");
console.log("Sistema detectado:");

if (os === "win32") {
  console.log("1) Windows");
} else if (os === "linux") {
  console.log("2) Linux");
} else {
  console.log(`Sistema não suportado automaticamente: ${os}`);
  process.exit(1);
}

console.log("");

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Pressione ENTER para configurar este sistema ou digite 1/2 para confirmar: ", async (answer) => {
  rl.close();

  const choice = answer.trim();

  if (os === "win32") {
    if (choice && choice !== "1") {
      console.log("Cancelado.");
      process.exit(0);
    }

    console.log("\nConfigurando Windows...\n");

    const { execSync } = require("child_process");

    try {
      execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -Command "& {
          $androidSdk = Join-Path $env:LOCALAPPDATA 'Android\\Sdk';

          if (-not (Test-Path $androidSdk)) {
            Write-Host 'ERRO: Android SDK não encontrado:';
            Write-Host $androidSdk;
            exit 1;
          }

          [Environment]::SetEnvironmentVariable(
            'ANDROID_HOME',
            $androidSdk,
            'User'
          );

          $userPath = [Environment]::GetEnvironmentVariable('Path', 'User');

          $androidPaths = @(
            (Join-Path $androidSdk 'platform-tools'),
            (Join-Path $androidSdk 'emulator'),
            (Join-Path $androidSdk 'cmdline-tools\\latest\\bin')
          );

          foreach ($path in $androidPaths) {
            if ((Test-Path $path) -and ($userPath -notlike ('*' + $path + '*'))) {
              $userPath += ';' + $path;
            }
          }

          [Environment]::SetEnvironmentVariable(
            'Path',
            $userPath,
            'User'
          );

          $env:ANDROID_HOME = $androidSdk;
          $env:Path = $userPath + ';' + (Join-Path $androidSdk 'platform-tools');

          Write-Host '';
          Write-Host '[OK] Android SDK:' $androidSdk;
          Write-Host '';
          Write-Host '[OK] ADB:';
          adb --version;

          Write-Host '';
          Write-Host '[OK] Dispositivos:';
          adb devices;
        }"`,
        { stdio: "inherit" }
      );

      console.log("\n======================================");
      console.log("Windows configurado!");
      console.log("======================================\n");
    } catch {
      console.error("\nErro durante a configuração.");
      process.exit(1);
    }

    return;
  }

  if (os === "linux") {
    if (choice && choice !== "2") {
      console.log("Cancelado.");
      process.exit(0);
    }

    console.log("\nConfigurando Linux...\n");

    const { execSync } = require("child_process");
    const home = process.env.HOME;

    const possibleSdks = [
      process.env.ANDROID_HOME,
      `${home}/Android/Sdk`,
      `${home}/Android/sdk`,
    ].filter(Boolean);

    let androidSdk = null;

    for (const sdk of possibleSdks) {
      const fs = require("fs");

      if (fs.existsSync(`${sdk}/platform-tools/adb`)) {
        androidSdk = sdk;
        break;
      }
    }

    if (!androidSdk) {
      console.error("ERRO: Android SDK não encontrado.");
      console.error("Instale o Android Studio e o Android SDK primeiro.");
      process.exit(1);
    }

    const bashrc = `${home}/.bashrc`;
    const zshrc = `${home}/.zshrc`;

    const lines = [
      `export ANDROID_HOME="${androidSdk}"`,
      `export ANDROID_SDK_ROOT="${androidSdk}"`,
      `export PATH="$PATH:$ANDROID_HOME/platform-tools"`,
      `export PATH="$PATH:$ANDROID_HOME/emulator"`,
      `export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"`,
    ].join("\n");

    const fs = require("fs");

    for (const file of [bashrc, zshrc]) {
      try {
        if (fs.existsSync(file)) {
          const current = fs.readFileSync(file, "utf8");

          if (!current.includes(`export ANDROID_HOME="${androidSdk}"`)) {
            fs.appendFileSync(
              file,
              `\n# Projeto Werewolf Android\n${lines}\n`
            );
          }
        }
      } catch {}
    }

    process.env.ANDROID_HOME = androidSdk;
    process.env.ANDROID_SDK_ROOT = androidSdk;
    process.env.PATH += `:${androidSdk}/platform-tools`;
    process.env.PATH += `:${androidSdk}/emulator`;
    process.env.PATH += `:${androidSdk}/cmdline-tools/latest/bin`;

    try {
      console.log(`[OK] Android SDK: ${androidSdk}`);
      console.log("\n[OK] ADB:");
      execSync("adb --version", { stdio: "inherit" });

      console.log("\n[OK] Dispositivos:");
      execSync("adb devices", { stdio: "inherit" });
    } catch {
      console.error("\nErro ao executar ADB.");
      process.exit(1);
    }

    console.log("\n======================================");
    console.log("Linux configurado!");
    console.log("======================================\n");
  }
});