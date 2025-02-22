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
 
   fetch('/dados-usuario')
   .then(response => response.json())
   .then(dadosUsuario => {
       const imagemUsuario = document.getElementById('preview-image');
       const imagemCapa = document.getElementById('preview-cover-image');

       if (dadosUsuario.profileImagePath) {
           imagemUsuario.src = dadosUsuario.profileImagePath;
       }

       if (dadosUsuario.coverImagePath) {
           imagemCapa.src = dadosUsuario.coverImagePath;
       }
   })
   .catch(error => console.error('Erro ao obter dados do usuário:', error));

    
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
document.getElementById('update-profile-image').addEventListener('click', function (e) {
    e.preventDefault();
    const input = document.getElementById('profile-image');
    const file = input.files[0];
  
    if (!file) {
      alert('Selecione uma imagem para enviar.');
      return;
    }
  
    const formData = new FormData();
    formData.append('profileImage', file);
  
    fetch('/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      document.getElementById('preview-image').src = data.url; // Atualiza a imagem no perfil
    })
    .catch(error => console.error('Erro ao enviar imagem:', error));
  });



//salvar imagem sem redirecionar pagina
document.getElementById('update-cover-image').addEventListener('click', function (e) {
    e.preventDefault();
    const input = document.getElementById('cover-image');
    const file = input.files[0];

    if (!file) {
        alert('Selecione uma imagem para enviar.');
        return;
    }

    const formData = new FormData();
    formData.append('coverImage', file);

    fetch('/upload-cover', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById('preview-cover-image').src = data.url; // Atualiza a imagem de capa na página
    })
    .catch(error => console.error('Erro ao enviar imagem de capa:', error));
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
           // body: JSON.stringify({ conteudo }), // Dados da publicação
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

  function toggleParticipacao(comunidadeId) {
    fetch(`/comunidade/${comunidadeId}/participar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        window.location.reload();
      })
      .catch(error => console.error('Erro ao atualizar participação:', error));
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetch('/comunidades-usuario')
        .then(response => response.json())
        .then(data => {
            const comunidadesContainer = document.getElementById('comunidades-container');
            comunidadesContainer.innerHTML = ''; // Limpa o container antes de adicionar as comunidades

            data.comunidades.forEach(comunidade => {
                const comunidadeDiv = document.createElement('div');
                comunidadeDiv.classList.add('comunidade');
                comunidadeDiv.innerHTML = `
                    <img src="${comunidade.imagemPerfil}" alt="Imagem de ${comunidade.nome}">
                    <p>${comunidade.nome}</p>
                `;
                comunidadesContainer.appendChild(comunidadeDiv);
            });
        })
        .catch(error => console.error('Erro ao carregar comunidades:', error));
});
//adicionar amigo ----------------------------------
//botao 
// Botão de envio
//document.getElementById('search-form').addEventListener('submit', function(event) {
//    event.preventDefault();
//    const email = document.getElementById('search-input').value;
//    
//    fetch('/buscar-usuario', {
//      method: 'POST',
//      headers: {
//        'Content-Type': 'application/json'
//      },
//      body: JSON.stringify({ email: email })
//    })
//    .then(response => response.json())
//    .then(data => {
//      if (data.error) {
//        document.getElementById('search-results').innerHTML = '<p>' + data.error + '</p>';
//      } else {
//        window.location.href = '/perfil/' + data.id;
//      }
//    })
//    .catch(error => console.error('Erro ao buscar usuário:', error));
//  });

//document.getElementById('search-form').addEventListener('submit', function(event) {
//    event.preventDefault();
//    const email = document.getElementById('search-input').value;
//    
//    fetch('/buscar-usuario', {
//      method: 'POST',
//      headers: {
//        'Content-Type': 'application/json',
//      },
//      body: JSON.stringify({ email: email }),
//    })
//      .then(response => response.json())
//      .then(data => {
//        if (data.error) {
//          document.getElementById('search-results').innerHTML = '<p>' + data.error + '</p>';
//        } else {
//          window.location.href = '/perfil/' + data._id; // Usar data._id (ObjectId do MongoDB)
//        }
//      })
//      .catch(error => console.error('Erro ao buscar usuário:', error));
//  });




document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('search-input').value;
  
    fetch('/buscar-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          document.getElementById('search-results').innerHTML = '<p>' + data.error + '</p>';
        } else if (data._id) { // Verifica se o _id está presente
          console.log('Usuário encontrado:', data);
          window.location.href = '/perfil/' + data._id; // Usar data._id (ObjectId do MongoDB)
        } else {
          console.error('Erro: ID do usuário não encontrado no objeto:', data);
          document.getElementById('search-results').innerHTML = '<p>Erro: ID do usuário não encontrado.</p>';
        }
      })
      .catch(error => console.error('Erro ao buscar usuário:', error));
  });
//document.getElementById('search-form').addEventListener('submit', function(event) {
//    event.preventDefault();
//    const email = document.getElementById('search-input').value;
//    console.log('Enviando requisição para buscar usuário:', email);
//    
//    fetch('/buscar-usuario', {
//      method: 'POST',
//      headers: {
//        'Content-Type': 'application/json',
//      },
//      body: JSON.stringify({ email: email }),
//    })
//      .then(response => response.json())
//      .then(data => {
//        const searchResults = document.getElementById('search-results');
//        searchResults.innerHTML = ''; // Limpa os resultados anteriores
//  
//        if (data.error) {
//          searchResults.innerHTML = '<p>' + data.error + '</p>';
//        } else {
//          // Cria um card para o usuário encontrado
//          const userCard = document.createElement('div');
//          userCard.classList.add('user-card');
//          userCard.innerHTML = `
//            <img src="${data.profileImagePath.replace(/^\.\/views\//, '')}" alt="Foto de perfil">
//            <div>
//              <h3>${data.name}</h3>
//              <p>${data.email}</p>
//              <a href="/perfil/${data._id}">Ver perfil</a>
//            </div>
//          `;
//          searchResults.appendChild(userCard);
//        }
//      })
//      .catch(error => console.error('Erro ao buscar usuário:', error));
//  });
  


  
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