#!/usr/bin/env python3
"""Build the trip app.

Usage:
  python3 build.py trip.json --coast coast.json --out ./my-trip-app [--art ./art] [--fonts ./node_modules/@fontsource-variable/rubik/files]

Produces:
  <out>/                 PWA folder for Netlify Drop (index.html, sw.js, manifest, img/, fonts/, icons/, README.txt)
  <out>-single.html      one-file preview (images + fonts inlined) for chat previews / artifacts
  <out>.zip              zipped folder for download
"""
import argparse, base64, json, os, shutil, subprocess, sys, zipfile, hashlib, html

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'assets')

RANGES = {
    'hebrew': 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F',
    'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    'cyrillic': 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
    'arabic': 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC',
}

README = {
 'he': """{title}

העלאה לאינטרנט (פעם אחת):
1. פתחו חשבון חינמי ב-netlify.com (Sign up עם Google או מייל). חשוב: אתר שמועלה בלי חשבון נמחק אחרי כשעה.
2. היכנסו ל-app.netlify.com/drop וגררו את כל התיקייה הזו לעמוד.
3. בסיום: Site configuration ← Change site name ← בחרו שם שקשה לנחש (הקישור ציבורי וכולל מלונות ותאריכים).

התקנה באייפון:
1. פתחו את הקישור ב-Safari ← כפתור השיתוף ← "הוספה למסך הבית" ← הוסף.
2. פתחו את האפליקציה פעם אחת מהאייקון החדש כשיש Wi-Fi – אז היא נשמרת לשימוש בלי אינטרנט.
3. בדיקה: מצב טיסה ← לפתוח שוב.

התקנה באנדרואיד: לפתוח ב-Chrome ← תפריט ⋮ ← "הוספה למסך הבית" / "התקנת אפליקציה".

כפתורי גוגל מפות צריכים אינטרנט – הורידו מפות אופליין באפליקציית Google Maps לפני הטיול.
עדכון: ב-Netlify ← האתר ← Deploys ← לגרור את התיקייה המעודכנת.
""",
 'en': """{title}

Publish (once):
1. Create a free account at netlify.com (sign up with Google or email). Important: sites dropped without an account are deleted after about an hour.
2. Go to app.netlify.com/drop and drag this whole folder onto the page.
3. When done: Site configuration -> Change site name -> pick a hard-to-guess name (the link is public and contains hotels and dates).

Install on iPhone:
1. Open the link in Safari -> Share -> Add to Home Screen -> Add.
2. Open the app once from the new home-screen icon while on Wi-Fi - that is when it saves itself for offline use.
3. Test: turn on Airplane Mode and open it again.

Install on Android: open in Chrome -> menu (three dots) -> Add to Home screen / Install app.

Google Maps buttons need internet - download offline areas in the Google Maps app before the trip.
To update: Netlify -> your site -> Deploys -> drag the updated folder onto the drop area.
""",
}


