/* Chat Sol x Lua: duelo de equipes, retrato PMD de cada pessoa e reações */
(function () {
  window.USUM = window.USUM || {};
  const CFG = Object.assign({ maxMensagens: 14, sumirDepoisDeSegundos: 0, mostrarParceiro: true, esconderComandos: false, ignorar: [] },
    (window.USUM_CONFIG || {}).chat);
  const ignorar = CFG.ignorar.map((s) => s.toLowerCase());

  const ler = (k, pad) => { try { return JSON.parse(localStorage.getItem(k)) || pad; } catch (e) { return pad; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const times = () => ler("usum_times", {});
  const placar = () => ler("usum_placar", { sol: 0, lua: 0 });
  function primeiraVez(id) {
    const v = ler("usum_vistos", []); if (v.includes(id)) return false;
    v.push(id); gravar("usum_vistos", v.slice(-300)); return true;
  }
  function pontuar(time, pts, id) {
    if (!time || !primeiraVez(id + ":" + time)) return;
    const p = placar(); p[time] = (p[time] || 0) + pts; gravar("usum_placar", p);
  }
  // Várias telas do OBS recebem a mesma mensagem ao mesmo tempo. Para uma não sobrescrever a outra com dados velhos,
  // só UMA tela grava cada comando (as outras só mostram o aviso). Lê o valor mais novo na hora de gravar.
  // Uma tela vira a "líder" (trava do navegador): só ela grava. Se ela fechar, outra assume sozinha.
  let lider = false;
  const temTrava = !!(navigator.locks && navigator.locks.request);
  if (temTrava) navigator.locks.request("usum_lider", () => { lider = true; return new Promise(() => {}); }).catch(() => {});
  function umaVez(m, fn) {
    if (temTrava) { if (lider) fn(); return; }
    setTimeout(() => {
      const k = (m.id || m.texto) + "", v = ler("usum_cmd_feitos", []);
      if (v.includes(k)) return;
      v.push(k); gravar("usum_cmd_feitos", v.slice(-300));
      fn();
    }, 30 + Math.random() * 220);
  }
  function mudar(m, chave, fn) { umaVez(m, () => { const tudo = ler(chave, {}); fn(tudo); gravar(chave, tudo); }); }
  function mudarPerfil(m, fn) { mudar(m, "usum_perfil", (pf) => fn(pf[m.login] = pf[m.login] || {})); }
  USUM.umaVez = umaVez;
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); }
  // Pokémon de cada pessoa: escolhido com !pokemon, ou um de Alola sorteado pelo nome
  function parceiroDe(login) {
    const p = ler("usum_parceiros", {})[login];
    if (p && p.num) return p;
    return { num: 0, ovo: true, forma: "", shiny: false };   // ainda não escolheu parceiro: ovo
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));


  /* ---------- Filtro de apelidos: nada racista, preconceituoso, de ódio ou sexual ----------
     Compara sem acento, sem espaço e desfazendo truques (n1gg4 → nigga, v!ado → viado, letras repetidas).
     Para bloquear mais alguma palavra: config.js → apelidosProibidos: ["palavra", ...] */
  const PROIBIDO_PEDACO = [
    // racismo
    "nigg", "nigr", "negrinh", "neguinh", "macaco", "macaca", "crioul", "senzala", "escrav", "chink", "gook", "beaner", "wetback",
    "raghead", "towelhead", "bugre", "cabelodebombril", "cabeloruim", "pixaim", "tiziu", "picuma", "mulambo", "favelad",
    // nazismo e ódio
    "nazi", "hitler", "fuhrer", "fuehrer", "siegheil", "heilhitler", "holocaust", "auschwitz", "kukluxklan", "whitepower", "supremac", "suastica",
    "terroris", "taliban", "matapreto", "matagay", "matagays",
    // homofobia, transfobia, misoginia
    "viado", "viadinho", "veadinho", "boiola", "baitola", "sapatao", "sapatona", "traveco", "faggot", "tranny", "shemale",
    "vagabunda", "vadia", "whore", "slut", "bitch", "cunt",
    // capacitismo
    "retardad", "retard", "mongol", "aleijad", "debilmental",
    // sexual e palavrão pesado
    "estupr", "pedof", "pedophil", "incest", "porn", "xvideo", "onlyfans", "buceta", "boceta", "xoxota", "xereca", "piroca", "caralho",
    "penis", "vagina", "foder", "fodase", "fudid", "punheta", "siririca", "boquete", "gozad", "sexo", "orgia", "nude", "cuzao", "cuzinho",
    "arrombad", "fdp", "filhodaputa", "vsf", "vtnc", "pqp", "putinha",
    // morte e autoagressão
    "suicid", "semata", "killyourself", "massacre"
  ];
  // estas só valem como palavra inteira (para não pegar "computador", "raccoon", "bichano"...)
  const PROIBIDO_PALAVRA = ["cu", "fag", "kkk", "cp", "kys", "rape", "spic", "coon", "puta", "bicha", "nega", "nego", "tnc", "dyke", "nigga", "niga"];
  const normApelido = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[0@4]/g, (c) => ({ 0: "o", "@": "a", 4: "a" }[c])).replace(/[1!|]/g, "i").replace(/3/g, "e").replace(/[5$]/g, "s").replace(/7/g, "t").replace(/8/g, "b")
    .replace(/(.)\1+/g, "$1");
  USUM.apelidoProibido = function (t) {
    const extra = ((window.USUM_CONFIG || {}).apelidosProibidos || []).map((x) => normApelido(x).replace(/[^a-z]/g, ""));
    const bruto = String(t || "").toLowerCase();
    if (/1488|\b88\b|卐|卍/.test(bruto)) return true;
    const junto = normApelido(t).replace(/[^a-z]/g, "");
    const semRepetir = String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[0@4]/g, (c) => ({ 0: "o", "@": "a", 4: "a" }[c]))
      .replace(/[1!|]/g, "i").replace(/3/g, "e").replace(/[5$]/g, "s").replace(/7/g, "t").replace(/[^a-z]/g, "");
    const palavras = normApelido(t).replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean);
    const pedacos = PROIBIDO_PEDACO.map((x) => normApelido(x).replace(/[^a-z0-9]/g, "")).concat(extra);
    if (pedacos.some((x) => x && (junto.includes(x) || semRepetir.includes(x)))) return true;
    if (palavras.some((w) => PROIBIDO_PALAVRA.includes(w))) return true;
    return junto.length > 0 && PROIBIDO_PALAVRA.includes(junto);
  };

  /* ---------- Cartaz "Em breve no CineCDC" (lista do Letterboxd) ----------
     Nos comentários da lista, a dona escreve o filme e o @ de quem comprou, ex.:
        The Witches - @karina1009
     Quem comprou um filme da lista ganha balão especial no chat (e o do próximo filme ganha o mais chique). */
  const normal = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
  const semAno = (n) => String(n || "").replace(/\s*\(\d{4}\)\s*$/, "");
  USUM.ligarCompradores = function (filmes, comentarios) {
    filmes = (filmes || []).map((f) => Object.assign({}, f, { quem: [] }));
    const nomes = filmes.map((f) => [normal(semAno(f.nome)), normal(f.nome)]);
    (comentarios || []).forEach((c) => {
      let num = 0, antes = "";
      String(c).split(/\n+/).forEach((linha) => {
        linha = linha.trim(); if (!linha) return;
        const arrobas = [...linha.matchAll(/@([A-Za-z0-9_]{2,25})/g)].map((x) => x[1].toLowerCase());
        if (!arrobas.length) { if (/^\d{1,3}[.)º°]?$/.test(linha)) num = parseInt(linha, 10); else antes = linha; return; }
        let resto = normal(linha.replace(/@[A-Za-z0-9_]+/g, " ").replace(/^\s*\d{1,3}\s*[.)º°-]\s*/, ""));
        if (!resto) resto = normal(antes);
        let achou = -1, tam = 0;
        nomes.forEach(([n, comAno], i) => {
          if (!n) return;
          const ok = resto.startsWith(n) || resto.startsWith(comAno) || (resto.length >= 4 && n.startsWith(resto));
          if (ok && n.length > tam) { achou = i; tam = n.length; }
        });
        if (achou < 0 && num >= 1 && num <= filmes.length) achou = num - 1;   // "1" na linha de cima = 1º da lista
        if (achou >= 0) arrobas.forEach((l) => { if (!filmes[achou].quem.includes(l)) filmes[achou].quem.push(l); });
        num = 0; antes = "";
      });
    });
    return filmes;
  };
  USUM.lerCartaz = () => ler("usum_cartaz", {}).filmes || [];
  // filme passando agora: !filme nome (fica em usum_cinema.filme) ou o ?filme= da tela de watch party
  USUM.filmeAgora = () => ler("usum_cinema", {}).filme || USUM.filmePadrao || "";
  USUM.mesmoFilme = (a, b) => !!normal(semAno(a)) && normal(semAno(a)) === normal(semAno(b));
  // { filme, pos, agora, prox } de quem comprou um filme da lista
  USUM.compradorDe = (login) => {
    const l = String(login || "").toLowerCase(), fs = USUM.lerCartaz(), ag = USUM.filmeAgora();
    const iAgora = fs.findIndex((f) => USUM.mesmoFilme(f.nome, ag)), iProx = iAgora === 0 ? 1 : 0;
    for (let i = 0; i < fs.length; i++) if ((fs[i].quem || []).includes(l))
      return { filme: semAno(fs[i].nome), pos: i, agora: i === iAgora, prox: i === iProx };
    return null;
  };
  // acha o filme da lista pelo que foi digitado (!filme witches → The Witches)
  USUM.acharFilme = (t) => {
    const n = normal(t); if (!n) return null;
    const fs = USUM.lerCartaz();
    return fs.find((f) => normal(semAno(f.nome)) === n) || fs.find((f) => normal(semAno(f.nome)).startsWith(n))
      || (n.length >= 4 ? fs.find((f) => normal(f.nome).includes(n)) : null) || null;
  };
  let buscandoCartaz = null;
  USUM.atualizarCartaz = function (forcar) {
    const url = (window.USUM_CONFIG || {}).cartazLetterboxd;
    if (!url || buscandoCartaz) return buscandoCartaz || Promise.resolve(USUM.lerCartaz());
    buscandoCartaz = fetch("http://127.0.0.1:47321/cartaz?u=" + encodeURIComponent(url) + (forcar ? "&forcar=1" : ""), { cache: "no-store" })
      .then((r) => r.json()).then((j) => {
        if (j.ok && j.filmes && j.filmes.length) {
          const filmes = USUM.ligarCompradores(j.filmes, j.comentarios), velho = ler("usum_cartaz", {});
          if (JSON.stringify(velho.filmes) !== JSON.stringify(filmes)) gravar("usum_cartaz", { t: Date.now(), filmes });
        }
      }).catch(() => {}).then(() => { buscandoCartaz = null; return USUM.lerCartaz(); });
    return buscandoCartaz;
  };

  function textoComEmotes(m) {
    const chars = Array.from(m.texto);
    if (!m.emotes) return { html: esc(m.texto), soEmote: false };
    const tr = [];
    m.emotes.split("/").forEach((e) => {
      const [id, pos] = e.split(":"); if (!pos) return;
      pos.split(",").forEach((p) => { const [a, b] = p.split("-").map(Number); tr.push({ a, b, id }); });
    });
    tr.sort((x, y) => x.a - y.a);
    let html = "", i = 0, sobra = "";
    tr.forEach((t) => {
      const antes = chars.slice(i, t.a).join(""); html += esc(antes); sobra += antes;
      html += `<img class="emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(t.id)}/default/dark/2.0">`;
      i = t.b + 1;
    });
    const fim = chars.slice(i).join(""); html += esc(fim); sobra += fim;
    return { html, soEmote: !sobra.trim() };
  }

  USUM.parceiroDe = parceiroDe;
  // fita com brilho metalizado (o reflexo usa a própria imagem como máscara)
  function metal(url, cls) { return `<span class="metal ${cls || ""}"><img src="${url}" alt=""><i style="-webkit-mask-image:url('${url}');mask-image:url('${url}')"></i></span>`; }
  // corações de amizade quando a pessoa responde ou marca alguém
  function amizadeHtml(m, txt) {
    if (!USUM.amizade) return "";
    const alvo = m.respostaPara || ((txt.match(/@(\w+)/) || [])[1] || "").toLowerCase();
    if (!alvo || alvo === m.login) return "";
    const a = USUM.amizade(m.login, alvo); if (!a.pontos) return "";
    const nomeAlvo = m.respostaNome || (USUM.nomeTreinador ? USUM.nomeTreinador(alvo) : alvo);
    return `<div class="amizade nv${a.nivel}">${"♥".repeat(a.nivel)}<i>${"♥".repeat(5 - a.nivel)}</i><span>${a.nivel === 5 ? "Melhores amigos" : "Amizade"} com ${esc(nomeAlvo)}</span></div>`;
  }
  USUM.chat = function (el, opcoes) {
    opcoes = opcoes || {};
    const max = opcoes.max || CFG.maxMensagens;
    el.classList.add("chat");
    const cine = !!opcoes.cinema;   // modo cineminha (watch party): Gostei x Não gostei no lugar de Sol x Lua
    if (cine) el.classList.add("cinema");
    el.innerHTML = cine ? `
      <div class="duelo">
        <div class="lado sol"><div class="emblema"><img class="bola-voto" src="assets/bolas/love-ball.png" alt=""></div>
          <div class="info"><span class="rot">Gostei</span><b class="ps">0</b></div></div>
        <div class="vs">🎬</div>
        <div class="lado lua"><div class="info"><span class="rot">Não gostei</span><b class="pl">0</b></div>
          <div class="emblema"><img class="bola-voto" src="assets/bolas/black-sludge.png" alt=""></div></div>
        <div class="cabo"><div class="s"></div><div class="no"></div></div>
        <div class="dica"><b>!gostei</b> ou <b>!naogostei</b> pra votar no filme · <b>!pokemon</b> nome pro seu parceiro</div>
      </div>
      <div class="lista"></div>` : `
      <div class="duelo">
        <div class="lado sol"><div class="emblema"><img class="logo-sol" src="assets/logo-sol.png" alt=""></div>
          <div class="info"><span class="rot">Equipe Sol</span><b class="ps">0</b></div></div>
        <div class="vs">VS</div>
        <div class="lado lua"><div class="info"><span class="rot">Equipe Lua</span><b class="pl">0</b></div>
          <div class="emblema"><img class="logo-lua" src="assets/logo-lua.png" alt=""></div></div>
        <div class="cabo"><div class="s"></div><div class="no"></div></div>
        <div class="dica"><b>!sol</b> ou <b>!lua</b> pra escolher o lado · <b>!pokemon</b> nome pro seu parceiro</div>
      </div>
      <div class="lista"></div>`;
    const lista = el.querySelector(".lista");
    // só a tela de cinema pergunta pelo cartaz (o programa do PC lê o Letterboxd no máximo 1 vez por hora)
    if (!opcoes.espelho && opcoes.cinema) { USUM.atualizarCartaz(); setInterval(() => USUM.atualizarCartaz(), 60 * 60e3); }
    if (!opcoes.espelho && USUM.backup && USUM.backup.testeAtivo) {
      const selo = () => el.classList.toggle("em-teste", USUM.backup.testeAtivo());
      selo(); setInterval(selo, 2000);
    }

    // votos do cineminha: cada pessoa tem 1 voto (pode mudar); "sol" = gostei, "lua" = não gostei
    const votos = () => { const v = (ler("usum_cinema", {}).votos) || {}, p = { sol: 0, lua: 0 };
      Object.values(v).forEach((x) => { if (x === "g") p.sol++; else if (x === "n") p.lua++; }); return p; };
    const corDe = (login) => cine ? ({ g: "sol", n: "lua" }[((ler("usum_cinema", {}).votos) || {})[login]] || "") : (times()[login] || "");
    function atualizarPlacar() {
      const p = cine ? votos() : placar(), tot = p.sol + p.lua;
      const pct = tot ? Math.min(90, Math.max(10, (p.sol / tot) * 100)) : 50;
      el.querySelector(".cabo .s").style.width = pct + "%";
      el.querySelector(".cabo .no").style.left = pct + "%";
      el.querySelector(".ps").textContent = p.sol;
      el.querySelector(".pl").textContent = p.lua;
      el.classList.toggle("lider-sol", p.sol > p.lua);
      el.classList.toggle("lider-lua", p.lua > p.sol);
    }
    function pulsar(time) {
      const e = el.querySelector(".lado." + time);
      e.classList.remove("ponto"); void e.offsetWidth; e.classList.add("ponto");
    }
    atualizarPlacar();
    window.addEventListener("storage", (e) => { if (e.key === "usum_placar" || e.key === "usum_cinema") atualizarPlacar(); });
    if (cine) setInterval(atualizarPlacar, 2000);

    // avisos de fitas e amizade (vindos de fitas.js)
    if (USUM.aoFitaEvento) USUM.aoFitaEvento((ev) => {
      const f = (USUM.FITAS || []).find((x) => x.id === ev.id) || {};
      const d = document.createElement("div");
      if (ev.tipo === "fita" && ev.silenciosa) {
        // selinho "nova fita" no último cartão da pessoa
        const cartoes = lista.querySelectorAll('.msg[data-login="' + ev.login + '"]');
        const c = cartoes[cartoes.length - 1];
        if (c) c.querySelector(".quem").insertAdjacentHTML("beforeend", `<span class="selo-fita"><img src="${USUM.urlFita(ev.id)}">${esc(f.nome || "")}</span>`);
        return;
      }
      if (ev.tipo === "fita") {
        d.className = "aviso fita-nova";
        d.innerHTML = `${metal(USUM.urlFita(ev.id), "fita-ico")}<span class="t"><b>${esc(ev.nome)}</b> ganhou a <b>${esc(f.nome || ev.id)}</b>!</span>`;
      } else if (ev.tipo === "escolha") {
        d.className = "aviso fita-nova";
        d.innerHTML = `${metal(USUM.urlFita(ev.id), "fita-ico")}<span class="t"><b>${esc(ev.nome)}</b> agora exibe a ${esc(f.nome || ev.id)}</span>`;
      } else if (ev.tipo === "naotem") {
        d.className = "aviso";
        d.innerHTML = `<img class="fita-ico apagada" src="${USUM.urlFita(ev.id)}"><span class="t"><b>${esc(ev.nome)}</b>, você ainda não tem a ${esc(f.nome || ev.id)}</span>`;
      } else if (ev.tipo === "amizade") {
        d.className = "aviso amizade-nova";
        d.innerHTML = `<span class="coracoes">${"♥".repeat(ev.nivel)}</span><span class="t"><b>${esc(ev.nomeA)}</b> e <b>${esc(ev.nomeB)}</b> ${ev.nivel === 5 ? "agora são <b>Melhores Amigos!</b>" : "subiram a amizade pro nível " + ev.nivel}</span>`;
      } else if (ev.tipo === "painel") {
        d.className = "painel-fitas";
        const tem = new Set(ev.fitas);
        d.innerHTML = `<div class="pf-cab"><b>${esc(ev.nome)}</b><span>${ev.fitas.length}/${ev.total} fitas</span></div><div class="pf-grade">` +
          (USUM.FITAS || []).map((x) => `<img class="${tem.has(x.id) ? "" : "falta"}" src="${USUM.urlFita(x.id)}" alt="">`).join("") + "</div>";
      } else if (ev.tipo === "party") {
        if (lista.querySelector(`.party-ok[data-t="${CSS.escape(ev.texto)}"]`)) return;   // já mostrado
        d.className = "aviso party-ok"; d.dataset.t = ev.texto; d.innerHTML = `<span class="t">✓ ${esc(ev.texto)}</span>`;
        setTimeout(() => d.remove(), 7000);
      } else if (ev.tipo === "selvagem") {
        d.className = "aviso selvagem" + (ev.lendario ? " lendario" : "") + (ev.shiny ? " shiny" : "");
        const im = USUM.imgPokemon({ num: ev.num, forma: "", shiny: ev.shiny }, "Surprised"); im.className = "ret"; d.appendChild(im);
        d.insertAdjacentHTML("beforeend", `<span class="t">Um <b>${esc(ev.nome)}</b>${ev.shiny ? " ✦ shiny" : ""} ${ev.lendario ? "lendário" : "selvagem"} apareceu! Digite <b>!capturar</b></span>`);
      } else if (ev.tipo === "captura") {
        d.className = "aviso captura" + (ev.shiny ? " shiny" : "");
        const im = USUM.imgPokemon({ num: ev.num, forma: "", shiny: ev.shiny }, "Joyous"); im.className = "ret"; d.appendChild(im);
        const q = ev.quem || [], nomes = q.slice(0, 3).map(esc).join(", ") + (q.length > 3 ? " e +" + (q.length - 3) : "");
        const fz = q.length === 1 && ev.forcas && ev.forcas.length && USUM.selvagens ? ` <small class="forca">força ${ev.forcas[0]}% · ${USUM.selvagens.nota(ev.forcas[0])}</small>` : "";
        d.insertAdjacentHTML("beforeend", `<span class="t">Gotcha! <b>${nomes}</b> ${q.length > 1 ? "capturaram" : "capturou"} ${esc(ev.nome)}${ev.shiny ? " ✦" : ""}!${fz}</span>`);
      } else if (ev.tipo === "fugiu") {
        d.className = "aviso";
        const im = USUM.imgPokemon({ num: ev.num, forma: "", shiny: ev.shiny }, "Normal"); im.className = "ret"; d.appendChild(im);
        d.insertAdjacentHTML("beforeend", `<span class="t">${esc(ev.nome)} ${ev.tentaram ? "escapou!" : "voltou pro mato…"}</span>`);
      } else if (ev.tipo === "caixacheia") {
        if (lista.querySelector(`.cheia[data-l="${CSS.escape(ev.login)}"]`)) return;
        d.className = "aviso cheia"; d.dataset.l = ev.login;
        d.innerHTML = `<span class="t">📦 <b>${esc(ev.nome)}</b>, você já tem ${ev.limite} ${esc(ev.pnome || "")} (o máximo de cada Pokémon). Solte o mais fraco com <b>!release ${esc((ev.pnome || "nome").toLowerCase())}</b> para capturar outro</span>`;
      } else if (ev.tipo === "surto") {
        d.className = "aviso surto";
        d.innerHTML = ev.modo === "rapido"
          ? `<span class="t">🌿⚡ <b>Surto de Pokémon!</b> Por ${ev.min} min eles aparecem na grama <b>60% mais rápido</b></span>`
          : `<span class="t">🗺️ <b>Surto de ${esc(ev.nome)}!</b> Por ${ev.min} min, Pokémon de ${esc(ev.nome)} aparecem <b>60% mais</b> na grama</span>`;
      } else if (ev.tipo === "surtofim") {
        d.className = "aviso";
        d.innerHTML = `<span class="t">🌿 ${ev.modo === "regiao" ? `O surto de ${esc(ev.nome || "")} acabou` : ev.modo === "rapido" ? "O surto rápido acabou" : "Os surtos acabaram"}. Tudo volta ao normal</span>`;
      } else if (ev.tipo === "surtoajuda") {
        d.className = "aviso";
        d.innerHTML = `<span class="t">Surtos de 1 hora: <b>!surto rapido</b> (aparecem 60% mais rápido) · <b>!surto kanto</b> (johto, hoenn, sinnoh, unova, kalos, alola) · <b>!surto fim</b></span>`;
      } else if (ev.tipo === "chamou") {
        d.className = "aviso"; d.innerHTML = `<span class="ico sol-ico"></span><span class="t"><b>${esc(ev.nome)}</b> balançou a grama… 🌿</span>`;
      } else if (ev.tipo === "registrando") {
        d.className = "aviso"; d.innerHTML = `<span class="t">Resgate agora a recompensa <b>${esc(ev.nomeRecompensa || "")}</b> para registrar (2 min)</span>`;
      } else if (ev.tipo === "recompensaok") {
        d.className = "aviso"; d.innerHTML = `<span class="t">Recompensa <b>${esc(ev.nomeRecompensa || "")}</b> registrada ✓</span>`;
      } else if (ev.tipo === "comprou") {
        d.className = "aviso " + (times()[ev.login] || "");
        d.innerHTML = `<img class="ret bola" src="${USUM.urlBola(ev.bola)}"><span class="t"><b>${esc(ev.nome)}</b> comprou uma ${USUM.BOLAS[ev.bola]}! (tem ${ev.qtd}, já equipada)</span>`;
      } else if (ev.tipo === "evoluiu") {
        d.className = "aviso captura" + (ev.shiny ? " shiny" : "");
        const im = USUM.imgPokemon({ num: ev.num, forma: "", shiny: ev.shiny }, "Joyous"); im.className = "ret"; d.appendChild(im);
        d.insertAdjacentHTML("beforeend", `<span class="t">O ${esc(ev.de)} de <b>${esc(ev.nome)}</b> evoluiu para <b>${esc(ev.para)}</b>!</span>`);
      } else if (ev.tipo === "naoevolui") {
        d.className = "aviso";
        d.innerHTML = `<span class="t"><b>${esc(ev.nome)}</b>, ${ev.motivo === "semparceiro" ? "escolha um parceiro com !pokemon antes de evoluir" : ev.motivo === "cheio" ? "você já tem " + (ev.limite || 5) + " " + esc(ev.pnome || "") + ", solte um antes de evoluir" : esc(ev.pnome || "") + " não evolui mais"} (o streamer pode devolver os pontos)</span>`;
      } else if (ev.tipo === "autooff" || ev.tipo === "autoon") {
        d.className = "aviso"; d.innerHTML = `<span class="t">Pokémon selvagens automáticos ${ev.tipo === "autoon" ? "ligados" : "desligados"}</span>`;
      } else if (ev.tipo === "eventoon") {
        const NOMES_EV = { filme: "Live de filme", conversa: "Just Chatting", dupla: "Live em dupla", zerou: "Zeramos o jogo!", aniversario: "Aniversário do canal", shiny: "Apareceu um shiny!", especial: "Live especial" };
        d.className = "aviso fita-nova evento-on";
        d.innerHTML = `${metal(USUM.urlFita(ev.id), "fita-ico")}<span class="t"><span class="ev-tit">🎉 Evento: ${esc(NOMES_EV[ev.nome] || f.nome || ev.id)}</span>Quem falar no chat nesta live ganha a <b>${esc(f.nome || ev.id)}</b>!${ev.presentes ? ` <small>(${ev.presentes} já ${ev.presentes === 1 ? "ganhou" : "ganharam"})</small>` : ""}</span>`;
      } else if (ev.tipo === "eventooff") {
        d.className = "aviso"; d.innerHTML = `<span class="t">Evento encerrado. Obrigado a todo mundo que participou! 💜</span>`;
      } else return;
      adicionar(d);
    });
    setInterval(atualizarPlacar, 3000);

    function adicionar(no) {
      lista.appendChild(no);
      while (lista.children.length > max) lista.firstElementChild.remove();
      if (CFG.sumirDepoisDeSegundos > 0) setTimeout(() => { no.classList.add("sai"); setTimeout(() => no.remove(), 600); }, CFG.sumirDepoisDeSegundos * 1000);
    }
    function aviso(time, html, poke) {
      const d = document.createElement("div");
      d.className = "aviso " + (time || "");
      if (poke) { const im = USUM.imgPokemon(poke, "Happy"); im.className = "ret"; d.appendChild(im); }
      else d.insertAdjacentHTML("beforeend", time === "lua" ? '<span class="ico lua-ico"></span>' : '<span class="ico sol-ico"></span>');
      d.insertAdjacentHTML("beforeend", `<span class="t">${html}</span>`);
      adicionar(d);
    }

    USUM.aoMensagem((m) => {
      if (m.tipo === "limpar") {
        if (m.login) lista.querySelectorAll(`.msg[data-login="${CSS.escape(m.login)}"]`).forEach((x) => x.remove());
        else if (m.msgId !== undefined) { if (m.msgId) lista.querySelectorAll(`.msg[data-id="${CSS.escape(m.msgId)}"]`).forEach((x) => x.remove()); }
        else lista.innerHTML = "";
        return;
      }
      if (m.tipo === "status") {   // confirma na tela que o chat conectou (some sozinho)
        const d = document.createElement("div"); d.className = "aviso";
        d.innerHTML = `<span class="t">${m.ok ? "✓ Chat conectado: <b>#" + esc(m.canal) + "</b>" : "⚠ Configure o nome do canal no config.js"}</span>`;
        adicionar(d); setTimeout(() => d.remove(), 8000); return;
      }
      if (m.tipo) return; // eventos (sub, presente...) são tratados pelas fitas
      if (ignorar.includes(m.login)) return;
      const txt = m.texto.trim(), low = txt.toLowerCase(), cmd = low.split(/\s+/)[0];
      // modo espelho (chat no site): comandos não mexem em nada, só quem chamou decide
      if (opcoes.espelho && txt.startsWith("!")) { if (opcoes.aoComando) opcoes.aoComando(m, cmd, txt, aviso); return; }

      // cineminha: votar no filme (funciona em qualquer tela; o placar aparece no chat de cinema)
      if (cmd === "!gostei" || cmd === "!naogostei" || cmd === "!nãogostei" || (cmd === "!nao" && /^!n[aã]o\s+gostei/i.test(txt))) {
        const v = cmd === "!gostei" ? "g" : "n";
        const antes = ((ler("usum_cinema", {}).votos) || {})[m.login];
        mudar(m, "usum_cinema", (x) => { x.votos = x.votos || {}; x.votos[m.login] = v; });
        if (cine && antes !== v) {
          const tudo = ler("usum_cinema", {}); tudo.votos = tudo.votos || {}; tudo.votos[m.login] = v;   // mostra na hora nesta tela
          setTimeout(atualizarPlacar, 300); pulsar(v === "g" ? "sol" : "lua");
          aviso(v === "g" ? "sol" : "lua", `<b>${esc(m.nome)}</b> ${v === "g" ? "gostou do filme 💖" : "não curtiu o filme 🖤"}`);
        }
        return;
      }
      // live de teste: !teste liga (tira uma foto de tudo) · !teste fim apaga tudo que aconteceu e volta como era
      if (cmd === "!teste" && (m.dono || m.ajudante) && USUM.backup && USUM.backup.comecarTeste) {
        const fim = /^(fim|off|acabar|acabou|parar|desligar)$/i.test(txt.split(/\s+/)[1] || "");
        if (fim) {
          aviso("", `🧪 Fim da live de teste: apagando tudo que aconteceu e voltando como era antes…`);
          umaVez(m, async () => { const r = await USUM.backup.terminarTeste();
            if (r === "nao") aviso("", `🧪 Não tinha live de teste ligada.`);
            if (r === "erro") aviso("", `⚠ Não achei a foto de antes do teste. Nada foi apagado. Abra o backup.html para restaurar na mão.`); });
        } else {
          aviso("", `🧪 <b>Live de teste ligada!</b> Pode capturar, trocar, ganhar fita… no fim tudo some. Para apagar: <b>!teste fim</b>`);
          umaVez(m, async () => { const r = await USUM.backup.comecarTeste();
            if (r === "ja") aviso("", `🧪 A live de teste já estava ligada.`);
            if (r === "erro") aviso("", `⚠ Não consegui guardar a foto de antes. O teste NÃO foi ligado: abra o programa de backup do PC e tente de novo.`); });
        }
        return;
      }
      // !atualizarcartaz → relê a lista do Letterboxd agora (mudou a lista ou os @ de quem comprou)
      // (o !cartaz normal é do bot da live, para o povo ver o cartaz: não mexemos nele)
      if (cmd === "!atualizarcartaz" && (m.dono || m.ajudante || m.mod)) {
        if (cine) aviso("", `🎞 Atualizando o cartaz do Letterboxd…`);
        umaVez(m, () => USUM.atualizarCartaz(true));
        return;
      }
      // !filme The Witches → é esse que está passando (quem comprou ganha o brilho dourado). Filme diferente zera a votação.
      if (cmd === "!filme" && (m.dono || m.ajudante || m.mod)) {
        const arg = txt.slice(cmd.length).trim();
        if (!arg) { if (cine) aviso("", `🎬 Use <b>!filme nome do filme</b> (ou <b>!filme fim</b>)`); return; }
        if (/^(fim|limpar|nenhum|parar)$/i.test(arg)) { mudar(m, "usum_cinema", (x) => { delete x.filme; }); if (cine) aviso("", `🎬 Sessão encerrada`); return; }
        const f = USUM.acharFilme(arg), nome = f ? semAno(f.nome) : arg;
        const novo = !USUM.mesmoFilme(nome, USUM.filmeAgora());
        mudar(m, "usum_cinema", (x) => { x.filme = nome; if (novo) x.votos = {}; });
        if (cine) {
          setTimeout(atualizarPlacar, 400);
          const quem = f && (f.quem || []).length ? ` · escolhido por <b>@${f.quem.map(esc).join(", @")}</b> ✨` : "";
          aviso("", `🎬 Agora passando: <b>${esc(nome)}</b>${quem}${novo ? " · votem com <b>!gostei</b> ou <b>!naogostei</b>" : ""}`);
        }
        return;
      }
      if (cmd === "!cinema" && (m.dono || m.ajudante || m.mod) && /^(zerar|limpar|novo)$/i.test(txt.split(/\s+/)[1] || "")) {
        mudar(m, "usum_cinema", (x) => { x.votos = {}; });
        if (cine) { setTimeout(atualizarPlacar, 400); aviso("", `🎬 Votação zerada: novo filme, votem de novo com <b>!gostei</b> ou <b>!naogostei</b>!`); }
        return;
      }
      if (cmd === "!sol" || cmd === "!lua") {
        const time = cmd.slice(1), t = times();
        // escolheu a equipe nesta live? só pode trocar na próxima
        const hoje = (ler("pk_sessao", {}) || {}).dia || new Date().toLocaleDateString("sv");
        const travas = ler("usum_times_dia", {});
        if (t[m.login] && t[m.login] !== time && travas[m.login] === hoje) {
          aviso(t[m.login], `<b>${esc(m.nome)}</b>, você já está na Equipe ${t[m.login] === "sol" ? "Sol" : "Lua"} nesta live. Dá para trocar na próxima!`);
          return;
        }
        if (t[m.login] !== time) {
          t[m.login] = time; mudar(m, "usum_times", (x) => (x[m.login] = time)); pontuar(time, 3, m.id); pulsar(time);
          mudar(m, "usum_times_dia", (x) => (x[m.login] = hoje));
          aviso(time, `<b>${esc(m.nome)}</b> entrou para a Equipe ${time === "sol" ? "Sol" : "Lua"}!`);
        }
        atualizarPlacar(); return;
      }
      if (cmd === "!pokemon" || cmd === "!parceiro") {
        const p = USUM.lerPokemon(txt.slice(cmd.length));
        if (p) {
          const SV = USUM.selvagens, livre = m.dono || USUM.modoDemo || !SV;
          // só iniciais de Alola, Pikachu, Eevee, Clefairy ou Pokémon que a pessoa capturou; shiny só se capturou shiny
          if (!livre && !SV.pode(m.login, p.num, false)) {
            aviso(times()[m.login], `<b>${esc(m.nome)}</b>, você ainda não capturou ${esc(p.nome)}! Capture quando aparecer na grama 🌿`, Object.assign({}, p, { shiny: false }));
            return;
          }
          // iniciais (Rowlet, Litten, Popplio, Pikachu, Eevee, Clefairy): 10% de vir shiny. O sorteio é fixo por pessoa e por
          // Pokémon (não adianta repetir o comando) e dá o mesmo resultado em todas as telas do OBS
          const chanceIni = ((window.USUM_CONFIG || {}).selvagens || {}).chanceShinyInicial ?? 0.1;
          const sorteado = !!(SV && SV.iniciais.has(p.num) && (hash(m.login + ":" + p.num + ":inicial") % 1000) < chanceIni * 1000);
          p.shiny = !!((p.shiny && (livre || SV.pode(m.login, p.num, true))) || sorteado);
          const novo = { num: p.num, forma: p.forma, shiny: p.shiny }; mudar(m, "usum_parceiros", (x) => (x[m.login] = novo));
          // o inicial escolhido vai para a Pokédex da pessoa (com status sorteados), uma vez só por espécie
          let ganhou = false;
          if (SV && SV.iniciais.has(p.num) && !SV.individuos(m.login, p.num).length && !((ler("usum_iniciais_ganhos", {})[m.login] || []).includes(p.num))) {
            ganhou = true;
            umaVez(m, () => {
              const g = ler("usum_iniciais_ganhos", {}); g[m.login] = g[m.login] || [];
              if (g[m.login].includes(p.num) || SV.individuos(m.login, p.num).length) return;
              g[m.login].push(p.num); gravar("usum_iniciais_ganhos", g);
              SV.guardar(m.login, m.nome, p.num, p.shiny);
            });
          }
          if (ganhou) setTimeout(() => {
            const ind = SV.individuos(m.login, p.num)[0];
            if (ind) aviso(times()[m.login], `📘 ${esc(p.nome)}${p.shiny ? " ✦" : ""} entrou na Pokédex de <b>${esc(m.nome)}</b> · força ${SV.forcaIV(ind.iv)}% (${SV.nota(SV.forcaIV(ind.iv))})`, p);
          }, 900);
          aviso(times()[m.login], sorteado ? `<b>${esc(m.nome)}</b> escolheu ${esc(p.nome)} e ele veio ✨ <b>SHINY</b>! (só ${Math.round(chanceIni * 100)}% de chance)`
            : `<b>${esc(m.nome)}</b> escolheu ${esc(p.nome)}${p.shiny ? " ✦ shiny" : ""}!`, p);
        } else if (txt.slice(cmd.length).trim()) {
          aviso(times()[m.login], `<b>${esc(m.nome)}</b>, não achei esse Pokémon 🤔 confere o nome em inglês (ex: !pokemon popplio)`, parceiroDe(m.login));
        }
        return;
      }
      if ((cmd === "!ball" || cmd === "!bola" || cmd === "!pokebola") && !/^\d/.test(txt.split(/\s+/)[1] || "")) {
        const b = USUM.lerBola(txt.split(/\s+/).slice(1).join(" "));
        if (!b) return;
        const SV = USUM.selvagens;
        if (SV && SV.COMPRAVEIS.includes(b)) {
          // Great, Ultra, Quick e Master: só quem comprou com pontos do canal
          if (!USUM.modoDemo && !(SV.mochila(m.login)[b] > 0)) {
            aviso("", `<b>${esc(m.nome)}</b>, você não tem ${USUM.BOLAS[b]}. Compre com pontos do canal!`); return;
          }
        } else if (b !== "poke" && !(m.sub || m.dono || m.ajudante)) { aviso("", `Pokébolas especiais são só pra subs ✦`); return; }
        mudar(m, "usum_bolas", (x) => (x[m.login] = b));
        const d = document.createElement("div"); d.className = "aviso " + (times()[m.login] || "");
        d.innerHTML = `<img class="ret bola" src="${USUM.urlBola(b)}"><span class="t"><b>${esc(m.nome)}</b> agora usa a ${USUM.BOLAS[b]}!</span>`;
        adicionar(d); return;
      }
      if ((cmd === "!caixa" || cmd === "!box" || cmd === "!pokedex") && USUM.selvagens) {
        const r = USUM.selvagens.resumoCaixa(m.login);
        const ult = r.ultimo ? { num: r.ultimo, forma: "", shiny: false } : null;
        aviso(times()[m.login], r.especies
          ? `<b>${esc(m.nome)}</b> já capturou <b>${r.especies}</b> ${r.especies === 1 ? "espécie" : "espécies"} (${r.total} no total${r.shiny ? ", " + r.shiny + " shiny" : ""}${r.lendarios ? ", " + r.lendarios + " lendário" + (r.lendarios > 1 ? "s" : "") : ""})`
          : `<b>${esc(m.nome)}</b> ainda não capturou nenhum. Fique de olho na grama 🌿`, ult);
        if (USUM.pokedexUrl) aviso(times()[m.login], `Veja tudo na sua Pokédex: <b>${esc(USUM.pokedexUrl.replace(/^https?:\/\//, ""))}</b> (ou digite !pokedex)`);
        return;
      }
      /* ---- troca entre treinadores: !trade @pessoa meu [por dela] → !trade aceitar / recusar ---- */
      if ((cmd === "!trade" || cmd === "!troca" || cmd === "!trocar") && USUM.selvagens && !/^\d/.test(txt.split(/\s+/)[1] || "")) {
        const SV = USUM.selvagens, t = times()[m.login], arg = txt.slice(cmd.length).trim();
        const EVO_TROCA = { 64: 65, 67: 68, 75: 76, 93: 94, 525: 526, 533: 534, 708: 709, 710: 711 };
        const nm = (n, sh) => USUM.nomeDe(n) + (sh ? " ✦" : "");
        const tem = (login, p) => !!SV.escolher(SV.individuos(login, p.num), p.qual, p.shiny);
        const pend = ler("usum_trocas", {});
        const ajuda = () => aviso(t, `Troca: <b>!trade @pessoa seu_pokemon por pokemon_dela</b> (ex: !trade @ana pikachu por eevee). Quem recebe responde <b>!trade aceitar</b> ou <b>!trade recusar</b>`);
        if (!arg) { ajuda(); return; }
        const acao = arg.split(/\s+/)[0].toLowerCase();
        if (/^(aceitar|aceito|sim|ok)$/.test(acao)) {
          const pd = pend[m.login];
          if (!pd || Date.now() > pd.ate) { aviso(t, `<b>${esc(m.nome)}</b>, você não tem nenhuma troca esperando`); return; }
          let quero = pd.quero;
          if (!quero) {
            const resto = arg.split(/\s+/).slice(1).join(" "), k = resto.match(/^(.*?)\s+(\d+)$/);
            const p = USUM.lerPokemon(k ? k[1] : resto);
            if (!p) { aviso(t, `<b>${esc(m.nome)}</b>, diga qual Pokémon você dá em troca: <b>!trade aceitar eevee</b>`); return; }
            quero = { num: p.num, shiny: !!p.shiny, qual: k ? +k[2] : null };
          }
          if (!tem(pd.de, pd.dou)) { aviso(t, `${esc(pd.nomeDe)} não tem mais ${esc(nm(pd.dou.num, pd.dou.shiny))}. Troca cancelada`); mudar(m, "usum_trocas", (x) => delete x[m.login]); return; }
          if (!tem(m.login, quero)) { aviso(t, `<b>${esc(m.nome)}</b>, você não tem ${esc(nm(quero.num, quero.shiny))} para trocar`); return; }
          {
            const evo0 = (n) => EVO_TROCA[n] || n, chegaEu = evo0(pd.dou.num), chegaEle = evo0(quero.num);
            if (chegaEu !== quero.num && SV.cheio(m.login, chegaEu)) { aviso(t, `<b>${esc(m.nome)}</b>, você já tem o máximo de ${esc(USUM.nomeDe(chegaEu))}. Solte um antes de trocar`); return; }
            if (chegaEle !== pd.dou.num && SV.cheio(pd.de, chegaEle)) { aviso(t, `${esc(pd.nomeDe)} já tem o máximo de ${esc(USUM.nomeDe(chegaEle))}. Troca cancelada`); return; }
          }
          // quem recebe o quê (com evolução por troca)
          const parEsp = (pd.dou.num === 588 && quero.num === 616) || (pd.dou.num === 616 && quero.num === 588);
          const evo = (n) => (parEsp ? { 588: 589, 616: 617 }[n] : EVO_TROCA[n]) || n;
          const recebeEu = evo(pd.dou.num), recebeEle = evo(quero.num);
          const nomeEle = pd.nomeDe;
          umaVez(m, () => {
            const a1 = SV.tirarUm(pd.de, pd.dou.num, pd.dou.shiny, pd.dou.qual), a2 = SV.tirarUm(m.login, quero.num, quero.shiny, quero.qual);
            if (!a1 || !a2) return;
            SV.guardar(m.login, m.nome, recebeEu, !!a1.ind.s, a1.ind.iv, a1.ind.a);   // o Pokémon chega com os mesmos status (e o apelido)
            SV.guardar(pd.de, nomeEle, recebeEle, !!a2.ind.s, a2.ind.iv, a2.ind.a);
            const pa = ler("usum_parceiros", {});   // se deu o último da espécie que era o parceiro, vira ovo
            if (a1.acabou && pa[pd.de] && pa[pd.de].num === pd.dou.num) delete pa[pd.de];
            if (a2.acabou && pa[m.login] && pa[m.login].num === quero.num) delete pa[m.login];
            gravar("usum_parceiros", pa);
            if (USUM.somarAmizade) USUM.somarAmizade(pd.de, nomeEle, m.login, m.nome, 5);
            const rp = ler("usum_reputacao", {});
            [pd.de, m.login].forEach((l) => { const r = rp[l] = rp[l] || {}; r.tr = (r.tr || 0) + 1; });
            gravar("usum_reputacao", rp);
            const r = ler("usum_trocas", {}); delete r[m.login]; gravar("usum_trocas", r);
          });
          const ev = (de, para) => (de !== para ? ` (e evoluiu para <b>${esc(USUM.nomeDe(para))}</b>!)` : "");
          aviso(t, `🔁 Troca feita! <b>${esc(m.nome)}</b> recebeu ${esc(nm(pd.dou.num, pd.dou.shiny))}${ev(pd.dou.num, recebeEu)} e <b>${esc(nomeEle)}</b> recebeu ${esc(nm(quero.num, quero.shiny))}${ev(quero.num, recebeEle)} · amizade +5 ♥`,
            { num: recebeEu, forma: "", shiny: !!pd.dou.shiny });
          return;
        }
        if (/^(recusar|recuso|nao|não|n)$/.test(acao)) {
          const pd = pend[m.login]; if (!pd) return;
          mudar(m, "usum_trocas", (x) => delete x[m.login]);
          aviso(t, `<b>${esc(m.nome)}</b> recusou a troca de ${esc(pd.nomeDe)}`); return;
        }
        if (/^(cancelar|cancela)$/.test(acao)) {
          const meu = Object.keys(pend).find((k) => pend[k].de === m.login); if (!meu) return;
          mudar(m, "usum_trocas", (x) => delete x[meu]);
          aviso(t, `<b>${esc(m.nome)}</b> cancelou a troca`); return;
        }
        // proposta
        const alvoM = arg.match(/^@?(\w+)\s+(.+)$/);
        if (!alvoM) { ajuda(); return; }
        const alvo = alvoM[1].toLowerCase();
        if (alvo === m.login) { aviso(t, `Não dá pra trocar com você mesmo 😅`); return; }
        const [ladoA, ladoB] = alvoM[2].split(/\s+(?:por|pelo|pela|for)\s+/i);
        const numDe = (x) => { const k = (x || "").match(/^(.*?)\s+(\d+)$/); return k ? [k[1], +k[2]] : [x || "", null]; };
        const [txtA, qA] = numDe(ladoA), [txtB, qB] = numDe(ladoB);
        const dou = USUM.lerPokemon(txtA), quero = ladoB ? USUM.lerPokemon(txtB) : null;
        if (dou) dou.qual = qA; if (quero) quero.qual = qB;
        if (!dou || (ladoB && !quero)) { ajuda(); return; }
        if (!tem(m.login, dou)) { aviso(t, `<b>${esc(m.nome)}</b>, você não tem ${esc(dou.nome)}${dou.shiny ? " shiny" : ""} para trocar`); return; }
        const outra = pend[alvo];
        if (outra && Date.now() < outra.ate && outra.de !== m.login) { aviso(t, `${esc(alvo)} já tem uma troca esperando resposta. Tente daqui a pouco`); return; }
        const nomeAlvo = USUM.nomeTreinador ? USUM.nomeTreinador(alvo) : alvo;
        const prop = { de: m.login, nomeDe: m.nome, dou: { num: dou.num, shiny: !!dou.shiny, qual: dou.qual }, quero: quero ? { num: quero.num, shiny: !!quero.shiny, qual: quero.qual } : null, ate: Date.now() + 120000 };
        const indDou = SV.escolher(SV.individuos(m.login, dou.num), dou.qual, dou.shiny);
        if (!indDou) { aviso(t, `<b>${esc(m.nome)}</b>, não achei esse ${esc(dou.nome)} (veja os números na sua Pokédex do site)`); return; }
        prop.dou.forca = SV.forcaIV(indDou.iv);
        mudar(m, "usum_trocas", (x) => (x[alvo] = prop));
        aviso(t, `📦 <b>${esc(nomeAlvo)}</b>, ${esc(m.nome)} quer trocar ${esc(nm(dou.num, dou.shiny))} <small>(força ${prop.dou.forca}%)</small> ` +
          (quero ? `pelo seu ${esc(nm(quero.num, quero.shiny))}! Responda <b>!trade aceitar</b> ou <b>!trade recusar</b>` : `com você! Responda <b>!trade aceitar nome_do_seu_pokemon</b> ou <b>!trade recusar</b>`) + ` (2 min)`,
          { num: dou.num, forma: "", shiny: !!dou.shiny });
        return;
      }
      /* ---- release: solta um Pokémon (o mais fraco, um número da lista do site, ou todos da espécie) ---- */
      // !showname / !mostrarnome → mostra o apelido do parceiro embaixo da fotinha · !hidename / !escondernome → esconde
      if (["!showname", "!mostrarnome", "!hidename", "!escondernome"].includes(cmd) || (cmd === "!showname" && /off|nao|não/i.test(txt))) {
        const mostrar = (cmd === "!showname" || cmd === "!mostrarnome") && !/\b(off|nao|não|desligar)\b/i.test(txt);
        mudarPerfil(m, (e) => { if (mostrar) e.mn = 1; else delete e.mn; });
        aviso(times()[m.login], mostrar ? `<b>${esc(m.nome)}</b>, agora o apelido do seu parceiro aparece na sua fotinha 🏷️ (para esconder: <b>!hidename</b>)`
          : `<b>${esc(m.nome)}</b>, o apelido do seu parceiro não aparece mais na fotinha`);
        return;
      }
      /* ---- apelido dos Pokémon capturados: !apelido pikachu Faísca · !apelido pikachu 2 Faísca · !apelido pikachu limpar
         (o !apelido 3 Nome, com número primeiro, continua sendo o da party da live) */
      if ((cmd === "!apelido" || cmd === "!nome" || cmd === "!nick") && USUM.selvagens && !/^\d/.test(txt.split(/\s+/)[1] || "")) {
        const SV = USUM.selvagens, t = times()[m.login], tk = txt.split(/\s+/).slice(1);
        const ajuda = `Use <b>!apelido pikachu Faísca</b> (ou <b>!apelido pikachu 2 Faísca</b> para o nº 2 da lista do site) · para tirar: <b>!apelido pikachu limpar</b>`;
        // o nome do Pokémon pode ter até 3 palavras (mr mime, tapu koko): pega o maior pedaço que a pessoa tem
        let p = null, usou = 0;
        for (let k = Math.min(3, tk.length - 1); k >= 1 && !p; k--) {
          const x = USUM.lerPokemon(tk.slice(0, k).join(" ").replace(/\*$/, ""));
          if (x && SV.individuos(m.login, x.num).length) { p = x; usou = k; }
        }
        if (!p) {
          const x = tk.length ? USUM.lerPokemon(tk[0]) : null;
          aviso(t, x ? `<b>${esc(m.nome)}</b>, você não tem ${esc(x.nome)} na sua Pokédex` : ajuda); return;
        }
        let resto = tk.slice(usou), pos = 1, shiny = !!p.shiny;   // "!apelido pikachu shiny Nome" ou "pikachu*"
        if (/^shiny$/i.test(resto[0] || "")) { shiny = true; resto = resto.slice(1); }
        if (/^#?\d{1,2}$/.test(resto[0] || "")) { pos = parseInt(resto[0].replace("#", ""), 10); resto = resto.slice(1); }
        const lista = SV.individuos(m.login, p.num);
        if (shiny) { const i = lista.findIndex((x) => x.s); if (i < 0) { aviso(t, `<b>${esc(m.nome)}</b>, você não tem ${esc(p.nome)} shiny`); return; } pos = i + 1; }
        if (!lista[pos - 1]) { aviso(t, `<b>${esc(m.nome)}</b>, você só tem ${lista.length} ${esc(p.nome)} (veja a lista no site)`); return; }
        const novo = resto.join(" ").replace(/[^\p{L}\p{N} '.\-✦♥]/gu, "").replace(/\s+/g, " ").trim();
        const apagar = !novo || /^(limpar|apagar|tirar|nenhum)$/i.test(novo);
        if (!apagar && [...novo].length > 12) { aviso(t, `<b>${esc(m.nome)}</b>, o apelido pode ter no máximo 12 letras`); return; }
        if (!apagar && USUM.apelidoProibido(novo)) { aviso(t, `🚫 <b>${esc(m.nome)}</b>, esse apelido não é permitido aqui. Escolha outro nome 💚`); return; }
        umaVez(m, () => SV.apelidar(m.login, p.num, pos, apagar ? "" : novo));
        const ind = lista[pos - 1], qualTxt = lista.length > 1 ? ` nº ${pos}` : "";
        aviso(t, apagar ? `<b>${esc(m.nome)}</b> tirou o apelido do seu ${esc(p.nome)}${qualTxt}`
          : `<b>${esc(m.nome)}</b> deu o nome <b>“${esc(novo)}”</b> ao seu ${esc(p.nome)}${qualTxt}${ind.s ? " ✦" : ""} 🏷️`, { num: p.num, forma: "", shiny: !!ind.s });
        return;
      }
      if ((cmd === "!release" || cmd === "!soltar") && USUM.selvagens) {
        const SV = USUM.selvagens, arg = txt.slice(cmd.length).trim(), t = times()[m.login];
        const pend = ler("usum_release", {});
        if (/^(sim|confirmar|confirmo|s)$/i.test(arg)) {
          const pd = pend[m.login];
          if (!pd || Date.now() > pd.ate) { aviso(t, `<b>${esc(m.nome)}</b>, primeiro digite <b>!release nome</b> (ex: !release magikarp)`); return; }
          const nomeP = USUM.nomeDe(pd.num);
          umaVez(m, () => {
            const r0 = SV.soltar(m.login, pd.num, pd.qual);
            if (r0 && r0.acabou) {   // não sobrou nenhum: perde a fotinha (volta a ser ovo) e sai do time da live
              const pa = ler("usum_parceiros", {});
              if (pa[m.login] && pa[m.login].num === pd.num) { delete pa[m.login]; gravar("usum_parceiros", pa); }
              const pf = ler("usum_perfil", {}), eu = pf[m.login];
              if (eu && eu.times && eu.times.live) { eu.times.live = eu.times.live.filter((x) => x[0] !== pd.num); gravar("usum_perfil", pf); }
            }
            const r = ler("usum_release", {}); delete r[m.login]; gravar("usum_release", r);
          });
          aviso(t, `<b>${esc(m.nome)}</b> soltou ${pd.qual === "todos" ? "todos os " : ""}${esc(nomeP)}${pd.forca != null ? ` (força ${pd.forca}%)` : ""}. Tchau! 👋`, { num: pd.num, forma: "", shiny: false });
          return;
        }
        // "!release pikachu", "!release pikachu 3" (número da lista no site) ou "!release pikachu todos"
        const mm = arg.match(/^(.*?)(?:\s+(\d+|todos|tudo))?$/i);
        const p = USUM.lerPokemon(mm[1] || "");
        if (!p) { aviso(t, `Use <b>!release nome</b> (solta o mais fraco), <b>!release nome 2</b> (o número da lista no site) ou <b>!release nome todos</b>`); return; }
        const lista = SV.individuos(m.login, p.num);
        if (!lista.length) { aviso(t, `<b>${esc(m.nome)}</b>, você não tem ${esc(p.nome)} na sua Pokédex`); return; }
        const qual = !mm[2] ? null : /^\d+$/.test(mm[2]) ? +mm[2] : "todos";
        let alvo = null;
        if (qual !== "todos") { alvo = SV.escolher(lista, qual, false); if (!alvo) { aviso(t, `<b>${esc(m.nome)}</b>, você só tem ${lista.length} ${esc(p.nome)} (veja a lista no site)`); return; } }
        const f = alvo ? SV.forcaIV(alvo.iv) : null;
        const ultimo = qual === "todos" || lista.length === 1;
        mudar(m, "usum_release", (x) => (x[m.login] = { num: p.num, qual: qual === "todos" ? "todos" : lista.indexOf(alvo) + 1, forca: f, ate: Date.now() + 60000 }));
        const parc = parceiroDe(m.login).num === p.num;
        const qualTxt = qual === "todos" ? `todos os ${lista.length} ${esc(p.nome)}${lista.some((x) => x.s) ? " (inclusive shiny)" : ""}`
          : `${lista.length > 1 && !qual ? "o seu " + esc(p.nome) + " mais fraco" : esc(p.nome)} (força ${f}% · ${SV.nota(f)}${alvo.s ? " · shiny ✦" : ""})`;
        aviso(t, `<b>${esc(m.nome)}</b>, soltar ${qualTxt}?${ultimo ? ` Ele sai da sua Pokédex${parc ? " e da sua fotinha do chat" : ""}.` : ""} Para confirmar, digite <b>!release sim</b> em até 1 minuto`, { num: p.num, forma: "", shiny: !!(alvo && alvo.s) });
        return;
      }
      /* ---- perfil do treinador: região, favorito e time (aparecem na Pokédex online) ---- */
      if (cmd === "!regiao" || cmd === "!região") {
        const REG = { kanto: "Kanto", johto: "Johto", hoenn: "Hoenn", sinnoh: "Sinnoh", unova: "Unova", unova2: "Unova", kalos: "Kalos",
          alola: "Alola", galar: "Galar", hisui: "Hisui", paldea: "Paldea", orre: "Orre" };
        const arg = (txt.split(/\s+/)[1] || "").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
        const r = REG[arg] || (arg === "isshu" ? "Unova" : "");
        if (!r) { aviso(times()[m.login], `Regiões: ${(window.USUM_REGIOES || []).join(", ")}. Ex: <b>!regiao alola</b>`); return; }
        mudarPerfil(m, (e) => (e.regiao = r));
        aviso(times()[m.login], `<b>${esc(m.nome)}</b> é da região de <b>${r}</b> 🗺️`); return;
      }
      if (cmd === "!favorito" || cmd === "!fav") {
        const p = USUM.lerPokemon(txt.slice(cmd.length));
        if (!p) { aviso(times()[m.login], `Ex: <b>!favorito pikachu</b>`); return; }
        mudarPerfil(m, (e) => (e.fav = [p.num, p.shiny ? 1 : 0]));
        aviso(times()[m.login], `O Pokémon favorito de <b>${esc(m.nome)}</b> é ${esc(p.nome)}${p.shiny ? " ✦" : ""} ❤`, p); return;
      }
      if (cmd === "!meutime") {
        const eu = JSON.parse(JSON.stringify(ler("usum_perfil", {})[m.login] || {}));   // cópia só para ler
        eu.times = eu.times || {}; if (eu.time && !eu.times.live) { eu.times.live = eu.time; } delete eu.time;
        const ajeitar = (e) => { e.times = e.times || {}; if (e.time && !e.times.live) e.times.live = e.time; delete e.time; };
        const chave = eu.jogo || "live", jg = eu.jogo && window.USUM_acharJogo ? USUM_acharJogo(eu.jogo) : null;
        const resto = txt.slice(cmd.length).trim();
        const cartao = (lista, extra) => {
          const d = document.createElement("div"); d.className = "aviso meutime " + (times()[m.login] || "");
          d.insertAdjacentHTML("beforeend", `<span class="t"><b>Time de ${esc(m.nome)}</b>${jg ? " em " + esc(jg.nome) : ""}${extra || ""}</span><span class="time-6"></span>`);
          const g = d.querySelector(".time-6");
          lista.forEach(([n, sh]) => { const im = USUM.imgPokemon({ num: n, forma: "", shiny: !!sh }, "Happy"); im.className = "mini" + (sh ? " sh" : ""); g.appendChild(im); });
          adicionar(d);
        };
        if (!resto) { (eu.times[chave] || []).length ? cartao(eu.times[chave]) : aviso(times()[m.login], `<b>${esc(m.nome)}</b>, monte seu time: <b>!meutime rowlet pikachu eevee</b>`); return; }
        if (/^(limpar|apagar|zerar)$/i.test(resto)) { mudarPerfil(m, (e) => { ajeitar(e); delete e.times[chave]; }); aviso(times()[m.login], `Time de <b>${esc(m.nome)}</b>${jg ? " em " + esc(jg.nome) : ""} apagado`); return; }
        // lê vários Pokémon: "rowlet, pikachu shiny, tapu koko" ou "rowlet pikachu eevee"
        // com !meujogo é o time do jogo que a pessoa joga (qualquer Pokémon); sem jogo é o time da live (só os que ela tem)
        const SV = USUM.selvagens, livre = m.dono || USUM.modoDemo || !SV || !!eu.jogo;
        const pedacos = resto.includes(",") ? resto.split(",") : null;
        const achados = [];
        if (pedacos) pedacos.forEach((t) => { const p = USUM.lerPokemon(t); if (p) achados.push(p); });
        else {
          const tk = resto.split(/\s+/);
          for (let i = 0; i < tk.length;) {
            let ok = null, usou = 1;
            for (let k = Math.min(4, tk.length - i); k >= 1; k--) { const p = USUM.lerPokemon(tk.slice(i, i + k).join(" ")); if (p) { ok = p; usou = k; break; } }
            if (ok) achados.push(ok);
            i += usou;
          }
        }
        const time = [], faltam = [];
        achados.forEach((p) => {
          if (time.length >= 6) return;
          if (!livre && !SV.pode(m.login, p.num, false)) { faltam.push(p.nome); return; }
          time.push([p.num, p.shiny && (livre || SV.pode(m.login, p.num, true)) ? 1 : 0]);
        });
        if (!time.length) { aviso(times()[m.login], `<b>${esc(m.nome)}</b>, você ainda não tem ${faltam.length ? esc(faltam.join(", ")) : "esses Pokémon"}. Capture na grama 🌿`); return; }
        mudarPerfil(m, (e) => { ajeitar(e); e.times[chave] = time; });
        cartao(time, faltam.length ? ` <small>(ainda não tem: ${esc(faltam.slice(0, 3).join(", "))})</small>` : "");
        return;
      }
      if (cmd === "!genero" || cmd === "!gênero" || cmd === "!sexo") {
        const a = txt.slice(cmd.length).toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
        const g = /^(m|menino|masculino|homem|garoto|ele|macho)$/.test(a) ? "m" : /^(f|menina|feminino|mulher|garota|ela|femea)$/.test(a) ? "f"
                : /^(nb|naobinario|naobinaria|nbinario|enby|elu|neutro|outro)$/.test(a) ? "nb" : "";
        if (!g) { aviso(times()[m.login], `Use <b>!genero menino</b>, <b>!genero menina</b> ou <b>!genero naobinario</b>`); return; }
        mudarPerfil(m, (e) => (e.genero = g));
        aviso(times()[m.login], `<b>${esc(m.nome)}</b>: ${{ m: "♂ Menino", f: "♀ Menina", nb: "Não-binário" }[g]} ✓`); return;
      }
      if ((cmd === "!foto" || cmd === "!avatar") && window.USUM_acharTreinador) {
        const t = USUM_acharTreinador(txt.slice(cmd.length));
        if (!t) { aviso(times()[m.login], `Escolha sua foto de treinador na Pokédex online e use <b>!foto nome</b> (ex: !foto cynthia)`); return; }
        mudarPerfil(m, (e) => (e.foto = t.id));
        aviso(times()[m.login], `<b>${esc(m.nome)}</b> agora usa a foto de treinador <b>${esc(t.nome)}</b> 📸`); return;
      }
      if (cmd === "!fc" || cmd === "!friendcode") {
        const d = txt.slice(cmd.length).replace(/\D/g, "");
        if (d.length !== 12) { aviso(times()[m.login], `Friend code do Switch: <b>!fc SW-1234-5678-9012</b>`); return; }
        const fc = `SW-${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
        mudarPerfil(m, (e) => (e.fc = fc));
        aviso(times()[m.login], `Friend code de <b>${esc(m.nome)}</b> salvo no perfil 🎮`); return;
      }
      if ((cmd === "!meujogo" || cmd === "!jogofav" || cmd === "!jogofavorito") && window.USUM_acharJogo) {
        const arg = txt.slice(cmd.length).trim();
        const eu = ler("usum_perfil", {})[m.login] || {};   // só para ler
        const fav = cmd === "!jogofav" || cmd === "!jogofavorito";
        if (!fav && /^(nenhum|limpar|live)$/i.test(arg)) { mudarPerfil(m, (e) => delete e.jogo); aviso(times()[m.login], `<b>${esc(m.nome)}</b> voltou pro time da live`); return; }
        const j = USUM_acharJogo(arg);
        if (!j) { aviso(times()[m.login], `Não achei esse jogo. Ex: <b>${fav ? "!jogofav" : "!meujogo"} ultra sun</b>, scarlet, emerald, legends arceus…`); return; }
        mudarPerfil(m, (e) => { if (fav) e.jogofav = j.id; else { e.jogo = j.id; e.times = e.times || {}; if (e.time && !e.times.live) e.times.live = e.time; delete e.time; } });
        const temTime = !fav && ((eu.times || {})[j.id] || []).length;
        aviso(times()[m.login], fav ? `O jogo favorito de <b>${esc(m.nome)}</b> é <b>Pokémon ${esc(j.nome)}</b> ⭐`
          : `<b>${esc(m.nome)}</b> está jogando <b>Pokémon ${esc(j.nome)}</b> 🎮` + (temTime ? "" : ` · monte o time com <b>!meutime</b>`));
        return;
      }
      if (cmd === "!perfil" || cmd === "!profile") {
        const eu = ler("usum_perfil", {})[m.login] || {}, j = eu.jogo && window.USUM_acharJogo ? USUM_acharJogo(eu.jogo) : null;
        const partes = [eu.genero && { m: "♂", f: "♀", nb: "NB" }[eu.genero], eu.regiao && "🗺️ " + eu.regiao, j && "🎮 " + j.nome].filter(Boolean);
        aviso(times()[m.login], `<b>${esc(m.nome)}</b> ${partes.join(" · ") || ""}${USUM.pokedexUrl ? ` · perfil completo: <b>${esc(USUM.pokedexUrl.replace(/^https?:\/\//, "").replace(/\/?$/, "/"))}?u=${esc(m.login)}</b>` : ""}`);
        return;
      }
      if ((cmd === "!mochila" || cmd === "!bolas") && USUM.selvagens) {
        const mo = USUM.selvagens.mochila(m.login), itens = USUM.selvagens.COMPRAVEIS.filter((b) => mo[b] > 0);
        const d = document.createElement("div"); d.className = "aviso " + (times()[m.login] || "");
        d.innerHTML = `<span class="t"><b>${esc(m.nome)}</b>: ` + (itens.length
          ? itens.map((b) => `<img class="mini-bola" src="${USUM.urlBola(b)}">${mo[b]}× ${USUM.BOLAS[b]}`).join(" · ")
          : "só Poké Balls. Compre Great, Ultra, Quick ou Master Ball com pontos do canal") + `</span>`;
        adicionar(d); return;
      }
      if (cmd === "!evoluir" && !(m.dono || (USUM.podeParty && (USUM.podeParty(m) || USUM.podeParty(m, "2"))))) {
        aviso(times()[m.login], `<b>${esc(m.nome)}</b>, para evoluir seu parceiro use a recompensa <b>Evoluir meu Pokémon</b> nos pontos do canal`); return;
      }
      if (/^!capturar\b/.test(low)) return;
      if (/^!(subs|meta)\b/.test(low) && (m.dono || m.ajudante || m.mod)) return;                       // conta no encontro.html
      if ((m.dono || m.ajudante) && /^!registrar\b/.test(low)) return;
      if ((m.dono || m.ajudante) && /^!selvagem\b/.test(low)) return;
      if ((m.dono || m.ajudante) && /^!surto\b/.test(low)) return;
      if (m.dono && /^!citra\b/.test(low)) return;
      if (/^!(fita|minhasfitas)\b/.test(low)) return;            // viram aviso pelas fitas
      if ((m.dono || m.ajudante) && /^!(evento|darfita)\b/.test(low)) return;
      if (m.mod && /^!evento\b/.test(low)) return;
      if (cmd === "!zerar" && (m.dono || m.ajudante)) { gravar("usum_placar", { sol: 0, lua: 0 }); gravar("usum_destaques", {}); atualizarPlacar(); return; }
      if (/^!(slot|party|time|tirar|trocar|ball|bola|pokebola|evoluir|apelido|shiny)2?\b/.test(low) && (m.dono || (USUM.podeParty && (USUM.podeParty(m) || USUM.podeParty(m, "2"))))) return;
      if (CFG.esconderComandos && txt.startsWith("!")) return;

      const time = times()[m.login] || "";
      if (primeiraVez(m.id + ":c")) {   // conta mensagens para os destaques da tela final
        const d = ler("usum_destaques", {}); d[m.login] = { nome: m.nome, n: ((d[m.login] || {}).n || 0) + 1 }; gravar("usum_destaques", d);
      }
      pontuar(time, 1, m.id); if (time && !cine) pulsar(time); atualizarPlacar();
      const cor = corDe(m.login);   // cor do cartão: equipe (ou o voto, no cineminha)

      const { html, soEmote } = textoComEmotes(m);
      const d = document.createElement("div");
      d.dataset.login = m.login; d.dataset.id = m.id || "";
      d.className = `msg ${cor || "neutro"}${m.sub ? " sub" : ""}${m.dono ? " dono" : ""}${soEmote ? " so-emote" : ""}`;
      let badges = "";
      if (m.dono) badges += '<span class="badge b-dono">Treinador</span>';
      else if (m.mod) badges += '<span class="badge b-mod">Mod</span>';
      if (m.vip) badges += '<span class="badge b-vip">VIP</span>';
      if (m.sub && !m.dono) badges += '<span class="badge b-sub">Sub</span>';
      const chip = cine ? (cor === "sol" ? '<span class="chip sol">♥ Gostei</span>' : cor === "lua" ? '<span class="chip lua">✖ Não gostei</span>' : "")
        : time === "sol" ? '<span class="chip sol">☀ Sol</span>' : time === "lua" ? '<span class="chip lua">☾ Lua</span>' : "";
      d.innerHTML = `<div class="marca"></div>${CFG.mostrarParceiro ? '<div class="av-caixa"><div class="av"></div><div class="encaixe"></div></div>' : ""}
        <div class="corpo"><div class="quem"><span class="nome">${esc(m.nome)}</span>${chip}${badges}</div>${amizadeHtml(m, txt)}<div class="texto">${html}</div></div>`;
      // fita escolhida pendurada no canto direito do cartão
      // comprou um filme do cartaz (comentário no Letterboxd): balão de ingresso
      const comp = USUM.compradorDe(m.login);
      if (comp) {
        d.classList.add("comprador"); if (comp.agora) d.classList.add("passando"); else if (comp.prox) d.classList.add("prox-filme");
        const rotulo = comp.agora ? ["🎬", "Passando agora"] : comp.prox ? ["✦", "Próximo filme"] : ["🎟", "Escolheu"];
        d.querySelector(".quem").insertAdjacentHTML("afterend",
          `<div class="ingresso-tag"><span>${rotulo[0]}</span>${rotulo[1]} · <b>${esc(comp.filme)}</b></div>`);
        d.insertAdjacentHTML("afterbegin", '<i class="picote"></i>');
      }
      // apelido do parceiro (o Pokémon da fotinha): escondido por padrão, aparece se a pessoa usou !showname
      if (CFG.mostrarParceiro && USUM.selvagens && USUM.selvagens.apelidoDe && (ler("usum_perfil", {})[m.login] || {}).mn) {
        const pc = parceiroDe(m.login), ap = pc.num ? USUM.selvagens.apelidoDe(m.login, pc.num, pc.shiny) : "";
        if (ap) d.querySelector(".av-caixa").insertAdjacentHTML("beforeend", `<span class="apelido-parc">${esc(ap)}</span>`);
      }
      const fita = USUM.fitaDe ? USUM.fitaDe(m.login) : "";
      if (fita) { d.classList.add("com-fita"); d.insertAdjacentHTML("beforeend", `<div class="fita-aba">${metal(USUM.urlFita(fita))}</div>`); }
      if (CFG.mostrarParceiro) {
        const parc = parceiroDe(m.login);
        d.querySelector(".av").appendChild(USUM.imgPokemon(parc, USUM.emocaoDoTexto(txt)));
        const bola = (m.sub || m.dono || m.ajudante) ? (ler("usum_bolas", {})[m.login] || "poke") : "poke";
        const enc = d.querySelector(".encaixe");
        if (bola !== "poke") enc.classList.add("especial");
        enc.innerHTML = `<img src="${USUM.urlBola(bola)}" alt="">`;
      }
      adicionar(d);
    });
  };

  /* ---------- Meta de subs da live (pipoquinha no watchparty) ----------
     Conta sub, resub e cada sub de presente. Começa em CFG metaSubs (10). Bateu a meta? sobe +10.
     !subs 5 = acerta o número · !meta 15 = muda a meta · !meta zerar = começa de novo (você, Quarty ou mods).
     Fica guardada durante a live; depois de 8 horas sem mexer, zera sozinha na próxima live. */
  const META_BASE = Math.max(1, (window.USUM_CONFIG || {}).metaSubs || 10);
  USUM.lerMetaSubs = () => {
    const g = ler("usum_subgoal", null);
    if (!g || Date.now() - (g.t || 0) > 8 * 3600e3) return { n: 0, meta: META_BASE, t: Date.now() };
    return g;
  };
  function mudarMeta(m, fn) { umaVez(m, () => { const g = USUM.lerMetaSubs(); fn(g); g.t = Date.now(); if (g.meta < 1) g.meta = META_BASE; gravar("usum_subgoal", g); }); }
  if (USUM.aoMensagem && !/github\.io$/.test(location.hostname)) USUM.aoMensagem((m) => {
    if (m.tipo === "evento" && /^(sub|resub|subgift)$/.test(m.evento || "")) {
      mudarMeta(m, (g) => { g.n++; g.ultimo = m.nome || m.login || ""; g.ultimoId = m.id; while (g.n >= g.meta) g.meta += 10; });
      return;
    }
    if (m.tipo || !(m.dono || m.ajudante || m.mod)) return;
    const t = (m.texto || "").trim().toLowerCase(), a = t.split(/\s+/);
    if (a[0] === "!subs" && /^\d+$/.test(a[1] || "")) mudarMeta(m, (g) => { g.n = +a[1]; g.meta = Math.max(META_BASE, g.meta); while (g.n >= g.meta) g.meta += 10; });
    else if (a[0] === "!meta" && /^(zerar|limpar|reset)$/.test(a[1] || "")) mudarMeta(m, (g) => { g.n = 0; g.meta = META_BASE; });
    else if (a[0] === "!meta" && /^\d+$/.test(a[1] || "")) mudarMeta(m, (g) => { g.meta = Math.max(1, +a[1]); });
  });
})();
