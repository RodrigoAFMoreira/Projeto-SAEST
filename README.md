# SAEST - Sistema de Assistência Empresarial para Segurança no Trabalho

O SAEST é voltado para a segurança do trabalho na construção civil, projetado para otimizar o gerenciamento das normatizações de autoria de gestores de segurança no trabalho, assim como auxiliar administradores de obra e educar funcionários em medidas de segurança do trabalho.

## Objetivo do Projeto

Desenvolver uma aplicação web que facilite a gestão de normas de segurança, ofereça conteúdos educativos e permita a administração eficiente de informações relacionadas à segurança no trabalho.

## Tecnologias Utilizadas

- **Frontend**: Vite + React
- **Backend**: Supabase (em transição do Firebase)
- **Estilização**: CSS, Tailwind CSS
- **Outros**: JSX, React Router

## Progresso do Projeto (2º Semestre de 2025)

Abaixo está o resumo dos commits realizados até o momento:

### Commits

#### **25/08/2025** - Rodrigo (Commit: `2953d6c2f65deeab4e4e1814df10758b14d2bc3a`)
- **Contexto**: Início da transição do projeto para Vite + React, saindo do Firebase para Supabase.
- **Alterações principais**: Configuração inicial do projeto com Vite e React, implementação da funcionalidade de login.
- **Impacto**: Projeto agora roda com Vite, mas sem suporte a CSS.
- **Próximos passos**: Adicionar estilos e revisar funcionalidades de login/cadastro.

#### **28/08/2025** - Rodrigo (Commit: `052da3d096fbdd400fc3b5ecf1d604c9d73a0a12`)
- **Contexto**: Continuação da transição para Vite + React.
- **Alterações principais**: Ajustes na estrutura do `cadastro.jsx` e adição do `vite.config.js`.
- **Impacto**: Pequenas melhorias na estrutura do projeto, ainda sem suporte a CSS.
- **Próximos passos**: Adicionar estilos e revisar login.

#### **29/08/2025** - Rodrigo (Commits: `6aabb24745794cc791e5bdd9d36d17350db80782`, `da178da1d6cb28b85d94af4c2f4e5e0c6bd4f337`)
- **Contexto**: Configuração do roteamento e estilização inicial.
- **Alterações principais**:
  - Configuração do `routerConfig` para gerenciar rotas.
  - Transição de arquivos `.js` e `.html` para `.jsx` (dashboard, cadastro e login).
  - Adição de CSS.
  - Implementação de cadastro de usuário com interfaces de dashboard diferenciadas por posição.
- **Impacto**: Projeto funcional com navegação básica e estilização inicial.
- **Próximos passos**: Adicionar funcionalidades de mudança de senha e recuperação de conta.

#### **30/08/2025** - Rodrigo (Commit: `acfc525e9cd3d38bad43836a19991d959a68b5dd`)
- **Contexto**: Desenvolvimento de conteúdos educativos.
- **Alterações principais**: Adição de uma barra de pesquisa para tópicos de segurança do trabalho, com efeito de hover em cards (template temporário).
- **Impacto**: Atendimento inicial ao objetivo de fornecer conteúdos educativos para funcionários.
- **Próximos passos**: Preencher os cards com conteúdo relevante.

#### **31/08/2025** - Rodrigo (Commit: `12d79e15061a2ac8d49ac08470127bbe7ae201e1`)
- **Contexto**: Continuação dos conteúdos educativos.
- **Alterações principais**: Adição de dois cards baseados no template.
- **Impacto**: Área de informações parcialmente funcional.
- **Próximos passos**: Integrar os cards com dados do banco de dados (tabela EPI).

#### **31/08/2025** - Rodrigo (Commit: `e6eb1a5ce248264c4fcec582bc4f30027db45f22`)
- **Contexto**: Ajustes na interface.
- **Alterações principais**: Modificações no spinner (animação de carregamento) e remoção de elementos gráficos irrelevantes que causavam problemas.
- **Impacto**: Correção de erros no dashboard.
- **Próximos passos**: Adicionar mudança de senha e recuperação de conta.

#### **01/09/2025** - Caroline (Commit: `5b73bbc448395fee719905f81711353e8b058a48`)
- **Contexto**: Configuração de dependências.
- **Alterações principais**: Inclusão do Tailwind CSS nas dependências.
- **Impacto**: Preparação para uso de Tailwind no projeto.
- **Próximos passos**: Implementar estilização com Tailwind.

#### **07/09/2025** - Rodrigo (Commit: `b0fc4c79f6a5c13420e0a473b0c6e054d543e199`)
- **Contexto**: Melhorias na experiência do usuário.
- **Alterações principais**:
  - Implementação de recuperação de conta e mudança de senha.
  - Criação de componentes reutilizáveis (`forcaSenha` e `validação`).
  - Adição de página para verificação de e-mail.
- **Impacto**: Usuários agora podem recuperar contas e alterar senhas.
- **Próximos passos**: Permitir alteração de informações do usuário logado.

#### **08/09/2025** - Rodrigo (Commit: `b70d4a5add526aa660b1ec9fa967af842350758f`)
- **Contexto**: Expansão das funcionalidades do usuário.
- **Alterações principais**:
  - Adição de edição de nome, e-mail, senha e telefone.
  - Implementação de layout para gráficos e analytics no dashboard (parcialmente comentado, aguardando dados).
- **Impacto**: Usuários podem atualizar informações pessoais.
- **Próximos passos**: Exigir senha antiga para alterações de dados.

#### **08/09/2025** - Rodrigo (Commit: `acbab8c87aa239e114ae733f7da5742363718d9d`)
- **Contexto**: Organização do código.
- **Alterações principais**: Reorganização de componentes e adição de comentários para facilitar a colaboração.
- **Impacto**: Código mais claro e colaborativo.
- **Próximos passos**: Exigir senha antiga para alterações de dados.

#### **08/09/2025** - Rodrigo (Commit: `b5d95fd4a9ce86ed419f15eb4c121a89b1c579a4`)
- **Contexto**: Melhoria na segurança.
- **Alterações principais**: Implementação da necessidade de senha antiga para alterar informações.
- **Impacto**: Aumento da segurança nas alterações de dados.
- **Próximos passos**: Implementar funcionalidades relacionadas a EPI.
