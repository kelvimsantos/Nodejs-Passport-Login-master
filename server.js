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

const port = 3000;
//const path = require("path");

const initializePassport = require('./passport-config');
const multer = require('multer');
const users = loadUsersFromFile(); // Carrega usuários do arquivo JSON
// Middleware para fazer o parse do corpo das solicitações como JSON
app.use(express.static('public')); // Para servir arquivos estáticos
app.use(bodyParser.json());
app.use('/data', express.static(path.join(__dirname, 'view/data'))); // Servir arquivos estáticos

// Caminho para o arquivo JSON de publicações
const PUBLICACOES_PATH = path.join(__dirname, 'publicacoes.json');
const USERS_PATH = path.join(__dirname, 'users.json');

//const { buscarUsuarioPorId, carregarPublicacoes, salvarPublicacao } = require('./utils');
//const { carregarPublicacoes, salvarPublicacao } = require('./utils');

//initializePassport(
//  passport,
//  email => users.find(user => user.email === email),
//  id => users.find(user => user.id === id),
//  loadUsersFromFile
//);
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
  cookie: { secure: true } // Se estiver usando HTTP. Para HTTPS, defina como true
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

  // Salve os dados de volta no arquivo JSON
  saveUsersToFile(users);

 // res.json({ message: "Nome e caminho da imagem do perfil atualizados com sucesso." });
  // Salve os dados de volta no arquivo JSON
  //fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));
  // Responda com uma página HTML que contenha um script para atualizar dinamicamente a página do cliente
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
  //  profileImagePath
//profileImageName
//coverImageName":
//coverImagePath":
    declaracoes: user.declaracoes,
    comentarios:user.comentarios,
    amigos: user.amigos,
    publicacoes: user.amigos.publicacoes,
    publicacoesAmigos : user.amigos.publicacoesAmigos
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

// Supondo que você tem um usuário atual
//const currentUserDOC = userDoc.find(user => user.id === "user1");
//
//// Carregar publicações dos amigos
//let publicacoesAmigos = [];
//
//if (currentUserDOC && currentUserDOC.amigos) {
//  currentUserDOC.amigos.forEach(amigoId => {
//    const amigo = userDoc.find(user => user.id === amigoId);
//
//    if (amigo && amigo.publicacoes) {
//      publicacoesAmigos = publicacoesAmigos.concat(amigo.publicacoes);
//    }
//  });
//
//  // Ordenar as publicações dos amigos por data (mais recentes primeiro)
//  publicacoesAmigos.sort((a, b) => new Date(b.data) - new Date(a.data));
//}

// Exibir as publicações dos amigos no console
//console.log("Publicações dos amigos:", publicacoesAmigos);



  // Carregar publicações dos amigos
 // const publicacoesAmigos = carregarPublicacoesDosAmigos(currentUser.amigos);
  
// Armazena as publicações dos amigos na propriedade do usuário
//currentUser.publicacoesAmigos = publicacoesAmigos;

// Combina as publicações do usuário com as publicações dos amigos e ordena por data
//const todasPublicacoes = [...currentUser.publicacoes, ...currentUser.publicacoesAmigos].sort((a, b) => new Date(b.data) - new Date(a.data));

 // // Carregar publicações
 // fs.readFile('publicacoes.json', 'utf8', (err, data) => {
 //  if (err) {
 //    return res.status(500).send('Erro ao ler o arquivo de publicações.');
 //  }
 //  const publicacoes = JSON.parse(data);
 //carregarPublicacoesDosAmigos()

 // Carrega todas as publicações ----------------------------------------------------------------------------------------------------------------------------------------------------
 //fs.readFile('publicacoes.json', 'utf8', (err, data) => {
 // if (err) {
 //   return res.status(500).send('Erro ao ler o arquivo de publicações.');
 // }

  //let publicacoes = JSON.parse(data);
//
  //// Filtra publicações do usuário e amigos
  //const publicacoesVisiveis = publicacoes.filter(p => 
  //  p.autor === currentUser.id || amigos.some(a => a.id === p.autor)
  //);
  // 
  //     // Adiciona publicações dos amigos ao array de publicações visíveis
  //     publicacoesVisiveis.push(...publicacoesAmigos);
//
  //   // Ordena por data e limita aos 10 mais recentes
  //   publicacoesVisiveis.sort((a, b) => new Date(b.data) - new Date(a.data));
  //   publicacoesVisiveis.splice(10);
//
    // const ultimas10Publicacoes = publicacoesVisiveis.slice(0, 10);
     // Renderiza o feed com o usuário atual, seus amigos e as publicações
    // res.render("feed", { user: currentUser, amigos, publicacoes: ultimas10Publicacoes });

    // Renderiza o feed com o usuário atual, seus amigos e as publicações
    res.render("feed", { user: currentUser, amigos, publicacoes: todasPublicacoes });
  //  res.render("feed", { user: currentUser, amigos, publicacoes });
 // res.render("feed", { user: currentUser, amigos }); // Renderiza o feed com o usuário atual e seus amigos
});



