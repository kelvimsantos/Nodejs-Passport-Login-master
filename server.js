//npm run devStart  PARA STARTAR O SERVIDOR

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

//const userDoc = require('./users.json');

const EventEmitter = require('events');
const eventos = new EventEmitter();

const port = 3000;
//const path = require("path");

const initializePassport = require('./passport-config');
const multer = require('multer');
const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON
// Middleware para fazer o parse do corpo das solicitações como JSON
app.use(express.static('public')); // Para servir arquivos estáticos
app.use(bodyParser.json());
app.use('/data', express.static(path.join(__dirname, 'view/data'))); // Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Caminho para o arquivo JSON de publicações
const PUBLICACOES_PATH = path.join(__dirname, 'publicacoes.json');
const USERS_PATH = path.join(__dirname, 'users.json');
// Carregar todas as comunidades
//const comunidades = JSON.parse(fs.readFileSync('comunidades.json', 'utf-8')).comunidades;


initializePassport(
  passport,
  email => {
    const user = users.find(user => user.email === email);
    return user ? user : null;
  },
  id => users.find(user => user.id === id),
  loadUsersFromFile
 
);



app.use(express.static(path.join(__dirname, 'data')));
//app.use(express.static('./views'));
//app.set('view-engine', 'ejs');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/views'));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  //secret: process.env.SESSION_SECRET,
  secret: process.env.SESSION_SECRET || 'fallbackSecret', // fallback em caso de não encontrar a variável
  resave: false,
  saveUninitialized: false,
  cookie: {  maxAge: 60 * 60 * 1000,     // 1 hora de duração da sessão
    secure: false,              // Defina `true` se estiver usando HTTPS
    httpOnly: true,             // Protege contra scripts JavaScript acessarem o cookie
    sameSite: 'lax'          // Garante que os cookies sejam enviados apenas para o mesmo site (ajuda na segurança)
}
  //cookie: { secure: false } // Se estiver usando HTTP. Para HTTPS, defina como true
}));



app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

function reloadUsersData() {
  users = loadUsersFromFile();
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./views/data/");
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
//------------------------------------------------------------------------------------------------
app.post("/upload", upload.single("profileImage"), (req, res) => {
  const userId = req.user.id;
  const profileImageName = req.file.filename; // Nome do arquivo
  const profileImagePath = `./views/data/${profileImageName}`; // Caminho completo da imagem
  const profileImagePathNoView = `./data/${profileImageName}`;
  // Atualize o nome do arquivo e o caminho completo da imagem do perfil no registro do usuário
  const currentUser = users.find(user => user.id === userId);
  currentUser.profileImageName = profileImageName;
  currentUser.profileImagePath = profileImagePath;
  currentUser.profileImagePathNoView = profileImagePathNoView;

  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }


  // Salve os dados de volta no arquivo JSON
  saveUsersToFile(users);
  reloadUsersData();
 // res.json({ message: "Nome e caminho da imagem do perfil atualizados com sucesso." });
  // Salve os dados de volta no arquivo JSON
  //fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));
  // Responda com uma página HTML que contenha um script para atualizar dinamicamente a página do cliente

   // Salva a sessão manualmente antes de redirecionar
   req.session.save((err) => {
    if (err) {
      console.error('Erro ao salvar a sessão:', err);
      return res.status(500).send('Erro ao salvar a sessão');
    }

  res.send(`
    <html>
    <head>
      <script>
        // Use JavaScript para recarregar a página após o envio do formulário
        window.location.href = "/perfil";
      </script>
    </head>
    <body>
      <p>Atualizando...</p>
    </body>
    </html>
  `);
});

  //res.json({ message: "Nome e caminho da imagem do perfil atualizados com sucesso." });
});



