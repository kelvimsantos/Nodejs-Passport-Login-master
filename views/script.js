document.addEventListener('DOMContentLoaded', function () {


    const profileImageInput = document.getElementById('profile-image');
    const previewImage = document.getElementById('preview-image');
    const coverImageInput = document.getElementById('cover-image');
    const previewCoverImage = document.getElementById('preview-cover-image');
    const nomeInput = document.getElementById('nome');
    const locationInput = document.getElementById('location');
    const timeInput = document.getElementById('time');
    const dateInput = document.getElementById('date');
    const reportForm = document.getElementById('report-form');
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment');
    const commentList = document.getElementById('comment-list');
    const salvarUsuarioButton = document.getElementById('salvarUsuario');

    //feed
    const nomeUsuarioSpan = document.getElementById('nomeUsuario'); // Adicionado para exibir o nome do usuário
   const imagemUsuarioFeed = document.getElementById('preview-image'); // Adicionado para exibir a imagem do usuário
   
    // Faça uma requisição AJAX para obter os dados do usuário
    fetch('/dados-usuario')
    .then(response => response.json())
    .then(dadosUsuario => {
        // Faça algo com os dados do usuário
        console.log(dadosUsuario.nome);
        console.log(dadosUsuario.email);
    
        // Outras lógicas do script aqui
    
        // Pega o elemento span pelo id
        var nomeUsuarioSpan = document.getElementById('nomeUsuario');
        // Define o valor do nome do usuário no span
        nomeUsuarioSpan.textContent = dadosUsuario.nome;
    
        // Pega o elemento img pelo id
        var imagemUsuario = document.getElementById('preview-image');
        // Define o caminho da imagem do perfil
        // Define o caminho da imagem do perfil apenas se existir
        if (dadosUsuario.profileImagePath) {
            imagemUsuario.src = dadosUsuario.profileImagePath.replace(/^\.\/views\//, ''); 
            console.log('Caminho da imagem do perfil:', dadosUsuario.profileImagePath);
            console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
            imagemUsuarioFeed.src = dadosUsuario.profileImagePath.replace(/^\.\/views\//, '');
            }
        // Pega o elemento img da capa pelo id
        var imagemCapa = document.getElementById('preview-cover-image');
        // Define o caminho da imagem da capa, se existir
        if (dadosUsuario.coverImagePath) {
            imagemCapa.src = dadosUsuario.coverImagePath.replace(/^\.\/views\//, '');
        }
    
        // Acesse as declarações do usuário
        const declaracoesUsuario = dadosUsuario.declaracoes;
    
        // Se houver declarações, exiba-as na página
        if (declaracoesUsuario && declaracoesUsuario.length > 0) {
            const declarationList = document.getElementById('declaration-list');
    
            // Limpa a lista de declarações para evitar duplicatas
            declarationList.innerHTML = '';
    
            // Itera sobre cada declaração e cria um item de lista para ela
            declaracoesUsuario.forEach(declaracao => {
                const listItem = document.createElement('li');
                listItem.textContent = declaracao;
                declarationList.appendChild(listItem);
            });
        } else {
            console.log('O usuário não possui declarações.');
        }
    })
    .catch(error => console.error('Erro ao obter dados do usuário:', error));
      
   // Referências aos elementos do DOM
   document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede o comportamento padrão de submissão do formulário
    console.log('Botão de busca clicado!');
    const friendId = document.getElementById('search-input').value; // Obtém o ID do amigo
    enviarSolicitacaoAmizade(friendId);
});
    
    carregarInformacoesDoUsuario();

    // Função para exibir a imagem selecionada no elemento de visualização
    function previewImagem(inputElement, previewElement) {
        const inputImagem = inputElement;

        if (inputImagem.files && inputImagem.files[0]) {
            const reader = new FileReader();

            reader.onload = function (e) {
                previewElement.src = e.target.result;
            }

            reader.readAsDataURL(inputImagem.files[0]);
        }
    }

    // Adiciona ouvintes de evento para a seleção de imagens
    profileImageInput.addEventListener('change', function () {
        previewImagem(this, previewImage);
    });

    coverImageInput.addEventListener('change', function () {
        previewImagem(this, previewCoverImage);
    });

    // Adiciona ouvinte de evento para o formulário de relatório
    reportForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const location = locationInput.value;
        const time = timeInput.value;
        const date = dateInput.value;

        console.log('Localização: ' + location);
        console.log('Hora: ' + time);
        console.log('Data: ' + date);
    });

    // Adiciona ouvinte de evento para o formulário de comentário
    commentForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const comment = commentInput.value;

        if (comment.trim() === '') {
            alert('Digite um comentário válido.');
            return;
        }

        // Adiciona o comentário à lista de comentários
        const commentItem = document.createElement('li');
        commentItem.textContent = comment;
        commentList.appendChild(commentItem);

        // Limpa o campo de entrada de comentários
        commentInput.value = '';
    });

    // Adiciona ouvinte de evento para o botão "Salvar Informações do Usuário"
    salvarUsuarioButton.addEventListener('click', function () {
        // Obtenha os valores atualizados dos campos
        const novoNome = nomeInput.value;
        const novaLocalizacao = locationInput.value;
        // Adicione mais campos conforme necessário

        // Faça alguma coisa com os valores, por exemplo, envie ao servidor via AJAX
        console.log('Nome Atualizado: ' + novoNome);
        console.log('Localização Atualizada: ' + novaLocalizacao);
        // Adicione mais ações conforme necessário
    });

    // Adicione mais lógica conforme necessário



});



