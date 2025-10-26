# SAEST - Sistema de Assistência Empresarial para Segurança no Trabalho

O SAEST é voltado para a segurança do trabalho na construção civil, projetado para otimizar o gerenciamento das normatizações de autoria de gestores de segurança no trabalho, assim como auxiliar administradores de obra e educar funcionários em medidas de segurança do trabalho.

## Objetivo do Projeto

Desenvolver uma aplicação web que facilite a gestão de normas de segurança, ofereça conteúdos educativos e permita a administração eficiente de informações relacionadas à segurança no trabalho.

## Tecnologias Utilizadas

- **Frontend**: Vite + React
- **Backend**: Supabase (em transição do Firebase)
- **Estilização**: CSS, Tailwind CSS
- **Outros**: JSX, React Router

## Comandos no Terminal Para Execução do Projeto
npm install @vitejs/plugin-react
npm run dev

## Progresso do Projeto (2º Semestre de 2025)

Abaixo está o resumo dos commits realizados até o momento:

### Commits

#### **25/08/2025** - Rodrigo (Commit: `2953d6c2f65deeab4e4e1814df10758b14d2bc3a`)
- **Descrição**: Versão inicial com o início do processo de transição, neste primeiro momento estava a me adaptar com duas grandes mudanças, a decisão da equipe de adotar o vite e react, não presentes no projeto do semestre anterior assim como a transição do firebase para supabase. neste primeiro momento foi um commit sem css. Com funcionalidade de login apenas.
- **Contexto**: Início da transição para Vite + React
- **Alterações principais**: Setup inicial
- **Impacto**: Projeto agora roda com Vite, ainda sem suporte a CSS
- **Próximos passos**: Adicionar estilos e revisar login/cadastro

#### **28/08/2025** - Rodrigo (Commit: `052da3d096fbdd400fc3b5ecf1d604c9d73a0a12`)
- **Descrição**: Um breve ajuste na estrutura do cadastro.jsx, não houve mudanças significativas.
- **Contexto**: Início da transição para Vite + React
- **Alterações principais**: Adição do vite.config.js, setup inicial
- **Impacto**: Projeto agora roda com Vite, ainda sem suporte a CSS
- **Próximos passos**: Adicionar estilos e revisar login

#### **29/08/2025** - Rodrigo (Commits: `6aabb24745794cc791e5bdd9d36d17350db80782`, `da178da1d6cb28b85d94af4c2f4e5e0c6bd4f337`)
- **Descrição**: Neste momento dei início a configuração do routerConfig, o qual configura as rotas, foram adicionados css, e fiz a transição de arquivos de js,html para jsx. estes sendo, dashboard, cadastro e login. O usuário agora pode ser cadastrado, e dependendo se sua posição tem uma interface no dashboard diferente.
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Adição de pagina principal após login
- **Impacto**: A transição do projeto agora é funcional, porém neste momento limitado.
- **Próximos passos**: Adicionar mudança de senha e recuperação de conta

#### **30/08/2025** - Rodrigo (Commit: `acfc525e9cd3d38bad43836a19991d959a68b5dd`)
- **Descrição**: Houve a adição de um novo elemento em paralelo a transição, neste caso este commit é referente ao item de "conteúdos educativos sobre segurança de trabalho por meio de search bar de tópicos". a search bar é operacional as imagens e textos referentes são alinhados com a proposta e há um efeito de card ao acionar o hover para itens, neste momento com um card template.
- **Contexto**: Conteúdos educativos
- **Alterações principais**: Adição de aba informações
- **Impacto**: Atendimento imediato do objetivo de conteúdos educativos para funcionários de baixo nível de decisão.
- **Próximos passos**: Colocar conteúdo nos cards que usam o template (que é temporário)

#### **31/08/2025** - Rodrigo (Commit: `12d79e15061a2ac8d49ac08470127bbe7ae201e1`)
- **Descrição**: Adição de cards para dois dos primeiros items template; planejo puxa-los do banco de dados assim que a parte de EPI seja feita.
- **Contexto**: Conteúdos educativos
- **Alterações principais**: Adição de cards na área de informações
- **Impacto**: A transição do projeto agora é funcional, porém neste momento parcial.
- **Próximos passos**: Adicionar cards que puxam informação do banco (no caso tabela epi)

#### **31/08/2025** - Rodrigo (Commit: `e6eb1a5ce248264c4fcec582bc4f30027db45f22`)
- **Descrição**: Houveram modificações em relação ao spinner (animação de carregar a página) e supressão de elementos de gráficos que só irão ser relevantes mais adiante que estavam gerando problemas. Não foram alterações significativas.
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Modificações no dashboard
- **Impacto**: Correção de erros.
- **Próximos passos**: Adicionar mudança de senha e recuperação de conta