// No lado do servidor (app.js)
app.post("/upload-cover", upload.single("coverImage"), (req, res) => {
  const userId = req.user.id;
  const capaImageName = req.file.filename; // Nome do arquivo
  const capaImagePath = `./views/data/${capaImageName}`; // Caminho completo da imagem

  const currentUser = users.find(user => user.id === userId);
  currentUser.coverImageName = capaImageName;
  currentUser.coverImagePath = capaImagePath;
  saveUsersToFile(users);
  res.send(`
    <html>
    <head>
      <script>
        window.location.href = "/perfil";
      </script>
    </head>
    <body>
      <p>Atualizando...</p>
    </body>
    </html>
  `);
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Suponha que você tenha um endpoint para obter os dados do usuário
app.get('/dados-usuario', ensureAuthenticated, (req, res) => {
// const dadosUsuario = {
//     nome: req.user.name,
//     email: req.user.email,
//     profileImagePath: user.profileImagePath // Certifique-se de que isso corresponde ao caminho correto da imagem
//     // Outros dados do usuário
// };
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

// Rota para a página do feed
//app.get('/feed', (req, res) => {
//const nomeDoUsuario = req.user.name;
  
 // res.render('feed.ejs'); // Renderize a página do feed aqui
//});

//app.get("/feed", ensureAuthenticated, (req, res) => {
  // Função fictícia para obter todos os usuários. Substitua pela lógica real.
//  const users = loadUsersFromFile(); // Suponha que esta função retorna uma lista de todos os usuários.
  
//  const currentUser = req.user;
    // Limita a exibição dos primeiros 9 amigos
//    const amigosLimitados = currentUser.amigos.slice(0, 9).map(amigoId => {
//      return users.find(user => user.id === amigoId);
//    });

//  res.render("feed", { user: req.user, users: users });
//});


app.get("/feed", ensureAuthenticated, (req, res) => {
  const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON
  
  //const userDoc = require('./users.json');
  //console.log("nossos dados",userDoc);
  const currentUser = req.user;
  //const usuarios = req.users;//não necessario
  // Carregar todas as comunidades
  const comunidades = require('./comunidades.json').comunidades;;
//const todasComunidades = comunidades.comunidades;
  //const comunidades = JSON.parse(fs.readFileSync('//comunidades.json', 'utf-8')).comunidades;
 
  //provavel nao mais necessario
  const amigos = currentUser.amigos.map(amigoId => {
    return users.find(user => user.id === amigoId); // Encontra e retorna os amigos do usuário
  }).filter(amigo => amigo);

  //const publicacoes = readPublicacoes();
 // const userDoc = require('./users.json');
 const publicacoesAmigos = amigos.flatMap(amigo => amigo.publicacoesAmigos || []);
 const todasPublicacoes = [...currentUser.publicacoes, ...publicacoesAmigos].sort((a, b) => new Date(b.data) - new Date(a.data));
 // Combina as publicações do próprio usuário com as publicações dos amigos
  //const todasPublicacoes = [
   // ...currentUser.publicacoes, // Publicações do próprio usuário
  //  ...amigos.flatMap(amigo => amigo.publicacoes) // Publicações de cada amigo
  //];

  // Ordena as publicações por data (da mais recente para a mais antiga)
  todasPublicacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
  console.log("Publicações dos amigos + minhas:", todasPublicacoes);

    
  // Filtrar comunidades do usuário
    const comunidadesDoUsuario = comunidades.filter(comunidade =>
    comunidade.membros.includes(currentUser.id) || comunidade.donoId === currentUser.id
  );

    // Renderiza o feed com o usuário atual, seus amigos e as publicações
    res.render("feed", { 
      user: currentUser, 
      amigos,
       publicacoes: todasPublicacoes,
       comunidades:comunidadesDoUsuario });
  //  res.render("feed", { user: currentUser, amigos, publicacoes });
 // res.render("feed", { user: currentUser, amigos }); // Renderiza o feed com o usuário atual e seus amigos
});


// Função para escrever usuários no arquivo JSON
function writeUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}
//// Função para ler usuários do arquivo JSON


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

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});



app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = {
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      profileImagePath:  `./views/dir.jpg`,
      coverImagePath: `./views/default-cover-image.jpg`,
      profileImagePathNoView :`dir.jpg`,
      declaracoes: [], // Inicialize o campo declaracoes como um array vazio
      comentarios: [],
      amigos: [], // Inicializa a lista de amigos vazia
      publicacoes: [], // Inicialmente, sem publicações
      publicacoesAmigos:[],
      comunidades:[],
      comunidadesDono:[]
    };

    // Carrega usuários existentes do arquivo
    const existingUsers = loadUsersFromFile();
    
    // Verifica se o e-mail já está registrado
    if (existingUsers.some(user => user.email === newUser.email)) {
      return res.redirect('/register');
    }

    existingUsers.push(newUser);
    // Salva o usuário no arquivo JSON
    saveUsersToFile(existingUsers);

    // Após criar o novo usuário, recarregue os dados dos usuários
    reloadUsersData();
    console.log('Dados dos usuários recarregados:', loadUsersFromFile()); // Verifique se os dados dos usuários foram recarregados corretamente

    // Redirecione para a página de login
     res.redirect('/login');
  } catch {
    res.redirect('/register');
  }
});


