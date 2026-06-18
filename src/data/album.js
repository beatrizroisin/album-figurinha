// ─── CONSTANTES ──────────────────────────────────────────────
export const MAX_PACKS_DAY    = 2;
export const STICKERS_PER_PACK = 5;
export const PER_PAGE          = 9; // 3×3 por página do álbum

// ─── SETORES ─────────────────────────────────────────────────
export const SETORES = [
  { id: 'socios',      nome: 'Sócios',             cor: '#FF6B00', corText: '#fff', page: 1 },
  { id: 'dev',         nome: 'Desenvolvimento',    cor: '#2196F3', corText: '#fff', page: 2 },
  { id: 'ux',          nome: 'UX & Design',        cor: '#00BCD4', corText: '#fff', page: 3 },
  { id: 'crm',         nome: 'CRM',                cor: '#E91E63', corText: '#fff', page: 4 },
  { id: 'cro',         nome: 'CRO',                cor: '#9C27B0', corText: '#fff', page: 4 },
  { id: 'marketing',   nome: 'Marketing',          cor: '#FF5722', corText: '#fff', page: 4 },
  { id: 'atendimento', nome: 'Atendimento',        cor: '#4CAF50', corText: '#fff', page: 5 },
  { id: 'comercial',   nome: 'Comercial',          cor: '#FFC107', corText: '#1C1C1C', page: 5 },
  { id: 'especial',    nome: 'Especiais',          cor: '#7C3AED', corText: '#fff', page: 6 },
];