#### **01/09/2025** - Caroline (Commit: `5b73bbc448395fee719905f81711353e8b058a48`)
- **Descrição**: A preencher... (chore: incluido o tailwind nas dependencias)
- **Contexto**: Configuração de dependências
- **Alterações principais**: Inclusão do Tailwind CSS nas dependências
- **Impacto**: Preparação para uso de Tailwind no projeto
- **Próximos passos**: Implementar estilização com Tailwind

#### **07/09/2025** - Rodrigo (Commit: `b0fc4c79f6a5c13420e0a473b0c6e054d543e199`)
- **Descrição**: Usuário pode recuperar sua conta e mudar senha, neste momento em diante estou fazendo componentes para reutilização do código para melhor aproveitar código existente, foram criados forcaSenha e validação, assim como pagina para verificar email.
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Adição de nova página e componentes
- **Impacto**: Usuário pode recuperar sua conta e mudar senha
- **Próximos passos**: Adicionar parte de alteração de informações de usuário assim que estiver logado

#### **08/09/2025** - Rodrigo (Commit: `b70d4a5add526aa660b1ec9fa967af842350758f`)
- **Descrição**: Adicionado a possibilidade de mudar nome, email, senha, e telefone, implementação de um layout no dashboard para o item de "gráficos e analytics", porém neste momento não há informação para alguns dos campos, então está comentado.
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Adição de nova página e componentes
- **Impacto**: Usuário pode mudar dados pessoais
- **Próximos passos**: Adicionar requerimento de senha antiga para mudança de campos

#### **08/09/2025** - Rodrigo (Commit: `acbab8c87aa239e114ae733f7da5742363718d9d`)
- **Descrição**: Organização de componentes e comentários adicionados para ajudar a outra integrante do grupo. Não houve mudanças significativas.
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Organização
- **Impacto**: Melhor organização
- **Próximos passos**: Adicionar requerimento de senha antiga para mudança de campos

#### **08/09/2025** - Rodrigo (Commit: `b5d95fd4a9ce86ed419f15eb4c121a89b1c579a4`)
- **Descrição**: Adição de necessidade de usar senha antiga para alterar informações.
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Necessidade de usar senha antiga para alterar informações
- **Impacto**: Boas práticas
<<<<<<< HEAD
- **Próximos passos**: Adicionar parte de EPI.

#### **11/09/2025** - Rodrigo (Commit: `783942af93f5a9bee65b48751ff7af0f55e58262`)
- **Descrição**: Adicionado as funções de epi. (adição, remoção).
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Adicionado meios de adicionar epis
- **Impacto**: popular o banco com epis.
- **Próximos passos**: fazer a página de irregularidades abrangendo o tópico "Registrar o progresso de situação de irregularidades de segurança do trabalho em uma obra com lembrete enviado por Email."

#### **15/09/2025** - Caroline (Commit: `d31a7ff71765f570290e453c136c105980ea02cd`)
- **Descrição**: Front-end da página de Login e Documentos
- **Contexto**: Estilização da página de Login incluindo a biblioteca Mui UI. Inserção da Página de Documentos.
- **Alterações principais**: Novo design e desenvolvimento da página de normas.
- **Impacto**: Boas práticas <<<<<<< HEAD
- **Próximos passos**: Corrigir as novas rotas de gerenciamento de usuario, e fazer o front-end das seguintes páginas: cadastro, configuração, dashboard, documento, empresas, obras, epi's, informações (gerente). verificar email, criar componente para admnistrador, gestor e funcionario já são existentes. adicionar compatibilidade com dispositivos moveis. inserção de gráficos analiticos.

#### **27/09/2025** - Rodrigo (Commit: `85c513da3b702dc8f5183d6fa4e8a768fe0ef786`)
- **Descrição**: Finalizada conversao (empresa/obra), implantado login seguindo normas de JWT, feitas melhorias diversas.
- **Contexto**: Transição para Vite + React
- **Alterações principais**: Adicionado log in seguro.
- **Impacto**: Maior segurança no login.
- **Próximos passos**: fazer a página de irregularidades abrangendo o tópico "Registrar o progresso de situação de irregularidades de segurança do trabalho em uma obra com lembrete enviado por Email."

#### **28/09/2025** - Rodrigo (Commit: `14bb7c42f0410925fac2ac9e0629ef7b1c3ace05`)
- **Descrição**: Foram criadas interfaçes com objetivos diferentes para admin e para gestor de segurança
- **Contexto**: Melhorias
- **Alterações principais**: Feitos ajustes para as paginas dos respectivos atores
- **Impacto**: melhor separação de cargos
- **Próximos passos**: Fazer o mesmo para user comum

