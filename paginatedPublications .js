function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }
  
  // Rota que utiliza paginatedPublications
  app.get('/some-route', ensureAuthenticated, (req, res, next) => {
    let paginatedPublications;
  
    // Certifique-se de definir paginatedPublications aqui
    if (someCondition) {
      paginatedPublications = getPaginatedPublications();
    }
  
    // Verifique se paginatedPublications foi definida
    if (!paginatedPublications) {
      return res.status(500).send('paginatedPublications is not defined');
    }
  
    // Continue com o uso de paginatedPublications
    res.render('some-view', { paginatedPublications });
  });
  