//npm run devStart  PARA STARTAR O SERVIDOR

const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


const express = require('express');

const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const fs = require('fs');
const router = express.Router();

const Community = require('./models/Community');
//const userDoc = require('./users.json');

const EventEmitter = require('events');
const eventos = new EventEmitter();

const port = 3000;
//const path = require("path");

const initializePassport = require('./passport-config');
const multer = require('multer');
const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON

const storage = multer.diskStorage({}); // Não salvar localmente
const upload = multer({ storage });

// Middleware para fazer o parse do corpo das solicitações como JSON
app.use(express.static('public')); // Para servir arquivos estáticos

// Registre as rotas de comunidade
//app.use('/FindComunidades', communityRoutes);

app.use(express.json()); // Para parsear JSON no corpo da requisição
app.use(express.urlencoded({ extended: true })); // Para parsear dados de formulários

mongoose.connect('mongodb+srv://codemaster:EmL7bmHukQAklr7H@cluster0.vqzke.mongodb.net/minha-rede-social?retryWrites=true&w=majority')
  .then(() => console.log('Conectado ao MongoDB Atlas, **meu chifrudinho fofo**!'))
  .catch(err => console.error('Erro na conexão, **meu broxa fedorento**:', err));

  

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  amigos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Referência para amigos,
  publicacoes: [{
    conteudo: String,
    data: { type: Date, default: Date.now },
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Referência para o autor
  }],
  profileImagePath: { type: String, default: './views/dir.jpg' }, // Caminho da imagem de perfil padrão
  coverImagePath: { type: String, default: './views/default-cover-image.jpg' }, // Caminho da imagem de capa padrão
  profileImagePathNoView: { type: String, default: 'dir.jpg' }, // Caminho da imagem de perfil sem o prefixo
  declaracoes: { type: Array, default: [] }, // Declarações do usuário
  comentarios: { type: Array, default: [] }, // Comentários do usuário
  comunidades: { type: Array, default: [] }, // Comunidades do usuário
  comunidadesDono: { type: Array, default: [] }, // Comunidades que o usuário é dono
  publicacoesAmigos: { type: Array, default: [] }, // Publicações dos amigos
});

const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      amigos: [],
      publicacoes: [],
      profileImagePath: './views/dir.jpg', // Caminho da imagem de perfil padrão
      coverImagePath: './views/default-cover-image.jpg', // Caminho da imagem de capa padrão
      profileImagePathNoView: 'dir.jpg', // Caminho da imagem de perfil sem o prefixo
      declaracoes: [], // Declarações do usuário
      comentarios: [], // Comentários do usuário
      comunidades: [], // Comunidades do usuário
      comunidadesDono: [], // Comunidades que o usuário é dono
      publicacoesAmigos: [], // Publicações dos amigos
    });

    await newUser.save();
    res.status(201).send('Usuário registrado com sucesso, **meu pirulito fofinho**!');
  } catch (error) {
    console.error('Erro ao registrar usuário, **meu bobinho sem jeito**:', error);
    res.status(500).send('Erro ao registrar usuário.');
  }
});

// Configuração do body-parser para lidar com requisições POST
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/data', express.static(path.join(__dirname, 'view/data'))); // Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Caminho para o arquivo JSON de publicações
const PUBLICACOES_PATH = path.join(__dirname, 'publicacoes.json');
const USERS_PATH = path.join(__dirname, 'users.json');

initializePassport(
  passport,
  async (email) => {
    const user = await User.findOne({ email: email }); // Busca o usuário no MongoDB
    return user ? user : null;
  },
  async (id) => {
    const user = await User.findById(id); // Busca o usuário por ID no MongoDB
    return user ? user : null;
  }
);

app.use(express.static(path.join(__dirname, 'data')));
//app.use(express.static('./views'));
//app.set('view-engine', 'ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/views'));
app.use(express.urlencoded({ extended: false }));
app.use(flash());

const FileStore = require('session-file-store')(session);

//-----------------------------

app.use(session({
  store: new FileStore({
    path: path.join(__dirname, 'sessions'), // Caminho para o diretório de sessões
  }),
  secret: process.env.SESSION_SECRET || 'fallbackSecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hora
    secure: false,
    httpOnly: true,
  },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

function reloadUsersData() {
  users = loadUsersFromFile();
}

//--------------------------------------------
app.post('/upload', upload.single('profileImage'), async (req, res) => {
  try {
      const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'perfil_usuarios', // Pasta no Cloudinary
          transformation: [{ width: 300, height: 300, crop: 'fill' }],
      });

      // Atualize o usuário com a URL da imagem
      const currentUser = await User.findById(req.user.id);
      currentUser.profileImagePath = result.secure_url; // URL segura da imagem
      await currentUser.save();

      res.json({ message: 'Imagem de perfil atualizada com sucesso!', url: result.secure_url });
  } catch (err) {
      console.error('Erro ao fazer upload:', err);
      res.status(500).json({ error: 'Erro ao enviar imagem.' });
  }
});

// No lado do servidor (app.js)
app.post('/upload-cover', upload.single('coverImage'), async (req, res) => {
  try {
      const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'capa_usuarios', // Pasta no Cloudinary
          transformation: [{ width: 1200, height: 300, crop: 'fill' }], // Ajuste as dimensões conforme necessário
      });

      // Atualize o usuário com a URL da imagem de capa
      const currentUser = await User.findById(req.user.id);
      currentUser.coverImagePath = result.secure_url; // URL segura da imagem
      await currentUser.save();

      res.json({ message: 'Imagem de capa atualizada com sucesso!', url: result.secure_url });
  } catch (err) {
      console.error('Erro ao fazer upload da capa:', err);
      res.status(500).json({ error: 'Erro ao enviar imagem de capa.' });
  }
});
//-----------

