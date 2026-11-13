/* Pokémon: nome -> número, formas e imagens (retrato PMD com reserva HOME) */
(function () {
  window.USUM = window.USUM || {};
  const P = Object.assign({
    pastaPMD: "../../Pokemon Assets/portrait/",
    pmdOnline: "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/",
    pastaHOME: "../../Pokemon Assets/pokemon/other/home/"
  }, (window.USUM_CONFIG || {}).imagens);

  const sem = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  let indice = null;
  function montarIndice() {
    indice = {};
    (window.USUM_DEX || []).forEach((n, i) => { indice[sem(n)] = i + 1; });
  }

  // formas conhecidas (número da forma no repositório PMD)
  const ALOLA = [19, 20, 26, 27, 28, 37, 38, 50, 51, 52, 53, 74, 75, 76, 88, 89, 103, 105];
  const FORMAS = {
    745: { meianoite: "0001", midnight: "0001", noite: "0001", crepusculo: "0002", dusk: "0002" },
    800: { duskmane: "0001", jubaocrepuscular: "0001", dawnwings: "0002", asasdaaurora: "0002", ultra: "0003" },
    741: { pompom: "0001", pau: "0002", sensu: "0003" },
    778: { busted: "0001", quebrado: "0001" }
  };

  /* "rowlet", "25", "vulpix alola", "litten shiny" -> {num, forma, shiny, nome} */
  // acha o nome mais parecido quando a pessoa erra uma letra (ou duas, em nomes compridos)
  function dist(x, y, max) {
    if (Math.abs(x.length - y.length) > max) return max + 1;
    let ant = Array.from({ length: y.length + 1 }, (_, j) => j);
    for (let i = 1; i <= x.length; i++) {
      const at = [i]; let menor = i;
      for (let j = 1; j <= y.length; j++) {
        at[j] = Math.min(ant[j] + 1, at[j - 1] + 1, ant[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
        if (at[j] < menor) menor = at[j];
      }
      if (menor > max) return max + 1;
      ant = at;
    }
    return ant[y.length];
  }
  USUM.parecido = function (texto) {
    if (!indice) montarIndice();
    const s = sem(texto); if (s.length < 4) return 0;
    const max = s.length >= 8 ? 2 : 1, junta = (t) => t.replace(/(.)\1+/g, "$1");
    let melhor = 0, md = max + 1, empate = false;
    for (const k in indice) {
      const d = junta(k) === junta(s) ? 0.5 : dist(s, k, max);
      if (d < md) { md = d; melhor = indice[k]; empate = false; }
      else if (d === md && indice[k] !== melhor) empate = true;
    }
    return md <= max && !empate ? melhor : 0;
  };

  USUM.lerPokemon = function (texto) {
    if (!indice) montarIndice();
    const partes = texto.trim().split(/[\s_-]+/).filter(Boolean);
    let shiny = false, forma = "";
    const resto = [];
    partes.forEach((p) => {
      const s = sem(p);
      if (s === "shiny" || s === "brilhante") shiny = true;
      else if (s === "alola" || s === "alolan" || s === "dealola") forma = "alola";
      else resto.push(p);
    });
    if (resto.length && resto[resto.length - 1].endsWith("*")) { shiny = true; resto[resto.length - 1] = resto[resto.length - 1].slice(0, -1); }
    let num = 0, extra = "";
    if (/^\d+$/.test(resto[0] || "")) { num = +resto[0]; extra = sem(resto.slice(1).join("")); }
    else {
      for (let k = resto.length; k > 0 && !num; k--) {     // aceita nomes com espaço (tapu koko)
        const n = indice[sem(resto.slice(0, k).join(""))];
        if (n) { num = n; extra = sem(resto.slice(k).join("")); }
      }
    }
    if (!num && resto.length && !/^\d+$/.test(resto[0])) {   // erro de digitação (poplio -> popplio)
      for (let k = resto.length; k > 0 && !num; k--) {
        const n = USUM.parecido(resto.slice(0, k).join(""));
        if (n) { num = n; extra = sem(resto.slice(k).join("")); }
      }
    }
    if (!num || num > 1025) return null;
    let codForma = "";
    if (forma === "alola" && ALOLA.includes(num)) codForma = "0001";
    else if (extra && FORMAS[num] && FORMAS[num][extra]) codForma = FORMAS[num][extra];
    else if (extra) return null; // sobrou palavra que não é forma (ex: apelido)
    const nome = USUM.nomeDe(num);
    return { num, forma: codForma, shiny, nome: nome + (codForma && forma === "alola" ? " de Alola" : "") };
  };

  /* Pokébolas: "love", "love ball", "amor"... -> "love" */
  const BOLAS = { poke: "Poké Ball", great: "Great Ball", ultra: "Ultra Ball", master: "Master Ball", safari: "Safari Ball",
    level: "Level Ball", lure: "Lure Ball", moon: "Moon Ball", friend: "Friend Ball", love: "Love Ball", heavy: "Heavy Ball",
    fast: "Fast Ball", sport: "Sport Ball", premier: "Premier Ball", repeat: "Repeat Ball", timer: "Timer Ball", nest: "Nest Ball",
    net: "Net Ball", dive: "Dive Ball", luxury: "Luxury Ball", heal: "Heal Ball", quick: "Quick Ball", dusk: "Dusk Ball",
    cherish: "Cherish Ball", dream: "Dream Ball", beast: "Beast Ball" };
  const APELIDOS_BOLA = { pokebola: "poke", pokeball: "poke", grande: "great", nivel: "level", isca: "lure", lua: "moon",
    amigo: "friend", amizade: "friend", amor: "love", pesada: "heavy", rapida: "fast", tempo: "timer", ninho: "nest",
    rede: "net", mergulho: "dive", luxo: "luxury", cura: "heal", crepusculo: "dusk", sonho: "dream", fera: "beast" };
  USUM.BOLAS = BOLAS;
  USUM.lerBola = function (texto) {
    const s = sem(texto || "").replace(/(ball|bola)$/, "");
    if (!s) return /^(poke)?(ball|bola)$/.test(sem(texto || "")) ? "poke" : null;
    return BOLAS[s] ? s : APELIDOS_BOLA[s] || null;
  };
  USUM.urlBola = (k) => "assets/bolas/" + (BOLAS[k] ? k : "poke") + "-ball.png";

  USUM.nomeDe = (num) => ((window.USUM_DEX || [])[num - 1] || "#" + num).replace(/_/g, " ").replace(/ F$/, "♀").replace(/ M$/, "♂");

  // nem todo Pokémon tem todas as carinhas: usa a mais parecida antes de cair no Normal
  USUM.EMOCAO_PARECIDA = { Pain: "Angry", Sigh: "Sad", Stunned: "Surprised", "Teary-Eyed": "Happy", Crying: "Sad", Inspired: "Happy",
                           Joyous: "Happy", Shouting: "Angry", Dizzy: "Surprised", Determined: "Happy", Worried: "Sad" };

  /* Lista de endereços em ordem de preferência */
  USUM.urlsRetrato = function (p, emocao) {
    const n4 = String(p.num).padStart(4, "0");
    const caminho = n4 + (p.forma ? "/" + p.forma : "") + (p.shiny ? (p.forma ? "/0001" : "/0000/0001") : "");
    const base = n4 + (p.forma ? "/" + p.forma : "");
    const urls = [];
    [P.pastaPMD, P.pmdOnline].forEach((raiz) => {
      if (emocao && emocao !== "Normal") {
        urls.push(raiz + caminho + "/" + emocao + ".png");
        const par = USUM.EMOCAO_PARECIDA[emocao];
        if (par) urls.push(raiz + caminho + "/" + par + ".png");
      }
      urls.push(raiz + caminho + "/Normal.png");
      if (p.shiny || p.forma) urls.push(raiz + base.split("/")[0] + "/Normal.png");
    });
    urls.push(P.pastaHOME + (p.shiny ? "shiny/" : "") + p.num + ".png");
    return urls;
  };

  /* Cria <img> que tenta cada endereço até um funcionar */
  USUM.imgPokemon = function (p, emocao, aoCarregar) {
    if (p && p.ovo) { const o = new Image(); o.className = "ovo"; o.alt = ""; if (aoCarregar) o.onload = aoCarregar; o.src = "assets/ovo.png"; return o; }
    const urls = USUM.urlsRetrato(p, emocao);
    const img = new Image();
    let i = 0;
    img.onerror = () => { i++; if (i < urls.length) img.src = urls[i]; else img.style.visibility = "hidden"; };
    img.onload = () => {
      img.classList.toggle("home", img.src.indexOf("/home/") >= 0);
      img.classList.toggle("pmd", img.src.indexOf("/home/") < 0);
      aoCarregar && aoCarregar(img);
    };
    img.src = urls[0];
    return img;
  };

  /* Troca a emoção de uma imagem já carregada (se não existir, fica como está) */
  USUM.mudarEmocao = function (img, p, emocao) {
    if (!img.classList.contains("pmd")) return;
    const n4 = String(p.num).padStart(4, "0");
    const caminho = n4 + (p.forma ? "/" + p.forma : "") + (p.shiny ? (p.forma ? "/0001" : "/0000/0001") : "");
    const raiz = img.src.indexOf("raw.githubusercontent") >= 0 ? P.pmdOnline : P.pastaPMD;
    // nem todo Pokémon tem todas as carinhas: tenta uma parecida antes de desistir
    const PARECIDA = USUM.EMOCAO_PARECIDA;
    const tentar = (e) => {
      const teste = new Image();
      teste.onload = () => { img.src = teste.src; };
      teste.onerror = () => { if (PARECIDA[e] && PARECIDA[e] !== e) tentar(PARECIDA[e]); };
      teste.src = raiz + caminho + "/" + e + ".png";
    };
    tentar(emocao);
  };

  /* Emoção a partir do texto da mensagem */
  USUM.emocaoDoTexto = function (t) {
    const orig = String(t || "").trim();
    const s = orig.toLowerCase();
    const so = s.replace(/[.!…\s]+$/g, "");               // mensagem sem pontuação no fim
    // palavra inteira (funciona com acento): p("ué") etc.
    const p = (lista) => new RegExp("(^|[^a-zà-ÿ0-9])(" + lista + ")(?=$|[^a-zà-ÿ0-9])").test(s);
    // emotes do canal
    if (/camyxany/.test(s) || /(^|[^a-zà-ÿ0-9])scat(?=$|[^a-zà-ÿ0-9])/.test(s)) return "Dizzy";   // CamyXany e "scat" = tonto
    if (/camychoro/.test(s)) return "Sad";
    // respostas de uma palavra só
    if (/^(sim+|siiim+|s{2,}|yes|sss+)$/.test(so)) return "Happy";
    if (/^(não|nao|n)$/.test(so) && orig === orig.toLowerCase()) return "Angry";   // "não" sozinho, minúsculo
    // emotes da Twitch / 7TV / BTTV mais comuns
    if (/\b(lul|lulw|omegalul|kekw|kek|4head|jebaited|kappa|keepo|pepelaugh|lmao|icant|xdd?)\b/.test(s)) return "Joyous";
    if (/\b(biblethump|sadge|pepehands|feelsbadman|notlikethis|residentsleeper|prayge)\b/.test(s)) return "Sad";
    if (/\b(swiftrage|dansgame|wutface|madge|pepega|babyrage|ragey)\b/.test(s)) return "Angry";
    if (/\b(pogchamp|pog|poggers|pogu|kreygasm|hypers|seemsgood|catjam|ez)\b/.test(s)) return "Happy";
    if (/\b(monkas|monkaw|panicbasket|wtf)\b/.test(s)) return "Worried";
    if (/\b(coolstorybob|zzz)\b/.test(s)) return "Sigh";
    // risada
    if (/(k{3,}|(ha){2,}|(he){2,}|(hi){2,}|(rs){2,}|(hue){2,}|(ka){3,}|(ks){2,}|(sk){2,}|(au(h)?){3,}|(ah){3,}|asuhas|😂|🤣|😆|😹|💀|\blol\b|\blmao\b|\brofl\b|\bxd\b)/.test(s)
        || p("morri|chorando de rir|rachei|me mijei|socorro kk")) return "Joyous";
    if (/\bblz\s*!/.test(s)) return "Joyous";
    if (/^OK\s*\?+$/.test(orig)) return "Angry";            // "OK?" em maiúsculo = bravo
    if (/(:\(|:'\(|:c\b|☹|🙁)/.test(s)) return "Sad";
    // GRITANDO EM MAIÚSCULAS (sem contar emotes/menções)
    const letras = orig.replace(/@\S+/g, "").replace(/[^A-Za-zÀ-ÿ]/g, "");
    if (letras.length >= 6 && letras === letras.toUpperCase() && letras !== letras.toLowerCase())
      return /!|\?/.test(orig) || /(nao|não|para|socorro|aaa)/.test(s) ? "Shouting" : "Angry";
    if (/^(NÃO|NAO)[!?.\s]*$/.test(orig)) return "Angry";
    // qualquer pergunta (termina com ?) = preocupado, como quem está se questionando: "oi?", "ok?", "sério?"
    if (/\?\s*$/.test(orig)) return "Worried";
    // gírias de chat brasileiro
    if (/(🤢|🤮|😖|😣|😫|🫣)/.test(s) || p("credo|cruzes|eca+|ecaa+|argh+|nojo|nojent[oa]|que nojo|deus me livre|dlivre|ui+|ai que dor|doeu|que horror|horrivel|horrível|bizarro|bizarra")) return "Pain";
    if (/(🙄|😒|😮‍💨|😑|😪|😔|😩)/.test(s) || p("suspiro|suspira|haja paciência|haja paciencia|paciência|paciencia|ai ai|aiai|ai ai ai ai|mimimi|lá vem|la vem|de novo não|de novo nao|de novo isso|sempre isso|aff+ mano|cansado disso|que fase|vida que segue|é isso|e isso ai|fazer oq|fzr o q|af+|af+s|af+e|aff+|afs|aff+s|ah+ff+|pff+|tédio|tedio|preguiça|preguica|sono|cansad[oa]|cansei|enfim|fazer o que|fzr oq|ok né|vish que preguiça")
        || /^(né|ne|aham|sei|tá bom|ta bom|tabom|hmpf|hunf)$/.test(so)) return "Sigh";
    if (/(😐|😶|🫥|🫠)/.test(s) || p("chocad[oa]|choquei|choque|passad[oa]|pass[ea]i|pasm[oa]|sem palavras|sem reação|sem reacao|travei|paralisei|congelei|bugad[oa]")) return "Stunned";
    if (/(🥹|🥲)/.test(s) || p("emocionei|emocionad[oa]|emocionante|me emocionei|quase chorei|que lindo|que linda|que fofo|que fofa|tocante|arrepiei|arrepiante")) return "Teary-Eyed";
    if (/(😭|😿|🥺)/.test(s) || p("vou chorar|quero chorar|vontade de chorar|choro|choros|chorar|chorei muito|chorei|tô mal|to mal|me acabei|desabei|aaa+ 😭|socorro chorei|chorando|tô chorando|to chorando|buá|bua+|snif|sniff")) return "Crying";
    if (p("vish|vixe|vix|ixi|ixe|ihh+|ih+|xii+|eita porra|deu ruim|f no chat|fudeu|lascou|ferrou|danou|ai meu deus|ai ai ai|mds do céu|mds do ceu")) return "Worried";
    if (p("oloco|o loco|olha só|olha so|caraca|caraio|uau|uou|wow|nossa senhora|jura|sério|serio|slk|sem limites|mano do céu|mano do ceu|pqp|que isso|q isso|oxe que|meu pai|minha nossa|ave maria|avemaria")) return "Surprised";
    if (/^(mano+|manoo+|magna)[!.\s]*$/i.test(orig) || p("porra|merda|bosta|lixo|morra|morre|desgraça|desgraca|desgraçado|desgraçada|fdp|cu|cacete|caralho|krl|droga|saco|que saco|palhaçada|palhacada|pqp mano|vsf|vtnc|tnc|aí não|ai nao|ai não|absurdo|sacanagem|roubado|roubo|injusto|que isso mano")) return "Angry";
    if (p("puts|putz|poxa|pô|po|que pena|sad|tristeza|triste demais|nãooo|naooo|aí que tristeza|deu ruim demais|coitad[oa]|tadinh[oa]|tadin")) return "Sad";
    if (p("top|show|massa|daora|da hora|dahora|irado|irada|brabo|braba|brabíssimo|foda|fodase|legal|uhul|uhu+|aee+|ae+|eba+|yay|boa|mitou|mito|lenda|craque|arrasou|arrasa|maravilh[oa]|amei demais|sensacional|pai tá on|pai ta on|mãe tá on|mae ta on|tá on|ta on")) return "Happy";
    if (p("partiu|simbora|bora lá|bora la|vamo que vamo|vamos que vamos|tamo junto|é agora|e agora vai|agora vai|tô dentro|to dentro|pra cima|pra cima deles")) return "Determined";
    // preocupado: perguntas de cuidado
    if (/(tudo bem|td bem|tá bem|ta bem|está bem|esta bem|tudo certo|vc tá bem|você tá bem)\s*\?/.test(s)
        || /(o que foi isso|oq foi isso|que foi isso|o que aconteceu|oq aconteceu|que houve|cadê|cade)\s*\??/.test(s)
        || /^gente\s*\?+$/.test(so + (s.endsWith("?") ? "?" : ""))) return "Worried";
    if (/(😭|😢|🥺|triste|chorei|chorando|nao+o+|rip\b|\bf\b|perdi|morreu|saudade)/.test(s)) return "Sad";
    if (/(raiva|odeio|ódio|😡|🤬|😠|maldit|irritad)/.test(s)) return "Angry";
    if (/(medo|socorro|tenso|😰|😨|😬|cuidado|ai ai|preocupad)/.test(s)) return "Worried";
    // feliz: inclui "amo", corações e agradecimentos
    if (/(❤|♥|💖|💗|💓|💞|💕|💘|💝|💜|💙|💚|💛|🧡|🤍|🖤|🤎|💟|❣|<3|😍|🥰|😘|☺|😊|🥹|🔥)/.test(s)
        || p("amo|te amo|amei|amando|adoro|adorei|lindo|linda|fofo|fofa|bora|vamo|vamos|gg|lets go|isso+|obrigad[oa]|valeu|vlw|feliz|perfeito|incrível|incrivel|demais")) return "Happy";
    // tonto / confuso
    if (/(😵|🤯|🤨|🤔|😵‍💫|\?\?\?+)/.test(s) || p("ué|ue|uai|oxi|oxe|oxente|hã|hein|hm+|ham|tonto|tonta|confuso|confusa|perdido|perdida|bugou|buguei")) return "Dizzy";
    if (/(\?\?|o que|oq|como assim|😮|😱|😳|caramba|nossa|eita|mds|meu deus)/.test(s)) return "Surprised";
    if (/(😤|bora vencer|foco|determinad|💪)/.test(s)) return "Determined";
    if (p("ok|okay|blz|beleza|certo|fechou|bele")) return "Determined";
    // inspirado: incentivo, ideia, brilho
    if (/(!{2,}|💡|✨|🌟|⭐|🙌|🚀)/.test(s) || p("você consegue|vc consegue|eu acredito|acredito em|acredita em|confia em|força|forca|tmj|ideia|inspirad[oa]|sonho|vai dar certo|vamos conseguir|é nós|e nois|é nois")) return "Inspired";
    return "Normal";
  };



  /* ---------- Pokémon da memória do jogo (Citra): decifra igual ao PKHeX / CitraRNG (Gen 6 e 7) ---------- */
  const POS = [0,1,2,3,0,1,3,2,0,2,1,3,0,3,1,2,0,2,3,1,0,3,2,1,1,0,2,3,1,0,3,2,2,0,1,3,3,0,1,2,2,0,3,1,3,0,2,1,1,2,0,3,1,3,0,2,2,1,0,3,3,1,0,2,2,3,0,1,3,2,0,1,1,2,3,0,1,3,2,0,2,1,3,0,3,1,2,0,2,3,1,0,3,2,1,0];
  const BOLA_ID = { 1: "master", 2: "ultra", 3: "great", 4: "poke", 5: "safari", 6: "net", 7: "dive", 8: "nest", 9: "repeat", 10: "timer",
    11: "luxury", 12: "premier", 13: "dusk", 14: "heal", 15: "quick", 16: "cherish", 17: "fast", 18: "level", 19: "lure", 20: "heavy",
    21: "love", 22: "friend", 23: "moon", 24: "sport", 25: "dream", 26: "beast" };
  const u16 = (d, o) => d[o] | (d[o + 1] << 8), u32 = (d, o) => (d[o] | d[o + 1] << 8 | d[o + 2] << 16 | d[o + 3] << 24) >>> 0;
  USUM.decifrarPK7 = function (enc) {   // 232 bytes do Pokémon + 22 dos status de batalha, embaralhados pelo jogo
    const pv = u32(enc, 0), sv = (pv >>> 13) & 31, x = new Uint8Array(enc.length - 8);
    const passo = (ini, fim) => { let sd = pv; for (let i = ini; i < fim; i += 2) { sd = (Math.imul(sd, 0x41C64E6D) + 0x6073) >>> 0; const k = sd >>> 16; x[i - 8] = enc[i] ^ (k & 0xFF); x[i - 7] = enc[i + 1] ^ (k >>> 8); } };
    passo(8, 232); if (enc.length > 232) passo(232, enc.length);
    const out = new Uint8Array(enc.length); out.set(enc.subarray(0, 8), 0);
    for (let b = 0; b < 4; b++) { const st = 56 * POS[b + sv * 4]; out.set(x.subarray(st, st + 56), 8 + b * 56); }
    out.set(x.subarray(224), 232);
    return out;
  };
  USUM.lerPK7 = function (d) {
    const especie = u16(d, 8);
    if (!especie || especie > 807) return null;
    let soma = 0; for (let i = 8; i < 0xE8; i += 2) soma = (soma + u16(d, i)) & 0xFFFF;
    if (soma !== u16(d, 6)) return null;                       // dado inválido ou lugar vazio
    const pid = u32(d, 0x18), tid = u16(d, 0xC), sid = u16(d, 0xE), iv = u32(d, 0x74);
    const ovo = !!(iv & 0x40000000), temApelido = !!(iv & 0x80000000);
    const forma = d[0x1D] >> 3;
    let apelido = ""; for (let i = 0x40; i < 0x40 + 24; i += 2) { const c = u16(d, i); if (!c) break; apelido += String.fromCharCode(c); }
    const hpAtual = d.length > 0xF3 ? u16(d, 0xF0) : 0, hpMax = d.length > 0xF3 ? u16(d, 0xF2) : 0;
    return { especie, forma, ec: u32(d, 0), ovo, shiny: ((pid >>> 16) ^ (pid & 0xFFFF) ^ tid ^ sid) < 16, bola: BOLA_ID[d[0xDC]] || "poke",
      apelido: temApelido ? apelido.replace(/[\uE000-\uF8FF]/g, "").trim() : "", nivel: d.length > 0xEC ? d[0xEC] : 0, hpAtual, hpMax };
  };
  USUM.hexParaBytes = (h) => { const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return b; };
})();