#### **28/09/2025** - Rodrigo (Commit: `61e72f85d125322982c6d49f8feb9f1b11da1555`)
- **Descrição**: Adicionado logout com segurança (Json web tokens) 
- **Contexto**: Segurança
- **Alterações principais**: Adicionado logout por meio de JWT, o que agora permite um log out verdadeiro
- **Impacto**: permitir vários usuários distintos das 3 categorias (user, admin e gestor) possam fazer novo login
- **Próximos passos**: Fazer melhor interfaçe para user comum

#### **28/09/2025** - Rodrigo (Commit: `2b7aa7d4c47f92ff789cbdb638c59a8fe4d802e8`)
- **Descrição**: Adicionado possibilidade do user enviar certificações em pdf
- **Contexto**: Melhorias
- **Alterações principais**: Adicionado possibilidade do funcionario enviar suas certificações em pdf
- **Impacto**: envio de arquivo pdf para vertificacoes
- **Próximos passos**: Implementar busca obra e graficos

#### **29/09/2025** - Rodrigo (Commit: `4355339bfe9479d1e04c8709ef04ae840b55ea53`)
- **Descrição**: Adicionado busca obra, para o gestor
- **Contexto**: Melhorias
- **Alterações principais**: Alterações principais: Adicionado (porém não totalmente completo) a ação de busca de obra criada por um admin pelo gestor de segurança pelo ID
- **Impacto**: Impacto futuro, não esta completamente funcional
- **Próximos passos**: Implementar gráficos

#### **29/09/2025** - Rodrigo (Commit: `eef22a2bd8920bf75c148a8c089fb3eb0f3b36df`)
- **Descrição**: Adicionado gráficos
- **Contexto**: Melhorias
- **Alterações principais**: Adicionado primeiros gráficos
- **Impacto**: Impacto de mostrar informações relevantes ao admin
- **Próximos passos**: Implementar melhorias para a parte de frontend para toda a aplicação

#### **06/10/2025** - Rodrigo (Commit: `ae28f5b77ffb3d99e9d6cc7f460862007bbfbaa0`,`54549f985c039add6a740c5981081758f66c4d98`)
- **Descrição**: Corrigido equívoco na importação da classe Authservice; Remoção de redundâncias e corrigido erro de obras serem as mesmas para todos os administradores
- **Contexto**: Melhorias
- **Alterações principais**: Remoção de redundâncias e correção de equívocos
- **Impacto**: Diminuição de clutter nas páginas
- **Próximos passos**: Implementar melhorias para a parte de frontend para toda a aplicação

#### **13/10/2025** - Rodrigo (Commit: `07f6c1950c1b2c515a782d94bcb5f668ad37064b`)
- **Descrição**: Informaçoes de dashboard são agora baseadas em id do usuário logado no momento, ou seja dados diferentes para tipos diferentes do mesmo user.
- **Contexto**: Melhorias e correções
- **Alterações principais**: Melhorias para leitura de dados relevantes para o user específico
- **Impacto**: Demonstração precisa de informações relevantes
- **Próximos passos**: Implementar melhorias para a parte de frontend para toda a aplicação

#### **13/10/2025** - Rodrigo (Commit: `475e632df3ccb5987919e105a4c75d6b954507c7`)
- **Descrição**: Adição de gráficos mais relevantes
- **Contexto**: Melhorias e correções
- **Alterações principais**: Melhorias para leitura de dados relevantes
- **Impacto**: Demonstração precisa de informações relevantes ao cargo logado
- **Próximos passos**: Implementar melhorias para a parte de frontend para toda a aplicação

#### **19/10/2025 e 20/10/2025** - Rodrigo (Commit: `3f4e0ed0ca099ed11835d6c283fbdb4d3741911a`,`38db4d3dd4e701285016b715bc51cd22bf653a36`)
- **Descrição**: Adição de filtros para gráficos e Simples correção visual para mostrar endereço ao invés de id para o user final
- **Contexto**: Melhorias e correções
- **Alterações principais**: Melhorias para leitura de dados relevantes
- **Impacto**: Demonstração precisa de informações relevantes ao filtro selecionad
- **Próximos passos**: Implementar melhorias para a parte de frontend para toda a aplicação

#### **26/10/2025** - Rodrigo (Commit: ``)
- **Descrição**: Adição de verbos "put","delete","get","post"...; menssagens de erro claras, e informações relevantes no console
- **Contexto**: Verbos HTTP e tratamento de erros
- **Alterações principais**:  Nas classes login, cadastro, obra,empresa, configuração, e authservice foram adicionados Verbos HTTP e tratamento de erros.
- **Impacto**: Melhor controle do sistema & administração de erros
- **Próximos passos**: Implementar melhorias para a parte de frontend para toda a aplicação