function configureAppMiddleware(app, {
  express,
  bodyParser,
  session,
  helmet,
  cors,
  path,
  projectRoot,
  clientDir,
  frontendUrl,
  sessionSecret = process.env.SESSION_SECRET || 'local-dev-session-secret-change-before-production'
}) {
  app.use(bodyParser.json({ limit: '25mb' }));

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
  }));

  app.use(helmet({
    contentSecurityPolicy: false
  }));

  app.use(cors({
    origin: frontendUrl || 'http://localhost:3000',
    credentials: true
  }));

  app.use(express.static(clientDir));
  app.use('/components', express.static(path.join(projectRoot, 'components')));
  app.use('/styles', express.static(path.join(projectRoot, 'styles')));
  app.use('/js', express.static(path.join(projectRoot, 'js')));
}

module.exports = {
  configureAppMiddleware
};