// Função para escrever publicações no arquivo JSON
//function writePublicacoes(publicacoes) {
//  fs.writeFileSync(PUBLICACOES_PATH, JSON.stringify(publicacoes, null, 2), 'utf8');
//}
//// Função para ler publicações do arquivo JSON
//function readPublicacoes() {
//  return JSON.parse(fs.readFileSync(PUBLICACOES_PATH, 'utf8'));
//}



// Função para escrever usuários no arquivo JSON
function writeUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
}
//// Função para ler usuários do arquivo JSON
//function readUsers() {
//  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
//}
//

//---------------------------------------------------------------------------

// Rota para carregar publicações
//app.get('/publicacoes',(req, res) => {
//  fs.readFile('publicacoes.json', 'utf8', (err, data) => {
//      if (err) {
//          return res.status(500).send('Erro ao ler o arquivo de publicações.');
//      }
//      res.json(JSON.parse(data));
//  });
//});







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
      publicacoesAmigos:[]

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
  req.logOut();
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
function loadUsersFromFile() {
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

  });

 // try {
 //   saveUsersToFile(users);
 //   console.log('Publicação salva com sucesso para o usuário:', userId);
 //   res.json({ publicacao: publicacao });
 // } catch (error) {
 //   console.error('Erro ao gravar no arquivo JSON:', error);
 //   return res.status(500).json({ error: 'Erro ao gravar no arquivo JSON.' });
 // }
//});

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
//function carregarPublicacoesDosAmigos(currentUser, users) {
//  let todasPublicacoes = [];
//
//  currentUser.amigos.forEach(amigoId => {
//    const amigo = users.find(user => user.id === amigoId);
//    if (amigo && amigo.publicacoes) {
//      todasPublicacoes = todasPublicacoes.concat(amigo.publicacoes);
//    }
//  });
//
//  // Adiciona as publicações do próprio usuário
//  todasPublicacoes = todasPublicacoes.concat(currentUser.publicacoes);
//
//  // Organiza as publicações por data
//  todasPublicacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
//
//  // Sobrescreve o arquivo publicacoes.json
//  fs.writeFileSync('publicacoes.json', JSON.stringify(todasPublicacoes, null, 2));
//}

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
    publicacoesAmigos:[]
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



//adicionar amigo ------------------------------
// Rota para adicionar um amigo
// Endpoint para adicionar um amigo
// Rota para adicionar um amigo
  //app.post("/adicionar-amigo", ensureAuthenticated, (req, res) => {
  //
  //  const userId = req.user.id;
  //  const friendId = req.body.friendId; // ID do amigo a ser adicionado
  //
  //  // Encontre o usuário correspondente com base no ID
  //  const currentUser = users.find(user => user.id === userId);
  //
  //  // Verifique se o usuário atual e o amigo existem
  //  if (!currentUser || !friendId) {
  //      return res.status(404).json({ error: "Usuário ou amigo não encontrado." });
  //  }
  //
  //  // Verifique se o amigo já está na lista de amigos
  //  if (currentUser.friends.includes(friendId)) {
  //      return res.status(400).json({ error: "Este usuário já é seu amigo." });
  //  }
  //
  //  // Adicione o amigo à lista de amigos do usuário atual
  //  currentUser.friends.push(friendId);
  //
  //  // Salve os dados atualizados no arquivo JSON
  //  saveUsersToFile(users);
  //
  //  // Envie uma resposta indicando sucesso
  //  res.json({ message: "Amigo adicionado com sucesso." });
  //});

 // app.post("/adicionar-amigo", ensureAuthenticated, (req, res) => {
  //  const userId = req.user.id;
   // const friendId = req.body.friendId;
   // console.log('ID do amigo recebido:', friendId);
  
    // Verificar se o ID do amigo está presente na solicitação
   // if (!friendId) {
   //     return res.status(400).json({ error: "ID do amigo ausente na solicitação." });
  //  }
  
    // Aqui você pode adicionar a lógica para adicionar o amigo à lista
  
    // Se todas as verificações passarem, adicionar o amigo e enviar resposta
  ///  res.json({ message: "Amigo adicionado com sucesso." });
//});

// Atualização na rota /adicionar-amigo para incluir lista de amigos
app.post("/adicionar-amigo", ensureAuthenticated, (req, res) => {
  const userId = req.user.id;
  const friendId = req.body.friendId;

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

  res.json({ message: "Amigo adicionado com sucesso." });
});


app.post("/buscar-usuario", ensureAuthenticated, (req, res) => {
  const email = req.body.email;
  const usuarioEncontrado = users.find(user => user.email === email);
  
  if (usuarioEncontrado) {
    res.json(usuarioEncontrado);
  } else {
    res.status(404).json({ error: "Usuário não encontrado." });
  }
});

app.get("/perfil/:id", ensureAuthenticated, (req, res) => {
  const friendId = req.params.id;
  const amigo = users.find(user => user.id === friendId);

  if (!amigo) {
    return res.status(404).send("Amigo não encontrado.");
  }

  res.render("amigoPerfil", { user: req.user, amigo: amigo });
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


//para publicações carregar e salvar 




//app.listen(3000);

const PORT = process.env.PORT || 3000; // Usa a porta definida pelo Render ou 3000 como padrão
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});