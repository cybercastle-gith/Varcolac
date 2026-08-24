import { View, ScrollView, Text } from 'react-native';
import { Rotulo, Titulo, Corpo, Pequeno } from '../../components/ui';
import { Ambiente } from '../../components/Ambiente';
import { cores, espaco, tipografia } from '../../theme';

const PASSOS: readonly { titulo: string; texto: string }[] = [
  {
    titulo: 'O aparelho circula',
    texto:
      'Uma pessoa segura o celular por vez. Na primeira noite, cada um descobre sua função e já age na mesma passagem — não existe volta separada só para distribuir.',
  },
  {
    titulo: 'Todos recebem o aparelho',
    texto:
      'Inclusive quem não tem nada para fazer. O toque falso existe para que quem tem poder não se revele pela chamada.',
  },
  {
    titulo: 'Segure para revelar',
    texto:
      'Sua função só aparece enquanto o dedo está na tela. O gesto já cobre o aparelho com a mão.',
  },
  {
    titulo: 'De manhã, a mesa conversa',
    texto:
      'O app conta quem morreu e narra o que houve. Daí em diante o jogo é entre as pessoas: a tela só marca o tempo.',
  },
  {
    titulo: 'A votação é simultânea',
    texto:
      'Todos apontam na contagem de três e o host registra. Dá para trocar por voto secreto nos ajustes.',
  },
  {
    titulo: 'Morrer não é sair',
    texto:
      'Quem morre continua na mesa e continua ouvindo. Com os módulos de fantasma ligados, continua agindo também.',
  },
];

/** "Como jogar" — a diretriz de acessibilidade em 10 minutos, num lugar só. */
export function ComoJogarScreen() {
  return (
    <Ambiente clima="neutro" tremula={false}>
      <ScrollView contentContainerStyle={{ padding: espaco.lg, gap: espaco.md }}>
        <Titulo>Como jogar</Titulo>
        <Corpo cor={cores.ferrugem} serif>
          Um aparelho, a mesa inteira, sem internet. O app é o mestre: distribui, narra, resolve
          e conta os votos. A discussão acontece entre as pessoas.
        </Corpo>

        {PASSOS.map((p, i) => (
          <View key={p.titulo} style={{ flexDirection: 'row', gap: espaco.md, marginTop: espaco.sm }}>
            <Text style={[tipografia.numero, { color: cores.nogueira, fontSize: 22, width: 28 }]}>
              {i + 1}
            </Text>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[tipografia.interface, { color: cores.linhoCru }]}>{p.titulo}</Text>
              <Pequeno>{p.texto}</Pequeno>
            </View>
          </View>
        ))}

        <View style={{ height: espaco.md }} />
        <Rotulo>Como se vence</Rotulo>
        <Pequeno>
          A vila vence eliminando todas as ameaças. Os lobos vencem quando igualam a vila em
          número — não precisam superar. Solitários têm objetivo próprio e podem vencer junto
          com qualquer lado, ou sozinhos.
        </Pequeno>
      </ScrollView>
    </Ambiente>
  );
}
