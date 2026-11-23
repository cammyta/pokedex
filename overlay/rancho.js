/* Rancho Pokéfriends: itens que caem nas capturas, pedras de evolução, itens de forma,
   forja (Pokébolas), horta (Apricorns), pesca e a casinha com móveis.
   Tudo fica em usum_rancho = { login: { it: {item: qtd}, fj: [aço, fogo], hf: [água, grama],
     hz: [ {s: cor, t: plantou_ms} | 0, x3 ], vr: 0|1|2 (vara), mv: [móveis], pe: última pesca, nm: nome } }
   Comandos (chat): !itens · !usar <item> · !forja <pokémon aço> <pokémon fogo> · !forjar <bola> [vezes]
   !horta <pokémon água> <pokémon grama> · !plantar <cor> · !colher · !pescar · !fazer <móvel> · !rancho */
(function () {
  window.USUM = window.USUM || {};
  const S = () => USUM.selvagens;
  const CFG = Object.assign({ chanceDrop: 0.45, minutosEstagio: 15, pescaMinutos: 3, canteiros: 3, ovoMinutos: 20, chocarMinutos: 30, maxOvos: 6,
    bonusForca: 0.4, amizadeBorda: 60, pedreiraMinutos: 8, apiarioMinutos: 12, chanceHiperMel: 0.1 }, (window.USUM_CONFIG || {}).rancho);
  const ler = (k, p) => { try { return JSON.parse(localStorage.getItem(k) || "null") || p; } catch (e) { return p; } };
  const gravar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const SPR = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/";
  const PASTA = /github\.io$|^file:.*pokedex-site/.test(location.hostname || location.href) ? "assets/rancho/" : "pokedex-site/assets/rancho/";
  const LOCAIS = { essencia: "brilho.png", mel: "mel.png", "hiper-mel": "hiper-mel.png" };
  const urlItem = (id) => LOCAIS[id] ? PASTA + LOCAIS[id] : SPR + id + ".png";

  /* ---------- itens ---------- */
  // c: mat (material) · pedra · troca (item de evolução por troca) · forma (muda a forma) | p: peso no sorteio | t: tipos que deixam cair mais
  const ITENS = {
    // Essência: vem de capturar (1, shiny 3, lendário 5) e de soltar Pokémon (2 cada, shiny 5). Toda Pokébola forjada gasta essência.
    "essencia": { n: "Essência", c: "mat", p: 0, t: [] },
    // Mel: vem do apiário (Cutiefly, Ribombee, Combee, Vespiquen). !mel chama um selvagem; !hipermel tem 10% de última forma e 0,1% de lendário
    "mel": { n: "Mel", c: "mel", p: 0, t: [] },
    "hiper-mel": { n: "Hiper Mel", c: "mel", p: 0, t: [] },
    "red-apricorn": { n: "Apricorn Vermelho", c: "mat", p: 10, t: ["fire", "fighting"] },
    "blue-apricorn": { n: "Apricorn Azul", c: "mat", p: 10, t: ["water", "ice"] },
    "yellow-apricorn": { n: "Apricorn Amarelo", c: "mat", p: 10, t: ["electric", "ground"] },
    "green-apricorn": { n: "Apricorn Verde", c: "mat", p: 10, t: ["grass", "bug"] },
    "pink-apricorn": { n: "Apricorn Rosa", c: "mat", p: 10, t: ["fairy", "psychic"] },
    "white-apricorn": { n: "Apricorn Branco", c: "mat", p: 10, t: ["normal", "flying"] },
    "black-apricorn": { n: "Apricorn Preto", c: "mat", p: 10, t: ["dark", "ghost", "poison"] },
    "hard-stone": { n: "Minério", c: "mat", p: 12, t: ["rock", "steel", "ground"] },
    "stardust": { n: "Pó Estelar", c: "mat", p: 4, t: ["psychic", "fairy", "dragon"] },
    "star-piece": { n: "Pedaço de Estrela", c: "mat", p: 0.6, t: ["psychic", "fairy", "dragon"] },
    "fire-stone": { n: "Pedra do Fogo", c: "pedra", p: 2.2, t: ["fire"] },
    "water-stone": { n: "Pedra da Água", c: "pedra", p: 2.2, t: ["water"] },
    "thunder-stone": { n: "Pedra do Trovão", c: "pedra", p: 2.2, t: ["electric"] },
    "leaf-stone": { n: "Pedra da Folha", c: "pedra", p: 2.2, t: ["grass"] },
    "moon-stone": { n: "Pedra da Lua", c: "pedra", p: 2, t: ["fairy", "normal"] },
    "sun-stone": { n: "Pedra do Sol", c: "pedra", p: 2, t: ["grass", "fire"] },
    "shiny-stone": { n: "Pedra Brilhante", c: "pedra", p: 1.4, t: ["fairy"] },
    "dusk-stone": { n: "Pedra do Anoitecer", c: "pedra", p: 1.4, t: ["dark", "ghost"] },
    "dawn-stone": { n: "Pedra da Alvorada", c: "pedra", p: 1.4, t: ["psychic"] },
    "ice-stone": { n: "Pedra do Gelo", c: "pedra", p: 2, t: ["ice"] },
    "metal-coat": { n: "Revestimento Metálico", c: "troca", p: 0, t: ["steel"] },   // só sai da pedreira (mineração)
    "kings-rock": { n: "Pedra do Rei", c: "troca", p: 0.7, t: ["water"] },
    "dragon-scale": { n: "Escama de Dragão", c: "troca", p: 0.6, t: ["dragon"] },
    "up-grade": { n: "Up-Grade", c: "troca", p: 0.5, t: ["normal"] },
    "dubious-disc": { n: "Disco Duvidoso", c: "troca", p: 0.4, t: ["normal"] },
    "electirizer": { n: "Eletrizador", c: "troca", p: 0.6, t: ["electric"] },
    "magmarizer": { n: "Magmarizador", c: "troca", p: 0.6, t: ["fire"] },
    "protector": { n: "Protetor", c: "troca", p: 0.6, t: ["rock", "ground"] },
    "reaper-cloth": { n: "Manto Ceifador", c: "troca", p: 0.6, t: ["ghost"] },
    "prism-scale": { n: "Escama Prisma", c: "troca", p: 0.6, t: ["water"] },
    "deep-sea-tooth": { n: "Dente Abissal", c: "troca", p: 0.5, t: ["water"] },
    "deep-sea-scale": { n: "Escama Abissal", c: "troca", p: 0.5, t: ["water"] },
    "razor-claw": { n: "Garra Afiada", c: "troca", p: 0.6, t: ["dark", "ice"] },
    "razor-fang": { n: "Presa Afiada", c: "troca", p: 0.6, t: ["ground", "flying"] },
    "oval-stone": { n: "Pedra Oval", c: "troca", p: 0.7, t: ["normal"] },
    "sachet": { n: "Sachê", c: "troca", p: 0.5, t: ["fairy"] },
    "whipped-dream": { n: "Chantilly", c: "troca", p: 0.5, t: ["fairy"] },
    "linking-cord": { n: "Cordão de Troca", c: "troca", p: 1, t: ["fighting", "rock", "ghost", "psychic"] },
    "gracidea": { n: "Gracídea", c: "forma", p: 0.3, t: ["grass"], chave: 1 },
    "red-nectar": { n: "Néctar Vermelho", c: "forma", p: 0.4, t: ["fire"] },
    "yellow-nectar": { n: "Néctar Amarelo", c: "forma", p: 0.4, t: ["electric"] },
    "pink-nectar": { n: "Néctar Rosa", c: "forma", p: 0.4, t: ["psychic"] },
    "purple-nectar": { n: "Néctar Roxo", c: "forma", p: 0.4, t: ["ghost"] },
    "rotom-catalog": { n: "Catálogo Rotom", c: "forma", p: 0.3, t: ["electric", "ghost"], chave: 1 },
    "griseous-orb": { n: "Orbe Grisalho", c: "forma", p: 0.15, t: ["dragon", "ghost"], chave: 1 },
    "reveal-glass": { n: "Espelho da Verdade", c: "forma", p: 0.15, t: ["flying", "ground"], chave: 1 },
    "prison-bottle": { n: "Garrafa Prisão", c: "forma", p: 0.15, t: ["psychic"], chave: 1 }
  };
  const CORES = { vermelho: "red", azul: "blue", amarelo: "yellow", verde: "green", rosa: "pink", branco: "white", preto: "black",
    red: "red", blue: "blue", yellow: "yellow", green: "green", pink: "pink", white: "white", black: "black" };

  /* ---------- evoluções que precisam de item (alvo -> item) ---------- */
  const PEDE = {};
  const pede = (item, nums) => nums.forEach((n) => (PEDE[n] = item));
  pede("fire-stone", [59, 136]); pede("water-stone", [62, 91, 121, 134, 272]); pede("thunder-stone", [26, 135, 604]);
  pede("leaf-stone", [45, 71, 103, 275, 470]); pede("moon-stone", [31, 34, 36, 40, 301, 518]); pede("sun-stone", [182, 192, 547, 549]);
  pede("shiny-stone", [407, 468, 573, 671]); pede("dusk-stone", [429, 430, 609]); pede("dawn-stone", [475, 478]); pede("ice-stone", [471]);
  pede("metal-coat", [208, 212, 462]);   // Magnezone: Revestimento Metálico + 30 min de convívio pede("kings-rock", [186, 199]); pede("dragon-scale", [230]); pede("up-grade", [233]); pede("dubious-disc", [474]);
  pede("electirizer", [466]); pede("magmarizer", [467]); pede("protector", [464]); pede("reaper-cloth", [477]); pede("prism-scale", [350]);
  pede("deep-sea-tooth", [367]); pede("deep-sea-scale", [368]); pede("razor-claw", [461]); pede("razor-fang", [472]); pede("oval-stone", [113]);
  pede("sachet", [683]); pede("whipped-dream", [685]); pede("linking-cord", [65, 68, 76, 94, 526, 534, 589, 617, 709, 711]);
  function itemParaEvoluir(alvo) {
    const alola = USUM.formaRegional && USUM.formaRegional(alvo);
    if (alvo === 38) return alola ? "ice-stone" : "fire-stone";     // Ninetales de Alola: Pedra do Gelo
    if (alvo === 28) return alola ? "ice-stone" : "";               // Sandslash de Alola: Pedra do Gelo
    return PEDE[alvo] || "";
  }

  /* ---------- tipos (com as formas de Alola) ---------- */
  const T_ALOLA = { 19: ["dark", "normal"], 20: ["dark", "normal"], 26: ["electric", "psychic"], 27: ["ice", "steel"], 28: ["ice", "steel"], 37: ["ice"],
    38: ["ice", "fairy"], 50: ["ground", "steel"], 51: ["ground", "steel"], 52: ["dark"], 53: ["dark"], 74: ["rock", "electric"], 75: ["rock", "electric"],
    76: ["rock", "electric"], 88: ["poison", "dark"], 89: ["poison", "dark"], 103: ["grass", "dragon"], 105: ["fire", "ghost"] };
  let porNum = null;
  function tiposDe(num) {
    if (T_ALOLA[num] && USUM.formaRegional && USUM.formaRegional(num)) return T_ALOLA[num];
    if (!porNum) { porNum = {}; Object.entries(window.USUM_TIPOS || {}).forEach(([t, l]) => l.forEach((n) => (porNum[n] = porNum[n] || []).push(t))); }
    return porNum[num] || [];
  }
  const temTipo = (num, t) => [].concat(t).some((x) => tiposDe(num).includes(x));
  // forja: 1º ajudante de Aço, Terra ou Pedra + 2º de Fogo · horta: Água + Grama · pedreira: Pedra ou Terra
  const PARES = { forja: [["steel", "ground", "rock"], ["fire"]], horta: [["water"], ["grass"]] };
  const TIPOS_PEDREIRA = ["rock", "ground"];

  /* ---------- dados ---------- */
  function rancho(login) { return (ler("usum_rancho", {})[login]) || {}; }
  function mudarR(login, fn) {
    const todos = ler("usum_rancho", {}), r = todos[login] || (todos[login] = {});
    r.it = r.it || {}; const v = fn(r); gravar("usum_rancho", todos); return v;
  }
  const qtd = (login, id) => ((rancho(login).it || {})[id]) || 0;
  function dar(login, id, n) { return mudarR(login, (r) => { r.it[id] = Math.max(0, (r.it[id] || 0) + n); if (!r.it[id]) delete r.it[id]; return r.it[id] || 0; }); }
  const temTudo = (login, custo) => Object.entries(custo).every(([id, n]) => qtd(login, id) >= n);
  function gastar(login, custo) { mudarR(login, (r) => Object.entries(custo).forEach(([id, n]) => { r.it[id] = (r.it[id] || 0) - n; if (r.it[id] <= 0) delete r.it[id]; })); }
  const faltaDe = (login, custo) => Object.entries(custo).filter(([id, n]) => qtd(login, id) < n).map(([id, n]) => `${n - qtd(login, id)} ${ITENS[id] ? ITENS[id].n : id}`);

  /* ---------- sorteio de item na captura ---------- */
  function sortearItem(num) {
    const tps = tiposDe(num), lista = [];
    let total = 0;
    Object.entries(ITENS).forEach(([id, x]) => {
      if (!x.p) return;
      let w = x.p;
      if (x.t.some((t) => tps.includes(t))) w *= 4;
      // a própria espécie evolui com esse item (pegou um Eevee -> pedras do Eevee aparecem mais)
      if ((S().evolucoes(num) || []).some((f) => itemParaEvoluir(f) === id)) w *= 6;
      if (/nectar$/.test(id) && num === 741) w *= 25;
      if (id === "gracidea" && num === 492) w *= 40;
      if (id === "rotom-catalog" && num === 479) w *= 40;
      if (id === "griseous-orb" && num === 487) w *= 40;
      if (id === "reveal-glass" && [641, 642, 645].includes(num)) w *= 40;
      if (id === "prison-bottle" && num === 720) w *= 40;
      lista.push([id, w]); total += w;
    });
    let r = Math.random() * total;
    for (const [id, w] of lista) { if ((r -= w) <= 0) return id; }
    return "hard-stone";
  }
  // chamado pelo encontro.html quando alguém captura (uma tela só)
  function aoCapturar(pegaram, p) {
    const ganhos = [];
    const ess = p.lendario ? 5 : p.shiny ? 3 : 1;
    pegaram.forEach((u) => mudarR(u.login, (r) => { r.nm = u.nome; r.it.essencia = (r.it.essencia || 0) + ess; }));
    pegaram.forEach((u) => {
      const garantido = p.lendario || p.shiny;
      const rolagens = garantido ? 2 : Math.random() < CFG.chanceDrop ? 1 : 0;
      for (let i = 0; i < rolagens; i++) {
        const id = sortearItem(p.num), n = ITENS[id].c === "mat" && id !== "star-piece" ? 1 + (Math.random() < 0.35 ? 1 : 0) : 1;
        mudarR(u.login, (r) => { r.nm = u.nome; r.it[id] = (r.it[id] || 0) + n; });
        ganhos.push({ login: u.login, nome: u.nome, id, n });
      }
    });
    ganhos.forEach((g, i) => setTimeout(() => publicar(g.id, `🎒 <b>${esc(g.nome)}</b> achou ${g.n > 1 ? g.n + "× " : ""}<b>${esc(ITENS[g.id].n)}</b> perto do ${esc(p.nome)}!` + dica(g.id), g.login), 1400 + i * 900));
    return ganhos;
  }
  function dica(id) {
    const c = ITENS[id].c;
    if (c === "pedra" || c === "troca") return ` <small>é usada sozinha quando seu parceiro evoluir com ela</small>`;
    if (c === "forma") return ` <small>muda a forma: <b>!usar ${esc(apelidoItem(id))}</b></small>`;
    return "";
  }
  const apelidoItem = (id) => ITENS[id].n.toLowerCase().replace(/^(pedra d[oa]s? |pedra )/, "pedra ");

  /* ---------- nomes digitados -> item ---------- */
  const limpa = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  function acharItem(txt, filtro) {
    const q = limpa(txt).replace(/\b(pedra|stone|da|do|de|das|dos|o|a)\b/g, " ").replace(/\s+/g, " ").trim();
    if (!q) return null;
    const ids = Object.keys(ITENS).filter((id) => !filtro || filtro(id));
    const nomes = (id) => [limpa(ITENS[id].n).replace(/\b(pedra|da|do|de)\b/g, " ").replace(/\s+/g, " ").trim(), id.replace(/-/g, " "), id.replace(/-(stone|apricorn)$/, "").replace(/-/g, " ")];
    return ids.find((id) => nomes(id).some((n) => n === q)) || ids.find((id) => nomes(id).some((n) => n.startsWith(q) || q.startsWith(n))) ||
      ids.find((id) => nomes(id).some((n) => n.includes(q)));
  }

  /* ---------- formas por item ---------- */
  const FORMA_ITEM = {
    "red-nectar": [741, 0], "yellow-nectar": [741, 1], "pink-nectar": [741, 2], "purple-nectar": [741, 3],
    "gracidea": [492, "troca"], "griseous-orb": [487, "troca"], "reveal-glass": [[641, 642, 645], "troca"], "prison-bottle": [720, "troca"],
    "rotom-catalog": [479, "rotom"]
  };
  const ROTOM = { normal: 0, calor: 1, heat: 1, forno: 1, lavar: 2, wash: 2, maquina: 2, gelo: 3, frost: 3, geladeira: 3, ventilador: 4, fan: 4, cortador: 5, mow: 5, grama: 5 };
  function trocarForma(login, parc, nova) {
    const fz = nova ? String(nova).padStart(4, "0") : "";
    const pa = ler("usum_parceiros", {}); if (pa[login]) { pa[login].forma = fz; gravar("usum_parceiros", pa); }
    const cx = ler("usum_caixa", {}), e = cx[login] && cx[login].p && cx[login].p[parc.num];
    if (e && e.l) { const ind = e.l.find((x) => !!x.s === !!parc.shiny) || e.l[0]; if (ind) { if (fz) ind.f = fz; else delete ind.f; gravar("usum_caixa", cx); } }
  }

  /* ---------- evolução (recompensa "Evoluir meu Pokémon" ou !usar <item>) ---------- */
  function evoluir(opc) {
    const SV = S(), parc = ler("usum_parceiros", {})[opc.login];
    if (!parc) { publicarEv({ tipo: "naoevolui", nome: opc.nome, motivo: "semparceiro" }); return false; }
    const filhos = SV.evolucoes(parc.num);
    if (!filhos.length) { publicarEv({ tipo: "naoevolui", nome: opc.nome, motivo: "final", num: parc.num, pnome: USUM.nomeDe(parc.num) }); return false; }
    const txt = limpa(opc.texto).replace(/ /g, "");
    let alvo = filhos.find((f) => txt.includes(limpa(USUM.nomeDe(f)).replace(/ /g, "")));
    if (!alvo && opc.item) alvo = filhos.find((f) => itemParaEvoluir(f) === opc.item);
    if (!alvo) { const ok = filhos.filter((f) => !itemParaEvoluir(f) || qtd(opc.login, itemParaEvoluir(f)) > 0); alvo = (ok.length ? ok : filhos)[Math.floor(Math.random() * (ok.length || filhos.length))]; }
    const de = USUM.nomeDe(parc.num), para = USUM.nomeDe(alvo);
    const item = itemParaEvoluir(alvo);
    // confere tudo de uma vez e avisa o que falta: tempo de convívio, a pedra/item, ou os dois
    const precisa = SV.minutosParaEvoluir(alvo), tem = SV.minutosCom(opc.login, parc.num);
    const faltaItem = !!item && qtd(opc.login, item) < 1, faltaMin = Math.max(0, precisa - tem);
    if (faltaItem || faltaMin) { publicarEv({ tipo: "naoevolui", nome: opc.nome, motivo: "requisitos", de, pnome: para, precisa, falta: faltaMin, item: faltaItem ? ITENS[item].n : "" }); return false; }
    if (SV.cheio(opc.login, alvo)) { publicarEv({ tipo: "naoevolui", nome: opc.nome, motivo: "cheio", pnome: para, limite: SV.C.limitePorEspecie }); return false; }
    if (item) dar(opc.login, item, -1);
    const todos = ler("usum_parceiros", {});
    todos[opc.login] = { num: alvo, forma: (USUM.formaRegional ? USUM.formaRegional(alvo) : "") || (parc.forma && USUM.urlFormaHome && USUM.urlFormaHome(alvo, parc.forma, false) ? parc.forma : ""), shiny: !!parc.shiny };
    gravar("usum_parceiros", todos);
    // o próprio Pokémon evolui: o melhor da caixa (shiny ou não, igual ao parceiro) sai e volta como a evolução, com a mesma força, natureza e apelido
    const lista = SV.individuos(opc.login, parc.num), pos = lista.findIndex((x) => !!x.s === !!parc.shiny);
    const melhor = pos >= 0 ? lista[pos] : null;
    if (melhor) SV.tirarUm(opc.login, parc.num, !!parc.shiny, pos + 1);
    SV.guardar(opc.login, opc.nome, alvo, !!parc.shiny, melhor && melhor.iv, melhor && melhor.a, melhor ? melhor.n : undefined, melhor && melhor.f);
    publicarEv({ tipo: "evoluiu", login: opc.login, nome: opc.nome, de, para, num: alvo, shiny: !!parc.shiny, item: item ? ITENS[item].n : "" });
    return true;
  }

  /* ---------- ajudantes (forja: Aço + Fogo · horta: Água + Grama) ---------- */
  function donos(login) { const c = (S().caixa(login) || {}).p || {}; return Object.keys(c).map(Number).filter((n) => c[n] && c[n].q > 0); }
  function melhorDoTipo(login, tipo, menos) {
    const l = donos(login).filter((n) => temTipo(n, tipo) && n !== menos);
    const rk = (n) => ({ final: 2, meio: 1 }[S().estagio(n)] || 0);
    return l.sort((a, b) => rk(b) - rk(a) || a - b)[0] || 0;
  }
  // ajudantes que valem agora: os escolhidos (se ainda estão na caixa) ou os melhores que a pessoa tem
  function ajudantes(login, qual) {
    const r = rancho(login), par = PARES[qual], esc_ = (qual === "forja" ? r.fj : r.hf) || [];
    const tem = new Set(donos(login));
    const a = esc_[0] && tem.has(esc_[0]) && temTipo(esc_[0], par[0]) ? esc_[0] : melhorDoTipo(login, par[0]);
    const b = esc_[1] && tem.has(esc_[1]) && temTipo(esc_[1], par[1]) && esc_[1] !== a ? esc_[1] : melhorDoTipo(login, par[1], a);
    return [a, b];
  }
  // "magnemite litten", "81 725" ou "magnemite e litten" -> palavras que podem ser Pokémon
  const palavrasPoke = (t) => limpa(t).split(" ").filter((w) => /^\d{1,4}$/.test(w) || (w.length > 2 && !/^(shiny|com|para|pro)$/.test(w)));
  // força (0 a 1) do melhor daquela espécie na caixa
  function forcaDe(login, n) { const l = n ? S().individuos(login, n) : []; return l.length ? Math.max(...l.map((x) => S().forcaIV(x.iv))) / 100 : 0; }
  // quanto mais forte, mais rápido: com força 100% o tempo cai bonusForca (40%)
  const fatorTempo = (f) => 1 - CFG.bonusForca * Math.max(0, Math.min(1, f || 0));
  function escolherAjudantes(login, qual, texto) {
    const par = PARES[qual], tem = new Set(donos(login));
    const nums = palavrasPoke(texto).map((w) => (USUM.lerPokemon(w) || {}).num).filter((n) => n && tem.has(n));
    const a = nums.find((n) => temTipo(n, par[0])), b = nums.find((n) => temTipo(n, par[1]) && n !== a);
    mudarR(login, (r) => { const k = qual === "forja" ? "fj" : "hf", v = r[k] || [0, 0]; if (a) v[0] = a; if (b) v[1] = b; r[k] = v; });
    return [a, b];
  }

  /* ---------- forja: Pokébolas e varas ---------- */
  const RECEITAS = {
    great: { custo: { "essencia": 5, "blue-apricorn": 1, "hard-stone": 1 }, sai: 3 },
    ultra: { custo: { "essencia": 20, "yellow-apricorn": 1, "black-apricorn": 1, "hard-stone": 2 }, sai: 3 },
    quick: { custo: { "essencia": 20, "white-apricorn": 1, "yellow-apricorn": 1, "hard-stone": 1 }, sai: 2 },
    timer: { custo: { "essencia": 20, "white-apricorn": 1, "black-apricorn": 1, "hard-stone": 1 }, sai: 2 },
    repeat: { custo: { "essencia": 20, "red-apricorn": 1, "yellow-apricorn": 1, "hard-stone": 1 }, sai: 2 },
    nest: { custo: { "essencia": 20, "green-apricorn": 2, "hard-stone": 1 }, sai: 2 },
    net: { custo: { "essencia": 20, "blue-apricorn": 1, "green-apricorn": 1, "hard-stone": 1 }, sai: 2 },
    dive: { custo: { "essencia": 20, "blue-apricorn": 2, "hard-stone": 1 }, sai: 2 },
    dusk: { custo: { "essencia": 20, "black-apricorn": 1, "green-apricorn": 1, "hard-stone": 1 }, sai: 2 },
    dream: { custo: { "essencia": 20, "pink-apricorn": 2, "stardust": 1 }, sai: 2 },
    heal: { custo: { "essencia": 20, "pink-apricorn": 1, "white-apricorn": 1 }, sai: 2 },
    luxury: { custo: { "essencia": 30, "black-apricorn": 1, "star-piece": 1, "hard-stone": 1 }, sai: 2 },
    level: { custo: { "essencia": 50, "red-apricorn": 1 }, sai: 2 }, lure: { custo: { "essencia": 50, "blue-apricorn": 1 }, sai: 2 }, moon: { custo: { "essencia": 50, "yellow-apricorn": 1 }, sai: 2 },
    friend: { custo: { "essencia": 50, "green-apricorn": 1 }, sai: 2 }, love: { custo: { "essencia": 50, "pink-apricorn": 1 }, sai: 2 }, heavy: { custo: { "essencia": 50, "black-apricorn": 1 }, sai: 2 },
    fast: { custo: { "essencia": 50, "white-apricorn": 1 }, sai: 2 },
    "vara-boa": { custo: { "hard-stone": 4, "blue-apricorn": 2 }, vara: 1 },
    "vara-super": { custo: { "hard-stone": 8, "stardust": 3, "star-piece": 1 }, vara: 2 }
  };
  const JOHTO = ["level", "lure", "moon", "friend", "love", "heavy", "fast"];
  function forjar(login, nome, receita, vezes) {
    const [aco, fogo] = ajudantes(login, "forja");
    if (!aco || !fogo) return { erro: "ajudantes", aco, fogo };
    const R = RECEITAS[receita];
    if (R.vara != null) {
      const vr = rancho(login).vr || 0;
      if (vr >= R.vara) return { erro: "jatem" };
      if (R.vara === 2 && vr < 1) return { erro: "precisaboa" };
      vezes = 1;
    }
    let feitas = 0;
    while (feitas < vezes && temTudo(login, R.custo)) { gastar(login, R.custo); feitas++; }
    if (!feitas) return { erro: "falta", falta: faltaDe(login, R.custo) };
    mudarR(login, (r) => { r.nm = nome; });
    if (R.vara != null) { mudarR(login, (r) => (r.vr = R.vara)); return { ok: 1, aco, fogo, vara: R.vara }; }
    // ajudantes fortes às vezes fazem uma bola a mais (força média 100% = 50% de chance por fornada)
    const media = (forcaDe(login, aco) + forcaDe(login, fogo)) / 2;
    let bonus = 0; for (let i = 0; i < feitas; i++) if (Math.random() < media * 0.5) bonus++;
    const n = feitas * R.sai + bonus;
    S().darBola(login, receita, n);
    return { ok: 1, aco, fogo, bola: receita, n, feitas, bonus };
  }

  /* ---------- horta: planta Apricorn, colhe mais Apricorn ---------- */
  const ESTAGIOS = ["planta-broto", "planta-folhas", "planta-flor", "planta-frutos"];
  const minEstagio = (c) => (c && c.d) || CFG.minutosEstagio;
  function estagioDe(c, agora) { if (!c) return -1; return Math.min(3, Math.floor(((agora || Date.now()) - c.t) / (minEstagio(c) * 60e3))); }
  function plantar(login, nome, cor) {
    const [agua, grama] = ajudantes(login, "horta");
    if (!agua || !grama) return { erro: "ajudantes", agua, grama };
    const id = cor + "-apricorn";
    if (qtd(login, id) < 1) return { erro: "semsemente", id };
    const hz = (rancho(login).hz || []).slice(0, CFG.canteiros);
    while (hz.length < CFG.canteiros) hz.push(0);
    const i = hz.findIndex((x) => !x);
    if (i < 0) return { erro: "cheia" };
    dar(login, id, -1);
    const d = Math.round(CFG.minutosEstagio * fatorTempo((forcaDe(login, agua) + forcaDe(login, grama)) / 2) * 10) / 10;
    mudarR(login, (r) => { r.nm = nome; r.hz = hz; r.hz[i] = { s: cor, t: Date.now(), d }; });
    return { ok: 1, agua, grama, i, id, total: Math.round(d * 3) };
  }
  function colher(login) {
    const hz = rancho(login).hz || [], ganhos = {};
    let prontos = 0;
    const novo = hz.map((c) => {
      if (!c || estagioDe(c) < 3) return c;
      prontos++;
      const id = c.s + "-apricorn"; ganhos[id] = (ganhos[id] || 0) + 2 + (Math.random() < 0.5 ? 1 : 0);
      if (Math.random() < 0.15) ganhos.stardust = (ganhos.stardust || 0) + 1;
      return 0;
    });
    if (!prontos) return { erro: "nada", prox: hz.filter(Boolean).map((c) => Math.max(0, Math.ceil((c.t + 3 * minEstagio(c) * 60e3 - Date.now()) / 60e3))).sort((a, b) => a - b)[0] };
    mudarR(login, (r) => { r.hz = novo; Object.entries(ganhos).forEach(([id, n]) => (r.it[id] = (r.it[id] || 0) + n)); });
    return { ok: 1, ganhos, prontos };
  }


  /* ---------- o Pokémon de Grama planta sozinho nos canteiros vazios (de graça), a cor depende dele:
     o outro tipo dele decide (Grama/Fogo = vermelho, Grama/Fada = rosa, Grama/Veneno = preto…); só Grama = verde. Às vezes vem uma cor surpresa ---------- */
  const COR_TIPO = { fire: "red", fighting: "red", water: "blue", ice: "blue", electric: "yellow", ground: "yellow", rock: "yellow", steel: "white",
    bug: "green", grass: "green", fairy: "pink", psychic: "pink", normal: "white", flying: "white", dark: "black", ghost: "black", poison: "black", dragon: "blue" };
  function corDoPlantador(n) {
    const outros = tiposDe(n).filter((t) => t !== "grass");
    if (Math.random() < 0.3) return ["red", "blue", "yellow", "green", "pink", "white", "black"][Math.floor(Math.random() * 7)];
    return COR_TIPO[outros[0]] || "green";
  }
  function rodadaHorta() {
    const todos = ler("usum_rancho", {}), avisos = [];
    treinadores().forEach((l) => {
      const [agua, grama] = ajudantes(l, "horta"); if (!agua || !grama) return;
      todos[l] = todos[l] || {};
      const hz = (todos[l].hz || []).slice(0, CFG.canteiros); while (hz.length < CFG.canteiros) hz.push(0);
      const livres = hz.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0); if (!livres.length) return;
      const d = Math.round(CFG.minutosEstagio * fatorTempo((forcaDe(l, agua) + forcaDe(l, grama)) / 2) * 10) / 10;
      const cores = [];
      mudarR(l, (r) => { r.hz = hz; livres.forEach((i) => { const cor = corDoPlantador(grama); r.hz[i] = { s: cor, t: Date.now(), d, a: 1 }; cores.push(cor); }); });
      avisos.push({ l, nome: todos[l].nm || nomeTreinador(l), grama, cores });
    });
    // aviso curto (só de quem tem nome conhecido), juntando todo mundo
    if (avisos.length) publicar("rancho:planta-broto", "🌱 " + avisos.slice(0, 3).map((a) => `${nomeP(a.grama)} plantou ${a.cores.length > 1 ? a.cores.length + " Apricorns" : "um Apricorn " + ({ red: "Vermelho", blue: "Azul", yellow: "Amarelo", green: "Verde", pink: "Rosa", white: "Branco", black: "Preto" }[a.cores[0]])} na horta de <b>${esc(a.nome)}</b>`).join(" · ") + (avisos.length > 3 ? ` e mais ${avisos.length - 3}` : "") + ` · colha com <b>!colher</b> quando der fruto`);
  }
  /* ---------- pesca ---------- */
  const PEIXES = [
    [[129, 70], [72, 10], [118, 10], [456, 10]],                                                                   // vara velha
    [[129, 30], [118, 15], [746, 15], [222, 8], [370, 10], [223, 10], [90, 7], [120, 5]],                         // vara boa
    [[129, 12], [746, 15], [349, 10], [779, 10], [320, 10], [369, 5], [147, 5], [170, 10], [211, 10], [747, 10], [130, 3]] // vara super
  ];
  const ITENS_PESCA = ["water-stone", "prism-scale", "kings-rock", "deep-sea-tooth", "deep-sea-scale", "stardust", "star-piece", "blue-apricorn", "blue-apricorn"];
  function pescar(login, nome) {
    const r = rancho(login), vr = r.vr || 0, espera = CFG.pescaMinutos * 60e3;
    if (r.pe && Date.now() - r.pe < espera) return { erro: "cedo", falta: Math.ceil((espera - (Date.now() - r.pe)) / 1000) };
    mudarR(login, (x) => { x.pe = Date.now(); x.nm = nome; });
    const sorte = Math.random();
    if (sorte < [0.25, 0.15, 0.1][vr]) return { ok: 1, nada: 1, vr };
    if (sorte < [0.37, 0.3, 0.27][vr]) { const id = ITENS_PESCA[Math.floor(Math.random() * ITENS_PESCA.length)]; dar(login, id, 1); return { ok: 1, item: id, vr }; }
    const l = PEIXES[vr], tot = l.reduce((a, x) => a + x[1], 0);
    let s = Math.random() * tot, num = 129;
    for (const [n, w] of l) { if ((s -= w) <= 0) { num = n; break; } }
    if (S().cheio(login, num)) return { ok: 1, cheio: 1, num, vr };
    const shiny = Math.random() < (S().C.chanceShiny || 0.003) * (vr + 1);
    const forma = USUM.formaRegional ? USUM.formaRegional(num) : "";
    const ind = S().guardar(login, nome, num, shiny, S().novoIV(), "", S().novaNatureza(), forma || undefined);
    return { ok: 1, num, shiny, forca: S().forcaIV(ind.iv), vr };
  }


  /* ---------- Day Care: dois Pokémon da caixa, até 6 ovos, o ovo nasce na forma mais básica (bebê) ---------- */
  // r.dc = { a: {n, s, iv}, b: {n, s, iv}, ult: último ovo (ms), ov: [ {n, t, s} ] }
  function raiz(n) { if (!S() || !S().pai) return n; let x = n, i = 0; while (S().pai(x) && i++ < 5) x = S().pai(x); return x; }
  function melhorInd(login, num, shiny) { const l = S().individuos(login, num); return l.find((x) => !!x.s === !!shiny) || l[0]; }
  function porOvos(login, agora) {   // põe os ovos que já deviam ter aparecido; devolve quantos novos
    agora = agora || Date.now();
    let novos = 0;
    mudarR(login, (r) => {
      const dc = r.dc; if (!dc || !dc.a || !dc.b) return;
      dc.ov = dc.ov || [];
      const passo = (dc.p || CFG.ovoMinutos) * 60e3;
      while (dc.ov.length < CFG.maxOvos && agora - dc.ult >= passo) {
        dc.ult += passo;
        const pai = Math.random() < 0.5 ? dc.a : dc.b, outro = pai === dc.a ? dc.b : dc.a;
        const n = raiz(pai.n === 132 ? outro.n : pai.n);   // com Ditto, nasce a espécie do outro
        dc.ov.push({ n, t: dc.ult, s: Math.random() < (S().C.chanceShiny || 0.003) * 2 ? 1 : 0, iv: (pai.iv || []).map((v, i) => Math.random() < 0.5 ? v : Math.random() < 0.5 ? (outro.iv || [])[i] ?? v : Math.floor(Math.random() * 32)) });
        novos++;
      }
      if (dc.ov.length >= CFG.maxOvos) dc.ult = Math.max(dc.ult, agora - passo + 1);   // (passo já vem da força dos pais)   // cheio: o próximo só depois de chocar
    });
    return novos;
  }
  function deixarNoDaycare(login, nome, texto) {
    const tem = new Set(donos(login)), ws = palavrasPoke(texto);
    const nums = [];
    ws.forEach((w) => { const p = USUM.lerPokemon(w); if (p && tem.has(p.num) && (nums.length < 2)) nums.push(p.num); });
    if (nums.length < 2) return { erro: "dois", achou: nums };
    if (nums.some((n) => S().ehLendario(n))) return { erro: "lendario" };
    if (nums[0] === 132 && nums[1] === 132) return { erro: "dittos" };
    const ind = nums.map((n) => melhorInd(login, n, false));
    const p = Math.round(CFG.ovoMinutos * fatorTempo((forcaDe(login, nums[0]) + forcaDe(login, nums[1])) / 2));
    mudarR(login, (r) => { r.nm = nome; const ov = (r.dc && r.dc.ov) || [];
      r.dc = { a: { n: nums[0], s: ind[0] && ind[0].s ? 1 : 0, iv: ind[0] && ind[0].iv }, b: { n: nums[1], s: ind[1] && ind[1].s ? 1 : 0, iv: ind[1] && ind[1].iv }, ult: Date.now(), ov, p }; });
    return { ok: 1, a: nums[0], b: nums[1], p, bebe: raiz(nums[0] === 132 ? nums[1] : nums[0]) };
  }
  function chocar(login, nome) {
    porOvos(login);
    const dc = rancho(login).dc; if (!dc || !(dc.ov || []).length) return { erro: "semovo" };
    const agora = Date.now(), prontos = dc.ov.filter((o) => agora - o.t >= CFG.chocarMinutos * 60e3);
    if (!prontos.length) return { erro: "cedo", min: Math.ceil((Math.min(...dc.ov.map((o) => o.t)) + CFG.chocarMinutos * 60e3 - agora) / 60e3) };
    const nasceram = [], cheios = [];
    prontos.forEach((o) => {
      if (S().cheio(login, o.n)) { cheios.push(o.n); return; }
      const forma = USUM.formaRegional ? USUM.formaRegional(o.n) : "";
      const ind = S().guardar(login, nome, o.n, !!o.s, o.iv && o.iv.length === 6 ? o.iv : null, "", S().novaNatureza(), forma || undefined);
      nasceram.push({ n: o.n, s: o.s, f: S().forcaIV(ind.iv) });
      o.feito = 1;
    });
    mudarR(login, (r) => { if (r.dc) r.dc.ov = (r.dc.ov || []).filter((o) => !prontos.some((p) => p.t === o.t && p.n === o.n && !cheios.includes(p.n))); });
    return { ok: 1, nasceram, cheios };
  }
  // a tela líder põe os ovos de todo mundo a cada minuto (assim o site mostra) e avisa no chat

  /* ---------- Pedreira: um Pokémon de Pedra ou Terra quebra pedra e acha Minério, Pó Estelar e às vezes pedras de evolução.
     Acha 1 coisa a cada pedreiraMinutos (mais rápido se for forte), durante a live. r.pd = { n: escolhido, ult: ms, ac: [[id, ms]] } ---------- */
  function mineiro(login) {
    const r = rancho(login), tem = new Set(donos(login)), esc_ = r.pd && r.pd.n;
    if (esc_ && tem.has(esc_) && temTipo(esc_, TIPOS_PEDREIRA)) return esc_;
    const fj = ajudantes(login, "forja")[0];
    return melhorDoTipo(login, TIPOS_PEDREIRA, fj) || melhorDoTipo(login, TIPOS_PEDREIRA);
  }
  const ACHADOS = [["hard-stone", 60], ["stardust", 12], ["star-piece", 2], ["fire-stone", 2.5], ["water-stone", 2.5], ["thunder-stone", 2.5], ["leaf-stone", 2.5],
    ["moon-stone", 2.5], ["metal-coat", 3], ["sun-stone", 2], ["shiny-stone", 1.5], ["dusk-stone", 1.5], ["dawn-stone", 1.5], ["ice-stone", 2], ["everstone", 0]];
  function sortearAchado() { const l = ACHADOS.filter(([, w]) => w > 0), tot = l.reduce((a, x) => a + x[1], 0); let r = Math.random() * tot; for (const [id, w] of l) if ((r -= w) <= 0) return id; return "hard-stone"; }
  function rodadaPedreira() {
    const avisos = [];
    treinadores().forEach((l) => {
      const n = mineiro(l); if (!n) return;
      const passo = CFG.pedreiraMinutos * fatorTempo(forcaDe(l, n)) * 60e3, agora = Date.now();
      mudarR(l, (r) => {
        r.pd = r.pd || {}; if (!r.pd.ult || r.pd.quem !== n) { r.pd.ult = agora; r.pd.quem = n; return; }
        let k = 0;
        while (agora - r.pd.ult >= passo && k < 3) {   // no máximo 3 de uma vez (se o OBS ficou fechado, não acumula)
          r.pd.ult += passo; k++;
          const id = sortearAchado(); r.it[id] = (r.it[id] || 0) + 1;
          r.pd.ac = [[id, agora]].concat(r.pd.ac || []).slice(0, 8);
          if (ITENS[id].c === "pedra" || id === "star-piece" || id === "metal-coat") avisos.push({ l, nome: r.nm || nomeTreinador(l), n, id });
        }
        if (agora - r.pd.ult > passo * 3) r.pd.ult = agora;
      });
    });
    avisos.forEach((a, i) => setTimeout(() => publicar(a.id, `⛏️ ${nomeP(a.n)} quebrou uma pedra na pedreira de <b>${esc(a.nome)}</b> e achou <b>${esc(ITENS[a.id].n)}</b>!`, a.l), i * 700));
  }

  /* ---------- Apiário: Cutiefly, Ribombee, Combee ou Vespiquen fazem Mel durante a live (Hiper Mel às vezes).
     r.ap = { n: escolhido, quem, ult, ac: [[id, ms]] }. Usar: !mel / !hipermel chama um Pokémon selvagem na live ---------- */
  const ABELHAS = [742, 743, 415, 416];
  function abelha(login) {
    const r = rancho(login), tem = new Set(donos(login)), e = r.ap && r.ap.n;
    if (e && tem.has(e) && ABELHAS.includes(e)) return e;
    const l = ABELHAS.filter((n) => tem.has(n)); return l.sort((a, b) => forcaDe(login, b) - forcaDe(login, a))[0] || 0;
  }
  // todo mundo que tem Pokémon na caixa (mesmo quem nunca mexeu no rancho)
  const nomeTreinador = (l) => ((ler("usum_caixa", {})[l] || {}).nome) || l;
  // quem o rancho atende a cada minuto: quem falou no chat nas últimas 3 horas (o rancho trabalha enquanto a pessoa está na live)
  const vistosR = new Map();
  const treinadores = () => { const lim = Date.now() - 3 * 3600e3, cx = ler("usum_caixa", {}); return [...vistosR.entries()].filter(([l, t]) => t > lim && cx[l]).map(([l]) => l); };
  function rodadaApiario() {
    const avisos = [];
    treinadores().forEach((l) => {
      const n = abelha(l); if (!n) return;
      const passo = CFG.apiarioMinutos * fatorTempo(forcaDe(l, n)) * 60e3, agora = Date.now();
      const chHiper = CFG.chanceHiperMel * ([743, 416].includes(n) ? 1.5 : 1);   // a forma evoluída acha Hiper Mel mais vezes
      mudarR(l, (r) => {
        r.ap = r.ap || {}; if (!r.ap.ult || r.ap.quem !== n) { r.ap.ult = agora; r.ap.quem = n; return; }
        let k = 0;
        while (agora - r.ap.ult >= passo && k < 3) {
          r.ap.ult += passo; k++;
          const id = Math.random() < chHiper ? "hiper-mel" : "mel"; r.it[id] = (r.it[id] || 0) + 1;
          r.ap.ac = [[id, agora]].concat(r.ap.ac || []).slice(0, 8);
          if (id === "hiper-mel") avisos.push({ l, nome: r.nm || nomeTreinador(l), n });
        }
        if (agora - r.ap.ult > passo * 3) r.ap.ult = agora;
      });
    });
    avisos.forEach((a, i) => setTimeout(() => publicar("hiper-mel", `🍯 ${nomeP(a.n)} fez um <b>Hiper Mel</b> no apiário de <b>${esc(a.nome)}</b>! Use com <b>!hipermel</b>`, a.l), i * 700));
  }
  // pede ao encontro.html (a tela do selvagem) para chamar um Pokémon
  function pedirSelvagem(opc) {
    const f = ler("usum_chamar", []); f.push(Object.assign({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 7) }, opc)); gravar("usum_chamar", f.slice(-10));
  }
  function usarMel(login, nome, hiper) {
    const id = hiper ? "hiper-mel" : "mel";
    if (qtd(login, id) < 1) return { erro: "semmel", id };
    dar(login, id, -1); mudarR(login, (r) => { r.nm = nome; });
    const opc = { tag: (hiper ? "🍯✨ Hiper Mel de " : "🍯 Mel de ") + nome, semRota: true };
    if (hiper) { const r = Math.random(); if (r < 0.001) opc.lendario = true; else if (r < 0.101) opc.ultima = true; }
    pedirSelvagem(opc);
    return { ok: 1, id };
  }
  /* ---------- amizade no rancho: quem trabalha ganha 1 ponto por minuto, o Pokémon do Cantinho da Amizade ganha 2.
     Com amizadeBorda pontos (60) a espécie libera a borda "Rancho" da fotinha. r.ami = Pokémon no cantinho, r.am = {num: pontos}, r.br = [nums] ---------- */
  function quemTrabalha(login) {
    const r = rancho(login), l = [];
    const fj = ajudantes(login, "forja"); if (fj[0] && fj[1]) l.push(fj[0], fj[1]);
    const hf = ajudantes(login, "horta"); if (hf[0] && hf[1] && (r.hz || []).some(Boolean)) l.push(hf[0], hf[1]);
    if (r.dc && r.dc.a && r.dc.b) l.push(r.dc.a.n, r.dc.b.n);
    const mn = mineiro(login); if (mn) l.push(mn);
    const ab = abelha(login); if (ab) l.push(ab);
    return [...new Set(l)];
  }
  function rodadaAmizade() {
    const todos = ler("usum_rancho", {}), novas = [];
    treinadores().forEach((l) => {
      const r = todos[l] || {};
      const tem = new Set(donos(l)), ganha = {};
      if (r.ami && tem.has(r.ami)) ganha[r.ami] = 2;
      quemTrabalha(l).forEach((n) => (ganha[n] = (ganha[n] || 0) + 1));
      if (!Object.keys(ganha).length) return;
      mudarR(l, (x) => {
        x.am = x.am || {}; x.br = x.br || [];
        Object.entries(ganha).forEach(([n, p]) => {
          n = +n; x.am[n] = (x.am[n] || 0) + p;
          if (x.am[n] >= CFG.amizadeBorda && !x.br.includes(n)) { x.br.push(n); novas.push({ login: l, nome: x.nm || nomeTreinador(l), n }); }
        });
      });
    });
    novas.forEach((b) => darBolha(b.login, b.nome, "rancho"));   // 1ª amizade perfeita: bolha do rancho (só na primeira vez)
    novas.forEach((b) => publicarEv({ tipo: "borda", login: b.login, nome: b.nome, num: b.n, pnome: USUM.nomeDe(b.n), borda: "rancho", bordaNome: "Rancho" }));
  }
  // fitas do rancho: Horta (colheu E forjou uma bola) e Day Care (chocou um ovo)
  function marcarFita(login, nome, oque) {
    const r = mudarR(login, (x) => { x.fx = x.fx || {}; x.fx[oque] = 1; return x.fx; });
    if (!USUM.darFita) return;
    if (r.colheu && r.forjou) USUM.darFita(login, nome, "horta");
    if (r.chocou) USUM.darFita(login, nome, "daycare");
  }
  const temBordaRancho = (login, num) => (rancho(login).br || []).includes(+num);
  function rodadaOvos() {
    const todos = ler("usum_rancho", {}), quem = [];
    Object.keys(todos).forEach((l) => { const dc = todos[l].dc; if (dc && dc.a && dc.b && porOvos(l)) quem.push(todos[l].nm || l); });
    if (quem.length) publicar("ic:daycare", `🥚 Apareceu ovo no Day Care de <b>${quem.slice(0, 4).map(esc).join(", ")}</b>${quem.length > 4 ? " e +" + (quem.length - 4) : ""}! Choca em ${CFG.chocarMinutos} min com <b>!chocar</b>`);
  }
  // ovos como estão agora (para o site, que não grava nada)
  function ovosVer(dc, agora) {
    agora = agora || Date.now();
    return ((dc && dc.ov) || []).map((o) => ({ n: o.n, s: o.s, pronto: agora - o.t >= CFG.chocarMinutos * 60e3, min: Math.max(0, Math.ceil((o.t + CFG.chocarMinutos * 60e3 - agora) / 60e3)) }));
  }


  /* ---------- Bolhas de chat conquistadas (além de Sol e Lua) ----------
     rancho   = amizade perfeita no rancho (a 1ª borda Rancho)
     cinefilo = ficou numa live de filme até o fim (falou no começo e nos últimos 20 min)
     usum_bolhas = { login: { tem: ["rancho"], usa: "rancho" } }. A nova já entra em uso; !bolha equipe volta para Sol/Lua. */
  const BOLHAS = { rancho: { n: "Rancho", ic: "🌱" }, cinefilo: { n: "Cinéfilo", ic: "🎬" } };
  function bolhasDe(login) { return ler("usum_bolhas", {})[login] || { tem: [] }; }
  function bolhaDe(login) { const b = bolhasDe(login); return b.usa && (b.tem || []).includes(b.usa) ? b.usa : ""; }
  function darBolha(login, nome, id) {
    const todos = ler("usum_bolhas", {}), b = todos[login] || (todos[login] = { tem: [] });
    if ((b.tem || []).includes(id)) return false;
    b.tem = (b.tem || []).concat(id); b.usa = id; gravar("usum_bolhas", todos);
    publicar(id === "rancho" ? "ic:casa" : "rancho:ic-daycare", `🫧 <b>${esc(nome)}</b> conquistou a <b>bolha ${BOLHAS[id].n}</b> ${BOLHAS[id].ic} no chat! ${id === "rancho" ? "(amizade perfeita no rancho)" : "(ficou no filme até o fim)"} · troque com <b>!bolha</b>`, login);
    return true;
  }
  // filme: anota quem falou e quando; no !evento fim vê quem ficou até o fim
  const filmeAtivo = () => { try { return ((JSON.parse(localStorage.getItem("pk_sessao") || "null") || {}).eventos || []).includes("premier"); } catch (e) { return false; } };
  function anotarCinema(m) {
    if (!filmeAtivo()) return;
    const c = ler("usum_cine_sessao", {}); if (!c.t0) { c.t0 = Date.now(); c.q = {}; }
    const e = c.q[m.login] || (c.q[m.login] = [Date.now(), 0, m.nome]); e[1] = Date.now(); e[2] = m.nome;
    gravar("usum_cine_sessao", c);
  }
  function fimDoFilme() {
    const c = ler("usum_cine_sessao", {}); localStorage.removeItem("usum_cine_sessao");
    if (!c.t0) return;
    const fim = Date.now(); if (fim - c.t0 < 20 * 60e3) return;   // filme curto demais (ou ligou sem querer)
    Object.entries(c.q || {}).forEach(([l, [ini, ult, nome]]) => { if (ini <= fim - 30 * 60e3 && ult >= fim - 20 * 60e3) darBolha(l, nome || l, "cinefilo"); });
  }


  /* ---------- Check-in: na primeira mensagem de cada live (dia), a pessoa ganha itens e aparece um cartão no chat.
     Dias seguidos aumentam o prêmio (a cada 5 dias seguidos: Ultra Ball e Hiper Mel). usum_checkin = { login: { d: "2026-11-23", s: dias seguidos, tot } } ---------- */
  const hojeStr = (t) => { const d = new Date(t || Date.now()); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  function checkin(m) {
    if (USUM.offline && USUM.offline()) return;
    if (!m.login || /bot$/i.test(m.login) || m.login === "streamelements" || m.login === "nightbot") return;
    const todos = ler("usum_checkin", {}), eu = todos[m.login] || {}, hoje = hojeStr();
    if (eu.d === hoje) return;
    const ontem = hojeStr(Date.now() - 864e5), seguidos = eu.d === ontem ? (eu.s || 1) + 1 : 1;
    todos[m.login] = { d: hoje, s: seguidos, tot: (eu.tot || 0) + 1 }; gravar("usum_checkin", todos);
    const cores = ["red", "blue", "yellow", "green", "pink", "white", "black"], ap = cores[Math.floor(Math.random() * 7)] + "-apricorn";
    const premio = [["bola:great", 2, "Great Balls"], ["mel", 1, "Mel"], ["essencia", 3, "Essência"], [ap, 1, ITENS[ap].n]];
    if (seguidos % 5 === 0) premio.push(["bola:ultra", 1, "Ultra Ball"], ["hiper-mel", 1, "Hiper Mel"]);
    premio.forEach(([id, n]) => { if (/^bola:/.test(id)) S().darBola(m.login, id.slice(5), n); else dar(m.login, id, n); });
    mudarR(m.login, (r) => { r.nm = m.nome; });
    publicarEv({ tipo: "checkin", login: m.login, nome: m.nome, seguidos, tot: (eu.tot || 0) + 1,
      itens: premio.map(([id, n, nome]) => ({ img: /^bola:/.test(id) ? USUM.urlBola(id.slice(5)) : urlItem(id), n, nome })) });
  }
  /* ---------- casinha: móveis feitos na bancada ---------- */
  const MOVEIS = {
    cama: { n: "Cama", custo: { "white-apricorn": 2, "pink-apricorn": 1 } },
    tapete: { n: "Tapete Poké Ball", custo: { "red-apricorn": 1, "white-apricorn": 1 } },
    mesa: { n: "Mesa", custo: { "green-apricorn": 1, "hard-stone": 1 } },
    poltrona: { n: "Poltrona", custo: { "white-apricorn": 1, "pink-apricorn": 1 } },
    sofa: { n: "Sofá", custo: { "red-apricorn": 2, "pink-apricorn": 1 } },
    quadro: { n: "Quadro", custo: { "green-apricorn": 1, "blue-apricorn": 1, "yellow-apricorn": 1 } },
    tv: { n: "TV", custo: { "hard-stone": 2, "black-apricorn": 1 } },
    fogao: { n: "Fogão", custo: { "hard-stone": 3, "red-apricorn": 1 } },
    geladeira: { n: "Geladeira", custo: { "hard-stone": 3, "white-apricorn": 2 } },
    computador: { n: "Computador", custo: { "hard-stone": 3, "stardust": 1 } },
    "pikachu-plush": { n: "Pelúcia de Pikachu", custo: { "yellow-apricorn": 3 } },
    "snorlax-plush": { n: "Pelúcia de Snorlax", custo: { "blue-apricorn": 2, "white-apricorn": 2 } },
    "kecleon-plush": { n: "Pelúcia de Kecleon", custo: { "green-apricorn": 2, "red-apricorn": 1, "star-piece": 1 } },
    "tv-pikachu": { n: "TV do Pikachu", custo: { "yellow-apricorn": 3, "hard-stone": 2, "stardust": 1 } }
  };
  function acharMovel(txt) {
    const q = limpa(txt).replace(/\b(de|do|da)\b/g, " ").replace(/\s+/g, "");
    if (!q) return null;
    const ks = Object.keys(MOVEIS), n = (k) => [limpa(MOVEIS[k].n).replace(/\b(de|do|da)\b/g, " ").replace(/\s+/g, ""), k.replace(/-/g, "")];
    return ks.find((k) => n(k).includes(q)) || ks.find((k) => n(k).some((x) => x.includes(q) || q.includes(x)));
  }
  function fazerMovel(login, nome, k) {
    const r = rancho(login);
    if ((r.mv || []).includes(k)) return { erro: "jatem" };
    const M = MOVEIS[k];
    if (!temTudo(login, M.custo)) return { erro: "falta", falta: faltaDe(login, M.custo) };
    gastar(login, M.custo);
    mudarR(login, (x) => { x.nm = nome; x.mv = (x.mv || []).concat(k); });
    return { ok: 1, total: (r.mv || []).length + 1 };
  }

  /* ---------- avisos no chat ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function publicarEv(ev) { if (USUM.publicarFeed) USUM.publicarFeed(ev); }
  // img: id de item (sprite), "num:123" (Pokémon) ou "rancho:arquivo" (asset do rancho)
  function publicar(img, html, login) { publicarEv({ tipo: "rancho", img, html, login }); }
  const nomeP = (n) => esc(USUM.nomeDe(n));
  const listaCusto = (c) => Object.entries(c).map(([id, n]) => `${n} ${esc(ITENS[id].n)}`).join(" + ");

  /* ---------- comandos ---------- */
  const CMD = /^!(itens|item|usar|forja|forjar|horta|plantar|colher|pescar|pesca|fazer|rancho|casa|receitas|daycare|creche|chocar|bolha|bolhas|pedreira|minerar|mel|hipermel|apiario|apiário)\b/;
  let lider = false;
  const site = /github\.io$/.test(location.hostname);
  if (USUM.aoMensagem && !site && navigator.locks && navigator.locks.request) navigator.locks.request("usum_rancho", () => { lider = true; return new Promise(() => {}); }).catch(() => {});
  else if (!(navigator.locks && navigator.locks.request)) lider = true;
  function comando(m) {
    const txt = String(m.texto || "").trim(), low = txt.toLowerCase(), mt = low.match(CMD);
    if (!mt) return;
    const cmd = mt[1], arg = txt.slice(mt[0].length).trim(), L = m.login, N = m.nome;
    const url = USUM.pokedexUrl ? ` · veja em <b>${esc(USUM.pokedexUrl.replace(/^https?:\/\//, "").replace(/\/?$/, "/"))}?u=${esc(L)}</b>` : "";
    if (cmd === "itens" || cmd === "item") {
      const it = rancho(L).it || {}, ks = Object.keys(it).filter((k) => ITENS[k] && it[k] > 0);
      if (!ks.length) return publicar("ic:mochila", `🎒 <b>${esc(N)}</b>, sua mochila do rancho está vazia. Capture Pokémon (com !capturar) para achar itens!`, L);
      const ord = ["mel", "pedra", "troca", "forma", "mat"];
      ks.sort((a, b) => (b === "essencia") - (a === "essencia") || ord.indexOf(ITENS[a].c) - ord.indexOf(ITENS[b].c));
      return publicar("ic:mochila", `🎒 <b>${esc(N)}</b>: ` + ks.slice(0, 10).map((k) => `<img class="mini-item" src="${urlItem(k)}">${it[k]}× ${esc(ITENS[k].n)}`).join(" · ") + (ks.length > 10 ? ` e mais ${ks.length - 10}` : "") + url, L);
    }
    if (cmd === "rancho" && arg) {
      if (/^(tirar|sair|buscar|nenhum)$/i.test(limpa(arg))) { mudarR(L, (r) => { delete r.ami; }); return publicar("ic:casa", `🏡 <b>${esc(N)}</b> buscou o Pokémon do Cantinho da Amizade`, L); }
      const tem = new Set(donos(L)), n = palavrasPoke(arg).map((w) => (USUM.lerPokemon(w) || {}).num).find((x) => x && tem.has(x));
      if (!n) return publicar("ic:casa", `🏡 <b>${esc(N)}</b>, escolha um Pokémon que você tem: <b>!rancho pikachu</b>. Ele mora no rancho e ganha amizade; com amizade cheia, libera a <b>borda Rancho</b>`, L);
      mudarR(L, (r) => { r.nm = N; r.ami = n; });
      const pts = (rancho(L).am || {})[n] || 0;
      return publicar("num:" + n, `🏡 ${nomeP(n)} foi morar no rancho de <b>${esc(N)}</b>! Amizade ${Math.min(pts, CFG.amizadeBorda)}/${CFG.amizadeBorda}` + (temBordaRancho(L, n) ? " · já tem a borda Rancho ✓" : " · com amizade cheia libera a <b>borda Rancho</b>"), L);
    }
    if (cmd === "rancho" || cmd === "casa" || cmd === "receitas") {
      const r = rancho(L), [a, f] = ajudantes(L, "forja"), [ag, gr] = ajudantes(L, "horta");
      return publicar("ic:casa", `🏡 Rancho de <b>${esc(N)}</b>: forja ${a && f ? `🔥 ${nomeP(a)} + ${nomeP(f)}` : "apagada (precisa de um Pokémon de Aço, Terra ou Pedra e um de Fogo)"} · horta ${ag && gr ? `💧 ${nomeP(ag)} + ${nomeP(gr)}` : "parada (precisa de Água e Grama)"} · ${(r.mv || []).length} móveis · vara ${["velha", "boa", "super"][r.vr || 0]}` + url, L);
    }
    if (cmd === "usar" && /^(hiper\s*)?mel\b/.test(limpa(arg))) { m = Object.assign({}, m, { texto: "!" + (/^hiper/.test(limpa(arg)) ? "hipermel" : "mel") }); return comando(m); }
    if (cmd === "usar") {
      const id = acharItem(arg, (k) => ITENS[k].c !== "mat" && ITENS[k].c !== "mel");
      if (!id) return publicar("ic:mochila", `<b>${esc(N)}</b>, não achei esse item 🤔 (ex: <b>!usar pedra do fogo</b>, <b>!usar néctar rosa</b>)`, L);
      if (qtd(L, id) < 1) return publicar(id, `<b>${esc(N)}</b>, você não tem <b>${esc(ITENS[id].n)}</b>. Ele aparece capturando Pokémon!`, L);
      const parc = ler("usum_parceiros", {})[L];
      if (!parc) return publicar(id, `<b>${esc(N)}</b>, escolha um parceiro com <b>!pokemon</b> antes de usar itens`, L);
      if (FORMA_ITEM[id] && [].concat(FORMA_ITEM[id][0]).includes(parc.num)) {
        const [, modo] = FORMA_ITEM[id];
        let nova;
        if (modo === "troca") nova = parseInt(parc.forma, 10) ? 0 : 1;
        else if (modo === "rotom") { const w = limpa(arg).split(" ").find((x) => ROTOM[x] != null); nova = w != null ? ROTOM[w] : ((parseInt(parc.forma, 10) || 0) + 1) % 6; }
        else nova = modo;
        if ((parseInt(parc.forma, 10) || 0) === nova) return publicar(id, `<b>${esc(N)}</b>, seu ${nomeP(parc.num)} já está nessa forma`, L);
        if (!ITENS[id].chave) dar(L, id, -1);
        trocarForma(L, parc, nova);
        const nf = nova ? USUM.nomeForma(parc.num, String(nova).padStart(4, "0")) : "forma normal";
        return publicar("num:" + parc.num + ":" + (parc.shiny ? "s" : "") + ":" + (nova ? String(nova).padStart(4, "0") : ""), `✨ <b>${esc(N)}</b> usou <b>${esc(ITENS[id].n)}</b> e ${nomeP(parc.num)} mudou para <b>${esc(nf)}</b>!`, L);
      }
      if (FORMA_ITEM[id]) return publicar(id, `<b>${esc(N)}</b>, ${esc(ITENS[id].n)} só funciona com ${[].concat(FORMA_ITEM[id][0]).map(nomeP).join(" / ")} como parceiro`, L);
      return publicar(id, `<b>${esc(N)}</b>, não precisa usar ${esc(ITENS[id].n)}: ela sai sozinha da mochila quando você resgata <b>Evoluir meu Pokémon</b> (ex: escreva <i>vaporeon</i> no resgate)`, L);
    }
    if (cmd === "forja" && arg) {
      const [a, b] = escolherAjudantes(L, "forja", arg);
      const [aa, ff] = ajudantes(L, "forja");
      return publicar("rancho:forja-acesa", `🔨 Forja de <b>${esc(N)}</b>: ${aa ? nomeP(aa) : "<i>sem Aço/Terra/Pedra</i>"} + ${ff ? nomeP(ff) : "<i>sem Fogo</i>"}` + (!a && !b ? " (não achei esses Pokémon de Aço/Terra/Pedra e Fogo na sua caixa)" : ""), L);
    }
    if (cmd === "forja" || cmd === "forjar") {
      if (!arg) return publicar("rancho:forja-acesa", `🔨 <b>${esc(N)}</b>, para forjar: <b>!forjar great</b> (ou ultra, quick, timer, repeat, nest, net, dive, dusk, dream, heal, luxury, as bolas de Johto e <b>vara boa</b>/<b>vara super</b>). Receitas no site` + url, L);
      const partes = limpa(arg).split(" "), vezes = Math.max(1, Math.min(10, parseInt(partes.find((x) => /^\d+$/.test(x)) || "1", 10)));
      const nome = partes.filter((x) => !/^\d+$/.test(x)).join(" ");
      const k = /vara/.test(nome) ? (/super/.test(nome) ? "vara-super" : "vara-boa") : USUM.lerBola ? USUM.lerBola(nome) : null;
      if (!k || !RECEITAS[k]) return publicar("rancho:forja-apagada", `<b>${esc(N)}</b>, a forja não faz isso 🤔 Tente <b>!forjar great</b>`, L);
      const r = forjar(L, N, k, vezes);
      if (r.erro === "ajudantes") return publicar("rancho:forja-apagada", `🔨 <b>${esc(N)}</b>, a forja precisa de um Pokémon de <b>Aço, Terra ou Pedra</b>${r.aco ? " ✓" : ""} e um de <b>Fogo</b>${r.fogo ? " ✓" : ""} na sua caixa`, L);
      if (r.erro === "falta") return publicar("rancho:forja-apagada", `🔨 <b>${esc(N)}</b>, falta: ${r.falta.map(esc).join(", ")} (receita: ${listaCusto(RECEITAS[k].custo)})` + (qtd(L, "essencia") < (RECEITAS[k].custo.essencia || 0) ? ` <small>✨ essência vem de capturar e de soltar Pokémon (!release)</small>` : ""), L);
      if (r.erro === "jatem") return publicar("rancho:forja-acesa", `<b>${esc(N)}</b>, você já tem essa vara (ou uma melhor)`, L);
      if (r.erro === "precisaboa") return publicar("rancho:forja-acesa", `<b>${esc(N)}</b>, forje a <b>vara boa</b> primeiro`, L);
      if (r.vara) return publicar("rancho:" + (r.vara === 2 ? "vara-super" : "vara-boa"), `🎣 ${nomeP(r.aco)} e ${nomeP(r.fogo)} forjaram uma <b>${r.vara === 2 ? "Super Vara" : "Vara Boa"}</b> para <b>${esc(N)}</b>! Peixes mais raros no <b>!pescar</b>`, L);
      marcarFita(L, N, "forjou");
      return publicar("bola:" + r.bola, `🔥 ${nomeP(r.aco)} e ${nomeP(r.fogo)} forjaram <b>${r.n} ${esc(USUM.BOLAS[r.bola])}s</b> para <b>${esc(N)}</b>!${r.bonus ? ` <small>(+${r.bonus} de bônus pela força deles 💪)</small>` : ""} Para usar: <b>!ball ${esc(r.bola)}</b>`, L);
    }
    if (cmd === "horta") {
      if (arg) escolherAjudantes(L, "horta", arg);
      const [ag, gr] = ajudantes(L, "horta"), hz = rancho(L).hz || [];
      const est = hz.slice(0, CFG.canteiros).map((c) => (c ? ["🌱", "🌿", "🌸", "🍎"][estagioDe(c)] : "▫️")).join(" ");
      return publicar("ic:horta", `🌱 Horta de <b>${esc(N)}</b>: ${ag ? "💧 " + nomeP(ag) : "<i>sem Água</i>"} + ${gr ? "🍃 " + nomeP(gr) : "<i>sem Grama</i>"} · ${est || "▫️ ▫️ ▫️"} · ${gr ? nomeP(gr) + " planta sozinho nos canteiros vazios" : "com um Pokémon de Grama ele planta sozinho"} (ou plante o seu com <b>!plantar azul</b>)`, L);
    }
    if (cmd === "plantar") {
      const cor = CORES[limpa(arg).replace(/apricorn|semente/g, "").trim().split(" ")[0]];
      if (!cor) return publicar("ic:horta", `🌱 <b>${esc(N)}</b>, diga a cor do Apricorn: <b>!plantar vermelho</b> (azul, amarelo, verde, rosa, branco, preto)`, L);
      const r = plantar(L, N, cor);
      if (r.erro === "ajudantes") return publicar("rancho:terra-seca", `🌱 <b>${esc(N)}</b>, a horta precisa de um Pokémon de <b>Água</b>${r.agua ? " ✓" : ""} para regar e um de <b>Grama</b>${r.grama ? " ✓" : ""} para adubar, na sua caixa`, L);
      if (r.erro === "semsemente") return publicar(r.id, `<b>${esc(N)}</b>, você não tem ${esc(ITENS[r.id].n)} para plantar`, L);
      if (r.erro === "cheia") return publicar("rancho:planta-frutos", `<b>${esc(N)}</b>, sua horta está cheia (${CFG.canteiros} canteiros). Use <b>!colher</b> quando der fruto`, L);
      return publicar("rancho:planta-broto", `🌱 <b>${esc(N)}</b> plantou um ${esc(ITENS[r.id].n)}! ${nomeP(r.agua)} rega e ${nomeP(r.grama)} aduba · dá fruto em ${r.total} min (<b>!colher</b>)`, L);
    }
    if (cmd === "colher") {
      const r = colher(L);
      if (r.erro) return publicar("rancho:planta-folhas", `<b>${esc(N)}</b>, nada pronto na horta ainda${r.prox != null ? ` (o próximo em ${r.prox} min)` : " (plante com <b>!plantar azul</b>)"}`, L);
      marcarFita(L, N, "colheu");
      return publicar("rancho:planta-frutos", `🍎 <b>${esc(N)}</b> colheu: ${Object.entries(r.ganhos).map(([id, n]) => `<img class="mini-item" src="${urlItem(id)}">${n}× ${esc(ITENS[id].n)}`).join(" · ")}`, L);
    }
    if (cmd === "pescar" || cmd === "pesca") {
      const r = pescar(L, N);
      const vara = ["vara-velha", "vara-boa", "vara-super"][r.vr || 0];
      if (r.erro === "cedo") return publicar("rancho:" + vara, `🎣 <b>${esc(N)}</b>, os peixes ainda estão assustados… tente de novo em ${r.falta >= 60 ? Math.ceil(r.falta / 60) + " min" : r.falta + " s"}`, L);
      if (r.nada) return publicar("rancho:boia", `🎣 <b>${esc(N)}</b> jogou a linha… e nada mordeu dessa vez`, L);
      if (r.item) return publicar(r.item, `🎣 <b>${esc(N)}</b> pescou um item: <b>${esc(ITENS[r.item].n)}</b>!`, L);
      if (r.cheio) return publicar("num:" + r.num, `🎣 <b>${esc(N)}</b> fisgou um ${nomeP(r.num)}, mas já tem o máximo dele e soltou de volta no lago`, L);
      return publicar("num:" + r.num + (r.shiny ? ":s" : ""), `🎣 <b>${esc(N)}</b> pescou um <b>${nomeP(r.num)}</b>${r.shiny ? " ✦ SHINY" : ""}! <small class="forca">força ${r.forca}%</small>`, L);
    }

    if (cmd === "mel" || cmd === "hipermel") {
      const hiper = cmd === "hipermel" || /^hiper/.test(limpa(arg));
      const r = usarMel(L, N, hiper);
      if (r.erro) return publicar(r.id, `🍯 <b>${esc(N)}</b>, você não tem ${hiper ? "Hiper Mel" : "Mel"}. Ele vem do apiário do rancho (precisa de Cutiefly, Ribombee, Combee ou Vespiquen)`, L);
      return publicar(r.id, `🍯 <b>${esc(N)}</b> passou ${hiper ? "<b>Hiper Mel</b>" : "Mel"} numa árvore… um Pokémon selvagem vem chegando!${hiper ? " <small>(10% de chance de última forma, 0,1% de lendário)</small>" : ""}`, L);
    }
    if (cmd === "apiario" || cmd === "apiário") {
      if (arg) {
        const tem = new Set(donos(L)), n = palavrasPoke(arg).map((w) => (USUM.lerPokemon(w) || {}).num).find((x) => x && tem.has(x) && ABELHAS.includes(x));
        if (!n) return publicar("mel", `🐝 <b>${esc(N)}</b>, o apiário precisa de Cutiefly, Ribombee, Combee ou Vespiquen que você tem: <b>!apiario cutiefly</b>`, L);
        mudarR(L, (r) => { r.nm = N; r.ap = Object.assign(r.ap || {}, { n }); });
      }
      const n = abelha(L);
      if (!n) return publicar("mel", `🐝 <b>${esc(N)}</b>, o apiário precisa de uma abelha na sua caixa: Cutiefly, Ribombee, Combee ou Vespiquen`, L);
      return publicar("num:" + n, `🐝 ${nomeP(n)} está fazendo mel no apiário de <b>${esc(N)}</b> (1 a cada ${Math.round(CFG.apiarioMinutos * fatorTempo(forcaDe(L, n)) * 10) / 10} min de live) · Mel: ${qtd(L, "mel")} · Hiper Mel: ${qtd(L, "hiper-mel")}`, L);
    }
    if (cmd === "pedreira" || cmd === "minerar") {
      mudarR(L, (r) => { r.nm = N; });
      if (arg) {
        const tem = new Set(donos(L)), n = palavrasPoke(arg).map((w) => (USUM.lerPokemon(w) || {}).num).find((x) => x && tem.has(x) && temTipo(x, TIPOS_PEDREIRA));
        if (!n) return publicar("hard-stone", `⛏️ <b>${esc(N)}</b>, a pedreira precisa de um Pokémon de <b>Pedra</b> ou <b>Terra</b> que você tem: <b>!pedreira geodude</b>`, L);
        mudarR(L, (r) => { r.nm = N; r.pd = Object.assign(r.pd || {}, { n }); });
      }
      const n = mineiro(L), pd = rancho(L).pd || {};
      if (!n) return publicar("hard-stone", `⛏️ <b>${esc(N)}</b>, a pedreira precisa de um Pokémon de <b>Pedra</b> ou <b>Terra</b> na sua caixa (Geodude, Rockruff, Sandshrew…)`, L);
      const min = Math.round(CFG.pedreiraMinutos * fatorTempo(forcaDe(L, n)) * 10) / 10;
      return publicar("num:" + n, `⛏️ ${nomeP(n)} está quebrando pedra na pedreira de <b>${esc(N)}</b>: acha alguma coisa a cada ${min} min de live (Minério, Pó Estelar e às vezes pedras de evolução)` + ((pd.ac || []).length ? ` · último achado: ${esc(ITENS[pd.ac[0][0]].n)}` : ""), L);
    }
    if (cmd === "bolha" || cmd === "bolhas") {
      const b = bolhasDe(L), tem = b.tem || [], a = limpa(arg);
      if (!a) return publicar("ic:casa", `🫧 <b>${esc(N)}</b>, suas bolhas: <b>Equipe</b> (Sol/Lua)${tem.map((id) => ", <b>" + BOLHAS[id].n + "</b> " + BOLHAS[id].ic).join("")}. Usando: <b>${bolhaDe(L) ? BOLHAS[bolhaDe(L)].n : "Equipe"}</b> · troque com <b>!bolha rancho</b>, <b>!bolha cinefilo</b> ou <b>!bolha equipe</b>` + (tem.length < 2 ? ` · faltam: ${Object.keys(BOLHAS).filter((id) => !tem.includes(id)).map((id) => BOLHAS[id].n + (id === "rancho" ? " (amizade perfeita no rancho)" : " (ficar num filme até o fim)")).join(", ")}` : ""), L);
      const id = /^(equipe|time|sol|lua|normal|nenhuma|padrao)$/.test(a) ? "" : Object.keys(BOLHAS).find((k) => a.startsWith(k.slice(0, 4)) || limpa(BOLHAS[k].n).startsWith(a));
      if (id === undefined) return publicar("ic:casa", `<b>${esc(N)}</b>, não conheço essa bolha. Use <b>!bolha rancho</b>, <b>!bolha cinefilo</b> ou <b>!bolha equipe</b>`, L);
      if (id && !tem.includes(id)) return publicar("ic:casa", `<b>${esc(N)}</b>, você ainda não tem a bolha ${BOLHAS[id].n}: ${id === "rancho" ? "faça uma amizade perfeita no rancho (!rancho pikachu)" : "fique numa live de filme até o fim, conversando"}`, L);
      const todos = ler("usum_bolhas", {}); todos[L] = Object.assign({ tem: [] }, todos[L], { usa: id }); gravar("usum_bolhas", todos);
      return publicar("ic:casa", `🫧 <b>${esc(N)}</b> agora usa a bolha <b>${id ? BOLHAS[id].n + " " + BOLHAS[id].ic : "da equipe"}</b>`, L);
    }
    if (cmd === "daycare" || cmd === "creche") {
      if (/^(tirar|retirar|buscar|sair)$/i.test(limpa(arg))) {
        mudarR(L, (r) => { if (r.dc) { delete r.dc.a; delete r.dc.b; } });
        return publicar("ic:daycare", `🏠 <b>${esc(N)}</b> buscou os Pokémon do Day Care. Os ovos que já estavam lá continuam esperando o <b>!chocar</b>`, L);
      }
      if (arg) {
        const r = deixarNoDaycare(L, N, arg);
        if (r.erro === "dois") return publicar("ic:daycare", `🥚 <b>${esc(N)}</b>, diga <b>dois</b> Pokémon que você tem na caixa: <b>!daycare pikachu eevee</b>` + (r.achou.length ? ` (achei só ${nomeP(r.achou[0])})` : ""), L);
        if (r.erro === "lendario") return publicar("ic:daycare", `<b>${esc(N)}</b>, lendários não botam ovo no Day Care`, L);
        if (r.erro === "dittos") return publicar("ic:daycare", `<b>${esc(N)}</b>, dois Ditto não botam ovo 😅`, L);
        return publicar("ic:daycare", `🥚 <b>${esc(N)}</b> deixou ${nomeP(r.a)} e ${nomeP(r.b)} no Day Care! A cada ${r.p} min aparece um ovo (até ${CFG.maxOvos}, mais rápido com pais fortes) e dele nasce <b>${nomeP(r.bebe)}</b> (ou a forma bebê do outro)`, L);
      }
      porOvos(L);
      const dc = rancho(L).dc, ov = ovosVer(dc);
      if (!dc || !dc.a) return publicar("ic:daycare", `🥚 <b>${esc(N)}</b>, deixe dois Pokémon da sua caixa no Day Care com <b>!daycare pikachu eevee</b>. Eles botam até ${CFG.maxOvos} ovos, e é o único jeito de ter Pokémon bebê (Pichu, Togepi, Riolu…)` + (ov.length ? ` · você tem ${ov.length} ovo(s) esperando` : "") + url, L);
      return publicar("ic:daycare", `🥚 Day Care de <b>${esc(N)}</b>: ${nomeP(dc.a.n)} + ${nomeP(dc.b.n)} · ${ov.length}/${CFG.maxOvos} ovos` + (ov.length ? ` (${ov.filter((o) => o.pronto).length} prontos para <b>!chocar</b>)` : ""), L);
    }
    if (cmd === "chocar") {
      const r = chocar(L, N);
      if (r.erro === "semovo") return publicar("ic:daycare", `🥚 <b>${esc(N)}</b>, você não tem ovos. Deixe dois Pokémon no Day Care: <b>!daycare pikachu eevee</b>`, L);
      if (r.erro === "cedo") return publicar("ic:daycare", `🥚 <b>${esc(N)}</b>, os ovos ainda estão quentinhos… o primeiro choca em ${r.min} min`, L);
      if (!r.nasceram.length) return publicar("ic:daycare", `<b>${esc(N)}</b>, sua caixa já tem o máximo de ${r.cheios.map(nomeP).join(", ")}. Solte um com <b>!release</b> para o ovo chocar`, L);
      const b = r.nasceram[0];
      marcarFita(L, N, "chocou");
      return publicar("num:" + b.n + (b.s ? ":s" : ""), `🐣 Os ovos de <b>${esc(N)}</b> chocaram: ` + r.nasceram.map((x) => `<b>${nomeP(x.n)}</b>${x.s ? " ✦ SHINY" : ""} <small class="forca">${x.f}%</small>`).join(", ") + "!" + (r.cheios.length ? ` <small>(${r.cheios.length} ficou esperando: caixa cheia)</small>` : ""), L);
    }
    if (cmd === "fazer") {
      const k = acharMovel(arg);
      if (!k) return publicar("ic:casa", `🛋️ <b>${esc(N)}</b>, móveis da bancada: ${Object.values(MOVEIS).map((x) => esc(x.n)).join(", ")}. Ex: <b>!fazer sofá</b>` + url, L);
      const r = fazerMovel(L, N, k);
      if (r.erro === "jatem") return publicar("rancho:movel-" + k, `<b>${esc(N)}</b>, você já tem ${esc(MOVEIS[k].n)} na casinha`, L);
      if (r.erro === "falta") return publicar("rancho:bancada", `🛠️ <b>${esc(N)}</b>, falta para ${esc(MOVEIS[k].n)}: ${r.falta.map(esc).join(", ")}`, L);
      return publicar("rancho:movel-" + k, `🛠️ <b>${esc(N)}</b> fez <b>${esc(MOVEIS[k].n)}</b> na bancada e colocou na casinha! (${r.total}/${Object.keys(MOVEIS).length} móveis)`, L);
    }
  }
  if (USUM.aoMensagem && !site) setInterval(() => { if (!lider) return; try { rodadaOvos(); rodadaAmizade(); rodadaPedreira(); rodadaHorta(); rodadaApiario(); } catch (e) { console.error("[rancho]", e); } }, 60e3);
  // roda numa tela só: a líder na hora; se a líder estiver com o chat caído, outra tela assume depois de ~1,5 s
  function umaVezR(m, fn) {
    const k = (m.id || m.login + ":" + m.texto) + "", ler_ = () => ler("usum_rancho_feitos", []);
    const anotar = () => { const v = ler_(); v.push(k); gravar("usum_rancho_feitos", v.slice(-300)); };
    if (lider) { if (ler_().includes(k)) return; anotar(); fn(); return; }
    setTimeout(() => { if (ler_().includes(k)) return; anotar(); fn(); }, 1400 + Math.random() * 600);
  }
  if (USUM.aoMensagem && !site) USUM.aoMensagem((m) => {
    if (m.tipo) return;
    if (!lider) { const lw = String(m.texto || "").trim().toLowerCase(); if (CMD.test(lw) || /^!evento\s/.test(lw)) umaVezR(m, () => trata(m)); return; }
    umaVezR(m, () => trata(m));
  });
  function trata(m) {
    if (m.login) vistosR.set(m.login, Date.now());
    try {
      const lw = String(m.texto || "").trim().toLowerCase();
      if (/^!evento\s+(fim|parar)\b/.test(lw) && (m.dono || m.ajudante || m.mod)) fimDoFilme();   // não depende do pk_sessao (outra tela pode já ter encerrado o evento)
      else if (/^!evento\s+filme\b/.test(lw)) localStorage.removeItem("usum_cine_sessao");
      else anotarCinema(m);
      checkin(m);
    } catch (e) { console.error("[rancho]", e); }
    if (!m.texto || !CMD.test(String(m.texto).trim().toLowerCase())) return;
    try { comando(m); } catch (e) { console.error("[rancho]", e); }
  }

  // soltar Pokémon dá essência: 2 por Pokémon (5 se shiny)
  function essenciaPorSoltar(inds) { return (inds || []).reduce((a, x) => a + (x && x.s ? 5 : 2), 0); }
  function ganharEssencia(login, nome, n) { if (n > 0) mudarR(login, (r) => { if (nome) r.nm = nome; r.it.essencia = (r.it.essencia || 0) + n; }); return qtd(login, "essencia"); }
  USUM.rancho = { vistosR, checkin, ABELHAS, abelha, rodadaApiario, usarMel, pedirSelvagem, rodadaHorta, corDoPlantador, PARES, TIPOS_PEDREIRA, mineiro, rodadaPedreira, BOLHAS, bolhasDe, bolhaDe, darBolha, fimDoFilme, anotarCinema, forcaDe, fatorTempo, quemTrabalha, rodadaAmizade, temBordaRancho, minEstagio, porOvos, deixarNoDaycare, chocar, ovosVer, rodadaOvos, raiz, essenciaPorSoltar, ganharEssencia, ITENS, RECEITAS, MOVEIS, JOHTO, PEIXES, ESTAGIOS, CFG, urlItem, itemParaEvoluir, tiposDe, rancho, qtd, dar, aoCapturar, sortearItem,
    evoluir, ajudantes, forjar, plantar, colher, pescar, fazerMovel, estagioDe, acharItem, comando, ehComando: (low) => CMD.test(low) };
})();