//salvar imagem sem redirecionar pagina
document.getElementById('update-profile-image').addEventListener('click', function() {
    const input = document.getElementById('profile-image');
    const file = input.files[0];
    const formData = new FormData();
    formData.append('profileImage', file);

    fetch('/upload', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest' // Adicione o cabeçalho X-Requested-With para identificar a requisição AJAX
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message); // Exiba a mensagem de sucesso no console

        // Atualize a imagem na página, se necessário
        window.location.reload();
        // Exemplo: document.getElementById('preview-image').src = novoCaminhoDaImagem;
    })
    .catch(error => console.error('Erro ao enviar imagem:', error));
});


//salvar imagem sem redirecionar pagina
document.getElementById('update-cover-image').addEventListener('click', function() {
    const input = document.getElementById('cover-image');
    const file = input.files[0];
    const formData = new FormData();
    formData.append('coverImage', file);

    fetch('/upload-cover', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        document.getElementById('preview-cover-image').src = data.coverImagePath; // Atualiza a imagem na página
    })
    .catch(error => console.error('Erro ao enviar imagem:', error));
});

//declaracao publicação
const declarationForm = document.getElementById('declaration-form');
const declarationTextarea = document.getElementById('declaration');
const declarationList = document.getElementById('declaration-list');

declarationForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Evita o envio do formulário

    // Obtém o texto da declaração do textarea
    const declarationText = declarationTextarea.value;

    // Verifica se a declaração não está vazia
    if (declarationText.trim() !== '') {
        // Envia a declaração para o servidor usando fetch
        fetch('/salvar-declaracao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ declaration: declarationText })
        })
        .then(response => response.json())
        .then(data => {
            // Limpa o textarea da declaração
            declarationTextarea.value = '';

            // Adiciona a declaração à lista de declarações na página
            const declarationItem = document.createElement('li');
            declarationItem.textContent = data.declaration;
            declarationList.appendChild(declarationItem);
        })
        .catch(error => console.error('Erro ao salvar declaração:', error));
    } else {
        // Caso o textarea esteja vazio, exibe uma mensagem de erro
        alert('Digite uma declaração válida.');
    }
});


//=======================================================================

document.addEventListener('DOMContentLoaded', () => {
    fetch('/dados-publicacoes')
      .then(response => response.json())
      .then(publicacoes => {
        const feedContainer = document.getElementById('feed-container');
        feedContainer.innerHTML = publicacoes.map(pub => `
          <div class="publicacao">
            <p>ID: ${pub.id}</p>
            <p>Autor ID: ${pub.autorId}</p>
            <p>Conteúdo: ${pub.conteudo}</p>
            <p>Data: ${new Date(pub.data).toLocaleString()}</p>
          </div>
        `).join('');
      })
      .catch(error => console.error('Erro ao carregar publicações:', error));
  });


async function adicionarPublicacao(conteudo) {
    try {
        const response = await fetch('/adicionar-publicacao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuarioId: 1,  // Substitua pelo ID do usuário atual
                conteudo: conteudo
            })
        });
        const novaPublicacao = await response.json();
        console.log('Publicação adicionada:', novaPublicacao);
        // Atualize a interface do usuário com a nova publicação
    } catch (error) {
        console.error('Erro ao adicionar publicação:', error);
    }
}

