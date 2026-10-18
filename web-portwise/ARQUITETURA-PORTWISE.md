# Análise de Arquitetura e Engenharia — Web Portwise (Gêmeo Digital Portonave)

Documento técnico de análise estrutural, motor de simulação 3D, origem de dados e diretrizes de integração de modelos `.glb` do Blender no projeto **Portwise** (`web-portwise`), localizado em:
`/mnt/dados/meza/meza-physical-ai/gemeos-digitais/projects/flow-intelligence/gemeo-digital-portonave/rork-seaport-logistics-3d/web-portwise`.

---

## 1. Visão Geral e Propósito

O **Portwise** é uma aplicação web desktop e mobile de **Gêmeo Digital (Digital Twin)** e simulação operacional em tempo real de um terminal portuário de contêineres e seu distrito logístico integrado.

- **Upstream de Referência:** Baseado no projeto de código aberto sob licença MIT (`alexngdev99/rork-seaport-logistics-3d`), originalmente ambientado no *Pasir Panjang Terminal* (Porto de Singapura).
- **Adaptação Local (Gêmeo Portonave):** O projeto foi estendido localmente para suportar uma seleção modular de portos:
  1. **Singapura (`/`):** Cenário de demonstração completo com simulação 3D contínua, telemetria AIS, pátio, guindastes STS, ferrovia intermodal e distrito logístico.
  2. **Portonave (`/portonave`):** Estrutura inicial para o terminal portuário de Navegantes/SC (com capacidade de 1.5M TEU, 900 metros de cais e 3 berços), desenhada para receber a importação dos modelos 3D georreferenciados em Blender (`.blend`) e telemetria operacional.

---

## 2. Origem e Modelagem dos Dados

> **Resumo em uma frase:**
> Os dados são gerados e simulados inteiramente no navegador através de estruturas tipadas em TypeScript e funções matemáticas determinísticas (normas náuticas AIS/NMEA, cinemática de guindastes, blocos e sementes pseudoaleatórias), tendo como única fonte externa a API gratuita da Open-Meteo para o clima em tempo real.

- **Ausência de Backend Obrigatório:** A aplicação opera de ponta a ponta sem necessidade de banco de dados SQL ou servidor backend ativo para rodar o gêmeo digital.
- **Estruturas Tipadas (`src/data/`):** Os ativos e o layout são definidos em arquivos TypeScript declarativos (`types.ts`, `port.ts`, `facilities.ts`, `drayage.ts`, `containers.ts`, `shipClasses.ts`):
  - `Vessel`: dados cadastrais (IMO, linha, bandeira, dimensões, berço planejado, TEUs de carga/descarga).
  - `QuayCrane`: modelo, operador, taxa de ciclos/hora, berço alocado.
  - `YardBlock`: coordenadas de grid $X, Z$, categoria (*import*, *export*, *reefer*) e capacidade.
  - `Truck`: rotas com paradas programadas (*RoutePoint[]*), velocidade, tempos de espera e tipo (*external*, *itv*, *drayage*).
- **Geração Pseudoaleatória Determinística:** Posições, identificadores de contêineres (prefixos ISO 6346 como `MSKU`, `CMAU`, `HLXU`) e taxas são gerados pelo algoritmo PRNG `mulberry32`, garantindo que toda a distribuição seja consistente em qualquer máquina.
- **Tempo Real & Replay:** O estado de qualquer entidade no tempo $t$ é calculado como uma projeção a partir de $t=0$, permitindo navegação bidirecional no tempo.

---

## 3. Origem das Formas 3D: Three.js vs. Blender

Atualmente, **100% das formas visíveis no `web-portwise` são geradas proceduralmente via código no Three.js**:
- Não existem arquivos `.glb`, `.gltf` ou `.obj` carregados no bundle da aplicação web atual.
- Todas as malhas (cascos de navios com curvas Bézier, guindastes STS com treliças, caminhões, contêineres, armazéns e pista do aeroporto) são montadas usando primitivas Three.js (`BoxGeometry`, `CylinderGeometry`, `ExtrudeGeometry`, `PlaneGeometry`) nos arquivos `src/three/parts.tsx` e `src/three/district/kit.tsx`.

### Onde estão os arquivos do Blender?
Os arquivos do Blender residem no diretório do projeto pai:
`/mnt/dados/meza/meza-physical-ai/gemeos-digitais/projects/flow-intelligence/gemeo-digital-portonave/blend/`
- `00-territorio-portonave.blend`
- `01-fase-a-territorio.blend`
- `02-fase-b1-container-l2.blend`
- `03-foz-entrada.blend`
- `04-b1-modulo-producao.blend`

