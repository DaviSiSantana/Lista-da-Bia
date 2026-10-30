
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  Modal,
  FlatList
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =================================================================
// SIMULADOR LOCAL DO FIREBASE
// =================================================================
const contasCadastradasSimuladas = new Map();
contasCadastradasSimuladas.set('teste@email.com', { senha: '123456', nome: 'Bia e Davi' });

const createUserWithEmailAndPasswordSimulado = async (nome, email, senha) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (contasCadastradasSimuladas.has(email)) {
        reject(new Error("Este e-mail já está cadastrado no sistema!"));
      } else {
        contasCadastradasSimuladas.set(email, { senha, nome });
        resolve({ user: { email, displayName: nome } });
      }
    }, 800);
  });
};

const signInWithEmailAndPasswordSimulado = async (email, senha, nomeSalvo = 'Davi') => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!contasCadastradasSimuladas.has(email)) {
        contasCadastradasSimuladas.set(email, { senha, nome: nomeSalvo });
      }
      if (contasCadastradasSimuladas.get(email).senha !== senha) {
        reject(new Error("Senha incorreta! Tente novamente."));
      } else {
        const dadosUsuario = contasCadastradasSimuladas.get(email);
        resolve({ user: { email, displayName: dadosUsuario.nome } });
      }
    }, 800);
  });
};
// =================================================================

const PRIMARY_COLOR = '#D14D5F'; 
const SECONDARY_COLOR = '#A8E6CF'; 
const CATEGORIAS = ['🛒 Mercearia', '🥩 Açougue', '🥦 Hortifrúti', '🧼 Higiene/Limpeza', '🍫 Outros'];

