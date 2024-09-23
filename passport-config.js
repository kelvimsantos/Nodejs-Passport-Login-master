const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById, reloadUsersData) {
  const authenticateUser = async (email, password, done) => {
    console.log('Authenticating user:', email);
    const user = getUserByEmail(email);
    if (user == null) {
      console.log('No user with that email:', email);
      return done(null, false, { message: 'No user with that email' });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        console.log('Password correct. User authenticated:', user);
        return done(null, user);
      } else {
        console.log('Password incorrect for user:', user);
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (e) {
      return done(e);
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });

  // Método para recarregar os dados dos usuários após o registro
  const reloadUserData = () => {
    console.log('Reloading user data...');
    reloadUsersData();
  };

  // Chame reloadUserData quando o servidor for iniciado para garantir que os dados do usuário sejam carregados
  reloadUserData();

  // Exponha a função reloadUserData para que ela possa ser chamada quando necessário
  passport.reloadUserData = reloadUserData;
}

module.exports = initialize;