async function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  try {
    const response = await fetch('http://localhost:3000/check-auth', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      return next();
    } else {
      console.log('Sessão expirada. Tentando relogar...');
      await relogar();
      return next();
    }
  } catch (err) {
    console.error('Erro ao verificar autenticação:', err);
    res.status(500).send('Erro ao verificar autenticação.');
  }
}

// Suponha que você tenha um endpoint para obter os dados do usuário
app.get('/dados-usuario', ensureAuthenticated, (req, res) => {

const user = req.user;
  res.json({
    nome: user.name,
    email: user.email,
    profileImagePath: user.profileImagePath, // Certifique-se de que isso corresponde ao caminho correto da imagem
    coverImagePath: user.coverImagePath,
    profileImagePathNoView : user.profileImagePathNoView,
    declaracoes: user.declaracoes,
    comentarios:user.comentarios,
    amigos: user.amigos,
    publicacoes: user.publicacoes,
    publicacoesAmigos : user.amigos.publicacoesAmigos,
    comunidades: user.comunidades,
    comunidadesDono:user.comunidadesDono
  });
  // Envie os dados do usuário como resposta JSON
 // res.json(dadosUsuario);
});

app.get('/perfil', ensureAuthenticated, (req, res) => {
  const nomeDoUsuario = req.user.name;

  // Renderize a página e passe as informações do usuário como variáveis
  res.render('perfil', { user: { name: nomeDoUsuario } });
});

app.get('/feed', ensureAuthenticated, async (req, res) => {
  try {
    const currentUser = req.user;

    // Busca as comunidades que o usuário participa (como membro ou dono)
    const comunidadesDoUsuario = await Community.find({
      $or: [
        { membros: currentUser._id }, // Comunidades que o usuário é membro
        { donoId: currentUser._id }   // Comunidades que o usuário é dono
      ]
    })
      .select('nome imagemPerfilNoView membros')
      .limit(9) // Limita a 9 comunidades
      .lean();

    // Busca os amigos do usuário
    const amigosDoUsuario = await User.find({
      _id: { $in: currentUser.amigos } // Filtra os amigos pelo ID
    })
      .select('name profileImagePath')
      .limit(9) // Limita a 9 amigos
      .lean();

    // Renderiza o feed com o usuário atual, suas comunidades, amigos e publicações
    res.render('feed', {
      user: currentUser,
      comunidades: comunidadesDoUsuario, // Apenas as comunidades que o usuário participa
      amigos: amigosDoUsuario,
      publicacoes: [] // Adicione as publicações aqui, se necessário
    });
  } catch (error) {
    console.error('Erro ao carregar o feed:', error);
    res.status(500).send('Erro ao carregar o feed.');
  }
});

// Função para escrever usuários no arquivo JSON
function writeUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}

// Adicione isso ao seu arquivo app.js
app.get('/dados-amigos', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const users = loadUsersFromFile(); // Carregar dados dos usuários
  const currentUser = users.find(user => user.id === userId);

  if (currentUser && currentUser.amigos) {
      const amigos = currentUser.amigos.map(amigoId => {
          return users.find(user => user.id === amigoId);
      }).filter(amigo => amigo); // Filtrar amigos que não foram encontrados

      res.json({ amigos }); // Retornar os dados dos amigos em formato JSON
  } else {
      res.json({ amigos: [] }); // Retornar uma lista vazia se não houver amigos
  }
});

app.get('/', checkAuthenticated, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});


app.post('/login', checkNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({ message: 'Login bem-sucedido', user });
    });
  })(req, res, next);
});

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

//---------------------------------------------------
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Usuário não autenticado. Faça login novamente.' });
}
//----------------------------------------------

async function relogar() {
  const email = localStorage.getItem('email');
  const password = localStorage.getItem('password');

  if (email && password) {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        console.log('Relogin bem-sucedido!');
      } else {
        console.error('Erro ao relogar:', await response.text());
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Erro de rede ao relogar:', err);
      alert('Não foi possível relogar. Tente novamente.');
    }
  } else {
    alert('Credenciais ausentes. Por favor, faça login novamente.');
    window.location.href = '/login';
  }
}

app.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ message: 'Usuário autenticado' });
  } else {
    res.status(401).json({ message: 'Sessão expirada' });
  }
});

app.delete('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir a sessão:', err);
      return res.status(500).send('Erro ao deslogar.');
    }
    res.redirect('/login');
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

// Função para salvar usuários no arquivo JSON
function saveUsersToFile(users) {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf-8');
}




// Função para carregar usuários do arquivo JSON ------------------------------------------------------------------------
function  loadUsersFromFile() {
  try {
    const data = fs.readFileSync('users.json', 'utf-8');
    const users = JSON.parse(data);
    
    // Verifica se o campo 'declaracoes' existe em cada registro de usuário
    users.forEach(user => {
      if (!user.declaracoes) {
        user.declaracoes = [];
      }

      if (!user.amigos) { // Adiciona a verificação para a lista de amigos------------***********-----------DENTRO DISSO FAZER VERIFICAÇÃO E COLHER AS PÚBLICAÇÕES PARA DEPOIS ORGANIZAR POR DATA ************* -----------------------
        user.amigos = [];
      }

      if (!user.publicacoesAmigos) {
        user.publicacoesAmigos = []; // Cria a nova propriedade
      }

      if (!user.publicacoes) {
        user.publicacoes = [];
      }
    });

    return users;
  } catch (error) {
    // Se o arquivo não existe, retorna um array vazio
    return [];
  }
}

