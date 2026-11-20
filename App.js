import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Alert, Linking,
  ScrollView, TextInput, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ============================================================
   APP DE INCLUSÃO DIGITAL PARA IDOSOS
   Projeto de Extensão: Inclusão Digital & Suporte Técnico Comunitário
   Telas: Corrida | Golpes | Guia | Ajuda
   ============================================================ */

const CHAVE = '@app_idoso_config_v1';
const TELEFONE_PADRAO = '5592999999999'; // Substituir pelo número real (DDI+DDD+número)

const COR = {
  fundo: '#FFFBE6',
  azul: '#003366',
  azulEscuro: '#002244',
  verde: '#28A745',
  verdeClaro: '#A3D9A5',
  vermelho: '#B00020',
  branco: '#FFFFFF',
  texto: '#222222',
  suave: '#666666',
};

const DESTINOS_PADRAO = [
  { id: '1', nome: '🏥 Posto de Saúde (UBS)', endereco: 'Rua Principal, 123' },
  { id: '2', nome: '💊 Farmácia Popular', endereco: 'Av. Constantino Nery, 456' },
  { id: '3', nome: '🛒 Supermercado Local', endereco: 'Rua Comendador, 789' },
  { id: '4', nome: '🏡 Casa de Familiares', endereco: 'Endereço Cadastrado' },
];

const CONFIG_PADRAO = {
  destinos: DESTINOS_PADRAO,
  telefoneCentral: TELEFONE_PADRAO,
  telefoneFamiliar: '',
  escala: 1, // tamanho da letra: 1 = normal, 1.25 = grande, 1.5 = muito grande
};

const DICAS_GOLPE = [
  { icone: '🏦', titulo: 'Banco nunca pede senha', texto: 'Nenhum banco liga ou manda mensagem pedindo senha, código de SMS ou cartão. Desligue e ligue você mesmo para o número do cartão.' },
  { icone: '💸', titulo: 'Pix urgente de "parente"', texto: 'Se alguém diz que é seu filho ou neto com número novo e pede dinheiro, ligue para o número antigo dele antes de fazer qualquer coisa.' },
  { icone: '🔗', titulo: 'Cuidado com links', texto: 'Mensagens com promessas de prêmio, CPF cancelado ou benefício bloqueado e um link são golpe. Não toque no link.' },
  { icone: '🔐', titulo: 'Senha só sua', texto: 'Nunca conte sua senha ou os códigos que chegam por SMS e WhatsApp, nem para pessoas que dizem ser da empresa.' },
  { icone: '🛑', titulo: 'Na dúvida, pare', texto: 'Golpistas colocam pressa. Respire, não responda e peça ajuda a alguém de confiança ou ao monitor do projeto.' },
];

const QUIZ = [
  { msg: 'Seu CPF será cancelado HOJE! Toque no link e regularize agora.', golpe: true,
    explica: 'Isso é golpe. Órgãos públicos não ameaçam cancelar CPF por mensagem com link.' },
  { msg: 'Oi vovó, mudei de número. Me manda R$ 500 por Pix agora, é urgente!', golpe: true,
    explica: 'Isso é golpe. Ligue para o número antigo do seu parente para confirmar.' },
  { msg: 'BANCO: seu cartão foi bloqueado. Informe a senha e o código que enviamos por SMS.', golpe: true,
    explica: 'Isso é golpe. O banco nunca pede senha nem código de SMS.' },
  { msg: 'Mensagem do seu filho, no número que você já tinha salvo: "Mãe, chego às 18h".', golpe: false,
    explica: 'Parece seguro. É de um contato conhecido e não pede dinheiro nem dados.' },
];

