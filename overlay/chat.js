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
  function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); }
  // Pokémon de cada pessoa: escolhido com !pokemon, ou um de Alola sorteado pelo nome
  function parceiroDe(login) {
    const p = ler("usum_parceiros", {})[login];
    if (p && p.num) return p;
    return { num: 0, ovo: true, forma: "", shiny: false };   // ainda não escolheu parceiro: ovo
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
    el.innerHTML = `
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

    function atualizarPlacar() {
      const p = placar(), tot = p.sol + p.lua;
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
    window.addEventListener("storage", (e) => { if (e.key === "usum_placar") atualizarPlacar(); });

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
        d.insertAdjacentHTML("beforeend", `<span class="t">Gotcha! <b>${nomes}</b> ${q.length > 1 ? "capturaram" : "capturou"} ${esc(ev.nome)}${ev.shiny ? " ✦" : ""}!</span>`);
      } else if (ev.tipo === "fugiu") {
        d.className = "aviso";
        const im = USUM.imgPokemon({ num: ev.num, forma: "", shiny: ev.shiny }, "Normal"); im.className = "ret"; d.appendChild(im);
        d.insertAdjacentHTML("beforeend", `<span class="t">${esc(ev.nome)} ${ev.tentaram ? "escapou!" : "voltou pro mato…"}</span>`);
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
        d.innerHTML = `<span class="t"><b>${esc(ev.nome)}</b>, ${ev.motivo === "semparceiro" ? "escolha um parceiro com !pokemon antes de evoluir" : esc(ev.pnome || "") + " não evolui mais"} (o streamer pode devolver os pontos)</span>`;
      } else if (ev.tipo === "autooff" || ev.tipo === "autoon") {
        d.className = "aviso"; d.innerHTML = `<span class="t">Pokémon selvagens automáticos ${ev.tipo === "autoon" ? "ligados" : "desligados"}</span>`;
      } else if (ev.tipo === "eventoon") {
        d.className = "aviso fita-nova";
        d.innerHTML = `<img class="fita-ico" src="${USUM.urlFita(ev.id)}"><span class="t">Evento ligado: quem estiver no chat ganha a <b>${esc(f.nome || ev.id)}</b>!</span>`;
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
      if (m.tipo === "limpar") { lista.innerHTML = ""; return; }
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

      if (cmd === "!sol" || cmd === "!lua") {
        const time = cmd.slice(1), t = times();
        if (t[m.login] !== time) {
          t[m.login] = time; gravar("usum_times", t); pontuar(time, 3, m.id); pulsar(time);
          aviso(time, `<b>${esc(m.nome)}</b> entrou para a Equipe ${time === "sol" ? "Sol" : "Lua"}!`);
        }
        atualizarPlacar(); return;
      }
      if (cmd === "!pokemon" || cmd === "!parceiro") {
        const p = USUM.lerPokemon(txt.slice(cmd.length));
        if (p) {
          const SV = USUM.selvagens, livre = m.dono || USUM.modoDemo || !SV;
          // só iniciais, Pikachu, Eevee ou Pokémon que a pessoa capturou; shiny só se capturou shiny
          if (!livre && !SV.pode(m.login, p.num, false)) {
            aviso(times()[m.login], `<b>${esc(m.nome)}</b>, você ainda não capturou ${esc(p.nome)}! Capture quando aparecer na grama 🌿`, Object.assign({}, p, { shiny: false }));
            return;
          }
          p.shiny = !!(p.shiny && (livre || SV.pode(m.login, p.num, true)));
          const todos = ler("usum_parceiros", {}); todos[m.login] = { num: p.num, forma: p.forma, shiny: p.shiny }; gravar("usum_parceiros", todos);
          aviso(times()[m.login], `<b>${esc(m.nome)}</b> escolheu ${esc(p.nome)}${p.shiny ? " ✦ shiny" : ""}!`, p);
        } else if (txt.slice(cmd.length).trim()) {
          aviso(times()[m.login], `<b>${esc(m.nome)}</b>, não achei esse Pokémon 🤔 confere o nome em inglês (ex: !pokemon popplio)`, parceiroDe(m.login));
        }
        return;
      }
      if ((cmd === "!bola" || cmd === "!pokebola") && !/^\d/.test(txt.split(/\s+/)[1] || "")) {
        const b = USUM.lerBola(txt.split(/\s+/).slice(1).join(" "));
        if (!b) return;
        const SV = USUM.selvagens;
        if (SV && SV.COMPRAVEIS.includes(b)) {
          // Great, Ultra, Quick e Master: só quem comprou com pontos do canal
          if (!m.dono && !USUM.modoDemo && !(SV.mochila(m.login)[b] > 0)) {
            aviso("", `<b>${esc(m.nome)}</b>, você não tem ${USUM.BOLAS[b]}. Compre com pontos do canal!`); return;
          }
        } else if (b !== "poke" && !(m.sub || m.dono)) { aviso("", `Pokébolas especiais são só pra subs ✦`); return; }
        const todas = ler("usum_bolas", {}); todas[m.login] = b; gravar("usum_bolas", todas);
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
      /* ---- perfil do treinador: região, favorito e time (aparecem na Pokédex online) ---- */
      if (cmd === "!regiao" || cmd === "!região") {
        const REG = { kanto: "Kanto", johto: "Johto", hoenn: "Hoenn", sinnoh: "Sinnoh", unova: "Unova", unova2: "Unova", kalos: "Kalos",
          alola: "Alola", galar: "Galar", hisui: "Hisui", paldea: "Paldea", orre: "Orre" };
        const arg = (txt.split(/\s+/)[1] || "").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
        const r = REG[arg] || (arg === "isshu" ? "Unova" : "");
        if (!r) { aviso(times()[m.login], `Regiões: ${(window.USUM_REGIOES || []).join(", ")}. Ex: <b>!regiao alola</b>`); return; }
        const pf = ler("usum_perfil", {}); (pf[m.login] = pf[m.login] || {}).regiao = r; gravar("usum_perfil", pf);
        aviso(times()[m.login], `<b>${esc(m.nome)}</b> é da região de <b>${r}</b> 🗺️`); return;
      }
      if (cmd === "!favorito" || cmd === "!fav") {
        const p = USUM.lerPokemon(txt.slice(cmd.length));
        if (!p) { aviso(times()[m.login], `Ex: <b>!favorito pikachu</b>`); return; }
        const pf = ler("usum_perfil", {}); (pf[m.login] = pf[m.login] || {}).fav = [p.num, p.shiny ? 1 : 0]; gravar("usum_perfil", pf);
        aviso(times()[m.login], `O Pokémon favorito de <b>${esc(m.nome)}</b> é ${esc(p.nome)}${p.shiny ? " ✦" : ""} ❤`, p); return;
      }
      if (cmd === "!meutime") {
        const pf = ler("usum_perfil", {}), eu = pf[m.login] = pf[m.login] || {};
        eu.times = eu.times || {}; if (eu.time && !eu.times.live) { eu.times.live = eu.time; } delete eu.time;
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
        if (/^(limpar|apagar|zerar)$/i.test(resto)) { delete eu.times[chave]; gravar("usum_perfil", pf); aviso(times()[m.login], `Time de <b>${esc(m.nome)}</b>${jg ? " em " + esc(jg.nome) : ""} apagado`); return; }
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
        eu.times[chave] = time; gravar("usum_perfil", pf);
        cartao(time, faltam.length ? ` <small>(ainda não tem: ${esc(faltam.slice(0, 3).join(", "))})</small>` : "");
        return;
      }
      if (cmd === "!genero" || cmd === "!gênero" || cmd === "!sexo") {
        const a = txt.slice(cmd.length).toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
        const g = /^(m|menino|masculino|homem|garoto|ele|macho)$/.test(a) ? "m" : /^(f|menina|feminino|mulher|garota|ela|femea)$/.test(a) ? "f"
                : /^(nb|naobinario|naobinaria|nbinario|enby|elu|neutro|outro)$/.test(a) ? "nb" : "";
        if (!g) { aviso(times()[m.login], `Use <b>!genero menino</b>, <b>!genero menina</b> ou <b>!genero naobinario</b>`); return; }
        const pf = ler("usum_perfil", {}); (pf[m.login] = pf[m.login] || {}).genero = g; gravar("usum_perfil", pf);
        aviso(times()[m.login], `<b>${esc(m.nome)}</b>: ${{ m: "♂ Menino", f: "♀ Menina", nb: "Não-binário" }[g]} ✓`); return;
      }
      if ((cmd === "!foto" || cmd === "!avatar") && window.USUM_acharTreinador) {
        const t = USUM_acharTreinador(txt.slice(cmd.length));
        if (!t) { aviso(times()[m.login], `Escolha sua foto de treinador na Pokédex online e use <b>!foto nome</b> (ex: !foto cynthia)`); return; }
        const pf = ler("usum_perfil", {}); (pf[m.login] = pf[m.login] || {}).foto = t.id; gravar("usum_perfil", pf);
        aviso(times()[m.login], `<b>${esc(m.nome)}</b> agora usa a foto de treinador <b>${esc(t.nome)}</b> 📸`); return;
      }
      if (cmd === "!fc" || cmd === "!friendcode") {
        const d = txt.slice(cmd.length).replace(/\D/g, "");
        if (d.length !== 12) { aviso(times()[m.login], `Friend code do Switch: <b>!fc SW-1234-5678-9012</b>`); return; }
        const fc = `SW-${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
        const pf = ler("usum_perfil", {}); (pf[m.login] = pf[m.login] || {}).fc = fc; gravar("usum_perfil", pf);
        aviso(times()[m.login], `Friend code de <b>${esc(m.nome)}</b> salvo no perfil 🎮`); return;
      }
      if ((cmd === "!meujogo" || cmd === "!jogofav" || cmd === "!jogofavorito") && window.USUM_acharJogo) {
        const arg = txt.slice(cmd.length).trim();
        const pf = ler("usum_perfil", {}), eu = pf[m.login] = pf[m.login] || {};
        const fav = cmd === "!jogofav" || cmd === "!jogofavorito";
        if (!fav && /^(nenhum|limpar|live)$/i.test(arg)) { delete eu.jogo; gravar("usum_perfil", pf); aviso(times()[m.login], `<b>${esc(m.nome)}</b> voltou pro time da live`); return; }
        const j = USUM_acharJogo(arg);
        if (!j) { aviso(times()[m.login], `Não achei esse jogo. Ex: <b>${fav ? "!jogofav" : "!meujogo"} ultra sun</b>, scarlet, emerald, legends arceus…`); return; }
        if (fav) eu.jogofav = j.id; else { eu.jogo = j.id; eu.times = eu.times || {}; if (eu.time && !eu.times.live) eu.times.live = eu.time; delete eu.time; }
        gravar("usum_perfil", pf);
        const temTime = !fav && (eu.times[j.id] || []).length;
        aviso(times()[m.login], fav ? `O jogo favorito de <b>${esc(m.nome)}</b> é <b>Pokémon ${esc(j.nome)}</b> ⭐`
          : `<b>${esc(m.nome)}</b> está jogando <b>Pokémon ${esc(j.nome)}</b> 🎮` + (temTime ? "" : ` · monte o time com <b>!meutime</b>`));
        return;
      }
      if (cmd === "!perfil") {
        const eu = ler("usum_perfil", {})[m.login] || {}, j = eu.jogo && window.USUM_acharJogo ? USUM_acharJogo(eu.jogo) : null;
        const partes = [eu.genero && { m: "♂", f: "♀", nb: "NB" }[eu.genero], eu.regiao && "🗺️ " + eu.regiao, j && "🎮 " + j.nome].filter(Boolean);
        aviso(times()[m.login], `<b>${esc(m.nome)}</b> ${partes.join(" · ") || ""}${USUM.pokedexUrl ? ` · perfil completo: <b>${esc(USUM.pokedexUrl.replace(/^https?:\/\//, ""))}</b>` : ""}`);
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
      if (/^!capturar\b/.test(low)) return;                       // conta no encontro.html
      if ((m.dono || m.ajudante) && /^!registrar\b/.test(low)) return;
      if ((m.dono || m.ajudante) && /^!selvagem\b/.test(low)) return;
      if (/^!(fita|minhasfitas)\b/.test(low)) return;            // viram aviso pelas fitas
      if ((m.dono || m.ajudante) && /^!(evento|darfita)\b/.test(low)) return;
      if (cmd === "!zerar" && (m.dono || m.ajudante)) { gravar("usum_placar", { sol: 0, lua: 0 }); gravar("usum_destaques", {}); atualizarPlacar(); return; }
      if (/^!(slot|party|time|tirar|trocar|bola|pokebola|evoluir|apelido|shiny)2?\b/.test(low) && (m.dono || (USUM.podeParty && (USUM.podeParty(m) || USUM.podeParty(m, "2"))))) return;
      if (CFG.esconderComandos && txt.startsWith("!")) return;

      const time = times()[m.login] || "";
      if (primeiraVez(m.id + ":c")) {   // conta mensagens para os destaques da tela final
        const d = ler("usum_destaques", {}); d[m.login] = { nome: m.nome, n: ((d[m.login] || {}).n || 0) + 1 }; gravar("usum_destaques", d);
      }
      pontuar(time, 1, m.id); if (time) pulsar(time); atualizarPlacar();

      const { html, soEmote } = textoComEmotes(m);
      const d = document.createElement("div");
      d.dataset.login = m.login;
      d.className = `msg ${time || "neutro"}${m.sub ? " sub" : ""}${m.dono ? " dono" : ""}${soEmote ? " so-emote" : ""}`;
      let badges = "";
      if (m.dono) badges += '<span class="badge b-dono">Treinador</span>';
      else if (m.mod) badges += '<span class="badge b-mod">Mod</span>';
      if (m.vip) badges += '<span class="badge b-vip">VIP</span>';
      if (m.sub && !m.dono) badges += '<span class="badge b-sub">Sub</span>';
      const chip = time === "sol" ? '<span class="chip sol">☀ Sol</span>' : time === "lua" ? '<span class="chip lua">☾ Lua</span>' : "";
      d.innerHTML = `<div class="marca"></div>${CFG.mostrarParceiro ? '<div class="av-caixa"><div class="av"></div><div class="encaixe"></div></div>' : ""}
        <div class="corpo"><div class="quem"><span class="nome">${esc(m.nome)}</span>${chip}${badges}</div>${amizadeHtml(m, txt)}<div class="texto">${html}</div></div>`;
      // fita escolhida pendurada no canto direito do cartão
      const fita = USUM.fitaDe ? USUM.fitaDe(m.login) : "";
      if (fita) { d.classList.add("com-fita"); d.insertAdjacentHTML("beforeend", `<div class="fita-aba">${metal(USUM.urlFita(fita))}</div>`); }
      if (CFG.mostrarParceiro) {
        const parc = parceiroDe(m.login);
        d.querySelector(".av").appendChild(USUM.imgPokemon(parc, USUM.emocaoDoTexto(txt)));
        const bola = m.sub ? (ler("usum_bolas", {})[m.login] || "poke") : "poke";
        const enc = d.querySelector(".encaixe");
        if (bola !== "poke") enc.classList.add("especial");
        enc.innerHTML = `<img src="${USUM.urlBola(bola)}" alt="">`;
      }
      adicionar(d);
    });
  };
})();
