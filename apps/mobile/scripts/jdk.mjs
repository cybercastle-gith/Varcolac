import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Acha uma JDK que o Gradle deste projeto aceite.
 *
 * O React Native 0.81 traz o Gradle 8.14, e **Gradle 8.x não roda em JDK 25**.
 * A máquina pode ter três JDKs instaladas e nenhuma servir — foi o caso aqui: a
 * do sistema e a do Android Studio eram 25, e o build nem começava.
 *
 * O erro do Gradle nesse caso ("Unsupported class file major version") não diz
 * qual versão instalar, então a checagem acontece ANTES, com a resposta pronta.
 */

/** Versão máxima de Java que cada geração do Gradle aceita. */
const TETO_POR_GRADLE = [
  { minimo: 9, teto: 25 },
  { minimo: 8.14, teto: 24 },
  { minimo: 8.10, teto: 23 },
  { minimo: 8.8, teto: 22 },
  { minimo: 8.5, teto: 21 },
  { minimo: 8, teto: 20 },
];

/** O RN recomenda 17; 21 é a outra LTS que o ecossistema testa. */
const RECOMENDADAS = [17, 21];

export function versaoDoGradle(raizAndroid) {
  const props = path.join(raizAndroid, 'gradle/wrapper/gradle-wrapper.properties');
  if (!existsSync(props)) return null;
  const m = /gradle-(\d+)\.(\d+)/.exec(readFileSync(props, 'utf8'));
  return m ? Number(`${m[1]}.${m[2]}`) : null;
}

export function tetoDeJava(gradle) {
  if (!gradle) return 21;
  return TETO_POR_GRADLE.find((g) => gradle >= g.minimo)?.teto ?? 20;
}

/** Lê o major de uma JDK a partir do executável. */
function majorDe(javaExe) {
  const r = spawnSync(javaExe, ['-version'], { encoding: 'utf8' });
  const saida = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const m = /version "(\d+)(?:\.(\d+))?/.exec(saida);
  if (!m) return null;
  const primeiro = Number(m[1]);
  // Java 8 se anuncia como "1.8.0"; da 9 em diante o primeiro número é o major.
  return primeiro === 1 ? Number(m[2] ?? 0) : primeiro;
}

/** Onde procurar JDKs, em ordem de preferência. */
function candidatos() {
  const dirs = [];
  const empurrar = (d) => {
    if (d && existsSync(path.join(d, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) {
      dirs.push(d);
    }
  };

  empurrar(process.env.JAVA_HOME);

  // Instalações em massa: Adoptium, Java, Zulu, Microsoft.
  const raizes =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Eclipse Adoptium',
          'C:\\Program Files\\Java',
          'C:\\Program Files\\Zulu',
          'C:\\Program Files\\Microsoft',
          'C:\\Program Files\\Amazon Corretto',
        ]
      : ['/usr/lib/jvm', '/Library/Java/JavaVirtualMachines'];

  for (const raiz of raizes) {
    if (!existsSync(raiz)) continue;
    for (const nome of readdirSync(raiz)) {
      empurrar(path.join(raiz, nome));
      // No macOS o JDK fica um nível mais fundo.
      empurrar(path.join(raiz, nome, 'Contents', 'Home'));
    }
  }

  // A JBR do Android Studio, que é a última opção: costuma ser nova demais.
  const jbr =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Android\\Android Studio\\jbr',
          path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Android Studio', 'jbr'),
        ]
      : ['/Applications/Android Studio.app/Contents/jbr/Contents/Home'];
  for (const d of jbr) empurrar(d);

  return dirs;
}

/**
 * Devolve `{ javaHome, major }` da melhor JDK disponível, ou `null`.
 * Prefere as LTS recomendadas; se não houver, aceita qualquer uma dentro do teto.
 */
export function acharJdk(teto) {
  const achadas = [];
  for (const dir of candidatos()) {
    const exe = path.join(dir, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    const major = majorDe(exe);
    if (major) achadas.push({ javaHome: dir, major });
  }

  const compativeis = achadas.filter((j) => j.major >= 17 && j.major <= teto);
  const preferida = compativeis.find((j) => RECOMENDADAS.includes(j.major));

  return { escolhida: preferida ?? compativeis[0] ?? null, achadas };
}

/**
 * Garante uma JDK utilizável e devolve o ambiente para o processo filho.
 * Encerra com uma mensagem acionável quando não há nenhuma.
 */
export function ambienteComJdk(raizAndroid) {
  const gradle = versaoDoGradle(raizAndroid);
  const teto = tetoDeJava(gradle);
  const { escolhida, achadas } = acharJdk(teto);

  if (!escolhida) {
    console.error(
      `\nNenhuma JDK compatível encontrada.\n\n` +
        `  O Gradle ${gradle ?? '8.x'} deste projeto aceita Java 17 a ${teto}.\n` +
        (achadas.length > 0
          ? `  Instaladas nesta máquina: ${achadas.map((j) => j.major).join(', ')}.\n`
          : '  Nenhuma JDK foi encontrada nos caminhos usuais.\n') +
        `\n  Instale a JDK 17 (LTS) e rode de novo:\n` +
        `    winget install EclipseAdoptium.Temurin.17.JDK\n` +
        `  ou pelo Android Studio: Settings → Build Tools → Gradle → Gradle JDK → Download JDK 17.\n`,
    );
    process.exit(1);
  }

  if (!RECOMENDADAS.includes(escolhida.major)) {
    console.warn(
      `\n  Usando Java ${escolhida.major}. O React Native é testado com 17 e 21 —` +
        ' se o build falhar, essa é a primeira suspeita.\n',
    );
  } else {
    console.log(`  Java ${escolhida.major} · ${escolhida.javaHome}\n`);
  }

  return {
    ...process.env,
    JAVA_HOME: escolhida.javaHome,
    // O Gradle olha esta variável antes do JAVA_HOME em alguns caminhos.
    ORG_GRADLE_JAVA_HOME: escolhida.javaHome,
  };
}
