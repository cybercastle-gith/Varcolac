import { View, Text, Pressable, Switch } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MODULOS_DE_FANTASMA, type EventFrequency, type WolfCountVisibility } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { TelaOperacao, Rolagem, Botao, Rotulo, Titulo, Pequeno } from '../../components/ui';
import { cores, espaco, raio, tipografia, alvoMinimo } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Sistemas'>;

function Linha({ titulo, descricao, direita }: {
  titulo: string;
  descricao?: string;
  direita: React.ReactNode;
}) {
  return (
    <View
      style={{
        minHeight: alvoMinimo,
        flexDirection: 'row',
        alignItems: 'center',
        gap: espaco.md,
        paddingVertical: espaco.sm,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[tipografia.corpo, { color: cores.linhoCru }]}>{titulo}</Text>
        {descricao ? (
          <Text style={[tipografia.pequeno, { color: cores.ferrugem }]}>{descricao}</Text>
        ) : null}
      </View>
      {direita}
    </View>
  );
}

function Opcoes<T extends string>({ valor, onChange, opcoes }: {
  valor: T;
  onChange: (v: T) => void;
  opcoes: readonly { valor: T; rotulo: string }[];
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onChange(o.valor)}
            style={{
              minHeight: 40,
              paddingHorizontal: espaco.md,
              justifyContent: 'center',
              borderRadius: raio.padrao,
              borderWidth: 1,
              borderColor: ativo ? cores.garanca : '#3E362E',
              backgroundColor: ativo ? '#241A17' : 'transparent',
            }}
          >
            <Text
              style={[
                tipografia.pequeno,
                { color: ativo ? cores.linhoCru : cores.ferrugem },
              ]}
            >
              {o.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Tela 6 — Sistemas. É o coração do produto: o host não escolhe um baralho,
 * ele monta uma experiência.
 */
export function SistemasScreen({ navigation }: Props) {
  const { config, setConfig } = useJogo();

  return (
    <TelaOperacao>
      <Rolagem>
        <Rotulo>Passo 3 de 4</Rotulo>
        <Titulo>Como a mesa joga</Titulo>

        <Linha
          titulo="Revelar a função ao morrer"
          descricao="Quando alguém morre, a mesa descobre o que ele era."
          direita={
            <Switch
              value={config.revelarRoleAoMorrer}
              onValueChange={(v) => setConfig({ revelarRoleAoMorrer: v })}
              trackColor={{ true: cores.garanca, false: '#3E362E' }}
              thumbColor={cores.linhoCru}
            />
          }
        />

        <Linha
          titulo="Contagem de lobos"
          descricao="Quanto a mesa sabe sobre o tamanho da matilha."
          direita={null}
        />
        <Opcoes<WolfCountVisibility>
          valor={config.contagemDeLobos}
          onChange={(contagemDeLobos) => setConfig({ contagemDeLobos })}
          opcoes={[
            { valor: 'publica', rotulo: 'Pública' },
            { valor: 'faixa', rotulo: 'Faixa' },
            { valor: 'oculta', rotulo: 'Oculta' },
          ]}
        />

        <Linha
          titulo="Eventos"
          descricao="Não deixam o jogo mais justo — deixam mais imprevisível."
          direita={null}
        />
        <Opcoes<EventFrequency>
          valor={config.frequenciaEventos}
          onChange={(frequenciaEventos) => setConfig({ frequenciaEventos })}
          opcoes={[
            { valor: 'desligado', rotulo: 'Desligado' },
            { valor: 'raro', rotulo: 'Raro' },
            { valor: 'frequente', rotulo: 'Frequente' },
            { valor: 'caotico', rotulo: 'Caótico' },
          ]}
        />

        <Linha titulo="Votação" direita={null} />
        <Opcoes
          valor={config.votacao}
          onChange={(votacao) => setConfig({ votacao })}
          opcoes={[
            { valor: 'simultanea' as const, rotulo: 'Simultânea' },
            { valor: 'secreta' as const, rotulo: 'Secreta' },
          ]}
        />

        <Linha
          titulo="Tempo de discussão"
          descricao="Teto prático de 3 minutos, por experiência de mesa."
          direita={null}
        />
        <Opcoes
          valor={String(config.tempoDiscussaoSegundos)}
          onChange={(v) => setConfig({ tempoDiscussaoSegundos: Number(v) })}
          opcoes={[
            { valor: '90', rotulo: '1m30' },
            { valor: '120', rotulo: '2m' },
            { valor: '180', rotulo: '3m' },
            { valor: '300', rotulo: '5m' },
          ]}
        />

        <View style={{ height: espaco.md }} />
        <Rotulo>Módulos de fantasma</Rotulo>
        <Pequeno>
          Quem morre continua na mesa, ouvindo tudo e proibido de falar. Estes módulos dão a
          essa pessoa um canal silencioso.
        </Pequeno>

        {MODULOS_DE_FANTASMA.map((m) => (
          <Linha
            key={m.id}
            titulo={`${m.nome}`}
            descricao={m.descricao}
            direita={
              <Switch
                value={config.modulosDeFantasma.includes(m.id)}
                onValueChange={(on) =>
                  setConfig({
                    modulosDeFantasma: on
                      ? [...config.modulosDeFantasma, m.id]
                      : config.modulosDeFantasma.filter((x) => x !== m.id),
                  })
                }
                trackColor={{ true: cores.garanca, false: '#3E362E' }}
                thumbColor={cores.linhoCru}
              />
            }
          />
        ))}
      </Rolagem>

      <View style={{ padding: espaco.lg }}>
        <Botao onPress={() => navigation.navigate('Revisao')}>Revisar e começar</Botao>
      </View>
    </TelaOperacao>
  );
}