Esses arquivos contêm o terreno real georreferenciado, a foz do Rio Itajaí-Açu, o canal de acesso, as instalações da Portonave e o Aeroporto de Navegantes.

---

## 4. Stack Tecnológica

| Camada | Tecnologias Utilizadas |
|---|---|
| **Linguagem & Runtime** | TypeScript 5.9, Bun / Node.js, Vite 8 |
| **Interface & Componentes** | React 19, Tailwind CSS 3.4, Radix UI (shadcn/ui), Lucide Icons, Sonner (notificações), Embla Carousel, Recharts |
| **Motor Gráfico 3D** | Three.js (`^0.186`), `@react-three/fiber` (R3F v9), `@react-three/drei` (v10) com suporte nativo a `useGLTF` |
| **Gerenciamento de Estado** | `@nkzw/create-context-hook` (`PortProvider`), `useSyncExternalStore` nativo do React para sincronização a 60 FPS sem overhead de re-render |
| **Dados Externos / Clima** | `@tanstack/react-query` consumindo dados reais da API Open-Meteo |
| **Testes & Validação** | Vitest 4, Playwright |

---

## 5. Arquitetura da Aplicação e Módulos Principais

```
web-portwise/src/
├── components/          # Componentes visuais, BootScreen, PortSelector
│   └── hud/             # Interface flutuante (KPIs, time bar, AIS, berços, busca)
├── data/                # Constantes geométricas, layouts, dados de navios e blocos
├── lib/                 # Utilitários, coordenadas WGS-84, links de câmera e hápticos
├── pages/               # Páginas roteadas (Overview, Vessels, Yard, Logistics, Portonave)
├── sim/                 # Motor de simulação matemática determinística
│   └── ais/             # Motor náutico: rastreamento AIS, NMEA 0183, cinemática
├── state/               # Provedores de estado reativos (clima, câmera, filtros, boot)
└── three/               # Componentes R3F (cenário 3D, navios, gruas STS, pátio, shader d'água)
```

### 5.1. Shell Persistente (`src/pages/AppShell.tsx`)
A aplicação monta um único `<Canvas>` 3D no fundo (`PortScene.tsx`) que **nunca é destruído durante a navegação entre rotas**. As diferentes páginas (`Overview`, `Vessels`, `Yard`, `Logistics`, `Shipment`) são montadas via React Router dentro do HUD flutuante, ajustando dinamicamente a câmera (`CameraRig.tsx`) com transições cinemáticas para o foco selecionado.

### 5.2. Motor de Simulação Baseado em Tempo Puro (`src/sim/simStore.ts`)
Tudo na aplicação é uma função pura de um único relógio:
- `simT()` calcula os segundos transcorridos com base em uma âncora temporal e taxa de reprodução (`rate`).
- **Controles de Tempo:** Permite pausar, dar play, rebobinar (-2×, -8×, -32×), avançar rápido (+2×, +8×, +32×), fazer *scrub* na linha do tempo e voltar ao modo **Live** sincronizado com `performance.now()`.
- Todas as posições são calculadas a partir de $t$, tornando a cena 100% determinística e reversível.

### 5.3. Simulação Náutica & AIS Realista (`src/sim/ais/`)
- **ITU-R M.1371:** Implementa a especificação náutica internacional para mensagens AIS de Classe A (mensagens 1, 2 e 3).
- **Codificação/Decodificação NMEA 0183:** As posições geram sentenças reais `!AIVDM` com cálculo de checksum em tempo real em `nmea.ts`.
- **Telemetria Realista:** Simula latência de recepção, perda de pacotes (~3-8%) e ruído de posicionamento GNSS.
- **Dead-Reckoning:** Entre cada fix de AIS, a posição do casco é projetada com base em SOG, COG e ROT, interpolando suavemente em 2,2 segundos.
- **Georreferenciamento:** Converte coordenadas de tela e mundo 3D diretamente para latitude/longitude no elipsoide **WGS-84** (`geo.ts`).

### 5.4. Pátio, Operações de Cais e Logística Intermodal
- **Guindastes STS:** Animações completas de ciclo de carga/descarga (movimentação de trolley, lança, *spreader* e elevação).
- **Pátio de Contêineres:** Renderização de milhares de contêineres utilizando `THREE.InstancedMesh` em uma única chamada de desenho (*draw call*), com suporte a *raycasting* individual para exibir dados de cada contêiner.
- **Distrito Logístico:** Terminal ferroviário intermodal, estação de carga consolidada (CFS), armazém alfandegado, câmara fria (*cold storage*), raio-x de inspeção e indústrias.