const GUIAS = [
  { icone: '🔠', titulo: 'Deixar a letra maior', passos: [
    'Abra a Configurações (ícone de engrenagem).',
    'Toque em Tela (ou Acessibilidade).',
    'Escolha Tamanho da fonte.',
    'Arraste o controle para a direita até a letra ficar boa de ler.',
  ] },
  { icone: '📶', titulo: 'Conectar no Wi-Fi', passos: [
    'Abra Configurações e toque em Wi-Fi.',
    'Ligue o Wi-Fi se estiver desligado.',
    'Toque no nome da sua rede.',
    'Digite a senha (está no roteador) e toque em Conectar.',
  ] },
  { icone: '📹', titulo: 'Chamada de vídeo no WhatsApp', passos: [
    'Abra o WhatsApp e toque na conversa da pessoa.',
    'Toque no ícone da câmera, no alto da tela.',
    'Aguarde a pessoa atender.',
    'Para encerrar, toque no botão vermelho.',
  ] },
  { icone: '🏛️', titulo: 'Entrar no Gov.br', passos: [
    'Abra o aplicativo Gov.br.',
    'Toque em Entrar com gov.br e digite seu CPF.',
    'Digite sua senha. Ela é só sua: não conte a ninguém.',
    'Pronto! Aqui você acessa Carteira Digital e outros serviços.',
  ] },
];

const EMERGENCIAS = [
  { nome: 'SAMU (ambulância)', numero: '192', icone: '🚑' },
  { nome: 'Polícia', numero: '190', icone: '🚓' },
  { nome: 'Bombeiros', numero: '193', icone: '🚒' },
];

/* ---------- utilitários ---------- */

const somenteDigitos = (t) => (t || '').replace(/\D/g, '');

function abrirLink(url, msgErro) {
  Linking.openURL(url).catch(() => Alert.alert('Erro', msgErro));
}

