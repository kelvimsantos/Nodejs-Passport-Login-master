const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  nome: { type: String, required: true },
  donoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  quantidadeMembros: { type: Number, default: 1 },
  imagemPerfil: { type: String, default: './views/default-community.jpg' },
  imagemPerfilNoView: { type: String, default: '/default-community.jpg' },
  feed: [{
    autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conteudo: { type: String, required: true },
    data: { type: Date, default: Date.now },
  }]
});

const Community = mongoose.model('Community', communitySchema);

module.exports = Community;