// ─── FUNCIONÁRIOS ────────────────────────────────────────────
// ┌──────────────────────────────────────────────────────────────
// │  COMO ADICIONAR FOTOS:
// │  Coloque os arquivos em /public/fotos/  (ex: joao.png)
// │  e substitua  foto: '/fotos/BeatrizRoisin.png'  por  foto: '/fotos/joao.png'
// │
// │  IDs DEVEM SER ÚNICOS — nunca repita o mesmo número!
// │  brilhante: true  → sócios (efeito dourado)
// │  especial:  true  → figurinhas especiais (famílias/eventos)
// │
// │  RARIDADE — campo peso:
// │    peso: 1  → raríssimo  (aparece muito pouco)
// │    peso: 3  → normal
// │    peso: 5  → comum      (aparece bastante)
// └──────────────────────────────────────────────────────────────
export const TODOS = [
  // ── SÓCIOS (PÁGINA 1) ──────────────────────────────────────
  { id: 1,  nome: 'Robson Rodrigues', cargo: 'CEO & Sócio',   setor: 'socios', brilhante: true,  foto: '/fotos/RobsonRodrigues.png', peso: 1 },
  { id: 3,  nome: 'Nat',              cargo: 'Sócio',         setor: 'socios', brilhante: true,  foto: '/cromos/nat-cromo.png',       peso: 1 },
  { id: 2,  nome: 'Henriquinho',      cargo: 'Sócio',         setor: 'socios', brilhante: true,  foto: '/fotos/henriquinho.png',      peso: 1 },

  // ── DESENVOLVIMENTO (PÁGINA 2) ─────────────────────────────
  { id: 8,  nome: 'Pierre',           cargo: 'Gestor',        setor: 'dev',    brilhante: false, foto: '/fotos/pierre.png',           peso: 5 },
  { id: 9,  nome: 'Raissa',           cargo: 'Gestora',       setor: 'dev',    brilhante: false, foto: '/fotos/raissa.png',           peso: 5 },
  { id: 10, nome: 'Tania',            cargo: 'Gestora',       setor: 'dev',    brilhante: false, foto: '/fotos/tania.png',            peso: 3 },
  { id: 4,  nome: 'Beatriz Roisin',   cargo: 'Dev',           setor: 'dev',    brilhante: false, foto: '/fotos/BeatrizRoisin.png',    peso: 3 },
  { id: 5,  nome: 'Hanna',            cargo: 'Dev',           setor: 'dev',    brilhante: false, foto: '/fotos/hanna.png',            peso: 3 },
  { id: 6,  nome: 'Pessato',          cargo: 'Dev',           setor: 'dev',    brilhante: false, foto: '/fotos/pessato.png',          peso: 3 },
  { id: 7,  nome: 'Felipe',           cargo: 'Dev',           setor: 'dev',    brilhante: false, foto: '/fotos/felipe.png',           peso: 3 },

  // ── UX & DESIGN (PÁGINA 3) ─────────────────────────────────
  { id: 13, nome: 'Kerollen Milena',  cargo: 'Designer',      setor: 'ux',     brilhante: false, foto: '/fotos/keka.png',             peso: 3 },
  { id: 11, nome: 'Helhi',            cargo: 'UX Lead',       setor: 'ux',     brilhante: false, foto: '/fotos/helhi.png',            peso: 5 },
  { id: 12, nome: 'Breno',            cargo: 'Designer',      setor: 'ux',     brilhante: false, foto: '/fotos/breno.png',            peso: 3 },
  { id: 14, nome: 'Matheus Venâncio', cargo: 'Designer',      setor: 'ux',     brilhante: false, foto: '/fotos/matheus.png',          peso: 3 },

  // ── CRM / CRO / MARKETING (PÁGINA 4) ───────────────────────
  { id: 52, nome: 'Alex',             cargo: 'Social Media',  setor: 'marketing', brilhante: false, foto: '/fotos/vick.png',          peso: 3 },
  { id: 15, nome: 'Danilo',           cargo: 'CRM Manager',   setor: 'crm',       brilhante: false, foto: '/fotos/danilo.png',        peso: 5 },
  { id: 16, nome: 'Ste',              cargo: 'CRO Lead',      setor: 'cro',       brilhante: false, foto: '/fotos/ste.png',           peso: 3 },
  { id: 17, nome: 'Tavares',          cargo: 'CRO Analyst',   setor: 'cro',       brilhante: false, foto: '/fotos/tavares.png',       peso: 3 },
  { id: 18, nome: 'Maria Clara',      cargo: 'Marketing Lead',setor: 'marketing', brilhante: false, foto: '/fotos/maria.png',         peso: 3 },
  { id: 19, nome: 'Gabriel',          cargo: 'Social Media',  setor: 'marketing', brilhante: false, foto: '/fotos/gabriel.png',       peso: 3 },
  { id: 20, nome: 'Isaias',           cargo: 'Social Media',  setor: 'marketing', brilhante: false, foto: '/fotos/isaias.png',        peso: 5 },
  { id: 21, nome: 'Alex',             cargo: 'Social Media',  setor: 'marketing', brilhante: false, foto: '/fotos/alex.png',          peso: 3 },

  // ── COMERCIAL & ATENDIMENTO (PÁGINA 5) ─────────────────────
  { id: 23, nome: 'Hellen',           cargo: 'Comercial Lead',setor: 'comercial', brilhante: false, foto: '/fotos/helen.png',         peso: 3 },
  { id: 24, nome: 'Vanessa',          cargo: 'SDR',           setor: 'comercial', brilhante: false, foto: '/fotos/van.png',           peso: 3 },
  { id: 25, nome: 'Mari',             cargo: 'Inside Sales',  setor: 'comercial', brilhante: false, foto: '/fotos/mari.png',          peso: 3 },

  // ── ESPECIAIS (PÁGINAS 6 · 7 · 8) ────────────────────────────
  // Página 6 (slots 1–9)
  { id: 26, nome: 'ALMAH',        cargo: 'A família do CEO',      setor: 'especial', brilhante: true, foto: '/cromos/especial-01.png',    especial: true, peso: 1 },
  { id: 27, nome: 'ALMAH',        cargo: 'Os bichinhos do time',  setor: 'especial', brilhante: true, foto: '/cromos/especial-2.png',     especial: true, peso: 1 },
  { id: 48, nome: 'ALMAH',        cargo: 'Os bichinhos do time',  setor: 'especial', brilhante: true, foto: '/cromos/especial-03.png',    especial: true, peso: 1 },
  { id: 49, nome: 'ALMAH',        cargo: 'Os bichinhos do time',  setor: 'especial', brilhante: true, foto: '/cromos/especial-04.png',    especial: true, peso: 1 },
  { id: 28, nome: 'ALMAH',        cargo: 'Team Building 2023',    setor: 'especial', brilhante: true, foto: '/cromos/vip-cromo.png',      especial: true, peso: 1 },
  { id: 29, nome: 'Especial 4',   cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/vanessa-cromo.png',  especial: true, peso: 1 },
  { id: 30, nome: 'Especial 5',   cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/tavares-cromo.png',  especial: true, peso: 1 },
  { id: 31, nome: 'Especial 6',   cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/ste-cromo.png',      especial: true, peso: 1 },
  { id: 32, nome: 'Especial 7',   cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/raissa-cromo.png',   especial: true, peso: 1 },
  { id: 33, nome: 'Especial 8',   cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/tania-cromo.png',    especial: true, peso: 1 },
  { id: 34, nome: 'Especial 9',   cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/pierre-cromo.png',   especial: true, peso: 1 },

  // Página 7 (slots 10–18)
  { id: 35, nome: 'Especial 10',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/pessato-cromo.png',  especial: true, peso: 1 },
  { id: 36, nome: 'Especial 11',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/matheus-cromo.png',  especial: true, peso: 1 },
  { id: 37, nome: 'Especial 12',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/mari-cromo.png',     especial: true, peso: 1 },
  { id: 38, nome: 'Especial 13',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/maria-cromo.png',    especial: true, peso: 1 },
  { id: 39, nome: 'Especial 14',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/keka-cromo.png',     especial: true, peso: 1 },
  { id: 40, nome: 'Especial 15',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/helhi-cromo.png',    especial: true, peso: 1 },
  { id: 41, nome: 'Especial 16',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/helen-cromo.png',    especial: true, peso: 1 },
  { id: 42, nome: 'Especial 17',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/hanna-cromo.png',    especial: true, peso: 1 },
  { id: 43, nome: 'Especial 18',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/gabriel-cromo.png',  especial: true, peso: 1 },

  // Página 8 (slots 19–24)
  { id: 44, nome: 'Especial 19',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/felipe-cromo.png',   especial: true, peso: 1 },
  { id: 45, nome: 'Especial 20',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/breno-cromo.png',    especial: true, peso: 1 },
  { id: 46, nome: 'Especial 21',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/danilo-cromo.png',   especial: true, peso: 1 },
  { id: 47, nome: 'Especial 22',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/bia-cromo.png',      especial: true, peso: 1 },
  { id: 50, nome: 'Especial 23',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/isaias-cromo.png',   especial: true, peso: 1 },
  { id: 51, nome: 'Especial 24',  cargo: '',                       setor: 'especial', brilhante: true, foto: '/cromos/alex-cromo.png',     especial: true, peso: 1 },
];

// ─── HELPERS ─────────────────────────────────────────────────
export const getSetor = (id) => SETORES.find((s) => s.id === id) ?? SETORES[0];

export function sortearPacote(cMap = {}) {
  const especiais  = TODOS.filter(e => e.especial);
  const brilhantes = TODOS.filter(e => e.brilhante && !e.especial);
  const comuns     = TODOS.filter(e => !e.brilhante && !e.especial);
  const fallback   = comuns.length > 0 ? comuns : brilhantes;

  const MAX_MESMA  = 1; // max da mesma figurinha no pacote
  const MAX_REPET  = 2; // max já possuídas no pacote

  const result = [];
  const contPacote = {};

  // Sorteio ponderado: peso alto = aparece mais; quem você já tem aparece menos
  function pickFrom(pool) {
    const repetNosPacote = result.filter(e => (cMap[e.id] ?? 0) > 0).length;

    let candidatos = pool.filter(c => {
      if ((contPacote[c.id] ?? 0) >= MAX_MESMA) return false;
      if ((cMap[c.id] ?? 0) > 0 && repetNosPacote >= MAX_REPET) return false;
      return true;
    });

    // Se não tem candidatos válidos, afrouxa restrição de repetição
    if (candidatos.length === 0) {
      candidatos = pool.filter(c => (contPacote[c.id] ?? 0) < MAX_MESMA);
    }
    if (candidatos.length === 0) return pool[0];

    // Peso = peso base ÷ (cópias já coletadas + 1) → quem você não tem aparece mais
    const pesos = candidatos.map(c => (c.peso ?? 1) / ((cMap[c.id] ?? 0) + 1));
    const total = pesos.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < candidatos.length; i++) {
      r -= pesos[i];
      if (r <= 0) return candidatos[i];
    }
    return candidatos[candidatos.length - 1];
  }

  for (let i = 0; i < STICKERS_PER_PACK; i++) {
    const r = Math.random();
    let picked;
    if (r < 0.08 && especiais.length)      picked = pickFrom(especiais);
    else if (r < 0.53 && brilhantes.length) picked = pickFrom(brilhantes);
    else                                     picked = pickFrom(fallback);

    if (!picked) continue;
    result.push(picked);
    contPacote[picked.id] = (contPacote[picked.id] ?? 0) + 1;
  }

  return result.filter(Boolean);
}

export function gerarCodigo() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