//---------------------------------------
app.post('/salvar-declaracao', ensureAuthenticated, async (req, res) => {
  const declaration = req.body.declaration; // Texto da declaração
  const userId = req.user.id; // ID do usuário autenticado

  if (!declaration) {
    return res.status(400).json({ error: 'A declaração não pode estar vazia.' });
  }

  try {
    // Busca o usuário no banco de dados
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Adiciona a declaração ao array de declarações do usuário
    user.declaracoes.push(declaration);
    await user.save(); // Salva as alterações no banco de dados

    res.status(200).json({ message: 'Declaração salva com sucesso!', declaration });
  } catch (error) {
    console.error('Erro ao salvar declaração:', error);
    res.status(500).json({ error: 'Erro ao salvar declaração.' });
  }
});


   //---------------------------------------------------------------------------------------------
// Função para adicionar nova publicação ao campo de publicações do usuário
app.post('/adicionar-publicacao', ensureAuthenticated, (req, res) => {
  const currentUser = req.user; // Usuário atual

  const novaPublicacao = {
    id: gerarIdUnico(), // Função para gerar um ID único para a publicação
    autor: currentUser.id,
    conteudo: req.body.conteudo, // Conteúdo da publicação enviado no corpo da requisição
    data: new Date().toISOString() // Data atual no formato ISO
  };

  // Adiciona a nova publicação ao campo de publicações do usuário atual
  currentUser.publicacoes.push(novaPublicacao);
  

  // Atualiza o arquivo de usuários com a nova publicação adicionada
  const users = loadUsersFromFile();
  const userIndex = users.findIndex(user => user.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex].publicacoes = currentUser.publicacoes;
    writeUsers(users); // Salva os usuários atualizados
  }

  // Atualiza as publicações dos amigos
  currentUser.amigos.forEach(amigoId => {
    const amigo = users.find(user => user.id === amigoId);
    if (amigo) {
      amigo.publicacoesAmigos.push(novaPublicacao); // Adiciona a publicação ao campo `publicacoesAmigos`
    }
  });

// Força a sessão a ser salva novamente, caso tenha sido modificada
req.session.touch();

  req.session.save((err) => {
  if (err) {
    console.error('Erro ao salvar a sessão:', err);
    return res.status(500).send('Erro ao salvar a sessão');
  }
  });
  // Redireciona de volta ao feed para exibir a nova publicação
  res.redirect('/feed');
  });

  function gerarIdUnico() {
  return '_' + Math.random().toString(36).substr(2, 9);
  }
  
  //xxxx
  // Rota para salvar a publicação do usuário
  app.post('/salvar-publicacao', ensureAuthenticated, (req, res) => {
  const publicacao = req.body.publicacao;
 // if (!req.session || !req.session.userId) {
 //   return res.status(401).send('Você foi desconectado. Faça login novamente.');
 // }

  if (!publicacao) {
    return res.status(400).json({ error: 'A publicação não pode estar vazia.' });
  }

  const userId = req.user.id;

  let users = [];

  try {
    users = loadUsersFromFile();
  } catch (error) {
    console.error('Erro ao ler o arquivo JSON:', error);
    return res.status(500).json({ error: 'Erro ao ler o arquivo JSON.' });
  }

  const currentUser = users.find(user => user.id === userId);
  if (!currentUser) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

   const newPublicacao = {
    conteudo: publicacao,
    data: new Date().toISOString(),  // Data atual em formato ISO
    //autor: user.id  // Pode ser o nome ou ID do autor
    autor: currentUser.id  // Pode ser o nome ou ID do autor
    //========================================================
  };

   // Adiciona a nova publicação ao usuário
   if (!currentUser.publicacoes) {
    currentUser.publicacoes = [];
  }
  currentUser.publicacoes.push(newPublicacao); // Adiciona à lista de publicações


// Salva o arquivo JSON atualizado com todos os usuários
  try {
    fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(users, null, 2), 'utf-8');
    console.log('Publicação salva com sucesso!');
    res.status(200).json({ message: 'Publicação salva com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar o arquivo JSON:', error);
    return res.status(500).json({ error: 'Erro ao salvar a publicação.' });
  }

  // Força a sessão a ser salva novamente, caso tenha sido modificada
  req.session.touch();

  req.session.save((err) => {
  if (err) {
    console.error('Erro ao salvar a sessão:', err);
    return res.status(500).send('Erro ao salvar a sessão');
  }
  });
  //res.status(200).json({ message: 'Publicação salva com sucesso!' });
});

  //=================================================================
  // Função para carregar publicações dos amigos e atualizar o JSON
function carregarPublicacoesDosAmigos(amigos) {
  let publicacoesAmigos = [];

  amigos.forEach(amigoId => {
    const amigo = users.find(user => user.id === amigoId);

    if (amigo && amigo.publicacoes) {
      // Adiciona as publicações do amigo ao array
      amigo.publicacoes.forEach(pub => {
        publicacoesAmigos.push({
          conteudo: pub.conteudo,
          data: pub.data,
          autor: amigo.username
        });
      });
    }
  });

  return publicacoesAmigos;
}