async function carregarPublicacoes() {
    try {
        const response = await fetch('/publicacoes');
        const publicacoes = await response.json();
        console.log(publicacoes);
        // Atualize a interface do usuário com as publicações
    } catch (error) {
        console.error('Erro ao carregar publicações:', error);
    }
}
//
//=============================================================================
// Endpoint para salvar informações do usuário (por exemplo, nome, email, etc.)
//app.post("/save-user-info", (req, res) => {
//    const userId = req.user.id;
//    const { name, email, profileImagePath,coverImagePath,declaracoes,comentarios,profileImagePathNoView,publicacoes} = req.body;
//  
//    // Encontre o usuário correspondente com base no ID
//    const currentUser = users.find(user => user.id === userId);
//  
//    // Atualize as informações do usuário
//    currentUser.name = name;
//    currentUser.email = email;
//    currentUser.profileImagePath = profileImagePath;
//    currentUser.coverImagePath = coverImagePath;
//    currentUser.profileImagePathNoView =profileImagePathNoView;
//    currentUser.declaracoes = declaracoes;
//    currentUser.comentarios = comentarios;
//    currentUser.publicacoes = publicacoes;
//
//    // Salve os dados atualizados no arquivo JSON
//    saveUsersToFile(users);
//  
//    // Envie uma resposta adequada (por exemplo, JSON com mensagem de sucesso)
//    res.json({ message: "Informações do usuário atualizadas com sucesso." });
//  });
  
  // Função para salvar usuários no arquivo JSON
  function saveUsersToFile(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf-8');
  }



  // Função para carregar as informações do usuário para qualquer pagina ue ele for 
function carregarInformacoesDoUsuario() {
    fetch('/dados-usuario')
    .then(response => response.json())
    .then(dadosUsuario => {
        // Faça algo com os dados do usuário
        console.log(dadosUsuario.nome);
        console.log(dadosUsuario.email);
    
        // Outras lógicas do script aqui
    
        // Pega o elemento span pelo id
   //     var nomeUsuarioSpan = document.getElementById('nomeUsuario');
        // Define o valor do nome do usuário no span
  //      nomeUsuarioSpan.textContent = dadosUsuario.nome;
  console.log("00000000000000000000000000000000000000000000000000000000000000000000000");
        // Pega o elemento img pelo id
        var imagemUsuario = document.getElementById('preview-image');
        // Define o caminho da imagem do perfil
        if (dadosUsuario.profileImagePath) {
            console.log("111111111111111111111111111111111111111111111111111111111111");
            imagemUsuario.src = dadosUsuario.profileImagePath.replace(/^\.\/views\//, ''); 
            console.log("222222222222222222222222222222222222222222222222222222222222");
            console.log(dadosUsuario.profileImagePath.replace(/^\.\/views\//, ''));
            console.log("3333333333333333333333333333333333333333333333333333333333333");
        }
    })
    .catch(error => console.error('Erro ao obter dados do usuário:', error));
}

// Chama a função para carregar as informações do usuário quando a página do feed for carregada
window.addEventListener('load', function() {
    //carregarInformacoesDoUsuario();
});


//procurar comundiades 
document.getElementById('btnEncontrarComunidades').addEventListener('click', function() {
    // Redireciona para a página de busca de comunidades
    window.location.href = '/procurarComunidades';
  });

//adicionar amigo ----------------------------------
//botao 
// Botão de envio
document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('search-input').value;
    
    fetch('/buscar-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        document.getElementById('search-results').innerHTML = '<p>' + data.error + '</p>';
      } else {
        window.location.href = '/perfil/' + data.id;
      }
    })
    .catch(error => console.error('Erro ao buscar usuário:', error));
  });


  
  function enviarSolicitacaoAmizade(friendId) {
    fetch('/adicionar-amigo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendId: friendId })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data.message);
      document.getElementById('search-results').innerHTML = '<p>' + data.message + '</p>';
    })
    .catch(error => console.error('Erro ao enviar solicitação de amizade:', error));
  }


  document.addEventListener('DOMContentLoaded', () => {
  fetch('/dados-amigos')
    .then(response => response.json())
    .then(data => {
      const amigos = data.amigos;
      const friendContainer = document.querySelector('.friend-container');
      friendContainer.innerHTML = ''; // Limpa o container antes de adicionar os amigos
      const maxLength = 11; // Defina o número máximo de caracteres aqui
      const friends = document.querySelectorAll('.friend');

      amigos.forEach(amigo => {
        const friendDiv = document.createElement('div');
        friendDiv.classList.add('friend');
        friendDiv.innerHTML = `
          <a href="/perfil/${amigo.id}">
            <img src="${amigo.profileImagePath}" alt="Foto de perfil" width="50" height="50">
            <p><strong>${amigo.name}</strong> - ${amigo.email}</p>
          </a>
        `;
        friendContainer.appendChild(friendDiv);
      });

      friends.forEach(friend => {
        const nameElement = friend.querySelector('p strong');
        const name = nameElement.textContent;

        if (name.length > maxLength) {
            nameElement.textContent = name.substring(0, maxLength) + '...';
        }
    });
    });


});