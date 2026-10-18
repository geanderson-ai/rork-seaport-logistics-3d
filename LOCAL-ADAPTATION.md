# Adaptação local — seleção modular de portos

Esta cópia preserva o Portwise original, sob MIT, e acrescenta uma seleção entre Singapura e Portonave. O upstream de referência é `alexngdev99/rork-seaport-logistics-3d`, commit `cb0bb9f8be3cdfd7f22cbadf184100580ff13e30`. A adaptação é local; a demonstração pública original não recebeu essas mudanças.

## Comportamento implementado

- **Singapura** abre a aplicação original em `/`, com seus navios, métricas, geografia e animações fictícios.
- **Portonave** abre `/portonave`, com informações públicas de infraestrutura e um estado de preparação do twin. A página não carrega o cenário ou indicadores fictícios de Singapura.
- O seletor compartilhado aparece nos dois contextos e permite retornar ao demo original.
- A rota preserva a seleção ao atualizar a página ou abrir um link direto. Não existe uma seleção global persistida em conta ou armazenamento local.

## Organização

| Arquivo | Responsabilidade |
|---|---|
| [ports.ts](web-portwise/src/data/ports.ts) | Catálogo de portos: ID, nome, localização, rota e estado |
| [PortSelector.tsx](web-portwise/src/components/PortSelector.tsx) | Menu compartilhado, navegação e indicação do porto ativo |
| [Portonave.tsx](web-portwise/src/pages/Portonave.tsx) | Área inicial de Navegantes com dados públicos e próximos marcos |
| [App.tsx](web-portwise/src/App.tsx) | Registro da rota própria da Portonave |
| [TopBar.tsx](web-portwise/src/components/hud/TopBar.tsx) | Inclusão do seletor na interface existente de Singapura |

O catálogo é uma primeira separação entre portos. A cena de Singapura ainda importa dados e constantes específicos diretamente; não foi convertida num renderer genérico de múltiplos terminais. Adicionar um porto completo exige seu módulo de dados, cena e provedor de estado, além de cadastrar a opção e a rota.

## Relação com Blender MCP

A Fase A da Portonave existe no projeto pai como `.blend` georreferenciado e três imagens 4K. Esses arquivos ainda não foram importados pela aplicação web. O próximo passo é exportar geometrias otimizadas com IDs estáveis e definir um `PortManifest` versionado contendo coordenadas, camadas, ativos e origem dos estados. Eventos de um motor de cenários deverão alimentar os objetos selecionáveis e os painéis; uma animação visual não comprova simulação física ou estado real.

## Verificação e limites

Na implementação do seletor, `bun run build` e a checagem TypeScript com `tsconfig.app.json` passaram. Não foi registrada validação automatizada de navegação no navegador ou revisão completa em dispositivos móveis; essas verificações permanecem para a evolução da interface. A área Portonave é uma página inicial informativa e não uma visualização 3D do terminal.

Preservar os avisos de copyright e a [licença MIT](LICENSE) do upstream nas adaptações. Os dados públicos e modelos importados no futuro têm licenças próprias.
