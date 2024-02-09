document.addEventListener('DOMContentLoaded', function () {
    // Referências aos elementos do DOM
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




// Adicione um listener ao botão
//document.getElementById('salvarPerfil').addEventListener('click', function () {
//    // Pegue o caminho da imagem
//    var profileImageInput = document.getElementById('profile-image');
//    var profileImagePath = profileImageInput ? profileImageInput.value : null;
//
//    // Verifique se o elemento foi encontrado antes de tentar acessar a propriedade 'value'
//    if (profileImagePath !== null) {
//        // Faça alguma lógica com o caminho da imagem
//        console.log('Profile Image Path:', profileImagePath);
//
//        // Exemplo de como você pode usar fetch para enviar dados para o servidor
//        fetch('/salvarPerfil', {
//            method: 'POST',
//            headers: {
//                'Content-Type': 'application/json'
//            },
//            body: JSON.stringify({ profileImagePath: profileImagePath })
//        })
//        .then(response => response.json())
//        .then(data => {
//            // Faça algo com a resposta do servidor, se necessário
//            console.log('Resposta do servidor:', data);
//        })
//        .catch(error => {
//            console.error('Erro ao enviar dados para o servidor:', error);
//        });
//    } else {
//        console.error('Elemento de imagem de perfil não encontrado no DOM.');
//    }
//});


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




// Endpoint para salvar informações do usuário (por exemplo, nome, email, etc.)
app.post("/save-user-info", (req, res) => {
    const userId = req.user.id;
    const { name, email, profileImagePath,coverImagePath,declaracoes} = req.body;
  
    // Encontre o usuário correspondente com base no ID
    const currentUser = users.find(user => user.id === userId);
  
    // Atualize as informações do usuário
    currentUser.name = name;
    currentUser.email = email;
    currentUser.profileImagePath = profileImagePath;
    currentUser.coverImagePath = coverImagePath;
    currentUser.declaracoes = declaracoes;

  
    // Salve os dados atualizados no arquivo JSON
    saveUsersToFile(users);
  
    // Envie uma resposta adequada (por exemplo, JSON com mensagem de sucesso)
    res.json({ message: "Informações do usuário atualizadas com sucesso." });
  });
  
  // Função para salvar usuários no arquivo JSON
  function saveUsersToFile(users) {
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf-8');
  }