// Função para atualizar o arquivo publicacoes.json
function atualizarPublicacoesJSON(publicacoes) {
  // Converte o array de publicações para JSON
  const publicacoesJSON = JSON.stringify(publicacoes, null, 2);
  
  // Salva no arquivo publicacoes.json
  fs.writeFile('publicacoes.json', publicacoesJSON, (err) => {
    if (err) {
      console.error('Erro ao atualizar o arquivo publicacoes.json:', err);
    } else {
      console.log('publicacoes.json atualizado com sucesso.');
    }
  });
}

//-----------------------------

// Rota para salvar um novo usuário
app.post('/salvar-usuario', (req, res) => {
  // Extrai os dados do corpo da solicitação
  const { name, email, password } = req.body;

  // Verifica se há dados suficientes
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  // Cria um novo objeto de usuário
  const newUser = {
    id: generateUserId(), // Implemente a lógica para gerar um ID único
    name: name,
    email: email,
    password: hashPassword(password), // Implemente a lógica para criptografar a senha
    profileImagePath:`./views/dir.jpg`,
    coverImagePath:`./views/default-cover-image.jpg`,
    profileImagePathNoView :`dir.jpg`,
    declaracoes: [], // Inicializa o campo de declarações como um array vazio
    comentarios: [],
    amigos: [], // Inicializa a lista de amigos vazia
    publicacoes: [], // Inicialmente, sem publicações
    publicacoesAmigos:[],
    comunidades:[],
    comunidadesDono:[]
  };

  // Carrega os dados atuais do arquivo JSON
  let users = [];
  try {
    users = loadUsersFromFile();
  } catch (error) {
    console.error('Erro ao ler o arquivo JSON:', error);
    return res.status(500).json({ error: 'Erro ao ler o arquivo JSON.' });
  }

  // Adiciona o novo usuário à lista de usuários
  users.push(newUser);

  // Salva os dados atualizados no arquivo JSON
  try {
    saveUsersToFile(users);
    console.log('Novo usuário salvo com sucesso:', newUser.id);
    // Retorna o novo usuário como resposta
    res.json(newUser);
  } catch (error) {
    console.error('Erro ao gravar no arquivo JSON:', error);
    return res.status(500).json({ error: 'Erro ao gravar no arquivo JSON.' });
  }
});



app.post("/amigo/adicionar", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const friendId = req.body.friendId;


  if (!friendId) {
    return res.status(400).json({ error: "ID do amigo ausente na solicitação." });
  }
  // Verifica se o usuário está tentando adicionar a si mesmo
  if (userId.toString() === friendId.toString()) {
    return res.status(400).json({ error: "Você não pode se adicionar como amigo." });
  }
    // Verifica se o usuário está tentando adicionar a si mesmo
    if (userId.toString() === friendId.toString()) {
      return res.status(400).json({ error: "Você não pode se adicionar como amigo." });
    }

  try {
    // Busca o usuário atual e o amigo no MongoDB
    const currentUser = await User.findById(userId);
    const friendUser = await User.findById(friendId);

    if (!friendUser) {
      return res.status(404).json({ error: "Amigo não encontrado." });
    }

    // Verifica se já são amigos
    if (currentUser.amigos.includes(friendId)) {
      return res.status(400).json({ error: "Este usuário já é seu amigo." });
    }

    // Adiciona o amigo à lista de amigos do usuário atual
    currentUser.amigos.push(friendId);
    await currentUser.save();

    // Adiciona o usuário atual à lista de amigos do amigo
    friendUser.amigos.push(userId);
    await friendUser.save();

    res.json({ success: true, amigos: currentUser.amigos });
  } catch (error) {
    console.error('Erro ao adicionar amigo:', error);
    res.status(500).json({ error: "Erro ao adicionar amigo." });
  }
});


app.post("/amigo/remover", ensureAuthenticated, async (req, res) => {
  const userId = req.user._id; // Use _id em vez de id
  const friendId = req.body.friendId;

  if (!friendId) {
    return res.status(400).json({ error: "ID do amigo ausente na solicitação." });
  }

  try {
    // Busca o usuário atual e o amigo no MongoDB
    const currentUser = await User.findById(userId);
    const friendUser = await User.findById(friendId);

    if (!friendUser) {
      return res.status(404).json({ error: "Amigo não encontrado." });
    }

    // Converte os IDs para strings para comparação
    const currentUserIdStr = currentUser._id.toString();
    const friendIdStr = friendUser._id.toString();

    // Verifica se são amigos
    if (!currentUser.amigos.some(id => id.toString() === friendIdStr)) {
      return res.status(400).json({ error: "Este usuário não é seu amigo." });
    }

    // Remove o amigo da lista de amigos do usuário atual
    currentUser.amigos = currentUser.amigos.filter(id => id.toString() !== friendIdStr);
    await currentUser.save();

    // Remove o usuário atual da lista de amigos do amigo
    friendUser.amigos = friendUser.amigos.filter(id => id.toString() !== currentUserIdStr);
    await friendUser.save();

    res.json({ success: true, amigos: currentUser.amigos });
  } catch (error) {
    console.error('Erro ao remover amigo:', error);
    res.status(500).json({ error: "Erro ao remover amigo." });
  }
});