app.delete('/logout', (req, res) => {
  //req.logOut();
  res.redirect('/login');
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

// Rota para salvar a declaração ---------------------------------------------------------------------------
app.post('/salvar-declaracao', ensureAuthenticated, (req, res) => {
  // Extrai a declaração do corpo da solicitação
  const declaration = req.body.declaration;

  // Verifica se a declaração não está vazia
  if (!declaration) {
    return res.status(400).json({ error: 'A declaração não pode estar vazia.' });
  }

  // Obtém o ID do usuário a partir do objeto req.user
  const userId = req.user.id;

  // Carrega os dados atuais do arquivo JSON
  let users = [];
  try {
    users = loadUsersFromFile();
  } catch (error) {
    console.error('Erro ao ler o arquivo JSON:', error);
    return res.status(500).json({ error: 'Erro ao ler o arquivo JSON.' });
  }

  // Encontra o usuário correspondente com base no ID
  const currentUser = users.find(user => user.id === userId);

  // Verifica se o usuário foi encontrado
  if (!currentUser) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  // Certifica-se de que o campo 'declaracoes' exista no registro do usuário
  if (!currentUser.declaracoes) {
    currentUser.declaracoes = [];
  }

  // Adiciona a nova declaração ao registro do usuário
  currentUser.declaracoes.push(declaration);

  // Salva os dados atualizados no arquivo JSON
  try {
    saveUsersToFile(users);
    console.log('Declaração salva com sucesso para o usuário:', userId);
    // Retorna a declaração salva como resposta
    res.json({ declaration: declaration });
  } catch (error) {
    console.error('Erro ao gravar no arquivo JSON:', error);
    return res.status(500).json({ error: 'Erro ao gravar no arquivo JSON.' });
  }

    //vai recarregar o arquivo atualizando pra poder ser lido 
  //  reloadUsersData();
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

//if (!req.session || !req.session.userId) {
//  return res.status(401).send('Você foi desconectado. Faça login novamente.');
//}
//req.session.save((err) => {
//  if (err) {
//    console.error('Erro ao salvar a sessão:', err);
//    return res.status(500).send('Erro ao salvar a sessão');
//  }
//});
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
  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }

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

 // if (!currentUser.publicacoes) {
 //   currentUser.publicacoes = [];
 // }

  // Adiciona a nova publicação
 // currentUser.publicacoes.push({
  //  conteudo: publicacao,
   // data: new Date().toISOString()
   const newPublicacao = {
    conteudo: publicacao,
    data: new Date().toISOString(),  // Data atual em formato ISO
    autor: user.id  // Pode ser o nome ou ID do autor
    //===========================================================================================================================================================================================
};
fs.writeFile(path.join(__dirname, 'users.json'), JSON.stringify(newPublicacao),(err) => {
  if(err)throw err;
  console.log("Terminado a gravação!.....");
});

req.session.save((err) => {
  if (err) {
    console.error('Erro ao salvar a sessão:', err);
    return res.status(500).send('Erro ao salvar a sessão');
  }
});
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


// Atualização na rota /adicionar-amigo para incluir lista de amigos
app.post("/adicionar-amigo", ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const friendId = req.body.friendId;

  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }

  if (!friendId) {
    return res.status(400).json({ error: "ID do amigo ausente na solicitação." });
  }
  const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON

  const currentUser = users.find(user => user.id === userId);
  const friendUser = users.find(user => user.id === friendId);

  if (!friendUser) {
    return res.status(404).json({ error: "Amigo não encontrado." });
  }

  if (!currentUser.amigos) {
    currentUser.amigos = [];
  }

  if (currentUser.amigos.includes(friendId)) {
    return res.status(400).json({ error: "Este usuário já é seu amigo." });
  }

  currentUser.amigos.push(friendId);
  saveUsersToFile(users);

  if (currentUser && !currentUser.amigos.includes(friendId)) {
    currentUser.amigos.push(friendId);
    saveUsersToFile(users);
    // Emitir evento de adição de amigo
    eventos.emit('amigoAdicionado', userId, friendId);
// Retorna os amigos atualizados para o frontend
res.json({ success: true, amigos: user.amigos });
 // Salva as alterações no arquivo JSON
 fs.writeFileSync('users.json', JSON.stringify(users, null, 2));//-----------------------------------------------------------

//adicionarAmigo(friendId);
req.session.save((err) => {
  if (err) {
    console.error('Erro ao salvar a sessão:', err);
    return res.status(500).send('Erro ao salvar a sessão');
  }
     // Recarrega a página do perfil após a atualização
  res.send(`
    <html>
    <head>
      <script>
        window.location.href = "/perfil";
      </script>
    </head>
    <body>
      <p>Atualizando...</p>
    </body>
    </html>
  `);
});
  res.json({ message: "Amigo adicionado com sucesso." });
  }
});


app.post("/buscar-usuario", ensureAuthenticated, (req, res) => {
  const email = req.body.email;
  const usuarioEncontrado = users.find(user => user.email === email);
  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }

  if (usuarioEncontrado) {
    res.json(usuarioEncontrado);
  } else {
    res.status(404).json({ error: "Usuário não encontrado." });
  }
  req.session.save((err) => {
    if (err) {
      console.error('Erro ao salvar a sessão:', err);
      return res.status(500).send('Erro ao salvar a sessão');
    }
	});
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


app.get('/perfil/:id', (req, res) => {
  const userId = req.params.id;

  // Leia o arquivo users.json
  const data = fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8');
  const users = JSON.parse(data);//em vez de fazer assim podemos tambem usar a função para json parse
  //const users = carregarJson(data);

  const dataComunidades = fs.readFileSync(path.join(__dirname, 'comunidades.json'), 'utf-8');
  const todasComunidades = JSON.parse(dataComunidades).comunidades;
  
  // Busque o amigo pelo ID
  const amigo = users.find(usuario => usuario.id === userId);

  // Usuário logado, caso exista
  const user = req.session.user || {}; 

  if (amigo) {
    // Filtrar comunidades do amigo
    const comunidadesDoAmigo = todasComunidades.filter(comunidade =>
      comunidade.membros.includes(amigo.id) || comunidade.donoId === amigo.id);

    // Criar variável temporária com o caminho ajustado da imagem de perfil
    let profileImageTempPath = amigo.profileImagePath;
    if (profileImageTempPath.startsWith("./views")) {
      profileImageTempPath = profileImageTempPath.replace("./views", "");
    }

    // Criar variável temporária com o caminho ajustado da capa (se necessário)
    let capaImageTempPath = amigo.coverImagePath;
    if (capaImageTempPath && capaImageTempPath.startsWith("./views")) {
      capaImageTempPath = capaImageTempPath.replace("./views", "");
    }

      // Carregar comunidades do amigo
       const amigoComunidades = amigo.comunidades || [];
      // Carregar declarações do amigo
      const amigoDeclaracoes = amigo.declaracoes || [];

         // Mapear as comunidades do usuário para adicionar o caminho da imagem corretamente
    // Ajustar os caminhos das imagens
    const comunidadesComImagens = comunidadesDoAmigo.map(comunidade => {
      return {
        ...comunidade,
        imagemPerfilPath: comunidade.imagemPerfil.replace(/^\.\/views\//, '/')
      };
    });

    // Carregar informações do amigo para a página de perfil
    res.render('amigoPerfil', { 
      user, // Usuário logado
      amigo, // Objeto completo do amigo
      amigoName: amigo.name, // Nome do amigo
      amigoDeclaracoes: amigoDeclaracoes, // Declarações do amigo
      amigoComunidadesDono: amigo.comunidadesDono || [], // Comunidades que o amigo é dono
      amigoProfileImagePath: profileImageTempPath, // Caminho ajustado da imagem de perfil
      amigoCapaImagePath: capaImageTempPath, // Caminho ajustado da imagem de capa (se aplicável)
      amigoComunidades:amigoComunidades,  // Passando as comunidades,  // Passando as comunidades
      comunidadesComImagens
    });
  } else {
    // Caso o amigo não seja encontrado, retorna um erro 404
    res.status(404).send('Amigo não encontrado');
  }
});


app.get('/comunidade/:id', ensureAuthenticated, (req, res) => {
  const comunidadeId = req.params.id;
  const comunidadesData = require('./comunidades.json');
  const publicacoesData = require('./publicacoesComunidade.json'); // Atualizado para o novo nome
  const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON

  const comunidade = comunidadesData.comunidades.find(c => c.id === comunidadeId);

  if (!comunidade) {
    return res.status(404).send('Comunidade não encontrada');
  }

  // Filtrar publicações da comunidade
  const publicacoes = publicacoesData.publicacoes.filter(pub => pub.comunidadeId === comunidadeId);

  // Mapear informações de autores para cada publicação
  const publicacoesComAutor = publicacoes.map(pub => {
    const autor = users.find(user => user.id === pub.autorId);
    return {
      ...pub,
      autorNome: autor ? autor.name : 'Usuário desconhecido',
      autorImagem: autor ? autor.profileImagePath : '/path/to/default-image.jpg'
    };
  });

  // Obter informações dos membros da comunidade
  const membros = users.filter(user => comunidade.membros.includes(user.id));

  res.render('comunidade', {
    user: req.user,
    comunidade,
    membros,
    publicacoes: publicacoesComAutor
  });
});


app.post('/entrar-comunidade', ensureAuthenticated, (req, res) => {
  const comunidadeId = req.body.comunidadeId;
  const comunidadesData = require('./comunidades.json');
  const comunidade = comunidadesData.comunidades.find(c => c.id === comunidadeId);

  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }

  if (!comunidade) {
    return res.status(404).json({ message: 'Comunidade não encontrada' });
  }

  if (!comunidade.membros.includes(req.user.id)) {
    comunidade.membros.push(req.user.id);
    fs.writeFileSync('./comunidades.json', JSON.stringify(comunidadesData, null, 2));
  }

  req.session.save((err) => {
    if (err) {
      console.error('Erro ao salvar a sessão:', err);
      return res.status(500).send('Erro ao salvar a sessão');
    }
	});

  res.json({ message: 'Você entrou na comunidade!' });
});

app.post('/sair-comunidade', ensureAuthenticated, (req, res) => {
  const comunidadeId = req.body.comunidadeId;
  const comunidadesData = require('./comunidades.json');
  const comunidade = comunidadesData.comunidades.find(c => c.id === comunidadeId);

  if (!comunidade) {
    return res.status(404).json({ message: 'Comunidade não encontrada' });
  }

  comunidade.membros = comunidade.membros.filter(id => id !== req.user.id);
  fs.writeFileSync('./comunidades.json', JSON.stringify(comunidadesData, null, 2));

  res.json({ message: 'Você saiu da comunidade!' });
});

app.post('/comunidade/:id/publicar', ensureAuthenticated, (req, res) => {
  const comunidadeId = req.params.id;
  const publicacoesData = require('./publicacoesComunidade.json'); // Carregando o arquivo JSON
  const { conteudo, imagemPublicacao } = req.body;


  // Função para gerar um ID único com a data atual e números aleatórios
  const generateId = () => {
    const timestamp = Date.now(); // Obtém a data atual em milissegundos
    const randomNum = Math.floor(Math.random() * 10000); // Gera um número aleatório entre 0 e 9999
    return `${timestamp}-${randomNum}`; // Combina a data com o número aleatório
  };

  const novaPublicacao = {
    id: generateId(), // Usa a função para gerar um ID
    autorId: req.user.id,
    conteudo: conteudo,
    data: new Date().toISOString(),
    imagemPublicacao: imagemPublicacao || '',
    comunidadeId: comunidadeId
  };

  publicacoesData.publicacoes.push(novaPublicacao);
  
  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }
  // Salvar a nova publicação no arquivo publicacoesComunidade.json
  fs.writeFileSync('./publicacoesComunidade.json', JSON.stringify(publicacoesData, null, 2));

  req.session.save((err) => {
    if (err) {
      console.error('Erro ao salvar a sessão:', err);
      return res.status(500).send('Erro ao salvar a sessão');
    }
	});

  res.redirect(`/comunidade/${comunidadeId}`);
});


//pagina de amigos
app.get("/todos-amigos", ensureAuthenticated, (req, res) => {
  const users = loadUsersFromFile();
  const currentUser = req.user;
  
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
const storageComunidade = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './views/data/comunidades/'); // Diretório onde as imagens serão salvas
  },
  filename: function(req, file, cb) {
    const uniqueName = file.originalname + Date.now() + path.extname(file.originalname); // Gera um nome único
    cb(null, uniqueName);
  }
});