### 5.5. Clima Dinâmico e Atmosfera Física
- **Posição Solar NOAA (`sun.ts`):** Fórmulas astronômicas calculam elevação e azimute exatos do sol para a latitude/longitude do terminal, definindo gradiente de céu, sombras e iluminação noturna.
- **Sincronização Meteorológica:** Consulta dados da API Open-Meteo a cada 10 minutos para chuva, vento e rajadas. Em ventos fortes, os guindastes STS entram em *weather hold* (lança levantada).
- **Shaders Personalizados:** Shader GLSL de água com ondulações de marola (*swell*), corte de vento (*whitecap streaks*) e reflexos dinâmicos.

---

## 6. O que Precisa de Adaptação no Código para Receber `.glb`?

Como a aplicação já possui `@react-three/drei` (que inclui `useGLTF`), o motor já conta com suporte nativo para carregar modelos glTF/GLB. A integração arquitetural exige 6 etapas:

### 6.1. Exportação e Hospedagem de Ativos Estáticos (`public/`)
Exportar as coleções do Blender em arquivos `.glb` otimizados (usando compressão Draco ou Meshopt) e colocá-los na pasta pública do Vite:
```
web-portwise/public/models/portonave/
├── territorio-base.glb        # Terreno, água, bacia de evolução, pistas do aeroporto
├── estruturas-fixas.glb       # Galpões, prédios administrativos, gates, cais
└── ativos-dinamicos.glb       # Malhas individuais: Guindastes STS, RTG, navios, caminhões
```

### 6.2. Criação do Componente Loader com `useGLTF` (`src/three/`)
Criar componentes R3F específicos para instanciar as malhas importadas:
```tsx
import { useGLTF } from "@react-three/drei";

export function PortonaveModel() {
  const { scene } = useGLTF("/models/portonave/territorio-base.glb");
  return <primitive object={scene} receiveShadow castShadow />;
}

// Pré-carregamento no boot da aplicação
useGLTF.preload("/models/portonave/territorio-base.glb");
```

### 6.3. Nomenclatura Estável no Blender e Interatividade (`Selectable`)
Para que o clique do usuário em um guindaste, berço ou galpão abra o card correto e faça a câmera voar para o objeto:
- **No Blender:** Atribuir IDs padronizados aos objetos (ex: `Berth_01`, `STS_01`, `Gate_A`, `CFS_Warehouse`).
- **No Código (`traverse`):**
  ```tsx
  useEffect(() => {
    scene.traverse((child) => {
      if (child.name.startsWith("STS_")) {
        // Registra o objeto 3D para o CameraRig saber para onde voar
        sceneRegistry.set(`crane:${child.name}`, child);
      }
    });
  }, [scene]);
  ```

### 6.4. Animação de Partes Móveis (Guindastes STS e Navios)
Para manter o comportamento dinâmico:
- **No Blender:** O modelo do guindaste STS deve ter hierarquia de pivôs separada:
  `STS_Base` $\rightarrow$ `STS_Boom` (lança que levanta) $\rightarrow$ `STS_Trolley` (carro) $\rightarrow$ `STS_Spreader` (engate).
- **No React Three Fiber:** Acessar o nó filho via `nodes.STS_Boom.rotation.z` dentro de `useFrame()`, aplicando as mesmas variáveis de ciclo de `simStore.ts`.

### 6.5. Alinhamento de Escala e Georreferenciamento
- **Definir Origem Central (Datum):** No Blender, os arquivos estão em escala real ou coordenadas UTM de Navegantes. Definir uma coordenada de referência (ex: centro do cais da Portonave no Rio Itajaí-Açu: `26.897° S, 48.653° W`).
- **Matriz de Conversão:** Criar `src/data/portonaveLayout.ts` com o offset de translação e rotação em relação ao Norte real para que a posição do sol (`sun.ts`), o vento (`weatherFx.ts`) e as trajetórias AIS batam exatamente com o terreno 3D.

### 6.6. Integração com a Tela de Carregamento (`BootScreen.tsx` e `SceneReady.tsx`)
- Registrar o download dos `.glb` nos estágios de inicialização em `src/state/boot.ts`.
- O `SceneReady.tsx` executará automaticamente o `gl.compileAsync(scene, camera)` nos shaders e texturas do `.glb` antes que o BootScreen suba, eliminando qualquer queda de taxa de quadros (*jank*) no primeiro frame.