app.post('/buscar-usuario', ensureAuthenticated, async (req, res) => {
  const email = req.body.email;

  try {
    const usuarioEncontrado = await User.findOne({ email: email });
    if (usuarioEncontrado) {
      res.json(usuarioEncontrado); // Retorna o usuário encontrado, incluindo o _id
    } else {
      res.status(404).json({ error: "Usuário não encontrado." });
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});



// Função para carregar o JSON de um arquivo
function carregarJson(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
}

app.post("/amigo/adicionar", ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const friendId = req.body.friendId;

  if (!friendId) {
    return res.status(400).json({ error: "ID do amigo ausente na solicitação." });
  }

  const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON
  //const currentUser = users.find(user => user.id === userId);
  //const friendUser = users.find(user => user.id === friendId);
  //const friendUser = await User.findById(userId);
 // const currentUser = await User.findById(userId);

  if (!friendUser) {
    return res.status(404).json({ error: "Amigo não encontrado." });
  }

  // Verificar se já são amigos
  if (currentUser.amigos.includes(friendId)) {
    return res.status(400).json({ error: "Este usuário já é seu amigo." });
  }

  // Adicionar o amigo
  currentUser.amigos.push(friendId);
  saveUsersToFile(users);

  // Emitir evento de adição de amigo
  eventos.emit('amigoAdicionado', userId, friendId);

  // Retornar o sucesso
  res.json({ success: true, amigos: currentUser.amigos });
});


app.post("/amigo/remover", ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const friendId = req.body.friendId;

  if (!friendId) {
    return res.status(400).json({ error: "ID do amigo ausente na solicitação." });
  }

  const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON
  const currentUser = users.find(user => user.id === userId);
 const friendUser = users.find(user => user.id === friendId);
 //const friendUser = await User.findById(userId);
 // const currentUser = await User.findById(userId);

  if (!friendUser) {
    return res.status(404).json({ error: "Amigo não encontrado." });
  }

  // Verificar se são amigos
  const friendIndex = currentUser.amigos.indexOf(friendId);
  if (friendIndex === -1) {
    return res.status(400).json({ error: "Este usuário não é seu amigo." });
  }

  // Remover o amigo
  currentUser.amigos.splice(friendIndex, 1);
  saveUsersToFile(users);

  // Emitir evento de remoção de amigo
  eventos.emit('amigoRemovido', userId, friendId);

  // Retornar o sucesso
  res.json({ success: true, amigos: currentUser.amigos });
});




app.get('/perfil/:id', ensureAuthenticated, async (req, res) => {
  const userId = req.params.id;

  try {
    // Verifica se o userId é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send('ID do usuário inválido.');
    }

    // Busca o usuário pelo ID no MongoDB
    const amigo = await User.findById(userId);
    if (!amigo) {
      return res.status(404).send('Amigo não encontrado');
    }

    // Renderiza a página do perfil com os dados do usuário encontrado
    res.render('amigoPerfil', {
      user: req.user, // Usuário logado
      amigo: amigo,   // Usuário cujo perfil está sendo acessado
      amigoName: amigo.name,
      amigoDeclaracoes: amigo.declaracoes || [],
      amigoProfileImagePath: amigo.profileImagePath,
      amigoCapaImagePath: amigo.coverImagePath,
      comunidadesComImagens: [], // Adicione lógica para carregar comunidades se necessário
    });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    res.status(500).send('Erro interno ao carregar o perfil.');
  }
});


//procurar comunidades
// Função para ler o arquivo JSON das comunidades
function carregarComunidades() {
  const caminhoArquivo = path.join(__dirname, 'comunidades.json');
  const comunidades = JSON.parse(fs.readFileSync(caminhoArquivo, 'utf-8'));
  return comunidades;
}

// Rota para procurar comunidades
// Rota para buscar comunidades
app.get('/FindComunidades', async (req, res) => {
  try {
    const nome = req.query.nome ? req.query.nome.trim() : '';
    const query = nome ? { nome: { $regex: nome, $options: 'i' } } : {};

    console.log('🔎 Buscando comunidades com query:', query);

    const comunidades = await Community.find(query).select('nome membros imagemPerfilNoView').lean();

    if (!comunidades || comunidades.length === 0) {
      console.log('⚠️ Nenhuma comunidade encontrada.');
      return res.json([]);
    }

    const comunidadesFormatadas = comunidades.map(comunidade => ({
      _id: comunidade._id,
      nome: comunidade.nome,
      quantidadeMembros: comunidade.membros?.length || 0,
      imagemPerfil: comunidade.imagemPerfilNoView || '/default-community.jpg'
    }));

    console.log(`✅ ${comunidadesFormatadas.length} comunidades encontradas.`);
    res.json(comunidadesFormatadas);
  } catch (err) {
    console.error('❌ Erro ao buscar comunidades:', err);
    res.status(500).json({ error: 'Erro ao buscar comunidades.' });
  }
});

// Ir para a página "encontrar comunidades"
app.get('/encontrar-comunidades', (req, res) => {
  res.render('procurarComunidades');
});

app.get('/FindUsers', async (req, res) => {
  const query = req.query.nome || '';

  try {
    let usuariosFiltrados;

    if (query.trim() === '') {
      // Se não há busca, retorna todos os usuários em ordem alfabética
      usuariosFiltrados = await User.find({}).sort({ name: 1 });
    } else {
      // Filtrar usuários que contenham a string no nome
      usuariosFiltrados = await User.find({ name: { $regex: query, $options: 'i' } }).sort({ name: 1 });
    }
    res.json(usuariosFiltrados);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: "Erro ao buscar usuários." });
  }
});