function abrirWhatsApp(telefone, mensagem) {
  const numero = somenteDigitos(telefone);
  const url = `https://wa.me/${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
  abrirLink(url, 'Não foi possível abrir o WhatsApp.');
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
export default function App() {
  const [aba, setAba] = useState('corrida');
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [carregado, setCarregado] = useState(false);

  // carrega configurações salvas
  useEffect(() => {
    (async () => {
      try {
        const salvo = await AsyncStorage.getItem(CHAVE);
        if (salvo) setConfig({ ...CONFIG_PADRAO, ...JSON.parse(salvo) });
      } catch (e) { /* usa o padrão */ }
      setCarregado(true);
    })();
  }, []);

  // salva sempre que mudar
  useEffect(() => {
    if (carregado) AsyncStorage.setItem(CHAVE, JSON.stringify(config)).catch(() => {});
  }, [config, carregado]);

  const atualizar = (parcial) => setConfig((c) => ({ ...c, ...parcial }));
  const e = useMemo(() => criarEstilos(config.escala), [config.escala]);

  const abas = [
    { id: 'corrida', rotulo: 'Corrida', icone: '🚗' },
    { id: 'golpes', rotulo: 'Golpes', icone: '🛡️' },
    { id: 'guia', rotulo: 'Guia', icone: '📖' },
    { id: 'ajuda', rotulo: 'Ajuda', icone: '🆘' },
  ];

  return (
    <SafeAreaView style={e.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COR.fundo} />
      <View style={e.conteudo}>
        {aba === 'corrida' && <TelaCorrida e={e} config={config} />}
        {aba === 'golpes' && <TelaGolpes e={e} />}
        {aba === 'guia' && <TelaGuia e={e} />}
        {aba === 'ajuda' && <TelaAjuda e={e} config={config} atualizar={atualizar} />}
      </View>

      <View style={e.barraAbas} accessibilityRole="tablist">
        {abas.map((a) => {
          const ativa = aba === a.id;
          return (
            <TouchableOpacity
              key={a.id}
              style={[e.aba, ativa && e.abaAtiva]}
              onPress={() => setAba(a.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={a.rotulo}
            >
              <Text style={e.abaIcone}>{a.icone}</Text>
              <Text style={[e.abaTexto, ativa && e.abaTextoAtivo]}>{a.rotulo}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

/* ============================================================
   TELA 1: CORRIDA (código original, melhorado)
   ============================================================ */
function TelaCorrida({ e, config }) {
  const [destino, setDestino] = useState(null);

  const confirmar = () => {
    if (!destino) {
      Alert.alert('Atenção', 'Por favor, selecione para onde deseja ir.');
      return;
    }
    if (somenteDigitos(config.telefoneCentral) === TELEFONE_PADRAO) {
      Alert.alert('Falta configurar', 'Peça a um familiar ou monitor para cadastrar o número da central na aba Ajuda.');
      return;
    }
    Alert.alert(
      'Confirmar corrida',
      `Ir para:\n${destino.nome}\n${destino.endereco}`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Sim, pedir',
          onPress: () => abrirWhatsApp(
            config.telefoneCentral,
            `Olá! Necessito de uma corrida para o destino: *${destino.nome}* (${destino.endereco}). Solicitado via App de Acessibilidade.`
          ),
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={e.container}>
      <Text style={e.titulo} accessibilityRole="header">Para onde vamos?</Text>
      <Text style={e.subtitulo}>Toque em uma das opções abaixo:</Text>

      {config.destinos.map((item) => {
        const sel = destino?.id === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[e.botaoDestino, sel && e.botaoSelecionado]}
            onPress={() => setDestino(item)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={`${item.nome}, ${item.endereco}`}
          >
            <Text style={[e.textoDestino, sel && e.textoSelecionado]}>{item.nome}</Text>
            <Text style={[e.subDestino, sel && e.subSelecionado]}>{item.endereco}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[e.botaoPrincipal, !destino && e.botaoDesativado]}
        onPress={confirmar}
        accessibilityRole="button"
        accessibilityLabel="Pedir corrida agora"
      >
        <Text style={e.textoBotaoPrincipal}>PEDIR CORRIDA AGORA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ============================================================
   TELA 2: PREVENÇÃO DE GOLPES (dicas + quiz)
   ============================================================ */
function TelaGolpes({ e }) {
  const [i, setI] = useState(0);
  const [resposta, setResposta] = useState(null); // null | { acertou, explica }
  const [acertos, setAcertos] = useState(0);
  const fim = i >= QUIZ.length;

  const responder = (disseGolpe) => {
    const q = QUIZ[i];
    const acertou = disseGolpe === q.golpe;
    if (acertou) setAcertos((a) => a + 1);
    setResposta({ acertou, explica: q.explica });
  };

  const proxima = () => { setResposta(null); setI((n) => n + 1); };
  const reiniciar = () => { setI(0); setAcertos(0); setResposta(null); };

  return (
    <ScrollView contentContainerStyle={e.container}>
      <Text style={e.titulo} accessibilityRole="header">Proteja-se de golpes</Text>
      <Text style={e.subtitulo}>Aprenda a se defender e teste o que sabe.</Text>

      {DICAS_GOLPE.map((d) => (
        <View key={d.titulo} style={e.cartao}>
          <Text style={e.cartaoTitulo}>{d.icone} {d.titulo}</Text>
          <Text style={e.cartaoTexto}>{d.texto}</Text>
        </View>
      ))}

      <Text style={[e.titulo, { marginTop: 20, fontSize: e.f(24) }]}>Isto é golpe?</Text>

      {!fim ? (
        <View style={e.cartaoQuiz}>
          <Text style={e.cartaoLabel}>Mensagem {i + 1} de {QUIZ.length}</Text>
          <Text style={e.mensagemQuiz}>“{QUIZ[i].msg}”</Text>

          {!resposta ? (
            <View style={e.linhaBotoes}>
              <TouchableOpacity style={[e.botaoQuiz, { backgroundColor: COR.vermelho }]} onPress={() => responder(true)} accessibilityRole="button">
                <Text style={e.textoBotaoQuiz}>É GOLPE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[e.botaoQuiz, { backgroundColor: COR.verde }]} onPress={() => responder(false)} accessibilityRole="button">
                <Text style={e.textoBotaoQuiz}>É SEGURO</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={[e.resultado, { color: resposta.acertou ? COR.verde : COR.vermelho }]}>
                {resposta.acertou ? '✅ Muito bem!' : '❌ Quase!'}
              </Text>
              <Text style={e.cartaoTexto}>{resposta.explica}</Text>
              <TouchableOpacity style={[e.botaoPrincipal, { marginTop: 15 }]} onPress={proxima} accessibilityRole="button">
                <Text style={e.textoBotaoPrincipal}>PRÓXIMA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={e.cartaoQuiz}>
          <Text style={e.resultado}>Você acertou {acertos} de {QUIZ.length}! 🎉</Text>
          <TouchableOpacity style={[e.botaoPrincipal, { marginTop: 15 }]} onPress={reiniciar} accessibilityRole="button">
            <Text style={e.textoBotaoPrincipal}>JOGAR DE NOVO</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

/* ============================================================
   TELA 3: GUIA PASSO A PASSO (cartilha digital)
   ============================================================ */
function TelaGuia({ e }) {
  const [aberto, setAberto] = useState(null);

  return (
    <ScrollView contentContainerStyle={e.container}>
      <Text style={e.titulo} accessibilityRole="header">Guia do Celular</Text>
      <Text style={e.subtitulo}>Toque para ver o passo a passo.</Text>

      {GUIAS.map((g, idx) => {
        const abertoAgora = aberto === idx;
        return (
          <View key={g.titulo} style={e.cartao}>
            <TouchableOpacity
              onPress={() => setAberto(abertoAgora ? null : idx)}
              accessibilityRole="button"
              accessibilityState={{ expanded: abertoAgora }}
            >
              <Text style={e.cartaoTitulo}>{g.icone} {g.titulo} {abertoAgora ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {abertoAgora && g.passos.map((p, n) => (
              <View key={n} style={e.passo}>
                <View style={e.numeroPasso}><Text style={e.numeroPassoTexto}>{n + 1}</Text></View>
                <Text style={[e.cartaoTexto, { flex: 1 }]}>{p}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ============================================================
   TELA 4: AJUDA + CONFIGURAÇÕES (modo cuidador)
   ============================================================ */
function TelaAjuda({ e, config, atualizar }) {
  const [cuidador, setCuidador] = useState(false);
  const [central, setCentral] = useState(config.telefoneCentral);
  const [familiar, setFamiliar] = useState(config.telefoneFamiliar);
  const [novoNome, setNovoNome] = useState('');
  const [novoEnd, setNovoEnd] = useState('');

  const ligar = (numero) => abrirLink(`tel:${somenteDigitos(numero)}`, 'Não foi possível fazer a ligação.');

  const salvarTelefones = () => {
    atualizar({ telefoneCentral: somenteDigitos(central), telefoneFamiliar: somenteDigitos(familiar) });
    Alert.alert('Pronto', 'Telefones salvos.');
  };

  const adicionarDestino = () => {
    if (!novoNome.trim() || !novoEnd.trim()) {
      Alert.alert('Atenção', 'Preencha o nome e o endereço.');
      return;
    }
    atualizar({ destinos: [...config.destinos, { id: String(Date.now()), nome: `📍 ${novoNome.trim()}`, endereco: novoEnd.trim() }] });
    setNovoNome(''); setNovoEnd('');
  };

  const removerDestino = (id) => {
    Alert.alert('Remover', 'Deseja remover este destino?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', style: 'destructive', onPress: () => atualizar({ destinos: config.destinos.filter((d) => d.id !== id) }) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={e.container} keyboardShouldPersistTaps="handled">
      <Text style={e.titulo} accessibilityRole="header">Preciso de ajuda</Text>

      <Text style={e.secao}>Emergência</Text>
      {EMERGENCIAS.map((m) => (
        <TouchableOpacity key={m.numero} style={[e.botaoDestino, { borderColor: COR.vermelho }]} onPress={() => ligar(m.numero)} accessibilityRole="button" accessibilityLabel={`Ligar para ${m.nome}, ${m.numero}`}>
          <Text style={[e.textoDestino, { color: COR.vermelho }]}>{m.icone} {m.nome}: {m.numero}</Text>
        </TouchableOpacity>
      ))}

      <Text style={e.secao}>Falar com alguém</Text>
      <TouchableOpacity
        style={[e.botaoDestino, !config.telefoneFamiliar && { opacity: 0.5 }]}
        onPress={() => config.telefoneFamiliar
          ? ligar(config.telefoneFamiliar)
          : Alert.alert('Falta configurar', 'Peça a um familiar para cadastrar o telefone abaixo, em "Modo cuidador".')}
        accessibilityRole="button"
      >
        <Text style={e.textoDestino}>👨‍👩‍👧 Ligar para minha família</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={e.botaoDestino}
        onPress={() => abrirWhatsApp(config.telefoneCentral, 'Olá! Preciso de ajuda com o celular. (Enviado pelo App de Inclusão Digital)')}
        accessibilityRole="button"
      >
        <Text style={e.textoDestino}>💬 Pedir ajuda ao monitor (WhatsApp)</Text>
      </TouchableOpacity>

      <Text style={e.secao}>Tamanho da letra</Text>
      <View style={e.linhaBotoes}>
        {[{ r: 'Normal', v: 1 }, { r: 'Grande', v: 1.25 }, { r: 'Enorme', v: 1.5 }].map((o) => (
          <TouchableOpacity
            key={o.v}
            style={[e.botaoEscala, config.escala === o.v && e.botaoSelecionado]}
            onPress={() => atualizar({ escala: o.v })}
            accessibilityRole="button"
            accessibilityState={{ selected: config.escala === o.v }}
          >
            <Text style={[e.textoEscala, config.escala === o.v && e.textoSelecionado]}>{o.r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[e.botaoSecundario]} onPress={() => setCuidador(!cuidador)} accessibilityRole="button">
        <Text style={e.textoSecundario}>⚙️ Modo cuidador (familiar / monitor) {cuidador ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {cuidador && (
        <View style={e.cartao}>
          <Text style={e.cartaoLabel}>WhatsApp da central / motorista (com DDI e DDD)</Text>
          <TextInput style={e.input} value={central} onChangeText={setCentral} keyboardType="phone-pad" placeholder="5592999999999" />
          <Text style={e.cartaoLabel}>Telefone de um familiar</Text>
          <TextInput style={e.input} value={familiar} onChangeText={setFamiliar} keyboardType="phone-pad" placeholder="92999999999" />
          <TouchableOpacity style={e.botaoPrincipal} onPress={salvarTelefones} accessibilityRole="button">
            <Text style={e.textoBotaoPrincipal}>SALVAR TELEFONES</Text>
          </TouchableOpacity>

          <Text style={[e.cartaoLabel, { marginTop: 20 }]}>Adicionar destino</Text>
          <TextInput style={e.input} value={novoNome} onChangeText={setNovoNome} placeholder="Nome (ex.: Igreja)" />
          <TextInput style={e.input} value={novoEnd} onChangeText={setNovoEnd} placeholder="Endereço" />
          <TouchableOpacity style={e.botaoPrincipal} onPress={adicionarDestino} accessibilityRole="button">
            <Text style={e.textoBotaoPrincipal}>ADICIONAR</Text>
          </TouchableOpacity>

          <Text style={[e.cartaoLabel, { marginTop: 20 }]}>Destinos cadastrados</Text>
          {config.destinos.map((d) => (
            <View key={d.id} style={e.linhaDestino}>
              <Text style={[e.cartaoTexto, { flex: 1 }]}>{d.nome}{'\n'}{d.endereco}</Text>
              <TouchableOpacity onPress={() => removerDestino(d.id)} accessibilityRole="button" accessibilityLabel={`Remover ${d.nome}`}>
                <Text style={{ fontSize: 28 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* ============================================================
   ESTILOS (escalam conforme o tamanho de letra escolhido)
   ============================================================ */
function criarEstilos(escala) {
  const f = (n) => Math.round(n * escala);
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COR.fundo, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    conteudo: { flex: 1 },
    container: { flexGrow: 1, backgroundColor: COR.fundo, padding: 20, paddingBottom: 30 },

    titulo: { fontSize: f(28), fontWeight: 'bold', color: COR.azul, textAlign: 'center', marginBottom: 5, marginTop: 20 },
    subtitulo: { fontSize: f(18), color: '#444', textAlign: 'center', marginBottom: 25 },
    secao: { fontSize: f(22), fontWeight: 'bold', color: COR.azul, marginTop: 20, marginBottom: 10 },

    botaoDestino: { backgroundColor: COR.branco, borderWidth: 2, borderColor: COR.azul, padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3, minHeight: 64 },
    botaoSelecionado: { backgroundColor: COR.azul, borderColor: COR.azulEscuro },
    textoDestino: { fontSize: f(20), fontWeight: 'bold', color: COR.azul },
    textoSelecionado: { color: COR.branco },
    subDestino: { fontSize: f(14), color: COR.suave, marginTop: 4 },
    subSelecionado: { color: '#E0E0E0' },

    botaoPrincipal: { backgroundColor: COR.verde, paddingVertical: 22, borderRadius: 12, alignItems: 'center', marginTop: 20, elevation: 5 },
    botaoDesativado: { backgroundColor: COR.verdeClaro },
    textoBotaoPrincipal: { color: COR.branco, fontSize: f(22), fontWeight: 'bold' },

    botaoSecundario: { borderWidth: 2, borderColor: COR.suave, borderRadius: 12, padding: 16, marginTop: 30, marginBottom: 10 },
    textoSecundario: { fontSize: f(17), color: COR.texto, fontWeight: '600', textAlign: 'center' },

    cartao: { backgroundColor: COR.branco, borderRadius: 12, padding: 18, marginBottom: 14, borderLeftWidth: 6, borderLeftColor: COR.azul, elevation: 2 },
    cartaoTitulo: { fontSize: f(20), fontWeight: 'bold', color: COR.azul, marginBottom: 6 },
    cartaoTexto: { fontSize: f(18), color: COR.texto, lineHeight: f(26) },
    cartaoLabel: { fontSize: f(16), color: COR.suave, fontWeight: '600', marginBottom: 6, marginTop: 8 },

    cartaoQuiz: { backgroundColor: COR.branco, borderRadius: 12, padding: 18, marginTop: 10, borderWidth: 2, borderColor: COR.azul },
    mensagemQuiz: { fontSize: f(20), color: COR.texto, fontStyle: 'italic', marginVertical: 12, lineHeight: f(28) },
    resultado: { fontSize: f(24), fontWeight: 'bold', textAlign: 'center', marginVertical: 10, color: COR.azul },
    linhaBotoes: { flexDirection: 'row', gap: 12 },
    botaoQuiz: { flex: 1, paddingVertical: 20, borderRadius: 12, alignItems: 'center' },
    textoBotaoQuiz: { color: COR.branco, fontSize: f(18), fontWeight: 'bold' },

    passo: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, gap: 12 },
    numeroPasso: { width: 36, height: 36, borderRadius: 18, backgroundColor: COR.azul, alignItems: 'center', justifyContent: 'center' },
    numeroPassoTexto: { color: COR.branco, fontWeight: 'bold', fontSize: 18 },

    botaoEscala: { flex: 1, backgroundColor: COR.branco, borderWidth: 2, borderColor: COR.azul, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
    textoEscala: { fontSize: 17, fontWeight: 'bold', color: COR.azul },

    input: { backgroundColor: '#F4F4F4', borderRadius: 10, borderWidth: 1, borderColor: '#BBB', padding: 14, fontSize: 18, marginBottom: 10, color: COR.texto },
    linhaDestino: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },

    barraAbas: { flexDirection: 'row', backgroundColor: COR.branco, borderTopWidth: 2, borderTopColor: COR.azul },
    aba: { flex: 1, alignItems: 'center', paddingVertical: 10, minHeight: 68, justifyContent: 'center' },
    abaAtiva: { backgroundColor: COR.azul },
    abaIcone: { fontSize: 26 },
    abaTexto: { fontSize: 14, fontWeight: 'bold', color: COR.azul, marginTop: 2 },
    abaTextoAtivo: { color: COR.branco },
  });
  return { ...s, f };
}