def b64(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def fallback_svg(label, color):
    label = html.escape((label or '✈')[:3])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="{color}"/><stop offset="1" stop-color="#22306B"/></linearGradient></defs>
<circle cx="120" cy="120" r="120" fill="url(#g)"/><circle cx="170" cy="70" r="26" fill="#fff" opacity=".18"/>
<path d="M0 175 Q60 140 120 170 T240 160 V240 H0Z" fill="#fff" opacity=".14"/>
<text x="120" y="138" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="64" fill="#fff">{label}</text></svg>'''
    return 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode()


def prep_art(src, dst):
    """Copy/convert an art file to webp (max 480px)."""
    try:
        from PIL import Image
        im = Image.open(src)
        im.thumbnail((480, 480))
        if im.mode not in ('RGB', 'RGBA'):
            im = im.convert('RGBA')
        im.save(dst, 'WEBP', quality=82, method=6)
        return True
    except Exception as e:
        print('  ! could not convert', src, e, file=sys.stderr)
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('trip')
    ap.add_argument('--coast', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--art', default=None)
    ap.add_argument('--fonts', default=None, help='folder with rubik-*-wght-normal.woff2 files')
    a = ap.parse_args()

    trip = json.load(open(a.trip, encoding='utf-8'))
    meta = trip['meta']
    lang, direction = meta.get('lang', 'en'), meta.get('dir', 'ltr')
    out = os.path.abspath(a.out.rstrip('/'))
    for sub in ('img', 'fonts', 'icons'):
        os.makedirs(os.path.join(out, sub), exist_ok=True)

    # ---- art ----
    keys = []
    for x in trip['days'] + trip.get('dests', []):
        k = x.get('art')
        if k and k not in keys:
            keys.append(k)
    art_web, art_inline = {}, {}
    seg_color = lambda k: (meta.get('segments', {}).get(k) or {}).get('color', '#E5708F')
    for k in keys:
        found = None
        if a.art:
            for ext in ('webp', 'png', 'jpg', 'jpeg', 'svg'):
                p = os.path.join(a.art, f'{k}.{ext}')
                if os.path.exists(p):
                    found = p
                    break
        if found and found.endswith('.svg'):
            shutil.copy(found, os.path.join(out, 'img', f'{k}.svg'))
            art_web[k] = f'img/{k}.svg'
            art_inline[k] = b64(found, 'image/svg+xml')
        elif found and prep_art(found, os.path.join(out, 'img', f'{k}.webp')):
            art_web[k] = f'img/{k}.webp'
            art_inline[k] = b64(os.path.join(out, 'img', f'{k}.webp'), 'image/webp')
        else:
            owner = next((x for x in trip.get('dests', []) + trip['days'] if x.get('art') == k), {})
            fb = fallback_svg(owner.get('art_label') or (owner.get('name') or owner.get('title') or k)[:1], seg_color(owner.get('seg')))
            art_web[k] = art_inline[k] = fb
    fb_all = fallback_svg(meta.get('badge') or '✈', '#E5708F')
    art_web['_fallback'] = art_inline['_fallback'] = fb_all

    # ---- fonts ----
    font_css_web, font_css_inline, font_files = '', '', []
    fdir = a.fonts or os.path.join(os.getcwd(), 'node_modules', '@fontsource-variable', 'rubik', 'files')
    for sub, rng in RANGES.items():
        fn = f'rubik-{sub}-wght-normal.woff2'
        p = os.path.join(fdir, fn)
        if not os.path.exists(p):
            continue
        shutil.copy(p, os.path.join(out, 'fonts', fn))
        font_files.append('./fonts/' + fn)
        face = "@font-face{{font-family:'Rubik Variable';font-style:normal;font-display:swap;font-weight:300 900;src:url({src}) format('woff2');unicode-range:{rng}}}\n"
        font_css_web += face.format(src='fonts/' + fn, rng=rng)
        font_css_inline += face.format(src=b64(p, 'font/woff2'), rng=rng)
    if not font_files:
        print('  ! Rubik font files not found – the app will use system fonts. Run: npm i @fontsource-variable/rubik', file=sys.stderr)

    data = dict(trip)
    data['coast'] = json.load(open(a.coast))
    css = open(os.path.join(ASSETS, 'app.css'), encoding='utf-8').read()
    js = open(os.path.join(ASSETS, 'app.js'), encoding='utf-8').read()
    tpl = open(os.path.join(ASSETS, 'index.template.html'), encoding='utf-8').read()

    def render(inline):
        head = '' if inline else ('<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
                                  '<link rel="icon" href="icons/icon-192.png">')
        h = (tpl.replace('__LANG__', lang).replace('__DIR__', direction)
             .replace('__SHORT__', html.escape(meta.get('short_name', meta['title'][:12])))
             .replace('__TITLE__', html.escape(meta['title'])).replace('__HEADLINKS__', head)
             .replace('__CSS__', css.replace('__FONTS__', font_css_inline if inline else font_css_web))
             .replace('__JS__', js))
        h = h.replace('const DATA = __DATA__;', 'const DATA = ' + json.dumps(data, ensure_ascii=False) + ';')
        h = h.replace('const ART = __ART__;', 'const ART = ' + json.dumps(art_inline if inline else art_web) + ';')
        return h

    index = render(False)
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(index)
    single = out + '-single.html'
    open(single, 'w', encoding='utf-8').write(render(True))

    # ---- icons ----
    icon_art = None
    if a.art:
        for k in [meta.get('icon_art')] + keys:
            if k and os.path.exists(os.path.join(out, 'img', f'{k}.webp')):
                icon_art = os.path.join(out, 'img', f'{k}.webp')
                break
    try:
        subprocess.run(['node', os.path.join(HERE, 'make_icons.mjs'), icon_art or '-', os.path.join(out, 'icons'), meta.get('badge', '✈')],
                       check=True, cwd=os.getcwd())
    except Exception as e:
        print('  ! icon rendering failed (needs playwright in node_modules or globally):', e, file=sys.stderr)

    # ---- manifest, sw, headers, readme ----
    manifest = {
        'name': meta['title'], 'short_name': meta.get('short_name', meta['title'][:12]), 'description': meta.get('subtitle', ''),
        'lang': lang, 'dir': direction, 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
        'background_color': '#F3F1F6', 'theme_color': '#22306B',
        'icons': [{'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                  {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                  {'src': 'icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}],
    }
    json.dump(manifest, open(os.path.join(out, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    assets = ['./', './index.html', './manifest.webmanifest'] + ['./' + v for v in art_web.values() if v.startswith('img/')] + font_files
    assets += ['./icons/' + f for f in ('icon-192.png', 'icon-512.png', 'apple-touch-icon.png') if os.path.exists(os.path.join(out, 'icons', f))]
    version = hashlib.sha1(index.encode()).hexdigest()[:8]
    sw = open(os.path.join(ASSETS, 'sw.template.js'), encoding='utf-8').read()
    sw = sw.replace('__CACHE__', f"trip-{meta.get('id', 'app')}-{version}").replace('__ASSETS__', json.dumps(assets))
    open(os.path.join(out, 'sw.js'), 'w').write(sw)
    open(os.path.join(out, '_headers'), 'w').write('/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n')
    open(os.path.join(out, 'README.txt'), 'w', encoding='utf-8').write(README.get(lang, README['en']).format(title=meta['title']))

    # ---- zip ----
    zpath = out + '.zip'
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        base = os.path.dirname(out)
        for root, _, files in os.walk(out):
            for f in files:
                full = os.path.join(root, f)
                z.write(full, os.path.relpath(full, base))
    print(json.dumps({'folder': out, 'single_file': single, 'zip': zpath, 'cache': version,
                      'art_fallbacks': [k for k in keys if art_web[k].startswith('data:')]}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
