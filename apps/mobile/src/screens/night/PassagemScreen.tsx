import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTelaAcesa } from '../../hooks/useTelaAcesa';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { role, contagemDeLobosVisivel, type NightAction, type PlayerId } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { SegurarParaRevelar } from '../../components/SegurarParaRevelar';
import { TelaMomento, TelaOperacao, Botao, Titulo, Rotulo, Pequeno, Corpo, ItemJogador } from '../../components/ui';
import { cores, espaco, raio, tipografia, motivoDaFaccao } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Passagem'>;

type Etapa = 'entregar' | 'revelar' | 'agir' | 'sussurro';

/**
 * Telas 8 a 11 — a passagem completa do celular.
 *
 * O fluxo por jogador: "Passe para X" → segurar para revelar (só na noite 1) →
 * ação ou toque falso → bilhete de sussurro. Todos recebem o aparelho, sempre,
 * porque sem isso quem tem poder se revela pela chamada.
 */
export function PassagemScreen({ navigation }: Props) {
  useTelaAcesa();

  const { estado, roteiro, indice, registrarAcao, proximaPassagem } = useJogo();
  const [etapa, setEtapa] = useState<Etapa>('entregar');
  const [alvos, setAlvos] = useState<PlayerId[]>([]);
  const [bilhete, setBilhete] = useState('');
  const [paraQuem, setParaQuem] = useState<PlayerId | null>(null);

  const passagem = roteiro[indice];

  // Cada nova passagem começa do zero, na tela de entrega.
  useEffect(() => {
    setEtapa('entregar');
    setAlvos([]);
    setBilhete('');
    setParaQuem(null);
  }, [indice]);

  // A noite acabou enquanto ninguém estava olhando: segue para o amanhecer.
  useEffect(() => {
    if (estado && estado.fase !== 'noite') {
      navigation.reset({ index: 0, routes: [{ name: 'Amanhecer' }] });
    }
  }, [estado, navigation]);

  if (!estado || !passagem) return <TelaOperacao />;

  const p = passagem.player;
  const r = role(p.roleId);
  const motivo = motivoDaFaccao(r.faccao);
  const nomeDe = (id: PlayerId) => estado.players.find((x) => x.id === id)?.nome ?? '?';

  const avancar = () => {
    void Haptics.selectionAsync();
    if (etapa === 'entregar') return setEtapa(passagem.revelarRole ? 'revelar' : 'agir');
    if (etapa === 'revelar') return setEtapa('agir');
    if (etapa === 'agir') {
      // Registra a ação declarada (ou o toque falso, que não vira ação).
      const pergunta = passagem.pergunta;
      if (!pergunta.falsa && alvos.length > 0) {
        const acao: NightAction = {
          actorId: p.id,
          kind: pergunta.kind,
          etapa: pergunta.etapa!,
          alvos,
          falsa: false,
        };
        registrarAcao(acao);
      }
      return setEtapa(passagem.podeSussurrar ? 'sussurro' : 'entregar');
    }
    // Sussurro: bilhete anônimo de 3 palavras, custo de tempo zero.
    if (bilhete.trim() && paraQuem) {
      registrarAcao({
        actorId: p.id,
        kind: 'sussurro',
        etapa: 'sussurros',
        alvos: [paraQuem],
        texto: bilhete.trim(),
        falsa: false,
      });
    }
    proximaPassagem();
  };

  // ── Entregar ───────────────────────────────────────────────────────────────
  if (etapa === 'entregar') {
    return (
      <Pressable style={{ flex: 1 }} onPress={avancar}>
        <TelaMomento luz={cores.cera}>
          <Rotulo>Passe o aparelho para</Rotulo>
          <Titulo>{p.nome}</Titulo>
          <Pequeno cor={cores.ferrugem}>Ninguém mais deve ver esta tela.</Pequeno>
          <View style={{ height: espaco.xl }} />
          <Text style={{ color: cores.ferrugem, fontSize: 11, letterSpacing: 1.5 }}>
            TOQUE QUANDO ESTIVER COM ELE
          </Text>
        </TelaMomento>
      </Pressable>
    );
  }

  // ── Revelar a função (noite 1) ─────────────────────────────────────────────
  if (etapa === 'revelar') {
    return (
      <TelaMomento luz={cores.chama}>
        <SegurarParaRevelar aviso="Cubra a tela com a mão.">
          <Text style={{ color: motivo.cor, fontSize: 26, marginBottom: espaco.sm }}>
            {motivo.simbolo}
          </Text>
          <Text style={[tipografia.nomeDeRole, { color: cores.linhoCru, textAlign: 'center' }]}>
            {r.nome}
          </Text>
          <Text
            style={[
              tipografia.corpoSerif,
              { color: cores.ferrugem, textAlign: 'center', marginTop: espaco.md },
            ]}
          >
            {r.descricaoCurta}
          </Text>

          {passagem.companheiros.length > 0 && (
            <View style={{ marginTop: espaco.lg, alignItems: 'center' }}>
              <Text style={[tipografia.rotulo, { color: cores.garanca }]}>
                {passagem.rotuloCompanheiros}
              </Text>
              <Text style={[tipografia.corpo, { color: cores.linhoCru, marginTop: 4 }]}>
                {passagem.companheiros.map(nomeDe).join(' · ')}
              </Text>
            </View>
          )}

          <Text
            style={[tipografia.pequeno, { color: cores.ferrugem, marginTop: espaco.xl }]}
          >
            {contagemDeLobosVisivel(estado)}
          </Text>
        </SegurarParaRevelar>

        <View style={{ padding: espaco.lg, width: '100%' }}>
          <Botao onPress={avancar}>Entendi</Botao>
        </View>
      </TelaMomento>
    );
  }

  // ── Sussurro ───────────────────────────────────────────────────────────────
  if (etapa === 'sussurro') {
    const outros = estado.players.filter((x) => x.status === 'vivo' && x.id !== p.id);
    return (
      <TelaOperacao>
        <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
          <Rotulo>Sussurro noturno</Rotulo>
          <Titulo>Três palavras</Titulo>
          <Pequeno>
            Um bilhete anônimo, entregue amanhã de manhã. Se a pessoa morrer antes, o bilhete
            se perde. Pode pular.
          </Pequeno>

          <TextInput
            value={bilhete}
            onChangeText={(t) => setBilhete(t.split(/\s+/).slice(0, 3).join(' '))}
            placeholder="ex.: confie no médico"
            placeholderTextColor="#5C5044"
            style={[
              tipografia.corpo,
              {
                color: cores.linhoCru,
                backgroundColor: '#1D1814',
                borderColor: '#2E2721',
                borderWidth: 1,
                borderRadius: raio.padrao,
                paddingHorizontal: espaco.md,
                minHeight: 48,
              },
            ]}
          />

          <Rotulo>Para quem?</Rotulo>
          <View style={{ gap: espaco.xs }}>
            {outros.map((x) => (
              <ItemJogador
                key={x.id}
                nome={x.nome}
                selecionado={paraQuem === x.id}
                onPress={() => setParaQuem(paraQuem === x.id ? null : x.id)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={{ padding: espaco.lg }}>
          <Botao onPress={avancar}>
            {bilhete.trim() && paraQuem ? 'Enviar e passar adiante' : 'Passar adiante'}
          </Botao>
        </View>
      </TelaOperacao>
    );
  }

  // ── Agir (ou toque falso) ──────────────────────────────────────────────────
  const { pergunta } = passagem;
  const precisaDe = pergunta.tipo === 'dois-alvos' ? 2 : pergunta.tipo === 'alvo' ? 1 : 0;
  const completo = pergunta.opcional || alvos.length >= precisaDe;

  const alternar = (id: PlayerId) => {
    void Haptics.selectionAsync();
    setAlvos((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= precisaDe) return [...atual.slice(1), id];
      return [...atual, id];
    });
  };

  return (
    <TelaOperacao>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Rotulo>{p.nome}</Rotulo>
        <Titulo>{pergunta.titulo}</Titulo>
        <Corpo cor={cores.ferrugem}>{pergunta.detalhe}</Corpo>

        {passagem.recebido.length > 0 && (
          <View
            style={{
              backgroundColor: '#1D1814',
              borderLeftWidth: 2,
              borderLeftColor: cores.cera,
              padding: espaco.md,
              gap: 4,
            }}
          >
            <Text style={[tipografia.rotulo, { color: cores.cera }]}>Você soube</Text>
            {passagem.recebido.map((i, k) => (
              <Text key={k} style={[tipografia.corpoSerif, { color: cores.linhoCru }]}>
                {i.texto}
              </Text>
            ))}
          </View>
        )}

        {pergunta.tipo === 'binaria' && (
          <View style={{ gap: espaco.sm }}>
            {pergunta.opcoes?.map((o) => (
              <Botao
                key={o.valor}
                tom={o.valor === 'sim' ? 'primario' : 'secundario'}
                onPress={() => {
                  if (o.valor === 'sim') {
                    registrarAcao({
                      actorId: p.id,
                      kind: pergunta.kind,
                      etapa: pergunta.etapa!,
                      alvos: [],
                      falsa: false,
                    });
                  }
                  void Haptics.selectionAsync();
                  setEtapa(passagem.podeSussurrar ? 'sussurro' : 'entregar');
                  if (!passagem.podeSussurrar) proximaPassagem();
                }}
              >
                {o.rotulo}
              </Botao>
            ))}
          </View>
        )}

        {(pergunta.tipo === 'alvo' || pergunta.tipo === 'dois-alvos') && (
          <View style={{ gap: espaco.xs }}>
            {pergunta.alvos.map((id) => {
              const alvo = estado.players.find((x) => x.id === id)!;
              return (
                <ItemJogador
                  key={id}
                  nome={alvo.nome}
                  morto={alvo.status === 'morto'}
                  selecionado={alvos.includes(id)}
                  onPress={() => alternar(id)}
                  direita={
                    alvos.includes(id) ? (
                      <Text style={{ color: cores.garanca, fontSize: 16 }}>◆</Text>
                    ) : undefined
                  }
                />
              );
            })}
          </View>
        )}

        {pergunta.tipo === 'nenhuma' && (
          <View style={{ alignItems: 'center', paddingVertical: espaco.xl }}>
            <Text style={{ color: cores.nogueira, fontSize: 34 }}>☽</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ padding: espaco.lg }}>
        {pergunta.tipo !== 'binaria' && (
          <Botao desabilitado={!completo} onPress={avancar}>
            {pergunta.tipo === 'nenhuma'
              ? 'Passar adiante'
              : alvos.length > 0
                ? `Confirmar ${alvos.map(nomeDe).join(' e ')}`
                : pergunta.opcional
                  ? 'Não usar esta noite'
                  : `Escolha ${precisaDe}`}
          </Botao>
        )}
      </View>
    </TelaOperacao>
  );
}
