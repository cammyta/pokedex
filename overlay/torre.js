/* Torre dos Líderes: 11 torres (uma por região + a do canal). Cada torre tem 8 líderes, 4 da Elite e o campeão.
   A pessoa digita !torre (ou clica no site): a party dela (parceiro + time salvo, até 6) sobe a torre lutando sozinha,
   um líder depois do outro, até perder ou vencer o campeão. Tem 3 chances por live (mais 3 com 30 bits). Vencer dá insígnia e XP
   para TODOS os Pokémon da party. Vencer a torre inteira dá a bolha e a borda da Torre de Alola.
   Este arquivo é usado pelo overlay (roda a batalha e guarda) e pelo site (mostra a batalha de novo, com as falas).
   Dados guardados no rancho: usum_rancho[login].tw = { d: dia, n: subidas no dia, p: próximo líder, pp: próximo no pesadelo,
     b: [insígnias], bp: [insígnias do pesadelo], v: vezes que venceu, vp: vezes no pesadelo, cmp: [Pokémon que venceram] }
   A última subida (para o site mostrar) fica em usum_torre_log[login]. */
(function () {
  const USUM = (window.USUM = window.USUM || {});

  /* ---------- as 11 torres (só Alola aberta; a do canal existe, mas está trancada) ---------- */
  const TORRES = [
    { id: "kanto", n: "Kanto" }, { id: "johto", n: "Johto" }, { id: "hoenn", n: "Hoenn" }, { id: "sinnoh", n: "Sinnoh" },
    { id: "unova", n: "Unova" }, { id: "kalos", n: "Kalos" },
    { id: "alola", n: "Alola", aberta: true, tema: "tropical" },
    { id: "galar", n: "Galar" }, { id: "paldea", n: "Paldea" }, { id: "misterio", n: "???" },
    { id: "canal", n: "Canal do Camaleão", trancada: true, tema: "cristal" } ];

  /* ---------- Torre de Alola ----------
     8 capitães (na ordem das provas, os mais fáceis), a Elite são os 4 Kahunas e o campeão é o Kukui.
     time: [número, golpe 1, golpe 2] · os 3 primeiros lutam no modo normal; no pesadelo (e na Elite e no campeão) são os 6.
     Quem tem forma de Alola (Raticate, Marowak, Golem...) aparece na forma de Alola. */
  const SD = "https://play.pokemonshowdown.com/sprites/trainers/";
  const ALOLA = [
    { id: "ilima", n: "Ilima", tit: "Capitão", tipo: "normal", lugar: "Caverna Verdante",
      ola: ["Que torre é essa no meio de Alola? Bom... já que estou aqui, vamos lutar!", "Sou o Ilima, capitão da primeira prova. Mostre o que o seu time sabe fazer!"],
      ultimo: "Hora de ficar sério. Este é o meu orgulho!",
      perde: ["Esplêndido! Você mereceu.", "Leve esta insígnia. Você vai longe nesta torre."],
      vence: ["Foi uma boa batalha, mas ainda falta treino.", "Volte quando seu time estiver mais forte!"],
      time: [[735, "Crunch", "Body Slam"], [235, "Hyper Voice", "Shadow Ball"], [775, "Body Slam", "Earthquake"], [20, "Crunch", "Sucker Punch"], [115, "Body Slam", "Crunch"], [474, "Hyper Voice", "Psychic"]] },
    { id: "lana", n: "Lana", tit: "Capitã", tipo: "water", lugar: "Lago Brooklet",
      ola: ["Ah... achei. Tava pescando aqui do lado e a linha puxou forte.", "Sou a Lana. Será que você é um peixe grande também?"],
      ultimo: "Agora vem o peixe grande de verdade.",
      perde: ["Escapou da minha linha... você é bom mesmo.", "Toma, a insígnia é sua."],
      vence: ["Fisgado!", "Volta depois, que a água vai estar te esperando."],
      time: [[752, "Liquidation", "Leech Life"], [746, "Surf", "Ice Beam"], [131, "Ice Beam", "Surf"], [91, "Icicle Crash", "Liquidation"], [768, "Liquidation", "First Impression"], [748, "Scald", "Poison Jab"]] },
    { id: "kiawe", n: "Kiawe", tit: "Capitão", tipo: "fire", lugar: "Wela Volcano",
      ola: ["O fogo desta torre chamou a minha dança.", "Sou o Kiawe! Sinta o calor da minha prova!"],
      ultimo: "Minha chama mais forte entra agora!",
      perde: ["Sua chama foi maior que a minha.", "Pegue a insígnia. Você mereceu!"],
      vence: ["As chamas não perdoam!", "Treine mais e volte para dançar comigo."],
      time: [[105, "Flare Blitz", "Shadow Ball"], [59, "Flare Blitz", "Crunch"], [758, "Flamethrower", "Sludge Bomb"], [776, "Flamethrower", "Dragon Pulse"], [663, "Brave Bird", "Flare Blitz"], [324, "Heat Wave", "Earth Power"]] },
    { id: "mallow", n: "Mallow", tit: "Capitã", tipo: "grass", lugar: "Lush Jungle",
      ola: ["Bem-vindo! Hoje o cardápio é batalha com tempero da floresta!", "Sou a Mallow. Espero que você aguente o sabor!"],
      ultimo: "E a sobremesa da casa!",
      perde: ["Que delícia de batalha!", "A insígnia é por conta da casa!"],
      vence: ["Ficou um pouco cru, né?", "Volta mais tarde que eu te sirvo outra rodada!"],
      time: [[754, "Leaf Blade", "X-Scissor"], [756, "Energy Ball", "Moonblast"], [763, "Trop Kick", "Play Rough"], [103, "Wood Hammer", "Dragon Pulse"], [709, "Wood Hammer", "Shadow Claw"], [465, "Power Whip", "Earthquake"]] },
    { id: "sophocles", n: "Sophocles", tit: "Capitão", tipo: "electric", lugar: "Observatório Hokulani",
      ola: ["Pelos meus cálculos, o dono desta torre faz live de Pokémon há mais de dez anos!", "Sou o Sophocles. Vamos ver se o seu time aguenta a corrente!"],
      ultimo: "Hora da minha melhor invenção!",
      perde: ["Isso não estava nos meus cálculos...", "Tá, tá. A insígnia é sua."],
      vence: ["Exatamente como eu calculei!", "Recalcula a estratégia e volta."],
      time: [[777, "Zing Zap", "Iron Head"], [738, "Thunderbolt", "Bug Buzz"], [26, "Thunderbolt", "Psychic"], [466, "Thunder Punch", "Cross Chop"], [171, "Thunderbolt", "Surf"], [135, "Thunderbolt", "Shadow Ball"]] },
    { id: "acerola", n: "Acerola", tit: "Capitã", tipo: "ghost", lugar: "Thrifty Megamart abandonado",
      ola: ["Ahaha! Os fantasminhas daqui me contaram que um Kecleon vive sumindo pela torre!", "Sou a Acerola. Vamos brincar de batalha?"],
      ultimo: "Agora vem o meu amigo mais assustador!",
      perde: ["Ahaha! Você é demais!", "Fica com a insígnia, e não conta pros fantasmas."],
      vence: ["Buuu! Te peguei!", "Volta quando perder o medo, tá?"],
      time: [[778, "Play Rough", "Shadow Claw"], [770, "Shadow Ball", "Earth Power"], [781, "Phantom Force", "Power Whip"], [478, "Shadow Ball", "Ice Beam"], [354, "Shadow Claw", "Sucker Punch"], [426, "Shadow Ball", "Air Slash"]] },
    { id: "mina", n: "Mina", tit: "Capitã", tipo: "fairy", lugar: "Seafolk Village",
      ola: ["Eu pintei um Kecleon na parede lá de baixo... e ele mudou de cor sozinho.", "Sou a Mina. Vamos colorir essa batalha?"],
      ultimo: "A minha obra-prima entra agora.",
      perde: ["Que cores bonitas a sua batalha teve.", "Pode levar a insígnia. Combina com você."],
      vence: ["Faltou cor nessa estratégia.", "Pinta de novo e volta."],
      time: [[743, "Pollen Puff", "Moonblast"], [210, "Play Rough", "Crunch"], [764, "Draining Kiss", "Energy Ball"], [40, "Dazzling Gleam", "Hyper Voice"], [700, "Moonblast", "Shadow Ball"], [468, "Dazzling Gleam", "Air Slash"]] },
    { id: "molayne", n: "Molayne", tit: "Capitão", tipo: "steel", lugar: "Observatório Hokulani",
      ola: ["O Sophocles é meu primo. Ele falou que você está indo bem.", "Sou o Molayne. Antes da Elite, a última prova de capitão é aço puro."],
      ultimo: "Meu Pokémon mais resistente agora.",
      perde: ["Muito bem. Os Kahunas estão te esperando lá em cima.", "Aqui está a última insígnia de capitão."],
      vence: ["O aço aguentou firme.", "Volte quando seu time estiver mais afiado."],
      time: [[51, "Iron Head", "Earthquake"], [625, "Iron Head", "Night Slash"], [376, "Meteor Mash", "Zen Headbutt"], [227, "Steel Wing", "Brave Bird"], [707, "Flash Cannon", "Dazzling Gleam"], [530, "Iron Head", "Drill Run"]] },
    // Elite: os 4 Kahunas
    { id: "hala", n: "Hala", tit: "Kahuna", tipo: "fighting", elite: true, lugar: "Melemele",
      ola: ["Ho ho! Um tal de Camaleão anda chamando treinadores fortes para esta torre.", "Sou o Hala, kahuna de Melemele. Mostre seu espírito!"],
      ultimo: "Meu último lutador. Tudo ou nada!",
      perde: ["Ho ho ho! Que força! Melemele tem orgulho de você.", "Siga em frente, os outros Kahunas te esperam."],
      vence: ["Ho! Ainda falta ganhar músculos!", "Treine e volte, jovem."],
      time: [[297, "Close Combat", "Knock Off"], [57, "Cross Chop", "Rock Slide"], [760, "Hammer Arm", "Double-Edge"], [62, "Waterfall", "Dynamic Punch"], [740, "Ice Hammer", "Close Combat"], [701, "High Jump Kick", "Brave Bird"]] },
    { id: "olivia", n: "Olivia", tit: "Kahuna", tipo: "rock", elite: true, lugar: "Akala",
      ola: ["Que torre linda. Daria uma ótima joalheria.", "Sou a Olivia, kahuna de Akala. Duro como pedra, brilhante como diamante!"],
      ultimo: "Minha pedra mais preciosa.",
      perde: ["Você brilhou mais que as minhas joias.", "Pode subir. Ainda tem gente te esperando."],
      vence: ["Sólida como uma rocha!", "Lapide esse time e volte."],
      time: [[745, "Accelerock", "Stone Edge"], [76, "Stone Edge", "Thunder Punch"], [703, "Power Gem", "Moonblast"], [476, "Power Gem", "Flash Cannon"], [369, "Head Smash", "Waterfall"], [526, "Stone Edge", "Earthquake"]] },
    { id: "nanu", n: "Nanu", tit: "Kahuna", tipo: "dark", elite: true, lugar: "Ula'ula",
      ola: ["Me arrastaram até aqui. Disseram que o dono disso faz live há mais de uma década.", "Sou o Nanu. Vamos acabar logo com isso."],
      ultimo: "Hmpf. Último.",
      perde: ["Tá, tá. Você é bom. Pode ir.", "Não espalha que eu perdi, hein."],
      vence: ["Hmpf. Previsível.", "Vai descansar e volta depois."],
      time: [[53, "Knock Off", "Play Rough"], [553, "Earthquake", "Crunch"], [302, "Shadow Claw", "Foul Play"], [89, "Knock Off", "Poison Jab"], [430, "Night Slash", "Brave Bird"], [359, "Night Slash", "Play Rough"]] },
    { id: "hapu", n: "Hapu", tit: "Kahuna", tipo: "ground", elite: true, lugar: "Poni",
      ola: ["Subi a pé com o Mudsdale. Esta torre não é páreo para a terra de Poni.", "Sou a Hapu, kahuna de Poni. Lute com os pés no chão!"],
      ultimo: "A terra treme agora!",
      perde: ["Você tem raízes fortes. Siga até o campeão.", "Poni reconhece sua força."],
      vence: ["Afundou na lama!", "Firma os pés e tenta de novo."],
      time: [[750, "High Horsepower", "Rock Slide"], [423, "Earth Power", "Scald"], [330, "Earthquake", "Dragon Claw"], [623, "Earthquake", "Shadow Punch"], [464, "Earthquake", "Stone Edge"], [445, "Earthquake", "Outrage"]] },
    // campeão
    { id: "kukui", n: "Kukui", tit: "Campeão", tipo: "normal", campeao: true, lugar: "Liga de Alola",
      ola: ["Woo! Fiquei sabendo que tem um campeão por aí que é streamer de Pokémon. Dizem que ele anda com um Kecleon!", "Mas hoje quem segura o título aqui sou eu. Prontos? Woo!"],
      ultimo: "Meu parceiro mais antigo. Vai com tudo!",
      perde: ["Woo! Que batalha! Você é o novo campeão desta torre!", "Agora vá lá conhecer esse tal streamer do Kecleon..."],
      vence: ["Woo! Quase, quase!", "Fortaleça os laços com seus Pokémon e volte!"],
      time: [[38, "Moonblast", "Ice Beam"], [628, "Brave Bird", "Close Combat"], [462, "Thunderbolt", "Flash Cannon"], [143, "Body Slam", "Earthquake"], [727, "Darkest Lariat", "Flare Blitz"], [745, "Stone Edge", "Accelerock"]] } ];
  ALOLA.forEach((t) => { t.sp = [SD + t.id + ".png", SD + t.id + "-gen7.png"]; });

  // a torre do canal (trancada por enquanto): o streamer é o campeão
  const CANAL = [{ id: "cammy", n: "Kami", tit: "Campeão do Canal", tipo: "normal", campeao: true, sp: ["assets/cammy.gif"],
    ola: ["Oi, chat! Chegaram até aqui, hein?", "Eu sou o Kami, o Camaleão. Mais de uma década de canal de Pokémon. Bora?"],
    ultimo: "Kecleon, é com você!", perde: ["Que batalha! Vocês são demais!"], vence: ["GG! Volta mais forte!"],
    time: [[352, "Shadow Sneak", "Sucker Punch"]] }];

  const LIDERES = { alola: ALOLA, canal: CANAL };
  const CFG = Object.assign({ bitsAuto: 20, bitsReset: 30, porDia: 3, xpCapitao: 1, xpKahuna: 1.6, xpCampeao: 3, xpPesadelo: 1.5, xpPerdeu: 5 }, (window.USUM_CONFIG || {}).torre || {});

  /* ---------- força dos líderes ----------
     capitães: nível 10 a 52 (do 1º ao 8º) com 3 Pokémon · Kahunas 58-67 e Kukui 72 com 6 · pesadelo: +20 níveis e 6 Pokémon para todos */
  const NV = [10, 16, 22, 28, 34, 40, 46, 52, 58, 61, 64, 67, 72];
  function qtdLider(i, pesadelo) { return pesadelo || i >= 8 ? 6 : 3; }
  function timeDoLider(torre, i, pesadelo) {
    const L = LIDERES[torre][i], q = Math.min(qtdLider(i, pesadelo), L.time.length), base = NV[Math.min(i, NV.length - 1)] + (pesadelo ? 20 : 0);
    const fz = pesadelo ? 100 : i >= 12 ? 90 : i >= 8 ? 80 : 35 + i * 5;
    const ev = pesadelo ? { hp: 85, at: 85, df: 85, sa: 85, sd: 85, ve: 85 } : i >= 8 ? { hp: 60, at: 60, df: 60, sa: 60, sd: 60, ve: 60 } : {};
    return L.time.slice(0, q).map(([num, m1, m2], k) => ({ num, s: false, lv: Math.min(100, base + (q === 6 ? k - 2 : k)), fz, ev, mv: [m1, m2], hi: "" }));
  }

  /* ---------- batalha ----------
     Cada lado tem uma fila de Pokémon. Por turno, o mais rápido ataca primeiro com o golpe que mais machuca o outro.
     Dano: nível, força (IVs), poder do golpe, STAB, tabela de tipos, diferença de nível, EVs e item. Desmaiou, entra o próximo. */
  const TAB = {
    normal: [[], ["rock", "steel"], ["ghost"]], fire: [["grass", "ice", "bug", "steel"], ["fire", "water", "rock", "dragon"], []],
    water: [["fire", "ground", "rock"], ["water", "grass", "dragon"], []], grass: [["water", "ground", "rock"], ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"], []],
    electric: [["water", "flying"], ["electric", "grass", "dragon"], ["ground"]], ice: [["grass", "ground", "flying", "dragon"], ["fire", "water", "ice", "steel"], []],
    fighting: [["normal", "ice", "rock", "dark", "steel"], ["poison", "flying", "psychic", "bug", "fairy"], ["ghost"]], poison: [["grass", "fairy"], ["poison", "ground", "rock", "ghost"], ["steel"]],
    ground: [["fire", "electric", "poison", "rock", "steel"], ["grass", "bug"], ["flying"]], flying: [["grass", "fighting", "bug"], ["electric", "rock", "steel"], []],
    psychic: [["fighting", "poison"], ["psychic", "steel"], ["dark"]], bug: [["grass", "psychic", "dark"], ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"], []],
    rock: [["fire", "ice", "flying", "bug"], ["fighting", "ground", "steel"], []], ghost: [["psychic", "ghost"], ["dark"], ["normal"]],
    dragon: [["dragon"], ["steel"], ["fairy"]], dark: [["psychic", "ghost"], ["fighting", "dark", "fairy"], []],
    steel: [["ice", "rock", "fairy"], ["fire", "water", "electric", "steel"], []], fairy: [["fighting", "dragon", "dark"], ["fire", "poison", "steel"], []] };
  function efetividade(golpe, defesa) {
    const t = TAB[golpe]; if (!t) return 1;
    return (defesa || []).reduce((m, d) => m * (t[0].includes(d) ? 2 : t[1].includes(d) ? 0.5 : t[2].includes(d) ? 0 : 1), 1);
  }
  let porNum = null;
  const T_ALOLA = { 19: ["dark", "normal"], 20: ["dark", "normal"], 26: ["electric", "psychic"], 27: ["ice", "steel"], 28: ["ice", "steel"], 37: ["ice"],
    38: ["ice", "fairy"], 50: ["ground", "steel"], 51: ["ground", "steel"], 52: ["dark"], 53: ["dark"], 74: ["rock", "electric"], 75: ["rock", "electric"],
    76: ["rock", "electric"], 88: ["poison", "dark"], 89: ["poison", "dark"], 103: ["grass", "dragon"], 105: ["fire", "ghost"] };
  function tiposDe(num) {
    if (T_ALOLA[num]) return T_ALOLA[num];   // estamos em Alola: quem tem forma de Alola é da forma de Alola
    if (!porNum) { porNum = {}; Object.entries(window.USUM_TIPOS || {}).forEach(([t, l]) => l.forEach((n) => (porNum[n] = porNum[n] || []).push(t))); }
    return porNum[num] || ["normal"];
  }
  const golpeInfo = (g) => (window.USUM_GOLPES || {})[g] || ["normal", 50];
  const ITEM_TIPO = () => (USUM.rancho && USUM.rancho.ITENS) || {};
  function preparar(p) {
    const ev = p.ev || {}, max = Math.round((60 + p.lv * 4 + p.fz * 0.6) * (1 + ((ev.hp || 0) / 252) * 0.4));
    return Object.assign({}, p, { tp: tiposDe(p.num), max, hp: max, mv: (p.mv || []).filter(Boolean).slice(0, 2) });
  }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // o melhor golpe contra esse alvo (2 = "Debater-se", quando nenhum dos dois funciona)
  function escolher(a, d) {
    let melhor = -1, val = 0;
    a.mv.forEach((g, i) => { const [t, pw] = golpeInfo(g), it = ITEM_TIPO()[a.hi]; const v = pw * (a.tp.includes(t) ? 1.5 : 1) * efetividade(t, d.tp) * (it && it.tp === t ? 1.2 : 1); if (v > val) { val = v; melhor = i; } });
    return melhor < 0 ? 2 : melhor;
  }
  function velocidade(p, r) { return p.lv + p.fz * 0.15 + (((p.ev || {}).ve || 0) / 252) * 15 + r() * 3; }
  function golpear(a, d, i, r) {
    const ev = a.ev || {}, evd = d.ev || {};
    const [t, pw] = i === 2 ? ["normal", 50] : golpeInfo(a.mv[i]);
    const eff = i === 2 ? 1 : efetividade(t, d.tp), stab = i !== 2 && a.tp.includes(t) ? 1.5 : 1;
    const it = ITEM_TIPO()[a.hi], item = i !== 2 && it && it.tp === t ? 1.2 : 1;
    const atk = (8 + a.lv * 1.4 + a.fz * 0.2) * (1 + (Math.max(ev.at || 0, ev.sa || 0) / 252) * 0.25);
    const difNv = Math.max(0.4, Math.min(1.6, 1 + (a.lv - d.lv) / 50)), defEV = 1 - (Math.max(evd.df || 0, evd.sd || 0) / 252) * 0.2;
    const crit = r() < 0.0625 + ((ev.ve || 0) / 252) * 0.08;
    let dano = atk * (pw / 70) * stab * eff * difNv * item * defEV * (crit ? 1.5 : 1) * (0.85 + r() * 0.15) * 0.65;
    dano = eff === 0 ? 0 : Math.max(1, Math.round(dano));
    return { dano, flags: (crit && dano ? 1 : 0) | (eff > 1 ? 2 : 0) | (eff > 0 && eff < 1 ? 4 : 0) | (eff === 0 ? 8 : 0) };
  }
  /* lutar(meuTime, timeDoLíder, semente) → { venceu, e: [[lado, quemAtaca, alvo, golpe, dano, flags]] }
     lado 0 = a pessoa ataca, 1 = o líder ataca · flags: 1 crítico, 2 super efetivo, 4 pouco efetivo, 8 não afeta, 16 desmaiou */
  function lutar(A, B, semente) {
    const r = rng(semente || 1), a = A.map(preparar), b = B.map(preparar), e = [];
    let ia = 0, ib = 0, voltas = 0;
    while (ia < a.length && ib < b.length && voltas++ < 300) {
      const pa = a[ia], pb = b[ib], primeiro = velocidade(pa, r) >= velocidade(pb, r) ? 0 : 1;
      for (const lado of [primeiro, 1 - primeiro]) {
        const at = lado === 0 ? pa : pb, df = lado === 0 ? pb : pa;
        if (at.hp <= 0 || df.hp <= 0) continue;
        const g = escolher(at, df), x = golpear(at, df, g, r);
        df.hp = Math.max(0, df.hp - x.dano);
        e.push([lado, lado === 0 ? ia : ib, lado === 0 ? ib : ia, g, x.dano, x.flags | (df.hp <= 0 ? 16 : 0)]);
      }
      if (pa.hp <= 0) ia++;
      if (pb.hp <= 0) ib++;
    }
    return { venceu: ib >= b.length && ia < a.length, e, a, b };
  }

  /* ---------- batalha na mão (turno a turno) ----------
     O site joga e o overlay refaz a mesma luta (mesma semente + mesmas escolhas) para conferir antes de dar a insígnia.
     Escolhas (uma letra por ação): "1"/"2" = golpe 1 ou 2 · "a".."f" = trocar para o Pokémon 1..6 da party */
  function novaLuta(A, B, semente) { return { r: rng(semente || 1), a: A.map(preparar), b: B.map(preparar), ia: 0, ib: 0, acoes: "", fim: 0, voltas: 0, troca: false }; }
  const vivo = (l, i) => l[i] && l[i].hp > 0;
  // aplica uma escolha; devolve os acontecimentos: ["g", lado, quem, alvo, golpe, dano, flags] · ["t", lado, de, para] · ["e", lado, slot] (entrou depois de desmaio)
  function jogar(st, acao) {
    const ev = []; if (st.fim) return ev;
    let c = String(acao || "1")[0];
    const slot = "abcdef".indexOf(c);
    if (st.troca) {   // o Pokémon da pessoa desmaiou: escolhe quem entra (não gasta turno)
      const ok = slot >= 0 && vivo(st.a, slot) ? slot : st.a.findIndex((x) => x.hp > 0);
      st.acoes += "abcdef"[ok]; st.ia = ok; st.troca = false; ev.push(["e", 0, ok]); return ev;
    }
    if (slot >= 0 && (!vivo(st.a, slot) || slot === st.ia)) c = "1";
    st.acoes += c; st.voltas++;
    const golpe = (lado, g) => {
      const at = lado === 0 ? st.a[st.ia] : st.b[st.ib], df = lado === 0 ? st.b[st.ib] : st.a[st.ia];
      if (at.hp <= 0 || df.hp <= 0) return;
      const x = golpear(at, df, g, st.r); df.hp = Math.max(0, df.hp - x.dano);
      ev.push(["g", lado, lado === 0 ? st.ia : st.ib, lado === 0 ? st.ib : st.ia, g, x.dano, x.flags | (df.hp <= 0 ? 16 : 0), df.hp]);
    };
    if ("abcdef".includes(c)) {   // trocar gasta o turno: o líder ataca quem entrou
      ev.push(["t", 0, st.ia, slot]); st.ia = slot;
      golpe(1, escolher(st.b[st.ib], st.a[st.ia]));
    } else {
      const pa = st.a[st.ia], pb = st.b[st.ib], g = Math.min(+c - 1, Math.max(0, pa.mv.length - 1));
      const primeiro = velocidade(pa, st.r) >= velocidade(pb, st.r) ? 0 : 1;
      for (const lado of [primeiro, 1 - primeiro]) golpe(lado, lado === 0 ? g : escolher(pb, pa));
    }
    if (st.b[st.ib].hp <= 0) { st.ib++; if (st.ib >= st.b.length) st.fim = 1; else ev.push(["e", 1, st.ib]); }
    if (!st.fim && st.a[st.ia].hp <= 0) { if (st.a.some((x) => x.hp > 0)) st.troca = true; else st.fim = 2; }
    if (!st.fim && st.voltas >= 200) st.fim = 2;
    return ev;
  }
  function refazer(A, B, semente, acoes) { const st = novaLuta(A, B, semente); for (const c of String(acoes || "")) { if (st.fim) break; jogar(st, c); } return st; }

  /* ---------- tudo daqui para baixo só roda no overlay ---------- */
  const site = /github\.io$/.test(location.hostname) || /pokedex-site/.test(location.href);
  const ler = (k, p) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? p : v; } catch (e) { return p; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hoje = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const S = () => USUM.selvagens;
  function estado(login) { return ((ler("usum_rancho", {})[login] || {}).tw) || {}; }
  function mudar(login, nome, fn) {
    const todos = ler("usum_rancho", {}), r = todos[login] || (todos[login] = {});
    r.it = r.it || {}; if (nome) r.nm = nome; r.tw = r.tw || {}; fn(r.tw); gravar("usum_rancho", todos);
  }
  function feed(html, login, img) { if (USUM.publicarFeed) USUM.publicarFeed({ tipo: "rancho", img: img || "rancho:torre-alola", html, login }); }

  // a party: o parceiro + o time salvo (!meutime / ⭐ Time do site), até 6, só os que estão na caixa
  function party(login) {
    const pc = ler("usum_parceiros", {})[login], pf = ler("usum_perfil", {})[login] || {}, salvo = ((pf.times || {}).live || pf.time || []);
    const cx = ((ler("usum_caixa", {})[login] || {}).p) || {}, l = [], viu = new Set();
    [pc && pc.num ? [pc.num, pc.shiny ? 1 : 0] : null].concat(salvo).forEach((x) => {
      if (!x || !x[0] || !cx[x[0]] || l.length >= 6) return; const k = x[0] + ":" + (x[1] ? 1 : 0); if (viu.has(k)) return; viu.add(k); l.push([+x[0], !!x[1]]); });
    return l;
  }
  function lutadorDe(login, num, sh) {
    const SV = S(), lista = SV.individuos(login, num), ind = lista.find((x) => !!x.s === !!sh) || lista[0]; if (!ind) return null;
    const m1 = SV.golpeDe(ind, num) || "Tackle", m2 = ind.m2 && (window.USUM_GOLPES || {})[ind.m2] ? ind.m2 : "";
    return { num, s: !!ind.s, lv: SV.nivelDe(ind, num), fz: SV.forcaIV(ind.iv), ev: ind.ev || {}, mv: [m1, m2], hi: ind.hi || "", a: ind.a || "" };
  }
  // XP da vitória (no nível de cada Pokémon da party)
  const xpDaVitoria = (i, pesadelo, lv, torre) => {
    return Math.round((S().custoNivel(lv) * (i >= 12 ? CFG.xpCampeao : i >= 8 ? CFG.xpKahuna : CFG.xpCapitao) + 10) * (pesadelo ? CFG.xpPesadelo : 1));
  };

  /* sobe a torre: luta do próximo líder até perder (ou vencer o campeão) */
  function subir(login, nome, torre, pesadelo, dono) {
    const T = TORRES.find((x) => x.id === torre), L = LIDERES[torre];
    if (!T || !T.aberta || !L) return { erro: T && T.trancada ? "trancada" : "fechada", T };
    const st = estado(login);
    if (pesadelo && !(st.v > 0)) return { erro: "pesadelo" };
    const usadas = st.d === hoje() ? st.n || 0 : 0;
    if (usadas >= CFG.porDia && !dono) return { erro: "hoje" };
    const time = party(login).map(([n, sh]) => lutadorDe(login, n, sh)).filter(Boolean);
    if (!time.length) return { erro: "party" };
    const chave = pesadelo ? "pp" : "p";
    let i = st[chave] || 0; if (i >= L.length) i = 0;   // venceu tudo: começa uma volta nova
    const ini = i, lutas = [], ganhou = new Set(st[pesadelo ? "bp" : "b"] || []);
    let semente = (Date.now() ^ [...login].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) >>> 0;
    const xpTot = {};   // XP que cada Pokémon da party ganhou
    for (; i < L.length; i++) {
      const lid = timeDoLider(torre, i, pesadelo), meus = time.slice(0, lid.length);
      const res = lutar(meus, lid, semente = (semente * 1103515245 + 12345) >>> 0);
      lutas.push({ i, v: res.venceu ? 1 : 0, s: semente, p: res.a.map((x) => [x.num, x.s ? 1 : 0, x.lv, x.max, x.mv[0] || "", x.mv[1] || "", x.a || ""]), o: res.b.map((x) => [x.num, 0, x.lv, x.max, x.mv[0], x.mv[1]]), e: res.e });
      // XP para TODOS os Pokémon da party (no nível de cada um)
      time.forEach((x) => { const lv = (S().individuos(login, x.num).find((y) => !!y.s === x.s) || {}).lv || x.lv;
        const ganho = res.venceu ? xpDaVitoria(i, pesadelo, lv, torre) : CFG.xpPerdeu; const k = x.num + (x.s ? "s" : "");
        const r = S().ganharXP(login, x.num, x.s, ganho); if (r) { xpTot[k] = xpTot[k] || { num: x.num, s: x.s, xp: 0, antes: r.antes, lv: r.lv }; xpTot[k].xp += ganho; xpTot[k].lv = r.lv; } });
      if (!res.venceu) break;
      ganhou.add(i);
    }
    const venceuTudo = i >= L.length, cmpAntes = new Set(st.cmp || []), bordaNova = venceuTudo ? time.filter((x) => !cmpAntes.has(x.num)) : [];
    mudar(login, nome, (tw) => {
      if (tw.d !== hoje()) { tw.d = hoje(); tw.n = 0; }
      tw.n = (tw.n || 0) + 1; tw[chave] = venceuTudo ? L.length : i;
      tw[pesadelo ? "bp" : "b"] = [...ganhou].sort((a, b) => a - b);
      if (venceuTudo) { tw[pesadelo ? "vp" : "v"] = (tw[pesadelo ? "vp" : "v"] || 0) + 1; tw.cmp = [...new Set((tw.cmp || []).concat(time.map((x) => x.num)))].slice(-30); }
    });
    const log = { t: Math.round(Date.now() / 1000), tw: torre, pz: pesadelo ? 1 : 0, ini, fim: venceuTudo ? 1 : 0, l: lutas, xp: Object.values(xpTot).map((x) => [x.num, x.s ? 1 : 0, x.xp, x.antes, x.lv]) };
    const logs = ler("usum_torre_log", {}); logs[login] = log; gravar("usum_torre_log", logs);
    return { log, venceuTudo, bordaNova, ini, fim: i, time, novasInsignias: lutas.filter((x) => x.v).length };
  }

  const CMD = /^!(torre|insignias|insígnias)\b/;
  const nomeTorre = (id) => (TORRES.find((x) => x.id === id) || {}).n || id;
  function comando(m) {
    const txt = String(m.texto || "").trim(), low = txt.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), mt = low.match(/^!(torre|insignias)\b\s*(.*)$/);
    if (!mt) return;
    const L = m.login, N = m.nome || L, arg = mt[2] || "";
    const url = USUM.pokedexUrl ? ` · veja a batalha em <b>${esc(USUM.pokedexUrl.replace(/^https?:\/\//, "").replace(/\/?$/, "/"))}?p=torre&u=${esc(L)}</b>` : "";
    if (mt[1] === "insignias" || /^(info|status|insignias)$/.test(arg)) {
      const st = estado(L), b = st.b || [], usadas = st.d === hoje() ? st.n || 0 : 0;
      return feed(`🗼 <b>${esc(N)}</b>: ${b.length}/${ALOLA.length} insígnias da Torre de Alola${st.v ? ` · venceu a torre ${st.v}x` : ""}${(st.bp || []).length ? ` · pesadelo ${(st.bp || []).length}/${ALOLA.length}` : ""} · chances nesta live: ${Math.max(0, CFG.porDia - usadas)}/${CFG.porDia}${url}`, L);
    }
    // 30 bits com !torre reset (ou !torre com 30 a 99 bits): a pessoa ganha as 3 chances de novo
    const bits = m.bits || 0;
    if (!m.dono && bits >= CFG.bitsReset && /^(reset|resetar|zerar|chances?|recarregar)\b/.test(arg)) {
      mudar(L, N, (tw) => { tw.d = hoje(); tw.n = 0; tw.run = 0; });
      feed(`💎 <b>${esc(N)}</b> mandou ${bits} bits e ganhou mais <b>${CFG.porDia} chances</b> na Torre de Alola!`, L, "rancho:torre-alola");
      clearTimeout(comando._pub); comando._pub = setTimeout(() => { try { USUM.backup && USUM.backup.enviarPublico && USUM.backup.enviarPublico(); } catch (e) {} }, 1500);
      return;
    }
    // o site começou uma subida (gasta 1 chance) ou a pessoa parou
    if (/^comecar\b/.test(arg)) {
      const st0 = estado(L), usadas0 = st0.d === hoje() ? st0.n || 0 : 0;
      if (usadas0 >= CFG.porDia && !m.dono) return feed(`🗼 <b>${esc(N)}</b>, suas ${CFG.porDia} chances desta live acabaram. Mande <b>!torre reset</b> com <b>${CFG.bitsReset} bits</b> para ganhar mais ${CFG.porDia}`, L);
      mudar(L, N, (tw) => { if (tw.d !== hoje()) { tw.d = hoje(); tw.n = 0; } tw.n = (tw.n || 0) + 1; tw.run = Date.now(); tw.rf = 1; });   // rf: a 1ª luta da subida já está paga
      return;
    }
    if (/^parar\b/.test(arg)) { mudar(L, N, (tw) => { tw.run = 0; }); return; }
    // !torre reset [nome]: só o streamer. Zera insígnias, subidas do dia e a última subida (para testar)
    if (/^(reset|resetar|zerar)\b/.test(arg)) {
      if (!m.dono) return feed(`💎 <b>${esc(N)}</b>, para ganhar mais ${CFG.porDia} chances na torre mande <b>!torre reset</b> junto com <b>${CFG.bitsReset} bits</b>`, L);
      const alvo = (arg.split(/\s+/)[1] || L).replace(/^@/, "").toLowerCase();
      const todos = ler("usum_rancho", {}); if (todos[alvo]) { delete todos[alvo].tw; gravar("usum_rancho", todos); }
      const logs = ler("usum_torre_log", {}); delete logs[alvo]; gravar("usum_torre_log", logs);
      feed(`🗼 A Torre de Alola de <b>${esc(alvo)}</b> foi zerada: 0 insígnias e subidas do dia liberadas`, L);
      clearTimeout(comando._pub); comando._pub = setTimeout(() => { try { USUM.backup && USUM.backup.enviarPublico && USUM.backup.enviarPublico(); } catch (e) {} }, 1500);
      return;
    }
    // resultado de uma luta jogada na mão no site: !torre luta <líder> <pesadelo 0/1> <semente> <25.33,448s.40,...> <escolhas>
    let mm = arg.match(/^luta (\d+) ([01]) (\d+) ([\w.,]+) ([1-2a-f]+)$/);
    if (mm) return resultadoMao(m, +mm[1], mm[2] === "1", +mm[3], mm[4], mm[5], url);
    if ((mm = arg.match(/^perdi (\d+) ([01])$/))) return perdeuMao(m, +mm[1], mm[2] === "1");
    const pesadelo = /pesadelo|nightmare|dificil|hard/.test(arg);
    // batalha automática: só com "!torre auto" junto com 20 bits (o streamer pode sem bits). "!torre" sozinho só explica
    const auto = /^auto(matica|matico)?\b/.test(arg);
    if (!auto) return feed(`🗼 <b>${esc(N)}</b>, a torre se joga no site, na página 🗼 Torre${url}. Lá tem os botões de <b>batalha automática</b> e de <b>mais chances</b>`, L);
    if (!m.dono && !((m.bits || 0) >= CFG.bitsAuto)) {
      return feed(`🗼 <b>${esc(N)}</b>, a torre agora é jogada <b>na mão</b>: escolha os golpes no site, na página 🗼 Torre${url}. A batalha automática custa <b>${CFG.bitsAuto} bits</b>: use o botão 🤖 na página da torre`, L);
    }
    const torre = /canal|camaleao|kami|cammy/.test(arg) ? "canal" : (TORRES.find((x) => arg.includes(x.id)) || { id: "alola" }).id;
    const r = subir(L, N, torre, pesadelo, true);   // automática (paga com bits ou do streamer): não conta no limite do dia
    if (r.erro === "trancada") return feed(`🔒 <b>${esc(N)}</b>, a <b>Torre do Canal</b> ainda está trancada. Dizem que o campeão de lá tem um Kecleon...`, L, "rancho:torre-canal");
    if (r.erro === "fechada") return feed(`🌫️ <b>${esc(N)}</b>, a Torre de ${esc(nomeTorre(torre))} ainda está coberta de névoa. Por enquanto, só a <b>Torre de Alola</b> está aberta (<b>!torre</b>)`, L);
    if (r.erro === "pesadelo") return feed(`😈 <b>${esc(N)}</b>, o <b>modo pesadelo</b> abre depois que você vencer a Torre de Alola inteira (<b>!torre</b>)`, L);
    if (r.erro === "hoje") return feed(`🗼 <b>${esc(N)}</b>, suas ${CFG.porDia} chances desta live acabaram. Mande <b>!torre reset</b> com <b>${CFG.bitsReset} bits</b> para ganhar mais ${CFG.porDia}`, L);
    if (r.erro === "party") return feed(`🗼 <b>${esc(N)}</b>, monte sua party primeiro: <b>!pokemon</b> e <b>!meutime</b> (ou o botão ⭐ Time no chat do site)`, L);
    const lid = ALOLA, nomes = r.log.l.filter((x) => x.v).map((x) => lid[x.i].n), perdeu = r.log.l.find((x) => !x.v);
    const pz = r.log.pz ? " no <b>modo pesadelo</b> 😈" : "";
    let html = `🗼 <b>${esc(N)}</b> subiu a <b>Torre de Alola</b>${pz}`;
    if (nomes.length > 4) html += ` e venceu <b>${nomes.length} líderes</b> (de ${esc(nomes[0])} a ${esc(nomes[nomes.length - 1])})`;
    else if (nomes.length) html += ` e venceu ${nomes.map((n) => "<b>" + esc(n) + "</b>").join(", ")}`;
    if (perdeu) html += `${nomes.length ? ", mas" : " e"} caiu para <b>${esc(lid[perdeu.i].tit)} ${esc(lid[perdeu.i].n)}</b>`;
    if (r.venceuTudo) html += `! 🏆 <b>Campeão da Torre de Alola!</b>`;
    html += ` · a party ganhou XP${url}`;
    feed(html, L, "rancho:torre-alola");
    if (r.venceuTudo && !r.log.pz && USUM.rancho && USUM.rancho.darBolha) setTimeout(() => { try { USUM.rancho.darBolha(L, N, "torre"); } catch (e) {} }, 1200);
    if (r.bordaNova.length && USUM.publicarFeed) setTimeout(() => USUM.publicarFeed({ tipo: "borda", login: L, nome: N, num: r.bordaNova[0].num, pnome: r.bordaNova.map((x) => USUM.nomeDe(x.num)).join(", "), borda: "torre", bordaNome: "Torre de Alola" }), 2600);
    clearTimeout(comando._pub); comando._pub = setTimeout(() => { try { USUM.backup && USUM.backup.enviarPublico && USUM.backup.enviarPublico(); } catch (e) {} }, 2500);
  }
  const FEM = new Set(["lana", "mallow", "acerola", "mina", "olivia", "hapu"]);
  /* resultado da luta na mão: o overlay refaz a luta com os Pokémon da caixa (nível no máximo o real) e confere */
  function resultadoMao(m, i, pesadelo, semente, ordem, acoes, url) {
    const L = m.login, N = m.nome || L, Lid = ALOLA[i]; if (!Lid) return;
    const st = estado(L), chave = pesadelo ? "pp" : "p", prox = (st[chave] || 0) >= ALOLA.length ? 0 : st[chave] || 0;
    if (!m.dono && !(st.run && Date.now() - st.run < 4 * 3600e3)) return feed(`🗼 <b>${esc(N)}</b>, não achei uma subida sua aberta na torre (a live estava ligada quando você começou?). A luta contra ${esc(Lid.n)} não valeu`, L);
    if (pesadelo && !(st.v > 0)) return;
    const revanche = i !== prox && (st[pesadelo ? "bp" : "b"] || []).includes(i);   // já venceu: pode lutar de novo (gasta 1 ida)
    if (revanche && !st.rf && !m.dono && (st.d === hoje() ? st.n || 0 : 0) >= CFG.porDia) return feed(`🗼 <b>${esc(N)}</b>, lutar de novo com ${esc(Lid.n)} gasta 1 chance, e as suas acabaram. <b>!torre reset</b> com <b>${CFG.bitsReset} bits</b> dá mais ${CFG.porDia}`, L);
    if (i !== prox && !revanche) return feed(`🗼 <b>${esc(N)}</b>, seu próximo desafio na torre é <b>${esc(ALOLA[prox].n)}</b>, não ${esc(Lid.n)}`, L);
    const meus = ordem.split(",").slice(0, 6).map((t) => { const mt = t.match(/^(\d+)(s?)\.(\d+)$/); if (!mt) return null;
      const x = lutadorDe(L, +mt[1], !!mt[2]); if (!x) return null; x.lv = Math.min(x.lv, +mt[3]); return x; }).filter(Boolean);
    const lid = timeDoLider("alola", i, pesadelo);
    if (!meus.length || meus.length > lid.length) return;
    const res = refazer(meus, lid, semente, acoes);
    if (res.fim !== 1) return feed(`🗼 <b>${esc(N)}</b>, não consegui confirmar a vitória contra ${esc(Lid.n)} com os seus Pokémon da live. Atualize o site e tente de novo`, L);
    // XP para toda a party
    party(L).forEach(([n, sh]) => { const ind = S().individuos(L, n).find((y) => !!y.s === sh); const lv = S().nivelDe(ind, n); S().ganharXP(L, n, sh, xpDaVitoria(i, pesadelo, lv, "alola")); });
    if (revanche) {
      gastarRevanche(L, N);
      feed(`⚔️ <b>${esc(N)}</b> venceu de novo ${FEM.has(Lid.id) ? "a" : "o"} <b>${esc(Lid.tit)} ${esc(Lid.n)}</b> na Torre de Alola (revanche) · a party ganhou XP`, L, "rancho:torre-alola");
      clearTimeout(comando._pub); comando._pub = setTimeout(() => { try { USUM.backup && USUM.backup.enviarPublico && USUM.backup.enviarPublico(); } catch (e) {} }, 2500);
      return;
    }
    const tudo = i >= ALOLA.length - 1, nums = meus.map((x) => x.num);
    let novos = [];
    mudar(L, N, (tw) => {
      if (tw.d !== hoje()) { tw.d = hoje(); tw.n = 0; }
      tw.rf = 0;
      const k = pesadelo ? "bp" : "b"; tw[k] = [...new Set((tw[k] || []).concat(i))].sort((a, b) => a - b);
      tw[chave] = i + 1;
      if (tudo) { tw[pesadelo ? "vp" : "v"] = (tw[pesadelo ? "vp" : "v"] || 0) + 1;
        const antes = new Set(tw.cmp || []); novos = party(L).map(([n]) => n).filter((n) => !antes.has(n)); tw.cmp = [...new Set((tw.cmp || []).concat(party(L).map(([n]) => n)))].slice(-30); }
    });
    const tot = (estado(L)[pesadelo ? "bp" : "b"] || []).length, pz = pesadelo ? " no <b>pesadelo</b> 😈" : "";
    if (!tudo) feed(`⚔️ <b>${esc(N)}</b> derrotou ${FEM.has(Lid.id) ? "a" : "o"} <b>${esc(Lid.tit)} ${esc(Lid.n)}</b> na Torre de Alola${pz}! ${tot}/${ALOLA.length} insígnias · a party ganhou XP`, L, "rancho:torre-alola");
    else {
      feed(`🏆 <b>${esc(N)}</b> derrotou o <b>Campeão Kukui</b> e venceu a <b>Torre de Alola</b>${pz}! 🌺${url}`, L, "rancho:torre-alola");
      if (!pesadelo && USUM.rancho && USUM.rancho.darBolha) setTimeout(() => { try { USUM.rancho.darBolha(L, N, "torre"); } catch (e) {} }, 1200);
      if (novos.length && USUM.publicarFeed) setTimeout(() => USUM.publicarFeed({ tipo: "borda", login: L, nome: N, num: novos[0], pnome: novos.map((n) => USUM.nomeDe(n)).join(", "), borda: "torre", bordaNome: "Torre de Alola" }), 2600);
    }
    clearTimeout(comando._pub); comando._pub = setTimeout(() => { try { USUM.backup && USUM.backup.enviarPublico && USUM.backup.enviarPublico(); } catch (e) {} }, 2500);
  }
  // revanche (líder que já venceu) gasta 1 chance, a não ser que seja a 1ª luta da subida (já paga no começo)
  function gastarRevanche(L, N) { mudar(L, N, (tw) => { if (tw.d !== hoje()) { tw.d = hoje(); tw.n = 0; } if (tw.rf) tw.rf = 0; else tw.n = (tw.n || 0) + 1; }); }
  function perdeuMao(m, i, pesadelo) {   // perder encerra a subida; o progresso fica
    const L = m.login, N = m.nome || L, Lid = ALOLA[i]; if (!Lid) return;
    const st = estado(L), k = pesadelo ? "pp" : "p", prox = (st[k] || 0) >= ALOLA.length ? 0 : st[k] || 0;
    if (i !== prox && (st[pesadelo ? "bp" : "b"] || []).includes(i)) gastarRevanche(L, N);
    mudar(L, N, (tw) => { tw.run = 0; tw.rf = 0; });   // perdeu: a subida acaba (a chance já foi gasta quando começou)
    clearTimeout(comando._pub); comando._pub = setTimeout(() => { try { USUM.backup && USUM.backup.enviarPublico && USUM.backup.enviarPublico(); } catch (e) {} }, 2500);
  }
  // roda numa tela só (a líder da torre; se ela estiver com o chat caído, outra assume)
  let lider = false;
  if (!site && USUM.aoMensagem && navigator.locks && navigator.locks.request) navigator.locks.request("usum_torre", () => { lider = true; return new Promise(() => {}); }).catch(() => {});
  else if (!(navigator.locks && navigator.locks.request)) lider = true;
  function umaVezT(m, fn) {
    const k = (m.id || m.login + ":" + m.texto) + "", feitos = () => ler("usum_torre_feitos", []);
    const anotar = () => { const v = feitos(); v.push(k); gravar("usum_torre_feitos", v.slice(-200)); };
    if (lider) { if (feitos().includes(k)) return; anotar(); fn(); return; }
    setTimeout(() => { if (feitos().includes(k)) return; anotar(); fn(); }, 1600 + Math.random() * 600);
  }
  // mensagem com bits: tira os cheermotes ("Cheer20 !torre auto" vira "!torre auto")
  const semCheer = (m) => (m.bits ? String(m.texto || "").replace(/(^|\s)[a-z]+\d+(?=\s|$)/gi, " ").replace(/\s+/g, " ").trim() : String(m.texto || "").trim());
  if (!site && USUM.aoMensagem) USUM.aoMensagem((m0) => {
    if (m0.tipo || !m0.texto) return;
    const m = Object.assign({}, m0, { texto: semCheer(m0) });
    if (!CMD.test(m.texto.toLowerCase())) return;
    umaVezT(m, () => { try { comando(m); } catch (e) { console.error("[torre]", e); } });
  });

  // a borda "Torre de Alola" fica nos Pokémon que estavam na party quando a pessoa venceu a torre
  const temBorda = (login, num) => (estado(login).cmp || []).includes(+num);
  USUM.torre = { TORRES, LIDERES, ALOLA, CFG, NV, qtdLider, timeDoLider, lutar, novaLuta, jogar, refazer, escolher, preparar, tiposDe, efetividade, golpeInfo, party, subir, comando, estado, temBorda,
    ehComando: (low) => CMD.test(low) };
})();