app.get('/procurar-usuarios', (req, res) => {
  res.render('procurarUsusarios'); // Renderiza o EJS da página de busca de usuários
});

 app.post('/entrar-comunidade', ensureAuthenticated, async (req, res) => {
  try {
    const comunidadeId = req.body.comunidadeId;
    const userId = req.user._id;

    // Verifica se o ID da comunidade é válido
    if (!mongoose.Types.ObjectId.isValid(comunidadeId)) {
      return res.status(400).json({ message: 'ID da comunidade inválido.' });
    }

    // Busca a comunidade no MongoDB
    const comunidade = await Community.findById(comunidadeId);

    if (!comunidade) {
      return res.status(404).json({ message: 'Comunidade não encontrada.' });
    }

    // Verifica se o usuário já é membro da comunidade
    if (comunidade.membros.includes(userId)) {
      return res.status(400).json({ message: 'Você já é membro desta comunidade.' });
    }

    // Adiciona o usuário à lista de membros da comunidade
    comunidade.membros.push(userId);
    comunidade.quantidadeMembros += 1;

    // Salva as alterações no banco de dados
    await comunidade.save();

    res.json({ message: 'Você entrou na comunidade!' });
  } catch (error) {
    console.error('Erro ao entrar na comunidade:', error);
    res.status(500).json({ error: 'Erro ao entrar na comunidade.' });
  }
});

app.post('/sair-comunidade', ensureAuthenticated, async (req, res) => {
  try {
    const comunidadeId = req.body.comunidadeId;
    const userId = req.user._id;

    // Verifica se o ID da comunidade é válido
    if (!mongoose.Types.ObjectId.isValid(comunidadeId)) {
      return res.status(400).json({ message: 'ID da comunidade inválido.' });
    }

    // Busca a comunidade no MongoDB
    const comunidade = await Community.findById(comunidadeId);

    if (!comunidade) {
      return res.status(404).json({ message: 'Comunidade não encontrada.' });
    }

    // Verifica se o usuário é membro da comunidade
    if (!comunidade.membros.includes(userId)) {
      return res.status(400).json({ message: 'Você não é membro desta comunidade.' });
    }

    // Remove o usuário da lista de membros da comunidade
    comunidade.membros = comunidade.membros.filter(membroId => membroId.toString() !== userId.toString());
    comunidade.quantidadeMembros -= 1;

    // Salva as alterações no banco de dados
    await comunidade.save();

    res.json({ message: 'Você saiu da comunidade!' });
  } catch (error) {
    console.error('Erro ao sair da comunidade:', error);
    res.status(500).json({ error: 'Erro ao sair da comunidade.' });
  }
});



app.post('/comunidade/:id/participar', ensureAuthenticated, async (req, res) => {
  try {
    const comunidade = await Community.findById(req.params.id);
    if (!comunidade) return res.status(404).send('Comunidade não encontrada.');

    const isMembro = comunidade.membros.includes(req.user._id);

    if (isMembro) {
      comunidade.membros.pull(req.user._id);
      comunidade.quantidadeMembros--;
      req.user.comunidades.pull(comunidade._id);
    } else {
      comunidade.membros.push(req.user._id);
      comunidade.quantidadeMembros++;
      req.user.comunidades.push(comunidade._id);
    }

    await comunidade.save();
    await req.user.save();

    res.json({ message: isMembro ? 'Saiu da comunidade.' : 'Entrou na comunidade.' });
  } catch (error) {
    console.error('Erro ao participar/sair da comunidade:', error);
    res.status(500).send('Erro ao atualizar participação.');
  }
});
app.post('/comunidade/:id/publicar', ensureAuthenticated, async (req, res) => {
  try {
    const comunidadeId = req.params.id;
    const userId = req.user._id;
    const { conteudo } = req.body;

    // Verifica se o ID da comunidade é válido
    if (!mongoose.Types.ObjectId.isValid(comunidadeId)) {
      return res.status(400).json({ message: 'ID da comunidade inválido.' });
    }

    // Busca a comunidade no MongoDB
    const comunidade = await Community.findById(comunidadeId);

    if (!comunidade) {
      return res.status(404).json({ message: 'Comunidade não encontrada.' });
    }

    // Cria a nova publicação
    const novaPublicacao = {
      autor: userId,
      conteudo: conteudo,
      data: new Date()
    };

    // Adiciona a publicação ao feed da comunidade
    comunidade.feed.push(novaPublicacao);

    // Salva as alterações no banco de dados
    await comunidade.save();

    res.json({ message: 'Publicação salva com sucesso!', publicacao: novaPublicacao });
  } catch (error) {
    console.error('Erro ao publicar na comunidade:', error);
    res.status(500).json({ error: 'Erro ao publicar na comunidade.' });
  }
});

app.post('/publicar-feed', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const { conteudo } = req.body;

    // Cria a nova publicação
    const novaPublicacao = {
      autor: userId,
      conteudo: conteudo,
      data: new Date()
    };

    // Salva a publicação no banco de dados
    const user = await User.findById(userId);
    user.publicacoes.push(novaPublicacao);
    await user.save();

    res.json({ message: 'Publicação salva com sucesso!', publicacao: novaPublicacao });
  } catch (error) {
    console.error('Erro ao publicar no feed:', error);
    res.status(500).json({ error: 'Erro ao publicar no feed.' });
  }
});

