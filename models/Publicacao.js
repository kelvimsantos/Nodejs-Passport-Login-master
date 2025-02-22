const mongoose = require('mongoose');

const publicacaoSchema = new mongoose.Schema({
    conteudo: String,
    data: { type: Date, default: Date.now },
    autorId: mongoose.Schema.Types.ObjectId,
    comunidadeId: mongoose.Schema.Types.ObjectId,
    imagemPublicacao: String
  });
  
  const Publicacao = mongoose.model('Publicacao', publicacaoSchema);