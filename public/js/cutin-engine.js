/* =====================================================================
   必殺技カットイン — 案① 王道アニメ（紋章入り） / ゲーム導入用エンジン
   依存なし。cutin-anime.css とセットで読み込む。

   使い方:
     <link rel="stylesheet" href="cutin-anime.css">
     <script src="cutin-engine.js"></script>
     <script>
       // 立ち絵URLを設定（任意・後からでもOK）
       Cutin.setPortrait('yusha', 'img/yusha.png');
       // 発動！
       Cutin.play('yusha');
     </script>

   API:
     Cutin.play(id, opts?)         技を発動。opts: { sceneEl, onDone, speed, shake, sl, charge }
     Cutin.setPortrait(id, url)    キャラの立ち絵画像を設定
     Cutin.configure({ speed, shake, sl, charge, sceneEl })   既定値を変更
     Cutin.add(id, def)            新しいキャラ/技を追加
     Cutin.characters              キャラ定義オブジェクト
   ===================================================================== */
(function (global) {
  'use strict';

  // ---- キャラ / 必殺技データ（ここを編集して増やせます） ----
  var CHARACTERS = {
    yusha: { name: '勇者',   move: '天空斬',     romaji: 'TENKŪ-ZAN',        sub: 'CAELI SECTIO',    accent: '#6db0ec', accentD: '#2b6aa6', portrait: '' },
    eln:   { name: 'エルン', move: '双剣乱舞',   romaji: 'SŌKEN-RANBU',      sub: 'GLADII SALTATIO', accent: '#e0594e', accentD: '#9c2f27', portrait: '' },
    saria: { name: 'サリア', move: '星霊爆裂陣', romaji: 'SEIREI-BAKURETSU', sub: 'ASTRORVM FVROR',  accent: '#b07be0', accentD: '#6a3aa0', portrait: '' }
  };

  var CONFIG = { speed: 1, shake: 1, sl: 1, charge: true, sceneEl: null, container: null };
  var TOTAL_MS = 3600; // 速度1.0 でのおおよその全長

  var overlay = null, els = null, timer = null;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'cit-overlay';

    // sparks
    var sparks = '';
    for (var i = 0; i < 16; i++) {
      var ang = (i / 16) * Math.PI * 2 + (i % 3) * 0.4;
      var r = 36 + (i % 5) * 7;
      var sx = 'calc(-50% + ' + (Math.cos(ang) * r).toFixed(1) + 'vmin)';
      var sy = 'calc(-50% + ' + (Math.sin(ang) * r).toFixed(1) + 'vmin)';
      var sz = 4 + (i % 4) * 2;
      var d = (i % 6) * 0.06;
      sparks += '<span class="cit-spark" style="--sx:' + sx + ';--sy:' + sy +
        ';width:' + sz + 'px;height:' + sz + 'px;animation-delay:calc(' + d + 's / var(--cit-spd))"></span>';
    }

    overlay.innerHTML =
      '<div class="cit-layer cit-veil"></div>' +
      '<div class="cit-layer cit-sparks">' + sparks + '</div>' +
      '<div class="cit-shake">' +
        '<div class="cit-layer cit-speed-radial"></div>' +
        '<div class="cit-layer cit-speed-stream"></div>' +
        '<div class="cit-crest">⚜</div>' +
        '<div class="cit-band cit-thin"></div>' +
        '<div class="cit-band"></div>' +
        '<div class="cit-portrait-wrap"><div class="cit-portrait cit-empty"></div><div class="cit-portrait-rim"></div></div>' +
        '<div class="cit-namebox">' +
          '<div class="cit-tag"></div>' +
          '<div class="cit-sub"></div>' +
          '<div class="cit-jp"></div>' +
          '<div class="cit-romaji"></div>' +
        '</div>' +
        '<div class="cit-layer cit-slash"></div>' +
      '</div>' +
      '<div class="cit-layer cit-flash"></div>';

    var parent = CONFIG.container || document.body;
    parent.appendChild(overlay);
    els = {
      crest:    overlay.querySelector('.cit-crest'),
      portrait: overlay.querySelector('.cit-portrait'),
      tag:      overlay.querySelector('.cit-tag'),
      sub:      overlay.querySelector('.cit-sub'),
      jp:       overlay.querySelector('.cit-jp'),
      romaji:   overlay.querySelector('.cit-romaji')
    };
  }

  function applyChar(c) {
    overlay.style.setProperty('--cit-accent', c.accent);
    overlay.style.setProperty('--cit-accent-d', c.accentD || c.accent);
    els.tag.textContent = c.name;
    els.sub.textContent = c.sub || '';
    els.romaji.textContent = c.romaji || '';

    // move name, per-character span with staggered delay
    var chars = Array.from(c.move || '');
    var html = '';
    for (var i = 0; i < chars.length; i++) {
      html += '<span style="animation-delay:calc((1.45s + ' + (i * 0.07) + 's) / var(--cit-spd))">' + chars[i] + '</span>';
    }
    els.jp.innerHTML = html;

    if (c.portrait) {
      els.portrait.classList.remove('cit-empty');
      els.portrait.style.backgroundImage = 'url("' + c.portrait + '")';
      els.portrait.removeAttribute('data-ph');
    } else {
      els.portrait.classList.add('cit-empty');
      els.portrait.style.backgroundImage = '';
      els.portrait.setAttribute('data-ph', c.name + 'の立ち絵');
    }
  }

  function play(id, opts) {
    var c = CHARACTERS[id];
    if (!c) { console.warn('[Cutin] unknown character:', id); return; }
    opts = opts || {};
    var expectedParent = CONFIG.container || document.body;
    if (!overlay || overlay.parentElement !== expectedParent) {
      if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay);
      overlay = null; els = null;
      buildOverlay();
    }

    var speed = opts.speed != null ? opts.speed : CONFIG.speed;
    var shake = opts.shake != null ? opts.shake : CONFIG.shake;
    var sl    = opts.sl    != null ? opts.sl    : CONFIG.sl;
    var charge = opts.charge != null ? opts.charge : CONFIG.charge;
    var sceneEl = opts.sceneEl || CONFIG.sceneEl;

    overlay.style.setProperty('--cit-spd', speed);
    overlay.style.setProperty('--cit-shake', shake);
    overlay.style.setProperty('--cit-sl', sl);

    applyChar(c);

    // optional scene drain
    if (charge && sceneEl) {
      sceneEl.classList.remove('cit-charging');
      void sceneEl.offsetWidth;
      sceneEl.classList.add('cit-charging');
    }

    // restart animation
    overlay.classList.remove('cit-playing');
    void overlay.offsetWidth;
    overlay.classList.add('cit-playing');

    clearTimeout(timer);
    var total = TOTAL_MS / speed + 350;
    timer = setTimeout(function () {
      overlay.classList.remove('cit-playing');
      if (sceneEl) sceneEl.classList.remove('cit-charging');
      if (typeof opts.onDone === 'function') opts.onDone(id);
    }, total);

    return total;
  }

  function removeWhiteBg(url, callback) {
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        var d = ctx.getImageData(0, 0, c.width, c.height);
        var px = d.data;
        for (var i = 0; i < px.length; i += 4) {
          var r = px[i], g = px[i + 1], b = px[i + 2];
          if (r > 240 && g > 240 && b > 240) {
            var w = Math.min(r, g, b);
            px[i + 3] = Math.min(px[i + 3], Math.round((255 - w) * 16.9));
          }
        }
        ctx.putImageData(d, 0, 0);
        callback(c.toDataURL('image/png'));
      } catch (e) {
        callback(url);
      }
    };
    img.onerror = function () { callback(url); };
    img.src = url;
  }

  var Cutin = {
    characters: CHARACTERS,
    play: play,
    setPortrait: function (id, url) {
      if (!CHARACTERS[id]) return;
      CHARACTERS[id].portrait = url;
      removeWhiteBg(url, function (processed) {
        CHARACTERS[id].portrait = processed;
      });
    },
    add: function (id, def) { CHARACTERS[id] = def; },
    configure: function (cfg) { for (var k in cfg) if (cfg.hasOwnProperty(k)) CONFIG[k] = cfg[k]; },
    isPlaying: function () { return !!overlay && overlay.classList.contains('cit-playing'); }
  };

  global.Cutin = Cutin;
})(window);