app.get('/carregar-publicacoes', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const pagina = parseInt(req.query.pagina) || 1; // Página atual (padrão: 1)
    const limite = 10; // Número de publicações por página

    // Busca as publicações do usuário e dos amigos
    const user = await User.findById(userId)
      .populate({
        path: 'publicacoes.autor',
        select: 'name profileImagePathNoView'
      })
      .populate({
        path: 'amigos',
        select: 'publicacoes',
        populate: {
          path: 'publicacoes.autor',
          select: 'name profileImagePathNoView'
        }
      });

    // Combina as publicações do usuário e dos amigos
    const todasPublicacoes = [
      ...user.publicacoes,
      ...user.amigos.flatMap(amigo => amigo.publicacoes)
    ];

    // Ordena as publicações por data (da mais recente para a mais antiga)
    todasPublicacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

    // Paginação: seleciona as publicações da página atual
    const inicio = (pagina - 1) * limite;
    const publicacoesPagina = todasPublicacoes.slice(inicio, inicio + limite);

    // Formata as publicações para o frontend
    const publicacoesFormatadas = publicacoesPagina.map(pub => ({
      _id: pub._id,
      conteudo: pub.conteudo,
      dataFormatada: new Date(pub.data).toLocaleString('pt-BR'),
      autorNome: pub.autor?.name || 'Desconhecido',
      autorImagem: pub.autor?.profileImagePathNoView || '/default-profile.jpg'
    }));

    res.json({
      publicacoes: publicacoesFormatadas,
      temMais: todasPublicacoes.length > inicio + limite // Indica se há mais publicações
    });
  } catch (error) {
    console.error('Erro ao carregar publicações:', error);
    res.status(500).json({ error: 'Erro ao carregar publicações.' });
  }
});

//pagina de amigos
app.get("/todos-amigos", ensureAuthenticated, (req, res) => {
  const users = loadUsersFromFile();
  const currentUser = req.user;
  //const currentUser = await User.findById(userId);
  // Obtém todos os amigos do usuário
  const todosAmigos = currentUser.amigos.map(amigoId => {
    return users.find(user => user.id === amigoId);
  });

  res.render("todosAmigos", { user: currentUser, amigos: todosAmigos });
});

function adicionarAmigo(amigoId) {
  fetch("/adicionar-amigo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ amigoId })
  })
  .then(response => response.json())
  .then(data => {
    // Atualiza a seção de amigos sem recarregar a página
    document.getElementById('lista-amigos').innerHTML = data.htmlAtualizado;
  });
}

// Para publicações carregar e salvar 

// Configuração do multer para salvar as imagens
// Configuração do multer para salvar as imagens da comunidade
// Configuração do multer para salvar as imagens da comunidade
const storageComunidade = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './views/data/comunidades/'); // Diretório onde as imagens serão salvas
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname; // Gera um nome único
    cb(null, uniqueName);
  }
});

const uploadComunidade = multer({ storage: storageComunidade });


app.post('/upload-comunidade', uploadComunidade.single('imagemPerfil'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'comunidades', // Pasta no Cloudinary para imagens de comunidades
      transformation: [{ width: 300, height: 300, crop: 'fill' }], // Ajuste as dimensões conforme necessário
    });

    // Retorna a URL da imagem no Cloudinary
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error('Erro ao fazer upload da imagem da comunidade:', err);
    res.status(500).json({ error: 'Erro ao enviar imagem da comunidade.' });
  }
});

// Rota para ir apra pagina do feed pra ela renderizar o formulário de criação de comunidade
app.get('/criar-comunidade', (req, res) => {
  res.render('criarComunidade', { user: req.user });
});

function validateImageProportion(image) {
  const img = new Image();
  img.src = image.src;

  img.onload = function() {
      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;

      // Defina a proporção máxima e mínima que considera aceitável
      const minAspectRatio = 0.75; // Largura/Altura mínima aceitável
      const maxAspectRatio = 10.33; // Largura/Altura máxima aceitável

      if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
          alert("Imagem desproporcional. Por favor, envie uma imagem mais adequada.");
          // Você pode remover a imagem ou impedir o envio
          image.src = "";  // Remove a imagem
      } else {
          console.log("Proporção da imagem válida");
      }
  };
}


app.post('/salvar-comunidade', ensureAuthenticated, async (req, res) => {
  try {
    const { nome, imagemPerfil } = req.body;

    const novaComunidade = new Community({
      nome,
      donoId: req.user._id,
      membros: [], // Não adiciona o usuário automaticamente
      imagemPerfil,
      imagemPerfilNoView: imagemPerfil,
    });

    await novaComunidade.save();

    // Adiciona a comunidade às referências do usuário (apenas como dono)
    req.user.comunidadesDono.push(novaComunidade._id);
    await req.user.save();

    res.json({ message: 'Comunidade criada com sucesso!', comunidade: novaComunidade });
  } catch (error) {
    console.error('Erro ao salvar comunidade:', error);
    res.status(500).json({ error: 'Erro ao criar comunidade.' });
  }
});



// Função para buscar a comunidade pelo ID
function buscarComunidadePorId(id, comunidades) {
  return comunidades.find(comunidade => comunidade.id === id);
}