const uploadComunidade = multer({ storage: storageComunidade });

// Rota para renderizar o formulário de criação de comunidade
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
      const maxAspectRatio = 1.33; // Largura/Altura máxima aceitável

      if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
          alert("Imagem desproporcional. Por favor, envie uma imagem mais adequada.");
          // Você pode remover a imagem ou impedir o envio
          image.src = "";  // Remove a imagem
      } else {
          console.log("Proporção da imagem válida");
      }
  };
}

// Rota para salvar a nova comunidade
app.post('/salvar-comunidade', uploadComunidade.single('imagemPerfil'), (req, res) => {
  // Carregar comunidades e usuários do arquivo JSON
  const comunidades = require('./comunidades.json').comunidades;
  const usuarios = require('./users.json');

  if (!req.session || !req.session.userId) {
    return res.status(401).send('Você foi desconectado. Faça login novamente.');
  }

  // Criar nova comunidade
  const novaComunidade = {
    id: `comunidade${comunidades.length + 1}`,
    donoId: req.user.id,
    nome: req.body.nome,
    membros: [req.user.id],
    quantidadeMembros: 1,
    imagemPerfil: req.file ? `./views/data/comunidades/${req.file.filename}` : './views/data/QWsX.jpg', // Use o nome correto
    imagemPerfilNoView: req.file ? `/data/comunidades/${req.file.filename}` : './data/QWsX.jpg', // Use o nome correto
    feed: []
  };

  // Adicionar nova comunidade ao array de comunidades
  comunidades.push(novaComunidade);

  // Atualizar o usuário com a nova comunidade
  const usuario = usuarios.find(u => u.id === req.user.id);
  usuario.comunidades.push(novaComunidade.id);
  usuario.comunidadesDono.push(novaComunidade.id);

  // Salvar as comunidades e usuários nos arquivos JSON
  fs.writeFileSync('comunidades.json', JSON.stringify({ comunidades }, null, 2));
  fs.writeFileSync('users.json', JSON.stringify(usuarios, null, 2));

  req.session.save((err) => {
    if (err) {
      console.error('Erro ao salvar a sessão:', err);
      return res.status(500).send('Erro ao salvar a sessão');
    }
	});

  // Redirecionar para o feed
  res.redirect('/feed');
});



// Função para buscar a comunidade pelo ID
function buscarComunidadePorId(id, comunidades) {
  return comunidades.find(comunidade => comunidade.id === id);
}

// Rota para visualizar a comunidade
app.get('/comunidade/:id', (req, res) => {
  const comunidadeId = req.params.id;
  const comunidades = require('./comunidades.json').comunidades; // Carregue as comunidades aqui
  const comunidade = buscarComunidadePorId(comunidadeId, comunidades); 

  // Verifique se a comunidade foi encontrada
  if (!comunidade) {
    return res.status(404).send('Comunidade não encontrada');
  }

  // Renderize o template EJS com os dados da comunidade
  res.render('sua_view', { comunidade });
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