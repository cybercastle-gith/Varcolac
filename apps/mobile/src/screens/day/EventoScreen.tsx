import { useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EVENTOS_POR_ID } from '@jogo/engine';
import type { RootStackParamList } from '../../navigation/types';
import { useJogo } from '../../store/jogo';
import { Ambiente, Material } from '../../components/Ambiente';
import { Revelacao, Aparicao } from '../../components/animacoes';
import { Botao, Rotulo, Pequeno } from '../../components/ui';
import { cores, espaco, tipografia, familia } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Evento'>;

/**
 * A noite teve um evento — e ele tem tela própria, antes das mortes.
 *
 * Por que separado do Amanhecer: o evento é a regra que mudou, e a morte é a
 * consequência. Empilhados na mesma tela, a frase do evento virava rodapé de
 * uma tela que já tinha um nome próprio gritando no meio — ninguém lia. Em
 * separado, a mesa ouve a regra ANTES de saber quem morreu, que é a ordem em
 * que a informação importa: primeiro o mundo muda, depois se descobre o preço.
 *
 * Só aparece para evento NARRADO. Dos dezesseis eventos, dois são silenciosos
 * de propósito — a Névoa Cerrada cala a Vidente sem avisar ninguém —, e mostrar
 * esses destruiria a razão de eles existirem: é a mistura de narrado e
 * silencioso que impede a mesa de deduzir o evento pelo efeito.
 */
export function EventoScreen({ navigation }: Props) {
  const { estado } = useJogo();

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  /**
   * A tela mostra o evento ANUNCIADO, não o que vigorou esta noite.
   *
   * É o ponto da mecânica: a mesa ouve a ameaça no amanhecer e tem o dia
   * inteiro para discutir o que fazer antes de ela acontecer.
   */
  const ev = estado?.eventoAnunciado ? EVENTOS_POR_ID.get(estado.eventoAnunciado) : undefined;

  // Sem evento narrado não há tela: segue direto para o amanhecer.
  useEffect(() => {
    if (!ev || ev.visibilidade !== 'narrado') {
      navigation.reset({ index: 0, routes: [{ name: 'Amanhecer' }] });
    }
  }, [ev, navigation]);

  if (!estado || !ev || ev.visibilidade !== 'narrado') return <Ambiente clima="noite" />;

  return (
    <Ambiente clima="noite">
      {/* Papel queimado: o evento é o bilhete que a noite deixou na porta. */}
      <Material material="papel" opacidade={0.08} />

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: espaco.lg,
          gap: espaco.lg,
        }}
      >
        <Revelacao>
          <View style={{ alignItems: 'center', gap: espaco.sm }}>
            <Text style={{ color: cores.cera, fontSize: 26 }}>✦</Text>
            <Rotulo cor={cores.cera}>Esta noite vai acontecer</Rotulo>
          </View>
        </Revelacao>

        <Revelacao atraso={260}>
          <View style={{ alignItems: 'center', gap: espaco.md }}>
            <Text
              style={[
                tipografia.titulo,
                { color: cores.linhoCru, fontSize: 34, textAlign: 'center' },
              ]}
            >
              {ev.nome}
            </Text>

            {/* A narração é o produto: é a frase que alguém lê em voz alta. */}
            <Text
              style={[
                tipografia.corpoSerif,
                {
                  fontFamily: familia.serifItalico,
                  color: cores.cera,
                  fontSize: 20,
                  textAlign: 'center',
                  lineHeight: 30,
                },
              ]}
            >
              {ev.narracao ?? ev.descricao}
            </Text>
          </View>
        </Revelacao>

        {/* O que MUDA, em linguagem de regra. A narração emociona; isto informa. */}
        <Aparicao atraso={700}>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#2E2721',
              paddingTop: espaco.md,
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Rotulo>O que muda quando escurecer</Rotulo>
            <Pequeno cor={cores.linhoCru}>{ev.descricao}</Pequeno>
          </View>
        </Aparicao>
      </View>

      <View style={{ padding: espaco.lg }}>
        <Botao
          onPress={() => {
            void Haptics.selectionAsync();
            navigation.reset({ index: 0, routes: [{ name: 'Amanhecer' }] });
          }}
        >
          E então?
        </Botao>
      </View>
    </Ambiente>
  );
}