// Rota para visualizar a comunidade
// ✅ Exibir comunidade ao clicar
// 📄 Exibir comunidade (detalhes, membros e publicações)
// 📄 Exibir comunidade ao clicar (detalhes, membros e publicações)
// 📄 Exibir comunidade ao clicar (detalhes, membros e publicações)
// Rota para exibir os detalhes de uma comunidade
app.get('/comunidade/:id', ensureAuthenticated, async (req, res) => {
  try {
    const comunidadeId = req.params.id;

    // Verifica se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(comunidadeId)) {
      return res.status(400).send('ID da comunidade inválido.');
    }

    // Busca a comunidade no MongoDB
    const comunidade = await Community.findById(comunidadeId)
      .populate('membros', 'name profileImagePathNoView') // Popula os membros
      .populate('feed.autor', 'name profileImagePathNoView') // Popula os autores das publicações
      .lean();

    if (!comunidade) {
      return res.status(404).send('Comunidade não encontrada.');
    }

    // Formata as publicações com informações do autor
    const publicacoesComAutor = comunidade.feed.map(pub => ({
      conteudo: pub.conteudo,
      dataFormatada: new Date(pub.data).toLocaleString('pt-BR'),
      autorNome: pub.autor?.name || 'Desconhecido',
      autorImagem: pub.autor?.profileImagePathNoView || '/default-profile.jpg'
    }));

    // Renderiza a página da comunidade
    res.render('comunidade', {
      user: req.user, // Passa o usuário logado para o template
      comunidade,
      membros: comunidade.membros,
      publicacoes: publicacoesComAutor
    });
  } catch (error) {
    console.error('❌ Erro ao carregar comunidade:', error);
    res.status(500).send('Erro ao carregar comunidade.');
  }
});



//--------------------------------------------------
app.get('/procurar-comunidade', ensureAuthenticated, (req, res) => {
  const { nome, usuarioId } = req.query; // Obtém o nome da comunidade e o ID do usuário a partir da query string

  // Carrega as comunidades
  //const data = loadComunidadesFromFile(); // Função que carrega comunidades
  //const comunidades = data.comunidades; // Acesse o array de comunidades
  const comunidades = require('./comunidades.json').comunidades;
  const usuarios = require('./users.json');

  const comunidadeId = req.body.comunidadeId;
  //const usuario = usuarios.find(u => u.id === req.user.id);
  const comunidade = comunidades.find(c => c.id === comunidadeId);

  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }

  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }


  // Verifica se o retorno é um array válido
  if (!Array.isArray(comunidades)) {
    return res.status(500).send('Erro ao carregar comunidades.'); // Se não for um array, retorne erro
  }

  // Filtra as comunidades pelo nome
  const comunidadeEncontrada = comunidades.find(comunidade => 
    comunidade.nome.toLowerCase().includes(nome.toLowerCase())
  );

  if (!comunidadeEncontrada) {
    return res.status(404).send('Comunidade não encontrada.'); // Caso não encontre nenhuma
  }

  // Verifica se o usuário já é membro da comunidade
  if (comunidadeEncontrada.membros.includes(usuarioId)) {
    return res.status(400).json({ error: "Você já faz parte dessa comunidade." });
  }

  // Adiciona o usuário à lista de membros da comunidade
  comunidadeEncontrada.membros.push(usuarioId);

  // Salva as mudanças no arquivo `comunidades.json`
  saveComunidadesToFile(data);

  // Agora, vamos adicionar a comunidade ao perfil do usuário
  const usersData = loadUsersFromFile(); // Função que carrega os usuários

  // Encontra o usuário pelo ID
 
  //const usuario = usersData.find(u => u.id === usuarioId);
  const usuario = usuarios.find(u => u.id === usuarioId);
  if (!usuario) {
    return res.status(404).send('Usuário não encontrado.'); // Caso o usuário não seja encontrado
  }

  // Adiciona o ID da comunidade no perfil do usuário (se ainda não estiver presente)
  if (!usuario.comunidades.includes(comunidadeEncontrada.id)) {
    usuario.comunidades.push(comunidadeEncontrada.id);
    fs.writeFileSync('comunidades.json', JSON.stringify({ comunidades }, null, 2));
    fs.writeFileSync('users.json', JSON.stringify(usuarios, null, 2));
   
    req.session.save((err) => {
      if (err) {
        console.error('Erro ao salvar a sessão:', err);
        return res.status(500).send('Erro ao salvar a sessão');
      }
    });

    res.redirect('/feed'); // Redireciona para o feed após a atualização
   
  } else {
    res.redirect('/feed'); // Se algo der errado, redireciona para o feed
   }

  
});

function adicionarComunidade(comunidadeId) {
  fetch("/adicionar-comunidade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ comunidadeId })
  })
  .then(response => response.json())
  .then(data => {
    // Substitui o conteúdo atual da lista de comunidades com o HTML atualizado
    document.querySelector('.community-grid').innerHTML = data.htmlAtualizado;
  })
  .catch(error => console.error('Erro ao adicionar comunidade:', error));
}
//-------------------------------

//============

// Função para carregar as comunidades de um arquivo JSON
function loadComunidadesFromFile() {
  const data = fs.readFileSync(path.join(__dirname, 'comunidades.json'), 'utf-8');
  return JSON.parse(data);
 
}


// Função para salvar comunidades no arquivo (sem criar uma nova chave "comunidades")
function saveComunidadesToFile(comunidadesData) {
  fs.writeFileSync(path.join(__dirname, 'comunidades.json'), JSON.stringify(comunidadesData, null, 2));
}

// Função para salvar os usuários no arquivo
function saveUsersToFile(usersData) {
  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify(usersData, null, 2));
}



//app.listen(3000);

const PORT = process.env.PORT || 3000; // Usa a porta definida pelo Render ou 3000 como padrão
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
module.exports = router;