export default function App() {
  const [telaAtual, setTelaAtual] = useState('login');
  const [carregando, setCarregando] = useState(false);
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null); 
  const [verSenha, setVerSenha] = useState(false);

  const [listasAtivas, setListasAtivas] = useState([]);
  const [listasFinalizadas, setListasFinalizadas] = useState([]); 
  const [listaSelecionada, setListaSelecionada] = useState(null);
  const [modalListaVisivel, setModalListaVisivel] = useState(false);
  const [nomeNovaLista, setNomeNovaLista] = useState('');
  const [dataNovaLista, setDataNovaLista] = useState('');

  const [modalProdutoVisivel, setModalProdutoVisivel] = useState(false);
  const [nomeProduto, setNomeProduto] = useState('');
  const [qtdProduto, setQtdProduto] = useState('1');
  const [valorProduto, setValorProduto] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(CATEGORIAS[0]);

  const [modalEditarVisivel, setModalEditarVisivel] = useState(false);
  const [produtoSendoEditado, setProdutoSendoEditado] = useState(null);

  const [produtosPorLista, setProdutosPorLista] = useState({});
  const [itensDespensa, setItensDespensa] = useState([]);

  const [modalClonarVisivel, setModalClonarVisivel] = useState(false);
  const [nomeListaClonada, setNomeListaClonada] = useState('');
  const [dataListaClonada, setDataListaClonada] = useState('');
  
  const [modalDespensaVisivel, setModalDespensaVisivel] = useState(false);
  const [itemDespensaSelecionado, setItemDespensaSelecionado] = useState(null);

  const [modalNovoItemDespensaVisivel, setModalNovoItemDespensaVisivel] = useState(false);

  // =================================================================
  // VERIFICAÇÃO DE LOGIN AUTOMÁTICO
  // =================================================================
  useEffect(() => {
    const verificarSessaoSalva = async () => {
      try {
        const emailSalvo = await AsyncStorage.getItem('@sessao_usuario_email');
        const nomeSalvo = await AsyncStorage.getItem('@sessao_usuario_nome');
        if (emailSalvo && nomeSalvo) {
          setUsuarioLogado({ nome: nomeSalvo, email: emailSalvo });
          setTelaAtual('home');
        }
      } catch (e) {
        console.log("Erro ao checar auto-login: ", e);
      }
    };
    verificarSessaoSalva();
  }, []);

  // =================================================================
  // LÓGICA DE PERSISTÊNCIA
  // =================================================================
  useEffect(() => {
    const carregarDadosLocais = async () => {
      if (!usuarioLogado?.email) return;

      try {
        const emailChave = usuarioLogado.email;
        const armazenadoListas = await AsyncStorage.getItem(`@listas_ativas_${emailChave}`);
        const armazenadoFinalizadas = await AsyncStorage.getItem(`@listas_finalizadas_${emailChave}`);
        const armazenadoProdutos = await AsyncStorage.getItem(`@produtos_por_lista_${emailChave}`);
        const armazenadaDespensa = await AsyncStorage.getItem(`@despensa_${emailChave}`);
        
        setListasAtivas(armazenadoListas ? JSON.parse(armazenadoListas) : []);
        setListasFinalizadas(armazenadoFinalizadas ? JSON.parse(armazenadoFinalizadas) : []);
        setProdutosPorLista(armazenadoProdutos ? JSON.parse(armazenadoProdutos) : {});
        setItensDespensa(armazenadaDespensa ? JSON.parse(armazenadaDespensa) : []);
      } catch (e) {
        console.log("Erro ao carregar dados do usuário: ", e);
      }
    };
    carregarDadosLocais();
  }, [usuarioLogado]); 

  useEffect(() => {
    const salvarDadosLocLocais = async () => {
      if (!usuarioLogado?.email) return;

      try {
        const emailChave = usuarioLogado.email;
        await AsyncStorage.setItem(`@listas_ativas_${emailChave}`, JSON.stringify(listasAtivas));
        await AsyncStorage.setItem(`@listas_finalizadas_${emailChave}`, JSON.stringify(listasFinalizadas));
        await AsyncStorage.setItem(`@produtos_por_lista_${emailChave}`, JSON.stringify(produtosPorLista));
        await AsyncStorage.setItem(`@despensa_${emailChave}`, JSON.stringify(itensDespensa));
      } catch (e) {
        console.log("Erro ao salvar dados do usuário: ", e);
      }
    };
    salvarDadosLocLocais();
  }, [listasAtivas, listasFinalizadas, produtosPorLista, itensDespensa, usuarioLogado]);
  // =================================================================

  const pegarIniciaisDoNome = (nomeCompleto) => {
    if (!nomeCompleto) return 'D';
    const partes = nomeCompleto.trim().split(' ');
    if (partes.length > 1) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0].substring(0, 2).toUpperCase();
  };

  const lidarComLogin = async () => {
    if (!email || !senha) { alert('Preencha o e-mail e a senha!'); return; }
    setCarregando(true);
    try {
      const resultado = await signInWithEmailAndPasswordSimulado(email, senha, nome || 'Davi');
      await AsyncStorage.setItem('@sessao_usuario_email', resultado.user.email);
      await AsyncStorage.setItem('@sessao_usuario_nome', resultado.user.displayName);
      setUsuarioLogado({ nome: resultado.user.displayName, email: resultado.user.email });
      setTelaAtual('home');
    } catch (err) {
      alert(err.message);
    } finally {
      setCarregando(false);
    }
  };
  
  const lidarComCadastro = async () => {
    if (!nome || !email || !senha) { alert('Preencha todos os campos!'); return; }
    if (senha.length < 6) { alert('A senha precisa ter no mínimo 6 dígitos!'); return; }
    setCarregando(true);
    try {
      await createUserWithEmailAndPasswordSimulado(nome, email, senha);
      await AsyncStorage.setItem('@sessao_usuario_email', email);
      await AsyncStorage.setItem('@sessao_usuario_nome', nome);
      alert('Conta criada com sucesso!');
      setUsuarioLogado({ nome: nome, email: email });
      setTelaAtual('home'); 
    } catch (err) {
      alert(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const lidarComLogout = async () => {
    try {
      await AsyncStorage.removeItem('@sessao_usuario_email');
      await AsyncStorage.removeItem('@sessao_usuario_nome');
      setUsuarioLogado(null);
      setEmail('');
      setSenha('');
      setNome('');
      setTelaAtual('login');
    } catch (e) {
      console.log("Erro ao efetuar logout: ", e);
    }
  };

  const criarNovaListaReal = () => {
    if (nomeNovaLista.trim() === '') { alert('Digite o nome da lista!'); return; }
    const idNovaLista = Date.now().toString();
    const dataDefinida = dataNovaLista.trim() || new Date().toLocaleDateString('pt-BR');

    const nova = {
      id: idNovaLista,
      titulo: nomeNovaLista,
      status: 'Em aberto',
      data: dataDefinida,
      etapa: 1 
    };

    setListasAtivas([nova, ...listasAtivas]);
    setProdutosPorLista(prev => ({ ...prev, [idNovaLista]: [] })); 
    setNomeNovaLista('');
    setDataNovaLista('');
    setModalListaVisivel(false);
    abrirLista(nova, 'detalhe_lista');
  };

  const abrirLista = (lista, destino) => {
    setListaSelecionada(lista);
    setTelaAtual(destino);
  };

  const finalizarListaReal = () => {
    if (!listaSelecionada) return;

    const produtosDaLista = produtosPorLista[listaSelecionada.id] || [];
    const comprados = produtosDaLista.filter(p => p.comprado && p.valor > 0);

    let novaDespensa = [...itensDespensa];
    comprados.forEach(prod => {
      const indexExistente = novaDespensa.findIndex(item => item.nome.toLowerCase().trim() === prod.nome.toLowerCase().trim());
      
      if (indexExistente > -1) {
        novaDespensa[indexExistente].quantidade += prod.quantidade;
      } else {
        novaDespensa.push({
          id: Date.now().toString() + Math.random(),
          nome: prod.nome,
          quantidade: prod.quantidade,
          categoria: prod.categoria
        });
      }
    });

    setItensDespensa(novaDespensa);

    const listaTerminada = {
      ...listaSelecionada,
      status: 'Finalizada',
      valorFinal: calcularTotalHistoricoAbsoluto(listaSelecionada.id)
    };

    setListasFinalizadas([listaTerminada, ...listasFinalizadas]);
    setListasAtivas(listasAtivas.filter(l => l.id !== listaSelecionada.id));
    
    alert(`Lista finalizada! Os itens comprados foram guardados na Despensa! 📦`);
    setTelaAtual('home');
    setListaSelecionada(null);
  };

  const continuarComPrandoZerados = () => {
    if (!listaSelecionada) return;
    const produtosAtuais = produtosPorLista[listaSelecionada.id] || [];
    
    const produtosAtualizados = produtosAtuais.map(p => {
      if (p.comprado && p.valor > 0) {
        return { ...p, faturado_etapa_anterior: true };
      }
      return p;
    });

    const listaReaberta = {
      ...listaSelecionada,
      status: 'Em aberto',
      etapa: 2 
    };

    setProdutosPorLista(prev => ({ ...prev, [listaSelecionada.id]: produtosAtualizados }));
    setListasAtivas([listaReaberta, ...listasAtivas.filter(l => l.id !== listaSelecionada.id)]);
    setListasFinalizadas(listasFinalizadas.filter(l => l.id !== listaSelecionada.id));

    alert("Segunda etapa iniciada! O total do topo foi zerado. Os itens do Mercado A continuam marcados.");
    setListaSelecionada(listaReaberta);
    setTelaAtual('detalhe_lista');
  };

  const abrirModalRefazerCompra = () => {
    if (!listaSelecionada) return;
    setNomeListaClonada(listaSelecionada.titulo);
    setDataListaClonada(new Date().toLocaleDateString('pt-BR'));
    setModalClonarVisivel(true);
  };

  const confirmarRefazerCompraDoHistorico = () => {
    if (nomeListaClonada.trim() === '') { alert('Digite um nome para a lista!'); return; }

    const novoIdLista = Date.now().toString();
    const produtosAntigos = produtosPorLista[listaSelecionada.id] || [];
    
    const produtosClonadosZerados = produtosAntigos.map(p => ({
      ...p,
      id: Math.random().toString(), 
      quantidade: p.quantidade > 0 ? p.quantidade : 1, 
      valor: 0.0,    
      faturado_etapa_anterior: false,
      comprado: false 
    }));

    const novaListaAtiva = {
      id: novoIdLista,
      titulo: nomeListaClonada,
      status: 'Em aberto',
      data: dataListaClonada,
      etapa: 1
    };

    setListasAtivas([novaListaAtiva, ...listasAtivas]);
    setProdutosPorLista(prev => ({ ...prev, [novoIdLista]: produtosClonadosZerados }));
    setModalClonarVisivel(false);

    alert(`Nova lista criada! Defina os preços de hoje.`);
    setListaSelecionada(novaListaAtiva);
    setTelaAtual('detalhe_lista');
  };

  const adicionarProdutoReal = () => {
    if (!nomeProduto.trim()) { alert('Digite o nome do produto!'); return; }
    const qtd = parseInt(qtdProduto) || 1;
    const valor = parseFloat(valorProduto.replace(',', '.')) || 0.0;

    const novoProd = {
      id: Date.now().toString(),
      nome: nomeProduto,
      quantidade: qtd,
      valor: valor,
      categoria: categoriaSelecionada,
      faturado_etapa_anterior: false,
      comprado: valor > 0 
    };

    const produtosAtuais = produtosPorLista[listaSelecionada.id] || [];
    setProdutosPorLista(prev => ({
      ...prev,
      [listaSelecionada.id]: [...produtosAtuais, novoProd]
    }));

    setNomeProduto('');
    setQtdProduto('1');
    setValorProduto('');
    setCategoriaSelecionada(CATEGORIAS[0]);
    setModalProdutoVisivel(false);
  };

  const adicionarItemDiretoDespensa = () => {
    if (!nomeProduto.trim()) { alert('Digite o nome do produto!'); return; }
    const qtd = parseInt(qtdProduto) || 1;

    let novaDespensa = [...itensDespensa];
    const indexExistente = novaDespensa.findIndex(item => item.nome.toLowerCase().trim() === nomeProduto.toLowerCase().trim());

    if (indexExistente > -1) {
      novaDespensa[indexExistente].quantidade += qtd;
    } else {
      novaDespensa.push({
        id: Date.now().toString() + Math.random(),
        nome: nomeProduto,
        quantidade: qtd,
        categoria: categoriaSelecionada
      });
    }

    setItensDespensa(novaDespensa);
    setNomeProduto('');
    setQtdProduto('1');
    setCategoriaSelecionada(CATEGORIAS[0]);
    setModalNovoItemDespensaVisivel(false);
    alert('Item adicionado à despensa com sucesso! 📦');
  };

  const gerenciarCliqueProduto = (produto) => {
    if (telaAtual === 'detalhe_historico') return;
    setProdutoSendoEditado(produto);
    setQtdProduto(produto.quantidade > 0 ? produto.quantidade.toString() : '1');
    setValorProduto(produto.valor > 0 ? produto.valor.toString().replace('.', ',') : '');
    setModalEditarVisivel(true);
  };

  const salvarDadosProdutoEditado = () => {
    const listaProdutos = produtosPorLista[listaSelecionada.id] || [];
    const qtd = parseInt(qtdProduto) || 1;
    const valor = parseFloat(valorProduto.replace(',', '.')) || 0.0;

    const updated = listaProdutos.map(p => {
      if (p.id === produtoSendoEditado.id) {
        return { ...p, quantidade: qtd, valor: valor, comprado: valor > 0 };
      }
      return p;
    });

    setProdutosPorLista(prev => ({ ...prev, [listaSelecionada.id]: updated }));
    setModalEditarVisivel(false);
    setProdutoSendoEditado(null);
  };

  const deletarProdutoDaLista = () => {
    if (!listaSelecionada || !produtoSendoEditado) return;
    const produtosAtuais = produtosPorLista[listaSelecionada.id] || [];
    const filtrados = produtosAtuais.filter(p => p.id !== produtoSendoEditado.id);

    setProdutosPorLista(prev => ({ ...prev, [listaSelecionada.id]: filtrados }));
    setModalEditarVisivel(false);
    setProdutoSendoEditado(null);
  };

  const gerenciarCliqueItemDespensa = (item) => {
    setItemDespensaSelecionado(item);
    setModalDespensaVisivel(true);
  };

  const ajustarQtdNoModalDespensa = (operacao) => {
    if (!itemDespensaSelecionado) return;

    const novaQtd = operacao === 'mais' ? itemDespensaSelecionado.quantidade + 1 : itemDespensaSelecionado.quantidade - 1;
    
    if (novaQtd <= 0) {
      const filtrados = itensDespensa.filter(i => i.id !== itemDespensaSelecionado.id);
      setItensDespensa(filtrados);
      setModalDespensaVisivel(false);
      setItemDespensaSelecionado(null);
    } else {
      const updated = { ...itemDespensaSelecionado, quantidade: novaQtd };
      const listaAtualizada = itensDespensa.map(i => i.id === itemDespensaSelecionado.id ? updated : i);
      
      setItensDespensa(listaAtualizada);
      setItemDespensaSelecionado(updated);
    }
  };

  const calcularTotalDaLista = (listaId, listaObjeto) => {
    const produtos = produtosPorLista[listaId] || [];
    if (listaObjeto && listaObjeto.etapa === 2) {
      return produtos
        .filter(p => p.comprado === true && p.valor > 0 && !p.faturado_etapa_anterior)
        .reduce((soma, p) => soma + (p.quantidade * p.valor), 0);
    }
    return produtos
      .filter(p => p.comprado === true && p.valor > 0)
      .reduce((soma, p) => soma + (p.quantidade * p.valor), 0);
  };

  const calcularTotalHistoricoAbsoluto = (listaId) => {
    const produtos = produtosPorLista[listaId] || [];
    return produtos
      .filter(p => p.comprado === true && p.valor > 0)
      .reduce((soma, p) => soma + (p.quantidade * p.valor), 0);
  };

  const calcularTotalGeralDoMes = () => {
    return listasAtivas.reduce((soma, lista) => soma + calcularTotalDaLista(lista.id, lista), 0);
  };

  const buscarQuantidadeItens = (listaId) => {
    const produtos = produtosPorLista[listaId] || [];
    return `${produtos.length} ${produtos.length === 1 ? 'item' : 'itens'}`;
  };

  const temProdutosZerados = (listaId) => {
    const produtos = produtosPorLista[listaId] || [];
    return produtos.some(p => p.valor === 0 || p.comprado === false);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7F6' },
    scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D14D5F', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
    form: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3 },
    label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: '#e8e8e8' },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, color: '#333', fontSize: 16 },
    mainButton: { backgroundColor: '#D14D5F', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    mainButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    linkButton: { alignItems: 'center', marginTop: 20 },
    linkText: { color: '#666', fontSize: 14 },
    linkTextBold: { color: '#D14D5F', fontWeight: '700' },
    dashboard: { flex: 1, paddingHorizontal: 20 },
    headerDashboard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 45, marginBottom: 20 },
    profileArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D14D5F', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
    avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    welcomeTextArea: { justifyContent: 'center', maxWidth: '70%' },
    welcomeSub: { fontSize: 12, color: '#666', marginBottom: 2 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    exitButton: { padding: 4, justifyContent: 'center', alignItems: 'center' },
    btnHeaderFinalizar: { backgroundColor: '#e74c3c', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    btnHeaderFinalizarText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    summaryCard: { backgroundColor: '#A8E6CF', borderRadius: 20, padding: 20, marginBottom: 20 },
    summaryLabel: { fontSize: 13, color: '#444', fontWeight: '500' },
    summaryValue: { fontSize: 30, fontWeight: 'bold', color: '#333', marginTop: 4 },
    summarySub: { fontSize: 11, color: '#555', marginTop: 6 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    actionItem: { alignItems: 'center', width: '30%' },
    actionIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2 },
    actionLabel: { fontSize: 12, color: '#555', fontWeight: '500' },
    emptyState: { backgroundColor: '#fff', borderRadius: 15, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e8e8e8', borderStyle: 'dashed' },
    emptyStateText: { fontSize: 14, fontWeight: 'bold', color: '#666', marginTop: 10 },
    emptyStateSub: { fontSize: 12, color: '#999', marginTop: 4, textAlign: 'center' },
    listCard: { backgroundColor: '#fff', borderRadius: 15, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, elevation: 2 },
    listCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    listCardItens: { fontSize: 12, color: '#777', marginTop: 4 },
    listCardRight: { alignItems: 'flex-end' },
    listCardValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    listCardStatus: { fontSize: 11, fontWeight: 'bold', marginTop: 4 },
    productCard: { backgroundColor: '#fff', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1 },
    productName: { fontSize: 15, fontWeight: '600', color: '#333' },
    productMeta: { fontSize: 12, color: '#777', marginTop: 2 },
    productSubtotal: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    textLineThrough: { color: '#aaa' }, 
    inputLabelMicro: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 10 },
    catBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#ddd' },
    catBadgeActive: { backgroundColor: '#D14D5F', borderColor: '#D14D5F' },
    catBadgeText: { color: '#555', fontSize: 13 },
    catBadgeTextActive: { color: '#fff', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#333', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, flexDirection: 'row', alignItems: 'center', elevation: 5 },
    fabText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '85%' },
    modalHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 15 },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center', paddingHorizontal: 5 },
    modalBtnHeaderCancel: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f5f5f5' },
    modalBtnHeaderSave: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#D14D5F' },
    modalBtnTextCancel: { color: '#666', fontWeight: '600', fontSize: 14 },
    modalBtnTextSave: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    modalInput: { backgroundColor: '#f5f5f5', height: 48, borderRadius: 8, paddingHorizontal: 12, fontSize: 15, marginBottom: 5, borderWidth: 1, borderColor: '#e0e0e0', color: '#333' },
    modalBtnHeaderDelete: { padding: 6, borderRadius: 8, backgroundColor: '#fde8e8', marginRight: 10 },
    btnHistoricoAcoes: { flexDirection: 'row', gap: 6 },

    despensaCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 2 },
    despensaQtdBadge: { backgroundColor: '#f39c12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    despensaQtdBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    modalDespensaControles: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 30 },
    btnModalDespensaOp: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    textModalDespensaQtd: { fontSize: 32, fontWeight: 'bold', color: '#333', minWidth: 50, textAlign: 'center' }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* ================= TELA DE LOGIN ================= */}
      {telaAtual === 'login' && (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoCircle}><MaterialIcons name="shopping-cart" size={40} color="#fff" /></View>
            <Text style={styles.title}>Lista da Bia</Text>
            <Text style={styles.subtitle}>Sua lista de compras, sempre com você</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor="#bbb" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Digite sua senha" placeholderTextColor="#bbb" secureTextEntry={!verSenha} value={senha} onChangeText={setSenha} />
            </View>
            <TouchableOpacity style={styles.mainButton} onPress={lidarComLogin} disabled={carregando}>
              <Text style={styles.mainButtonText}>{carregando ? 'Entrando...' : 'Entrar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => setTelaAtual('cadastro')}><Text style={styles.linkText}>Não tem uma conta? <Text style={styles.linkTextBold}>Cadastre-se</Text></Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ================= TELA DE CADASTRO ================= */}
      {telaAtual === 'cadastro' && (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoCircle}><MaterialIcons name="shopping-cart" size={40} color="#fff" /></View>
            <Text style={styles.title}>Lista da Bia</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor="#bbb" value={nome} onChangeText={setNome} /></View>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor="#bbb" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
            <Text style={styles.label}>Senha (Mínimo 6 dígitos)</Text>
            <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Crie uma senha" placeholderTextColor="#bbb" secureTextEntry={true} value={senha} onChangeText={setSenha} /></View>
            <TouchableOpacity style={styles.mainButton} onPress={lidarComCadastro} disabled={carregando}>
              <Text style={styles.mainButtonText}>{carregando ? 'Criando conta...' : 'Cadastrar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => setTelaAtual('login')}><Text style={styles.linkText}>Já tem uma conta? <Text style={styles.linkTextBold}>Faça Login</Text></Text></TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ================= TELA DASHBOARD (HOME) ================= */}
      {telaAtual === 'home' && (
        <View style={styles.dashboard}>
          <View style={styles.headerDashboard}>
            <View style={styles.profileArea}>
              <TouchableOpacity style={styles.avatarCircle} onPress={() => alert('Futuramente você poderá escolher sua foto aqui! 📸')}>
                <Text style={styles.avatarText}>{pegarIniciaisDoNome(usuarioLogado?.nome)}</Text>
              </TouchableOpacity>
              <View style={styles.welcomeTextArea}>
                <Text style={styles.welcomeSub}>Bem-vindo de volta,</Text>
                <Text style={styles.headerTitle} numberOfLines={1}>{usuarioLogado?.nome || 'Davi'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={lidarComLogout} style={styles.exitButton}>
              <MaterialIcons name="exit-to-app" size={26} color="#D14D5F" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Gasto Total das Listas Ativas (Mercado Atual)</Text>
              <Text style={styles.summaryValue}>R$ {calcularTotalGeralDoMes().toFixed(2).replace('.', ',')}</Text>
              <Text style={styles.summarySub}>Exibindo apenas somatórios parciais das listas em aberto</Text>
            </View>

            <Text style={styles.sectionTitle}>Ações Rápidas</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionItem} onPress={() => setModalListaVisivel(true)}>
                <View style={styles.actionIcon}><MaterialIcons name="add-shopping-cart" size={24} color="#D14D5F" /></View>
                <Text style={styles.actionLabel}>Nova Lista</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem} onPress={() => setTelaAtual('despensa')}>
                <View style={[styles.actionIcon, {backgroundColor: '#fff'}]}><MaterialIcons name="kitchen" size={25} color="#f39c12" /></View>
                <Text style={styles.actionLabel}>Despensa 📦</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => setTelaAtual('historico')}>
                <View style={styles.actionIcon}><MaterialIcons name="history" size={24} color="#555" /></View>
                <Text style={styles.actionLabel}>Histórico</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Minhas Listas Ativas</Text>
            {listasAtivas.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="playlist-add" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Nenhuma lista ativa encontrada.</Text>
                <Text style={styles.emptyStateSub}>Toque abaixo para criar sua primeira lista.</Text>
              </View>
            ) : (
              listasAtivas.map(item => (
                <TouchableOpacity key={item.id} style={styles.listCard} onPress={() => abrirLista(item, 'detalhe_lista')}>
                  <View>
                    <Text style={styles.listCardTitle}>{item.titulo}</Text>
                    <Text style={styles.listCardItens}>{buscarQuantidadeItens(item.id)}  •  {item.data}</Text>
                  </View>
                  <View style={styles.listCardRight}>
                    <Text style={styles.listCardValue}>R$ {calcularTotalDaLista(item.id, item).toFixed(2).replace('.', ',')}</Text>
                    <Text style={[styles.listCardStatus, {color: '#f1c40f'}]}>{item.status}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={{height: 100}} />
          </ScrollView>

          <TouchableOpacity style={styles.fab} onPress={() => setModalListaVisivel(true)}>
            <MaterialIcons name="add" size={24} color="#fff" /><Text style={styles.fabText}>Criar Lista</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= TELA DETALHE DA LISTA ================= */}
      {(telaAtual === 'detalhe_lista' || telaAtual === 'detalhe_historico') && listaSelecionada && (
        <View style={styles.dashboard}>
          <View style={styles.headerDashboard}>
            <TouchableOpacity onPress={() => setTelaAtual(telaAtual === 'detalhe_historico' ? 'historico' : 'home')}>
              <MaterialIcons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{listaSelecionada.titulo}</Text>
            
            {telaAtual === 'detalhe_lista' ? (
              <TouchableOpacity style={styles.btnHeaderFinalizar} onPress={finalizarListaReal}>
                <Text style={styles.btnHeaderFinalizarText}>Finalizar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.btnHistoricoAcoes}>
                {temProdutosZerados(listaSelecionada.id) && (
                  <TouchableOpacity 
                    style={[styles.btnHeaderFinalizar, {backgroundColor: '#f39c12', paddingHorizontal: 10}]} 
                    onPress={continuarComPrandoZerados}
                  >
                    <Text style={styles.btnHeaderFinalizarText}>Continuar Compras 🛒</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.btnHeaderFinalizar, {backgroundColor: '#2ecc71', paddingHorizontal: 10}]} onPress={abrirModalRefazerCompra}>
                  <Text style={styles.btnHeaderFinalizarText}>Refazer Compra 🔁</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[styles.summaryCard, {backgroundColor: '#333'}]}>
            <Text style={[styles.summaryLabel, {color: '#bbb'}]}>
              {telaAtual === 'detalhe_historico' ? 'Gasto Total Acumulado (Todos os mercados)' : 'Gasto Neste Mercado Atual'}
            </Text>
            <Text style={[styles.summaryValue, {color: '#fff'}]}>
              R$ {telaAtual === 'detalhe_historico' 
                ? (listaSelecionada.valorFinal || 0).toFixed(2).replace('.', ',') 
                : calcularTotalDaLista(listaSelecionada.id, listaSelecionada).toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            {telaAtual === 'detalhe_historico' ? 'Produtos Comprados' : 'Produtos da Lista (Toque p/ pegar)'}
          </Text>
          
          <FlatList
            data={produtosPorLista[listaSelecionada.id] || []}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const exibirComoPego = item.comprado && item.valor > 0;
              return (
                <TouchableOpacity style={styles.productCard} onPress={() => gerenciarCliqueProduto(item)}>
                  <MaterialIcons 
                    name={exibirComoPego ? "check-box" : "checkbox-blank-outline"} 
                    size={24} 
                    color={exibirComoPego ? '#2ecc71' : '#ccc'} 
                  />
                  <View style={{flex: 1, marginLeft: 10}}>
                    <Text style={[styles.productName, exibirComoPego && styles.textLineThrough]}>{item.nome}</Text>
                    <Text style={styles.productMeta}>
                      {item.categoria}  •  {item.quantidade}x R$ {item.valor.toFixed(2).replace('.', ',')}
                      {item.faturado_etapa_anterior && telaAtual === 'detalhe_lista' ? ' (Mercado Anterior)' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.productSubtotal, exibirComoPego && styles.textLineThrough]}>
                    R$ {(item.quantidade * item.valor).toFixed(2).replace('.', ',')}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="add-task" size={40} color="#ccc" />
                <Text style={styles.emptyStateText}>Nenhum produto cadastrado.</Text>
              </View>
            }
          />

          {telaAtual === 'detalhe_lista' && (
            <TouchableOpacity style={[styles.fab, {backgroundColor: '#D14D5F'}]} onPress={() => setModalProdutoVisivel(true)}>
              <MaterialIcons name="add" size={24} color="#fff" /><Text style={styles.fabText}>Novo Produto</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ================= TELA DA DESPENSA ================= */}
      {telaAtual === 'despensa' && (
        <View style={styles.dashboard}>
          <View style={styles.headerDashboard}>
            <TouchableOpacity onPress={() => setTelaAtual('home')}>
              <MaterialIcons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Minha Despensa 📦</Text>
            <View style={{width: 28}} />
          </View>

          <FlatList 
            data={itensDespensa}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.despensaCard} onPress={() => gerenciarCliqueItemDespensa(item)}>
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 16, fontWeight: 'bold', color: '#333'}}>{item.nome}</Text>
                  <Text style={{fontSize: 12, color: '#666', marginTop: 2}}>{item.categoria}</Text>
                </View>
                <View style={styles.despensaQtdBadge}>
                  <Text style={styles.despensaQtdBadgeText}>{item.quantidade} un</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="kitchen" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Despensa vazia!</Text>
                <Text style={styles.emptyStateSub}>Toque abaixo para cadastrar itens manualmente.</Text>
              </View>
            }
          />

          <TouchableOpacity style={[styles.fab, {backgroundColor: '#f39c12'}]} onPress={() => setModalNovoItemDespensaVisivel(true)}>
            <MaterialIcons name="add" size={24} color="#fff" /><Text style={styles.fabText}>Novo Item</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= TELA DE HISTÓRICO ================= */}
      {telaAtual === 'historico' && (
        <View style={styles.dashboard}>
          <View style={styles.headerDashboard}>
            <TouchableOpacity onPress={() => setTelaAtual('home')}><MaterialIcons name="arrow-back" size={28} color="#333" /></TouchableOpacity>
            <Text style={styles.headerTitle}>Histórico de Compras</Text>
            <View style={{width: 28}} />
          </View>

          <FlatList 
            data={listasFinalizadas}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.listCard, { borderColor: '#2ecc71', borderWidth: 1 }]} onPress={() => abrirLista(item, 'detalhe_historico')}>
                <View>
                  <Text style={styles.listCardTitle}>{item.titulo}</Text>
                  <Text style={styles.listCardItens}>{buscarQuantidadeItens(item.id)}  •  {item.data}</Text>
                </View>
                <View style={styles.listCardRight}>
                  <Text style={[styles.listCardValue, { color: '#2ecc71' }]}>R$ {(item.valorFinal || 0).toFixed(2).replace('.', ',')}</Text>
                  <Text style={[styles.listCardStatus, { color: '#2ecc71' }]}>Ver Tudo ➔</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="history" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>Histórico vazio</Text>
              </View>
            }
          />
        </View>
      )}

      {/* ================= MODAL: CRIAR LISTA ================= */}
      <Modal visible={modalListaVisivel} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity style={styles.modalBtnHeaderCancel} onPress={() => setModalListaVisivel(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>Nova Lista</Text>
              <TouchableOpacity style={styles.modalBtnHeaderSave} onPress={criarNovaListaReal}>
                <Text style={styles.modalBtnTextSave}>Criar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabelMicro}>Nome da Lista</Text>
              <TextInput style={styles.modalInput} placeholder="Ex: Compras do Mês" value={nomeNovaLista} onChangeText={setNomeNovaLista} />
              <Text style={styles.inputLabelMicro}>Data da Compra (Opcional)</Text>
              <TextInput style={styles.modalInput} placeholder="Ex: 23/05/2026" value={dataNovaLista} onChangeText={setDataNovaLista} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: REFAZER LISTA ================= */}
      <Modal visible={modalClonarVisivel} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity style={styles.modalBtnHeaderCancel} onPress={() => setModalClonarVisivel(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>Refazer Lista</Text>
              <TouchableOpacity style={styles.modalBtnHeaderSave} onPress={confirmarRefazerCompraDoHistorico}>
                <Text style={styles.modalBtnTextSave}>Começar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabelMicro}>Nome da Nova Lista</Text>
              <TextInput style={styles.modalInput} value={nomeListaClonada} onChangeText={setNomeListaClonada} placeholder="Ex: Mercado de Junho" />
              <Text style={styles.inputLabelMicro}>Data (Opcional)</Text>
              <TextInput style={styles.modalInput} value={dataListaClonada} onChangeText={setDataListaClonada} placeholder="Ex: 06/06/2026" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: AJUSTAR ESTOQUE DA DESPENSA ================= */}
      <Modal visible={modalDespensaVisivel} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity style={styles.modalBtnHeaderCancel} onPress={() => setModalDespensaVisivel(false)}>
                <Text style={styles.modalBtnTextCancel}>Fechar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>{itemDespensaSelecionado?.nome}</Text>
              <View style={{width: 50}} />
            </View>
            <View style={{alignItems: 'center', marginTop: 10}}>
              <Text style={{fontSize: 14, color: '#666'}}>{itemDespensaSelecionado?.categoria}</Text>
              <Text style={styles.inputLabelMicro}>Quantidade em Estoque</Text>
            </View>
            <View style={styles.modalDespensaControles}>
              <TouchableOpacity style={styles.btnModalDespensaOp} onPress={() => ajustarQtdNoModalDespensa('menos')}>
                <MaterialIcons name="remove" size={28} color="#D14D5F" />
              </TouchableOpacity>
              <Text style={styles.textModalDespensaQtd}>{itemDespensaSelecionado?.quantidade}</Text>
              <TouchableOpacity style={styles.btnModalDespensaOp} onPress={() => ajustarQtdNoModalDespensa('mais')}>
                <MaterialIcons name="add" size={28} color="#2ecc71" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: ADICIONAR NA LISTA ================= */}
      <Modal visible={modalProdutoVisivel} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity style={styles.modalBtnHeaderCancel} onPress={() => setModalProdutoVisivel(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>Produto</Text>
              <TouchableOpacity style={styles.modalBtnHeaderSave} onPress={adicionarProdutoReal}>
                <Text style={styles.modalBtnTextSave}>Inserir</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabelMicro}>Nome do Produto</Text>
              <TextInput style={styles.modalInput} placeholder="Ex: Arroz Tio João" value={nomeProduto} onChangeText={setNomeProduto} />
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{width: '48%'}}>
                  <Text style={styles.inputLabelMicro}>Quantidade</Text>
                  <TextInput style={styles.modalInput} keyboardType="numeric" value={qtdProduto} onChangeText={setQtdProduto} />
                </View>
                <View style={{width: '48%'}}>
                  <Text style={styles.inputLabelMicro}>Valor Unitário (R$)</Text>
                  <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="0,00" value={valorProduto} onChangeText={setValorProduto} />
                </View>
              </View>
              <Text style={styles.inputLabelMicro}>Selecione a Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection: 'row', marginVertical: 10}}>
                {CATEGORIAS.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.catBadge, cat === categoriaSelecionada ? styles.catBadgeActive : null]} onPress={() => setCategoriaSelecionada(cat)}>
                    <Text style={cat === categoriaSelecionada ? styles.catBadgeTextActive : styles.catBadgeText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: ADICIONAR DIRETO DESPENSA ================= */}
      <Modal visible={modalNovoItemDespensaVisivel} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity style={styles.modalBtnHeaderCancel} onPress={() => setModalNovoItemDespensaVisivel(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>Item p/ Despensa</Text>
              <TouchableOpacity style={styles.modalBtnHeaderSave} onPress={adicionarItemDiretoDespensa}>
                <Text style={styles.modalBtnTextSave}>Guardar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabelMicro}>Nome do Alimento / Item</Text>
              <TextInput style={styles.modalInput} placeholder="Ex: Feijão Camil" value={nomeProduto} onChangeText={setNomeProduto} />
              
              <Text style={styles.inputLabelMicro}>Quantidade</Text>
              <TextInput style={styles.modalInput} keyboardType="numeric" value={qtdProduto} onChangeText={setQtdProduto} />
              
              <Text style={styles.inputLabelMicro}>Selecione a Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection: 'row', marginVertical: 10}}>
                {CATEGORIAS.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.catBadge, cat === categoriaSelecionada ? styles.catBadgeActive : null]} onPress={() => setCategoriaSelecionada(cat)}>
                    <Text style={cat === categoriaSelecionada ? styles.catBadgeTextActive : styles.catBadgeText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: EDITAR PRODUTO ================= */}
      <Modal visible={modalEditarVisivel} transparent={true} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity style={styles.modalBtnHeaderCancel} onPress={() => setModalEditarVisivel(false)}>
                <Text style={styles.modalBtnTextCancel}>Voltar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>Editar: {produtoSendoEditado?.nome}</Text>
              <TouchableOpacity style={styles.modalBtnHeaderDelete} onPress={deletarProdutoDaLista}>
                <MaterialIcons name="delete-forever" size={24} color="#e74c3c" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnHeaderSave} onPress={salvarDadosProdutoEditado}>
                <Text style={styles.modalBtnTextSave}>Carrinho</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{width: '48%'}}>
                  <Text style={styles.inputLabelMicro}>Quantidade</Text>
                  <TextInput style={styles.modalInput} keyboardType="numeric" value={qtdProduto} onChangeText={setQtdProduto} />
                </View>
                <View style={{width: '48%'}}>
                  <Text style={styles.inputLabelMicro}>Preço de Hoje (R$)</Text>
                  <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="0,00" value={valorProduto} onChangeText={setValorProduto} autoFocus={true} />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
    </KeyboardAvoidingView>
  );
}